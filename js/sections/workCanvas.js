import { href, isExternal } from '../data/projects.js';

// Work page: an endless canvas of every project (after duda.works). Drag, flick or scroll in any direction;
// the grid wraps forever. Tiles bend away toward the edges as if laid on a sphere: each one is scaled,
// tilted and pulled slightly toward the centre by its distance from it. Only ~40 tiles exist at any time;
// as the canvas moves, a tile that leaves one side re-enters on the other with the project for its new cell.
// The Index button opens a plain list for when you know what you're looking for.

const wrapMod = (v, m) => ((v % m) + m) % m;

export function initWorkCanvas({ root, index, projects, reduced }) {
  if (!root) return;
  const N = projects.length;
  const world = root.querySelector('.wc__world');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // canvas thumbnails, not the full covers: ~35 tiles decoded at once at 1000px was >100 MB of image memory,
  // which made phones stutter and drop frames. 480w on phones (~3x a tile), 720w elsewhere.
  const thumbSize = window.innerWidth < 700 ? 480 : 720;
  const thumb = (cover) => `assets/thumbs/${thumbSize}/${cover.includes('/frex/') ? 'frex-cover.jpg' : cover.split('/').pop()}`;

  // cell size, grid size and the number of live tiles follow the viewport
  let CW, CH, TW, TH, cols, rows, W, H;
  let tiles = [];
  const layout = () => {
    W = root.clientWidth;
    H = root.clientHeight;
    const small = W < 700;
    TW = small ? 168 : Math.round(Math.min(340, Math.max(240, W * 0.2)));
    TH = Math.round(TW * 0.78);
    CW = TW + (small ? 26 : 56);
    CH = TH + (small ? 54 : 76); // room for the caption
    // one spare row/column beyond each edge is enough; phones get the minimum
    const spare = small ? 2 : 3;
    cols = Math.ceil(W / CW) + spare;
    rows = Math.ceil(H / CH) + spare;
    const need = cols * rows;
    while (tiles.length < need) tiles.push(makeTile());
    while (tiles.length > need) tiles.pop().el.remove();
    tiles.forEach((t) => (t.cell = null)); // force content refresh
    root.style.setProperty('--tw', TW + 'px');
  };

  function makeTile() {
    const a = document.createElement('a');
    a.className = 'wc__tile';
    a.draggable = false;
    a.dataset.cursor = 'open';
    a.innerHTML = `<span class="wc__media"><img alt="" draggable="false" decoding="async" /></span>
      <span class="wc__cap small"><span class="wc__title"></span><span class="dim wc__meta"></span></span>`;
    world.append(a);
    return { el: a, img: a.querySelector('img'), title: a.querySelector('.wc__title'), meta: a.querySelector('.wc__meta'), cell: null };
  }

  // which project sits in grid cell (cx, cy). The steps (13 across, 3 down) were picked by search to keep
  // repeats as far apart as possible: with 15 projects a copy is never nearer than ~4.5 cells, any direction
  const projectFor = (cx, cy) => projects[wrapMod(cx * 13 + cy * 3, N)];

  const fill = (t, cx, cy) => {
    const key = cx + ',' + cy;
    if (t.cell === key) return;
    t.cell = key;
    const p = projectFor(cx, cy);
    const src = thumb(p.cover);
    if (t.img.getAttribute('src') !== src) t.img.src = src;
    t.title.textContent = p.title;
    t.meta.textContent = `${p.client} · ${p.year}`;
    t.el.href = href(p);
    t.el.setAttribute('aria-label', `${p.title}, ${p.client} ${p.year}`);
    if (isExternal(p)) (t.el.target = '_blank'), (t.el.rel = 'noopener');
    else t.el.removeAttribute('target');
  };

  // ── position + sphere warp ────────────────────────────────────────────────────
  let x = 0, y = 0;          // canvas offset (px)
  let vx = 0, vy = 0;        // velocity for the flick
  let tx = 0, ty = 0;        // target offset (wheel / keys ease toward it)
  const render = () => {
    const ox = wrapMod(x, CW), oy = wrapMod(y, CH);
    const baseCX = Math.floor(-x / CW) - 1, baseCY = Math.floor(-y / CH) - 1;
    const cx0 = W / 2, cy0 = H / 2;
    const R = Math.hypot(W, H) * 0.56; // smaller = the curve starts closer to the centre
    let k = 0;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const t = tiles[k++];
        const px = (i - 1) * CW + ox + (CW - TW) / 2; // tile's flat position
        // idle float: each tile bobs a little on its own phase (by grid cell), only while drifting
        const py = (j - 1) * CH + oy + (CH - TH) / 2 + (float ? Math.sin(clock * 0.0011 + (baseCX + i) * 1.7 + (baseCY + j) * 2.3) * 4 * float : 0);
        fill(t, baseCX + i, baseCY + j);
        // distance from the centre, normalised; the warp grows with its square
        const dx = (px + TW / 2 - cx0) / R, dy = (py + TH / 2 - cy0) / R;
        const r2 = dx * dx + dy * dy;
        const s = reduced ? 1 : Math.max(0.3, 1 - r2 * 0.72);
        const pull = reduced ? 0 : r2 * 0.25; // edges drawn in toward the centre (barrel)
        const wx = px - dx * R * pull, wy = py - dy * R * pull;
        const rx = reduced ? 0 : -dy * 52, ry = reduced ? 0 : dx * 52;
        t.el.style.transform = `translate3d(${wx.toFixed(1)}px,${wy.toFixed(1)}px,0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(3)})`;
        t.el.style.opacity = Math.max(0, Math.min(1, 1.3 - r2 * 1.0)).toFixed(3);
      }
    }
  };

  // ── input: drag + flick, wheel / trackpad, keys ───────────────────────────────
  let dragging = false, moved = 0, lx = 0, ly = 0, lt = 0;
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true; moved = 0; vx = vy = 0;
    lx = e.clientX; ly = e.clientY; lt = performance.now();
    root.classList.add('is-dragging');
    root.setPointerCapture?.(e.pointerId);
  });
  root.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(), dt = Math.max(8, now - lt);
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY; lt = now;
    moved += Math.abs(dx) + Math.abs(dy);
    x += dx; y += dy; tx = x; ty = y;
    vx = vx * 0.5 + (dx * 16) / dt * 0.5;
    vy = vy * 0.5 + (dy * 16) / dt * 0.5;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    if (performance.now() - lt > 80) vx = vy = 0; // only a moving release flicks
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  // a drag never opens a project; with pointer capture the click lands on the canvas, so find the tile under it
  root.addEventListener('click', (e) => {
    e.preventDefault();
    if (moved > 6) return;
    const tile = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest('.wc__tile')).find(Boolean);
    if (!tile) return;
    if (tile.target === '_blank') window.open(tile.href, '_blank', 'noopener');
    else {
      // hand it to the page-transition handler as a normal link click
      const a = document.createElement('a');
      a.href = tile.getAttribute('href');
      a.style.display = 'none';
      document.body.append(a);
      a.click();
      a.remove();
    }
  });
  root.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      tx -= e.deltaX; ty -= e.deltaY;
    },
    { passive: false }
  );
  window.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [CW, 0], ArrowRight: [-CW, 0], ArrowUp: [0, CH], ArrowDown: [0, -CH] }[e.key];
    if (!step || index?.classList.contains('is-open')) return;
    tx += step[0]; ty += step[1];
  });

  const tick = (now) => {
    clock = now;
    // idle drift: after ~2s without input the canvas floats on its own, wandering slowly; any input stops it
    // at once, and it nearly stops while the pointer rests on a tile so that tile doesn't slide away
    const idle = !reduced && !dragging && now - lastInput > 2000 && !index?.classList.contains('is-open');
    const want = idle ? (overTile ? 0.08 : 1) : 0;
    float += (want - float) * (want > float ? 0.02 : 0.2);
    if (float < 0.001) float = 0;
    if (!dragging) {
      if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
        x += vx; y += vy; vx *= 0.94; vy *= 0.94; tx = x; ty = y; // flick, then glide to a stop
      } else {
        x += (tx - x) * 0.14; y += (ty - y) * 0.14; // wheel and keys ease in
      }
      if (float) {
        const dx = Math.cos(now * 0.00011) * 0.42 * float, dy = Math.sin(now * 0.000083 + 1.3) * 0.3 * float;
        x += dx; y += dy; tx += dx; ty += dy;
      }
    }
    // redraw only while something moves (40 transforms a frame for a still canvas would be wasted work)
    if (Math.abs(x - drawnX) > 0.05 || Math.abs(y - drawnY) > 0.05 || dirty || float) {
      render();
      drawnX = x; drawnY = y; dirty = false;
    }
    requestAnimationFrame(tick);
  };
  let drawnX = NaN, drawnY = NaN, dirty = true;
  let clock = 0, float = 0, lastInput = performance.now(), overTile = false;
  const touched = () => (lastInput = performance.now());
  ['pointerdown', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, touched, { passive: true }));
  root.addEventListener('pointermove', () => dragging && touched());
  if (fine) {
    root.addEventListener('pointerover', (e) => (overTile = !!e.target.closest('.wc__tile')));
    root.addEventListener('pointerleave', () => (overTile = false));
  }

  layout();
  // start slightly offset so the first view isn't a hard-aligned grid
  x = tx = -CW * 0.35; y = ty = -CH * 0.2;
  render();
  requestAnimationFrame(tick);
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => (layout(), (dirty = true)), 120);
  });

  // ── Index: every project as a plain list ──────────────────────────────────────
  if (index) {
    const list = index.querySelector('.wc__list');
    const sorted = [...projects].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
    list.innerHTML = sorted
      .map((p) => {
        const ext = isExternal(p);
        return `<li><a href="${href(p)}" ${ext ? 'target="_blank" rel="noopener"' : ''}>
          <span class="wc__li-title">${p.title}</span><span class="dim">${p.client}</span><span class="dim">${p.tags.join(' · ')}</span><span class="dim">${p.year}</span>
        </a></li>`;
      })
      .join('');
    const toggle = document.getElementById('index-toggle');
    const set = (open) => {
      index.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Index';
      index.inert = !open;
    };
    index.inert = true;
    toggle.addEventListener('click', () => set(!index.classList.contains('is-open')));
    window.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
  }
}
