// engine/sea/land.js: real coastlines for engine/sea from a baked imagery set (engine/imagery format:
// Sentinel-2 / Blue Marble photo tiles + terrarium DEM, nested levels). Built like IM.terrain, but the
// material belongs to the sea pipeline: the photo is decoded to linear light (it survives the neutral
// tone map unchanged), tinted by the look (golden hour warms it), marked as a "photo" seabed for the
// ocean's shallows (alpha 0.5), and curved around the camera exactly like the ocean, so coast and
// water meet at any altitude. Haze is applied by the sea post pass from depth, like everything else.
import * as THREE from 'three';
import * as IM from '/engine/imagery/index.js';
import { GLSL } from './look.js';

export async function land(sea, name, o = {}) {
  const set = await IM.loadSet(name, o.root ?? '/projects/hormuz/assets/imagery/');
  const P = IM.projection(set, { curvature: false, exaggeration: o.exaggeration ?? 1 });
  const first = Math.min(o.lod ?? 0, set.levels.length - 1), last = Math.min(set.levels.length, first + (o.levels ?? 99));
  const levels = set.levels.slice(first, last);
  const dems = await Promise.all(levels.map(L => IM.loadDem(set, L.id)));
  const sample = (D, lat, lon) => { const [w, s, e, n] = D.bbox; const u = (lon - w) / (e - w) * D.w - 0.5, v = (n - lat) / (n - s) * D.h - 0.5;
    if (u < -0.5 || v < -0.5 || u > D.w - 0.5 || v > D.h - 0.5) return null;
    const x0 = Math.max(0, Math.min(D.w - 2, Math.floor(u))), y0 = Math.max(0, Math.min(D.h - 2, Math.floor(v))), fx = Math.min(1, Math.max(0, u - x0)), fy = Math.min(1, Math.max(0, v - y0)), d = D.data, i = y0 * D.w + x0;
    return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + D.w] * (1 - fx) + d[i + D.w + 1] * fx) * fy; };
  const elevAt = (lat, lon) => { for (const D of dems) { const h = sample(D, lat, lon); if (h !== null) return h; } return -50; };
  const ex = o.exaggeration ?? 1, sink = o.sink ?? 1.2;
  const group = new THREE.Group(); group.name = 'land:' + name;
  const loader = new THREE.TextureLoader(); const segs = o.segments ?? 96;
  const U = sea.U; const meshes = [];
  const mat = (tex, fade, li) => new THREE.ShaderMaterial({
    uniforms: { ...U, map: { value: tex }, uFade: { value: fade ?? new THREE.Vector4(-1e9, -1e9, 1e9, 1e9) }, uFadeW: { value: 1 }, uOn: { value: fade ? 1 : 0 }, uCurvL: { value: 1 }, uCut: { value: o.cut ?? 0.5 }, uDarkCut: { value: o.darkCut === false ? 0 : 1 },
      uGrade: { value: new THREE.Vector4(o.contrast ?? 1.06, o.saturation ?? 0.95, o.gain ?? 1.0, o.gamma ?? 1.0) } },
    vertexShader: /* glsl */`
      ${GLSL}
      uniform float uCurvL; attribute float aElev; varying vec2 vUv; varying vec2 vXZ; varying float vElev;
      void main() { vUv = uv; vElev = aElev; vec4 w = modelMatrix * vec4(position, 1.); vXZ = w.xz; float d = length(w.xz - uCam.xz); w.y -= uCurvL * d * d / (2. * R_EARTH);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${GLSL}
      uniform sampler2D map; uniform vec4 uFade, uGrade; uniform float uFadeW, uOn, uCut, uDarkCut; varying vec2 vUv; varying vec2 vXZ; varying float vElev;
      void main() {
        if (vElev < uCut && uCamH > 1200.) discard;                  // from altitude the ocean (with its own shallows) owns everything below sea level
        vec3 c = texture2D(map, vUv).rgb;
        if (uDarkCut > .5 && uCamH > 1200. && vElev < 25. && dot(c, vec3(.33)) < .07 && c.b >= c.r) discard;   // dark water pixels inside the coarse DEM's coast: the ocean shows instead
        c = pow(max(c, 0.), vec3(uGrade.w));
        c = (c - .42) * uGrade.x + .42;
        float l = dot(c, vec3(.2126, .7152, .0722)); c = mix(vec3(l), c, uGrade.y);
        c = pow(clamp(c, 0., 1.), vec3(2.2)) * uGrade.z;                  // display photo -> linear light
        c *= uLandTint * uLandGain;
        float a = 1.;
        if (uOn > .5) { vec2 d = min(vXZ - uFade.xy, uFade.zw - vXZ); a = smoothstep(0., uFadeW, min(d.x, d.y)); if (a < .003) discard; }
        gl_FragColor = vec4(c, .5);
      }`,
    transparent: false,
  });
  for (let li = levels.length - 1; li >= 0; li--) {
    const L = levels[li], D = dems[li], [w, s, e, n] = L.bbox, [W, H] = L.size;
    const finer = li > 0 ? levels[li - 1] : null; let hole = null;
    if (finer) { const [a, b] = P.xz(finer.bbox[3], finer.bbox[0]), [c, d] = P.xz(finer.bbox[1], finer.bbox[2]); const band = (c - a) * 0.04; hole = [a + band, b + band, c - band, d - band]; }
    const [cols, rows] = L.tiles; const jobs = [];
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const px0 = tx * 1024, py0 = ty * 1024, px1 = Math.min(W, px0 + 1024), py1 = Math.min(H, py0 + 1024);
      const lon0 = w + (e - w) * px0 / W, lon1 = w + (e - w) * px1 / W, lat0 = n - (n - s) * py0 / H, lat1 = n - (n - s) * py1 / H;
      const sx = Math.max(2, Math.round(segs * (px1 - px0) / 1024)), sy = Math.max(2, Math.round(segs * (py1 - py0) / 1024));
      const pos = [], uv = [], idx = [], el = [];
      for (let j = 0; j <= sy; j++) for (let i = 0; i <= sx; i++) {
        const lat = lat0 + (lat1 - lat0) * j / sy, lon = lon0 + (lon1 - lon0) * i / sx; const [x, z] = P.xz(lat, lon);
        let hh = sample(D, lat, lon) ?? elevAt(lat, lon); const raw = hh; hh = hh > 0 ? hh * ex : hh; hh -= sink * (1 - Math.min(1, Math.max(0, hh / 30)));
        pos.push(x, hh, z); uv.push(i / sx, 1 - j / sy); el.push(raw);
      }
      for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
        const a = j * (sx + 1) + i, b = a + 1, c = a + sx + 1, d = c + 1;
        if (hole) { const x0 = pos[a * 3], x1 = pos[d * 3], z0 = pos[a * 3 + 2], z1 = pos[d * 3 + 2]; if (Math.min(x0, x1) > hole[0] && Math.max(x0, x1) < hole[2] && Math.min(z0, z1) > hole[1] && Math.max(z0, z1) < hole[3]) continue; }
        // skip cells entirely deep under water (the ocean covers them; saves fill)
        if (o.skipDeep !== false && Math.max(pos[a * 3 + 1], pos[b * 3 + 1], pos[c * 3 + 1], pos[d * 3 + 1]) < -(o.deepCut ?? 60)) continue;
        idx.push(a, c, b, b, c, d);
      }
      if (!idx.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aElev', new THREE.Float32BufferAttribute(el, 1)); g.setIndex(idx); g.computeBoundingSphere();
      jobs.push(loader.loadAsync(set.root + L.image.replace('{row}', ty).replace('{col}', tx)).then(tex => {
        tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        let fade = null, fw = 0; if (li < levels.length - 1) { const [a, b] = P.xz(n, w), [c, d] = P.xz(s, e); fade = new THREE.Vector4(a, b, c, d); fw = (c - a) * 0.04; }
        const m = new THREE.Mesh(g, mat(tex, fade, li)); if (fade) m.material.uniforms.uFadeW.value = fw;
        m.position.y = -(o.levelDrop ?? 1.5) * li;   // coarser levels sit a little lower: the finer one wins the overlap band (no polygon offset: it would beat the ocean from far away)
        m.renderOrder = levels.length - li; m.frustumCulled = false; m.name = `L${L.id}/${ty}_${tx}`; meshes.push(m); group.add(m);
      }));
    }
    await Promise.all(jobs);
  }
  // bathymetry for the ocean: the finest DEM as a float texture over its bbox
  const depthTex = (li) => { const D = dems[li]; const t = new THREE.DataTexture(D.data, D.w, D.h, THREE.RedFormat, THREE.FloatType); t.flipY = false; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
    const [w, s, e, n] = D.bbox, [x0, z0] = P.xz(n, w), [x1, z1] = P.xz(s, e); return { tex: t, box: new THREE.Vector4(x0, z0, x1, z1) }; };
  const bathy = dems.map((_, i) => depthTex(i));
  return {
    set, group, projection: P, levels, attribution: set.attribution, meshes, bathy,
    elev: elevAt, height: (x, z) => { const [la, lo] = P.geo(x, z); return elevAt(la, lo); },
    toLocal: (lat, lon, y = 0, out = new THREE.Vector3()) => { const [x, z] = P.xz(lat, lon); return out.set(x, y, z); },
    geo: P.geo,
    setCurvature(k) { for (const m of meshes) m.material.uniforms.uCurvL.value = k; },
    dispose() { for (const m of meshes) { m.geometry.dispose(); m.material.uniforms.map.value.dispose(); m.material.dispose(); } for (const b of bathy) b.tex.dispose(); },
  };
}
