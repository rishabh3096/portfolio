import { Program, Mesh } from '../../vendor/ogl.mjs';

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Liquid chrome: a warped distance field is turned into thin bright ridges, and each colour
// channel samples the ridge at a slightly different phase. Where the channels disagree you get
// the spectral fringe (blue on one flank, orange on the other, white where they overlap), the
// same optical effect as light dispersing through polished metal.
const flow = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uPlane;
  uniform vec2 uMouse;
  uniform float uMouseS;
  uniform float uIntro;
  uniform float uVel;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(11.7, 7.3);
      a *= 0.5;
    }
    return v;
  }
  // a "sheet" of polished metal: soft ramp up to a bright crest, then a hard fall-off.
  // Each colour channel crests at a slightly different place, which paints the spectral edge.
  float sheet(float x) {
    float s = fract(x);
    return pow(s, 5.0) * (1.0 - smoothstep(0.78, 0.995, s));
  }
  float crest(float x) {
    float e = (fract(x) - 0.93) / 0.035;
    return exp(-e * e);
  }

  void main() {
    float aspect = uPlane.x / uPlane.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.2;
    vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0) * 2.2;

    // the cursor gently bends the metal toward itself (a soft lens, not a swirl)
    vec2 dm = p - m;
    float sw = exp(-dot(dm, dm) * 1.4) * uMouseS;
    p -= dm * 0.05 * sw;

    float t = uTime * 0.045;

    // one slow, breathing warp: low frequency so the sheets stay smooth and sweeping
    vec2 w = p + 0.22 * vec2(fbm(p * 0.55 + vec2(0.0, t)), fbm(p * 0.55 + vec2(3.1, 1.7) - t)) - 0.11;

    // sheets radiate from a far-off source in the upper left and drift outward
    vec2 c = vec2(-2.1 + 0.3 * sin(t * 0.7), 1.5 + 0.25 * cos(t * 0.6));
    float d = length(w - c);
    float h = d * 0.5 - t * 0.55;

    float disp = 0.02;
    vec3 sh = vec3(sheet(h - disp), sheet(h), sheet(h + disp));
    float halo = pow(0.5 + 0.5 * cos(6.2831853 * (h - 0.07)), 3.0) * 0.045;

    vec3 col = (sh * 1.55 + vec3(crest(h)) * 0.12 + vec3(halo * 0.7, halo * 0.8, halo)) * uIntro;

    // filmic roll-off keeps highlights bright but never clipped flat
    col = 1.0 - exp(-col * 1.5);

    // quieter palette: pull colour toward silver so only a hint of the spectral edge remains
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, 0.58) * 0.9;

    vec3 ink = vec3(0.039, 0.039, 0.043);
    col = max(col, ink);

    float vg = smoothstep(1.4, 0.3, length((vUv - 0.5) * vec2(aspect * 0.55, 1.0)));
    col *= mix(0.6, 1.0, vg);

    col += (hash(vUv * uPlane + uTime) - 0.5) * 0.025;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// draws the offscreen background texture to the screen, 1:1 in device pixels
const blit = /* glsl */ `
  precision highp float;
  uniform sampler2D tBack;
  uniform vec2 uRes;
  void main() {
    gl_FragColor = vec4(texture2D(tBack, gl_FragCoord.xy / uRes).rgb, 1.0);
  }
`;

// Rendered into stage.target (offscreen)
export class FlowBackground {
  constructor(stage, el, { reduced = false } = {}) {
    this.el = el;
    this.layer = 'bg';
    this.ready = true;
    this.reduced = reduced;

    this.program = new Program(stage.gl, {
      vertex,
      fragment: flow,
      uniforms: {
        uTime: { value: 0 },
        uPlane: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uMouseS: { value: 0 },
        uIntro: { value: reduced ? 1 : 0 },
        uVel: { value: 0 },
      },
    });
    this.mesh = new Mesh(stage.gl, { geometry: stage.plane, program: this.program });
    this.mesh.setParent(stage.bgScene);
    this.intro = this.program.uniforms.uIntro; // tweened from outside

    this.mouse = [0.5, 0.5];
    this.mouseTarget = [0.5, 0.5];
    this.strength = 0;
    this.strengthTarget = 0;

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        this.mouseTarget = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
        this.strengthTarget = 1;
      });
      el.addEventListener('pointerleave', () => (this.strengthTarget = 0));
    }
  }

  update(rect, stage) {
    this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * 0.06;
    this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * 0.06;
    this.strength += (this.strengthTarget - this.strength) * 0.05;

    const u = this.program.uniforms;
    u.uPlane.value = [rect.width, rect.height];
    u.uMouse.value = this.mouse;
    u.uMouseS.value = this.reduced ? 0 : this.strength;
    u.uVel.value = stage.velocity;
    u.uTime.value = this.reduced ? 20 : stage.time;
  }
}

// Shown on screen: a copy of what FlowBackground rendered
export class HeroBlit {
  constructor(stage, el) {
    this.el = el;
    this.ready = true;
    this.program = new Program(stage.gl, {
      vertex,
      fragment: blit,
      uniforms: { tBack: { value: null }, uRes: { value: [1, 1] } },
    });
    this.mesh = new Mesh(stage.gl, { geometry: stage.plane, program: this.program });
    this.mesh.setParent(stage.scene);
  }
  update(rect, stage) {
    const u = this.program.uniforms;
    u.tBack.value = stage.target.texture;
    u.uRes.value = [stage.pxW, stage.pxH];
  }
}
