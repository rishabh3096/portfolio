// Content for the social sections. Edit here; no markup changes needed.

// ── Reels: boAt social motion, a sliding strip (videos in assets/reels, 720p) ──────
// Each card plays on hover, with a mute toggle. Add a `url` to make a card link out to the post.
const IG = 'https://www.instagram.com/rishhh.x/';
const reel = (file, label, note) => ({ video: `assets/reels/${file}.mp4`, poster: `assets/reels/${file}.jpg`, url: null, handle: label, note, label: `${label}: ${note}` });
export const reels = [
  reel('lunar-vista', 'Lunar Vista', 'Social post'),
  reel('smart-ring-health-loop', 'Smart Ring Active', 'Health loop'),
  reel('airdopes-131-anc', 'Airdopes 131 Elite ANC', 'Meta story ad'),
  reel('watch-xplorer', 'Watch Xplorer', 'Story'),
  reel('watch-storm-teaser', 'Watch Storm', 'Teaser'),
  reel('rockerz-335-goat', 'Rockerz 335', 'GOAT'),
  reel('watch-neo-teaser', 'Watch Neo', 'Teaser'),
  reel('rockerz-255-pro', 'Rockerz 255 Pro+', 'Buzz cut'),
  reel('storm-pro-teaser', 'Storm Pro', 'Teaser'),
  reel('rockerz-450-pro', 'Rockerz 450 Pro', 'Pre-launch buzz'),
];

// ── Films: landscape HD work, a sliding strip like Reels (videos in assets/films, 720p) ──
const film = (file, label, note) => ({ video: `assets/films/${file}.mp4`, poster: `assets/films/${file}.jpg`, url: null, handle: label, note, label: `${label}: ${note}` });
export const films = [
  film('rockerz-255-pro', 'Rockerz 255 Pro+', 'Product film'),
  film('investengine', 'InvestEngine', '30s introduction'),
  film('watch-storm', 'Watch Storm', 'Launch film'),
  film('rockerz-511', 'Rockerz 511', 'Product demo'),
  film('watch-delta', 'Watch Delta', 'Pre-launch buzz'),
  film('wave-pro', 'Wave Pro', 'Teaser'),
  film('vid-2019', 'The Drunken Botanist', 'Brand film'),
  film('showreel-2020', 'boAt', 'Showreel 2020'),
];

// ── UGC edits for restaurants, bars and cafés (videos in assets/ugc, 720p) ────────
// `handle` is the venue name shown under the card, `note` the edit. Add a `url` to make a card link out.
const ugcEdit = (file, venue, note) => ({ video: `assets/ugc/${file}.mp4`, poster: `assets/ugc/${file}.jpg`, url: null, handle: venue, note, label: `${venue}: ${note}` });
export const ugc = [
  ugcEdit('hutong', 'Hutong', 'The Shard'),
  ugcEdit('aqua-kyoto', 'Aqua Kyoto', 'Japanese, Soho'),
  ugcEdit('aqua-nueva', 'Aqua Nueva', 'Drinks'),
  ugcEdit('luci', 'Luci', 'Spring at Luci'),
  ugcEdit('cartel', 'Cartel', 'Food spread'),
  ugcEdit('noya', 'Noya', 'Venue edit'),
  ugcEdit('oorja', 'Oorja', 'Christmas menu'),
  ugcEdit('bocca-lounge', 'Bocca Lounge', 'Venue edit'),
  ugcEdit('rada-summer', 'Rada Cafe', 'Summer drinks'),
  ugcEdit('rada-sign', 'Rada Cafe', 'This is your sign'),
  ugcEdit('kofi', 'Kofi', 'Mixed content'),
  ugcEdit('delisino', 'Delisino', 'Things I spent money on'),
  ugcEdit('bigbamburger', 'BigBamBurger', 'Burgers'),
  ugcEdit('palm-h2o', 'Palm H2O', 'Venue edit'),
  ugcEdit('wecord-1', 'Wecord', 'Christmas event'),
  ugcEdit('wecord-2', 'Wecord', 'Christmas event, part 2'),
];

// ── From the feed (momentum cards) ─────────────────────────────────────────────
// The user's picks from @rishhh.x.
const post = (id, kind, alt, video = false) => ({
  img: `assets/instagram/posts/${id}.jpg`,
  video: video ? `assets/instagram/posts/${id}.mp4` : null,
  url: `${IG}${kind}/${id}/`,
  alt,
});
// Reels with a video play on hover. The other three only show their cover: Instagram won't hand out
// their video outside the app (likely licensed audio). Drop an mp4 in assets/instagram/posts to turn them on.
export const moments = [
  post('DK9SXNatLIN', 'reel', 'Walking through, one step at a time', true),
  post('DMxcslzN525', 'reel', 'Explore', true),
  post('DQuB20nDUpX', 'reel', 'End of summer'),
  post('DQ9p1cpDSSd', 'reel', 'August'),
  post('C5lNMq3NIjx', 'p', 'Just do it'),
];

// ── DJ set ─────────────────────────────────────────────────────────────────────
export const dj = {
  id: '4wX6UIA_kus',
  url: 'https://youtu.be/4wX6UIA_kus',
  title: 'Global Bass, Desi Fire',
  subtitle: 'HR 26 DJ Set · From G Town to the World',
  channel: 'YoungSaintDrip TV',
};

// ── Footer background: all 78 digital photo manipulations (Behance project 72505893); the cards cycle through them ──
export const manipulations = Array.from({ length: 78 }, (_, i) => `assets/manipulations/all/m-${String(i + 1).padStart(2, '0')}.jpg`);
