// 2.5D archive-photo parallax ("photo to 3D", the Kid-Stays-in-the-Picture move).
//
//   python3 engine/depth.py projects/<p>          # once: writes assets/archive/depth/<stem>.*
//   import * as PX from '/engine/parallax.js';
//   const ph = await PX.photo(scene, '/projects/<p>/assets/archive/monk.jpg', { treatment: 'bw', mm: 50 });
//   const move = PX.moves.push(ph, { amount: 0.18 });              // or lateral / rise / drift
//   update(t, p) { move(camera, p, t); }
//
// How it works: every pixel is unprojected along the ray it was photographed on, to a distance
// given by Depth Anything's relative inverse depth. Seen from the original viewpoint (the group's
// origin, looking down -z) the photo is exactly the photo; any camera translation gives true
// parallax. Where a near object stands in front of a far one the mesh would stretch into a
// "rubber sheet". Those stretched triangles are faded out by their screen-space depth slope (they
// are edge-on, so zero-area, from the original viewpoint and only open up as the camera moves),
// and a second, smoother "plate" mesh sits behind them: the background depth with foreground
// objects eroded away, textured with the inpainted plate from depth.py.
//
// Keep moves small: 40-65 mm, push 10-25 % of the distance, lateral 2-5 %. The presets do that.
import * as THREE from 'three';
import * as C from '/engine/cine.js';

const loader = new THREE.TextureLoader();
const load = (url, srgb) => loader.loadAsync(url).catch(() => { throw new Error(`[parallax] cannot load ${url}${/depth\//.test(url) ? ' (run: python3 engine/depth.py projects/<name>)' : ''}`); }).then(t => { t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; });
const depthUrl = (url, ext) => url.replace(/\/([^/]+)\.(jpe?g|png)$/i, `/depth/$1.${ext}`);

// Photojournalism looks (style bible: 1967 photojournalism, blacks stay black).
export const TREATMENTS = {
  none: { mode: 0 },
  bw: { mode: 1, contrast: 1.12, lift: 0.0, tintLo: [1, 1, 1], tintHi: [1, 1, 1] },
  sepia: { mode: 1, contrast: 1.06, lift: 0.0, tintLo: [0.42, 0.30, 0.20], tintHi: [1.04, 0.94, 0.78] },
  selenium: { mode: 1, contrast: 1.15, lift: 0.0, tintLo: [0.34, 0.30, 0.33], tintHi: [1.0, 0.98, 0.95] },
  slide: { mode: 2, contrast: 0.94, lift: 0.035, sat: 0.72, tintLo: [0.90, 1.0, 1.04], tintHi: [1.05, 0.98, 0.86] }, // faded Ektachrome
};

const VERT = /* glsl */`
uniform sampler2D depthMap; uniform vec4 rect; uniform float near, far, layers, channel, push;
varying vec2 vUv; varying float vDist;
void main() {
  vUv = uv;
  vec3 dm = texture2D(depthMap, uv).rgb;
  float d = channel < 0.5 ? dm.r : dm.g;
  if (layers > 0.5) d = (floor(d * layers) + 0.5) / layers;           // layered cards
  // inverse-depth to distance: d = 1 -> near, d = 0 -> far (both along the optical axis)
  float z = 1.0 / mix(1.0 / far, 1.0 / near, d) * push;
  vec2 tanXY = vec2(mix(rect.x, rect.z, uv.x), mix(rect.y, rect.w, uv.y));
  vec3 pos = vec3(tanXY * z, -z);
  vDist = z;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform sampler2D map; uniform float tear, mode, contrast, lift, sat, exposure, opacity;
uniform vec3 tintLo, tintHi;
varying vec2 vUv; varying float vDist;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 curve(vec3 x, float k) { return clamp((x - 0.5) * k + 0.5, 0.0, 1.0); }
void main() {
  vec4 tex = texture2D(map, vUv);
  vec3 c = pow(max(tex.rgb, 0.0), vec3(1.0 / 2.2)) * exposure;          // grade in display space
  if (mode > 0.5 && mode < 1.5) {                                        // monochrome + split tone
    float l = luma(c); l = curve(vec3(l), contrast).r;
    c = mix(tintLo * l, tintHi * l, smoothstep(0.0, 1.0, l));
  } else if (mode > 1.5) {                                               // faded slide
    float l = luma(c); c = mix(vec3(l), c, sat); c = curve(c, contrast);
    c = mix(c * tintLo, c * tintHi, smoothstep(0.1, 0.9, l)); c = lift + c * (1.0 - lift);
  }
  float alpha = opacity;
  if (tear > 0.0) {                                                      // fade stretched (disoccluding) triangles
    float slope = length(vec2(dFdx(vDist), dFdy(vDist))) / vDist;
    alpha *= 1.0 - smoothstep(tear, tear * 2.5, slope);
    if (alpha < 0.02) discard;
  }
  gl_FragColor = vec4(pow(clamp(c, 0.0, 1.0), vec3(2.2)), alpha);
  #include <colorspace_fragment>
}`;

function material(map, depthMap, u, opts) {
  const tr = typeof opts.treatment === 'object' ? opts.treatment : TREATMENTS[opts.treatment ?? 'none'] ?? TREATMENTS.none;
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: u.tear > 0, depthWrite: true, side: THREE.DoubleSide, toneMapped: false, fog: false,
    uniforms: {
      map: { value: map }, depthMap: { value: depthMap }, rect: { value: u.rect }, near: { value: u.near }, far: { value: u.far },
      layers: { value: opts.layers ?? 0 }, channel: { value: u.channel }, push: { value: u.push ?? 1 }, tear: { value: u.tear },
      mode: { value: tr.mode ?? 0 }, contrast: { value: tr.contrast ?? 1 }, lift: { value: tr.lift ?? 0 }, sat: { value: tr.sat ?? 1 },
      exposure: { value: opts.exposure ?? 1 }, opacity: { value: 1 },
      tintLo: { value: new THREE.Vector3(...(tr.tintLo ?? [1, 1, 1])) }, tintHi: { value: new THREE.Vector3(...(tr.tintHi ?? [1, 1, 1])) },
    },
  });
}

/**
 * Build a parallax photo. Returns { group, rect, near, far, mm, focus, setTreatment, dispose }.
 * @param url          photo URL, e.g. '/projects/p/assets/archive/x.jpg' (depth files next to it in depth/)
 * @param opts.mm      lens of the viewing camera (sets how much of the photo the frame sees), default 50
 * @param opts.dist    distance to the farthest point (world units), default 10
 * @param opts.depth   relief: near point at dist*(1-depth), default 0.5. More = stronger parallax.
 * @param opts.center  [u, v] photo point on the optical axis (0..1, v up), default [0.5, 0.5]
 * @param opts.zoom    crop: 1 = the photo just covers the frame plus `margin`; >1 crops in
 * @param opts.margin  overscan so moves never show the photo edge, default 1.12
 * @param opts.layers  0 = continuous relief mesh; N = N flat cards at quantised depths
 * @param opts.treatment 'none' | 'bw' | 'sepia' | 'selenium' | 'slide' | custom object
 * @param opts.grid    mesh resolution along the long side, default 360
 * @param opts.tear    stretch threshold for fading torn triangles (0 = off), default 0.012
 */
export async function photo(scene, url, opts = {}) {
  const [map, depthMap, plateMap] = await Promise.all([load(url, true), load(depthUrl(url, 'depth.png'), false), load(depthUrl(url, 'plate.jpg'), true)]);
  depthMap.generateMipmaps = false; depthMap.minFilter = depthMap.magFilter = THREE.LinearFilter;
  const aspectImg = map.image.width / map.image.height;
  const mm = opts.mm ?? 50, aspect = opts.aspect ?? 16 / 9;
  const tv = Math.tan(C.mmToFov(mm, aspect) * Math.PI / 360), th = tv * aspect;
  // the photo's extent in tan space: cover the frame (times margin), keep its own aspect
  const margin = opts.margin ?? 1.12, zoom = opts.zoom ?? 1;
  let hw = th * margin, hh = hw / aspectImg;
  if (hh < tv * margin) { hh = tv * margin; hw = hh * aspectImg; }
  hw /= zoom; hh /= zoom;
  const [cu, cv] = opts.center ?? [0.5, 0.5];
  // put the photo point (cu, cv) on the axis, but never let the frame (with margin) leave the photo
  const ox = THREE.MathUtils.clamp((cu - 0.5) * 2 * hw, -(hw - th * margin), hw - th * margin);
  const oy = THREE.MathUtils.clamp((cv - 0.5) * 2 * hh, -(hh - tv * margin), hh - tv * margin);
  const rect = new THREE.Vector4(-hw - ox, -hh - oy, hw - ox, hh - oy);
  const far = opts.dist ?? 10, near = far * (1 - (opts.depth ?? 0.5));
  const n = opts.grid ?? 360, gx = aspectImg >= 1 ? n : Math.round(n * aspectImg), gy = aspectImg >= 1 ? Math.round(n / aspectImg) : n;
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1, 1, gx, gy);
  const tear = opts.tear ?? 0.012;
  const fg = new THREE.Mesh(geo, material(map, depthMap, { rect, near, far, channel: 0, tear }, opts));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, Math.ceil(gx / 3), Math.ceil(gy / 3)), material(plateMap, depthMap, { rect, near, far, channel: 1, tear: 0, push: 1.004 }, opts));
  fg.renderOrder = 1; plate.renderOrder = 0;
  for (const m of [fg, plate]) { m.frustumCulled = false; group.add(m); }
  scene.add(group);
  const ph = {
    group, fg, plate, rect, near, far, mm, aspect,
    // distance along the axis of the photo point (u, v) after relief: sample of the depth map
    distanceAt(u = 0.5, v = 0.5) {
      const img = depthMap.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0); const px = x.getImageData(Math.floor(u * (img.width - 1)), Math.floor((1 - v) * (img.height - 1)), 1, 1).data;
      const d = px[0] / 255; return 1 / (1 / far + (1 / near - 1 / far) * d);
    },
    setTreatment(name) { const tr = TREATMENTS[name] ?? name; for (const m of [fg, plate]) { const U = m.material.uniforms; U.mode.value = tr.mode; U.contrast.value = tr.contrast ?? 1; U.lift.value = tr.lift ?? 0; U.sat.value = tr.sat ?? 1; U.tintLo.value.set(...(tr.tintLo ?? [1, 1, 1])); U.tintHi.value.set(...(tr.tintHi ?? [1, 1, 1])); } },
    set opacity(a) { fg.material.uniforms.opacity.value = a; plate.material.uniforms.opacity.value = a; fg.material.transparent = plate.material.transparent = a < 1 || tear > 0; },
    dispose() { for (const m of [fg, plate]) { m.geometry.dispose(); m.material.dispose(); } map.dispose(); depthMap.dispose(); plateMap.dispose(); group.removeFromParent(); },
  };
  return ph;
}

// ---------- moves: C1 (cine.path) from the photo's own viewpoint ----------
// All in the photo group's local frame (origin = where the photo was taken from, looking -z).
// `amount` scales the default move; `focus` is the subject distance the lateral moves pivot on
// (default: halfway into the relief), which keeps the subject still while the world slides.
const local = (ph, v) => ph.group.localToWorld(new THREE.Vector3(...v)).toArray();
const pivot = (ph, o) => o.focus ?? (ph.near + ph.far) / 2 * 0.85;
export const moves = {
  // slow push in along the axis: 10-25 % of the subject distance
  push(ph, o = {}) {
    const f = pivot(ph, o), a = (o.amount ?? 0.18) * f;
    return C.path([{ pos: local(ph, [0, 0, 0]), look: local(ph, [0, 0, -f]), mm: ph.mm }, { pos: local(ph, [o.dx ?? 0, o.dy ?? 0.01 * f, -a]), look: local(ph, [0, 0, -f]), mm: ph.mm }],
      { accel: 0.3, decel: 0.45, float: o.float ?? 0.002 * f, ...o.opts });
  },
  pull(ph, o = {}) {
    const f = pivot(ph, o), a = (o.amount ?? 0.15) * f;
    return C.path([{ pos: local(ph, [0, 0.01 * f, -a]), look: local(ph, [0, 0, -f]), mm: ph.mm }, { pos: local(ph, [0, 0, 0]), look: local(ph, [0, 0, -f]), mm: ph.mm }],
      { accel: 0.2, decel: 0.55, float: o.float ?? 0.002 * f, ...o.opts });
  },
  // lateral truck around the subject: 2-5 % of the distance; dir 1 = left to right
  lateral(ph, o = {}) {
    const f = pivot(ph, o), w = (o.amount ?? 0.035) * f * (o.dir ?? 1), push = (o.push ?? 0.04) * f;
    return C.path([{ pos: local(ph, [-w, 0, 0]), look: local(ph, [-w * 0.15, 0, -f]), mm: ph.mm }, { pos: local(ph, [w, 0, -push]), look: local(ph, [w * 0.15, 0, -f]), mm: ph.mm }],
      { accel: 0.35, decel: 0.35, float: o.float ?? 0.002 * f, ...o.opts });
  },
  // crane up a touch while pushing: reveals what is behind the foreground
  rise(ph, o = {}) {
    const f = pivot(ph, o), h = (o.amount ?? 0.03) * f;
    return C.path([{ pos: local(ph, [0, -h, 0]), look: local(ph, [0, -h * 0.3, -f]), mm: ph.mm }, { pos: local(ph, [0, h, -0.06 * f]), look: local(ph, [0, h * 0.3, -f]), mm: ph.mm }],
      { accel: 0.35, decel: 0.4, float: o.float ?? 0.002 * f, ...o.opts });
  },
};
