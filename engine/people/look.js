// engine/people/look.js: photographic materials and lighting for people.
// The house style is backlit figures and silhouettes, so what sells a person as real is the edge:
// cloth sheen at grazing angles (wool and cotton catch a rim as a soft band, never a plastic
// highlight), warm light bleeding through thin skin (ears, fingers) when backlit, and hair that
// breaks the outline into strands instead of a helmet.
import * as THREE from 'three';

// Quality: 'high' = MeshPhysicalMaterial with a sheen lobe (cloth rims); 'fast' = MeshStandardMaterial
// (no sheen; about 2x cheaper per pixel on llvmpipe). ?look=fast in the stage URL overrides.
export let QUALITY = (typeof location !== 'undefined' && /[?&]peoplelook=fast/.test(location.search)) ? 'fast' : 'high';
export function setQuality(q) { QUALITY = q; }
const Mat = (o) => { if (QUALITY === 'fast') { const { sheen, sheenRoughness, sheenColor, clearcoat, clearcoatRoughness, specularIntensity, ...rest } = o; return new THREE.MeshStandardMaterial(rest); } return new THREE.MeshPhysicalMaterial(o); };

// Fabric presets: base colour multiplies the garment's own texture (if any).
export const FABRIC = {
  wool:    { roughness: 0.86, sheen: 1.0, sheenRoughness: 0.5,  sheenColor: 0x50545a },
  cotton:  { roughness: 0.9,  sheen: 0.8, sheenRoughness: 0.65, sheenColor: 0x5a5852 },
  denim:   { roughness: 0.92, sheen: 0.5, sheenRoughness: 0.75, sheenColor: 0x4a5058 },
  nylon:   { roughness: 0.55, sheen: 0.4, sheenRoughness: 0.35, sheenColor: 0x70747c },
  leather: { roughness: 0.42, sheen: 0.0, sheenRoughness: 0.5,  sheenColor: 0x000000, clearcoat: 0.25, clearcoatRoughness: 0.5 },
  canvas:  { roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7,  sheenColor: 0x5a5648 },
};

// Skin with a subsurface hint: a red-orange sheen lobe at grazing angles (where light passes
// through the thin edges of ears and fingers when backlit) plus wrap diffuse that softens the
// terminator. Cheap: one extra term in the standard BRDF, no extra passes.
export function skinMaterial(src, { tone = 1, sss = 1 } = {}) {
  const m = Mat({
    map: src?.map ?? null, color: new THREE.Color(1, 1, 1).multiplyScalar(tone), roughness: 0.5, metalness: 0,
    sheen: 0.6 * sss, sheenRoughness: 0.45, sheenColor: new THREE.Color(0.85, 0.32, 0.2),
    specularIntensity: 0.45,
  });
  m.onBeforeCompile = (sh) => {
    // wrap lighting: diffuse = saturate((NdotL + w) / (1 + w)), w = 0.35; tinted red past the terminator
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', `#include <lights_physical_pars_fragment>
      vec3 bvWrap(vec3 n, vec3 l) { float d = dot(n, l); float w = clamp((d + 0.35) / 1.35, 0.0, 1.0); float r = clamp((d + 0.6) / 1.6, 0.0, 1.0);
        return vec3(r, w, w * 0.95) - vec3(clamp(d, 0.0, 1.0)); }`)
      .replace('#include <lights_fragment_begin>', `#include <lights_fragment_begin>
      #if NUM_DIR_LIGHTS > 0
      for (int i = 0; i < NUM_DIR_LIGHTS; i++) { reflectedLight.directDiffuse += ${(0.6 * sss).toFixed(3)} * bvWrap(geometryNormal, directionalLights[i].direction) * directionalLights[i].color * BRDF_Lambert(material.diffuseColor); }
      #endif`);
  };
  m.userData.bv = 'skin';
  return m;
}

export function clothMaterial(src, { fabric = 'wool', color = null, tint = 1, map = true } = {}) {
  const f = FABRIC[fabric] ?? FABRIC.wool;
  const m = Mat({
    map: map ? src?.map ?? null : null, normalMap: src?.normalMap ?? null, color: color != null ? new THREE.Color(color) : new THREE.Color(1, 1, 1),
    roughness: f.roughness, metalness: 0, sheen: f.sheen, sheenRoughness: f.sheenRoughness, sheenColor: new THREE.Color(f.sheenColor),
    clearcoat: f.clearcoat ?? 0, clearcoatRoughness: f.clearcoatRoughness ?? 0, specularIntensity: 0.35,
  });
  if (tint !== 1) m.color.multiplyScalar(tint);
  m.userData.bv = 'cloth';
  return m;
}

// Hair cards: alpha-tested (hashed) so the outline breaks into strands without sorting; a soft
// sheen gives the backlit halo.
export function hairMaterial(src, { color = null } = {}) {
  const m = Mat({
    map: src?.map ?? null, color: color != null ? new THREE.Color(color) : new THREE.Color(1, 1, 1), roughness: 0.6,
    alphaHash: true, transparent: false, side: THREE.DoubleSide, sheen: 1, sheenRoughness: 0.3, sheenColor: new THREE.Color(0.55, 0.45, 0.35),
    specularIntensity: 0.4,
  });
  m.userData.bv = 'hair';
  return m;
}

// Matte silhouette (the old mannequin look, now on a real body): near-black, rim catches as wool.
export function silhouetteMaterial({ color = 0x0d0e10, fabric = 'wool' } = {}) {
  const f = FABRIC[fabric];
  return Mat({ color, roughness: f.roughness, sheen: f.sheen, sheenRoughness: f.sheenRoughness, sheenColor: new THREE.Color(f.sheenColor), specularIntensity: 0.3 });
}

// Default dresser: maps a mesh role (skin | cloth | hair | brow | shoes) to a photographic material.
// opts.outfit: { fabric, color, tint } for clothes; opts.skin: { tone, sss }; opts.hair: { color }.
export function dresser(opts = {}) {
  const cache = new Map();
  return (role, mesh) => {
    const src = mesh.material; const key = role + ':' + (src?.name ?? '');
    if (cache.has(key)) return cache.get(key);
    let m;
    if (opts.silhouette) m = role === 'brow' || role === 'hair' ? hairMaterial(src, { color: 0x0a0a0a }) : silhouetteMaterial(opts.silhouette === true ? {} : opts.silhouette);
    else if (role === 'eyes') m = new THREE.MeshStandardMaterial({ map: src?.map ?? null, roughness: 0.15, color: 0xb8b0a8 });
    else if (role === 'skin') m = skinMaterial(src, opts.skin);
    else if (role === 'hair' || role === 'brow') m = hairMaterial(src, opts.hair);
    else if (role === 'shoes') m = clothMaterial(src, { fabric: 'leather', color: opts.shoes ?? 0x1a1714 });
    else {
      const o = (opts.garments ?? {})[src?.name?.replace(/^Human\./, '')] ?? opts.outfit ?? {};
      m = clothMaterial(src, o);
    }
    cache.set(key, m); return m;
  };
}

// ------------------------------------------------------------------ lighting presets
// All presets are placed relative to a subject point and the camera, so a backlight stays a
// backlight as the camera moves. Returns { lights[], update(subject, camera) }.
const _d = new THREE.Vector3();
export function rig(scene, preset = 'backlit', o = {}) {
  const P = PRESETS[preset]; if (!P) throw new Error(`[people] light preset ${preset}?`);
  const lights = P.map(([kind, color, intensity, az, el, dist, opts = {}]) => {
    const L = kind === 'spot' ? new THREE.SpotLight(color, intensity, 0, opts.angle ?? 0.5, opts.penumbra ?? 0.8, 2) : new THREE.DirectionalLight(color, intensity);
    L.userData.place = { az, el, dist };
    if (opts.shadow && o.shadows !== false) {
      L.castShadow = true; L.shadow.mapSize.set(o.shadowSize ?? 1024, o.shadowSize ?? 1024); L.shadow.bias = -0.0004; L.shadow.normalBias = 0.02;
      if (L.isDirectionalLight) { const c = L.shadow.camera; c.left = c.bottom = -(o.shadowExtent ?? 4); c.right = c.top = o.shadowExtent ?? 4; c.near = 0.5; c.far = 40; }
    }
    L.intensity *= o.intensity ?? 1;
    scene.add(L); scene.add(L.target); return L;
  });
  const update = (subject, camera) => {
    // camera azimuth around the subject: 0 = camera side, 180 = directly behind the subject
    _d.subVectors(camera.position, subject).setY(0); const camAz = Math.atan2(_d.x, _d.z);
    for (const L of lights) {
      const { az, el, dist } = L.userData.place; const a = camAz + az * Math.PI / 180, e = el * Math.PI / 180;
      L.position.set(subject.x + Math.sin(a) * Math.cos(e) * dist, subject.y + Math.sin(e) * dist, subject.z + Math.cos(a) * Math.cos(e) * dist);
      L.target.position.copy(subject);
    }
  };
  return { lights, update };
}
// [kind, colour, intensity, azimuth from camera (deg), elevation (deg), distance, opts]
export const PRESETS = {
  // the house look: a hard key behind and above the subject, a cold kicker, the front in shadow
  backlit:   [['dir', 0xffe2bf, 6.0, 165, 28, 8, { shadow: true }], ['dir', 0x9fb4d8, 1.6, -120, 12, 8], ['dir', 0x2a3240, 0.25, 0, 10, 8]],
  // two rims, both sides, for a figure against a bright background
  doubleRim: [['dir', 0xffe8d0, 4.0, 130, 20, 8, { shadow: true }], ['dir', 0xd8e4ff, 3.0, -130, 20, 8], ['dir', 0x1c2028, 0.2, 0, 0, 8]],
  // monitor glow: a cool soft key from the front-low (the screen), warm practical behind
  monitor:   [['spot', 0xbcd6ff, 14, 0, -5, 0.9, { angle: 0.9, penumbra: 1, shadow: true }], ['dir', 0xffc890, 2.4, 150, 35, 8], ['dir', 0x151a22, 0.15, 60, 30, 8]],
  // street at dusk: a sodium backlight, sky fill from above
  dusk:      [['dir', 0xffb070, 5.0, 170, 18, 10, { shadow: true }], ['dir', 0x6f86b0, 1.0, 40, 60, 10]],
  // top-down overhead fluorescents
  overhead:  [['dir', 0xf2f6ff, 3.0, 20, 75, 10, { shadow: true }], ['dir', 0x8090a8, 0.6, -150, 30, 10]],
};
