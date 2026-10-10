import { Program, Mesh } from '../../vendor/ogl.mjs';
import { PAD } from './logoMask.js';

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

// "Liquid glass" in screen space, extruded into a thick slab.
//  1. Depth: the silhouette is stacked behind itself along uTilt (STEPS slices), so where the front face
//     isn't, the nearest slice that is shows as a side wall at that depth. uTilt sways slowly on its own
//     and leans with the cursor, so the slab reads as a real object turning in front of you.
//  2. Front face: tHeight is read as a surface; its gradient gives a normal, so each stroke is a rounded
//     bar of thick glass. The rim goes dark (light escaping out of the sides, as in real thick glass).
//  3. The live background (tBack, the offscreen chrome field) is sampled through that normal, once per
//     colour channel at slightly different strengths = refraction + dispersion.
//  4. Two moving key lights give specular highlights; fresnel + a small studio environment give the
//     sheen, and a thin spectral band rides the side walls.
const fragment = (steps) => /* glsl */ `
  precision highp float;
  uniform sampler2D tMask;
  uniform sampler2D tHeight;
  uniform sampler2D tBack;
  uniform vec2 uRes;
  uniform vec2 uMouse;     // -1..1 across the logo, smoothed
  uniform vec2 uTilt;      // extrusion direction (uv), length ~ how far the slab is turned
  uniform float uDepth;    // slab thickness in uv
  uniform float uTime;
  uniform float uForm;     // 0 = molten blob, 1 = fully formed glass
  uniform float uTexel;    // 1 / height-map size
  uniform float uScale;    // logo size relative to the viewport; keeps refraction proportional
  varying vec2 vUv;

  const int STEPS = ${steps};

  float COV(vec2 uv) { return smoothstep(0.38, 0.62, texture2D(tMask, uv).r); }

  float H(vec2 uv) {
    vec3 h = texture2D(tHeight, uv).rgb;
    return h.r * 0.30 + h.g * 0.42 + h.b * 0.55;
  }

  vec3 backdrop(vec2 suv, float radius) {
    vec3 c = texture2D(tBack, suv).rgb * 0.36;
    for (int i = 0; i < 8; i++) {
      float a = 0.785398 * float(i);
      c += texture2D(tBack, suv + vec2(cos(a), sin(a)) * radius).rgb * 0.08;
    }
    return c;
  }

  vec3 spectrum(float t) { return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67))); }

  void main() {
    float front = COV(vUv);
    vec2 suv = gl_FragCoord.xy / uRes;
    float depth = uDepth * mix(0.25, 1.0, uForm);

    // --- side walls: the first slice behind this pixel that is inside the shape
    // (depth of the first slice past half coverage; alpha from the strongest slice, so the wall's outline is
    //  anti-aliased instead of stepping)
    float wall = 0.0;
    float wd = 1.0;
    if (front < 0.98) {
      for (int i = 1; i <= STEPS; i++) {
        float k = float(i) / float(STEPS);
        float c = COV(vUv + uTilt * depth * k);
        if (c > 0.5 && wd > k) wd = k;
        wall = max(wall, c);
      }
    }
    if (front < 0.003 && wall < 0.003) { gl_FragColor = vec4(0.0); return; }

    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 L1 = normalize(vec3(-0.55 + uMouse.x * 0.45 + 0.12 * sin(uTime * 0.5), 0.70 + uMouse.y * 0.30, 0.55));
    vec3 L2 = normalize(vec3(0.62 - uMouse.x * 0.2, -0.58, 0.45));

    // --- front face
    vec3 faceCol = vec3(0.0);
    if (front > 0.003) {
      vec2 e = vec2(uTexel);
      float hc = H(vUv);
      float dx = H(vUv + vec2(e.x, 0.0)) - H(vUv - vec2(e.x, 0.0));
      float dy = H(vUv + vec2(0.0, e.y)) - H(vUv - vec2(0.0, e.y));
      float bump = 17.0 * mix(0.35, 1.0, uForm);
      vec3 N = normalize(vec3(-dx * bump, -dy * bump, 1.0));
      // the whole slab is turned: lean the face with it, and toward the cursor
      N = normalize(N + vec3(-uTilt * 0.22 + uMouse * 0.08, 0.0) * (0.35 + hc));

      float strength = (0.07 + (1.0 - uForm) * 0.30) * (0.55 + hc * 1.1) * uScale;
      vec2 off = N.xy * strength;
      float blurR = (0.0018 + (1.0 - uForm) * 0.01) * max(uScale, 0.5);
      vec3 back;
      back.r = backdrop(suv - off * 1.00, blurR).r;
      back.g = backdrop(suv - off * 1.10, blurR).g;
      back.b = backdrop(suv - off * 1.21, blurR).b;

      float s1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 70.0);
      float s2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 40.0) * 0.6;
      float fres = pow(1.0 - max(N.z, 0.0), 1.5);
      vec3 R = reflect(-V, N);
      float env = 0.55 * smoothstep(-0.1, 0.9, R.y) + 0.4 * smoothstep(0.15, 0.95, R.x * 0.7 + R.y * 0.5);

      // thick glass: the bevel darkens toward the rim, the core stays clear and bright
      float rim = smoothstep(0.42, 0.04, hc);
      faceCol = back * mix(1.0, 0.42, rim);
      faceCol += vec3(0.80, 0.88, 1.0) * env * (0.12 + fres * 0.95);
      faceCol += spectrum(fres * 1.2 + uTime * 0.03) * fres * fres * 0.45;
      faceCol += vec3(1.0) * (s1 * 2.1 + s2 * 1.3);
      faceCol += vec3(0.07, 0.076, 0.088);
    }

    // --- side wall: darker refracted chrome, a spectral band along the depth, bright near the front edge
    vec3 wallCol = vec3(0.0);
    if (wall > 0.003) {
      vec2 off = uTilt * (0.03 + wd * 0.05) * uScale;
      vec3 back = backdrop(suv + off, 0.004);
      float edge = exp(-wd * 9.0);              // the front lip catches the light
      float backEdge = exp(-(1.0 - wd) * 14.0); // and so does the far edge, faintly
      // smoky glass: mostly the refracted chrome, darkening with depth; colour only as a thin band near the lip
      wallCol = back * (0.45 + 0.35 * (1.0 - wd));
      wallCol += vec3(0.16, 0.17, 0.19) * (1.0 - wd * 0.6);               // the glass body itself
      wallCol += spectrum(0.15 + wd * 0.5 + uTime * 0.04 + dot(vUv, vec2(1.3, 0.7))) * (0.1 + edge * 0.38);
      wallCol += vec3(0.9, 0.94, 1.0) * (edge * 0.75 + backEdge * 0.22);
    }

    vec3 col = mix(wallCol, faceCol, front);
    float alpha = max(front, wall * (1.0 - front));
    gl_FragColor = vec4(col, alpha * uForm);
  }
`;

export class GlassLogo {
  constructor(stage, el, textures, { reduced = false } = {}) {
    this.el = el;
    this.ready = true;
    this.z = 1; // in front of the background blit
    this.reduced = reduced;

    this.program = new Program(stage.gl, {
      vertex,
      // side-wall slices: fewer on touch devices (phone GPUs), where the logo is also smaller
      fragment: fragment(window.matchMedia('(hover: none), (pointer: coarse)').matches ? 24 : 48),
      transparent: true,
      depthTest: false,
      uniforms: {
        tMask: { value: textures.tMask },
        tHeight: { value: textures.tHeight },
        tBack: { value: null },
        uRes: { value: [1, 1] },
        uMouse: { value: [0, 0] },
        uTilt: { value: [0, 0] },
        uDepth: { value: 0.07 },
        uTime: { value: 0 },
        uForm: { value: reduced ? 1 : 0 },
        uTexel: { value: 1 / textures.heightSize },
        uScale: { value: 1 },
      },
    });
    this.mesh = new Mesh(stage.gl, { geometry: stage.plane, program: this.program });
    this.mesh.setParent(stage.scene);
    this.form = this.program.uniforms.uForm; // tweened from outside

    this.mouse = [0, 0];
    this.mouseTarget = [0, 0];
    if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        this.mouseTarget = [
          Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.5))),
          Math.max(-1, Math.min(1, -(e.clientY - cy) / (window.innerHeight * 0.5))),
        ];
      });
    }
  }

  update(rect, stage) {
    this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * 0.06;
    this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * 0.06;

    // the textures carry extra margin (PAD) for the side walls: grow the quad so the glyph keeps its size
    const k = PAD / 1.22;
    this.mesh.scale.set(rect.width * k, rect.height * k, 1);

    // slow idle sway (a slab turning in the air) + lean toward the cursor; points to where the back face sits
    const t = this.reduced ? 2 : stage.time;
    const tilt = this.program.uniforms.uTilt.value;
    tilt[0] = Math.sin(t * 0.42) * 0.55 + Math.sin(t * 0.17) * 0.25 - this.mouse[0] * 0.75;
    tilt[1] = -0.55 + Math.cos(t * 0.33) * 0.3 - this.mouse[1] * 0.6;

    // idle float
    if (!this.reduced) this.mesh.position.y += Math.sin(stage.time * 0.7) * 5;

    const u = this.program.uniforms;
    u.tBack.value = stage.target.texture;
    u.uRes.value = [stage.pxW, stage.pxH];
    u.uMouse.value = this.mouse;
    u.uScale.value = Math.min(1.2, Math.max(0.6, rect.height / (stage.H * 0.6)));
    u.uTime.value = this.reduced ? 3 : stage.time;
  }
}
