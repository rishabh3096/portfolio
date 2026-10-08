// Site-wide settings. Everything marked TODO is waiting on you.
export const config = {
  name: 'Rishabh Yadav',
  role: 'Visual & Motion Designer',
  city: 'London',
  timezone: 'Europe/London',

  // Shown in the footer (click-to-copy). Swap for a custom-domain address later.
  email: 'rishabh3096@gmail.com',

  // Path to your resume PDF, e.g. 'assets/Resume - Rishabh Yadav.pdf'. Leave null to hide the link.
  resume: 'assets/Resume - Rishabh Yadav.pdf',
  portfolio: 'assets/Portfolio - Rishabh Yadav.pdf', // the PDF portfolio (footer + About page)

  // Opening sequence (greetings > logo > hero). Skipped for reduced-motion users and deep links like /#work.
  preloader: { enabled: true, oncePerSession: true },

  // Behance lists you as available for freelance.
  available: true,

  // TODO: drop files into assets/reel/ and set these paths. Leave null to keep the placeholders.
  reel: null,        // full showreel, e.g. 'assets/reel/showreel.mp4' (plays with sound in the Reel section)
  reelPoster: null,  // e.g. 'assets/reel/poster.jpg'

  links: {
    behance: 'https://www.behance.net/rishabhyadavv',
    linkedin: 'https://www.linkedin.com/in/rishabhyadavv',
    instagram: 'https://instagram.com/rishhh.x',
    soundcloud: 'https://soundcloud.com/rishabhyadavv',
  },
};
