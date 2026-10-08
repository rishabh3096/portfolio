// Single source of truth for work.
//
// `projects`  : every project on Behance, newest first. This feeds the looping "Beyond the highlights" ring.
// `featuredSlugs` : the order of the big cards in Selected work.
// caseStudy: null -> the card opens Behance. Set to a path like 'work/smart-ring.html' once the full page
//            exists and the card links on-site instead.
// placeholder: true -> a card with no cover and no link yet (a case study that is still to be built).
// tags: derived from the Behance titles only. Edit freely.

const behance = (id, slug) => `https://www.behance.net/gallery/${id}/${slug}`;
const cover = (name) => `assets/projects/${name}.jpg`;

export const projects = [
  { slug: 'smart-ring-active', title: 'Smart Ring Active', client: 'boAt', tags: ['Wearables'], year: 2026, cover: cover('smart-ring-active-boat-wearables'), behance: behance(251216919, 'Smart-Ring-Active-boAt-Wearables'), caseStudy: null },
  { slug: 'lunar-vista', title: 'Lunar Vista', client: 'boAt', tags: ['Smartwatch'], year: 2026, cover: cover('boat-smartwatches-lunar-vista'), behance: behance(247874183, 'boAt-Smartwatches-Lunar-Vista'), caseStudy: null },
  { slug: 'airdopes-131-elite-anc', title: 'Airdopes 131 Elite ANC', client: 'boAt', tags: ['Audio', 'Landing Page'], year: 2026, cover: cover('boat-audio-airdopes-131-elite-anc-landing-page'), behance: behance(247799081, 'boAt-Audio-Airdopes-131-Elite-ANC-Landing-Page'), caseStudy: null },
  { slug: 'smartwatch-ultima', title: 'Smartwatch Ultima', client: 'boAt', tags: ['Landing Page'], year: 2026, cover: cover('boat-smartwatch-ultima-landing-page'), behance: behance(247579075, 'boAt-Smartwatch-Ultima-Landing-Page'), caseStudy: null },
  { slug: 'netflix-x-boat', title: 'Netflix × boAt', client: 'boAt', tags: ['Brand Campaign'], year: 2023, cover: cover('netflix-boat-brand-campaign'), behance: behance(166954169, 'Netflix-boAt-Brand-Campaign'), caseStudy: null },
  { slug: 'fitness-xtended', title: 'Fitness Xtended', client: 'boAt × Cult.fit', tags: ['Campaign'], year: 2023, cover: cover('fitness-xtended-campaign-boat-cultfit'), behance: behance(165852413, 'Fitness-Xtended-Campaign-boAt-Cultfit'), caseStudy: null },
  { slug: 'boat-lifestyle', title: 'boAt Lifestyle', client: 'boAt', tags: ['Graphic', 'Motion'], year: 2021, cover: cover('boat-lifestyle-graphic-and-motion-design'), behance: behance(119906955, 'boAt-Lifestyle-Graphic-and-Motion-Design'), caseStudy: null },
  { slug: 'virimodo', title: 'Virimodo', client: 'Virimodo', tags: ['Motion Graphics'], year: 2021, cover: cover('virimodo-motion-graphics'), behance: behance(118671749, 'Virimodo-Motion-Graphics'), caseStudy: null },
  { slug: 'watch-storm', title: 'Watch Storm', client: 'boAt', tags: ['Smartwatch'], year: 2020, cover: cover('boat-watch-storm-smartwatch'), behance: behance(107910573, 'Boat-Watch-Storm-Smartwatch'), caseStudy: null },
  { slug: 'the-drunken-botanist', title: 'The Drunken Botanist', client: 'The Drunken Botanist', tags: ['One Year Campaign'], year: 2019, cover: cover('the-drunken-botanist-one-year-campaign'), behance: behance(85002781, 'The-Drunken-Botanist-One-Year-Campaign'), caseStudy: null },
  { slug: 'brewery-food-menu', title: 'Brewery Food Menu', client: 'Factory', tags: ['Menu Design'], year: 2019, cover: cover('brewery-food-menu'), behance: behance(85009049, 'Brewery-Food-Menu'), caseStudy: null },
  { slug: 'ideatic-social', title: 'Ideatic Social Media', client: 'Ideatic', tags: ['Social Media'], year: 2019, cover: cover('ideatic-social-media'), behance: behance(84008137, 'IDEATIC-Social-Media'), caseStudy: null },
  { slug: 'digital-photo-manipulations', title: 'Digital Photo Manipulations', client: 'Personal', tags: ['Photo Manipulation'], year: 2018, cover: cover('digital-photo-manipulations'), behance: behance(72505893, 'Digital-Photo-Manipulations'), caseStudy: null },
  // unpublished on Behance: lives on-site only (frex.html)
  { slug: 'frex', title: 'Frex', client: 'A.T.L.A.S Labs', tags: ['Branding', 'UX', 'Packaging'], year: 2018, cover: 'assets/frex/cover.jpg', behance: null, caseStudy: 'frex.html' },
  { slug: 'fifa-world-cup-2018', title: 'FIFA World Cup 2018', client: 'Inshorts', tags: ['Campaign'], year: 2018, cover: cover('fifa-world-cup-2018-inshorts'), behance: behance(69374201, 'Fifa-World-Cup-Russia-2018-Inshorts'), caseStudy: null },
];

// Big cards in Selected work, in this order.
export const featuredSlugs = [
  'boat-lifestyle',
  'netflix-x-boat',
  'smart-ring-active',
  'the-drunken-botanist',
  'virimodo',
  'fitness-xtended',
  'smartwatch-ultima',
  'airdopes-131-elite-anc',
];


export const featured = featuredSlugs.map((s) => projects.find((p) => p.slug === s));

export const href = (p) => p.caseStudy || p.behance;
export const isExternal = (p) => !p.caseStudy;
