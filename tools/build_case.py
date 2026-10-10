"""Build a case-study page (like frex.html) from a list of images.

Usage: python3 tools/build_case.py            (rebuilds every page in CASES)
Each image is shown full width, stacked with no gaps, on one rounded sheet. Tall Behance landing pages
are pre-sliced into ~1600px pieces (see assets/ultima, assets/airdopes) so phones never decode one
huge image. Not published (see .assetsignore).
"""
import re, subprocess, pathlib, html, json

ROOT = pathlib.Path(__file__).resolve().parent.parent

def size(path):
    out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(ROOT / path)], capture_output=True, text=True).stdout
    w, h = re.findall(r'pixel\w+: (\d+)', out)
    return int(w), int(h)

def img(path, alt, eager=False):
    w, h = size(path)
    lazy = '' if eager else 'loading="lazy" '
    return f'<img src="{path}" alt="{html.escape(alt)}" width="{w}" height="{h}" {lazy}decoding="async" style="--ar:{w/h:.4f}" />'

def blocks_html(c):
    """Behance modules -> markup. A case either lists a folder of slices (dir) or has a manifest.json
    written by the asset step: ['i', path, w, h] image | ['v', mp4, poster, w, h] looping clip (was a GIF)
    | ['film', mp4, poster] film with sound | ['yt', id] | ['sc', src] SoundCloud | ['t', text] | ['sp']"""
    if 'dir' in c:
        imgs = sorted((ROOT / c['dir']).glob('*.jpg'))
        return '\n'.join(
            f'      <figure class="cs__m">{img(str(p.relative_to(ROOT)), c["alt"] if i == 0 else "", eager=i == 0)}</figure>'
            for i, p in enumerate(imgs))
    out, first = [], True
    for b in json.loads((ROOT / 'assets/cases' / c['slug'] / 'manifest.json').read_text()):
        k = b[0]
        if k == 'i':
            # a 5th value = the image's width on Behance when narrower than the page: shown at that width, centred
            narrow = f' style="--w:{b[4] / 1400 * 100:.2f}%"' if len(b) > 4 else ''
            out.append(f'      <figure class="cs__m{" cs__m--narrow" if narrow else ""}"{narrow}>{img(b[1], c["alt"] if first else "", eager=first)}</figure>')
            first = False
        elif k == 'g':
            rows = '\n'.join('        <div class="cs__row">' + ''.join(img(t[0], '') for t in r) + '</div>' for r in b[1])
            out.append(f'      <figure class="cs__m cs__grid">\n{rows}\n      </figure>')
        elif k == 'vm':
            out.append(f'      <figure class="cs__m cs__film"><button class="cs__yt cs__vm" type="button" data-vimeo="{b[1]}" aria-label="Play: {html.escape(b[5])} (Vimeo)" data-bg="{b[2]}" style="aspect-ratio:{b[3]}/{b[4]}"><span class="cs__ytplay" aria-hidden="true"></span></button></figure>')
        elif k == 'link':
            out.append(f'      <p class="cs__label"><a class="btn glass" href="{html.escape(b[1])}" target="_blank" rel="noopener">{html.escape(b[2])}</a></p>')
        elif k == 'v':
            # silent loop: src set and played only while on screen (js/sections/casePage.js)
            out.append(f'      <figure class="cs__m"><video class="cs__loop" data-src="{b[1]}" data-poster="{b[2]}" width="{b[3]}" height="{b[4]}" muted loop playsinline preload="none" aria-hidden="true" style="--ar:{b[3]/b[4]:.4f}"></video></figure>')
        elif k == 'film':
            poster = b[2] if len(b) > 2 else b[1].rsplit('.', 1)[0] + '.jpg'  # films sit next to a same-name poster
            out.append(f'      <figure class="cs__m cs__film"><video src="{b[1]}" poster="{poster}" controls playsinline preload="none"></video></figure>')
        elif k == 'yt':
            out.append(f'      <figure class="cs__m cs__film"><button class="cs__yt" type="button" data-yt="{b[1]}" aria-label="Play the film (YouTube)" data-bg="https://i.ytimg.com/vi/{b[1]}/hqdefault.jpg"><span class="cs__ytplay" aria-hidden="true"></span></button></figure>')
        elif k == 'sc':
            out.append(f'      <figure class="cs__m cs__sc"><iframe title="SoundCloud" loading="lazy" allow="autoplay" src="{html.escape(b[1])}"></iframe></figure>')
        elif k == 't':
            out.append(f'      <p class="cs__label">{html.escape(b[1])}</p>')
        elif k == 'sp':
            out.append('      <div class="cs__sp" aria-hidden="true"></div>')
    return '\n'.join(out)

def page(c):
    body = blocks_html(c)
    facts = '\n'.join(f'          <div><dt class="dim">{k}</dt><dd>{v}</dd></div>' for k, v in c['facts'])
    url = f'https://rishx.cc/{c["slug"]}'
    t = f'{c["title"]} — Rishabh Yadav'
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{t}</title>
  <meta name="description" content="{html.escape(c['desc'])}" />
  <link rel="canonical" href="{url}" />
  <meta property="og:title" content="{t}" />
  <meta property="og:description" content="{html.escape(c['desc'])}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="https://rishx.cc/assets/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#0a0a0b" />
  <script>try{{if(sessionStorage.getItem('rs-pt'))document.documentElement.classList.add('pt-in')}}catch(e){{}}</script>
  <link rel="icon" type="image/png" sizes="64x64" href="assets/favicon-64.png" />
  <link rel="icon" type="image/png" sizes="256x256" href="assets/favicon-256.png" />
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin />
  <link rel="preconnect" href="https://cdn.fontshare.com" crossorigin />
  <link href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="vendor/lenis.css" />
  <link rel="stylesheet" href="css/main.css" />
  <script src="vendor/gsap.min.js"></script>
  <script type="module" src="js/main.js"></script>
</head>
<body data-page="case">
  <div class="page-bg" aria-hidden="true"></div>
  <div class="page-veil" aria-hidden="true"></div>
  <main id="main" class="cs">
    <header class="cs__head">
      <h1 class="cs__title cs__title--long">{c['title']}</h1>
      <div class="cs__intro" data-reveal>
        <p class="cs__lead">{html.escape(c['lead'])}</p>
        <dl class="cs__facts small">
{facts}
        </dl>
      </div>
    </header>

    <!-- the Behance layout as designed, as one continuous sheet. Built by tools/build_case.py -->
    <article class="cs__sheet" style="--sheet:{c['sheet']}">
{body}
    </article>

    <nav class="cs__next" aria-label="More work">
      <a class="btn glass" href="./#work">←&ensp;All work</a>
    </nav>
  </main>
</body>
</html>
'''

CASES = [
    dict(slug='ultima', title='Smartwatch Ultima', dir='assets/ultima', sheet='#000',
         alt='boAt Ultima Select smartwatch: landing page and ad banners',
         lead='A launch landing page and ad banners for boAt’s Ultima Select smartwatch, with every feature given its own scene, from calling and payments to water resistance and health tracking.',
         desc='Smartwatch Ultima: a launch landing page and ad banners for boAt’s Ultima Select smartwatch.',
         facts=[('Client', 'boAt'), ('Category', 'Wearables'), ('Scope', 'Landing page · Ad banners')]),
    dict(slug='airdopes-131', title='Airdopes 131 Elite ANC', dir='assets/airdopes', sheet='#000',
         alt='boAt Airdopes 131 Elite ANC: landing page, social and ad creatives',
         lead='A high-impact landing page for boAt Airdopes 131 Elite ANC, built on clear hierarchy and feature-led storytelling, then extended across social media, performance ads and e-commerce banners as one digital campaign.',
         desc='Airdopes 131 Elite ANC: a feature-led landing page for boAt, extended across social, performance ads and e-commerce banners.',
         facts=[('Client', 'boAt'), ('Year', '2023'), ('Scope', 'Landing page · Social · Ads')]),
    dict(slug='netflix', title='Netflix × boAt', sheet='#181818',
         alt='Netflix × boAt brand campaign',
         lead='The boAt × Netflix Stream Edition: a range “made for India to keep watching”, launched with key visuals that pair each product with a Netflix show (Stranger Things, Wednesday, Money Heist), then carried through social, motion, a film, e-commerce banners, a print ad and outdoor.',
         desc='Netflix × boAt: a brand campaign across key visuals, motion, film, e-commerce, print and outdoor.',
         facts=[('Client', 'boAt × Netflix'), ('Year', '2023'), ('Scope', 'Campaign · Social · Motion · Print · OOH')]),
    dict(slug='fitness-xtended', title='Fitness Xtended', sheet='#141414',
         alt='Fitness Xtended campaign for boAt and Cult.fit',
         lead='Fitness Xtended, a brand partnership between boAt and Cult.fit built around performing fitness with accurate tracking: Crest app screens, social posts, and standees and posters inside Cult centres.',
         desc='Fitness Xtended: a co-branded campaign for boAt and Cult.fit.',
         facts=[('Client', 'boAt × Cult.fit'), ('Year', '2023'), ('Scope', 'Partnership · App · Social · In-gym')]),
    dict(slug='virimodo', title='Virimodo', sheet='#ffffff',
         alt='Virimodo: carbon reduction intelligence',
         lead='Motion graphics for Virimodo, an NYC-based carbon reduction intelligence company (Latin for “green now”): an introduction film and a B2B explainer.',
         desc='Virimodo: motion graphics for an NYC-based carbon reduction intelligence company.',
         facts=[('Client', 'Virimodo'), ('Year', '2021'), ('Scope', 'Motion graphics · Explainer films')]),
    dict(slug='drunken-botanist', title='The Drunken Botanist', sheet='#ffffff',
         alt='The Drunken Botanist: one year campaign',
         lead='#1YearOfDrunkenness: a lyrical, whimsical film for The Drunken Botanist’s first anniversary, in which the Botanist wakes from his drunken slumber to find a whole year has passed. Key visuals, script, storyboard, an original song and the film.',
         desc='The Drunken Botanist: a one-year campaign with social, events and a brand film.',
         facts=[('Client', 'The Drunken Botanist'), ('Year', '2019'), ('Scope', 'Campaign · Film · Song')]),
    dict(slug='smart-ring', title='Smart Ring Active', sheet='#040404',
         alt='boAt Smart Ring Active',
         lead='“Ring in Revolution”: launch creatives for boAt’s Smart Ring Active, with every feature told as its own “Ring in…” story, from style and comfort to health, fitness and a five-day battery.',
         desc='Smart Ring Active: launch visuals and motion for boAt’s smart ring.',
         facts=[('Client', 'boAt'), ('Category', 'Wearables'), ('Scope', 'Launch campaign · Motion')]),
    dict(slug='lunar-vista', title='Lunar Vista', sheet='#040404',
         alt='boAt Lunar Vista smartwatch',
         lead='“Life Comes Full Circle”: a launch campaign for boAt’s Lunar Vista smartwatch, built around its 1.52" circular display, with every feature framed as a circle: of connections, vitality, athletic achievements, choices, efficiency and reliability.',
         desc='Lunar Vista: a launch campaign for boAt’s circular-display smartwatch.',
         facts=[('Client', 'boAt'), ('Category', 'Wearables'), ('Scope', 'Launch campaign · Motion')]),
    dict(slug='watch-storm', title='Watch Storm', sheet='#141414',
         alt='boAt Watch Storm smartwatch',
         lead='“Smart Got Better Looking”: launch creatives for boAt’s Watch Storm, from the feature story and the launch film to the sell-out posts after 10,000 units went in 30 seconds on Flipkart.',
         desc='Watch Storm: launch creatives and film for boAt’s smartwatch.',
         facts=[('Client', 'boAt'), ('Year', '2020'), ('Scope', 'Launch campaign · Film · Social')]),
    dict(slug='brewery-food-menu', title='Brewery Food Menu', sheet='#181715',
         alt='Food menu for Factory brewery',
         lead='A food menu for Factory: a dark, photo-led menu book that moves from quick bites and starters through Asian mains, pizza and biryani to dessert.',
         desc='Brewery Food Menu: a photo-led menu book for Factory.',
         facts=[('Client', 'Factory'), ('Year', '2019'), ('Scope', 'Menu design · Print')]),
    dict(slug='boat-lifestyle', title='boAt Lifestyle', sheet='#e8e8e9',
         alt='boAt Lifestyle: graphic and motion design',
         lead='Graphic and motion design for boAt’s social channels: product pre-buzz films, launch posts and campaigns like #OwnTheChase, G.O.A.T and #SoundThatMatters, across Rockerz, Airdopes, soundbars and smartwatches.',
         desc='boAt Lifestyle: graphic and motion design for boAt’s social channels.',
         facts=[('Client', 'boAt'), ('Year', '2020–21'), ('Scope', 'Social · Motion · Campaigns')]),
    dict(slug='ideatic-social', title='Ideatic Social Media', sheet='#c9c9c7',
         alt='Social media creatives made at Ideatic',
         lead='Social media at Ideatic for bars, cafés and nightlife brands, including Brew Buddy, Chugli Café, Soi 7 and Molecule: weekly event posts, menus and animated creatives.',
         desc='Ideatic: social media creatives for bars, cafés and nightlife brands.',
         facts=[('Studio', 'Ideatic'), ('Year', '2019'), ('Scope', 'Social · Animated posts')]),
    dict(slug='photo-manipulations', title='Digital Photo Manipulations', sheet='#111113',
         alt='Digital photo manipulations',
         lead='Personal work: surreal digital photo manipulations, built up in Photoshop and shared on Instagram.',
         desc='Digital Photo Manipulations: personal surreal composites.',
         facts=[('Type', 'Personal'), ('Year', '2018–19'), ('Scope', 'Photo manipulation')]),
    dict(slug='fifa-world-cup-2018', title='FIFA World Cup 2018', sheet='#ffffff',
         alt='Inshorts FIFA World Cup 2018 news images',
         lead='News images for Inshorts through the 2018 FIFA World Cup in Russia: score cards, fixtures and team line-ups, turned around against live match deadlines and published in English and Hindi at once.',
         desc='FIFA World Cup 2018: news images for Inshorts, in English and Hindi.',
         facts=[('Client', 'Inshorts'), ('Year', '2018'), ('Scope', 'News creatives')]),
]

if __name__ == '__main__':
    for c in CASES:
        (ROOT / f'{c["slug"]}.html').write_text(page(c))
        print('wrote', c['slug'] + '.html')
