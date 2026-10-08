import { Renderer, Camera, Transform, Plane, RenderTarget } from '../../vendor/ogl.mjs';

// One fixed full-viewport canvas. Every WebGL "plane" is pinned to a DOM element and
// repositioned from getBoundingClientRect() each frame, so layout, links and a11y stay in
// plain HTML and the GL layer is pure presentation.
//
// Two layers:
//   scene    - what the user sees (blit of the hero background, glass logo, project cards)
//   bgScene  - rendered first into an offscreen texture (stage.target) so the glass logo can
//              refract the live background behind it.
export class Stage {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gl';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(this.canvas);

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new Renderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      dpr: this.dpr,
      powerPreference: 'high-performance',
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);

    this.scene = new Transform();
    this.bgScene = new Transform();
    this.camera = new Camera(this.gl, { left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 100 });
    this.camera.position.z = 10;
    this.plane = new Plane(this.gl, { width: 1, height: 1 }); // shared unit quad, scaled per item

    this.items = new Set();
    this.time = 0;
    this.velocity = 0; // smoothed scroll velocity in px/frame
    this._lastY = window.scrollY;
    this.target = null;

    this.resize();
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => this.resize(), 120);
    });
  }

  resize() {
    // phones fire resize every time the address bar slides in or out; a full-screen render target per
    // event used to pile up GPU memory until iOS killed the tab, so skip no-op resizes and free the old one
    if (this.W === window.innerWidth && this.H === window.innerHeight && this.target) return;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.renderer.setSize(this.W, this.H);
    this.camera.orthographic({
      left: -this.W / 2,
      right: this.W / 2,
      bottom: -this.H / 2,
      top: this.H / 2,
      near: 0.1,
      far: 100,
    });
    // offscreen target matches the canvas in device pixels so refraction lines up 1:1
    this.pxW = Math.round(this.W * this.dpr);
    this.pxH = Math.round(this.H * this.dpr);
    if (this.target) {
      const gl = this.gl;
      (this.target.textures || [this.target.texture]).forEach((t) => gl.deleteTexture(t.texture || t));
      gl.deleteFramebuffer(this.target.buffer);
      if (this.target.depthBuffer) gl.deleteRenderbuffer(this.target.depthBuffer);
    }
    this.target = new RenderTarget(this.gl, {
      width: this.pxW,
      height: this.pxH,
      color: 1,
      depth: false,
      minFilter: this.gl.LINEAR,
      magFilter: this.gl.LINEAR,
    });
  }

  add(item) {
    this.items.add(item);
    return item;
  }

  render(seconds) {
    this.time = seconds;

    const y = window.scrollY;
    const raw = y - this._lastY;
    this._lastY = y;
    this.velocity += (raw - this.velocity) * 0.12;

    let bgVisible = false;
    let any = false;
    for (const item of this.items) {
      const rect = item.el.getBoundingClientRect();
      const onscreen = rect.bottom > -80 && rect.top < this.H + 80 && rect.width > 0;
      item.mesh.visible = onscreen && item.ready;
      if (!item.mesh.visible) continue;
      any = true;
      if (item.layer === 'bg') bgVisible = true;

      item.mesh.scale.set(rect.width, rect.height, 1);
      item.mesh.position.set(
        rect.left + rect.width / 2 - this.W / 2,
        this.H / 2 - (rect.top + rect.height / 2),
        item.z || 0
      );
      item.update(rect, this);
    }

    // nothing on screen: clear once, then stop drawing until something comes back
    if (!any) {
      if (this._drewLast) this.renderer.render({ scene: this.scene, camera: this.camera });
      this._drewLast = false;
      return;
    }
    this._drewLast = true;
    if (bgVisible) this.renderer.render({ scene: this.bgScene, camera: this.camera, target: this.target, clear: true });
    this.renderer.render({ scene: this.scene, camera: this.camera });
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
