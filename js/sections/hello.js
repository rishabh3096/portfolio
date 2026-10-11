// About page opener: "Hi, I'm Rish." and pieces of the tools I work in fall into the first screen and pile
// up (after mariajoaoabrantes.work/about). Each piece is plain HTML/SVG drawn in the style of that app's UI
// (Photoshop toolbar, After Effects timeline, Premiere clips, Illustrator bezier, Figma selection, Blender
// gizmo…), simulated as a rigid body with Matter.js (vendor/matter.min.js). Desktop: grab and throw them.
// The app icons are the real ones, taken from the installed apps (assets/tools).
// Touch: tap one to flick it (dragging would fight the page scroll). The simulation sleeps when everything
// has settled and pauses when the section is off screen.

const I = {
  move: '<path d="M7 3v14l3.5-3.5L13 19l2-1-2.5-5.5H17z"/>',
  marquee: '<rect x="4" y="5" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.4 2"/>',
  lasso: '<path d="M11 4c4.5 0 8 2 8 5s-3.5 5-8 5c-1.5 0-3-.3-4-.8M4 10c0-1.4 1-2.7 2.6-3.6M7 14c-1.2 1-1.6 2.4-.8 3.6.8 1.2 2.6 1.4 3.8.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  brush: '<path d="M18.5 3.5c1 1-5.5 9-7.5 10.5l-1.7-1.7C10.8 10.3 17.5 2.5 18.5 3.5zM8.6 13.2l1.9 1.9c-.3 2.6-2.4 4.4-6 3.9 1.7-1.3 1.3-4.5 4.1-5.8z"/>',
  pen: '<path d="M11 3l5 9-3 7H9l-3-7zM11 3v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="11" cy="12" r="1.4"/>',
  type: '<path d="M5 5h12v3h-1.6l-.5-1.4H12V17h1.6v1.6H8.4V17H10V6.6H7.1L6.6 8H5z"/>',
  eye: '<path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.4"/>',
};
const svg = (d, vb = '0 0 22 22') => `<svg viewBox="${vb}" aria-hidden="true" fill="currentColor">${d}</svg>`;

// [html, modifier]. Order is the drop order; the phone subset is marked with `m`.
const PIECES = [
  { m: 1, cls: 'icon', html: '<img src="assets/tools/ps.png" alt="" draggable="false" />' },
  { m: 1, cls: 'ae', html: `<div class="pc-ae__top"><span>0;00;02;12</span><i></i></div>
      <div class="pc-ae__row"><em style="--c:#e9a43a"></em><span>Logo reveal</span><s style="left:28%"></s><s style="left:58%"></s></div>
      <div class="pc-ae__row"><em style="--c:#4fb3d9"></em><span>Glow</span><s style="left:40%"></s><s style="left:84%"></s></div>
      <div class="pc-ae__row"><em style="--c:#b88cf0"></em><span>Camera</span><s style="left:18%"></s><s style="left:70%"></s></div>
      <div class="pc-ae__head"></div>` },
  { m: 1, cls: 'pill', html: 'Motion design' },
  { m: 1, cls: 'icon', html: '<img src="assets/tools/ae.png" alt="" draggable="false" />' },
  { m: 1, cls: 'pstools', html: [I.move, I.marquee, I.lasso, I.brush, I.pen, I.type].map((d) => svg(d)).join('') },
  { m: 1, cls: 'figma', html: '<span class="pc-figma__name">Frame 1</span><i></i><i></i><i></i><i></i><span class="pc-figma__size">1440 × 1024</span>' },
  { m: 0, cls: 'pill', html: 'Key visuals' },
  { m: 1, cls: 'icon', html: '<img src="assets/tools/ai.png" alt="" draggable="false" />' },
  { m: 1, cls: 'bezier', html: '<svg viewBox="0 0 160 100" aria-hidden="true"><path class="h" d="M22 78 L52 18 M128 22 L98 82"/><path class="c" d="M22 78 C52 18 98 82 128 22"/><rect x="18" y="74" width="8" height="8"/><rect x="124" y="18" width="8" height="8"/><circle cx="52" cy="18" r="3.5"/><circle cx="98" cy="82" r="3.5"/></svg>' },
  { m: 0, cls: 'pr', html: '<span style="--c:#7d6bd6;flex:3">V1</span><span style="--c:#4aa59a;flex:2">B-roll</span><span style="--c:#d36aa6;flex:2.4">Titles</span>' },
  { m: 1, cls: 'icon', html: '<img src="assets/tools/blender.png" alt="" draggable="false" />' },
  { m: 1, cls: 'gizmo', html: '<svg viewBox="0 0 100 100" aria-hidden="true"><line x1="50" y1="50" x2="84" y2="58" stroke="#f04a5d"/><line x1="50" y1="50" x2="30" y2="70" stroke="#7ec431"/><line x1="50" y1="50" x2="50" y2="14" stroke="#4d8cf0"/><circle cx="84" cy="58" r="9" fill="#f04a5d"/><circle cx="30" cy="70" r="9" fill="#7ec431"/><circle cx="50" cy="14" r="9" fill="#4d8cf0"/><text x="84" y="61.5">X</text><text x="30" y="73.5">Y</text><text x="50" y="17.5">Z</text></svg>' },
  { m: 1, cls: 'icon', html: '<img src="assets/tools/pr.png" alt="" draggable="false" />' },
  { m: 1, cls: 'icon', html: '<img src="assets/tools/capcut.png" alt="" draggable="false" />' },
  { m: 1, cls: 'cursor', html: `${svg('<path d="M3 2l14 6.5-6.2 1.6L8 17z"/>', '0 0 20 20')}<span>Rish</span>` },
  { m: 0, cls: 'layers', html: `<div>${svg(I.eye, '0 0 20 20')}<i style="--t:linear-gradient(135deg,#ff6b3d,#ffc23d)"></i><span>Glow</span></div>
      <div>${svg(I.eye, '0 0 20 20')}<i style="--t:rgba(0,0,0,0.35)"></i><span>Product</span></div>
      <div>${svg(I.eye, '0 0 20 20')}<i style="--t:rgba(255,255,255,0.22)"></i><span>Background</span></div>` },
  { m: 1, cls: 'pill', html: 'Brand identity' },
  { m: 1, cls: 'cube', html: '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="t" d="M50 12 86 31 50 50 14 31z"/><path class="l" d="M14 31 50 50v38L14 69z"/><path class="r" d="M86 31 50 50v38l36-19z"/><path class="o" d="M50 12 86 31v38L50 88 14 69V31z M14 31 50 50 86 31 M50 50v38"/></svg>' },
  { m: 0, cls: 'icon', html: '<img src="assets/tools/id.png" alt="" draggable="false" />' },
  { m: 1, cls: 'icon pc-icon--round', html: '<img src="assets/tools/serato.png" alt="" draggable="false" />', circle: 1 },
  { m: 1, cls: 'swatch', html: '<i></i><i></i>' },
  { m: 0, cls: 'graph', html: '<svg viewBox="0 0 140 90" aria-hidden="true"><path class="g" d="M10 80 H130 M10 10 V80"/><path class="c" d="M12 78 C52 78 58 14 70 14 S88 78 128 78"/></svg><span>Easy ease</span>' },
  { m: 1, cls: 'pill', html: 'Launch films' },
  { m: 0, cls: 'pill', html: '3D' },
  { m: 0, cls: 'pill', html: 'Art direction' },
];

export function initHello({ root, reduced }) {
  const Matter = window.Matter;
  if (!root || !Matter) return;
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Sleeping } = Matter;
  const pit = root.querySelector('.hello__pit');
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const phone = window.innerWidth < 700;
  const list = phone ? PIECES.filter((p) => p.m) : PIECES;

  // build the pieces (hidden above the pit until they drop)
  const pieces = list.map((p) => {
    const el = document.createElement('div');
    el.className = `pc pc-${p.cls}`;
    if (p.style) el.style.cssText = p.style;
    el.innerHTML = p.html;
    el.setAttribute('aria-hidden', 'true');
    pit.append(el);
    return { el, circle: !!p.circle };
  });

  // extra solver iterations: with the defaults, small pieces got squeezed through the floor under the pile
  const engine = Engine.create({ enableSleeping: true, positionIterations: 12, velocityIterations: 10, constraintIterations: 4 });
  engine.gravity.y = 1.1;
  let W = pit.clientWidth, H = pit.clientHeight;
  const T = 400; // wall thickness
  const walls = [
    Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),
    Bodies.rectangle(-T / 2, H / 2, T, H * 4, { isStatic: true }),
    Bodies.rectangle(W + T / 2, H / 2, T, H * 4, { isStatic: true }),
  ];
  Composite.add(engine.world, walls);

  const place = () => {
    W = pit.clientWidth;
    H = pit.clientHeight;
    Body.setPosition(walls[0], { x: W / 2, y: H + T / 2 });
    Body.setPosition(walls[1], { x: -T / 2, y: H / 2 });
    Body.setPosition(walls[2], { x: W + T / 2, y: H / 2 });
  };

  // one body per piece, sized from its rendered box
  const rand = (a, b) => a + Math.random() * (b - a);
  const spawn = (pc, i) => {
    const w = pc.el.offsetWidth, h = pc.el.offsetHeight;
    pc.w = w;
    pc.h = h;
    const r = parseFloat(getComputedStyle(pc.el).borderRadius) || 6;
    const x0 = rand(w / 2 + 8, W - w / 2 - 8), y0 = -h - i * 70 - rand(0, 120);
    const opts = {
      angle: rand(-0.5, 0.5),
      restitution: 0.18,
      friction: 0.55,
      frictionAir: 0.012,
      density: 0.0018,
    };
    pc.body = pc.circle
      ? Bodies.circle(x0, y0, w / 2, opts)
      : Bodies.rectangle(x0, y0, w, h, { ...opts, chamfer: { radius: Math.min(r, w / 2 - 1, h / 2 - 1) } });
    pc.body.plugin.el = pc.el;
    Composite.add(engine.world, pc.body);
  };

  const draw = () => {
    for (const pc of pieces) {
      if (!pc.body) continue;
      const { x, y } = pc.body.position;
      pc.el.style.transform = `translate3d(${(x - pc.w / 2).toFixed(1)}px,${(y - pc.h / 2).toFixed(1)}px,0) rotate(${pc.body.angle.toFixed(4)}rad)`;
    }
  };

  // reduced motion: settle the pile instantly, draw it once, no loop
  if (reduced) {
    pieces.forEach(spawn);
    for (let i = 0; i < 600; i++) Engine.update(engine, 1000 / 60);
    pieces.forEach((pc) => pc.el.classList.add('is-in'));
    draw();
    return;
  }

  // desktop: grab and throw (Matter's mouse, minus its wheel handler so the page still scrolls)
  if (!touch) {
    const mouse = Mouse.create(pit);
    mouse.element.removeEventListener('wheel', mouse.mousewheel);
    mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
    Composite.add(engine.world, mc);
    Events.on(mc, 'startdrag', (e) => e.body.plugin.el?.classList.add('is-held'));
    Events.on(mc, 'enddrag', (e) => e.body.plugin.el?.classList.remove('is-held'));
  } else {
    // touch: a tap flicks the piece up and spins it
    pit.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.pc');
      const pc = el && pieces.find((p) => p.el === el);
      if (!pc?.body) return;
      Sleeping.set(pc.body, false);
      Body.setVelocity(pc.body, { x: rand(-6, 6), y: rand(-16, -11) });
      Body.setAngularVelocity(pc.body, rand(-0.25, 0.25));
      wake();
    });
  }

  // loop: runs while the section is on screen and something is still moving
  let running = false, visible = true, last = 0;
  const step = (now) => {
    if (!running) return;
    const dt = Math.min(32, now - (last || now)) || 16.7;
    last = now;
    Engine.update(engine, dt);
    draw();
    const settled = pieces.every((pc) => pc.body && (pc.body.isSleeping || pc.body.speed < 0.02)) && spawned === pieces.length;
    if (!visible || settled) {
      running = false;
      last = 0;
      return;
    }
    requestAnimationFrame(step);
  };
  const wake = () => {
    if (running || !visible) return;
    running = true;
    requestAnimationFrame(step);
  };
  pit.addEventListener('mousedown', wake);
  pit.addEventListener('mousemove', () => engine.world.bodies.some((b) => !b.isStatic && !b.isSleeping) && wake());

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  }).observe(root);

  // drop them in one after another, once the section is properly in view (at the top of About that's
  // straight away; on the home page it waits until you scroll down to it)
  let spawned = 0;
  const drop = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      drop.disconnect();
      setTimeout(() => {
        pieces.forEach((pc, i) =>
          setTimeout(() => {
            spawn(pc, 0);
            pc.el.classList.add('is-in');
            spawned++;
            wake();
          }, i * (phone ? 150 : 120))
        );
      }, 450);
    },
    { threshold: 0.45 }
  );
  drop.observe(root);

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      place();
      pieces.forEach((pc) => pc.body && Sleeping.set(pc.body, false));
      wake();
    }, 150);
  });
}
