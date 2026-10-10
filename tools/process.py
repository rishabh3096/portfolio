import subprocess, json, pathlib, sys, concurrent.futures as cf, re
S = pathlib.Path("/tmp/case-build")  # scratch: downloads + the Swift helpers (enc, gif2mp4, slice)
P = pathlib.Path('/Users/Rishabh/Desktop/Claude/portfolio')
UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126 Safari/537.36'
CDN = 'https://mir-s3-cdn-cf.behance.net/project_modules/'

# block specs: ('i', id) image | ('t', text) label | ('sp',) spacer | ('yt', id) | ('sc', src) soundcloud | ('film', local path)
SPECS = {
 'netflix': [('i','9f4259166954169.6421651067841.jpg'),('i','0a2e71166954169.64216510696eb.jpg'),('i','6a581e166954169.642165106bec8.gif'),
   ('yt','QVzMEgz713I'),('i','f63bb6166954169.6421651075796.jpg'),('i','8caa28166954169.6421651076b92.gif'),('i','de7c3f166954169.6421651073286.jpg'),
   ('i','61ed41166954169.6421651070bb5.gif'),('i','518f4e166954169.642165106d15b.jpg'),('i','1e4b62166954169.642165106aaa4.gif'),('i','8e1477166954169.642165107446b.gif'),
   ('i','f09add166954169.642165106e476.gif'),('i','a8a14e166954169.642165106619f.gif'),('i','aa460d166954169.6421651071eb9.jpg'),('i','b7dc9a166954169.652fb7361e421.png'),
   ('t','E-Commerce Banners'),('i','d32c84166954169.65304c17d52eb.gif'),('t','Newspaper Print Ad'),('i','9556de166954169.64e70253ae1ee.jpg'),('sp',),
   ('i','2ae0da166954169.64e70253af32e.jpg'),('t','OOH Outdoor Advertising'),('i','5b4f09166954169.652f8edfd8a3f.png')],
 'fitness-xtended': [('i','fa5623165852413.640eebd09b718.jpg'),('i','e8ff7a165852413.6412d755d35d1.jpg'),('i','9e6a21165852413.6412d755d4845.jpg'),
   ('i','e78fe8165852413.64214051c9a48.jpg'),('i','3e43fd165852413.6412d755d5a67.jpg'),('i','e9d26e165852413.641995261656c.jpg')],
 'virimodo': [('i','8358f7118671749.608de7aee7928.jpg'),('i','834ede118671749.608eb8ca5d3b6.jpg'),('i','121046118671749.6091ac147b568.jpg'),('film','V1'),
   ('i','12d2dd118671749.608de6b6654f9.jpg'),('film','V2'),('i','65d862118671749.608eb955a493c.jpg')],
 'drunken-botanist': [('i','71ddf885002781.5d6eba9d7e3e8.gif'),('i','906d4685002781.5d74c1938e2ca.jpg'),('i','effdd485002781.5d74c1938dd82.jpg'),
   ('sc','https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/655919813&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true'),
   ('i','e5eb0985002781.5d73f3de8d623.jpg'),('i','8c391585002781.5d73f3de8d1d6.jpg'),('film','assets/films/vid-2019.mp4'),('i','dfb61885002781.5d73f3de8da24.jpg')],
 'smart-ring': [('i',x) for x in ['b19530251216919.6a316ad933b9f.jpg','071f18251216919.6a317754425df.jpg','83f42d251216919.6a31775442bdf.jpg','ccf708251216919.6a317754437ea.jpg',
   '831c0f251216919.6a317754405b2.gif','39e8d9251216919.6a317754431e4.gif','69f2f3251216919.6a31775443e0b.gif','f88ebc251216919.6a317754419bb.jpg','b5be4e251216919.6a31775441fda.jpg',
   'c781ce251216919.6a31775440c65.gif','209f20251216919.6a31775444a2f.jpg','310d47251216919.6a31775441392.jpg','286e80251216919.6a3177544443f.gif']],
}

sys.path.insert(0, str(S)); from specs2 import SPECS2; SPECS.update(SPECS2)

LOOPW = {'ideatic-social': 1080, 'boat-lifestyle': 1200}  # long 2019-21 social GIFs: narrower clips, no visible loss

def run(*a): return subprocess.run([str(x) for x in a], capture_output=True, text=True).stdout
def dims(p):
    w, h = re.findall(r'pixel\w+: (\d+)', run('sips', '-g', 'pixelWidth', '-g', 'pixelHeight', p)); return int(w), int(h)

def fetch(id):
    out = S / 'dl' / id; out.parent.mkdir(exist_ok=True)
    if out.exists() and out.stat().st_size > 1000: return out
    for size in ['source', 'max_3840', '1400']:
        code = run('curl', '-s', '-A', UA, '-o', out, '-w', '%{http_code}', CDN + size + '/' + id)
        if code == '200' and out.stat().st_size > 1000: return out
    raise SystemExit('download failed ' + id)

def process(slug):
    d = P / 'assets' / 'cases' / slug; d.mkdir(parents=True, exist_ok=True)
    ids = [b[1] for b in SPECS[slug] if b[0] == 'i'] + [x for b in SPECS[slug] if b[0] == 'g' for r in b[1] for x in r]
    with cf.ThreadPoolExecutor(8) as ex: list(ex.map(fetch, ids))
    blocks, n = [], 0
    for b in SPECS[slug]:
        if b[0] == 'g':  # grid rows: tiles at most 900px wide
            rows = []
            for r in b[1]:
                row = []
                for id in r:
                    n += 1; out = d / f'{n:02d}.jpg'
                    w, h = dims(S / 'dl' / id)
                    run('sips', '-s', 'format', 'jpeg', '--resampleWidth', str(min(w, 900)), '-s', 'formatOptions', '80', S / 'dl' / id, '--out', out)
                    w2, h2 = dims(out); row.append([f'assets/cases/{slug}/{out.name}', w2, h2])
                rows.append(row)
            blocks.append(['g', rows]); continue
        if b[0] == 'vm':  # Vimeo: thumbnail + size from oEmbed, player loads on tap
            meta = json.loads(run('curl', '-s', f'https://vimeo.com/api/oembed.json?url=https://vimeo.com/{b[1]}&width=1400'))
            thumb = d / f'vm-{b[1]}.jpg'
            run('curl', '-s', '-o', thumb, meta['thumbnail_url'].replace('_1280', '_1400'))
            if not thumb.exists() or thumb.stat().st_size < 2000: run('curl', '-s', '-o', thumb, meta['thumbnail_url'])
            run('sips', '-s', 'formatOptions', '78', thumb)
            blocks.append(['vm', b[1], f'assets/cases/{slug}/{thumb.name}', meta['width'], meta['height'], meta['title']]); continue
        if b[0] != 'i': blocks.append(list(b)); continue
        n += 1; src = S / 'dl' / b[1]; base = d / f'{n:02d}'
        if b[1].endswith('.gif'):
            r = run(S / 'gif2mp4', src, f'{base}.mp4', f'{base}.jpg', LOOPW.get(slug, 1400)).strip()
            w, h = dims(f'{base}.jpg')
            blocks.append(['v', f'assets/cases/{slug}/{n:02d}.mp4', f'assets/cases/{slug}/{n:02d}.jpg', w, h]); print(slug, n, 'gif', r)
            continue
        w, h = dims(src)
        narrow = w if w < 1380 else None  # Behance shows narrower images at their own width, centred
        tmp = S / 'dl' / f'{slug}-{n:02d}.jpg'
        run('sips', '-s', 'format', 'jpeg', '--resampleWidth', str(min(w, 1600)), '-s', 'formatOptions', '82', src, '--out', tmp)
        w2, h2 = dims(tmp)
        if h2 > 2600:  # slice tall images so phones never decode one huge bitmap
            out = run(S / 'slice', tmp, d, f'{n:02d}', 1600).split('\n')
            parts = sorted(d.glob(f'{n:02d}-*.jpg'))
            for p in parts:
                pw, ph = dims(p); blocks.append(['i', f'assets/cases/{slug}/{p.name}', pw, ph])
            print(slug, n, 'sliced', len(parts))
        else:
            tmp.replace(f'{base}.jpg'); blocks.append(['i', f'assets/cases/{slug}/{n:02d}.jpg', w2, h2] + ([narrow] if narrow else []))
    (d / 'manifest.json').write_text(json.dumps(blocks, indent=0))
    print(slug, 'done', len(blocks), 'blocks', run('du', '-sh', d).split()[0])

for slug in (sys.argv[1:] or SPECS): process(slug)
