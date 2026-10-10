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

// "Liquid glass" in screen space.
//  1. tHeight is read as a surface: its gradient gives a normal, so every stroke behaves like a
//     rounded bar of thick glass (flat in the middle, steep at the rim).
//  2. The live background (tBack, the offscreen chrome field) is sampled through that normal,
//     once per colour channel at slightly different strengths = refraction + dispersion.
//  3. Two moving key lights give specular edge highlights; a fresnel term and a tiny studio
//     environment give the sheen that makes it read as glass even over black.
const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMask;
  uniform sampler2D tHeight;
  uniform sampler2D tBack;
  uniform vec2 uRes;
  uniform vec2 uMouse;     // -1..1 across the logo, smoothed
  uniform float uTime;
  uniform float uForm;     // 0 = molten blob, 1 = fully formed glass
  uniform float uTexel;    // 1 / height-map size
  uniform float uScale;    // logo size relative to the viewport; keeps refraction proportional
  varying vec2 vUv;

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

  void main() {
    float m = texture2D(tMask, vUv).r;
    float cover = smoothstep(0.38, 0.62, m);
    if (cover < 0.003) { gl_FragColor = vec4(0.0); return; }

    // --- surface normal from the height field
    vec2 e = vec2(uTexel);
    float hc = H(vUv);
    float dx = H(vUv + vec2(e.x, 0.0)) - H(vUv - vec2(e.x, 0.0));
    float dy = H(vUv + vec2(0.0, e.y)) - H(vUv - vec2(0.0, e.y));
    float bump = 15.0 * mix(0.35, 1.0, uForm);
    vec3 N = normalize(vec3(-dx * bump, -dy * bump, 1.0));
    // tilt with the cursor: the glass leans toward you
    N = normalize(N + vec3(uMouse.x * 0.10, uMouse.y * 0.10, 0.0) * (0.3 + hc));

    // --- refraction + dispersion
    vec2 suv = gl_FragCoord.xy / uRes;
    float strength = (0.05 + (1.0 - uForm) * 0.30) * (0.6 + hc * 0.8) * uScale;
    vec2 off = N.xy * strength;
    float blurR = (0.0016 + (1.0 - uForm) * 0.01) * max(uScale, 0.5);
    vec3 back;
    back.r = backdrop(suv - off * 1.00, blurR).r;
    back.g = backdrop(suv - off * 1.09, blurR).g;
    back.b = backdrop(suv - off * 1.18, blurR).b;

    // --- lighting
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 L1 = normalize(vec3(-0.55 + uMouse.x * 0.45 + 0.12 * sin(uTime * 0.5),
                              0.70 + uMouse.y * 0.30, 0.55));
    vec3 L2 = normalize(vec3(0.62 - uMouse.x * 0.2, -0.58, 0.45));
    float s1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 64.0);
    float s2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 46.0) * 0.55;
    float fres = pow(1.0 - max(N.z, 0.0), 1.6);

    vec3 R = reflect(-V, N);
    float env = 0.55 * smoothstep(-0.1, 0.9, R.y) + 0.4 * smoothstep(0.15, 0.95, R.x * 0.7 + R.y * 0.5);

    // iridescent rim: a thin spectral shift riding the fresnel term
    vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fres * 1.1 + vec3(0.0, 0.33, 0.67) + uTime * 0.03));

    vec3 col = back * 0.94;
    col += vec3(0.80, 0.88, 1.0) * env * (0.14 + fres * 1.05);
    col += irid * fres * 0.30;
    col += vec3(1.0) * (s1 * 1.9 + s2 * 1.3);
    col += vec3(0.075, 0.082, 0.095); // lift so clear glass still reads on black

    gl_FragColor = vec4(col, cover * uForm);
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
      fragment,
      transparent: true,
      depthTest: false,
      uniforms: {
        tMask: { value: textures.tMask },
        tHeight: { value: textures.tHeight },
        tBack: { value: null },
        uRes: { value: [1, 1] },
        uMouse: { value: [0, 0] },
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
