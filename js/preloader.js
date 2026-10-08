const gsap = window.gsap;

// Opening sequence (about 3s).
//   The preloader is a full-screen sheet of DARK frosted glass laid over the live hero gradient
//   (the same WebGL chrome field that sits behind the hero). Greetings scroll through it as a
//   vertical stack, each language in its own typeface, from नमस्ते to Hello. Then the logo rises in,
//   and the glass "unfrosts": the blur and tint melt away so the hero gradient comes into focus
//   underneath. The flat logo sits above the glass at the hero logo's exact position and melts
//   into the live glass logo.

// `k` evens out optical size between scripts; `font` is the face for that language.
const GREETINGS = [
  { text: 'नमस्ते', font: "'Tiro Devanagari Hindi', serif", weight: 400, k: 0.92, ls: '-0.01em' },
  { text: 'Bonjour', font: "'Instrument Serif', serif", style: 'italic', weight: 400, k: 1.18, ls: '-0.03em' },
  { text: 'Hola', font: "'Syne', sans-serif", weight: 700, k: 0.92, ls: '-0.05em' },
  { text: 'Ciao', font: "'Anton', sans-serif", weight: 400, k: 1.02, ls: '0.01em' },
  { text: 'こんにちは', font: "'Shippori Mincho', serif", weight: 500, k: 0.82, ls: '0.02em' },
  { text: 'مرحبا', font: "'Reem Kufi', sans-serif", weight: 500, k: 1.0, ls: '0' },
  { text: 'Hello', font: 'var(--f)', weight: 400, k: 1, ls: '-0.045em' },
];

const fontsReady = () => {
  if (!document.fonts?.load) return Promise.resolve();
  const loads = GREETINGS.filter((g) => !g.font.startsWith('var')).map((g) =>
    document.fonts.load(`${g.style || 'normal'} ${g.weight} 1em ${g.font.split(',')[0]}`, g.text)
  );
  // never hold the page hostage to a slow font request
  return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 600))]);
};

export function runPreloader({ lenis, onLift }) {
  return new Promise((resolve) => {
    const root = document.documentElement;
    root.classList.add('is-loading');
    window.scrollTo(0, 0);
    lenis?.stop();

    const curtain = document.createElement('div');
    curtain.className = 'preloader';
    curtain.setAttribute('role', 'status');
    curtain.setAttribute('aria-label', 'Loading');
    curtain.innerHTML = `
      <p class="preloader__tag small">Rishabh Yadav</p>
      <p class="preloader__role small">Visual &amp; motion designer</p>
      <div class="preloader__stack" aria-hidden="true">
        ${GREETINGS.map(
          (g) =>
            `<span class="g" style="font-family:${g.font};font-weight:${g.weight};font-style:${g.style || 'normal'};letter-spacing:${g.ls};font-size:${g.k}em">${g.text}</span>`
        ).join('')}
      </div>
      <p class="preloader__count small" aria-hidden="true">000</p>`;

    // flat logo: white glyph, sized so the glyph matches the glass logo's glyph in the hero
    const logo = document.createElement('img');
    logo.className = 'preloader__logo';
    logo.src = 'assets/logo.png';
    logo.alt = '';
    document.body.append(curtain, logo);

    const stack = curtain.querySelector('.preloader__stack');
    const words = [...curtain.querySelectorAll('.g')];
    const countEl = curtain.querySelector('.preloader__count');
    const labels = curtain.querySelectorAll('.preloader__tag, .preloader__role, .preloader__count');
    const N = words.length;
    const state = { cur: 0, n: 0 };
    const frost = { blur: 34, t: 1 }; // unfrost: both go to 0

    const layout = () => {
      const step = parseFloat(getComputedStyle(stack).fontSize) * 1.3;
      words.forEach((w, i) => {
        const d = i - state.cur;
        const a = Math.abs(d);
        w.style.transform = `translate3d(0,${(d * step).toFixed(1)}px,0) scale(${(1 - Math.min(a, 2) * 0.05).toFixed(3)})`;
        w.style.opacity = Math.max(0, 1 - a * 0.55).toFixed(3);
        w.style.filter = `blur(${Math.min(a * 5, 16).toFixed(1)}px)`;
      });
      countEl.textContent = String(Math.round(state.n)).padStart(3, '0');
    };
    const applyFrost = () => {
      const f = `blur(${frost.blur.toFixed(1)}px) saturate(1.1)`;
      curtain.style.backdropFilter = f;
      curtain.style.webkitBackdropFilter = f;
      curtain.style.setProperty('--t', frost.t.toFixed(3));
    };
    layout();
    gsap.set(stack, { opacity: 0 });

    const finish = () => {
      curtain.remove();
      logo.remove();
      root.classList.remove('is-loading');
      lenis?.start();
      resolve();
    };

    fontsReady().then(() => {
      layout(); // re-measure with the real fonts in place
      const tl = gsap.timeline({ onComplete: finish });
      tl.to(stack, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
        // greetings: नमस्ते > ... > Hello
        .to(state, { cur: N - 1, n: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: layout }, 0)
        // greetings dissolve upward as the logo rises in from below
        .to(stack, { opacity: 0, yPercent: -6, filter: 'blur(14px)', duration: 0.4, ease: 'power2.in' }, '-=0.05')
        .fromTo(logo, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, '<0.1')
        // unfrost: the glass melts away and the hero gradient comes into focus; the hero builds as it goes
        .add(() => onLift?.(), '+=0.15')
        .to(frost, { blur: 0, t: 0, duration: 1.15, ease: 'power2.inOut', onUpdate: applyFrost }, '<')
        .to(labels, { opacity: 0, duration: 0.3 }, '<')
        .to(logo, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, '<0.1');
    });
  });
}
