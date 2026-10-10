import { config } from './config.js';

// Shared header + footer, rendered into every page so there's one place to edit them.
export function mountChrome(page) {
  const { links, email, available, city, resume, portfolio } = config;

  const header = document.createElement('header');
  header.className = `header small${page !== 'home' ? ' logo-only' : ''}`;
  header.innerHTML = `
    <a class="brandmark" href="./" aria-label="${config.name} — home">
      ${page !== 'home' ? '' : `<span class="brandmark__text">${config.name}</span>`}
      <img class="brandmark__logo" src="assets/logo.png" alt="" ${page !== 'home' ? 'data-fade' : ''} />
    </a>
    <nav class="nav glass" data-fade aria-label="Primary">
      <a href="./#work" data-anchor>Work</a>
      <a href="about.html" ${page === 'about' ? 'aria-current="page"' : ''}>About</a>
      <a href="#contact" data-anchor>Contact</a>
    </nav>
  `;
  document.body.prepend(header);

  const skip = document.createElement('a');
  skip.className = 'skip small';
  skip.href = '#main';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);

  // Immersive footer: a tall wrapper with a pinned 100vh stage. Project covers fly through 3D space
  // behind an oversized "Let's talk"; the glass panel carries the details (see js/sections/footer.js).
  const footer = document.createElement('footer');
  footer.className = 'contact';
  footer.id = 'contact';
  footer.innerHTML = `
    <div class="contact__stage">
      <div class="contact__space" aria-hidden="true"></div>
      <div class="contact__vignette" aria-hidden="true"></div>

      <div class="contact__center">
        <p class="small dim contact__kicker">Contact</p>
        <a class="contact__cta" href="mailto:${email}" aria-label="Let’s talk. Email ${email}">Let’s talk</a>
        <p class="contact__lede">Got a launch, a brand or an idea that needs to move? I’d love to hear about it.</p>
      </div>

      <div class="fglass">
        <div class="fglass__top">
          <div class="fglass__brand">
            <img class="fglass__logo" src="assets/logo.png" alt="" />
            <p class="fglass__name">${config.name}</p>
            <p class="small dim">${config.role}, ${city}.</p>
            ${available ? `<p class="small fglass__status"><i class="dot"></i>Available for freelance</p>` : ''}
          </div>

          <div class="fglass__mail">
            <p class="small dim fglass__h">Get in touch</p>
            <button class="ffield" type="button" data-copy="${email}" aria-label="Copy email address ${email}">
              <span class="ffield__addr">${email}</span>
              <span class="copy__hint small" aria-live="polite">Copy</span>
            </button>
            <a class="fbtn" href="mailto:${email}">Email me <span aria-hidden="true">↗︎</span></a>
          </div>
        </div>

        <nav class="fglass__links" aria-label="Links and downloads">
          <a href="${links.behance}" target="_blank" rel="noopener">Behance ↗︎</a>
          <a href="${links.linkedin}" target="_blank" rel="noopener">LinkedIn ↗︎</a>
          <a href="${links.instagram}" target="_blank" rel="noopener">Instagram ↗︎</a>
          <a href="${links.soundcloud}" target="_blank" rel="noopener">SoundCloud ↗︎</a>
          ${resume ? `<a href="${encodeURI(resume)}" download="Resume - ${config.name}.pdf">Resume ↓</a>` : ''}
          ${portfolio ? `<a href="${encodeURI(portfolio)}" download="Portfolio - ${config.name}.pdf">Portfolio PDF ↓</a>` : ''}
        </nav>
      </div>

      <div class="contact__legal small dim">
        <span>© ${new Date().getFullYear()} ${config.name}</span>
        <a href="#top" data-anchor>Back to top ↑</a>
      </div>
    </div>
  `;
  document.body.append(footer);
}
