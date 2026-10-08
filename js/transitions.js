const gsap = window.gsap;

// Page transitions with depth. Leaving: the page tips back and shrinks into the screen while an ink
// panel rises over it. Arriving: the panel lifts away and the new page tips forward into place.
// An inline <script> in each <head> adds html.pt-in (CSS covers the page) so there's no flash.
export function initTransitions({ reduced, stage }) {
  const root = document.documentElement;
  const pageEls = () => [...document.querySelectorAll('main, .contact')];

  // ── arriving ────────────────────────────────────────────────────────────────
  if (root.classList.contains('pt-in')) {
    try {
      sessionStorage.removeItem('rs-pt');
    } catch {}
    if (reduced) {
      root.classList.remove('pt-in');
    } else {
      const cover = document.createElement('div');
      cover.className = 'pt';
      document.body.append(cover);
      root.classList.remove('pt-in'); // the real cover div takes over, same colour
      const els = pageEls();
      gsap.set(els, { transformPerspective: 1400, rotateX: 8, scale: 0.94, y: 60, opacity: 0, transformOrigin: '50% 0%' });
      gsap
        .timeline({
          onComplete: () => {
            cover.remove();
            gsap.set(els, { clearProps: 'transform,opacity,transformPerspective,transformOrigin' });
          },
        })
        .to(cover, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 0.05)
        .to(els, { rotateX: 0, scale: 1, y: 0, opacity: 1, duration: 1.3, ease: 'expo.out' }, 0.25);
    }
  }

  // ── leaving ─────────────────────────────────────────────────────────────────
  const leave = (href) => {
    const cover = document.createElement('div');
    cover.className = 'pt';
    document.body.append(cover);
    const els = pageEls();
    gsap.set(els, { transformPerspective: 1400, transformOrigin: '50% 100%' });
    gsap
      .timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem('rs-pt', '1');
          } catch {}
          location.href = href;
        },
      })
      .fromTo(cover, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: 'expo.inOut' }, 0)
      .to(els, { rotateX: -8, scale: 0.92, y: -50, opacity: 0.3, duration: 0.8, ease: 'power3.in' }, 0)
      .to('.gl', { opacity: 0, duration: 0.6 }, 0);
  };

  document.addEventListener('click', (e) => {
    if (reduced || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return; // anchors scroll instead
    e.preventDefault();
    leave(url.href);
  });

  // coming back with the browser's Back button can restore the "leaving" state; undo it
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelectorAll('.pt').forEach((n) => n.remove());
    gsap.set(pageEls(), { clearProps: 'all' });
    gsap.set('.gl', { opacity: 1 });
  });
}
