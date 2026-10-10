// Maps, markets and streets: map (Natural Earth relief), chart (PLTR in 3D), exchange (listing day),
// protest (a British street at dusk), hq (Denver -> Miami).
// Data is pre-baked in assets/geo (see SOURCES.md) and loaded once at module load; every frame is a
// pure function of (t, p).
import * as THREE from 'three';
import * as K from 'kit';
import * as C from '/engine/cine.js';

const GEO = '/projects/palantir/assets/geo/';
const json = (f) => fetch(GEO + f).then(r => { if (!r.ok) throw new Error(`[geo] ${f} ${r.status}`); return r.json(); });
const img = (f) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(`[geo] ${f}`)); i.src = GEO + f; });
const [VEC, DEMMETA, PLTR] = await Promise.all([json('vectors.json'), json('dem.json'), json('pltr.json'), C.preload(null, { characters: ['UAL'], hdris: [] })]);
const DEM = {};
await Promise.all(Object.keys(DEMMETA).map(async (k) => {
  const im = await img(`dem-${k}.png`); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
  const px = x.getImageData(0, 0, im.width, im.height).data; const r = new Uint8Array(im.width * im.height);
  for (let i = 0; i < r.length; i++) r[i] = px[i * 4];
  DEM[k] = { ...DEMMETA[k], img: im, w: im.width, h: im.height, r };
}));

// ---------------------------------------------------------------- projection (Mercator, degrees)
const D2R = Math.PI / 180;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) / D2R;
const unmerc = (m) => (2 * Math.atan(Math.exp(m * D2R)) - Math.PI / 2) / D2R;
// world: x = lon, z = -merc(lat), y = up
const CITY = {
  nyc: [-74.006, 40.713], dc: [-77.04, 38.9], denver: [-104.99, 39.74], miami: [-80.19, 25.76], nola: [-90.07, 29.95], baton: [-91.15, 30.45],
  kyiv: [30.52, 50.45], lviv: [24.03, 49.84], przemysl: [22.77, 49.78], rivne: [26.25, 50.62], zhytomyr: [28.66, 50.25], warsaw: [21.01, 52.23],
  telaviv: [34.78, 32.08], jerusalem: [35.21, 31.77], berlin: [13.4, 52.52], london: [-0.13, 51.5], paris: [2.35, 48.86], moscow: [37.62, 55.75],
  rome: [12.5, 41.9], vienna: [16.37, 48.21], minsk: [27.56, 53.9], budapest: [19.04, 47.5], kharkiv: [36.23, 49.99], odesa: [30.73, 46.48],
  chicago: [-87.63, 41.88], la: [-118.24, 34.05], houston: [-95.37, 29.76], atlanta: [-84.39, 33.75],
};

function demSample(d, lon, lat) {
  const [w, s, e, n] = d.bbox; if (lon < w || lon > e || lat < s || lat > n) return null;
  const u = (lon - w) / (e - w) * (d.w - 1), v = (merc(n) - merc(lat)) / (merc(n) - merc(s)) * (d.h - 1);
  const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0, at = (x, y) => d.r[Math.min(d.h - 1, y) * d.w + Math.min(d.w - 1, x)] / 255;
  const r = (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
  return r * r * 6; // km
}

export function makeGeo(H) {
  const { base, caption, sourceLine, wt, canvasTex, mesh, std, RED, SODIUM, FLUO, ICE, PAPER, CAP, SERIF, PP } = H;
  const MONO = (size = 0.78, color = '#d9d2c3', ls = 0.2) => `font:500 ${size}em 'Plex Mono',monospace;letter-spacing:${ls}em;text-transform:uppercase;color:${color};white-space:nowrap;line-height:1.3`;
  const scope = (o) => ({ ...o, scope: true });
  const V3 = (a) => new THREE.Vector3(...a);

  // ---------------------------------------------------------------- label system (DOM, leader lines)
  function labels(layer) {
    const svg = K.svgLayer(layer); const list = [];
    const api = {
      svg,
      add(text, anchor, { dx = 70, dy = -54, size = 0.74, color = '#d9d2c3', dot = true, dotColor = null, line = 'rgba(217,210,195,.55)', sub = '' } = {}) {
        const pl = svg.make('polyline', { fill: 'none', stroke: line, 'stroke-width': 1.2 });
        const c = dot ? svg.make('circle', { r: 3.2, fill: dotColor ?? color }) : null;
        const el = K.div(layer, `${MONO(size * 1.25, color)}`, text + (sub ? `<div style="${MONO(Math.min(0.62, size * 0.62) / (size * 1.25) , '#8f897d', 0.16)};margin-top:.3em">${sub}</div>` : ''));
        const L = { el, anchor, dx, dy, update(camera, a, scr) {
          camera.updateMatrixWorld(); const v = typeof anchor === 'function' ? anchor() : anchor; const P = v.clone().project(camera);
          const vis = P.z < 1 && a > 0.001;
          const ax = scr ? scr[0] : (P.x + 1) / 2 * 1920, ay = scr ? scr[1] : (1 - P.y) / 2 * 1080;
          const k = K.outCubic(K.clamp(a * 1.6)), kl = K.clamp(a * 2 - 0.5);
          const ex = ax + L.dx * 0.55 * k, ey = ay + L.dy * k, fx = ex + (L.dx - L.dx * 0.55) * kl;
          pl.setAttribute('points', `${ax},${ay} ${ex},${ey} ${fx},${ey}`); pl.setAttribute('opacity', vis ? Math.min(1, a * 3) : 0);
          if (c) { c.setAttribute('cx', ax); c.setAttribute('cy', ay); c.setAttribute('opacity', vis ? Math.min(1, a * 4) : 0); }
          const s = window.innerHeight / 1080, left = L.dx >= 0;
          el.style.left = `${(left ? ex + 4 : fx) * s}px`; el.style.top = `${(ey - 6) * s}px`;
          el.style.transform = `translate(${left ? 0 : '-100%'}, -100%)`; el.style.textAlign = left ? 'left' : 'right';
          el.style.opacity = vis ? kl : 0; el.style.clipPath = left ? `inset(-20% ${100 - kl * 100}% -20% 0)` : `inset(-20% 0 -20% ${100 - kl * 100}%)`;
        } };
        list.push(L); return L;
      },
    };
    return api;
  }

  // ================================================================= MAP
  // Mask texture: R = land (lakes cut out), G = coastline + lake shores + rivers, B = borders (+ US states).
  function rasterMask(src, bbox, W, { coast = 0.9, river = 0.7, border = 0.8, states = 0.7, riverA = 0.3, statesA = 0.45 } = {}) {
    const [w, s, e, n] = bbox, m0 = merc(s), m1 = merc(n); const Hh = Math.round(W * (m1 - m0) / (e - w));
    const c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, W, Hh);
    const X = (lon) => (lon - w) / (e - w) * W, Y = (lat) => (m1 - merc(Math.max(-85, Math.min(85, lat)))) / (m1 - m0) * Hh;
    const path = (arr, close) => { x.moveTo(X(arr[0]), Y(arr[1])); for (let i = 2; i < arr.length; i += 2) x.lineTo(X(arr[i]), Y(arr[i + 1])); if (close) x.closePath(); };
    const fill = (rings, style) => { x.beginPath(); for (const r of rings) path(r, true); x.fillStyle = style; x.fill('evenodd'); };
    const stroke = (lines, style, lw, close = false) => { x.beginPath(); for (const l of lines) path(l, close); x.strokeStyle = style; x.lineWidth = lw; x.lineJoin = x.lineCap = 'round'; x.stroke(); };
    fill(src.land, '#f00');
    for (const r of src.lakes) fill([r], '#000');
    x.globalCompositeOperation = 'lighter';
    stroke(src.coast, '#0f0', coast); stroke(src.lakes, `rgba(0,255,0,.8)`, coast * 0.8, true);
    stroke(src.rivers, `rgba(0,${Math.round(255 * riverA)},0,1)`, river);
    stroke(src.borders, '#00f', border);
    if (src.states && statesA > 0) stroke(src.states, `rgba(0,0,${Math.round(255 * statesA)},1)`, states);
    x.globalCompositeOperation = 'source-over';
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
  }
  function rasterCountry(a3list, bbox, W = 1024) {
    const [w, s, e, n] = bbox, m0 = merc(s), m1 = merc(n); const Hh = Math.round(W * (m1 - m0) / (e - w));
    const c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, Hh);
    const X = (lon) => (lon - w) / (e - w) * W, Y = (lat) => (m1 - merc(lat)) / (m1 - m0) * Hh;
    x.filter = 'blur(1.5px)'; x.beginPath();
    for (const a3 of a3list) for (const r of VEC.countries[a3] ?? []) { x.moveTo(X(r[0]), Y(r[1])); for (let i = 2; i < r.length; i += 2) x.lineTo(X(r[i]), Y(r[i + 1])); x.closePath(); }
    x.fillStyle = '#fff'; x.fill('evenodd');
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
  }
  const BLACK = (() => { const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); t.needsUpdate = true; return t; })();

  const TERRAIN_VS = `
    uniform sampler2D uDem, uMask; uniform float uExag, uVLod;
    varying vec2 vUv; varying vec3 vW;
    void main(){ vUv = uv; vec3 p = position; float r = textureLod(uDem, uv, uVLod).r;
      float land = smoothstep(0.55, 1.0, textureLod(uMask, uv, uVLod + 2.0).r);
      p.y = r * r * 6.0 * uExag * land; vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const TERRAIN_FS = `
    uniform sampler2D uDem, uMask, uHi; uniform vec4 uHole0, uHole1, uHole2; uniform float uMaskW; uniform float uExag, uT, uFogD, uPoolMin, uFocusR, uCoastA, uBorder, uEdge, uHiA, uShStep, uOpacity, uSeaHaze;
    uniform vec4 uBox; uniform vec2 uTex; uniform vec3 uL, uLCol, uAmb, uFog, uHaze, uSea, uLand, uCoast, uFocus, uHiCol;
    varying vec2 vUv; varying vec3 vW;
    float hh(vec2 uv){ float r = texture(uDem, uv, 2.0).r; return r * r * 6.0 * uExag; }
    bool inHole(vec4 h){ return vW.x > h.x && vW.x < h.z && vW.z > h.y && vW.z < h.w; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s * 1.14; }
    void main(){
      if (inHole(uHole0) || inHole(uHole1) || inHole(uHole2)) discard;
      vec4 m = texture(uMask, vUv); float land = smoothstep(0.25, 0.75, m.r);
      float bw = uBox.z - uBox.x, bh = uBox.w - uBox.y;
      float pool = mix(uPoolMin, 1.0, exp(-pow(distance(vW.xz, uFocus.xz) / uFocusR, 2.0)));
      vec3 col;
      float dpt = texture(uDem, vUv).g;
      float n = fbm(vW.xz * 0.6 + vec2(uT * 0.06, uT * 0.025));
      vec3 sea = uSea * (1.0 + (1.0 - smoothstep(0.0, 0.3, dpt)) * 0.9);
      sea = mix(sea, uHaze, smoothstep(0.3, 0.8, n) * uSeaHaze) * (0.45 + 0.55 * pool);
      col = sea;
      if (land > 0.001) {
        vec2 du = vec2(uTex.x * 1.5, 0.0), dv = vec2(0.0, uTex.y * 1.5);
        float sx = 3.0 * uTex.x * bw, sz = 3.0 * uTex.y * bh;
        vec3 N = normalize(vec3(-(hh(vUv + du) - hh(vUv - du)) / sx * 0.65, 1.0, (hh(vUv + dv) - hh(vUv - dv)) / sz * 0.65));
        vec3 L = normalize(uL); float h0 = hh(vUv); float sh = 1.0;
        vec2 lxz = normalize(L.xz); float tanE = L.y / max(length(L.xz), 1e-3);
        for (int i = 1; i <= 5; i++) { float d = uShStep * float(i) * float(i) * 0.9;
          float hs = hh(vUv + vec2(lxz.x / bw, -lxz.y / bh) * d);
          sh = min(sh, clamp(1.0 - (hs - h0 - d * tanE) / (uShStep * 0.6 * tanE + 1e-4), 0.0, 1.0)); }
        float ekm = h0 / max(uExag, 1e-5);
        vec3 alb = uLand * (0.85 + 0.9 * clamp(ekm / 2.5, 0.0, 1.0)) * (0.9 + 0.2 * vn(vW.xz * 6.0));
        float ndl = max(dot(N, L), 0.0);
        vec3 lit = alb * (uAmb * (0.6 + 0.4 * N.y) + uLCol * pow(ndl, 1.6) * (0.15 + 0.85 * sh)) * pool;
        lit += uHiCol * texture(uHi, vUv).r * uHiA * (0.5 + 0.5 * pool);
        col = mix(sea, lit, land);
      }
      float mag = 1.0 / max(fwidth(vUv.x) * uMaskW, 1e-4); float lk = clamp(1.8 / mag, 0.18, 1.0);
      vec2 ln = mag > 1.5 ? smoothstep(vec2(0.25), vec2(0.75), m.gb) : m.gb; m.g = ln.x * lk; m.b = ln.y * lk;
      col = mix(col, uCoast * (0.3 + 0.7 * pool), clamp(m.g, 0.0, 1.0) * uCoastA);
      col = mix(col, uCoast * (0.3 + 0.7 * pool), clamp(m.b, 0.0, 1.0) * uBorder);
      float d = distance(cameraPosition, vW); col = mix(col, uFog, 1.0 - exp(-d * uFogD));
      float ef = uEdge > 0.0 ? smoothstep(0.0, uEdge, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y))) : 1.0;
      gl_FragColor = vec4(col, ef * uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  // A terrain plane for one Mercator box.
  function terrain(scene, src, demKey, U, { W = 4096, seg = 320, edge = 0.06, order = -1, mask = {}, hi = null } = {}) {
    const d = DEM[demKey]; const [w, s, e, n] = d.bbox; const m0 = merc(s), m1 = merc(n);
    const sx = seg, sy = Math.max(8, Math.round(seg * (m1 - m0) / (e - w)));
    const g = new THREE.PlaneGeometry(1, 1, sx, sy); const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const u = uv.getX(i), v = uv.getY(i); pos.setXYZ(i, w + u * (e - w), 0, -(m0 + v * (m1 - m0))); }
    g.computeBoundingSphere(); g.boundingSphere.radius *= 2;
    const demTex = new THREE.Texture(d.img); demTex.needsUpdate = true; demTex.colorSpace = THREE.NoColorSpace; demTex.minFilter = THREE.LinearMipmapLinearFilter;
    const maskTex = rasterMask(src, d.bbox, W, mask);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uDem: { value: demTex }, uMask: { value: maskTex }, uHi: { value: hi ? rasterCountry(hi, d.bbox) : BLACK },
        uMaskW: { value: W }, uHole0: { value: new THREE.Vector4(0, 0, 0, 0) }, uHole1: { value: new THREE.Vector4(0, 0, 0, 0) }, uHole2: { value: new THREE.Vector4(0, 0, 0, 0) }, uBox: { value: new THREE.Vector4(w, -m1, e, -m0) }, uVLod: { value: Math.max(0, Math.log2(d.w / sx)) }, uTex: { value: new THREE.Vector2(1 / d.w, 1 / d.h) }, uEdge: { value: edge }, ...U },
      vertexShader: TERRAIN_VS, fragmentShader: TERRAIN_FS, transparent: order > -3, depthWrite: true, fog: false,
    });
    const me = new THREE.Mesh(g, mat); me.renderOrder = order; me.frustumCulled = false; scene.add(me);
    { const ex = (e - w) * edge * 1.02, ez = (m1 - m0) * edge * 1.02; me.userData.inner = new THREE.Vector4(w + ex, -m1 + ez, e - ex, -m0 - ez); }
    if (order <= -2) { mat.depthWrite = false; }
    return me;
  }
  function terrainUniforms(o = {}) {
    const c = (v) => ({ value: new THREE.Color(v) });
    return {
      uExag: { value: o.exag ?? 0.2 }, uT: { value: 0 }, uFogD: { value: o.fogD ?? 0.004 }, uPoolMin: { value: o.poolMin ?? 0.35 }, uFocusR: { value: o.focusR ?? 20 },
      uFocus: { value: new THREE.Vector3() }, uCoastA: { value: o.coastA ?? 0.42 }, uBorder: { value: o.border ?? 0.1 }, uHiA: { value: 0 }, uShStep: { value: o.shStep ?? 0.05 },
      uOpacity: { value: 1 }, uSeaHaze: { value: o.seaHaze ?? 0.55 },
      uL: { value: new THREE.Vector3(...(o.light ?? [-1, 0.32, 0.35])) }, uLCol: { value: new THREE.Color(o.lcol ?? 0xfff0dc).multiplyScalar(o.lint ?? 4.6) }, uAmb: c(o.amb ?? 0x141a22), uFog: c(o.fog ?? 0x07090c),
      uHaze: c(o.haze ?? 0x1a2128), uSea: c(o.sea ?? 0x05070a), uLand: c(o.land ?? 0x56534e), uCoast: c(o.coast ?? 0xcfc6b4), uHiCol: c(o.hiCol ?? 0x2a2218),
    };
  }

  // the shared map stage: world base + regional detail planes, one key light, haze
  function mapStage(ctx, shot, { regions = [], exag = 18, lat0 = 45, ...o } = {}) {
    const b = base(ctx, { floor: null, fog: o.fog ?? 0x07090c, density: 0, fov: 30 });
    const { scene, camera } = b; scene.fog = null;
    const U = terrainUniforms({ ...o, exag: exag * Math.cos(lat0 * D2R) / 111.32 });
    const unitPerKm = U.uExag.value;
    const S0 = terrain(scene, VEC.world, 'world', U, { W: 4096, seg: 400, edge: 0, order: -3, mask: { coast: 0.9, river: 0.6, border: 0.8, statesA: 0, riverA: 0.35 } });
    const planes = regions.map((r, i) => terrain(scene, VEC.regions[r.key], r.key, U, { W: r.W ?? 4096, seg: r.seg ?? 320, edge: r.edge ?? 0.05, order: -2 + i * 0.01, mask: r.mask ?? {}, hi: r.hi }));
    const all = [S0, ...planes]; all.forEach((pl, i) => { const area = (h) => (h.z - h.x) * (h.w - h.y); const later = all.slice(i + 1).map(q => q.userData.inner).sort((a, b) => area(b) - area(a)); later.slice(0, 3).forEach((h, k) => pl.material.uniforms['uHole' + k].value.copy(h)); });
    // finest-first height lookup, in world units
    const order = [...regions.map(r => r.key).reverse(), 'world'];
    const hAt = (lon, lat) => { for (const k of order) { const v = demSample(DEM[k], lon, lat); if (v !== null) return v * unitPerKm; } return 0; };
    const P = (lon, lat, lift = 0) => new THREE.Vector3(lon, hAt(lon, lat) + lift, -merc(lat));
    const LB = labels(b.layer);
    const camClip = () => { const g = Math.max(0.02, camera.position.y - hAt(camera.position.x, unmerc(-camera.position.z)));
      const nn = Math.max(0.004, g * 0.03), ff = Math.max(400, g * 60); if (camera.near !== nn || camera.far !== ff) { camera.near = nn; camera.far = ff; camera.updateProjectionMatrix(); } };
    return { ...b, U, P, hAt, LB, planes, camClip, tick(t, focus) { U.uT.value = t; if (focus) U.uFocus.value.copy(focus); } };
  }

  // a glowing route (tube) that draws on; points are world Vector3s
  function route(scene, pts, { r = 0.04, color = 0xf3e6cc, glow = 0.35, glowR = 3.2, seg = 400 } = {}) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const mk = (rad, mat) => { const g = new THREE.TubeGeometry(curve, seg, rad, 8, false); const m = new THREE.Mesh(g, mat); m.renderOrder = 5; m.frustumCulled = false; scene.add(m); return m; };
    const core = mk(r, new THREE.MeshBasicMaterial({ color, transparent: true, fog: false, toneMapped: false }));
    const halo = mk(r * glowR, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: glow, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(r * 2.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, fog: false, toneMapped: false }));
    head.renderOrder = 6; scene.add(head);
    const draw = (k) => { k = K.clamp(k); const n = Math.floor(seg * k) * 8 * 6; core.geometry.setDrawRange(0, n); halo.geometry.setDrawRange(0, n);
      head.position.copy(curve.getPointAt(Math.max(1e-4, k))); head.visible = k > 0.001 && k < 0.999; core.visible = halo.visible = k > 0.001; };
    draw(0); return { curve, draw, head, core, halo };
  }
  // flat expanding rings: a ping
  function ping(scene, at, { color = RED, size = 0.6, n = 3, upright = false } = {}) {
    const flat = (g) => upright ? g : g.rotateX(-Math.PI / 2);
    const g = flat(new THREE.RingGeometry(0.86, 1, 64));
    const rings = Array.from({ length: n }, () => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false }));
      m.position.copy(at); m.renderOrder = 7; scene.add(m); return m; });
    const dot = new THREE.Mesh(flat(new THREE.CircleGeometry(1, 40)), new THREE.MeshBasicMaterial({ color, transparent: true, fog: false, toneMapped: false }));
    dot.position.copy(at).add(new THREE.Vector3(0, 0.002, 0)); dot.renderOrder = 8; scene.add(dot);
    const halo = new THREE.Mesh(flat(new THREE.CircleGeometry(1, 40)), new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, map: radial() }));
    halo.position.copy(dot.position); halo.renderOrder = 7; halo.material.depthTest = false; scene.add(halo);
    return { update(t, t0) { const on = t >= t0;
      dot.visible = halo.visible = on; const a = K.outCubic(K.range(t, t0, t0 + 0.25)); dot.scale.setScalar(size * 0.14 * a); halo.scale.setScalar(size * 0.9 * a); halo.material.opacity = 0.6 * a;
      rings.forEach((m, i) => { const ph = (t - t0 - i * 0.55) / 1.65; const k = ph < 0 ? -1 : ph % 1; m.visible = on && k >= 0 && (t - t0) < 6;
        m.scale.setScalar(size * (0.15 + 1.1 * K.outCubic(Math.max(0, k)))); m.material.opacity = 0.85 * Math.pow(1 - Math.max(0, k), 1.6); }); } };
  }
  let RADIAL = null;
  function radial() { if (RADIAL) return RADIAL; RADIAL = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); return RADIAL; }
  // great-circle points between two lon/lat pairs
  function gc([lo1, la1], [lo2, la2], n = 120) {
    const v = (lo, la) => [Math.cos(la * D2R) * Math.cos(lo * D2R), Math.cos(la * D2R) * Math.sin(lo * D2R), Math.sin(la * D2R)];
    const a = v(lo1, la1), b = v(lo2, la2); const om = Math.acos(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]); const out = [];
    for (let i = 0; i <= n; i++) { const f = i / n, s1 = Math.sin((1 - f) * om) / Math.sin(om), s2 = Math.sin(f * om) / Math.sin(om);
      const p = [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2]; out.push([Math.atan2(p[1], p[0]) / D2R, Math.asin(p[2]) / D2R]); }
    return out;
  }
  const W3 = (lon, lat, y = 0) => new THREE.Vector3(lon, y, -merc(lat));

  const MAP = {
    // ---- slow push across Europe towards Ukraine
    europe(ctx, shot) {
      const S = mapStage(ctx, shot, { regions: [{ key: 'eu', W: 4096, seg: 360, hi: ['UKR'] }], exag: 16, lat0: 48, light: [-0.9, 0.3, 0.55], focusR: 16, poolMin: 0.3, fogD: 0.012, coastA: 0.42, border: 0.12, hiCol: 0x4a3a28 });
      const { camera, P, LB, U } = S; const kyiv = CITY.kyiv;
      const move = C.path([
        { pos: W3(0, 37.5, 13).toArray(), look: W3(16, 50.5, 0).toArray(), mm: 32 },
        { pos: W3(9.5, 39.5, 10.5).toArray(), look: W3(24, 50.5, 0).toArray(), mm: 35 },
        { pos: W3(17.5, 42.5, 7.6).toArray(), look: W3(29, 50.0, 0).toArray(), mm: 40 },
      ], { duration: shot.duration, accel: 0.2, decel: 0.45, float: 0.03 });
      const cities = [['Berlin', CITY.berlin, 70, -46], ['Warsaw', CITY.warsaw, 70, -50], ['Vienna', CITY.vienna, -70, -40], ['Minsk', CITY.minsk, 70, -40]].map(([n, c, dx, dy]) => [LB.add(n, P(...c, 0.02), { dx, dy, size: 0.62, color: '#a39c8f', line: 'rgba(163,156,143,.4)' }), n]);
      const ua = LB.add('Ukraine', P(31.2, 49.0, 0.05), { dx: 90, dy: -80, size: 0.95, color: '#efe7d6', dot: false });
      const kv = LB.add('Kyiv', P(...kyiv, 0.03), { dx: 60, dy: -40, size: 0.7 });
      const tU = Math.max(shot.duration * 0.45, wt(shot, 'ukraine') - 0.6);
      return scope({ ...S, update(t, p) {
        move(camera, p, t); S.camClip();
        S.tick(t, P(K.lerp(16, 28, K.inOut(p)), K.lerp(49, 50, p)));
        U.uHiA.value = 0.22 * K.smooth(K.range(t, tU - 0.4, tU + 1.4));
        cities.forEach(([l], i) => l.update(camera, K.range(t, 0.6 + i * 0.35, 1.6 + i * 0.35) * (1 - 0.6 * K.range(t, tU, tU + 1))));
        ua.update(camera, K.range(t, tU, tU + 1.2)); kv.update(camera, K.range(t, tU + 0.4, tU + 1.4));
      } });
    },

    // ---- route from the Polish border to Kyiv, ping, caption + source
    ukraine(ctx, shot) {
      const P0 = shot.params;
      const S = mapStage(ctx, shot, { regions: [{ key: 'eu', W: 3072, seg: 260 }, { key: 'ua', W: 4096, seg: 360, hi: ['UKR'] }], exag: 26, lat0: 50, light: [-0.75, 0.24, 0.6], focusR: 7, poolMin: 0.25, fogD: 0.02, coastA: 0.5, border: 0.15, hiCol: 0x3a2e22 });
      const { scene, camera, P, LB, U, layer } = S;
      const way = [[22.95, 49.8], CITY.lviv, [25.6, 50.35], CITY.rivne, [27.4, 50.5], CITY.zhytomyr, [29.6, 50.42], CITY.kyiv];
      const pts = []; for (let i = 0; i < way.length - 1; i++) for (let j = 0; j < 8; j++) { const f = j / 8; const lo = K.lerp(way[i][0], way[i + 1][0], f), la = K.lerp(way[i][1], way[i + 1][1], f); pts.push(P(lo, la, 0.06)); }
      pts.push(P(...CITY.kyiv, 0.06));
      const R = route(scene, pts, { r: 0.011, glowR: 3.2, glow: 0.22 });
      const kyiv = P(...CITY.kyiv, 0.01); const pg = ping(scene, kyiv, { size: 0.42 });
      const t0 = Math.min(1.0, wt(shot, 'crossed') - 0.2), t1 = Math.max(t0 + 2.5, Math.min(shot.duration * 0.7, wt(shot, 'met')));
      const draw = (t) => K.inOut(K.range(t, t0, t1));
      const head = (t) => R.curve.getPointAt(Math.max(1e-4, draw(t)));
      // camera: low three-quarter from the south-west, trucking east with the line, 50 -> 65 mm
      const move = C.path([
        { pos: W3(22.0, 44.6, 6.2).toArray(), look: W3(25.4, 50.1, 0).toArray(), mm: 35 },
        { pos: W3(25.6, 45.4, 5.0).toArray(), look: W3(28.0, 50.3, 0).toArray(), mm: 38 },
        { pos: W3(28.6, 46.7, 3.3).toArray(), look: W3(30.3, 50.4, 0).toArray(), mm: 45 },
      ], { duration: shot.duration, accel: 0.25, decel: 0.45, float: 0.008 });
      const lPl = LB.add('Poland', P(21.6, 50.6, 0.03), { dx: -60, dy: -46, size: 0.62, color: '#a39c8f', dot: false, line: 'rgba(163,156,143,.35)' });
      const lLv = LB.add('Lviv', P(...CITY.lviv, 0.05), { dx: -50, dy: -50, size: 0.66 });
      const lKy = LB.add('Kyiv', P(...CITY.kyiv, 0.05), { dx: 80, dy: -70, size: 0.95, color: '#efe7d6', sub: 'June 2 2022' });
      const cap = caption(layer, P0.caption, 'left:6%;top:15%'), src = sourceLine(layer, P0.source); if (src) src.style.bottom = '15%';
      return scope({ ...S, update(t, p) {
        move(camera, p, t); S.camClip(); const k = draw(t); R.draw(k);
        S.tick(t, head(t)); U.uHiA.value = 0.15;
        pg.update(t, t1 - 0.05);
        lPl.update(camera, K.range(t, 0.4, 1.4)); lLv.update(camera, K.range(t, t0 + (t1 - t0) * 0.12, t0 + (t1 - t0) * 0.12 + 0.9));
        lKy.update(camera, K.range(t, t1 + 0.1, t1 + 1.2));
        if (cap) cap.style.opacity = K.range(t, 0.5, 1.3); if (src) src.style.opacity = K.range(t, t1 + 0.6, t1 + 1.4);
      } });
    },

    // ---- an arc from the US east coast to Tel Aviv; the camera rides behind the arc head
    telaviv(ctx, shot) {
      const P0 = shot.params;
      const S = mapStage(ctx, shot, { regions: [{ key: 'us', W: 4096, seg: 200 }, { key: 'nyc', W: 2048, seg: 160, edge: 0.15 }, { key: 'eu', W: 3072, seg: 260 }, { key: 'tlv', W: 4096, seg: 300, hi: ['ISR'] }],
        exag: 9, lat0: 38, light: [-0.6, 0.28, 0.75], focusR: 22, poolMin: 0.28, fogD: 0.006, coastA: 0.5, border: 0.15, hiCol: 0x3a2e22 });
      const { scene, camera, P, LB, U, layer } = S;
      const A = CITY.nyc, B = CITY.telaviv; const g = gc(A, B, 160);
      const pts = g.map(([lo, la], i) => { const f = i / (g.length - 1); return P(lo, la, 0.05 + Math.sin(Math.PI * f) * 7.5); });
      const R = route(scene, pts, { r: 0.035, glowR: 3.2, glow: 0.25, seg: 600 });
      const tlv = P(...B, 0.01); const pg = ping(scene, tlv, { size: 0.7 });
      const t0 = 0.4, t1 = Math.max(t0 + 4.6, Math.min(shot.duration * 0.7, wt(shot, 'agreed') + 0.8));
      const ease = (t) => { const x = K.range(t, t0, t1); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
      // the camera rides: behind and above the head, looking along the arc; then settles over Israel
      const smoothHead = (t) => { const a = [0, 0, 0]; let wsum = 0; for (let i = 0; i <= 10; i++) { const w = 1 - i / 11; const q = R.curve.getPointAt(K.clamp(ease(t - i * 0.08), 1e-4, 1)); a[0] += q.x * w; a[1] += q.y * w; a[2] += q.z * w; wsum += w; } return new THREE.Vector3(a[0] / wsum, a[1] / wsum, a[2] / wsum); };
      const endPos = W3(27.2, 24.6, 9.5), endLook = W3(33.6, 32.4, 0);
      const cap = caption(layer, P0.caption, 'left:6%;top:15%'), src = sourceLine(layer, P0.source); if (src) src.style.bottom = '15%';
      const lA = LB.add('New York', P(...A, 0.05), { dx: -70, dy: -50, size: 0.66 });
      const lB = LB.add('Tel Aviv', P(...B, 0.03), { dx: 80, dy: -64, size: 0.95, color: '#efe7d6', sub: 'Israel · Ministry of Defense' });
      const lJ = LB.add('Jerusalem', P(...CITY.jerusalem, 0.03), { dx: 60, dy: 50, size: 0.56, color: '#8f897d', line: 'rgba(143,137,125,.35)' });
      return scope({ ...S, update(t, p) {
        const k = ease(t); R.draw(k);
        const h = smoothHead(t), ahead = R.curve.getPointAt(K.clamp(ease(t) + 0.08, 0, 1));
        const dir = ahead.clone().sub(h).setY(0).normalize(); if (!isFinite(dir.x) || dir.lengthSq() < 0.5) dir.set(1, 0, 0);
        const side = new THREE.Vector3(-dir.z, 0, dir.x);
        const ride = h.clone().addScaledVector(dir, -18).addScaledVector(side, 9).add(new THREE.Vector3(0, 12, 0));
        const rideLook = h.clone().addScaledVector(dir, 12).setY(h.y * 0.5);
        const land = K.inOut(K.range(t, t1 - 1.3, t1 + 1.8));
        const start = W3(-80.5, 35.5, 6.5), startLook = W3(-71.5, 41.0, 0); const intro = K.inOut(K.range(t, 0, t0 + 1.6));
        const pos = start.clone().lerp(ride, intro).lerp(endPos, land), look = startLook.clone().lerp(rideLook, intro).lerp(endLook, land);
        const hh = K.handheld(t, 0.03, 4); camera.position.copy(pos).add(new THREE.Vector3(hh.x, hh.y, 0)); camera.lookAt(look);
        const mm = K.lerp(30, 45, land); camera.fov = C.mmToFov(mm); camera.updateProjectionMatrix(); S.camClip();
        S.tick(t, h.clone().lerp(tlv, land)); U.uHiA.value = 0.15 * land;
        pg.update(t, t1 + 0.1);
        lA.update(camera, K.range(t, 0.2, 1.0) * (1 - K.range(t, t0 + 2.2, t0 + 2.8)));
        lB.update(camera, K.range(t, t1 + 0.4, t1 + 1.4)); lJ.update(camera, K.range(t, t1 + 0.9, t1 + 1.8) * 0.85);
        if (cap) cap.style.opacity = K.range(t, t1 + 0.2, t1 + 1.0); if (src) src.style.opacity = K.range(t, t1 + 0.9, t1 + 1.7);
      } });
    },

    // ---- descend onto New Orleans on a US map
    nola(ctx, shot) {
      const P0 = shot.params;
      const S = mapStage(ctx, shot, { regions: [{ key: 'us', W: 4096, seg: 300, mask: { statesA: 0.4, states: 0.9 } }, { key: 'nola', W: 4096, seg: 260, edge: 0.12, mask: { coast: 0.8, river: 1.0, riverA: 0.45 } }],
        exag: 16, lat0: 34, light: [-0.7, 0.3, 0.6], focusR: 18, poolMin: 0.28, fogD: 0.004, coastA: 0.5, border: 0.15, seaHaze: 0.65 });
      const { scene, camera, P, LB, U, layer } = S; const no = CITY.nola;
      const move = C.path([
        { pos: W3(-97, 13.5, 34).toArray(), look: W3(-96.5, 38.5, 0).toArray(), mm: 30 },
        { pos: W3(-93.5, 20.5, 15).toArray(), look: W3(-91.5, 32.5, 0).toArray(), mm: 32 },
        { pos: W3(-91.0, 27.4, 3.4).toArray(), look: W3(-90.3, 30.0, 0).toArray(), mm: 38 },
        { pos: W3(-90.75, 28.55, 1.55).toArray(), look: W3(-90.06, 30.02, 0).toArray(), mm: 42 },
      ], { duration: shot.duration, accel: 0.2, decel: 0.5, float: 0.004 });
      const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: SODIUM, map: radial(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      glow.position.copy(P(...no, 0.004)); glow.scale.setScalar(0.22); glow.renderOrder = 6; scene.add(glow);
      const lNo = LB.add('New Orleans', P(...no, 0.01), { dx: 90, dy: -76, size: 0.95, color: '#efe7d6', dotColor: '#ffa860' });
      const lLk = LB.add('Lake Pontchartrain', P(-90.12, 30.2, 0.0), { dx: 60, dy: -36, size: 0.56, color: '#8f897d', dot: false, line: 'rgba(143,137,125,.35)' });
      const lMs = LB.add('Mississippi R.', P(-89.7, 29.55, 0.0), { dx: 60, dy: 40, size: 0.56, color: '#8f897d', dot: false, line: 'rgba(143,137,125,.35)' });
      const lUS = LB.add('United States', P(-98, 39.5, 0.1), { dx: 0.01, dy: 0.01, size: 0.95, color: '#a39c8f', dot: false, line: 'rgba(0,0,0,0)' });
      const cap = caption(layer, P0.caption, 'left:6%;top:15%');
      return scope({ ...S, update(t, p) {
        move(camera, p, t); S.camClip(); const k = K.inOut(p);
        S.tick(t, P(K.lerp(-95, no[0], k), K.lerp(37, no[1], k))); U.uFocusR.value = K.lerp(18, 1.4, K.inOut(K.range(p, 0.2, 0.9)));
        glow.material.opacity = 0.7 * K.range(p, 0.35, 0.7);
        lUS.update(camera, K.range(t, 0.3, 1.3) * (1 - K.range(p, 0.25, 0.4)));
        lNo.update(camera, K.range(p, 0.62, 0.8)); lLk.update(camera, K.range(p, 0.72, 0.88) * 0.85); lMs.update(camera, K.range(p, 0.76, 0.92) * 0.85);
        if (cap) cap.style.opacity = K.range(p, 0.55, 0.7);
      } });
    },

    // ---- protests pop across British cities, staggered
    uk(ctx, shot) {
      const S = mapStage(ctx, shot, { regions: [{ key: 'eu', W: 3072, seg: 240 }, { key: 'uk', W: 4096, seg: 340 }], exag: 18, lat0: 54, light: [-0.85, 0.3, 0.4], focusR: 11, poolMin: 0.4, fogD: 0.012, coastA: 0.5, border: 0.15 });
      const { scene, camera, P, LB } = S;
      const skip = new Set(['Lerwick', 'Kirkwall', 'Wick', 'Fort William', 'Omagh', 'Penzance', 'Lisburn', 'Greenock', 'Southend-on-Sea', 'Dumfries', 'Ayr', 'Scarborough', 'Londonderry/Derry']);
      const cities = VEC.places.uk.filter(c => !skip.has(c[0])).slice(0, 36);
      const r = K.rng(31); const order = cities.map((c, i) => [c, i < 3 ? i * 0.12 : 0.35 + r() * 2.4]).sort((a, b) => a[1] - b[1]);
      const dotG = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), ringG = new THREE.RingGeometry(0.8, 1, 48).rotateX(-Math.PI / 2);
      const dots = order.map(([c, d]) => { const at = P(c[1], c[2], 0.012); const big = c[3] > 600000;
        const dot = new THREE.Mesh(dotG, new THREE.MeshBasicMaterial({ color: RED, transparent: true, fog: false, toneMapped: false })); dot.position.copy(at); dot.renderOrder = 8; scene.add(dot);
        const halo = new THREE.Mesh(dotG, new THREE.MeshBasicMaterial({ color: RED, map: radial(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.position.copy(at); halo.renderOrder = 7; scene.add(halo);
        const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: RED, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); ring.position.copy(at); ring.renderOrder = 7; scene.add(ring);
        return { dot, halo, ring, d, big, s: big ? 0.07 : 0.048 }; });
      const named = { London: [80, -40], Manchester: [-80, -50], Glasgow: [-70, -50], Birmingham: [80, 30], Edinburgh: [70, -50], Belfast: [-70, -40], Cardiff: [-70, 40], Newcastle: [80, -40], Bristol: [-80, 20], Leeds: [80, -10] };
      const labs = order.map(([c, d]) => named[c[0]] ? [LB.add(c[0], P(c[1], c[2], 0.012), { dx: named[c[0]][0], dy: named[c[0]][1], size: 0.58, color: '#bdb5a6', dot: false, line: 'rgba(189,181,166,.35)' }), d] : null).filter(Boolean);
      const move = C.path([
        { pos: W3(-8.6, 44.2, 13.5).toArray(), look: W3(-2.8, 53.7, 0).toArray(), mm: 32 },
        { pos: W3(-5.4, 45.2, 12.2).toArray(), look: W3(-2.4, 53.6, 0).toArray(), mm: 34 },
      ], { duration: shot.duration, accel: 0.1, decel: 0.5, float: 0.01 });
      const legend = K.div(S.layer, `left:6%;bottom:15%;${MONO(0.7, '#bdb5a6')}`, `<span style="display:inline-block;width:.6em;height:.6em;border-radius:50%;background:#e0241b;margin-right:.8em;vertical-align:.05em"></span>Protest · Oct 1 2026`);
      return scope({ ...S, update(t, p) {
        move(camera, p, t); S.camClip(); S.tick(t, P(-2.3, 53.6));
        const sp = 0.85 * Math.max(0.6, Math.min(1.2, shot.duration / 4)); // stagger scales with the beat length
        for (const D of dots) { const t0 = D.d * sp, a = K.range(t, t0, t0 + 0.18), pop = a <= 0 ? 0 : 1 + 0.6 * Math.sin(Math.PI * K.range(t, t0, t0 + 0.3)) * (1 - K.range(t, t0 + 0.3, t0 + 0.5));
          D.dot.visible = D.halo.visible = a > 0; D.dot.scale.setScalar(D.s * pop * a); D.halo.scale.setScalar(D.s * 5 * a); D.halo.material.opacity = 0.35 * a;
          const rk = K.range(t, t0, t0 + 1.2); D.ring.visible = rk > 0 && rk < 1; D.ring.scale.setScalar(D.s * (1 + 4 * K.outCubic(rk))); D.ring.material.opacity = 0.8 * (1 - rk); }
        labs.forEach(([l, d]) => l.update(camera, K.range(t, d * sp + 0.25, d * sp + 1.1) * 0.9));
        legend.style.opacity = K.range(t, 0.4, 1.2);
      } });
    },

    // ---- New York, then an arrow from Denver to Miami
    us(ctx, shot) {
      const P0 = shot.params;
      const S = mapStage(ctx, shot, { regions: [{ key: 'us', W: 4096, seg: 320, mask: { statesA: 0.45, states: 0.9 } }, { key: 'nyc', W: 4096, seg: 280, edge: 0.1, mask: { coast: 0.9, river: 0.9, riverA: 0.4 } }],
        exag: 16, lat0: 38, light: [-0.8, 0.3, 0.5], focusR: 3, poolMin: 0.3, fogD: 0.008, coastA: 0.5, border: 0.15 });
      const { scene, camera, P, LB, U, layer } = S;
      const tA = Math.max(shot.duration * 0.42, shot.duration - 2.6); // arrow draws over the end of the beat, before the cut on "moved"
      const move = C.path([
        { pos: W3(-74.75, 39.55, 1.25).toArray(), look: W3(-73.95, 40.75, 0).toArray(), mm: 50 },
        { pos: W3(-76.5, 37.0, 4.0).toArray(), look: W3(-75.0, 40.0, 0).toArray(), mm: 45 },
        { pos: W3(-91.5, 11.5, 36).toArray(), look: W3(-92.5, 32.6, 0).toArray(), mm: 30 },
      ], { duration: shot.duration, accel: 0.3, decel: 0.35, float: 0.01 });
      const g = gc(CITY.denver, CITY.miami, 80);
      const pts = g.map(([lo, la], i) => { const f = i / (g.length - 1); return P(lo, la, 0.08 + Math.sin(Math.PI * f) * 3.2); });
      const R = route(scene, pts, { r: 0.045, color: RED, glowR: 3, glow: 0.3, seg: 300 });
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 24), new THREE.MeshBasicMaterial({ color: RED, transparent: true, fog: false, toneMapped: false })); tip.renderOrder = 7; scene.add(tip);
      const dn = ping(scene, P(...CITY.denver, 0.01), { size: 1.2, color: 0xefe7d6, n: 1 });
      const mi = ping(scene, P(...CITY.miami, 0.01), { size: 1.6 });
      const lNY = LB.add('New York', P(...CITY.nyc, 0.01), { dx: 80, dy: -60, size: 0.95, color: '#efe7d6', sub: 'NYC Health + Hospitals' });
      const lDn = LB.add('Denver', P(...CITY.denver, 0.05), { dx: -80, dy: 40, size: 0.8, color: '#d9d2c3' });
      const lMi = LB.add('Miami', P(...CITY.miami, 0.05), { dx: 80, dy: 20, size: 0.8, color: '#efe7d6' });
      const cap = caption(layer, P0.caption, 'left:6%;top:15%');
      return scope({ ...S, update(t, p) {
        move(camera, p, t); S.camClip();
        const k = K.inOut(K.range(t, tA, shot.duration - 0.15)); R.draw(k);
        const q = R.curve.getPointAt(Math.max(1e-3, k)), q2 = R.curve.getPointAt(Math.min(1, Math.max(1e-3, k) + 0.01));
        tip.visible = k > 0.01; tip.position.copy(q); tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q2.clone().sub(q).normalize().lengthSq() > 0 ? q2.clone().sub(q).normalize() : new THREE.Vector3(1, 0, 0));
        if (k >= 0.999) { const pa = R.curve.getPointAt(0.99); tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(pa).normalize()); }
        const wide = K.inOut(K.range(p, 0.15, 0.7)); U.uFocusR.value = K.lerp(3, 26, wide);
        S.tick(t, P(K.lerp(CITY.nyc[0], -90, wide), K.lerp(CITY.nyc[1], 34, wide)));
        dn.update(t, tA - 0.3); mi.update(t, shot.duration - 0.2);
        lNY.update(camera, K.range(t, 0.3, 1.3) * (1 - K.range(p, 0.35, 0.5)));
        lDn.update(camera, K.range(t, tA - 0.5, tA + 0.4)); lMi.update(camera, K.range(t, tA + 0.6, tA + 1.4));
        if (cap) cap.style.opacity = K.range(t, 0.5, 1.3);
      } });
    },
  };

  // ================================================================= CHART
  // PLTR daily closes as a glowing extruded line in 3D, with a camera that rides it.
  const ROWS = PLTR.rows; const NR = ROWS.length;
  const idx = (date) => { const i = ROWS.findIndex(r => r[0] >= date); return i < 0 ? NR - 1 : i; };
  const CX = (i) => i * 0.12, CY = (c) => c * 0.12;
  const cpt = (i) => { const a = Math.floor(K.clamp(i, 0, NR - 1)), b = Math.min(NR - 1, a + 1), f = K.clamp(i, 0, NR - 1) - a;
    return new THREE.Vector3(CX(a + f), CY(K.lerp(ROWS[a][1], ROWS[b][1], f)), 0); };
  const fmt = (d) => { const [y, m, dd] = d.split('-'); return `${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][+m - 1]} ${+dd} ${y}`; };
  function chartLine(scene, { red = [], r = 0.032 } = {}) {
    const R = 8, n = NR; const pos = new Float32Array(n * R * 3), nor = new Float32Array(n * R * 3), col = new Float32Array(n * R * 3);
    const W = new THREE.Color(0xf2e8d8), Rd = new THREE.Color(RED); const isRed = (i) => red.some(([a, b]) => i >= a && i <= b);
    for (let i = 0; i < n; i++) {
      const p = cpt(i), a = cpt(Math.max(0, i - 1)), b = cpt(Math.min(n - 1, i + 1)); const tx = b.x - a.x, ty = b.y - a.y, L = Math.hypot(tx, ty) || 1;
      const nx = -ty / L, ny = tx / L; const c = isRed(i) && isRed(i - 1 >= 0 ? i - 1 : i) || (isRed(i) && isRed(i + 1)) ? Rd : W;
      for (let j = 0; j < R; j++) { const an = j / R * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an); const k = (i * R + j) * 3;
        const ox = nx * cs, oy = ny * cs, oz = sn; pos[k] = p.x + ox * r; pos[k + 1] = p.y + oy * r; pos[k + 2] = oz * r; nor[k] = ox; nor[k + 1] = oy; nor[k + 2] = oz; col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b; } }
    const ind = []; for (let i = 0; i < n - 1; i++) for (let j = 0; j < R; j++) { const a = i * R + j, b = i * R + (j + 1) % R, c2 = a + R, d = b + R; ind.push(a, c2, b, b, c2, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(ind);
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.2, emissive: 0x9a9286 });
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };
    const tube = new THREE.Mesh(g, m); tube.frustumCulled = false; scene.add(tube);
    // the glow sheath and the curtain of light under the line
    const g2 = g.clone(); const p2 = g2.attributes.position; for (let i = 0; i < n; i++) { const c = cpt(i); for (let j = 0; j < R; j++) { const k = i * R + j; p2.setXYZ(k, c.x + nor[k * 3] * r * 2.6, c.y + nor[k * 3 + 1] * r * 2.6, nor[k * 3 + 2] * r * 2.6); } }
    const halo = new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })); halo.frustumCulled = false; scene.add(halo);
    const cp = new Float32Array(n * 2 * 3), ca = new Float32Array(n * 2), cc = new Float32Array(n * 2 * 3);
    for (let i = 0; i < n; i++) { const c = cpt(i); cp.set([c.x, c.y - r, -0.01, c.x, 0, -0.01], i * 6); ca[i * 2] = 1; ca[i * 2 + 1] = 0; const k = i * R * 3; cc.set([col[k], col[k + 1], col[k + 2], col[k], col[k + 1], col[k + 2]], i * 6); }
    const ci = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; ci.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setAttribute('a', new THREE.BufferAttribute(ca, 1)); cg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); cg.setIndex(ci);
    const curtain = new THREE.Mesh(cg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexColors: true,
      uniforms: { uK: { value: 0.16 } }, vertexShader: `attribute float a; varying float vA; varying vec3 vC; void main(){ vA = a; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uK; varying float vA; varying vec3 vC; void main(){ gl_FragColor = vec4(vC * pow(vA, 2.2) * uK, 1.0); }` }));
    curtain.frustumCulled = false; scene.add(curtain);
    const head = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); scene.add(head);
    const hl = new THREE.PointLight(0xffe2bc, 18, 22, 1.2); scene.add(hl);
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial(), color: 0xffe9cc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 })); flare.scale.setScalar(0.7); scene.add(flare);
    const reveal = (f, { headOn = true } = {}) => { f = K.clamp(f, 0, NR - 1); const k = Math.floor(f);
      tube.geometry.setDrawRange(0, k * R * 6); halo.geometry.setDrawRange(0, k * R * 6); curtain.geometry.setDrawRange(0, k * 6);
      const h = cpt(f); head.position.copy(h); hl.position.copy(h).add(new THREE.Vector3(0, 0.6, 1.2)); flare.position.copy(h);
      head.visible = flare.visible = headOn; hl.intensity = headOn ? 18 : 8; return h; };
    return { reveal, tube, curtain, head, hl, flare };
  }
  function chartStage(ctx, shot, { red = [], fog = 0.03 } = {}) {
    const b = base(ctx, { floor: null, fog: 0x040506, density: fog, fov: 30 }); const { scene, camera, layer } = b;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 200), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.62, metalness: 0.15 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(80, 0, 0); scene.add(floor);
    scene.add(new THREE.HemisphereLight(0x8aa0c0, 0x050505, 0.18));
    const key = new THREE.DirectionalLight(0xbcd2ff, 0.5); key.position.set(-20, 30, 30); scene.add(key); // cold monitor-blue key, low
    const line = chartLine(scene, { red });
    // grid: a dim wall behind the line, year lines on the floor
    const gp = []; const years = [];
    for (const lv of [50, 100, 150, 200]) gp.push(0, CY(lv), -0.8, CX(NR + 30), CY(lv), -0.8);
    for (let y = 2021; y <= 2026; y++) { const i = idx(`${y}-01-01`); years.push([y, i]); gp.push(CX(i), 0, -0.8, CX(i), CY(220), -0.8, CX(i), 0.002, -0.8, CX(i), 0.002, 8); }
    const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)), new THREE.LineBasicMaterial({ color: 0x8f897d, transparent: true, opacity: 0.2 }));
    scene.add(grid);
    const dust = K.dust(scene, { count: 500, box: [60, 30, 20], center: [CX(NR / 2), 12, 0], size: 0.06, opacity: 0.25, color: 0xd8d2c8 });
    const LB = labels(layer);
    const axis = [];
    for (const [y, i] of years) axis.push([K.div(layer, MONO(0.62, '#77716a', 0.24), String(y)), new THREE.Vector3(CX(i) + 0.15, 0.02, 1.4)]);
    for (const [y, i] of years) for (const lv of [50, 100, 150, 200]) axis.push([K.div(layer, MONO(0.55, '#5f5a54', 0.18), `$${lv}`), new THREE.Vector3(CX(i) + 0.15, CY(lv) + 0.12, -0.8)]);
    const axisUpdate = () => { camera.updateMatrixWorld(); const s = window.innerHeight / 1080;
      for (const [el, v] of axis) { const P = v.clone().project(camera); const d = v.distanceTo(camera.position); const a = (P.z < 1 && Math.abs(P.x) < 1.1 && Math.abs(P.y) < 1.1) ? K.clamp(1.6 - d / 22) * 0.9 : 0;
        el.style.opacity = a; el.style.left = `${(P.x + 1) / 2 * 1920 * s}px`; el.style.top = `${(1 - P.y) / 2 * 1080 * s}px`; } };
    return { ...b, line, LB, axisUpdate, dust };
  }
  // smooth camera follow: average the target over a short window of earlier times (pure in t)
  const lagged = (fn, t, win = 0.5, n = 10) => { const a = new THREE.Vector3(); let ws = 0; for (let i = 0; i <= n; i++) { const w = 1 - i / (n + 1); a.addScaledVector(fn(t - win * i / n), w); ws += w; } return a.multiplyScalar(1 / ws); };
  const aim = (camera, pos, look, mm, t, amp = 0.02, seed = 1) => { const h = K.handheld(t, amp, seed); camera.position.copy(pos).add(new THREE.Vector3(h.x, h.y, 0)); camera.lookAt(look); camera.rotation.z += h.r;
    const f = C.mmToFov(mm); if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); } };

  const CHART = {
    // race up the whole history to the Oct 9 2026 record
    spike(ctx, shot) {
      const P0 = shot.params; const end = NR - 1;
      const S = chartStage(ctx, shot, { red: [[end - 1, end]] }); const { camera, line, LB, layer } = S;
      const T1 = Math.max(3, Math.min(shot.duration - 1.6, wt(shot, 'record') + 0.2));
      const PR = C.profile({ accel: 0.55, decel: 0.3 }); const prog = (t) => end * PR.s(K.range(t, 0.2, T1));
      const peak = cpt(end);
      const lab = LB.add('$209.05', peak.clone().add(new THREE.Vector3(0, 0.08, 0)), { dx: 120, dy: -110, size: 1.7, color: '#efe7d6', dotColor: '#e0241b', line: 'rgba(224,36,27,.8)', sub: 'Record close · Oct 9 2026' });
      const src = sourceLine(layer, P0.source);
      return scope({ ...S, update(t, p) {
        const f = prog(t); line.reveal(f, { headOn: f < end - 0.5 });
        const h = lagged((tt) => cpt(prog(tt)), t, 0.45), ah = cpt(Math.min(end, prog(t) + 80));
        const ride = h.clone().add(new THREE.Vector3(-7, 2.2, 12)), rideLook = ah.clone().lerp(h, 0.5).add(new THREE.Vector3(0, 0.4, 0));
        const st = K.inOut(K.range(t, T1 - 0.9, T1 + 1.4));
        const pos = ride.lerp(peak.clone().add(new THREE.Vector3(-11, -3.0, 21)), st), look = rideLook.lerp(peak.clone().add(new THREE.Vector3(-3.2, -1.2, 0)), st);
        aim(camera, pos, look, K.lerp(28, 35, st), t, 0.03, 2);
        S.dust.update(t); S.axisUpdate();
        // the number lands: a short drop with settle
        const k = K.range(t, T1 + 0.05, T1 + 0.9); lab.dy = -110 - 40 * (1 - K.outCubic(k)); lab.update(camera, k);
        if (src) src.style.opacity = K.range(t, T1 + 0.6, T1 + 1.4);
      } });
    },
    // Feb 3 -> Feb 4 2025: the day after "kill them"
    jump(ctx, shot) {
      const P0 = shot.params; const j0 = idx('2025-02-03'), j1 = j0 + 1; const c0 = ROWS[j0][1], c1 = ROWS[j1][1]; const pct = (c1 / c0 - 1) * 100;
      const S = chartStage(ctx, shot, { red: [[j0, j1]], fog: 0.045 }); const { scene, camera, line, LB, layer } = S;
      const tj = Math.max(1.2, Math.min(shot.duration - 2.0, wt(shot, 'jumped') - 0.15));
      const a = cpt(j0), bpt = cpt(j1);
      const ref = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: 0xbdb5a6, transparent: true, opacity: 0.5 })); ref.position.set(a.x + 0.7, a.y, 0); scene.add(ref);
      const lj = LB.add(`${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, () => cpt(j1), { dx: 90, dy: -40, size: 1.05, color: '#efe7d6', dotColor: '#e0241b', line: 'rgba(224,36,27,.75)', sub: `Feb 4 2025 · $${c1.toFixed(2)}` });
      const l0 = LB.add(`Feb 3 · $${c0.toFixed(2)}`, a.clone(), { dx: -90, dy: 46, size: 0.62, color: '#a39c8f', line: 'rgba(163,156,143,.45)' });
      const src = sourceLine(layer, P0.source);
      return scope({ ...S, update(t, p) {
        const k = K.inOut(K.range(t, tj, tj + 0.55)); const f = j0 + k + (t < tj ? -K.inOut(K.range(t, 0, 1.0)) * 0 : 0);
        line.reveal(j0 + k + 0.0001, { headOn: true });
        ref.scale.x = K.outCubic(K.range(t, 0.4, 1.4)); ref.material.opacity = 0.45;
        const rise = K.inOut(K.range(t, tj - 0.2, tj + 1.4)), push = K.inOut(p);
        const pos = new THREE.Vector3(a.x - K.lerp(2.6, 1.6, push), K.lerp(a.y + 0.4, a.y + 1.6, rise), K.lerp(11, 13, rise));
        const look = new THREE.Vector3(K.lerp(a.x + 0.2, a.x + 0.5, rise), K.lerp(a.y + 0.5, a.y + 1.45, rise), 0);
        aim(camera, pos, look, 50, t, 0.012, 5);
        S.dust.update(t); S.axisUpdate();
        l0.update(camera, K.range(t, 0.6, 1.5)); lj.update(camera, K.range(t, tj + 0.5, tj + 1.3));
        if (src) src.style.opacity = K.range(t, 0.8, 1.6);
      } });
    },
    // the long climb from 2023: a low camera that cranes up with the line
    climb(ctx, shot) {
      const i0 = idx('2023-01-03'), i1 = idx('2025-11-03');
      const S = chartStage(ctx, shot, { fog: 0.035 }); const { camera, line } = S;
      const PRc = C.profile({ accel: 0.2, decel: 0.25 }); const prog = (t) => K.lerp(i0, i1, PRc.s(K.range(t, 0, shot.duration)));
      const a = cpt(i0), z = cpt(i1), m = cpt(idx('2024-11-15'));
      const crane = C.path([{ pos: [a.x - 3, 0.45, 9], look: [a.x + 9, 1.6, 0], mm: 24 }, { pos: [m.x - 16, m.y * 0.55, 22], look: [m.x, m.y * 0.8, 0], mm: 26 }, { pos: [z.x - 18, z.y * 0.82, 28], look: [z.x - 6, z.y * 0.8, 0], mm: 28 }],
        { duration: shot.duration, accel: 0.25, decel: 0.35, float: 0.02 });
      return scope({ ...S, update(t, p) {
        const f = prog(t); line.reveal(f);
        line.hl.intensity = 6; crane(camera, p, t);
        S.dust.update(t); S.axisUpdate();
      } });
    },
    // H1 2026: the fall to the late-July low, the camera falling with it
    crash(ctx, shot) {
      const P0 = shot.params; const c0 = idx('2026-01-07'), c1 = idx(P0.lowDate ?? '2026-07-28');
      const S = chartStage(ctx, shot, { fog: 0.03 }); const { scene, camera, line, LB, layer } = S;
      const td = Math.min(shot.duration * 0.82, Math.max(3.5, wt(shot, 'dropped') + 0.6));
      const prog = (t) => K.lerp(c0, c1, K.inOut(K.range(t, 0.6, td)));
      const low = cpt(c1);
      const pg = ping(scene, low.clone().add(new THREE.Vector3(0, 0, 0.05)), { size: 0.55, upright: true });
      const lh = LB.add(fmt(ROWS[c0][0]), cpt(c0).add(new THREE.Vector3(0, 0.08, 0)), { dx: -80, dy: -60, size: 0.62, color: '#a39c8f', line: 'rgba(163,156,143,.45)', sub: `$${ROWS[c0][1].toFixed(2)}` });
      const hiP = cpt(c0), pc = (ROWS[c1][1] / ROWS[c0][1] - 1) * 100;
      const hi = new THREE.Mesh(new THREE.BoxGeometry(1, 0.014, 0.014).translate(0.5, 0, 0), new THREE.MeshBasicMaterial({ color: 0xbdb5a6, transparent: true, opacity: 0.45 }));
      hi.scale.x = 1e-3; hi.position.set(hiP.x, hiP.y, 0); hi.userData.len = low.x + 0.3 - hiP.x; scene.add(hi);
      const hiLen = low.x + 0.3 - hiP.x; hi.geometry.scale(hiLen, 1, 1);
      const lpct = LB.add(`${pc.toFixed(0)}%`, low.clone(), { dx: 90, dy: 70, size: 1.2, color: '#efe7d6', dotColor: '#e0241b', line: 'rgba(224,36,27,.7)', sub: `${fmt(ROWS[c0][0])} → ${fmt(ROWS[c1][0])} · $${ROWS[c1][1].toFixed(2)}` });
      const src = sourceLine(layer, P0.source);
      return scope({ ...S, update(t, p) {
        const f = prog(t); line.reveal(f);
        const h = lagged((tt) => cpt(prog(tt)), t, 0.7);
        const pos = h.clone().add(new THREE.Vector3(-4.0, 3.2, 10)), look = h.clone().add(new THREE.Vector3(3, -2, 0));
        const settle = K.inOut(K.range(t, td - 0.4, td + 1.6));
        aim(camera, pos.lerp(low.clone().add(new THREE.Vector3(-9, 4.5, 15)), settle), look.lerp(low.clone().add(new THREE.Vector3(-4, 2.6, 0)), settle), K.lerp(40, 38, settle), t, 0.03, 9);
        const bk = K.inOut(K.range(t, td + 0.2, td + 1.1)); hi.scale.x = Math.max(1e-3, K.outCubic(K.range(t, 0.4, 1.6))); lpct.update(camera, K.range(t, td + 0.9, td + 1.7));
        S.dust.update(t); S.axisUpdate();
        lh.update(camera, K.range(t, 0.3, 1.2)); pg.update(t, td);
        if (src) src.style.opacity = K.range(t, td + 0.4, td + 1.2);
      } });
    },
    // ten weeks back to the record; a long-lens profile that cranes up, then a pull back to the $10 start
    record(ctx, shot) {
      const P0 = shot.params; const r0 = idx('2026-07-28'), r1 = NR - 1;
      const S = chartStage(ctx, shot, { red: [[r0, r1]], fog: 0.012 }); const { scene, camera, line, LB, layer } = S;
      const tr = Math.min(shot.duration * 0.55, Math.max(3, wt(shot, 'record') + 0.2));
      const prog = (t) => K.lerp(r0, r1, K.inOut(K.range(t, 0.3, tr)));
      const base10 = new THREE.Mesh(new THREE.BoxGeometry(CX(NR + 20), 0.015, 0.015), new THREE.MeshBasicMaterial({ color: 0xbdb5a6, transparent: true, opacity: 0.55 }));
      base10.position.set(CX(NR + 20) / 2, CY(10), 0.02); scene.add(base10);
      const peak = cpt(r1);
      const lp = LB.add('$209.05', peak.clone().add(new THREE.Vector3(0, 0.08, 0)), { dx: -130, dy: 70, size: 1.5, color: '#efe7d6', dotColor: '#e0241b', line: 'rgba(224,36,27,.8)', sub: 'Oct 9 2026' });
      const l10 = LB.add('$10.00 · Opening trade', new THREE.Vector3(CX(NR - 420), CY(10), 0), { dx: 70, dy: -40, size: 0.66, color: '#a39c8f', line: 'rgba(163,156,143,.45)', sub: 'Sept 30 2020' });
      const src = sourceLine(layer, P0.source);
      const wideP = new THREE.Vector3(CX(NR) - 14, 19, 70), wideL = new THREE.Vector3(CX(NR) - 24, 14.5, 0);
      return scope({ ...S, update(t, p) {
        const f = prog(t); line.reveal(f, { headOn: f < r1 - 0.5 });
        const h = lagged((tt) => cpt(prog(tt)), t, 0.8);
        const prof = new THREE.Vector3(h.x - 2.5, h.y - 3.5, 30), profL = h.clone().add(new THREE.Vector3(0.9, 0.9, 0));
        const pb = K.inOut(K.range(t, tr + 0.9, shot.duration - 0.2));
        aim(camera, prof.lerp(wideP, pb), profL.lerp(wideL, pb), K.lerp(85, 35, pb), t, 0.02, 11);
        S.dust.update(t); S.axisUpdate();
        lp.update(camera, K.range(t, tr - 0.1, tr + 0.7)); l10.update(camera, K.range(t, tr + 1.8, tr + 2.6));
        if (src) src.style.opacity = K.range(t, tr + 0.6, tr + 1.4);
      } });
    },
  };

  // ================================================================= EXCHANGE
  function tickerTex(text, { w = 4096, h = 128, color = '#ffb35c', bg = '#050302' } = {}) {
    const t = canvasTex(w, h, (x) => { x.fillStyle = bg; x.fillRect(0, 0, w, h);
      // LED dot matrix feel: draw text then mask with a dot grid
      x.font = `700 ${h * 0.62}px 'Archivo Narrow', sans-serif`; x.textBaseline = 'middle'; x.fillStyle = color;
      let cx = 20; const parts = text.split('|'); let i = 0; while (cx < w) { const s = parts[i++ % parts.length]; x.fillStyle = s.startsWith('PLTR') ? '#ffd29a' : color; x.fillText(s, cx, h * 0.54); cx += x.measureText(s).width + h * 0.9; }
      const mk = document.createElement('canvas'); mk.width = w; mk.height = h; const mx = mk.getContext('2d'); mx.fillStyle = '#000';
      for (let yy = 0; yy < h; yy += 6) for (let xx = 0; xx < w; xx += 6) mx.fillRect(xx, yy, 4.6, 4.6);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(mk, 0, 0);
      x.globalCompositeOperation = 'destination-over'; x.fillStyle = bg; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over'; });
    t.wrapS = THREE.RepeatWrapping; return t;
  }
  function screenTex(seed, { hero = false } = {}) {
    const r = K.rng(seed);
    return canvasTex(hero ? 1280 : 512, hero ? 800 : 320, (x, w, h) => {
      x.fillStyle = '#04070c'; x.fillRect(0, 0, w, h);
      if (hero) {
        x.fillStyle = '#0c1522'; x.fillRect(0, 0, w, 70); x.font = `500 30px 'Plex Mono', monospace`; x.fillStyle = '#7f9bbd'; x.fillText('NYSE · DIRECT LISTING · SEPT 30 2020', 36, 46);
        x.font = `700 230px 'Archivo Narrow', sans-serif`; x.fillStyle = '#e9eef5'; x.fillText('PLTR', 36, 330);
        x.font = `500 30px 'Plex Mono', monospace`; x.fillStyle = '#8fa6c4'; x.fillText('PALANTIR TECHNOLOGIES INC.  CL A', 44, 392);
        x.fillStyle = '#5d7391'; x.fillText('OPENING TRADE', 44, 520);
        x.font = `700 250px 'Archivo Narrow', sans-serif`; x.fillStyle = '#ffffff'; x.fillText('10.00', 36, 750);
        x.font = `500 28px 'Plex Mono', monospace`; x.fillStyle = '#5d7391'; x.fillText('USD', 640, 744); x.fillText('REF  7.25', 900, 520);
        x.strokeStyle = '#2a3b52'; x.lineWidth = 2; x.beginPath(); x.moveTo(900, 560); x.lineTo(1240, 560); x.stroke();
        x.strokeStyle = '#9fc4ff'; x.lineWidth = 3; x.beginPath(); let y = 700; for (let i = 0; i <= 40; i++) { y += (r() - 0.45) * 14; x.lineTo(900 + i * 8.5, Math.max(580, Math.min(740, y))); } x.stroke();
        return;
      }
      x.font = `500 18px 'Plex Mono', monospace`;
      for (let i = 0; i < 12; i++) { const y = 26 + i * 24; x.fillStyle = r() < 0.5 ? '#3f8f6a' : '#9a4040'; x.globalAlpha = 0.55 + r() * 0.4;
        x.fillRect(16, y - 12, 50 + r() * 60, 12); x.fillStyle = '#6d86a8'; x.fillRect(150, y - 12, 80 + r() * 150, 12); x.fillRect(400, y - 12, 40 + r() * 60, 12); }
      x.globalAlpha = 1; x.strokeStyle = '#7fb0ff'; x.lineWidth = 2; x.beginPath(); let y = 250; for (let i = 0; i < 60; i++) { y += (r() - 0.5) * 12; x.lineTo(i * 8.6, y); } x.stroke();
    });
  }
  const EXCHANGE = {
    listing(ctx, shot) {
      const P0 = shot.params;
      const b = base(ctx, { floor: 0x0d0e10, fog: 0x030407, density: 0.012, fov: 30 }); const { scene, camera, layer } = b;
      const wet = K.grimeTexture(5, 140); wet.repeat.set(20, 20); b.ground.material.roughnessMap = wet; b.ground.material.roughness = 0.38; b.ground.material.metalness = 0.35;
      scene.add(new THREE.HemisphereLight(0x5a7090, 0x050505, 0.12));
      const dark = std(0x1c1f24, { roughness: 0.5, metalness: 0.45 }), trim = std(0x2b2e33, { roughness: 0.35, metalness: 0.7 });
      // trading posts: round kiosks with a ring of screens
      const posts = [[0, 0], [-13, -6], [12, -8], [-4, -17], [17, 6], [-17, 7], [6, -27], [-20, -24]];
      const scrM = (seed) => new THREE.MeshBasicMaterial({ map: screenTex(seed), toneMapped: true, color: 0x9fb4d0 });
      const scrG = new THREE.PlaneGeometry(1.1, 0.68); let seed = 3; let hero = null;
      posts.forEach(([x, z], pi) => {
        const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
        mesh(new THREE.CylinderGeometry(2.4, 2.5, 1.15, 40, 1, true), dark, [0, 0.58, 0], g).material.side = THREE.DoubleSide;
        mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.08, 40), trim, [0, 1.16, 0], g);
        mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.2, 12), trim, [0, 2.6, 0], g);
        mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.5, 40, 1, true), dark, [0, 3.95, 0], g).material.side = THREE.DoubleSide;
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; const isHero = pi === 0 && k === 1;
          const m = new THREE.Mesh(scrG, isHero ? new THREE.MeshBasicMaterial({ map: screenTex(99, { hero: true }), color: 0xd8e6ff }) : scrM(seed++)); m.position.set(Math.sin(a) * 1.75, 3.35, Math.cos(a) * 1.75); m.rotation.y = a; m.rotation.x = -0.12; g.add(m);
          if (isHero) hero = m;
          const lowS = new THREE.Mesh(scrG, scrM(seed++)); lowS.scale.setScalar(0.8); lowS.position.set(Math.sin(a + 0.31) * 2.56, 1.45, Math.cos(a + 0.31) * 2.56); lowS.rotation.y = a + 0.31; lowS.rotation.x = -0.5; g.add(lowS); }
        const gl = new THREE.PointLight(0x7fa6e0, 16, 11, 1.6); gl.position.set(0, 3.2, 0); g.add(gl);
      });
      // columns and the dim ceiling
      for (let i = -3; i <= 3; i++) for (const z of [-34, 14]) mesh(new THREE.BoxGeometry(1.4, 16, 1.4), std(0x1a1a1c, { roughness: 0.8 }), [i * 9, 8, z], scene);
      mesh(new THREE.BoxGeometry(80, 0.5, 60), std(0x0a0a0b, { roughness: 0.9 }), [0, 16.5, -10], scene);
      // overhead ticker bands: scrolling LED text
      const tk = tickerTex('PLTR 10.00 ▲|PALANTIR TECHNOLOGIES · DIRECT LISTING|PLTR 10.00 ▲|OPEN|PLTR 10.00 ▲|NYSE');
      const bands = [];
      for (const [z, y, w, rot] of [[-12, 8.2, 70, 0], [-30, 10.5, 74, 0], [6, 7.6, 60, 0.04]]) {
        const t2 = tk.clone(); t2.needsUpdate = true; t2.repeat.set(w / 22, 1);
        const band = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.7), new THREE.MeshBasicMaterial({ map: t2, color: new THREE.Color(0xffffff).multiplyScalar(2.2) }));
        band.position.set(0, y, z); band.rotation.y = rot; scene.add(band);
        mesh(new THREE.BoxGeometry(w + 0.4, 0.95, 0.3), std(0x0a0a0a), [0, y, z - 0.18], scene).rotation.y = rot;
        const bl = new THREE.PointLight(0xffa860, 10, 14, 1.6); bl.position.set(0, y - 0.6, z + 1.5); scene.add(bl);
        bands.push(t2);
      }
      // a work light high over the hero post: the one key, with a shaft in the haze
      K.keySpot(scene, { color: 0xfff0dc, intensity: 2600, pos: [3, 15.5, 6], target: [0, 0, 0], angle: 0.34, penumbra: 0.8, shadow: 1024 });
      K.lightShaft(scene, { pos: [3, 15.5, 6], target: [0, 0, 0], radius: 4.5, intensity: 0.07 });
      const motes = K.dust(scene, { count: 700, box: [40, 14, 30], center: [0, 7, -6], size: 0.05, opacity: 0.35, color: 0xd8e2ff });
      // traders at the posts
      const r = K.rng(12); const people = [];
      const suit = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.85, metalness: 0.05 });
      posts.slice(0, 6).forEach(([x, z], i) => { for (let k = 0; k < 3; k++) { const a = r() * Math.PI * 2; if (i === 0 && Math.abs(a - 0.63) < 0.9) continue;
        const c = C.character('UAL', { clip: r() < 0.6 ? 'Idle_Loop' : 'Idle_Talking_Loop', material: suit, phase: r() * 4 });
        c.root.position.set(x + Math.sin(a) * 3.2, 0, z + Math.cos(a) * 3.2); c.root.rotation.y = a + Math.PI; scene.add(c.root); people.push(c); } });
      hero.updateMatrixWorld(true); const hp = new THREE.Vector3(); hero.getWorldPosition(hp); const hn = new THREE.Vector3(0, 0, 1).applyQuaternion(hero.getWorldQuaternion(new THREE.Quaternion()));
      const move = C.path([
        { pos: [-9, 13.5, 34], look: [0, 4, -8], mm: 24 },
        { pos: [hp.x + hn.x * 14 + 4, 8.5, hp.z + hn.z * 14 + 3], look: [hp.x, hp.y + 0.2, hp.z], mm: 32 },
        { pos: [hp.x + hn.x * 2.4 + 0.3, hp.y + 0.05, hp.z + hn.z * 2.4], look: [hp.x, hp.y, hp.z], mm: 45 },
      ], { duration: shot.duration, accel: 0.25, decel: 0.5, float: 0.02 });
      const cap = caption(layer, P0.caption, 'left:6%;top:15%'), src = sourceLine(layer, P0.source); if (src) src.style.bottom = '15%';
      return scope({ ...b, update(t, p) {
        motes.update(t); people.forEach(c => c.update(t));
        bands.forEach((tx, i) => { tx.offset.x = (t * (0.035 + i * 0.008)) % 1; });
        move(camera, p, t);
        if (cap) cap.style.opacity = K.range(t, 0.6, 1.4); if (src) src.style.opacity = K.range(p, 0.75, 0.88);
      } });
    },
  };

  // ================================================================= PROTEST
  function placardTex(word) {
    return canvasTex(512, 384, (x, w, h) => { x.fillStyle = '#e8e2d4'; x.fillRect(0, 0, w, h);
      const r = K.rng(word.length * 7); for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(90,80,60,${r() * 0.06})`; x.fillRect(r() * w, r() * h, 2, 2); }
      if (!word) return; x.fillStyle = '#16120e'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const lines = word.split('\n'); let fs = lines.length > 1 ? 124 : 150; x.font = `700 ${fs}px 'Archivo Narrow', sans-serif`;
      const mw = Math.max(...lines.map(l => x.measureText(l).width)); if (mw > w * 0.86) { fs *= w * 0.86 / mw; x.font = `700 ${fs}px 'Archivo Narrow', sans-serif`; }
      lines.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.0)); });
  }
  function terrace(scene, { x0 = -60, x1 = 160, z = -9, seed = 4 } = {}) {
    const r = K.rng(seed); const g = new THREE.Group(); scene.add(g);
    const winLit = [], winDark = []; let x = x0;
    const stone = [0x8c8270, 0x7d7362, 0x5a3e32, 0x4c342b, 0x958b78];
    while (x < x1) { const bays = 3 + Math.floor(r() * 2), bw = 2.6, w = bays * bw, storeys = 4 + Math.floor(r() * 2), sh = 3.3, H = storeys * sh + 1.2;
      const col = stone[Math.floor(r() * stone.length)]; const m = std(col, { roughness: 0.92, metalness: 0 });
      mesh(new THREE.BoxGeometry(w, H, 1), m, [x + w / 2, H / 2, z - 0.5], g);
      mesh(new THREE.BoxGeometry(w + 0.3, 0.35, 1.3), std(0xcfc4ad, { roughness: 0.8 }), [x + w / 2, H - 0.6, z - 0.35], g); // cornice
      mesh(new THREE.BoxGeometry(w + 0.1, 0.18, 1.15), std(0xcfc4ad, { roughness: 0.8 }), [x + w / 2, sh + 0.2, z - 0.4], g); // string course
      if (r() < 0.6) { const cs = mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), m, [x + w * (0.2 + r() * 0.6), H + 0.8, z - 0.8], g); for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.5, 8), std(0x7a5a46), [cs.position.x - 0.35 + k * 0.35, H + 1.85, z - 0.8], g); }
      for (let s2 = 0; s2 < storeys; s2++) for (let bi = 0; bi < bays; bi++) { const wx = x + bw * (bi + 0.5), wy = s2 * sh + (s2 === 0 ? 1.7 : 1.9); const tall = s2 === 1 ? 2.3 : s2 === storeys - 1 ? 1.3 : 1.85;
        (r() < 0.3 ? winLit : winDark).push([wx, wy, tall]); }
      x += w + 0.02; }
    const wg = new THREE.BoxGeometry(1.15, 1, 0.12);
    const mk = (list, mat) => { const im = new THREE.InstancedMesh(wg, mat, list.length); const m4 = new THREE.Matrix4();
      list.forEach(([wx, wy, h], i) => { m4.compose(new THREE.Vector3(wx, wy, z + 0.02), new THREE.Quaternion(), new THREE.Vector3(1, h, 1)); im.setMatrixAt(i, m4); }); g.add(im); return im; };
    mk(winDark, new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.08, metalness: 0.9 }));
    mk(winLit, new THREE.MeshStandardMaterial({ color: 0x110a04, emissive: 0xffa860, emissiveIntensity: 0.55, roughness: 0.3 }));
    const lint = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.28, 0.3), std(0xbdb29a, { roughness: 0.85 }), winLit.length + winDark.length), mull = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 1, 0.16), std(0xd8d0c0, { roughness: 0.7 }), winLit.length + winDark.length); const q4 = new THREE.Matrix4();
    [...winLit, ...winDark].forEach(([wx, wy, h], i) => { q4.makeTranslation(wx, wy + h / 2 + 0.2, z + 0.1); lint.setMatrixAt(i, q4); q4.compose(new THREE.Vector3(wx, wy, z + 0.06), new THREE.Quaternion(), new THREE.Vector3(1, h, 1)); mull.setMatrixAt(i, q4); }); g.add(lint, mull);
    // sash bars over every window
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 0.05, 0.16), std(0xd8d0c0, { roughness: 0.7 }), winLit.length + winDark.length); const m4 = new THREE.Matrix4();
    [...winLit, ...winDark].forEach(([wx, wy], i) => { m4.makeTranslation(wx, wy, z + 0.06); bars.setMatrixAt(i, m4); }); g.add(bars);
    return g;
  }
  const PROTEST = {
    march(ctx, shot) {
      const P0 = shot.params;
      const b = base(ctx, { floor: 0x1a1a1c, fog: 0x1c1f28, density: 0.012, fov: 20 }); const { scene, camera, layer } = b;
      C.sky(scene, 'qwantani_dusk_2', { intensity: 0.28, bgIntensity: 0.4, blur: 0.03 });
      const g = b.ground; const wet = K.grimeTexture(21, 90); wet.repeat.set(40, 40); g.material.roughnessMap = wet; g.material.roughness = 0.14; g.material.metalness = 0.6; g.material.color.set(0x222326);
      mesh(new THREE.BoxGeometry(300, 0.16, 5), std(0x4a4845, { roughness: 0.35, metalness: 0.2, roughnessMap: wet }), [60, 0.08, -10], scene);
      mesh(new THREE.BoxGeometry(300, 0.16, 3), std(0x4a4845, { roughness: 0.4 }), [60, 0.08, 8], scene);
      terrace(scene, { x0: -30, x1: 170, z: -13 });
      // sodium lamps on the far pavement, behind the march: they backlight it (the key)
      const lampM = std(0x101113, { metalness: 0.6, roughness: 0.4 });
      for (let i = 0; i < 12; i++) { const lx = -10 + i * 14; mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.5, 10), lampM, [lx, 3.25, -9.6], scene);
        mesh(new THREE.BoxGeometry(0.9, 0.12, 0.35), lampM, [lx + 0.4, 6.5, -9.4], scene);
        mesh(new THREE.BoxGeometry(0.5, 0.08, 0.28), new THREE.MeshBasicMaterial({ color: 0xffd2a0 }), [lx + 0.6, 6.42, -9.4], scene);
        const pl = new THREE.PointLight(SODIUM, 30, 20, 1.6); pl.position.set(lx + 0.6, 6.1, -9.0); scene.add(pl); }
      const fill = new THREE.DirectionalLight(0x8fa4c8, 0.35); fill.position.set(10, 14, 30); scene.add(fill);
      const matte = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.88, metalness: 0 });
      const T = shot.duration, vCam = 1.22, cx0 = 12, mid = (t) => cx0 + 3 + vCam * t;
      const plainTex = placardTex(''); const words = ['NOT FOR\nSALE', 'OUR NHS', 'NHS NOT\nFOR SALE', 'OUR NHS', 'NOT FOR\nSALE'];
      const poleM = std(0x6b5a44, { roughness: 0.8 }), edge = std(0xcfc6b4, { roughness: 0.85 });
      const board = (tex) => { const pl = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
        const bx = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 0.03), [edge, edge, edge, edge, m, edge]); bx.position.y = 0.45; pl.add(bx);
        mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6), poleM, [0, -0.2, -0.03], pl); scene.add(pl); return pl; };
      const r = K.rng(77); const crowd = [];
      const add = (x0, z, v, tex) => { const c = C.character('UAL', { clip: 'Walk_Loop', material: matte, phase: r() * 3, speed: v / 1.25 });
        c.root.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.08; c.root.scale.setScalar(0.94 + r() * 0.12); scene.add(c.root);
        const pl = tex ? board(tex) : null; if (pl) pl.scale.setScalar(0.85 + r() * 0.25); crowd.push({ c, x0, z, v, pl, sway: r() * 6, ph: 2.05 + r() * 0.45 }); };
      // the readable placards walk at the camera's pace, near the front of the march
      words.forEach((w, k) => add(mid(T / 2) - (vCam * T / 2) + [-4.6, -2.1, 0.3, 2.2, 4.9][k] + (r() - 0.5) * 0.6, [1.0, 0.2, 1.5, 0.6, 1.2][k], vCam + (r() - 0.5) * 0.04, placardTex(w)));
      for (let i = 0; i < 74; i++) { const v = 1.12 + r() * 0.3, z = -5.2 + r() * 6.8; add(cx0 - 9 + r() * 34, z, v, z < -0.9 && r() < 0.45 ? plainTex : null); }
      // foreground bollards close to the lens: they slide through, soft
      for (let i = 0; i < 16; i++) mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.0, 12), std(0x0c0c0d, { metalness: 0.5, roughness: 0.4 }), [-6 + i * 5.5, 0.5, 21], scene);
      const fx = PP.post(ctx, scene, camera, { dof: { fstop: 2.0, mm: 85, bokeh: 6 }, quality: 'low' });
      const cap = caption(layer, P0.caption, 'left:6%;top:15%');
      return scope({ ...b, update(t, p) {
        for (const q of crowd) { q.c.update(t); const x = q.x0 + q.v * t; q.c.root.position.set(x, 0, q.z);
          if (q.pl) { const bob = Math.abs(Math.sin((t * q.v / 1.25 + q.sway) * Math.PI * 1.6)) * 0.05; q.pl.position.set(x + 0.15, q.ph + bob, q.z + 0.12); q.pl.rotation.z = Math.sin(t * 1.3 + q.sway) * 0.035; } }
        const cx = cx0 + vCam * t; const h = K.handheld(t, 0.025, 3);
        camera.position.set(cx + h.x, 0.95 + h.y, 30); camera.lookAt(cx + 3, 2.6, -3); camera.rotation.z += h.r; C.lens(camera, 85); camera.updateProjectionMatrix();
        fx.focus(29.5);
        if (cap) cap.style.opacity = K.range(t, 0.6, 1.4);
      } });
    },
  };

  // ================================================================= HQ
  function glassTower(scene, { x, z, w = 18, d = 18, h = 70, seed = 1, lit = 0.25, litColor = 0xcfe0ff, glass = 0x0d1218, frame = 0x2a2e33, env = null, balconies = false, floors = 30 }) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const r = K.rng(seed); const cols = Math.round(w / 1.6);
    const winTex = canvasTex(512, 1024, (c, W, H) => { c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < floors; i++) { const rowLit = r() < 0.5 ? lit * 1.8 : lit * 0.4; for (let j = 0; j < cols; j++) { if (r() > rowLit) continue; const a = 0.35 + r() * 0.65;
        c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(j * W / cols + 1, (floors - 1 - i) * H / floors + 3, W / cols - 2, H / floors - 7); } } });
    const m = new THREE.MeshStandardMaterial({ color: glass, roughness: 0.08, metalness: 0.9, emissive: litColor, emissiveMap: winTex, emissiveIntensity: 1.1, envMap: env, envMapIntensity: 0.9 });
    mesh(new THREE.BoxGeometry(w, h, d), m, [0, h / 2, 0], g);
    const fm = std(frame, { roughness: 0.4, metalness: 0.8 });
    // vertical fins on the two faces we see
    const fin = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, h, 0.5), fm, (cols + 1) * 2); const m4 = new THREE.Matrix4(); let k = 0;
    for (let j = 0; j <= cols; j++) { m4.makeTranslation(-w / 2 + j * w / cols, h / 2, d / 2 + 0.2); fin.setMatrixAt(k++, m4); m4.makeTranslation(w / 2 + 0.2, h / 2, -d / 2 + j * d / cols); fin.setMatrixAt(k++, m4); }
    g.add(fin);
    if (balconies) { const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(w + 2.2, 0.28, d + 2.2), std(0xd9d2c6, { roughness: 0.7 }), floors); for (let i = 1; i < floors; i++) { m4.makeTranslation(0, i * h / floors, 0); sl.setMatrixAt(i, m4); } m4.makeTranslation(0, -5, 0); sl.setMatrixAt(0, m4); g.add(sl); }
    else for (let i = 0; i <= floors; i += 5) mesh(new THREE.BoxGeometry(w + 0.25, 0.3, d + 0.25), fm, [0, i * h / floors, 0], g);
    mesh(new THREE.BoxGeometry(w * 0.6, 3, d * 0.6), fm, [0, h + 1.5, 0], g);
    return g;
  }
  function palm(scene, x, z, s = 1, seed = 1, mat) {
    const r = K.rng(seed); const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    const lean = (r() - 0.5) * 0.3; const pts = []; for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector3(Math.sin(i / 10 * 1.2) * lean * 9, i * 1.15, 0));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.2, 8), mat));
    const top = pts.at(-1);
    for (let i = 0; i < 13; i++) { const a = i / 13 * Math.PI * 2 + r() * 0.3, droop = 0.6 + r() * 0.5;
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(2.0, 0.5, 4.4, 0); sh.quadraticCurveTo(2.0, -0.5, 0, 0);
      const geo = new THREE.ShapeGeometry(sh, 10); const pa = geo.attributes.position;
      for (let k = 0; k < pa.count; k++) { const u = pa.getX(k) / 4.4; pa.setZ(k, -u * u * 2.6 * droop + u * 0.6); }
      geo.rotateX(-Math.PI / 2); geo.rotateY(a);
      const leaf = new THREE.Mesh(geo, mat); leaf.position.copy(top); g.add(leaf); }
    return g;
  }
  const envOf = (name) => { const tmp = new THREE.Scene(); C.sky(tmp, name, { background: false }); return tmp.environment; };
  const HQ = {
    move(ctx, shot) {
      const b = base(ctx, { floor: 0x0b0c0e, fog: 0x0a0d14, density: 0.0028, fov: 30 }); const { scene, camera, layer } = b;
      const envN = envOf('moonless_golf'), envD = envOf('qwantani_dusk_2');
      const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vD; void main(){ float az = atan(vD.x, -vD.z); float k = smoothstep(-0.05, 0.45, az); float y = max(vD.y, 0.0);
          vec3 night = mix(vec3(0.035, 0.05, 0.085), vec3(0.004, 0.006, 0.016), pow(y, 0.45));
          vec3 dusk = mix(vec3(1.25, 0.5, 0.2), vec3(0.55, 0.3, 0.38), smoothstep(0.0, 0.1, y)); dusk = mix(dusk, vec3(0.05, 0.1, 0.2), smoothstep(0.08, 0.55, y));
          gl_FragColor = vec4(mix(night, dusk, k), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` }));
      scene.add(sky); scene.background = null;
      b.ground.material.roughness = 0.25; b.ground.material.metalness = 0.5; b.ground.material.envMap = envN; b.ground.material.envMapIntensity = 0.15;
      // DENVER, night: cold glass, the Front Range behind, protest light at the base
      const dn = new THREE.Vector3(-62, 0, -120);
      glassTower(scene, { x: dn.x, z: dn.z, w: 22, d: 22, h: 88, seed: 3, lit: 0.12, litColor: 0xbcd4ff, env: envN, floors: 32 });
      glassTower(scene, { x: dn.x - 40, z: dn.z - 34, w: 16, d: 16, h: 56, seed: 4, lit: 0.07, litColor: 0xbcd4ff, env: envN, floors: 20 });
      glassTower(scene, { x: dn.x + 34, z: dn.z - 46, w: 14, d: 18, h: 48, seed: 5, lit: 0.08, litColor: 0xbcd4ff, env: envN, floors: 18 });
      const ridge = new THREE.Shape(); ridge.moveTo(-500, 0); const rr = K.rng(9); for (let i = 0; i <= 50; i++) ridge.lineTo(-500 + i * 20, 34 + Math.sin(i * 0.6) * 16 + rr() * 14); ridge.lineTo(500, 0);
      const rm = new THREE.Mesh(new THREE.ShapeGeometry(ridge), new THREE.MeshBasicMaterial({ color: 0x0b1018, fog: false })); rm.position.set(-300, 0, -560); rm.rotation.y = 0.5; scene.add(rm);
      const moon = new THREE.DirectionalLight(0x8fa8d8, 0.35); moon.position.set(-60, 80, 40); scene.add(moon);
      const protest = []; const pr = K.rng(14); const pm = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 });
      for (let i = 0; i < 30; i++) { const c = C.character('UAL', { clip: pr() < 0.7 ? 'Idle_Loop' : 'Walk_Loop', phase: pr() * 3, material: pm });
        c.root.position.set(dn.x - 16 + pr() * 32, 0, dn.z + 15 + pr() * 10); c.root.rotation.y = Math.PI + (pr() - 0.5) * 1.2; scene.add(c.root); protest.push(c); }
      for (let i = 0; i < 4; i++) { const pl = new THREE.PointLight(i % 2 ? 0xff7a3a : 0xffa860, 320, 34, 1.6); pl.position.set(dn.x - 12 + i * 8, 1.3, dn.z + 21); scene.add(pl); }
      K.lightShaft(scene, { pos: [dn.x, 0.4, dn.z + 22], target: [dn.x, 32, dn.z + 6], radius: 18, color: 0xff9a50, intensity: 0.06 });
      // MIAMI, dusk: balconied tower backlit by the low sun, palms in silhouette, the bay in front
      const mi = new THREE.Vector3(96, 0, -110);
      glassTower(scene, { x: mi.x, z: mi.z, w: 24, d: 18, h: 96, seed: 8, lit: 0.1, litColor: 0xffd2a0, glass: 0x22303c, env: envD, balconies: true, floors: 34 });
      glassTower(scene, { x: mi.x + 44, z: mi.z - 40, w: 16, d: 16, h: 64, seed: 9, lit: 0.08, litColor: 0xffd2a0, glass: 0x22303c, env: envD, balconies: true, floors: 22 });
      glassTower(scene, { x: mi.x - 40, z: mi.z - 56, w: 16, d: 16, h: 74, seed: 10, lit: 0.08, litColor: 0xffd2a0, glass: 0x22303c, env: envD, floors: 26 });
      const bay = new THREE.Mesh(new THREE.PlaneGeometry(150, 70), new THREE.MeshStandardMaterial({ color: 0x0a0f14, roughness: 0.06, metalness: 1, envMap: envD, envMapIntensity: 1.1 }));
      bay.rotation.x = -Math.PI / 2; bay.position.set(mi.x + 20, 0.03, mi.z + 48); scene.add(bay);
      const sun = new THREE.DirectionalLight(0xff9a60, 2.2); sun.position.set(mi.x + 160, 30, mi.z - 200); sun.target.position.copy(mi); scene.add(sun, sun.target);
      const palmM = new THREE.MeshBasicMaterial({ color: 0x06070a, side: THREE.DoubleSide });
      const pp = K.rng(31); for (let i = 0; i < 8; i++) palm(scene, 38 + i * 7.5 + pp() * 3, -36 - pp() * 10, 1.2 + pp() * 0.5, 40 + i, palmM);
      // the wipe: a dark building edge close to the lens between the two cities
      mesh(new THREE.BoxGeometry(12, 90, 12), std(0x050506, { roughness: 0.9 }), [14, 45, -44], scene);
      const move = C.path([
        { pos: [-14, 4.5, 34], look: [dn.x, 27, dn.z], mm: 40 },
        { pos: [3, 5.5, 28], look: [14, 30, -44], mm: 38 },
        { pos: [20, 4.0, 26], look: [mi.x, 38, mi.z], mm: 40 },
      ], { duration: shot.duration, accel: 0.3, decel: 0.35, float: 0.02 });
      const cD = K.div(layer, `left:6%;bottom:15%;${MONO(0.8, '#bcd0f0')}`, 'Denver'), cM = K.div(layer, `right:6%;bottom:15%;${MONO(0.8, '#ffd2a8')}`, 'Miami');
      const dir = new THREE.Vector3();
      return scope({ ...b, update(t, p) {
        protest.forEach(c => c.update(t)); move(camera, p, t);
        camera.getWorldDirection(dir); const az = Math.atan2(dir.x, -dir.z);
        cD.style.opacity = K.range(t, 0.2, 0.8) * (1 - K.range(az, -0.3, -0.05)); cM.style.opacity = K.range(az, 0.2, 0.45);
      } });
    },
  };

  return {
    map(ctx, shot) { const m = shot.params.mode ?? 'europe'; return (MAP[m] ?? MAP.europe)(ctx, shot); },
    chart(ctx, shot) { const m = shot.params.mode ?? 'spike'; return (CHART[m] ?? CHART.spike)(ctx, shot); },
    exchange(ctx, shot) { return EXCHANGE.listing(ctx, shot); },
    protest(ctx, shot) { return PROTEST.march(ctx, shot); },
    hq(ctx, shot) { return HQ.move(ctx, shot); },
  };
}
