const gsap = window.gsap;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Scroll-driven depth.
//  - The hero lockup (statement | glass logo | statement) recedes into the screen as you leave the hero.
//  - Blocks marked [data-depth] tip in from below (rotateX + push back) and tip away as they leave.
// Selected Work is deliberately not touched: its cards are WebGL planes pinned to flat DOM boxes.
export function initScrollDepth({ reduced }) {
  if (reduced) return;
  const stage = document.querySelector('.hero__stage');
  const items = [...document.querySelectorAll('[data-depth]')];

  gsap.ticker.add(() => {
    const vh = window.innerHeight;

    if (stage) {
      const p = clamp(window.scrollY / (vh * 0.85), 0, 1);
      // translateY(-50%) is the lockup's own centring, so it must stay first
      stage.style.transform = `translateY(-50%) perspective(1200px) translate3d(0,${(-p * 70).toFixed(1)}px,${(-p * 320).toFixed(1)}px) rotateX(${(p * 14).toFixed(2)}deg)`;
      stage.style.opacity = (1 - p * 0.95).toFixed(3);
    }

    for (const el of items) {
      const r = el.parentElement.getBoundingClientRect(); // the parent isn't transformed, so no feedback loop
      if (r.bottom < -200 || r.top > vh + 400) continue;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1 above ... 1 below the fold
      const enter = clamp(p, 0, 1);
      const leave = clamp(-p, 0, 1);
      el.style.transform = `perspective(1500px) translate3d(0,${(enter * 60).toFixed(1)}px,${(-enter * 160 - leave * 120).toFixed(1)}px) rotateX(${(enter * 10 - leave * 6).toFixed(2)}deg)`;
    }
  });
}
