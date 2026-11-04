// Imagery: photoreal terrain from baked real aerial / satellite sets (engine/imagery/bake.py).
//
//   import * as IM from '/engine/imagery/index.js';
//   const T = await IM.terrain(scene, 'pentagon', { lod: 0 });   // NAIP + 3DEP, nested levels
//   T.update(camera);                                            // per frame: haze, level fades
//   T.toLocal(lat, lon, hAboveGround?) -> Vector3; T.height(x, z) -> ground y (m); T.geo(x, z) -> [lat, lon]
//
// Frame: metres, origin at the set's centre on the ground (y = 0 at set.center.elev), x east, y up,
// z south (the engine/world convention). Earth curvature is applied (drop d^2 / 2R) so the horizon is
// real at altitude. Height exaggeration is 1 unless you ask otherwise.
//
// Look: the photo is shown unlit (the sun is already in it), graded towards the house style (a touch
// of contrast, warmth, less cyan), and seen through physically shaped aerial perspective: exponential
// height fog (scale height 1.2 km) with in-scatter that warms towards the sun. The sky dome uses the
// same haze colour at the horizon, so the land dissolves into it the way it does from a real drone.
// File format: docs/assets/imagery.md.
import * as THREE from 'three';

const ROOT = '/assets/imagery/';
const M_PER_DEG = 111320, R_EARTH = 6371000;
const cache = {};

export async function loadSet(name, root = ROOT) {
  return cache[root + name] ??= (async () => {
    const r = await fetch(root + name + '/set.json'); if (!r.ok) throw new Error(`imagery: no set ${name} (bake it: python3 engine/imagery/bake.py ${name} <lat> <lon>)`);
    const set = await r.json(); set.root = root + name + '/'; return set;
  })();
}

export async function loadDem(set, level) {
  const L = set.levels[level], key = set.root + L.dem.file;
  return cache[key] ??= (async () => {
    const blob = await (await fetch(key)).blob();
    const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0);
    const px = x.getImageData(0, 0, bmp.width, bmp.height).data, n = bmp.width * bmp.height, h = new Float32Array(n);
    for (let i = 0; i < n; i++) h[i] = (px[i * 4] * 256 + px[i * 4 + 1]) / 10 - 500;
    return { w: bmp.width, h: bmp.height, data: h, bbox: L.bbox };
  })();
}

// bilinear DEM sample at lat/lon (pixel centres at (i + 0.5) / w); null outside
function sampleDem(D, lat, lon) {
  const [w, s, e, n] = D.bbox;
  const u = (lon - w) / (e - w) * D.w - 0.5, v = (n - lat) / (n - s) * D.h - 0.5;
  if (u < -0.5 || v < -0.5 || u > D.w - 0.5 || v > D.h - 0.5) return null;
  const x0 = Math.max(0, Math.min(D.w - 2, Math.floor(u))), y0 = Math.max(0, Math.min(D.h - 2, Math.floor(v)));
  const fx = Math.min(1, Math.max(0, u - x0)), fy = Math.min(1, Math.max(0, v - y0)), d = D.data, i = y0 * D.w + x0;
  return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + D.w] * (1 - fx) + d[i + D.w + 1] * fx) * fy;
}

export function projection(set, { curvature = true, exaggeration = 1 } = {}) {
  const lat0 = set.center.lat, lon0 = set.center.lon, e0 = set.center.elev ?? 0, kx = M_PER_DEG * Math.cos(lat0 * Math.PI / 180);
  return {
    xz: (lat, lon) => [(lon - lon0) * kx, -(lat - lat0) * M_PER_DEG],
    geo: (x, z) => [lat0 - z / M_PER_DEG, lon0 + x / kx],
    y: (elev, x, z) => (elev - e0) * exaggeration - (curvature ? (x * x + z * z) / (2 * R_EARTH) : 0),
  };
}

export const HAZE = {
  // colour of the haze at the horizon / towards the sun, ground density (1/m) at elevation 0, scale height
  day:    { color: [0.62, 0.68, 0.74], sunColor: [1.0, 0.86, 0.68], density: 1 / 7000, scale: 1200, sunDir: [-0.45, 0.42, -0.78], zenith: [0.22, 0.34, 0.52] },
  golden: { color: [0.80, 0.66, 0.52], sunColor: [1.0, 0.62, 0.32], density: 1 / 9000, scale: 900, sunDir: [-0.85, 0.12, -0.5], zenith: [0.20, 0.27, 0.40] },
  dusk:   { color: [0.30, 0.30, 0.36], sunColor: [0.95, 0.52, 0.30], density: 1 / 8000, scale: 900, sunDir: [-0.9, 0.03, -0.4], zenith: [0.05, 0.07, 0.12] },
  clear:  { color: [0.66, 0.73, 0.80], sunColor: [1.0, 0.9, 0.75], density: 1 / 30000, scale: 1500, sunDir: [-0.45, 0.5, -0.7], zenith: [0.18, 0.32, 0.55] },
};
export const GRADE = {
  // the NAIP / Sentinel photo -> house look: contrast around mid grey, saturation, warmth, gamma, exposure
  house: { contrast: 1.12, saturation: 0.86, warmth: 0.05, gamma: 1.04, exposure: 0.98, lift: 0.0 },
  neutral: { contrast: 1, saturation: 1, warmth: 0, gamma: 1, exposure: 1, lift: 0 },
};

const GLSL_COMMON = /* glsl */`
  uniform vec3 uCam, uHaze, uSunCol, uSunDir; uniform float uDens, uScale, uCamY, uDatum;
  // optical depth of an exponential atmosphere along the segment camera -> p (y relative to datum)
  float opticalDepth(vec3 p) {
    float d = length(p - uCam), dy = p.y - uCam.y;
    float a = exp(-uCam.y / uScale), b = exp(-p.y / uScale);
    float k = abs(dy) > 1. ? (a - b) / (dy / uScale) : a;
    return uDens * d * max(k, 0.);
  }
  vec3 inscatter(vec3 dir) {
    float s = max(dot(normalize(dir), normalize(uSunDir)), 0.);
    return mix(uHaze, uSunCol * 1.05, pow(s, 6.) * .55);
  }`;

function terrainMaterial(tex, U, { fade = null } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, map: { value: tex }, uFade: { value: fade ?? new THREE.Vector4(-1e9, -1e9, 1e9, 1e9) }, uFadeW: { value: 1 }, uOn: { value: fade ? 1 : 0 } },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW; varying vec2 vXZ;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vXZ = position.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform vec4 uFade; uniform float uFadeW, uOn;
      uniform float gContrast, gSat, gWarm, gGamma, gExposure, gLift;
      ${GLSL_COMMON}
      varying vec2 vUv; varying vec3 vW; varying vec2 vXZ;
      void main() {
        vec3 c = texture2D(map, vUv).rgb;
        // grade the photograph (display-referred, it already carries its sun and shadows)
        c = pow(max(c, 0.), vec3(gGamma));
        c = (c - .45) * gContrast + .45;
        float l = dot(c, vec3(.2126, .7152, .0722));
        c = mix(vec3(l), c, gSat);
        c *= vec3(1. + gWarm, 1. + gWarm * .25, 1. - gWarm * .9);
        c = gLift + (1. - gLift) * clamp(c, 0., 1.);
        c *= gExposure;
        // aerial perspective
        vec3 pw = vW + vec3(0., uDatum, 0.);
        float tau = opticalDepth(pw);
        vec3 col = c * exp(-tau) + inscatter(pw - uCam) * (1. - exp(-tau));
        // soft edge of a finer level over the coarser one underneath
        float a = 1.;
        if (uOn > .5) { vec2 d = min(vXZ - uFade.xy, uFade.zw - vXZ); a = smoothstep(0., uFadeW, min(d.x, d.y)); }
        gl_FragColor = vec4(col, a);
      }`,
    toneMapped: false, transparent: !!fade, depthWrite: true,
  });
}

function skyDome(U, radius) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`
      uniform vec3 uZenith; ${GLSL_COMMON}
      varying vec3 vD;
      void main() {
        vec3 d = normalize(vD);
        // the horizon dips below 0 at altitude: h = asin(...) of the true horizon
        float dip = acos(clamp(6371000. / (6371000. + max(uCamY, 0.)), 0., 1.));
        float e = asin(clamp(d.y, -1., 1.)) + dip;
        vec3 hz = inscatter(d * 1e5);
        vec3 col = mix(hz, uZenith, smoothstep(0.0, .65, e));
        col = mix(hz * .92, col, smoothstep(-.03, .0, e));          // below the horizon: haze
        float s = max(dot(d, normalize(uSunDir)), 0.);
        col += uSunCol * (pow(s, 900.) * 6. + pow(s, 40.) * .12);   // sun disc + aureole
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
  }));
  m.frustumCulled = false; m.renderOrder = -10; return m;
}

/**
 * Photoreal terrain for a baked set.
 * opts.lod        0 = load every level (finest first available); 1 = skip the finest level; 2 = skip two
 * opts.levels     max number of levels to use (default all)
 * opts.segments   grid segments per 1024 px tile (default 64)
 * opts.haze       'day' | 'golden' | 'dusk' | 'clear' | object (see HAZE) ; opts.grade 'house' | 'neutral' | object
 * opts.exaggeration (default 1), opts.curvature (default true), opts.sky (default true)
 */
export async function terrain(scene, place, opts = {}) {
  const set = typeof place === 'string' ? await loadSet(place, opts.root) : place;
  const P = projection(set, opts);
  const hz = { ...(typeof opts.haze === 'object' ? opts.haze : HAZE[opts.haze ?? 'day']) };
  const gr = { ...(typeof opts.grade === 'object' ? opts.grade : GRADE[opts.grade ?? 'house']) };
  const U = {
    uCam: { value: new THREE.Vector3() }, uCamY: { value: 0 }, uDatum: { value: 0 }, uHaze: { value: new THREE.Vector3(...hz.color) }, uSunCol: { value: new THREE.Vector3(...hz.sunColor) },
    uSunDir: { value: new THREE.Vector3(...hz.sunDir).normalize() }, uDens: { value: hz.density }, uScale: { value: hz.scale }, uZenith: { value: new THREE.Vector3(...hz.zenith) },
    gContrast: { value: gr.contrast }, gSat: { value: gr.saturation }, gWarm: { value: gr.warmth }, gGamma: { value: gr.gamma }, gExposure: { value: gr.exposure }, gLift: { value: gr.lift ?? 0 },
  };
  // the datum for the haze is sea level: shift so y in the shader is metres above sea level
  const datum = set.center.elev ?? 0; U.uDatum.value = datum;
  const group = new THREE.Group(); group.name = 'imagery:' + set.name;
  const first = Math.min(opts.lod ?? 0, set.levels.length - 1), last = Math.min(set.levels.length, first + (opts.levels ?? 99));
  const levels = set.levels.slice(first, last);
  const dems = await Promise.all(levels.map(L => loadDem(set, L.id)));
  const maxAniso = opts.renderer?.capabilities?.getMaxAnisotropy?.() ?? 8;
  const loader = new THREE.TextureLoader();
  const segs = opts.segments ?? 64;
  // heights: the finest DEM that covers the point
  const elevAt = (lat, lon) => { for (const D of dems) { const h = sampleDem(D, lat, lon); if (h !== null) return h; } return datum; };
  const height = (x, z) => { const [la, lo] = P.geo(x, z); return P.y(elevAt(la, lo), x, z); };
  const meshes = [];
  for (let li = levels.length - 1; li >= 0; li--) {
    const L = levels[li], D = dems[li], [w, s, e, n] = L.bbox, [W, H] = L.size;
    const finer = li > 0 ? levels[li - 1] : null;
    let hole = null, fadeRect = null, fadeW = 0;
    if (finer) { // cells of this level fully inside the finer level's inner area are dropped
      const [a, b] = P.xz(finer.bbox[3], finer.bbox[0]), [c, d] = P.xz(finer.bbox[1], finer.bbox[2]);
      const band = (c - a) * 0.06; hole = [a + band * 1.6, b + band * 1.6, c - band * 1.6, d - band * 1.6];
    }
    if (li < levels.length - 1) { // this level fades out over its outer 6 %
      const [a, b] = P.xz(n, w), [c, d] = P.xz(s, e); fadeRect = new THREE.Vector4(a, b, c, d); fadeW = (c - a) * 0.06;
    }
    const [cols, rows] = L.tiles;
    const jobs = [];
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const px0 = tx * 1024, py0 = ty * 1024, px1 = Math.min(W, px0 + 1024), py1 = Math.min(H, py0 + 1024);
      const lon0 = w + (e - w) * px0 / W, lon1 = w + (e - w) * px1 / W, lat0 = n - (n - s) * py0 / H, lat1 = n - (n - s) * py1 / H;
      const sx = Math.max(2, Math.round(segs * (px1 - px0) / 1024)), sy = Math.max(2, Math.round(segs * (py1 - py0) / 1024));
      const pos = [], uv = [], idx = [], keep = [];
      for (let j = 0; j <= sy; j++) for (let i = 0; i <= sx; i++) {
        const lat = lat0 + (lat1 - lat0) * j / sy, lon = lon0 + (lon1 - lon0) * i / sx;
        const [x, z] = P.xz(lat, lon); const hh = sampleDem(D, lat, lon) ?? elevAt(lat, lon);
        pos.push(x, P.y(hh, x, z) + datum, z); uv.push(i / sx * (px1 - px0) / (px1 - px0), j / sy);
      }
      for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
        const a = j * (sx + 1) + i, b = a + 1, c = a + sx + 1, d = c + 1;
        if (hole) { const xs = [pos[a * 3], pos[d * 3]], zs = [pos[a * 3 + 2], pos[d * 3 + 2]];
          if (Math.min(...xs) > hole[0] && Math.max(...xs) < hole[2] && Math.min(...zs) > hole[1] && Math.max(...zs) < hole[3]) continue; }
        idx.push(a, c, b, b, c, d);
      }
      if (!idx.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      g.computeBoundingSphere();
      jobs.push(loader.loadAsync(set.root + L.image.replace('{row}', ty).replace('{col}', tx)).then(tex => {
        tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = maxAniso; tex.flipY = true; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
        // uv v = 0 at the tile's north edge; TextureLoader flips, so sample (u, 1 - v)
        const uvA = g.getAttribute('uv'); for (let k = 0; k < uvA.count; k++) uvA.setY(k, 1 - uvA.getY(k));
        const mat = terrainMaterial(tex, U, { fade: fadeRect });
        if (fadeRect) mat.uniforms.uFadeW.value = fadeW;
        mat.polygonOffset = true; mat.polygonOffsetFactor = -li * 2 - 0; mat.polygonOffsetUnits = -li * 4;
        const m = new THREE.Mesh(g, mat); m.position.y = -datum; m.renderOrder = levels.length - li; m.name = `L${L.id}/${ty}_${tx}`;
        meshes.push(m); group.add(m);
      }));
    }
    await Promise.all(jobs);
  }
  // finer levels draw last and win the depth test inside the overlap band
  for (const m of meshes) { const li = levels.length - m.renderOrder; m.material.polygonOffsetFactor = -(levels.length - 1 - li) * 1.5; m.material.polygonOffsetUnits = -(levels.length - 1 - li) * 3; }
  const outer = levels[levels.length - 1];
  const extent = Math.max(...P.xz(outer.bbox[1], outer.bbox[2]).map(Math.abs));
  let sky = null; if (opts.sky !== false) { sky = skyDome(U, extent * 3); scene.add(sky); }
  scene.add(group);
  return {
    set, group, sky, uniforms: U, levels, projection: P, attribution: set.attribution,
    height, geo: P.geo,
    toLocal(lat, lon, agl = 0, out = new THREE.Vector3()) { const [x, z] = P.xz(lat, lon); return out.set(x, P.y(elevAt(lat, lon), x, z) + agl, z); },
    // per frame: camera position feeds the haze integral and the sky's horizon dip
    update(camera) {
      U.uCam.value.copy(camera.position); U.uCam.value.y += datum; U.uCamY.value = camera.position.y + datum;
      if (sky) sky.position.copy(camera.position);
      if (camera.far < extent * 3.2) { camera.far = extent * 3.2; camera.updateProjectionMatrix(); }
    },
    setHaze(h) { const o = typeof h === 'string' ? HAZE[h] : h; U.uHaze.value.set(...o.color); U.uSunCol.value.set(...o.sunColor); U.uSunDir.value.set(...o.sunDir).normalize(); U.uDens.value = o.density; U.uScale.value = o.scale; U.uZenith.value.set(...o.zenith); },
    dispose() { group.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); sky?.removeFromParent(); group.removeFromParent(); },
  };
}
