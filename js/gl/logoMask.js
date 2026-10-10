import { Texture } from '../../vendor/ogl.mjs';

// Turns a flat logo PNG (dark glyph on transparent or white) into two textures:
//   tMask   (1024², R = sharp coverage)       -> crisp silhouette, strokes thickened (THICKEN)
//   tHeight (512²,  R/G/B = 3 blur radii)     -> smooth "thickness" the shader reads as a 3D surface
// All done on the CPU once at startup; no canvas filters so it behaves the same in every browser.

const MASK_SIZE = 1024;
const HEIGHT_SIZE = 512;
// crop = glyph bounding box x PAD. Generous, so the extruded side walls and the thickened strokes never
// hit the texture edge; GlassLogo scales its quad up by PAD / 1.22 so the glyph keeps its old size.
export const PAD = 1.62;
// stroke growth: blur radius (px at 1024) and the coverage threshold the blur is re-cut at.
// A lower threshold = a fatter, rounder stroke. Small enough that the $ and ₹ keep their counters.
const THICKEN = { r: 4, lo: 0.14, hi: 0.22 };

const loadImage = (src) =>
  new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

// composite on white so transparent and opaque-white logos both read as "dark = ink"
function coverageFrom(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) {
    const lum = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    out[i] = 1 - lum;
  }
  return out;
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(src.length);
  const dst = new Float32Array(src.length);
  const k = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc * k;
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc * k;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return dst;
}

// three box passes ≈ gaussian
const gaussian = (src, w, h, r) => boxBlur(boxBlur(boxBlur(src, w, h, r), w, h, r), w, h, r);

export async function buildLogoTextures(gl, src) {
  const img = await loadImage(src);

  // 1. find the glyph's bounding box on a white-composited copy
  const probe = document.createElement('canvas');
  probe.width = img.naturalWidth;
  probe.height = img.naturalHeight;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  pctx.fillStyle = '#fff';
  pctx.fillRect(0, 0, probe.width, probe.height);
  pctx.drawImage(img, 0, 0);
  const cov = coverageFrom(pctx, probe.width, probe.height);
  let x0 = probe.width, y0 = probe.height, x1 = 0, y1 = 0;
  for (let y = 0; y < probe.height; y++) {
    for (let x = 0; x < probe.width; x++) {
      if (cov[y * probe.width + x] > 0.4) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  // 2. square crop with breathing room so the blur never clips at the edges
  const side = Math.max(x1 - x0, y1 - y0) * PAD;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const sx = cx - side / 2;
  const sy = cy - side / 2;

  const draw = (size) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return { c, ctx };
  };

  // 3. sharp mask
  const big = draw(MASK_SIZE);
  // thicken: blur, then re-cut at a low threshold (a soft dilation with rounded ends, like poured glass)
  const raw = gaussian(coverageFrom(big.ctx, MASK_SIZE, MASK_SIZE), MASK_SIZE, MASK_SIZE, THICKEN.r);
  const sharp = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    const t = Math.min(1, Math.max(0, (raw[i] - THICKEN.lo) / (THICKEN.hi - THICKEN.lo)));
    sharp[i] = t * t * (3 - 2 * t);
  }
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = maskCanvas.height = MASK_SIZE;
  const mctx = maskCanvas.getContext('2d');
  const mimg = mctx.createImageData(MASK_SIZE, MASK_SIZE);
  for (let i = 0; i < sharp.length; i++) {
    const v = Math.max(0, Math.min(255, sharp[i] * 255));
    mimg.data[i * 4] = mimg.data[i * 4 + 1] = mimg.data[i * 4 + 2] = v;
    mimg.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(mimg, 0, 0);

  // 4. height field from the thickened shape (downsampled 2x): three blur radii packed into RGB
  const base = new Float32Array(HEIGHT_SIZE * HEIGHT_SIZE);
  for (let y = 0; y < HEIGHT_SIZE; y++)
    for (let x = 0; x < HEIGHT_SIZE; x++) {
      const i = y * 2 * MASK_SIZE + x * 2;
      base[y * HEIGHT_SIZE + x] = (sharp[i] + sharp[i + 1] + sharp[i + MASK_SIZE] + sharp[i + MASK_SIZE + 1]) * 0.25;
    }
  const b1 = gaussian(base, HEIGHT_SIZE, HEIGHT_SIZE, 2);
  const b2 = gaussian(base, HEIGHT_SIZE, HEIGHT_SIZE, 5);
  const b3 = gaussian(base, HEIGHT_SIZE, HEIGHT_SIZE, 12);
  const hCanvas = document.createElement('canvas');
  hCanvas.width = hCanvas.height = HEIGHT_SIZE;
  const hctx = hCanvas.getContext('2d');
  const himg = hctx.createImageData(HEIGHT_SIZE, HEIGHT_SIZE);
  for (let i = 0; i < base.length; i++) {
    himg.data[i * 4] = b1[i] * 255;
    himg.data[i * 4 + 1] = b2[i] * 255;
    himg.data[i * 4 + 2] = b3[i] * 255;
    himg.data[i * 4 + 3] = 255;
  }
  hctx.putImageData(himg, 0, 0);

  const opts = { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR };
  return {
    tMask: new Texture(gl, { image: maskCanvas, ...opts }),
    tHeight: new Texture(gl, { image: hCanvas, ...opts }),
    heightSize: HEIGHT_SIZE,
  };
}
