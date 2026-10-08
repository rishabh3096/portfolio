const gsap = window.gsap;

const I = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 7 7.5 12l5 5M18 7l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fwd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11.5 7 5 5-5 5M6 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const fmt = (t) => {
  t = Math.max(0, Math.floor(t || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

let apiPromise;
const loadYouTubeAPI = () =>
  (apiPromise ||= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = reject;
    document.head.append(s);
  }));

// A big artwork card with a centred glass player panel (title, scrub line with a dot, times,
// rewind / play / skip). The artwork is the poster until you press play, then the set's video itself
// plays behind the glass. The panel fades away while it plays and returns when you move or pause.
// Nothing from YouTube loads until the section is near the viewport.
export function initDJ({ root, video, reduced }) {
  const poster = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;
  root.innerHTML = `
    <div class="dj__glow" style="background-image:url(${poster})" aria-hidden="true"></div>
    <div class="dj__frame">
      <div class="dj__host"><div id="dj-yt"></div></div>
      <img class="dj__poster" src="${poster}" alt="" />
      <div class="dj__shade" aria-hidden="true"></div>

      <div class="dj__tools">
        <a class="dj__chip small" href="${video.url}" target="_blank" rel="noopener">Watch on YouTube ↗</a>
        <button class="dj__chip dj__chip--icon" data-act="mute" type="button" aria-label="Mute">${I.sound}</button>
        <button class="dj__chip dj__chip--icon" data-act="full" type="button" aria-label="Fullscreen">${I.full}</button>
      </div>

      <div class="dj__panel" role="group" aria-label="DJ set player">
        <h3 class="dj__title">${video.title}</h3>
        <p class="dj__sub">${video.subtitle}</p>
        <div class="dj__scrub" data-scrub role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
          <div class="dj__fill" data-fill></div>
          <div class="dj__knob" data-knob></div>
        </div>
        <div class="dj__times small"><span data-now>0:00</span><span data-dur>0:00</span></div>
        <div class="dj__ctrls">
          <button class="dj__ring" data-act="back" type="button" aria-label="Back 10 seconds">${I.back}</button>
          <button class="dj__play" data-act="toggle" type="button" aria-label="Play">${I.play}</button>
          <button class="dj__ring" data-act="fwd" type="button" aria-label="Forward 10 seconds">${I.fwd}</button>
        </div>
      </div>
    </div>
    <p class="dj__credit small dim">Via ${video.channel}</p>`;

  // if maxres isn't available, fall back to the smaller thumbnail
  const posterEl = root.querySelector('.dj__poster');
  const glowEl = root.querySelector('.dj__glow');
  posterEl.addEventListener('error', () => {
    const alt = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    posterEl.src = alt;
    glowEl.style.backgroundImage = `url(${alt})`;
  });

  const q = (sel) => root.querySelector(sel);
  const frame = q('.dj__frame');
  const toggle = q('[data-act="toggle"]');
  const backBtn = q('[data-act="back"]');
  const fwdBtn = q('[data-act="fwd"]');
  const muteBtn = q('[data-act="mute"]');
  const fullBtn = q('[data-act="full"]');
  const scrub = q('[data-scrub]');
  const fill = q('[data-fill]');
  const knob = q('[data-knob]');
  const nowEl = q('[data-now]');
  const durEl = q('[data-dur]');

  let player = null;
  let ready = false;
  let wantPlay = false;
  let started = false;
  let dragging = false;
  let idleTimer;

  // the panel steps back while the set plays, and returns on any movement
  const wake = () => {
    frame.classList.remove('is-idle');
    clearTimeout(idleTimer);
    if (frame.classList.contains('is-playing') && !reduced) idleTimer = setTimeout(() => frame.classList.add('is-idle'), 2800);
  };
  frame.addEventListener('pointermove', wake);
  frame.addEventListener('pointerdown', wake);
  frame.addEventListener('focusin', wake);

  const setPlaying = (p) => {
    toggle.innerHTML = p ? I.pause : I.play;
    toggle.setAttribute('aria-label', p ? 'Pause' : 'Play');
    frame.classList.toggle('is-playing', p);
    wake();
  };

  function build() {
    if (player) return;
    loadYouTubeAPI()
      .then((YT) => {
        player = new YT.Player('dj-yt', {
          videoId: video.id,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3, disablekb: 1, fs: 0, origin: location.origin },
          events: {
            onReady: () => {
              ready = true;
              durEl.textContent = fmt(player.getDuration());
              if (wantPlay) player.playVideo();
            },
            onStateChange: (e) => {
              const playing = e.data === 1;
              setPlaying(playing);
              if (playing && !started) {
                started = true;
                frame.classList.add('has-started'); // poster fades out, the video takes over
              }
              if (playing) durEl.textContent = fmt(player.getDuration());
            },
          },
        });
      })
      .catch(() => {
        // YouTube blocked or offline: the play button degrades to a link
        toggle.addEventListener('click', () => window.open(video.url, '_blank', 'noopener'));
      });
  }

  const play = () => {
    wantPlay = true;
    build();
    if (ready) player.playVideo();
  };
  const pause = () => {
    wantPlay = false;
    if (ready) player.pauseVideo();
  };
  const isPlaying = () => ready && player.getPlayerState() === 1;
  const skip = (d) => ready && player.seekTo(Math.max(0, player.getCurrentTime() + d), true);

  toggle.addEventListener('click', () => (isPlaying() || (wantPlay && !ready) ? pause() : play()));
  backBtn.addEventListener('click', () => skip(-10));
  fwdBtn.addEventListener('click', () => skip(10));
  frame.addEventListener('click', (e) => {
    // clicking the picture itself toggles, but not the panel or the tools
    if (e.target.closest('.dj__panel, .dj__tools')) return;
    if (started) (isPlaying() ? pause() : play());
  });
  muteBtn.addEventListener('click', () => {
    if (!ready) return;
    const m = player.isMuted();
    m ? player.unMute() : player.mute();
    muteBtn.innerHTML = m ? I.sound : I.muted;
    muteBtn.setAttribute('aria-label', m ? 'Mute' : 'Unmute');
  });
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else frame.requestFullscreen?.();
  });

  // scrubbing
  const paint = (p) => {
    fill.style.transform = `scaleX(${p})`;
    knob.style.left = `${p * 100}%`;
    scrub.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  };
  const seekTo = (clientX) => {
    if (!ready) return;
    const r = scrub.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    player.seekTo(p * player.getDuration(), true);
    paint(p);
  };
  scrub.addEventListener('pointerdown', (e) => {
    dragging = true;
    scrub.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  });
  scrub.addEventListener('pointermove', (e) => dragging && seekTo(e.clientX));
  scrub.addEventListener('pointerup', () => (dragging = false));
  scrub.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 10 : e.key === 'ArrowLeft' ? -10 : 0;
    if (d) (skip(d), e.preventDefault());
  });

  // progress readout
  gsap.ticker.add(() => {
    if (!ready || dragging) return;
    const dur = player.getDuration() || 0;
    const cur = player.getCurrentTime() || 0;
    if (dur) paint(cur / dur);
    nowEl.textContent = fmt(cur);
  });

  // touch devices: YouTube (script + player iframe) only loads when you press play. Pre-loading it near
  // the end of the page was the heaviest thing on a phone and coincided with iOS killing the tab.
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  // desktop: get YouTube ready when the section is close to the screen
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      build();
    },
    { rootMargin: '400px' }
  );
  io.observe(root);
}
