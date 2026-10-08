import { Program, Mesh, Texture } from '../../vendor/ogl.mjs';

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

// Hover: cursor-centred ripple + slight zoom + chromatic split.
// Scroll: velocity smears the image vertically and splits RGB (works on touch too).
// Reveal: image wipes in top-to-bottom while settling from a 1.25x zoom.
const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform vec2 uImage;
  uniform vec2 uPlane;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform float uVel;
  uniform float uReveal;
  uniform float uRadius;
  varying vec2 vUv;

  vec2 cover(vec2 uv, vec2 plane, vec2 img) {
    float pr = plane.x / plane.y;
    float ir = img.x / img.y;
    vec2 s = pr > ir ? vec2(1.0, ir / pr) : vec2(pr / ir, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    float aspect = uPlane.x / uPlane.y;
    vec2 uv = vUv;

    // reveal: settle zoom
    uv = (uv - 0.5) / (1.0 + (1.0 - uReveal) * 0.25) + 0.5;
    // hover zoom
    uv = (uv - 0.5) * (1.0 - 0.07 * uHover) + 0.5;

    // ripple from cursor
    vec2 d = (vUv - uMouse) * vec2(aspect, 1.0);
    float dist = length(d);
    vec2 dir = d / max(dist, 0.0001);
    float ripple = sin(dist * 30.0 - uTime * 4.0) * exp(-dist * 3.2) * uHover;
    uv += dir * ripple * 0.014;

    // scroll smear
    float v = clamp(uVel * 0.012, -0.12, 0.12);
    uv.y += (vUv.x - 0.5) * v * 0.35;
    uv.y -= v * 0.25;

    vec2 c = cover(uv, uPlane, uImage);
    float ca = uHover * 0.006 + abs(uVel) * 0.00035;
    vec2 off = dir * ca + vec2(0.0, ca * 0.6);
    vec3 col = vec3(
      texture2D(tMap, cover(uv + off, uPlane, uImage)).r,
      texture2D(tMap, c).g,
      texture2D(tMap, cover(uv - off, uPlane, uImage)).b
    );

    col *= mix(0.88, 1.0, uHover);

    float a = step(1.0 - uReveal, vUv.y);

    // rounded corners (SDF in CSS px, matches the DOM border-radius)
    vec2 q = abs((vUv - 0.5) * uPlane) - uPlane * 0.5 + uRadius;
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    a *= 1.0 - smoothstep(-1.0, 0.5, sd);

    gl_FragColor = vec4(col, a);
  }
`;

export class CardPlane {
  constructor(stage, el, src) {
    const gl = stage.gl;
    this.el = el;
    this.ready = false;

    this.texture = new Texture(gl, { generateMipmaps: true });
    this.program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        tMap: { value: this.texture },
        uImage: { value: [1, 1] },
        uPlane: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uHover: { value: 0 },
        uTime: { value: 0 },
        uVel: { value: 0 },
        uReveal: { value: 0 },
        uRadius: { value: 14 },
      },
    });
    this.mesh = new Mesh(gl, { geometry: stage.plane, program: this.program });
    this.mesh.setParent(stage.scene);
    this.mesh.visible = false;

    this.hover = 0;
    this.hoverTarget = 0;
    this.mouse = [0.5, 0.5];
    this.mouseTarget = [0.5, 0.5];
    this.reveal = this.program.uniforms.uReveal; // tweened from outside

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      this.texture.image = img;
      this.program.uniforms.uImage.value = [img.naturalWidth, img.naturalHeight];
      this.ready = true;
      el.classList.add('is-gl'); // hides the DOM <img>; the plane takes over
    };
    img.src = src;

    // hover is only meaningful with a real pointer
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      el.addEventListener('pointerenter', () => (this.hoverTarget = 1));
      el.addEventListener('pointerleave', () => (this.hoverTarget = 0));
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        this.mouseTarget = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
      });
    }
  }

  update(rect, stage) {
    this.hover += (this.hoverTarget - this.hover) * 0.09;
    this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * 0.18;
    this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * 0.18;

    const u = this.program.uniforms;
    u.uPlane.value = [rect.width, rect.height];
    u.uMouse.value = this.mouse;
    u.uHover.value = this.hover;
    u.uTime.value = stage.time;
    u.uVel.value = stage.velocity;
  }
}
