// Dev-only: open the site with ?tour to auto-scroll the whole home page after the preloader finishes,
// pausing on each section. Used for screen recordings; it does nothing on a normal visit.
const gsap = window.gsap;
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const hop = (to, duration) =>
  new Promise((resolve) => {
    const proxy = { y: window.scrollY };
    gsap.to(proxy, { y: to, duration, ease: 'power2.inOut', onUpdate: () => window.scrollTo(0, proxy.y), onComplete: resolve });
  });

(async function run() {
  // wait for the preloader to finish
  while (document.documentElement.classList.contains('is-loading') || document.querySelector('.preloader')) await wait(0.2);
  await wait(4); // let the hero settle and be seen

  const top = (el, off = 60) => el.getBoundingClientRect().top + window.scrollY - off;
  const q = (s) => document.querySelector(s);
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const work = q('#work');
  const grid = q('#work-grid');

  const stops = [
    { y: () => top(q('.intro'), 120), pause: 3.2 },
    { y: () => top(work, 40), pause: 1.4 },
    { y: () => top(grid, 20) + grid.offsetHeight * 0.38, pause: 1.1 },
    { y: () => top(grid, 20) + grid.offsetHeight * 0.72, pause: 1.1 },
    { y: () => top(q('#reels'), 40), pause: 1.8 },
    { y: () => top(q('#more'), 40), pause: 4.5 },
    { y: () => top(q('#feed'), 40), pause: 2.6 },
    { y: () => top(q('#dj'), 40), pause: 2.2 },
    { y: () => top(q('.contact'), 0) + (q('.contact').offsetHeight - window.innerHeight) * 0.5, pause: 1.6 },
    { y: () => maxY(), pause: 4 },
  ];

  for (const s of stops) {
    const y = clamp(s.y(), 0, maxY());
    const dist = Math.abs(y - window.scrollY);
    await hop(y, clamp(dist / 650, 1.2, 3.4));
    await wait(s.pause);
  }
  document.title = 'tour-done';
})();
