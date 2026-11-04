// Lens and light post-processing for a set: bokeh depth of field with rack focus, N8AO ambient
// occlusion, god rays, and a subtle old-lens preset (barrel distortion + chromatic aberration).
//
//   import * as P from '/engine/post.js';
//   const fx = P.post(ctx, scene, camera, { ao: true, dof: { focus: 3, range: 1.2, bokeh: 3 } });
//   // in update(t, p): fx.focus(P.rack(t, [[0, near], [2.0, near], [3.2, far]]))   or   fx.focusOn(obj)
//   // then render as usual: renderer.render(scene, camera) goes through the effect chain.
//
// Opt-in per set. A scene without P.post renders exactly as before. Once a scene has a post chain,
// stage.html's renderer.render(scene, camera) is routed through it, so existing compositors
// (data-rush's 2D comp, trails, whips) and the FXAA pass keep working unchanged: the chain draws
// to the canvas, FXAA runs on the final frame, and the comp copies the canvas.
//
// Everything is a pure function of the frame: composer.render gets a fixed delta, N8AO runs with
// accumulate off (its blue-noise frame index stays 0), and grain/halation/vignette stay in the
// ffmpeg finish. Tone mapping moves from the renderer into a ToneMappingEffect at the end of the
// chain (same ACES curve and exposure), so the chain works in linear HDR and bokeh blooms right.
//
// Measured costs on llvmpipe at 1080p are in docs/research/animation-libraries.md ("post.js").
import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect, GodRaysEffect, ToneMappingEffect, ToneMappingMode,
  LensDistortionEffect, ChromaticAberrationEffect, BlendFunction, KernelSize,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

// Quality knob. 'draft' is the default under --draft, 'low' otherwise.
// dof/rays: effect resolution scale. ao: N8AO quality mode and half-res AO.
export const QUALITY = {
  off: { dof: 0.35, rays: 0.25, ao: null, kernel: KernelSize.SMALL },
  draft: { dof: 0.35, rays: 0.25, ao: null, kernel: KernelSize.SMALL },
  low: { dof: 0.5, rays: 0.4, ao: { mode: 'Low', halfRes: true }, kernel: KernelSize.SMALL },
  medium: { dof: 0.5, rays: 0.5, ao: { mode: 'Medium', halfRes: true }, kernel: KernelSize.MEDIUM },
  high: { dof: 1.0, rays: 0.5, ao: { mode: 'Medium', halfRes: false }, kernel: KernelSize.MEDIUM },
};

// Lens presets. `distortion` is barrel (k at the frame corner is ~2k), `ca` is the chromatic
// fringe offset at the corners in UV units. Both are tuned to be felt, not seen.
export const LENS = {
  subtle: { distortion: 0.025, ca: 0.0011 },
  vintage: { distortion: 0.045, ca: 0.0022 },
};

const toneMode = { aces: ToneMappingMode.ACES_FILMIC, agx: ToneMappingMode.AGX, neutral: ToneMappingMode.NEUTRAL, linear: ToneMappingMode.LINEAR };

// Route renderer.render(scene, camera) through a scene's post chain when it draws to the canvas.
// Installed once per renderer, on top of whatever stage.html already wrapped (FXAA).
function hook(renderer) {
  if (renderer.__post) return;
  const base = renderer.render.bind(renderer);
  let busy = false;
  renderer.render = (scene, camera) => {
    const fx = scene?.userData?.post;
    if (!fx || busy || !fx.enabled || renderer.getRenderTarget() !== null) return base(scene, camera);
    busy = true;
    try { fx.render(camera); } finally { busy = false; }
  };
  renderer.__post = { base };
}

/**
 * Build a post chain for one set.
 * @param ctx      the scene ctx from stage.html ({ renderer, draft, fps }) or a bare WebGLRenderer
 * @param opts.quality  'off' | 'draft' | 'low' | 'medium' | 'high' (default: 'draft' under --draft, else 'low');
 *                      ctx.postQuality (stage.html ?postq=) overrides it for every set
 * @param opts.ao       true | { radius=1.2, intensity=2.2, falloff=1, color=0x000000, mode, halfRes }
 * @param opts.dof      true | { focus=5, range=2, bokeh=3, fstop?, mm? }  (focus/range in world units)
 * @param opts.rays     { light: Mesh, density=0.94, decay=0.92, weight=0.35, exposure=0.5, samples=48 }
 * @param opts.lens     true | 'subtle' | 'vintage' | { distortion, ca }
 * @param opts.tone     'aces' (matches the renderer default) | 'agx' | 'neutral' | 'linear'
 */
export function post(ctx, scene, camera, opts = {}) {
  const renderer = ctx.isWebGLRenderer ? ctx : ctx.renderer;
  const draft = !!ctx.draft;
  const fps = ctx.fps ?? 24;
  const qname = ctx.postQuality ?? opts.quality ?? (draft ? 'draft' : 'low');
  const Q = QUALITY[qname] ?? QUALITY.low;
  hook(renderer);

  // hdr: HalfFloat buffers keep highlights above 1 for bokeh and rays (default). hdr: false uses
  // 8-bit buffers: cheaper on llvmpipe, but bright bokeh clips.
  const composer = new EffectComposer(renderer, { frameBufferType: opts.hdr === false ? THREE.UnsignedByteType : THREE.HalfFloatType, depthBuffer: true, multisampling: 0 });
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const fx = { composer, enabled: true, quality: qname, scene, camera };

  // ---- ambient occlusion (N8AO). Skipped in draft unless asked for with quality 'low'+.
  const aoOpt = opts.ao === true ? {} : opts.ao;
  if (aoOpt && Q.ao) {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const ao = new N8AOPostPass(scene, camera, size.x, size.y);
    ao.setQualityMode(aoOpt.mode ?? Q.ao.mode);
    const c = ao.configuration;
    c.aoRadius = aoOpt.radius ?? 1.2;
    c.distanceFalloff = aoOpt.falloff ?? 1.0;
    c.intensity = aoOpt.intensity ?? 2.2;
    c.color = new THREE.Color(aoOpt.color ?? 0x000000);
    c.halfRes = aoOpt.halfRes ?? Q.ao.halfRes;
    c.accumulate = false;          // determinism: never accumulate across frames
    c.gammaCorrection = false;     // the chain is linear until the final pass
    ao.autoDetectTransparency = false; c.transparencyAware = false; // dust and shafts are additive; skip the extra pass
    composer.addPass(ao);
    fx.ao = ao;
  }

  // ---- main effect pass: DOF, god rays, tone mapping (merged into one fullscreen pass)
  const effects = [];
  const dofOpt = opts.dof === true ? {} : opts.dof;
  if (dofOpt) {
    const dof = new DepthOfFieldEffect(camera, { focusDistance: dofOpt.focus ?? 5, focusRange: dofOpt.range ?? 2, bokehScale: dofOpt.bokeh ?? 3, resolutionScale: dofOpt.resolution ?? Q.dof });
    dof.blurPass.kernelSize = Q.kernel;
    effects.push(dof); fx.dof = dof;
    fx.lensMM = dofOpt.mm; fx.fstop = dofOpt.fstop;
    if (dofOpt.fstop) fx.dof.cocMaterial.focusRange = focusRange(dofOpt.focus ?? 5, dofOpt.fstop, dofOpt.mm ?? mmOf(camera), ctx.height ?? 1080);
  }
  if (opts.rays?.light) {
    const r = opts.rays;
    const l = r.light;
    if (l.material) { l.material.transparent = true; l.material.depthWrite = false; }
    const rays = new GodRaysEffect(camera, l, { density: r.density ?? 0.94, decay: r.decay ?? 0.92, weight: r.weight ?? 0.35, exposure: r.exposure ?? 0.5,
      samples: r.samples ?? 48, clampMax: r.clampMax ?? 1, resolutionScale: r.resolution ?? Q.rays, kernelSize: KernelSize.SMALL, blur: true, blendFunction: BlendFunction.SCREEN });
    effects.push(rays); fx.rays = rays;
  }
  const tone = new ToneMappingEffect({ mode: toneMode[opts.tone ?? 'aces'] ?? ToneMappingMode.ACES_FILMIC });
  effects.push(tone);
  composer.addPass(new EffectPass(camera, ...effects));

  // ---- old lens: barrel distortion (UV transform) then chromatic aberration (needs its own pass)
  const lensOpt = opts.lens === true ? LENS.subtle : typeof opts.lens === 'string' ? LENS[opts.lens] : opts.lens;
  if (lensOpt) {
    const k = lensOpt.distortion ?? 0.025;
    // scale so the distorted frame still fills the corners (no black mask), ~2k of zoom
    const f = 1 / (1 + 2 * k);
    if (k) composer.addPass(new EffectPass(camera, new LensDistortionEffect({ distortion: new THREE.Vector2(k, k), principalPoint: new THREE.Vector2(0, 0), focalLength: new THREE.Vector2(f, f), skew: 0 })));
    if (lensOpt.ca) composer.addPass(new EffectPass(camera, new ChromaticAberrationEffect({ offset: new THREE.Vector2(lensOpt.ca, lensOpt.ca), radialModulation: true, modulationOffset: 0.25 })));
  }

  let lastCam = camera;
  fx.render = (cam = camera) => {
    if (cam !== lastCam) { composer.setMainCamera(cam); lastCam = cam; fx.camera = cam; }
    // the chain does its own tone mapping; scene materials must render linear into the HDR buffer
    const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
    try { composer.render(1 / fps); } finally { renderer.toneMapping = tm; }
  };
  // Focus distance in world units (distance from the camera, not view depth)
  fx.focus = (d) => {
    if (!fx.dof) return fx;
    fx.dof.cocMaterial.focusDistance = d;
    if (fx.fstop) fx.dof.cocMaterial.focusRange = focusRange(d, fx.fstop, fx.lensMM ?? mmOf(lastCam), ctx.height ?? 1080);
    return fx;
  };
  // Focus on an Object3D or Vector3 (call after the camera has moved this frame)
  fx.focusOn = (target, cam = lastCam) => {
    const p = target.isVector3 ? target : target.getWorldPosition(new THREE.Vector3());
    cam.updateMatrixWorld(); return fx.focus(cam.position.distanceTo(p));
  };
  fx.set = ({ range, bokeh } = {}) => { if (fx.dof) { if (range != null) fx.dof.cocMaterial.focusRange = range; if (bokeh != null) fx.dof.bokehScale = bokeh; } return fx; };
  fx.dispose = () => { composer.dispose(); if (scene.userData.post === fx) delete scene.userData.post; };
  fx.enabled = qname !== 'off';  // 'off': plain renderer.render, the set looks as it would without post
  scene.userData.post = fx;
  return fx;
}

// Depth over which blur ramps from sharp to full bokeh, from a thin lens. On the near side the
// CoC is f^2 (s - z) / (N s z): it reaches the full-bokeh size cMax (~14 px at 1080p) at
// s - z = cMax N s^2 / (f^2 + cMax N s). postprocessing's CoC is linear in |z - s|, so this keeps
// the foreground right (where a rack is read) and is a little generous behind the focus plane.
export function focusRange(s, fstop, mm = 50, heightPx = 1080) {
  const f = mm / 1000, c = 14 * 0.02025 / 1080;
  return Math.max(0.05, c * fstop * s * s / (f * f + c * fstop * s));
}
const mmOf = (cam) => (cam.getFocalLength ? cam.getFocalLength() : 50);

// Rack focus: piecewise focus distance keyed by time, eased in inverse distance (dioptres) so a
// pull from 1 m to 10 m spends its time where the eye notices it, like a real follow-focus.
//   P.rack(t, [[0, 1.2], [2.0, 1.2], [3.0, 9]])
export function rack(t, keys, ease = (x) => x * x * (3 - 2 * x)) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t0, d0] = keys[i - 1], [t1, d1] = keys[i];
    if (t <= t1) { const k = ease((t - t0) / Math.max(1e-6, t1 - t0)); return 1 / (1 / d0 + (1 / d1 - 1 / d0) * k); }
  }
  return keys.at(-1)[1];
}
