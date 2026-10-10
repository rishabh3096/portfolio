import { href, isExternal } from './data/projects.js';

const gsap = window.gsap;

// 3D cylinder of cards. The cards stand on a ring (one every 360/N degrees); the ring turns so one
// card faces you. It turns by itself every few seconds (pausing while you hover, drag or focus it),
// you can drag it with inertia, use the arrows / dots / arrow keys, or scroll sideways.
//
// All motion is driven by one number, `offset` = which card is at the front (as a float).

const AUTO_MS = 4200; // time between automatic turns
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function initCarousel({ root, projects, archiveUrl, reduced }) {
  const track = root.querySelector('.carousel__track');
  const ui = root.parentElement;
  const nowEl = ui.querySelector('[data-carousel-now]');
  const totalEl = ui.querySelector('.ccount .dim');
  const dotsEl = ui.querySelector('[data-carousel-dots]');
  const prev = ui.querySelector('[data-carousel-prev]');
  const next = ui.querySelector('[data-carousel-next]');
  const pad2 = (n) => String(n).padStart(2, '0');

  // ── cards (last one is a "full archive" call to action) ───────────────────────
  const data = [
    ...projects.map((p) => ({
      title: p.title,
      client: p.client,
      tags: p.tags.join(' · '),
      year: p.year,
      cover: p.cover,
      href: href(p),
      ext: isExternal(p),
      quiet: !!p.quiet,
    })),
    ...(archiveUrl ? [{ title: 'Full archive', client: 'Behance', tags: 'Everything else', year: '', href: archiveUrl, ext: true, cta: true }] : []),
  ];
  const N = data.length;

  const tiles = data.map((d) => {
    const a = document.createElement('a');
    a.className = `tile${d.cta ? ' tile--cta' : ''}`;
    a.href = d.href;
    a.draggable = false;
    if (d.ext) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.setAttribute('aria-label', `${d.title}${d.ext ? ' (opens in a new tab)' : ''}`);
    a.innerHTML = `
      <div class="tile__media">${
        d.cta ? '<span class="t-lg">Full archive&nbsp;<svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg></span>' : `<img src="${d.cover}" alt="" draggable="false" loading="lazy" decoding="async" />`
      }</div>
      <div class="tile__body">
        <div class="tile__top small">
          ${d.year ? `<span class="tile__chip">${d.year}</span>` : '<span></span>'}
          <span class="dim">${d.client}</span>
        </div>
        <h3 class="tile__title">${d.title}</h3>
        <p class="small dim">${d.tags}</p>
        <span class="tile__cta small">${d.cta ? 'Open Behance' : d.ext ? 'View project' : 'Read case study'} <span aria-hidden="true"><svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg></span></span>
      </div>`;
    track.append(a);
    return { el: a, quiet: d.quiet };
  });

  // ── state ─────────────────────────────────────────────────────────────────────
  let offset = 0;
  let target = 0;
  let dragging = false;
  let hovering = false;
  let moved = 0;
  let lastX = 0;
  let lastT = 0;
  let vel = 0;
  let S = 300; // drag distance (px) that turns the ring by one card
  let R = 500; // ring radius
  let visible = false;
  let shownIndex = -1;
  let nudge = 0;
  let nextAuto = performance.now() + AUTO_MS;
  const po = { x: 50, y: 40, tx: 50, ty: 40 }; // perspective origin follows the cursor

  const markInput = () => (nextAuto = performance.now() + AUTO_MS + 1200);
  const wrap = (p) => ((((p + N / 2) % N) + N) % N) - N / 2;

  // dots
  const dots = data.map((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cdot';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Go to ${d.title}`);
    b.addEventListener('click', () => {
      markInput();
      target = Math.round(offset + wrap(i - offset));
    });
    dotsEl?.append(b);
    return b;
  });
  if (totalEl) totalEl.textContent = `/ ${pad2(N)}`;

  const measure = () => {
    const w = tiles[0].el.offsetWidth;
    // radius at which N flat cards of width w just touch edge to edge, plus a little air
    R = (w / 2 / Math.tan(Math.PI / N)) * 1.16;
    S = w * 0.75;
    track.style.height = `${tiles[0].el.offsetHeight}px`;
  };

  function render() {
    const rad = Math.PI / 180;
    const time = performance.now() / 1000;
    for (let i = 0; i < N; i++) {
      const p = wrap(i - offset);
      const angle = p * (360 / N);
      const f = Math.cos(angle * rad); // 1 = facing you, 0 = side on, <0 = behind
      const bob = reduced ? 0 : Math.sin(time * 0.9 + i * 1.3) * 3;
      const el = tiles[i].el;
      el.style.transform = `translate3d(0,${bob.toFixed(2)}px,${(-R).toFixed(1)}px) rotateY(${angle.toFixed(2)}deg) translateZ(${R.toFixed(1)}px)`;
      const vis = smooth(0.02, 0.6, f);
      el.style.opacity = (vis * (tiles[i].quiet ? 0.75 : 1)).toFixed(3);
      const blur = Math.max(0, 0.78 - f) * 7;
      el.style.filter = `brightness(${(0.5 + 0.5 * f).toFixed(3)})${blur > 0.1 ? ` blur(${blur.toFixed(2)}px)` : ''}`;
      el.style.zIndex = String(Math.round(100 + f * 100));
      el.style.pointerEvents = f < 0.35 ? 'none' : 'auto';
    }

    const idx = ((Math.round(offset) % N) + N) % N;
    if (idx !== shownIndex) {
      const first = shownIndex === -1;
      shownIndex = idx;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      if (nowEl) {
        nowEl.textContent = pad2(idx + 1);
        if (!first && !reduced) gsap.fromTo(nowEl, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
      }
    }
  }

  function tick() {
    if (!visible) return;
    const now = performance.now();

    // auto-turn: only when nobody is interacting
    if (!reduced && !dragging && !hovering && now > nextAuto) {
      target = Math.round(target) + 1;
      nextAuto = now + AUTO_MS;
    }
    if (!dragging) {
      const d = target + nudge - offset;
      if (Math.abs(d) > 0.0004) offset += d * (reduced ? 1 : 0.06);
    }
    po.x += (po.tx - po.x) * 0.06;
    po.y += (po.ty - po.y) * 0.06;
    root.style.perspectiveOrigin = `${po.x.toFixed(2)}% ${po.y.toFixed(2)}%`;
    render();
  }

  // ── input ─────────────────────────────────────────────────────────────────────
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    vel = 0;
    lastX = e.clientX;
    lastT = performance.now();
    target = offset;
    markInput();
    root.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dt = Math.max(8, now - lastT);
    lastX = e.clientX;
    lastT = now;
    moved += Math.abs(dx);
    offset -= dx / S;
    vel = vel * 0.6 + ((-dx / S) * (16 / dt)) * 0.4;
    target = offset;
    markInput();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    const stale = performance.now() - lastT > 90; // a flick only counts if still moving at release
    target = Math.round(offset + (stale ? 0 : clamp(vel * 7, -2, 2)));
    markInput();
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  // a drag must not open a link; a click opens whichever card you clicked, anywhere on it, wherever it is
  // on the ring. Neighbouring cards overlap the edges of the one in front, so the click goes to the
  // frontmost card under the pointer rather than whichever element the browser happened to hit.
  let rerouting = false;
  root.addEventListener(
    'click',
    (e) => {
      if (rerouting) return;
      if (moved > 6) return e.preventDefault();
      const under = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest('.tile')).filter(Boolean);
      if (!under.length) return;
      const front = under
        .map((el) => ({ el, d: Math.abs(wrap(tiles.findIndex((t) => t.el === el) - offset)) }))
        .sort((a, b) => a.d - b.d)[0].el;
      if (front === e.target.closest('.tile')) return; // the browser already hit the right card
      e.preventDefault();
      e.stopPropagation();
      rerouting = true;
      front.click(); // a real click on the right card, so page transitions and new tabs still apply
      rerouting = false;
    },
    true
  );

  // trackpad sideways scroll
  let wheelTimer;
  root.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll belongs to the page
      e.preventDefault();
      offset += e.deltaX / (S * 1.4);
      target = offset;
      markInput();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => (target = Math.round(offset)), 140);
    },
    { passive: false }
  );

  const go = (n) => {
    target = Math.round(target) + n;
    markInput();
  };
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') (go(1), e.preventDefault());
    if (e.key === 'ArrowLeft') (go(-1), e.preventDefault());
  });
  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));

  // pause while hovered or focused; the whole arc leans a few percent toward the cursor
  root.addEventListener('pointerenter', () => (hovering = true));
  root.addEventListener('pointerleave', () => {
    hovering = false;
    po.tx = 50;
    po.ty = 40;
    markInput();
  });
  root.addEventListener('focusin', () => (hovering = true));
  root.addEventListener('focusout', () => (hovering = false));
  root.addEventListener('pointermove', (e) => {
    if (reduced) return;
    const r = root.getBoundingClientRect();
    po.tx = 50 + ((e.clientX - r.left) / r.width - 0.5) * 12;
    po.ty = 40 + ((e.clientY - r.top) / r.height - 0.5) * 10;
  });

  // arrows: hovering leans the ring toward that side; the button itself is magnetic
  [[prev, -1], [next, 1]].forEach(([btn, dir]) => {
    if (!btn || reduced) return;
    btn.addEventListener('pointerenter', () => (nudge = dir * 0.14));
    btn.addEventListener('pointerleave', () => {
      nudge = 0;
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - (r.left + r.width / 2)) * 0.28, y: (e.clientY - (r.top + r.height / 2)) * 0.28, duration: 0.35, ease: 'power3.out' });
    });
    btn.addEventListener('pointerdown', () => gsap.fromTo(btn, { scale: 0.88 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' }));
  });

  // ── lifecycle ────────────────────────────────────────────────────────────────
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible) nextAuto = performance.now() + AUTO_MS;
    },
    { rootMargin: '200px' }
  ).observe(root);
  window.addEventListener('resize', measure);
  (document.fonts?.ready || Promise.resolve()).then(measure);
  measure();
  gsap.ticker.add(tick);

  // entrance: the ring spins into place
  if (!reduced) {
    offset = -2.4;
    target = 0;
  }
  render();
}
