const gsap = window.gsap;

// Experience as an editorial table (index / organisation / role / place / dates), grouped under
// headings. Hovering a row sweeps a soft light across it. Clicking a row
// expands the details beneath it, aligned to the same columns, with the CV text staggering in.
export function initExperience({ root, groups, reduced }) {

  root.innerHTML = `<div class="xp__list"></div>`;

  const list = root.querySelector('.xp__list');
  let n = 0;
  const rows = [];

  groups.forEach((g) => {
    const group = document.createElement('section');
    group.className = 'xp__group';
    group.dataset.group = g.id;
    group.innerHTML = `<h3 class="xp__gtitle small dim">${g.title}</h3>`;
    g.items.forEach((it) => {
      n += 1;
      const id = `xp-${n}`;
      const expandable = it.bullets && it.bullets.length > 0;
      const dates = it.start === it.end ? it.start : `${it.start} — ${it.end}`;
      const row = document.createElement('article');
      row.className = 'xp__row';
      row.innerHTML = `
        <button class="xp__line" type="button" ${expandable ? `aria-expanded="false" aria-controls="${id}"` : 'aria-disabled="true" tabindex="-1"'}>
          <span class="xp__no small dim">${String(n).padStart(2, '0')}</span>
          <span class="xp__org">${it.org}</span>
          <span class="xp__role">${it.role}</span>
          <span class="xp__place small dim">${it.place}</span>
          <span class="xp__dates small">${dates}</span>
          <span class="xp__icon" aria-hidden="true">${expandable ? '<i></i><i></i>' : ''}</span>
        </button>
        ${
          expandable
            ? `<div class="xp__panel" id="${id}" role="region" aria-label="${it.org} details" hidden>
                <div class="xp__inner">
                  <div class="xp__side small dim">
                    <p>${dates}</p><p>${it.place}</p>
                  </div>
                  <div class="xp__body">
                    <ul class="xp__bullets">${it.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
                  </div>
                </div>
              </div>`
            : ''
        }`;
      group.append(row);
      rows.push({ el: row, it, expandable, open: false, group: g.id });
    });
    list.append(group);
  });

  // ── expand / collapse ────────────────────────────────────────────────────────
  const setOpen = (r, open) => {
    if (!r.expandable || r.open === open) return;
    r.open = open;
    const btn = r.el.querySelector('.xp__line');
    const panel = r.el.querySelector('.xp__panel');
    btn.setAttribute('aria-expanded', String(open));
    r.el.classList.toggle('is-open', open);
    if (open) {
      panel.hidden = false;
      if (reduced) return;
      gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.8, ease: 'expo.out' });
      gsap.fromTo(panel.querySelectorAll('.xp__side p, .xp__bullets li'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.045, delay: 0.1, ease: 'expo.out' });
    } else if (reduced) {
      panel.hidden = true;
    } else {
      gsap.to(panel, { height: 0, duration: 0.55, ease: 'expo.inOut', onComplete: () => (panel.hidden = true) });
    }
  };
  rows.forEach((r) => {
    r.el.querySelector('.xp__line').addEventListener('click', () => {
      if (!r.expandable) return;
      const next = !r.open;
      rows.forEach((o) => o !== r && setOpen(o, false)); // one at a time keeps the table readable
      setOpen(r, next);
    });
  });

  // open the first expandable row so the interaction is discoverable
  const first = rows.find((r) => r.expandable && r.it.org === 'boAt') || rows.find((r) => r.expandable);
  if (first) setOpen(first, true);
}
