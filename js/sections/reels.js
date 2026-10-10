const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM15.5 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

// Vertical reels, TikTok/Reels style. Placeholders until `video` is set in js/data/social.js.
// Real videos never autoplay on load: hover (or tap) plays, the mute badge toggles sound.
// Browsers fetch every <video poster> as soon as the page loads; with ~40 cards that was most of the home
// page's first download. Posters are set only when a card gets within ~2 screens.
const posterIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.poster = e.target.dataset.poster;
      posterIO.unobserve(e.target);
    }),
  { rootMargin: '1500px 1500px' } // wide sideways too: strip cards sit off to the right
);

export function initReels({ root, reels, reduced }) {
  reels.forEach((r, i) => {
    const n = String(i + 1).padStart(2, '0');
    // with a url the card links out (Instagram); without one it is just a player
    const card = document.createElement(r.url ? 'a' : 'div');
    card.className = 'reel';
    if (r.url) {
      card.href = r.url;
      card.target = '_blank';
      card.rel = 'noopener';
      card.setAttribute('aria-label', `${r.label} on Instagram (opens in a new tab)`);
    } else {
      card.setAttribute('aria-label', r.label);
    }
    card.dataset.cursor = 'play';
    card.innerHTML = `
      <div class="reel__media">
        ${
          r.video
            ? `<video muted loop playsinline preload="none" ${r.poster ? `data-poster="${r.poster}"` : ''} src="${r.video}"></video>`
            : `<div class="reel__ph"><span class="small dim">${r.label}</span><span class="small dim">Placeholder</span></div>`
        }
        <span class="reel__badge reel__badge--play" aria-hidden="true">${PLAY}</span>
        ${r.video ? `<button class="reel__badge reel__badge--mute" type="button" aria-label="Unmute">${MUTED}</button>` : `<span class="reel__badge reel__badge--mute" aria-hidden="true">${MUTED}</span>`}
      </div>
      <p class="reel__cap small"><span>${r.handle}</span><span class="dim">${r.note || n}</span></p>`;
    root.append(card);

    const media = card.querySelector('.reel__media');
    const video = card.querySelector('video');
    if (video?.dataset.poster) posterIO.observe(video);
    const playBadge = card.querySelector('.reel__badge--play');
    const muteBtn = card.querySelector('button.reel__badge--mute');

    // hover play / pause
    if (video) {
      const play = () => {
        video.play().catch(() => {});
        playBadge.innerHTML = PAUSE;
        card.classList.add('is-playing');
      };
      const pause = () => {
        video.pause();
        playBadge.innerHTML = PLAY;
        card.classList.remove('is-playing');
      };
      // mouse: hover plays. Touch: pointerenter/leave fire on finger down/up, so a tap toggles instead.
      card.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && play());
      card.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && pause());
      let lastType = 'mouse'; // from pointerdown: some browsers' click events don't carry pointerType
      card.addEventListener('pointerdown', (e) => (lastType = e.pointerType));
      card.addEventListener('click', (e) => {
        if (lastType === 'mouse' || card.tagName === 'A') return; // linked cards keep their link
        e.preventDefault();
        if (video.paused) {
          // one video at a time
          document.querySelectorAll('.reel.is-playing').forEach((c) => c !== card && c.dispatchEvent(new CustomEvent('reel:pause')));
          play();
        } else pause();
      });
      card.addEventListener('reel:pause', pause);
      muteBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? MUTED : SOUND;
        muteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
      });
    }

    // a little 3D tilt toward the cursor
    if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      media.addEventListener('pointermove', (e) => {
        const b = media.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width - 0.5;
        const y = (e.clientY - b.top) / b.height - 0.5;
        media.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
        media.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
        media.style.setProperty('--sx', `${((x + 0.5) * 100).toFixed(1)}%`);
      });
      media.addEventListener('pointerleave', () => {
        media.style.setProperty('--rx', '0deg');
        media.style.setProperty('--ry', '0deg');
      });
    }
  });
}

// A horizontal strip: native swipe on touch, drag with a mouse, arrows step by about a screen of cards.
export function initStrip(root, { reduced }) {
  if (!root) return;
  const section = root.closest('section');
  const step = (dir) => root.scrollBy({ left: dir * root.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  section.querySelector('[data-reels-prev]')?.addEventListener('click', () => step(-1));
  section.querySelector('[data-reels-next]')?.addEventListener('click', () => step(1));

  // mouse drag (touch already scrolls natively). A drag that moved more than a few px swallows the click.
  let startX = 0, startLeft = 0, moved = false, down = false;
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false;
    startX = e.clientX; startLeft = root.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; root.classList.add('is-dragging'); }
    if (moved) root.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (moved) {
      root.classList.remove('is-dragging');
      // let snapping settle on the nearest card
      root.scrollBy({ left: 0, behavior: 'smooth' });
    }
  });
  root.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  root.addEventListener('dragstart', (e) => e.preventDefault());
}
