"""Build a case-study page (like frex.html) from a list of images.

Usage: python3 tools/build_case.py            (rebuilds every page in CASES)
Each image is shown full width, stacked with no gaps, on one rounded sheet. Tall Behance landing pages
are pre-sliced into ~1600px pieces (see assets/ultima, assets/airdopes) so phones never decode one
huge image. Not published (see .assetsignore).
"""
import re, subprocess, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent

def size(path):
    out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(ROOT / path)], capture_output=True, text=True).stdout
    w, h = re.findall(r'pixel\w+: (\d+)', out)
    return int(w), int(h)

def img(path, alt, eager=False):
    w, h = size(path)
    lazy = '' if eager else 'loading="lazy" '
    return f'<img src="{path}" alt="{html.escape(alt)}" width="{w}" height="{h}" {lazy}decoding="async" style="--ar:{w/h:.4f}" />'

def page(c):
    imgs = sorted((ROOT / c['dir']).glob('*.jpg'))
    body = '\n'.join(
        f'      <figure class="cs__m">{img(str(p.relative_to(ROOT)), c["alt"] if i == 0 else "", eager=i == 0)}</figure>'
        for i, p in enumerate(imgs)
    )
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

    <!-- the Behance layout as designed, as one continuous sheet. Built by tools/build_case.py from {c['dir']} -->
    <article class="cs__sheet cs__sheet--{c['sheet']}">
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
    dict(slug='ultima', title='Smartwatch Ultima', dir='assets/ultima', sheet='dark',
         alt='boAt Ultima Select smartwatch: landing page and ad banners',
         lead='A launch landing page and ad banners for boAt’s Ultima Select smartwatch, with every feature given its own scene, from calling and payments to water resistance and health tracking.',
         desc='Smartwatch Ultima: a launch landing page and ad banners for boAt’s Ultima Select smartwatch.',
         facts=[('Client', 'boAt'), ('Category', 'Wearables'), ('Scope', 'Landing page · Ad banners')]),
    dict(slug='airdopes-131', title='Airdopes 131 Elite ANC', dir='assets/airdopes', sheet='dark',
         alt='boAt Airdopes 131 Elite ANC: landing page, social and ad creatives',
         lead='A high-impact landing page for boAt Airdopes 131 Elite ANC, built on clear hierarchy and feature-led storytelling, then extended across social media, performance ads and e-commerce banners as one digital campaign.',
         desc='Airdopes 131 Elite ANC: a feature-led landing page for boAt, extended across social, performance ads and e-commerce banners.',
         facts=[('Client', 'boAt'), ('Year', '2023'), ('Scope', 'Landing page · Social · Ads')]),
]

if __name__ == '__main__':
    for c in CASES:
        (ROOT / f'{c["slug"]}.html').write_text(page(c))
        print('wrote', c['slug'] + '.html')
