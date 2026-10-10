const gsap = window.gsap;

// Momentum hover cards. A fan of portrait cards that responds to the cursor with spring physics:
// the card under the pointer lifts, grows and straightens, its neighbours get pushed away and lean
// the other way, and everything settles back with a little overshoot. Each card is its own
// damped spring on x / y / rotation / scale; nothing is eased by hand.
const STIFFNESS = 150;
const DAMPING = 18;
const BASE_ROT = [-8, 4, -3, 0, 3.5, -4.5, 7]; // resting fan

export function initMoments({ root, items, reduced }) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cards = items.map((m, i) => {
    const a = document.createElement('a');
    a.className = 'moment';
    a.href = m.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.dataset.cursor = 'view';
    a.setAttribute('aria-label', `${m.alt} (opens Instagram in a new tab)`);
    a.innerHTML = `<img src="${m.img}" alt="${m.alt}" loading="lazy" decoding="async" draggable="false" />${
      m.video ? `<video muted loop playsinline preload="none" src="${m.video}" aria-hidden="true"></video>` : ''
    }<span class="moment__go small" aria-hidden="true">↗︎</span>`;
    root.append(a);
    // reels play on hover, over their cover frame
    const v = a.querySelector('video');
    if (v) {
      const on = () => { v.play().catch(() => {}); a.classList.add('is-playing'); };
      const off = () => { v.pause(); a.classList.remove('is-playing'); };
      if (fine) {
        a.addEventListener('pointerenter', on);
        a.addEventListener('pointerleave', off);
      } else {
        // touch: no hover, so play while the card is on screen
        new IntersectionObserver(([e]) => (e.isIntersecting ? on() : off()), { threshold: 0.6 }).observe(a);
      }
    }
    // spring state per property: [value, velocity]
    return { el: a, x: [0, 0], y: [0, 0], r: [BASE_ROT[i % BASE_ROT.length], 0], s: [1, 0], base: BASE_ROT[i % BASE_ROT.length], cx: 0 };
  });

  const measure = () => {
    const rb = root.getBoundingClientRect();
    cards.forEach((c) => (c.cx = rb.left + c.el.offsetLeft + c.el.offsetWidth / 2));
    root.dataset.cardw = String(cards[0].el.offsetWidth);
  };
  measure();
  if (!fine) cards.forEach((c) => (c.el.style.transform = `rotate(${c.base}deg)`)); // touch: a static fan
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', measure, { passive: true });

  let px = null; // pointer x while hovering, otherwise null
  let visible = false;
  if (fine && !reduced) {
    root.addEventListener('pointermove', (e) => (px = e.clientX));
    root.addEventListener('pointerleave', () => (px = null));
  }

  const spring = (state, target, dt) => {
    const a = (target - state[0]) * STIFFNESS - state[1] * DAMPING;
    state[1] += a * dt;
    state[0] += state[1] * dt;
  };

  // entrance: cards fan out from the centre
  if (!reduced) {
    cards.forEach((c) => gsap.set(c.el, { opacity: 0 }));
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const mid = (cards.length - 1) / 2;
        cards.forEach((c, i) => {
          const d = Math.abs(i - mid);
          c.y[0] = 90;
          c.s[0] = 0.85;
          gsap.to(c.el, { opacity: 1, duration: 0.9, delay: d * 0.12, ease: 'power2.out' });
        });
      },
      { threshold: 0.25 }
    );
    io.observe(root);
  }
  new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '100px' }).observe(root);

  let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (!visible || !fine) return;

    const w = cards[0].el.offsetWidth;
    cards.forEach((c, i) => {
      let tx = 0, ty = 0, tr = c.base, ts = 1, z = i;
      if (px !== null && !reduced) {
        const dx = (c.cx - px) / (w * 1.15); // < 0: card is left of the pointer
        const near = Math.exp(-dx * dx * 2.4); // 1 under the pointer, fading with distance
        tx = Math.sign(dx || 1) * (1 - near) * Math.exp(-Math.abs(dx) * 0.5) * 46; // pushed away
        tr = c.base * (1 - near) * 0.35 + Math.max(-1, Math.min(1, -dx)) * 11 * (1 - near * 0.9); // leans away, straightens under the pointer
        ts = 1 + 0.12 * near;
        ty = -22 * near;
        z = near > 0.55 ? 20 : i;
      }
      spring(c.x, tx, dt);
      spring(c.y, ty, dt);
      spring(c.r, tr, dt);
      spring(c.s, ts, dt);
      c.el.style.zIndex = z;
      c.el.style.transform = `translate3d(${c.x[0].toFixed(2)}px,${c.y[0].toFixed(2)}px,0) rotate(${c.r[0].toFixed(2)}deg) scale(${c.s[0].toFixed(3)})`;
    });
  });
}
