const gsap = window.gsap;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Immersive footer.
//  - Project covers travel toward the camera through 3D space, looping; scrolling pushes them faster.
//  - The "camera" leans toward the cursor (rotation + a little translation, smoothed).
//  - The wrapper is tall and the stage is pinned, so scroll progress through it drives the reveal:
//    "Let's talk" rises letter by letter, then the glass panel comes up beneath it.
// Positions are in % of the stage; depth runs from far (negative z) to just past the camera.
const SLOTS = [
  [-38, -24, 19], [38, -28, 16], [-44, 18, 17], [43, 22, 19], [-22, 40, 15], [24, -40, 15], [8, 44, 13],
  [-28, -4, 13], [30, 6, 15], [-12, -40, 13], [16, 34, 16], [-47, -36, 13], [47, -2, 13], [-4, 32, 12],
]; // % of the stage + width in vw; spread over both sides, the middle left to the headline
const DEPTH = 2600; // length of the loop
const NEAR = 500; // how far past the camera before an image fades out
const FAR = -2000;

export function initFooter({ root, covers, reduced }) {
  const stage = root.querySelector('.contact__stage');
  const space = root.querySelector('.contact__space');
  const cta = root.querySelector('.contact__cta');
  const kicker = root.querySelector('.contact__kicker');
  const lede = root.querySelector('.contact__lede');
  const panel = root.querySelector('.fglass');
  const legal = root.querySelector('.contact__legal');
  if (!stage) return;

  // split "Let's talk" into letters for the reveal + hover wave
  const text = cta.textContent;
  cta.textContent = '';
  const letters = [...text].map((ch) => {
    const s = document.createElement('span');
    s.className = 'cl';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch === ' ' ? ' ' : ch;
    cta.append(s);
    return s;
  });

  // phones: a lighter gallery. 8 cards instead of 14, cycling through a third of the photos as tiny
  // 240px copies (assets/manipulations/sm, ~11 KB each), drawn larger since the screen is narrow.
  const phone = window.matchMedia('(max-width: 900px)').matches;
  if (phone) covers = covers.filter((_, i) => i % 3 === 0).map((c) => c.replace('/all/', '/sm/'));
  const slots = phone ? SLOTS.slice(0, 8).map(([x, y, w]) => [x * 0.72, y * 1.1, w * 2.2]) : SLOTS;
  const items = slots.slice(0, Math.min(slots.length, covers.length)).map(([x, y, w], i) => {
    const img = document.createElement('img');
    img.src = covers[i % covers.length];
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.style.width = `${w}vw`;
    space.append(img);
    return { el: img, i, loop: 0, x, y, w, phase: (i / slots.length) * DEPTH, drift: (i % 2 ? 1 : -1) * (0.8 + (i % 3) * 0.5) };
  });

  let mx = 0, my = 0, cx = 0, cy = 0; // pointer target / smoothed camera
  let visible = false;
  let travel = 0; // accumulated travel, so scroll speed adds on top of the idle drift
  let lastY = window.scrollY;
  let last = performance.now();

  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }
  new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '200px' }).observe(root);

  // hover: letters ripple away from the cursor
  if (!reduced) {
    cta.addEventListener('pointermove', (e) => {
      letters.forEach((l) => {
        const r = l.getBoundingClientRect();
        const d = (e.clientX - (r.left + r.width / 2)) / (r.width * 2.4);
        const k = Math.exp(-d * d);
        l.style.transform = `translateY(${(-k * 10).toFixed(1)}px) scale(${(1 + k * 0.05).toFixed(3)})`;
      });
    });
    cta.addEventListener('pointerleave', () => letters.forEach((l) => (l.style.transform = '')));
  }

  const render = (p, dt) => {
    // ── scroll-driven reveal ──────────────────────────────────────────────────
    const a = smooth(0.0, 0.45, p); // headline
    letters.forEach((l, i) => {
      const t = clamp(a * 1.6 - i * 0.07, 0, 1);
      l.style.opacity = t.toFixed(3);
      l.style.filter = t < 1 ? `blur(${((1 - t) * 14).toFixed(1)}px)` : 'none';
      l.style.translate = `0 ${((1 - t) * 38).toFixed(1)}%`;
    });
    const b = smooth(0.08, 0.4, p);
    kicker.style.opacity = b.toFixed(3);
    lede.style.opacity = b.toFixed(3);
    lede.style.transform = `translateY(${((1 - b) * 16).toFixed(1)}px)`;
    const c = smooth(0.3, 0.7, p);
    panel.style.opacity = c.toFixed(3);
    panel.style.transform = `translateY(${((1 - c) * 70).toFixed(1)}px)`;
    const d = smooth(0.55, 0.9, p);
    legal.style.opacity = d.toFixed(3);

    // ── the 3D gallery ───────────────────────────────────────────────────────
    const vh = window.innerHeight;
    const sy = window.scrollY;
    const scrollSpeed = Math.min(2.2, Math.abs(sy - lastY) / Math.max(dt * 1000, 1));
    lastY = sy;
    if (!reduced) travel += dt * (150 + scrollSpeed * 900);
    cx += (mx - cx) * 0.05;
    cy += (my - cy) * 0.05;
    space.style.transform = `rotateY(${(cx * 7).toFixed(2)}deg) rotateX(${(-cy * 5).toFixed(2)}deg) translate3d(${(-cx * 34).toFixed(1)}px,${(-cy * 22).toFixed(1)}px,0)`;

    items.forEach((it) => {
      const run = it.phase + travel + p * 900;
      const zRaw = reduced ? -900 : (run % DEPTH) + FAR;
      // each pass through the tunnel shows the next photo; the swap happens at the far end, where it is invisible
      const loop = reduced ? 0 : Math.floor(run / DEPTH);
      if (loop !== it.loop && covers.length > items.length) {
        it.loop = loop;
        it.el.src = covers[(it.i + loop * items.length) % covers.length];
      }
      const near = smooth(0, NEAR, zRaw); // 0 well in front of the camera, 1 just behind it
      const far = 1 - smooth(FAR, FAR + 500, zRaw); // 0 once it has emerged, 1 at the far end
      const o = clamp(1 - near, 0, 1) * (1 - far) * 0.62 * smooth(0.0, 0.3, p + 0.15);
      const sway = Math.sin(performance.now() / 2600 + it.x) * 10;
      it.el.style.opacity = o.toFixed(3);
      it.el.style.transform = `translate3d(${((50 + it.x) * (window.innerWidth / 100)).toFixed(1)}px,${((50 + it.y) * (vh / 100) + sway).toFixed(1)}px,${zRaw.toFixed(0)}px) translate(-50%,-50%) rotateZ(${(it.drift * 2).toFixed(2)}deg)`;
    });
  };

  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    const r = root.getBoundingClientRect();
    const vh = window.innerHeight;
    const run = Math.max(1, r.height - vh);
    // progress starts when the stage first peeks in at the bottom of the screen (not only once it is
    // pinned), so there is never a screenful of empty dark; it completes just before the end of the page
    const p = clamp((vh - r.top) / (vh + run * 0.85), 0, 1);
    render(reduced ? 1 : p, dt);
  });
}
