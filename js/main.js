import Lenis from '../vendor/lenis.mjs';
import { config } from './config.js';
import { projects, featured, href, isExternal } from './data/projects.js';
import { experienceGroups } from './data/experience.js';
import { initExperience } from './sections/experience.js';
import { mountChrome } from './chrome.js';
import { Stage, webglAvailable } from './gl/stage.js';
import { FlowBackground, HeroBlit } from './gl/heroBackground.js';
import { GlassLogo } from './gl/glassLogo.js';
import { buildLogoTextures } from './gl/logoMask.js';
import { CardPlane } from './gl/cardPlane.js';
import { initCarousel } from './carousel.js';
import { initReels, initStrip } from './sections/reels.js';
import { initCasePage } from './sections/casePage.js';
import { initMoments } from './sections/moments.js';
import { initDJ } from './sections/dj.js';
import { initFooter } from './sections/footer.js';
import { reels, films, ugc, moments, dj, manipulations } from './data/social.js';
import { runPreloader } from './preloader.js';
import { initScrollDepth } from './depth.js';
import { initTransitions } from './transitions.js';
import {
  prefersReducedMotion,
  splitWords,
  riseWords,
  onceVisible,
  initReveals,
  initClock,
  initCopy,
  initCursor,
  initTextReveal,
  initTimecode,
} from './ui.js';

const gsap = window.gsap;
const page = document.body.dataset.page || 'home';
const reduced = prefersReducedMotion();
// phones and tablets: native touch scrolling runs ahead of requestAnimationFrame, so anything drawn in WebGL
// at a DOM element's position drifts while you scroll. Those devices get plain images instead.
const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const arrivedByTransition = document.documentElement.classList.contains('pt-in'); // came from another page of this site
document.documentElement.classList.add('js');
if (touch) document.documentElement.classList.add('touch'); // css: lighter effects on phones/tablets
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

mountChrome(page);

// ── Smooth scroll ──────────────────────────────────────────────────────────────
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// in-page anchors (nav links, back to top, CTAs)
const scrollToTarget = (hash) => {
  // the footer is a tall pinned stage: "#contact" means the end of the page, where it is fully revealed
  const target = hash === '#top' ? 0 : hash === '#contact' ? document.documentElement.scrollHeight - window.innerHeight : document.querySelector(hash);
  if (target === null) return false;
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
  return true;
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const url = new URL(a.href, location.href);
  const samePage = url.pathname === location.pathname && url.hash;
  if (samePage && scrollToTarget(url.hash)) e.preventDefault();
});

// ── Pages ──────────────────────────────────────────────────────────────────────
// Touch devices: only the home hero uses WebGL, on a canvas anchored to the top of the page (it scrolls
// natively with the hero, so it can't lag behind touch scrolling). Work cards there are plain images, and
// About / Frex use the CSS backdrop (.no-gl). Desktop: one fixed canvas for everything.
const stage =
  webglAvailable() && (touch ? page === 'home' : page === 'home' || page === 'about' || page === 'case')
    ? new Stage({ anchored: touch })
    : null;
if (!stage) document.documentElement.classList.add('no-gl');

const brandTextEl = document.querySelector('.brandmark__text');
const brandWords = brandTextEl ? splitWords(brandTextEl) : [];
const fadeEls = [...document.querySelectorAll('[data-fade]')];

if (page === 'home') initHome();
if (page === 'about' || page === 'case') initAbout(); // case studies share the About backdrop
if (page === 'case') initCasePage();

initFooter({ root: document.querySelector('.contact'), covers: manipulations, reduced });
initReveals(reduced);
initTransitions({ reduced });
if (page === 'home') initScrollDepth({ reduced });
initClock();
initCopy();
initCursor();

// one render loop for GL, after Lenis has updated scroll
if (stage) gsap.ticker.add((t) => stage.render(t));

// home: the name in the nav gives way to the monogram once you leave the first screen
if (page === 'home') {
  const header = document.querySelector('.header');
  const swap = () => header.classList.toggle('is-logo', window.scrollY > window.innerHeight * 0.55);
  window.addEventListener('scroll', swap, { passive: true });
  swap();
}

// land on a hash from another page
if (location.hash) setTimeout(() => scrollToTarget(location.hash), 400);

// ───────────────────────────────────────────────────────────────────────────────
function initHome() {
  const hero = document.querySelector('.hero');
  const logoEl = document.querySelector('.hero__logo');
  const lineWords = [...document.querySelectorAll('.hero__line')].map((el) => splitWords(el));
  const metaEls = [...document.querySelectorAll('.hero [data-fade]')];

  // about statement: words brighten as you scroll (first person, see index.html)
  initTextReveal(document.querySelector('.intro__text'), { reduced });

  // opening sequence (greetings > logo > curtain lift). Everything in the hero waits for the lift.
  let lifted;
  const liftPromise = new Promise((res) => (lifted = res));
  let showPreloader = config.preloader?.enabled && !reduced && !location.hash && !arrivedByTransition;
  try {
    if (showPreloader && config.preloader.oncePerSession) {
      if (sessionStorage.getItem('rs-pre')) showPreloader = false;
      else sessionStorage.setItem('rs-pre', '1');
    }
  } catch {}
  if (showPreloader) runPreloader({ lenis, onLift: lifted });
  else lifted();

  // WebGL: chrome background (offscreen) -> blit, plus the glass logo that refracts it
  let flow = null;
  if (stage) {
    flow = stage.add(new FlowBackground(stage, hero, { reduced }));
    if (showPreloader) flow.intro.value = 1; // the glass sits on the finished gradient and unfrosts onto it
    stage.add(new HeroBlit(stage, hero));
    Promise.all([buildLogoTextures(stage.gl, 'assets/logo.png'), liftPromise])
      .then(([tex]) => {
        const glass = stage.add(new GlassLogo(stage, logoEl, tex, { reduced }));
        logoEl.classList.add('is-gl');
        if (!reduced) {
          gsap.fromTo(logoEl, { scale: 0.9 }, { scale: 1, duration: 2.6, ease: 'expo.out', delay: 0.1 });
          gsap.to(glass.form, { value: 1, duration: 2.6, ease: 'power3.out', delay: 0.1 });
        }
      })
      .catch((err) => console.warn('Logo texture failed, showing flat logo', err));
  }

  // hero intro, in the Avec Anni spirit: wordmark + statements rise out of masks, UI fades in
  if (!reduced) {
    liftPromise.then(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: showPreloader ? 0.05 : 0.1 });
      tl.add(riseWords(brandWords, { duration: 1.1 }), 0);
      lineWords.forEach((w) => tl.add(riseWords(w, { stagger: 0.07, duration: 1.4 }), 0.18));
      tl.fromTo(fadeEls, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.3);
      tl.fromTo(metaEls.filter((e) => e.closest('.hero')), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.9);
      if (flow && !showPreloader) tl.to(flow.intro, { value: 1, duration: 4.5, ease: 'power2.out' }, 0);
    });
  } else {
    gsap.set([...fadeEls], { opacity: 1 });
  }

  // reel
  initReel();
  initTimecode(document.querySelector('[data-timecode]'));

  // selected work: uniform grid
  const grid = document.getElementById('work-grid');
  featured.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'card';

    if (p.placeholder) {
      // a project whose page is still to be built: same footprint as the others, no link, no cover
      card.classList.add('card--soon');
      card.innerHTML = `
        <div class="card__link">
          <div class="card__media card__media--soon" role="img" aria-label="${p.title}, case study coming soon">
            <span class="card__soon-name">${p.title}</span>
            <span class="small dim">Case study coming soon</span>
          </div>
          <div class="card__meta">
            <h3 class="card__title">${p.title}</h3>
            <p class="card__sub small">${p.client} · ${p.tags.join(' · ')} · ${p.year}</p>
          </div>
        </div>`;
      grid.append(card);
      if (!reduced) {
        gsap.set(card, { opacity: 0, y: 24 });
        onceVisible(card, () => gsap.to(card, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }), 0.18);
      }
      return;
    }

    const ext = isExternal(p);
    card.innerHTML = `
      <a class="card__link" href="${href(p)}" ${ext ? 'target="_blank" rel="noopener"' : ''} aria-label="${p.title} — ${p.client}${ext ? ' (opens Behance)' : ''}">
        <div class="card__media" data-cursor="view">
          <img src="${p.cover}" alt="${p.title} cover" loading="lazy" decoding="async" />
        </div>
        <div class="card__meta">
          <h3 class="card__title">${p.title}</h3>
          <p class="card__sub small">${p.client} · ${p.tags.join(' · ')} · ${p.year}</p>
        </div>
      </a>`;
    grid.append(card);

    const media = card.querySelector('.card__media');
    const meta = card.querySelector('.card__meta');
    if (stage && !touch) {
      const plane = stage.add(new CardPlane(stage, media, p.cover));
      if (reduced) plane.reveal.value = 1;
      else onceVisible(media, () => gsap.to(plane.reveal, { value: 1, duration: 1.6, ease: 'expo.out' }), 0.18);
    }
    if (!reduced) {
      gsap.set(meta, { opacity: 0, y: 16 });
      onceVisible(media, () => gsap.to(meta, { opacity: 1, y: 0, duration: 1.1, delay: 0.25, ease: 'expo.out' }), 0.18);
    }
  });

  // reels (placeholders), feed cards, DJ set
  initReels({ root: document.getElementById('reels-grid'), reels, reduced });
  initStrip(document.getElementById('reels-grid'), { reduced });
  initReels({ root: document.getElementById('films-grid'), reels: films, reduced });
  initStrip(document.getElementById('films-grid'), { reduced });
  initReels({ root: document.getElementById('ugc-grid'), reels: ugc, reduced });
  initMoments({ root: document.getElementById('moments-row'), items: moments, reduced });
  initDJ({ root: document.getElementById('dj-root'), video: dj, reduced });

  // the loop: every project, in a 3D ring
  initCarousel({
    root: document.getElementById('carousel'),
    projects, // every project on Behance, newest first
    reduced,
  });
}

function initReel() {
  const frame = document.querySelector('.reel__frame');
  if (!config.reel || !frame) return; // placeholder stays until config.reel is set
  const ph = frame.querySelector('.reel__ph');
  const video = document.createElement('video');
  video.src = config.reel;
  if (config.reelPoster) video.poster = config.reelPoster;
  video.playsInline = true;
  video.preload = 'metadata';
  video.controls = true;
  frame.append(video);
  ph?.remove();
  frame.querySelectorAll('.reel__tc, .reel__rec').forEach((n) => n.remove());
}

function initAbout() {
  // the preloader's gradient, fixed behind the whole page, dimmed by a dark frosted veil (css .page-veil)
  const bg = document.querySelector('.page-bg');
  if (stage && bg) {
    const flow = stage.add(new FlowBackground(stage, bg, { reduced }));
    flow.intro.value = 1;
    stage.add(new HeroBlit(stage, bg));
  }

  // glass buttons under the bio
  const links = document.getElementById('about-links');
  if (links) {
    const items = [
      config.resume && { label: 'Resume', href: config.resume, file: `Resume - ${config.name}.pdf`, arrow: '↓' },
      config.portfolio && { label: 'Portfolio PDF', href: config.portfolio, file: `Portfolio - ${config.name}.pdf`, arrow: '↓' },
      { label: 'Behance', href: config.links.behance, arrow: '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg>' },
      { label: 'LinkedIn', href: config.links.linkedin, arrow: '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg>' },
    ].filter(Boolean);
    links.innerHTML = items
      .map((i) => `<a class="btn glass" href="${encodeURI(i.href)}" ${i.file ? `download="${i.file}"` : 'target="_blank" rel="noopener"'}>${i.label}&ensp;${i.arrow}</a>`)
      .join('');
  }

  const xp = document.getElementById('xp');
  if (xp) initExperience({ root: xp, groups: experienceGroups, reduced });

  const title = document.querySelector('.about__title, .cs__title');
  const words = splitWords(title);
  if (!reduced) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
    tl.add(riseWords(brandWords, { duration: 1.1 }), 0);
    tl.add(riseWords(words, { duration: 1.5 }), 0.15);
    tl.fromTo(fadeEls, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.3);
  } else {
    gsap.set(fadeEls, { opacity: 1 });
  }
}

// dev-only: ?tour auto-scrolls the home page for screen recordings
if (page === 'home' && new URLSearchParams(location.search).has('tour')) import('./tour.js');
