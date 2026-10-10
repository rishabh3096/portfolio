import { config } from './config.js';

const gsap = window.gsap;

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const hasFinePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ── Split text into masked words (for the rise-in reveals) ─────────────────────
export function splitWords(el) {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const words = [];
  text.split(' ').forEach((word, i, all) => {
    const mask = document.createElement('span');
    mask.className = 'wm';
    mask.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'wd';
    inner.textContent = word;
    mask.append(inner);
    el.append(mask);
    if (i < all.length - 1) el.append(' ');
    words.push(inner);
  });
  return words;
}

// words slide up out of their mask; returns the tween so it can sit in a timeline
export function riseWords(words, vars = {}) {
  if (!words.length) return gsap.timeline();
  // y:0 first, otherwise GSAP parses the CSS translateY(112%) into px and the reveal never lands
  gsap.set(words, { y: 0, yPercent: 112 });
  return gsap.to(words, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.055, ...vars });
}

// run `fn` once when `el` scrolls into view
export function onceVisible(el, fn, threshold = 0.2) {
  if (!('IntersectionObserver' in window)) return fn();
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      fn();
    },
    { threshold }
  );
  io.observe(el);
}

// ── Scroll reveals for any [data-reveal] ───────────────────────────────────────
export function initReveals(reduced) {
  const els = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => gsap.set(el, { opacity: 1, y: 0 }));
    return;
  }
  // headings marked data-reveal="3d" tip up from below instead of just fading
  els.forEach((el) => {
    if (el.dataset.reveal === '3d') gsap.set(el, { transformPerspective: 900, rotateX: -42, y: 36, opacity: 0, transformOrigin: '50% 100%' });
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const three = e.target.dataset.reveal === '3d';
        gsap.to(e.target, { opacity: 1, y: 0, rotateX: 0, duration: three ? 1.5 : 1.2, ease: 'expo.out' });
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

// ── London clock ───────────────────────────────────────────────────────────────
export function initClock() {
  const els = document.querySelectorAll('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const tick = () => els.forEach((el) => (el.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 10000);
}

// ── Click to copy ──────────────────────────────────────────────────────────────
export function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const hint = btn.querySelector('.copy__hint');
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = value;
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      if (hint) hint.textContent = 'Copied ✓';
      setTimeout(() => {
        if (hint) hint.textContent = 'Click to copy';
      }, 1800);
    });
  });
}

// ── Custom cursor (fine pointers only): "RY" disc that becomes "View" over work ─
export function initCursor() {
  if (!hasFinePointer()) return;
  const c = document.createElement('div');
  c.className = 'cursor';
  c.setAttribute('aria-hidden', 'true');
  c.textContent = 'RY';
  document.body.append(c);
  document.documentElement.classList.add('has-cursor');

  const x = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    c.classList.add('is-on');
    x(e.clientX);
    y(e.clientY);
  });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const kind = e.target.closest('[data-cursor]')?.dataset.cursor;
    // over plain buttons and links the disc steps aside and the normal pointer takes over
    c.classList.toggle('is-hidden', !kind && !!e.target.closest('a, button'));
    c.classList.toggle('is-view', kind === 'view');
    c.classList.toggle('is-drag', kind === 'drag' || kind === 'play' || kind === 'open');
    c.textContent = kind ? kind[0].toUpperCase() + kind.slice(1) : 'RY';
  });
  window.addEventListener('pointerdown', () => c.classList.add('is-down'));
  window.addEventListener('pointerup', () => c.classList.remove('is-down'));
}

// ── Showreel timecode (placeholder flourish) ───────────────────────────────────
export function initTimecode(el) {
  if (!el) return;
  const fps = 24;
  const pad = (n) => String(n).padStart(2, '0');
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);
  const t0 = performance.now();
  gsap.ticker.add(() => {
    if (!visible) return;
    const f = Math.floor(((performance.now() - t0) / 1000) * fps);
    const s = Math.floor(f / fps);
    el.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % fps)}`;
  });
}

// ── Scroll-scrubbed text reveal ────────────────────────────────────────────────
// Every word starts dim and brightens in sequence as the block scrolls through the viewport.
export function initTextReveal(root, { dim = 0.16, soft = 5, reduced = false } = {}) {
  const words = [];
  root.querySelectorAll('p').forEach((p) => {
    const text = p.textContent.trim().replace(/\s+/g, ' ');
    p.setAttribute('aria-label', text);
    p.textContent = '';
    text.split(' ').forEach((w, i, all) => {
      const s = document.createElement('span');
      s.className = 'rw';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      p.append(s);
      if (i < all.length - 1) p.append(' ');
      words.push(s);
    });
  });
  if (reduced) return words.forEach((w) => (w.style.opacity = 1));

  const N = words.length;
  const last = new Array(N).fill(-1);
  words.forEach((w) => (w.style.opacity = dim));
  let cur = 0;
  gsap.ticker.add(() => {
    const r = root.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return;
    // starts when the block's top reaches 80% of the viewport, ends when its bottom reaches 55%
    const raw = (vh * 0.8 - r.top) / (r.height + vh * 0.25);
    const p = Math.min(1, Math.max(0, raw));
    cur += (p - cur) * 0.12;
    const total = cur * (N + soft);
    for (let i = 0; i < N; i++) {
      const t = Math.min(1, Math.max(0, (total - i) / soft));
      const o = Math.round((dim + (1 - dim) * t) * 100) / 100;
      if (o !== last[i]) {
        last[i] = o;
        words[i].style.opacity = o;
      }
    }
  });
}
