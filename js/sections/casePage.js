// Case-study pages: the looping clips (GIFs converted to MP4) only load once they come near the screen
// and only play while visible, so a long page never decodes every clip at once (phones). YouTube films
// show a thumbnail until pressed; then the player loads in place.
export function initCasePage() {
  const loops = [...document.querySelectorAll('video.cs__loop')];
  if (loops.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target;
          if (e.isIntersecting) {
            if (!v.src) v.src = v.dataset.src;
            v.play().catch(() => {});
          } else if (v.src) v.pause();
        }
      },
      { rootMargin: '200px 0px' }
    );
    loops.forEach((v) => io.observe(v));
  }

  document.querySelectorAll('.cs__yt').forEach((btn) =>
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&playsinline=1&rel=0`;
      f.title = btn.getAttribute('aria-label') || 'Film';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      btn.replaceWith(f);
    })
  );
}
