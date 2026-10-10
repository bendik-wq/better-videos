// Palantir episode, ops library: the intelligence and war sets.
//   graph      what Palantir does: data as glowing objects in a void, linked
//   silos      glass rooms of data that never talk, then the walls come down
//   warroom    the operations centre, and the empty room where the CEO said it
//   feed       drone and satellite views through a sensor (abstract, no gore)
//   addresses  a night suburb seen from above, scored
//   police     New Orleans: wet streets, an empty council chamber, a private door
// Every frame is a pure function of (t, p). No Math.random, no wall clock.
import * as C0 from '/engine/cine.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

// The runtime only preloads the legacy characters; the operators here are the UAL mannequin.
let UAL_OK = false;
try { await C0.preload(null, { characters: ['UAL'], hdris: [] }); UAL_OK = true; } catch (e) { console.warn('[ops] UAL mannequin unavailable, using block silhouettes', e?.message); }

export function makeOps(H) {
  const { THREE, K, C, PP, base, mesh, std, caption, sourceLine, wt, vo0, voEnd, canvasTex, fakeText, CAP, SERIF, RED, SODIUM, FLUO, ICE, PAPER } = H;
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const sc = () => window.innerHeight / 1080;
  const MONO = `font:500 .95em 'Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#d6cfbf;white-space:nowrap;line-height:1.5`;
  const MONO_DIM = `font:400 .8em 'Plex Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#8f897d;white-space:nowrap;line-height:1.5`;
  const NUM = `font:700 1em 'Archivo Narrow',sans-serif;color:${PAPER};white-space:nowrap;line-height:1`;
  const scope = (o) => ({ ...o, scope: true });
  const SCOPE_TOP = 'left:6%;top:15.5%', SCOPE_BOT = 'right:5%;bottom:15.5%';
  const scopeSource = (layer, text) => text ? K.div(layer, `right:5%;bottom:15%;font:400 .72em 'Plex Mono',monospace;letter-spacing:.14em;color:#8f897d`, text) : null;
  const place = (el, x, y, dx = 0, dy = 0) => { const s = sc(); el.style.left = `${(x + dx) * s}px`; el.style.top = `${(y + dy) * s}px`; };
  const toScr = (v, cam) => K.toScreen(v.isVector3 ? v : V3(...v), cam);
  const tw = (shot, word, fb) => { const w = (shot.words || []).find(x => x.w.toLowerCase().replace(/[^a-z]/g, '').startsWith(word)); return w ? w.s : fb; };
  const bufH = (ctx) => ctx.renderer?.getDrawingBufferSize?.(new THREE.Vector2()).y || ctx.height || 1080;
  const smoothstep = (a, b, x) => K.smooth(K.clamp((x - a) / (b - a)));

  // ---------------------------------------------------------------- glowing points & lines
  // Points: additive soft discs with per-point colour and world size, fogged by distance.
  function glowPoints(ctx, n, { fog = 0.012, gain = 1, minPx = 1.6 } = {}) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n).fill(0.1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: bufH(ctx) * 0.5 }, uFog: { value: fog }, uGain: { value: gain }, uMin: { value: minPx } },
      vertexShader: `attribute vec3 aCol; attribute float aSize; uniform float uScale, uFog, uGain, uMin; varying vec3 vC;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); float d = max(-mv.z, 0.05);
          float px = aSize*uScale/d*projectionMatrix[1][1]; float f = exp(-uFog*uFog*d*d);
          vC = aCol*f*uGain*min(1.0, px/uMin)*min(1.0, px/uMin); gl_PointSize = clamp(px, uMin, 320.0); gl_Position = projectionMatrix*mv;
          if (-mv.z < 0.3) { gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); } }`,
      fragmentShader: `varying vec3 vC; void main(){ vec2 c = gl_PointCoord-0.5; float r = length(c)*2.0; if (r > 1.0) discard;
          float core = smoothstep(0.5, 0.0, r); float halo = (1.0-r)*(1.0-r)*0.4; gl_FragColor = vec4(vC*(core+halo), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false;
    pts.pos = pos; pts.col = col; pts.size = size; pts.n = n;
    pts.commit = () => { g.attributes.position.needsUpdate = true; g.attributes.aCol.needsUpdate = true; g.attributes.aSize.needsUpdate = true; };
    pts.set = (i, p, c, s) => { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2]; if (c) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; } if (s != null) size[i] = s; };
    return pts;
  }
  // Line segments: additive, per-vertex colour, distance fog.
  function glowLines(n, { fog = 0.012, gain = 1 } = {}) {
    const pos = new Float32Array(n * 6), col = new Float32Array(n * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({
      uniforms: { uFog: { value: fog }, uGain: { value: gain } },
      vertexShader: `attribute vec3 aCol; uniform float uFog, uGain; varying vec3 vC; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); float d = -mv.z; vC = aCol*uGain*exp(-uFog*uFog*d*d); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const ls = new THREE.LineSegments(g, m); ls.frustumCulled = false; ls.pos = pos; ls.col = col; ls.n = n;
    ls.commit = () => { g.attributes.position.needsUpdate = true; g.attributes.aCol.needsUpdate = true; };
    ls.seg = (i, a, b, ca, cb = ca) => { pos.set(a, i * 6); pos.set(b, i * 6 + 3); col.set(ca, i * 6); col.set(cb, i * 6 + 3); };
    ls.count = (k) => g.setDrawRange(0, k * 2);
    return ls;
  }
  // A thin luminous tube from a to b, drawn on to fraction k, with a soft halo.
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).translate(0, 0.5, 0);
  function beam(scene, color, r = 0.03, { halo = 3.5, haloA = 0.16, opacity = 1, additive = true } = {}) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false }));
    const glow = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: haloA, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(core, glow); scene.add(g); const up = V3(0, 1, 0), d = V3();
    g.set = (a, b, k = 1, w = 1) => {
      const A = a.isVector3 ? a : V3(...a), B = b.isVector3 ? b : V3(...b);
      d.subVectors(B, A); const L = d.length() * K.clamp(k); g.visible = L > 1e-4 && w > 0.001;
      if (!g.visible) return; g.position.copy(A); g.quaternion.setFromUnitVectors(up, d.normalize());
      core.scale.set(r * w, L, r * w); glow.scale.set(r * halo * w, L, r * halo * w);
    };
    g.fade = (a) => { core.material.opacity = opacity * a; glow.material.opacity = haloA * a; };
    return g;
  }
  // Canvas "data card": mono text on a dark or paper ground.
  function cardTex(lines, { w = 512, h = 300, bg = '#0b0e12', fg = '#cfd8e6', dim = '#5d6876', accent = null, border = 'rgba(160,190,230,.35)', title = null, font = 30 } = {}) {
    return canvasTex(w, h, (x) => {
      x.fillStyle = bg; x.fillRect(0, 0, w, h);
      if (border) { x.strokeStyle = border; x.lineWidth = 3; x.strokeRect(6, 6, w - 12, h - 12); }
      let y = 26;
      if (title) { x.fillStyle = accent ?? dim; x.font = `500 ${font * 0.7}px "Plex Mono"`; x.textBaseline = 'top'; x.fillText(title, 28, y); y += font * 1.3; x.fillStyle = border ?? dim; x.fillRect(28, y - 8, w - 56, 2); y += 6; }
      x.textBaseline = 'top';
      lines.forEach((l, i) => { const [txt, c] = Array.isArray(l) ? l : [l, null]; x.fillStyle = c ?? (i === 0 ? fg : dim); x.font = `${i === 0 ? 500 : 400} ${i === 0 ? font : font * 0.78}px "Plex Mono"`; x.fillText(txt, 28, y); y += (i === 0 ? font : font * 0.78) * 1.45; });
    });
  }
  // Anonymous head-and-shoulders silhouette (no face), as an alpha texture.
  function bustTex({ fill = '#9aa1ab', rim = null, w = 256, h = 320, lw = 7 } = {}) {
    return canvasTex(w, h, (x) => {
      x.clearRect(0, 0, w, h);
      const shapes = () => { x.beginPath(); x.ellipse(w / 2, h * 0.3, w * 0.16, h * 0.165, 0, 0, Math.PI * 2);
        x.moveTo(w * 0.1, h); x.bezierCurveTo(w * 0.12, h * 0.64, w * 0.3, h * 0.56, w / 2, h * 0.56); x.bezierCurveTo(w * 0.7, h * 0.56, w * 0.88, h * 0.64, w * 0.9, h); x.closePath();
        x.rect(w * 0.43, h * 0.4, w * 0.14, h * 0.18); };
      // the rim is the outer half of a stroke; the fill covers the inner half
      if (rim) { x.strokeStyle = rim; x.lineWidth = lw; x.lineJoin = 'round'; shapes(); x.stroke(); }
      x.fillStyle = fill; shapes(); x.fill('nonzero');
    });
  }
  // Deterministic gaussian-ish
  const gauss = (r) => (r() + r() + r() + r() - 2) * 0.87;
  // Points sampled on the UAL mannequin's surface in a natural standing pose (fallback: capsules).
  function humanPoints(n, seed = 3, height = 1.8) {
    const r = K.rng(seed); const out = [];
    if (UAL_OK) {
      try {
        const ch = C.character('UAL', { clip: 'Idle_Loop' }); ch.update(0.8); ch.root.updateMatrixWorld(true);
        const skinned = []; ch.root.traverse(o => { if (o.isSkinnedMesh) skinned.push(o); });
        const box = new THREE.Box3(); const raw = [];
        // posed triangles, sampled by area so dense hands don't clump
        const tris = []; let total = 0; const A = V3(), B = V3(), Cc = V3(), e1 = V3(), e2 = V3();
        const posed = (sm, i, v) => { v.fromBufferAttribute(sm.geometry.attributes.position, i); sm.applyBoneTransform(i, v); return v.applyMatrix4(sm.matrixWorld); };
        for (const sm of skinned) { const idx = sm.geometry.index; const cnt = idx ? idx.count : sm.geometry.attributes.position.count;
          for (let k = 0; k < cnt; k += 3) { const ia = idx ? idx.getX(k) : k, ib = idx ? idx.getX(k + 1) : k + 1, ic = idx ? idx.getX(k + 2) : k + 2;
            posed(sm, ia, A); posed(sm, ib, B); posed(sm, ic, Cc); const ar = e1.subVectors(B, A).cross(e2.subVectors(Cc, A)).length() / 2; total += ar; tris.push([total, A.clone(), B.clone(), Cc.clone()]); } }
        for (let i = 0; i < n; i++) { const x = r() * total; let lo = 0, hi = tris.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid][0] < x) lo = mid + 1; else hi = mid; }
          let u = r(), w = r(); if (u + w > 1) { u = 1 - u; w = 1 - w; } const [, a, bb, c] = tris[lo]; const v = a.clone().addScaledVector(e1.subVectors(bb, a), u).addScaledVector(e2.subVectors(c, a), w); raw.push(v); box.expandByPoint(v); }
        const hgt = box.max.y - box.min.y || 1; const s = height / hgt; const cx = (box.max.x + box.min.x) / 2, cz = (box.max.z + box.min.z) / 2;
        for (const p of raw.slice(0, n)) out.push(V3((p.x - cx) * s, (p.y - box.min.y) * s, (p.z - cz) * s));
        return out;
      } catch (e) { console.warn('[ops] humanPoints fallback', e?.message); }
    }
    const parts = [[0, 1.62, 0, 0.11, 0.13], [0, 1.2, 0, 0.19, 0.3], [-0.26, 1.15, 0, 0.05, 0.3], [0.26, 1.15, 0, 0.05, 0.3], [-0.1, 0.45, 0, 0.07, 0.45], [0.1, 0.45, 0, 0.07, 0.45]];
    for (let i = 0; i < n; i++) { const [x, y, z, rad, hh] = parts[Math.floor(r() * parts.length)]; const a = r() * 6.283, u = r() * 2 - 1;
      out.push(V3(x + Math.cos(a) * rad, y + u * hh, z + Math.sin(a) * rad * 0.7).multiplyScalar(height / 1.8)); }
    return out;
  }
  // Nearest-neighbour edges (k per point) among a point list, grid-hashed.
  function knnEdges(pts, k = 2, maxD = Infinity, cell = 1) {
    const grid = new Map(); const key = (x, y, z) => `${x},${y},${z}`;
    pts.forEach((p, i) => { const kk = key(Math.floor(p.x / cell), Math.floor(p.y / cell), Math.floor(p.z / cell)); (grid.get(kk) ?? grid.set(kk, []).get(kk)).push(i); });
    const edges = []; const seen = new Set();
    pts.forEach((p, i) => {
      const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell), cz = Math.floor(p.z / cell); const cand = [];
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const j of grid.get(key(cx + a, cy + b, cz + c)) ?? []) if (j !== i) cand.push([p.distanceToSquared(pts[j]), j]);
      cand.sort((x, y) => x[0] - y[0]);
      for (const [d2, j] of cand.slice(0, k)) { if (d2 > maxD * maxD) continue; const e = i < j ? `${i}-${j}` : `${j}-${i}`; if (!seen.has(e)) { seen.add(e); edges.push([i, j]); } }
    });
    return edges;
  }
  const colArr = (hex, s = 1) => { const c = new THREE.Color(hex); return [c.r * s, c.g * s, c.b * s]; };
  const camLens = (camera, mm) => { C.lens(camera, mm); camera.updateProjectionMatrix(); };
  // Camera that travels through stations, each leg eased and keyed to a time (word sync).
  function stations(keys, legs) { // keys [{pos,look,mm}], legs [[t0,t1],...] (keys.length-1)
    const rig = C.path(keys, { accel: 0.5, decel: 0.5, float: 0 });
    const n = keys.length - 1;
    // chord-length knots, so leg i spans [u_i, u_{i+1}] of the path parameter; we drive u by legs
    const d = [0]; for (let i = 1; i < keys.length; i++) d.push(d[i - 1] + Math.hypot(...keys[i].pos.map((v, j) => v - keys[i - 1].pos[j])) + 1e-3);
    const u = d.map(x => x / d.at(-1));
    const path = C.path(keys, { accel: 0, decel: 0, float: 0 });
    return (camera, t, float = 0.02) => {
      let uu = 0; for (let i = 0; i < n; i++) { const [a, b] = legs[i]; const k = K.inOut(K.range(t, a, b)); uu = i === 0 ? u[0] + (u[1] - u[0]) * k : (t >= a ? u[i] + (u[i + 1] - u[i]) * k : uu); }
      path(camera, uu, t); const h = K.handheld(t, float, 4); camera.position.x += h.x; camera.position.y += h.y; camera.rotation.z += h.r;
    };
  }

  // ================================================================ GRAPH
  function graph(ctx, shot) {
    const P0 = shot.params; const mode = P0.mode ?? 'scatter';
    const b = base(ctx, { floor: mode === 'fraud' ? 0x120e0b : null, fog: mode === 'fraud' ? 0x050403 : 0x010205, density: mode === 'fraud' ? 0.04 : 0.008, fov: 30 });
    const { scene, camera, layer } = b; const T = shot.duration; const r = K.rng(17);
    const motes = K.dust(scene, { count: 500, box: [60, 30, 60], center: [0, 6, 0], size: 0.05, opacity: 0.25, color: 0xa8c0ff });
    const out = { ...b, update() {} };
    const COOL = colArr(0x9fc4ff, 0.9), WHITE = colArr(0xfff0dc, 1), SOD = colArr(SODIUM, 1.2), REDC = colArr(RED, 1.4);
    // clusters of data fragments (scatter / hunt / connects)
    const clusterWorld = ({ n = 7, per = 700, spread = 70, seed = 5, ring = false }) => {
      const rr = K.rng(seed); const centers = [];
      for (let i = 0; i < n; i++) {
        if (ring) { const a = i / n * Math.PI * 2 + rr() * 0.3, el = (rr() - 0.5) * 0.9; centers.push(V3(Math.cos(a) * spread * Math.cos(el), Math.sin(el) * spread * 0.6 + 6, Math.sin(a) * spread * Math.cos(el))); }
        else centers.push(V3((i / (n - 1) - 0.5) * spread * 2 + (rr() - 0.5) * 8, 4 + (rr() - 0.5) * 14, (rr() - 0.5) * spread * 0.9));
      }
      const pts = []; const owner = [];
      centers.forEach((c, i) => { const rad = 5 + rr() * 4; for (let k = 0; k < per; k++) { pts.push(V3(c.x + gauss(rr) * rad, c.y + gauss(rr) * rad * 0.7, c.z + gauss(rr) * rad)); owner.push(i); } });
      return { centers, pts, owner };
    };
    const fragmentCards = (world, count, seed = 9) => {
      const rr = K.rng(seed); const texs = [
        cardTex(['CALL 05:12:44', '+1 504 555 0148', 'DUR 00:03:12']), cardTex(['WIRE $9,850', 'ACCT ••7731 → ••0402', 'REF 88213']),
        cardTex(['PLATE 7KX 391', 'CAM 14 · 23:41', 'LAT 29.95 LON −90.07']), cardTex(['PAX MANIFEST', 'SEAT 14C · FLT 2211', 'IAD → DXB']),
        cardTex(['CASE 2016-0447', 'STATUS OPEN', 'LINKED 3']), cardTex(['IP 10.4.22.81', 'LOGIN 03:12', 'DEVICE A7F2'])];
      const g = new THREE.Group(); scene.add(g); const ms = [];
      texs.forEach((tex, ti) => { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.7, 1.0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), Math.ceil(count / texs.length)); g.add(im); ms.push(im); });
      const items = []; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let i = 0; i < count; i++) { const p = world.pts[Math.floor(rr() * world.pts.length)].clone(); const s = 0.4 + rr() * 0.7; e.set((rr() - 0.5) * 0.6, (rr() - 0.5) * 1.6, (rr() - 0.5) * 0.4); q.setFromEuler(e);
        m4.compose(p, q, V3(s, s, s)); const im = ms[i % ms.length]; im.setMatrixAt(Math.floor(i / ms.length), m4); items.push(p); }
      return { g, items };
    };
    const drawCloud = (world, pts, { col = COOL, size = 0.12, var: vr = 0.6, seed = 3 } = {}) => {
      const rr = K.rng(seed);
      world.pts.forEach((p, i) => { const s = rr(); const c = s > 0.985 ? WHITE : col; const br = 0.35 + rr() * vr; pts.set(i, [p.x, p.y, p.z], [c[0] * br, c[1] * br, c[2] * br], size * (0.6 + s * 0.8 + (s > 0.985 ? 1.2 : 0))); });
      pts.commit();
    };

    if (mode === 'fraud') {
      // card transactions on a dark table under one desk lamp; the suspicious ones get linked in red
      b.ground.material.color.set(0x16110d); b.ground.material.roughness = 0.8;
      const wood = K.grimeTexture(21, 90); wood.repeat.set(4, 4); b.ground.material.roughnessMap = wood; b.ground.material.map = wood;
      const amounts = ['$12.40', '$58.00', '$9,850.00', '$1.00', '$214.17', '$46.50', '$999.99', '$3.20', '$75.00', '$1,200.00', '$18.95', '$9,900.00'];
      const texs = amounts.map((a, i) => canvasTex(360, 560, (x, w, h) => {
        x.fillStyle = '#e8e1d0'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(60,50,40,.08)'; for (let k = 0; k < 40; k++) x.fillRect(0, k * 14, w, 1);
        x.fillStyle = '#2a2622'; x.font = '500 26px "Plex Mono"'; x.fillText('TRANSACTION', 30, 54); x.font = '400 20px "Plex Mono"'; x.fillStyle = '#6a6258';
        x.fillText(`CARD 4485 •••• ${String(1000 + i * 731 % 9000)}`, 30, 100); x.fillText(`MERCH ${['ONLINE', 'POS', 'WIRE', 'P2P'][i % 4]} ${(i * 37) % 97}`, 30, 130); x.fillText(`TIME 0${(i * 7) % 10}:${String((i * 13) % 60).padStart(2, '0')}`, 30, 160);
        fakeText(x, w, 300, { seed: i + 4, lines: 7, margin: 30, color: 'rgba(80,70,60,.4)' }); x.save(); x.translate(0, 200); fakeText(x, w, 260, { seed: i + 9, lines: 6, margin: 30, color: 'rgba(80,70,60,.35)' }); x.restore();
        x.fillStyle = '#1d1a17'; x.font = '700 54px "Archivo Narrow"'; x.fillText(a, 30, 500);
      }));
      const cards = []; const cardGeo = new THREE.BoxGeometry(0.72, 0.008, 1.12);
      const side = std(0xd8d0bf, { roughness: 0.9 });
      for (let i = 0; i < 64; i++) {
        const gx = ((i % 10) - 4.5) * 1.25, gz = (Math.floor(i / 10) - 3) * 1.15; const tm = new THREE.MeshStandardMaterial({ map: texs[i % texs.length], roughness: 0.85 });
        const c = mesh(cardGeo, [side, side, tm, side, side, side], [gx * 0.95 + (r() - 0.5) * 0.35, 0.006 + r() * 0.01, gz * 1.3 + (r() - 0.5) * 0.35], scene); c.rotation.y = (r() - 0.5) * 0.5; cards.push(c);
      }
      const sus = [34, 25, 36, 45, 43]; // linked chain of suspicious transactions
      const threads = sus.slice(1).map(() => beam(scene, RED, 0.008, { halo: 2.2, haloA: 0.12, additive: false }));
      const pins = sus.map(i => { const m = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), new THREE.MeshBasicMaterial({ color: RED }), [cards[i].position.x, 0.03, cards[i].position.z], scene); m.visible = false; return m; });
      // the lamp: a black enamel shade just inside frame, its hot bulb, a pen left on the table
      const lamp = new THREE.Group(); lamp.position.set(-2.9, 2.35, -2.0); scene.add(lamp);
      const shade = mesh(new THREE.ConeGeometry(0.75, 0.8, 40, 1, true), std(0x1a1a1a, { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }), [0, 0, 0], lamp); shade.rotation.z = -0.5;
      const bulb = mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0dc }), [0.12, -0.2, 0], lamp);
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 8), std(0x111111, { metalness: 0.7 }), [-0.5, 1.6, 0], lamp).rotation.z = 0.25;
      const key = K.keySpot(scene, { color: 0xfff0dc, intensity: 70, pos: [-2.75, 2.1, -1.95], target: [0.2, 0, 0.4], angle: 0.85, penumbra: 1, shadow: 2048 });
      key.decay = 2; K.lightShaft(scene, { pos: [-2.75, 2.1, -1.95], target: [0.2, 0, 0.4], radius: 2.2, color: 0xfff0dc, intensity: 0.025 });
      scene.add(new THREE.HemisphereLight(0x30384a, 0x050403, 0.12));
      const pen = new THREE.Group(); pen.position.set(1.9, 0.05, 1.5); pen.rotation.y = 0.7; scene.add(pen);
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 16), std(0x0b0b0c, { metalness: 0.5, roughness: 0.25 }), [0, 0, 0], pen).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.2, 16), std(0xb08d4a, { metalness: 1, roughness: 0.3 }), [0.45, 0, 0], pen).rotation.z = Math.PI / 2;
      motes.visible = false; K.dust(scene, { count: 300, box: [6, 3, 5], center: [-1, 1.6, 0], size: 0.018, opacity: 0.5, color: 0xfff0dc });
      const move = C.path([{ pos: [4.6, 2.6, 6.0], look: [-0.2, 0, -0.2], mm: 40 }, { pos: [3.4, 2.1, 4.6], look: [-0.1, 0, -0.3], mm: 45 }], { accel: 0.3, decel: 0.5, float: 0.01 });
      const tA = T * 0.25, tB = T * 0.85;
      out.update = (t, p) => {
        move(camera, p, t);
        sus.forEach((ci, k) => { pins[k].visible = t > tA + (k - 0.5) * (tB - tA) / sus.length; });
        threads.forEach((th, k) => { const a = cards[sus[k]].position, c = cards[sus[k + 1]].position; const s = tA + k * (tB - tA) / threads.length;
          th.set(V3(a.x, 0.035, a.z), V3(c.x, 0.035, c.z), K.inOut(K.range(t, s, s + 0.7))); });
      };
      return out;
    }

    if (mode === 'scatter' || mode === 'hunt') {
      const world = clusterWorld({ n: mode === 'scatter' ? 9 : 7, per: mode === 'scatter' ? 2600 : 1300, spread: mode === 'hunt' ? 46 : 42, seed: mode === 'hunt' ? 8 : 5 });
      const pts = glowPoints(ctx, world.pts.length, { fog: 0.011, gain: mode === 'scatter' ? 3.0 : 1 }); scene.add(pts); drawCloud(world, pts, { size: mode === 'scatter' ? 0.28 : 0.2, var: 0.9 });
      fragmentCards(world, mode === 'scatter' ? 700 : 320, 4);
      if (mode === 'scatter') { // a fine field of loose fragments between the clusters, and a few warm records among the cold
        const field = glowPoints(ctx, 6000, { fog: 0.012, minPx: 1.2 }); scene.add(field); const rf = K.rng(21);
        for (let i = 0; i < 6000; i++) { const c = rf() < 0.04 ? SOD : COOL; const br = 0.25 + rf() * 0.5; field.set(i, [(rf() - 0.5) * 140, (rf() - 0.5) * 34 + 5, (rf() - 0.5) * 70 - 6], [c[0] * br, c[1] * br, c[2] * br], 0.07 + rf() * 0.08); } field.commit(); }
      // out-of-focus fragments drifting close to the lens give the void depth
      const near = glowPoints(ctx, 120, { fog: 0.0 }); scene.add(near); const rn = K.rng(66);
      for (let i = 0; i < 120; i++) near.set(i, [(rn() - 0.5) * 120, (rn() - 0.5) * 24 + 5, 22 + rn() * 14], COOL.map(v => v * 0.1), 0.5 + rn() * 0.9); near.commit();
      // faint links inside each cluster only: nothing crosses between them
      const ed = knnEdges(world.pts, 2, 2.6, 2.6).filter(([i, j]) => world.owner[i] === world.owner[j]).slice(0, 9000);
      const lines = glowLines(ed.length, { fog: 0.014, gain: mode === 'scatter' ? 0.42 : 0.2 }); scene.add(lines);
      ed.forEach(([i, j], k) => lines.seg(k, world.pts[i].toArray(), world.pts[j].toArray(), COOL)); lines.commit();
      if (mode === 'scatter') {
        const move = C.path([{ pos: [-48, 6, 34], look: [-18, 5.5, 0], mm: 32 }, { pos: [-6, 5.5, 37], look: [10, 5.5, -2], mm: 32 }, { pos: [28, 5, 33], look: [32, 5, -4], mm: 32 }], { accel: 0.35, decel: 0.35, float: 0.04 });
        out.update = (t, p) => { motes.update(t); move(camera, p, t); scene.rotation.y = 0; };
        return out;
      }
      // hunt: one thread runs through every cluster; the camera follows its head
      const order = world.centers.map((c, i) => i).sort((a, b2) => world.centers[a].x - world.centers[b2].x);
      const via = [V3(-90, 6, 10)]; order.forEach(i => { const c = world.centers[i]; via.push(c.clone().add(V3(0, (i % 2 ? 1.5 : -1.5), 0))); }); via.push(V3(95, 6, -6));
      const curve = new THREE.CatmullRomCurve3(via, false, 'centripetal');
      const N = 600; const cp = curve.getSpacedPoints(N);
      const thread = glowLines(N, { fog: 0.006, gain: 1 }); scene.add(thread);
      for (let i = 0; i < N; i++) thread.seg(i, cp[i].toArray(), cp[i + 1].toArray(), SOD); thread.commit();
      const head = glowPoints(ctx, 1, { fog: 0.004 }); scene.add(head);
      const halo = glowPoints(ctx, 1, { fog: 0.004 }); scene.add(halo); const trail = glowPoints(ctx, 40, { fog: 0.004 }); scene.add(trail);
      const t0 = 0.2, t1 = T - 0.25;
      const uAt = (t) => { const x = K.range(t, -0.2, T); return 0.2 + 0.36 * (0.55 * x + 0.45 * K.outCubic(x)); }; // already moving: a follow-through
      thread.material.uniforms.uGain.value = 1.4;
      const base1 = Float32Array.from(pts.col);
      const follow = C.moves.followThrough({ subject: (tt) => curve.getPointAt(uAt(tt)).toArray(), mm: 32, offset: [-4, 2.6, 12.5], lag: 0.45, overshoot: 0.08, lookHeight: 0 });
      out.update = (t, p) => {
        motes.update(t); const u = uAt(t); const k = Math.floor(u * N); thread.count(k);
        for (let i = 0; i < 40; i++) { const q = curve.getPointAt(Math.max(0, u - i * 0.0012)); trail.set(i, q.toArray(), SOD.map(v => v * (1 - i / 40) * 0.8), 0.18 * (1 - i / 45)); } trail.commit();
        const hp = curve.getPointAt(u); head.set(0, hp.toArray(), WHITE.map(v => v * 2), 0.5); head.commit(); halo.set(0, hp.toArray(), SOD.map(v => v * 0.5), 2.4); halo.commit();
        // a cluster brightens as the thread passes through it
        const lit = world.centers.map(c => 1 + 1.4 * Math.exp(-c.distanceToSquared(hp) / 120));
        for (let i = 0; i < world.pts.length; i++) { const l = lit[world.owner[i]]; pts.col[i * 3] = base1[i * 3] * l; pts.col[i * 3 + 1] = base1[i * 3 + 1] * l; pts.col[i * 3 + 2] = base1[i * 3 + 2] * l; }
        pts.geometry.attributes.aCol.needsUpdate = true;
        follow(camera, p, t);
      };
      return out;
    }

    if (mode === 'piles') {
      // five towering piles in the dark; each label lands on its word
      const names = ['PHONE RECORDS', 'BANK TRANSFERS', 'LICENCE PLATES', 'FLIGHT LISTS', 'CASE FILES'];
      const words = P0.words ?? ['Phone', 'Bank', 'Licence', 'Flight', 'Case'];
      b.ground && (b.ground.visible = false);
      const floor = mesh(new THREE.PlaneGeometry(200, 200), std(0x0c0c0d, { roughness: 0.35, metalness: 0.4 }), [0, 0, 0], scene); floor.rotation.x = -Math.PI / 2;
      scene.fog = new THREE.FogExp2(0x020203, 0.03);
      const kinds = [
        { w: 1.6, d: 2.1, h: 0.012, mat: std(0xe6e0d2, { roughness: 0.9 }), n: 520, jit: 0.12 },                     // paper call logs
        { w: 1.5, d: 2.0, h: 0.014, mat: std(0xc9d6c4, { roughness: 0.85 }), n: 470, jit: 0.1 },                      // bank slips
        { w: 1.25, d: 0.55, h: 0.03, mat: std(0xaab0b6, { metalness: 0.85, roughness: 0.35 }), n: 300, jit: 0.25 },   // licence plates
        { w: 1.6, d: 2.2, h: 0.012, mat: std(0xdcd6c6, { roughness: 0.9 }), n: 560, jit: 0.15 },                     // flight manifests
        { w: 1.8, d: 2.4, h: 0.045, mat: std(0xc4a368, { roughness: 0.85 }), n: 170, jit: 0.1 },                      // manila case files
      ];
      const piles = kinds.map((kd, i) => {
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(kd.w, kd.h, kd.d), kd.mat, kd.n); im.castShadow = true; im.receiveShadow = false;
        const x = (i - 2) * 4.2, z = -Math.abs(i - 2) * 1.2; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); const rr = K.rng(30 + i); let y = 0;
        for (let k = 0; k < kd.n; k++) { const lean = Math.sin(k / kd.n * 2.2 + i * 1.7) * 0.22; q.setFromEuler(new THREE.Euler((rr() - 0.5) * 0.012, (rr() - 0.5) * kd.jit * 1.4 + Math.sin(k * 0.05 + i) * 0.06, (rr() - 0.5) * 0.012));
          m4.compose(V3(x + (rr() - 0.5) * kd.jit * 0.4 + lean, y + kd.h / 2, z + (rr() - 0.5) * kd.jit * 0.4), q, V3(1, 1, 1)); im.setMatrixAt(k, m4); y += kd.h * (1.0 + rr() * 0.08); }
        scene.add(im); return { x, z, top: y };
      });
      const key = K.keySpot(scene, { color: 0xfff0dc, intensity: 12000, pos: [-14, 24, 2], target: [0, 2, -1.5], angle: 0.42, penumbra: 0.9, shadow: 2048 });
      K.lightShaft(scene, { pos: [-14, 24, 2], target: [0, 0, -1.5], radius: 10, intensity: 0.04 });
      scene.add(new THREE.HemisphereLight(0x405070, 0x050505, 0.3));
      const tags = piles.map((pl, i) => ({ el: K.div(layer, MONO, `<span style="color:#8f897d">0${i + 1} · </span>${names[i]}`), line: K.div(layer, 'width:1px;background:#d6cfbf;opacity:0', ''), t0: wt(shot, words[i]) - 0.05, pl }));
      const move = C.path([{ pos: [-11, 1.0, 13], look: [-5, 4.5, -1], mm: 28 }, { pos: [0, 1.4, 15.5], look: [0, 5, -1], mm: 28 }, { pos: [11, 1.0, 13], look: [5, 4.5, -1], mm: 28 }], { accel: 0.25, decel: 0.35, float: 0.02 });
      out.update = (t, p) => {
        motes.update(t); move(camera, p, t);
        tags.forEach(({ el, line, t0, pl }) => { const k = K.range(t, t0, t0 + 0.35); const [x, y] = toScr([pl.x, pl.top + 0.5, pl.z], camera);
          place(el, x, y, -60, -70); el.style.opacity = k; el.style.clipPath = `inset(0 ${100 - k * 100}% 0 0)`;
          place(line, x, y, -60, -40); line.style.height = `${40 * sc() * k}px`; line.style.opacity = k * 0.7; });
      };
      return out;
    }

    if (mode === 'link') {
      // a name, then a phone, a bank account and a car; the camera rides each link as it's spoken
      const words = P0.words ?? ['name', 'phone', 'bank', 'car'];
      const nodes = [
        { p: V3(0, 0, 0), lines: ['DOE, J.', 'DOB ██/██/19██', 'SRC · DMV RECORDS'], title: 'NAME' },
        { p: V3(9, 2.4, -7), lines: ['+1 504 555 0148', 'CARRIER · 3 SUBSCRIBERS', 'SRC · PHONE RECORDS'], title: 'PHONE' },
        { p: V3(17, -1.2, -1), lines: ['ACCT ••••7731', 'WIRE IN · $9,850', 'SRC · BANK TRANSFERS'], title: 'BANK ACCOUNT' },
        { p: V3(25, 1.8, -9), lines: ['PLATE 7KX 391', 'CAM 14 · 23:41', 'SRC · LICENCE PLATES'], title: 'VEHICLE' },
      ];
      const world = clusterWorld({ n: 9, per: 400, spread: 40, seed: 12 });
      world.pts.forEach(q => q.add(V3(12, -2, -12)));
      const pts = glowPoints(ctx, world.pts.length, { fog: 0.02 }); scene.add(pts); drawCloud(world, pts, { size: 0.12, var: 0.35 });
      // one atlas for all four cards (separate canvas textures were swapped on llvmpipe after a few frames)
      const cardImgs = nodes.map(n => cardTex(n.lines, { w: 640, h: 380, title: n.title, accent: '#ffa860', font: 40, border: 'rgba(255,168,96,.55)' }).image);
      const atlas = canvasTex(640, 380 * 4, (x) => cardImgs.forEach((im, i) => x.drawImage(im, 0, i * 380)));
      const panels = nodes.map((n, i) => {
        const g = new THREE.PlaneGeometry(3.2, 1.9); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setY(k, (3 - i + uv.getY(k)) / 4);
        const m = mesh(g, new THREE.MeshBasicMaterial({ map: atlas, transparent: true, side: THREE.DoubleSide }), n.p.toArray(), scene);
        m.rotation.y = -0.35 + (i % 2) * 0.2; m.castShadow = false;
        const dot = glowPoints(ctx, 1, { fog: 0.01 }); dot.set(0, n.p.clone().add(V3(-1.75, -0.95, 0).applyEuler(m.rotation)).toArray(), SOD.map(v => v * 1.5), 0.4); dot.commit(); scene.add(dot);
        n.anchor = n.p.clone().add(V3(-1.75, -0.95, 0).applyEuler(m.rotation)); n.anchorR = n.p.clone().add(V3(1.62, 0.95, 0).applyEuler(m.rotation));
        return m;
      });
      const links = nodes.slice(1).map(() => beam(scene, SODIUM, 0.012, { halo: 3.5, haloA: 0.18 }));
      const times = words.map((w, i) => wt(shot, w, 0));
      const view = (i) => { const p = nodes[i].p, q = nodes[Math.min(i + 1, nodes.length - 1)].p; return { pos: [p.x - 1.5, p.y + 1.2, p.z + 10.5], look: [K.lerp(p.x, q.x, 0.35) + 0.5, K.lerp(p.y, q.y, 0.25), K.lerp(p.z, q.z, 0.25)], mm: 35 }; };
      const keys = nodes.map((_, i) => view(i)); keys.unshift({ pos: [-2.5, 1.5, 11], look: [0, 0, 0], mm: 35 });
      const legs = [[0, Math.max(0.5, times[0] + 0.4)], ...nodes.slice(1).map((_, i) => [times[i + 1] - 0.35, times[i + 1] + 1.0])];
      const cam = stations(keys, legs);
      out.update = (t, p) => {
        motes.update(t); cam(camera, t, 0.02);
        panels.forEach((m, i) => { const k = K.range(t, times[i] - 0.4, times[i] + 0.2); m.material.opacity = 0.15 + 0.85 * k; });
        links.forEach((ln, i) => ln.set(nodes[i].anchorR, nodes[i + 1].anchor, K.inOut(K.range(t, times[i + 1] - 0.4, times[i + 1] + 0.5))));
      };
      return out;
    }

    if (mode === 'person') {
      // the linked fragments converge into a person; where they go, who they know, what they might do next
      const n = 2400; const hp = humanPoints(n, 5, 4.2);
      const start = hp.map(() => V3(gauss(r) * 9, 2 + gauss(r) * 6, gauss(r) * 9));
      const pts = glowPoints(ctx, n, { fog: 0.02 }); scene.add(pts);
      const ed = knnEdges(hp, 2, 0.35, 0.35); const lines = glowLines(ed.length, { fog: 0.02, gain: 0 }); scene.add(lines);
      const delay = hp.map(() => r());
      const tLink = tw(shot, 'linked', T * 0.25), tWhere = tw(shot, 'where', T * 0.55), tWho = tw(shot, 'who', T * 0.68), tWhat = tw(shot, 'what', T * 0.8);
      // anchors: feet, hand, head
      const by = (f) => hp.reduce((a, q) => f(q) > f(a) ? q : a, hp[0]);
      const anchors = [by(q => -q.y + Math.abs(q.x) * 0.2), by(q => q.x - Math.abs(q.y - 2.2) * 0.5), by(q => q.y)];
      const notes = [['WHERE THEY GO', tWhere, [-260, 10]], ['WHO THEY KNOW', tWho, [90, -10]], ['WHAT THEY MIGHT DO NEXT', tWhat, [90, -40]]].map(([txt, t0, off]) => ({ el: K.div(layer, MONO, txt), svgLine: null, t0, off }));
      const svg = K.svgLayer(layer); notes.forEach(nn => { nn.svgLine = svg.make('polyline', { fill: 'none', stroke: '#d6cfbf', 'stroke-width': 1.2, opacity: 0 }); nn.dot = svg.make('circle', { r: 3.5, fill: '#ffa860', opacity: 0 }); });
      const pos = hp.map(() => V3());
      const move = C.path([{ pos: [6, 3.2, 19], look: [0.4, 2.1, 0], mm: 35 }, { pos: [3, 2.6, 16.5], look: [0.5, 2.1, 0], mm: 38 }, { pos: [-0.5, 2.4, 13.2], look: [0.6, 2.1, 0], mm: 40 }], { accel: 0.3, decel: 0.5, float: 0.02 });
      out.update = (t, p) => {
        motes.update(t); move(camera, p, t);
        for (let i = 0; i < n; i++) {
          const k = K.inOut(K.range(t, tLink - 0.8 + delay[i] * 0.9, tLink + 0.6 + delay[i] * 1.0)); const drift = (1 - k) * 0.6;
          pos[i].lerpVectors(start[i], hp[i], k); pos[i].x += Math.sin(t * 0.4 + i) * drift; pos[i].y += Math.cos(t * 0.3 + i * 1.3) * drift;
          const c = k > 0.98 ? (i % 23 === 0 ? SOD : COOL) : COOL; const br = 0.45 + 0.5 * k;
          pts.set(i, pos[i].toArray(), [c[0] * br * 1.3, c[1] * br * 1.3, c[2] * br * 1.3], 0.055 + (1 - k) * 0.07);
        }
        pts.commit();
        ed.forEach(([i, j], e) => lines.seg(e, pos[i].toArray(), pos[j].toArray(), COOL)); lines.commit();
        lines.material.uniforms.uGain.value = 0.55 * K.range(t, tLink + 0.4, tLink + 1.8);
        notes.forEach((nn, i) => { const k = K.range(t, nn.t0 - 0.1, nn.t0 + 0.45); const [x, y] = toScr(anchors[i], camera); const lx = x + nn.off[0], ly = y + nn.off[1];
          nn.svgLine.setAttribute('points', `${x},${y} ${K.lerp(x, lx, K.outCubic(k))},${K.lerp(y, ly, K.outCubic(k))}`); nn.svgLine.setAttribute('opacity', k > 0 ? 0.8 : 0);
          nn.dot.setAttribute('cx', x); nn.dot.setAttribute('cy', y); nn.dot.setAttribute('opacity', k > 0 ? 1 : 0);
          place(nn.el, lx + (nn.off[0] < 0 ? -nn.el.offsetWidth / sc() - 10 : 10), ly - 14); nn.el.style.opacity = K.range(k, 0.4, 1); });
      };
      return out;
    }

    if (mode === 'map') {
      // pull back from one person to a city-scale graph
      const n = 16000; const rr = K.rng(44); const hoods = Array.from({ length: 26 }, () => [gauss(rr) * 70, gauss(rr) * 70, 4 + rr() * 10]);
      // each neighbourhood is a rotated street grid: nodes sit along blocks, so the graph reads as a city
      hoods.forEach(h => h.push(rr() * Math.PI));
      const city = []; for (let i = 0; i < n; i++) { const h = hoods[Math.floor(rr() * hoods.length)]; let a = gauss(rr) * h[2], c = gauss(rr) * h[2];
        if (rr() < 0.5) a = Math.round(a / 3.2) * 3.2 + (rr() - 0.5) * 0.25; else c = Math.round(c / 3.2) * 3.2 + (rr() - 0.5) * 0.25;
        city.push(V3(h[0] + a * Math.cos(h[3]) - c * Math.sin(h[3]), 0, h[1] + a * Math.sin(h[3]) + c * Math.cos(h[3]))); }
      city[0].set(0, 0, 0);
      const pts = glowPoints(ctx, n, { fog: 0.0035, minPx: 1.4 }); scene.add(pts);
      city.forEach((q, i) => { const s = rr(); const c = s > 0.97 ? SOD : COOL; const br = 0.3 + rr() * 0.6; pts.set(i, q.toArray(), [c[0] * br, c[1] * br, c[2] * br], 0.18 + s * 0.2); }); pts.commit();
      const ed = knnEdges(city, 2, 3.2, 3.2); const lines = glowLines(ed.length, { fog: 0.0035, gain: 0.3 }); scene.add(lines);
      ed.forEach(([i, j], k) => lines.seg(k, city[i].toArray(), city[j].toArray(), COOL)); lines.commit();
      const person = humanPoints(900, 9, 1.8); const pp = glowPoints(ctx, person.length, { fog: 0.003 }); scene.add(pp);
      person.forEach((q, i) => pp.set(i, q.toArray(), SOD.map(v => v * 1.2), 0.045)); pp.commit();
      const ped = knnEdges(person, 2, 0.16, 0.16); const pl = glowLines(ped.length, { fog: 0.003, gain: 0.5 }); scene.add(pl); ped.forEach(([i, j], k) => pl.seg(k, person[i].toArray(), person[j].toArray(), SOD)); pl.commit();
      // spokes are cut into short segments: one long line across the frame rasterises badly on llvmpipe
      const SUB = 32, spokes = glowLines(40 * SUB, { fog: 0.003, gain: 0.6 }); scene.add(spokes); const sa = V3(0, 0.9, 0), sb = V3(), c0 = new THREE.Color(), c1 = new THREE.Color(SODIUM), c2 = new THREE.Color(0x9fc4ff);
      for (let i = 0; i < 40; i++) { const q = city[1 + Math.floor(rr() * 3000)]; for (let k = 0; k < SUB; k++) { const u0 = k / SUB, u1 = (k + 1) / SUB; spokes.seg(i * SUB + k, sa.clone().lerp(q, u0).toArray(), sb.copy(sa).lerp(q, u1).toArray(), c0.copy(c1).lerp(c2, u0).toArray(), c0.copy(c1).lerp(c2, u1).toArray()); } } spokes.commit();
      motes.visible = false;
      const move = C.path([{ pos: [0.6, 1.2, 4.2], look: [0, 1.0, 0], mm: 40 }, { pos: [3, 9, 18], look: [0, 0.6, 0], mm: 32 }, { pos: [14, 70, 80], look: [0, 0, -4], mm: 28 }, { pos: [18, 115, 112], look: [0, 0, -8], mm: 26 }], { accel: 0.3, decel: 0.45, float: 0.01 });
      out.update = (t, p) => { move(camera, p, t); spokes.material.uniforms.uGain.value = 0.6 * K.range(p, 0.15, 0.4); };
      return out;
    }

    if (mode === 'shooters') {
      // a social network of anonymous figures; some tagged "might pull a trigger", some "might be on the other end"
      const n = 130; const rr = K.rng(61); const comms = Array.from({ length: 6 }, (_, i) => V3(Math.cos(i * 1.05) * 5.5 + gauss(rr) * 1.5, 0, Math.sin(i * 1.05) * 4 + gauss(rr) * 1.5));
      const nodes = []; for (let i = 0; i < n; i++) { const c = comms[i % comms.length]; nodes.push(V3(c.x + gauss(rr) * 1.6, 0, c.z + gauss(rr) * 1.6)); }
      let ed = knnEdges(nodes, 3, 3.2, 3.2); for (let i = 0; i < 14; i++) ed.push([Math.floor(rr() * n), Math.floor(rr() * n)]);
      const floor = mesh(new THREE.PlaneGeometry(200, 200), std(0x0b0c0e, { roughness: 0.4, metalness: 0.3 }), [0, 0, 0], scene); floor.rotation.x = -Math.PI / 2;
      scene.fog = new THREE.FogExp2(0x020305, 0.035);
      const lines = glowLines(ed.length, { fog: 0.02, gain: 0.7 }); scene.add(lines);
      const trig = [3, 40, 77, 101], other = [16, 58, 89, 112, 27];
      const texN = bustTex({ fill: '#262c35', rim: '#a9b6c8', lw: 8 }), texT = bustTex({ fill: '#2a1608', rim: '#ffa860', lw: 10 }), texO = bustTex({ fill: '#121a26', rim: '#cfe0ff', lw: 10 });
      const mk = (tex, count) => { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.62, 0.78).translate(0, 0.39, 0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, color: 0xffffff }), count); im.frustumCulled = false; scene.add(im); return im; };
      const plain = mk(texN, n), hotT = mk(texT, trig.length), hotO = mk(texO, other.length);
      const ringGeo = new THREE.RingGeometry(0.42, 0.47, 48).rotateX(-Math.PI / 2);
      const rings = [...trig.map(i => [i, SODIUM]), ...other.map(i => [i, 0xcfe0ff])].map(([i, c]) => { const m = mesh(ringGeo, new THREE.MeshBasicMaterial({ color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), [nodes[i].x, 0.02, nodes[i].z], scene); return { m, i }; });
      const base0 = glowPoints(ctx, n, { fog: 0.02 }); scene.add(base0); nodes.forEach((q, i) => base0.set(i, [q.x, 0.03, q.z], COOL.map(v => v * 0.5), 0.6)); base0.commit();
      const key = K.keySpot(scene, { color: 0x9fb4d8, intensity: 5000, pos: [0, 20, 6], target: [0, 0, 0], angle: 0.6, penumbra: 1, shadow: 0 });
      const tT = T * 0.38, tO = T * 0.62;
      const lbl = [[trig[0], 'MIGHT PULL A TRIGGER', '#ffa860', tT], [other[1], 'MIGHT BE ON THE OTHER END', '#cfe0ff', tO]]
        .map(([i, txt, c, t0]) => ({ i, t0, el: K.div(layer, `${MONO};color:${c}`, txt) }));
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V3(1, 1, 1);
      const move = C.path([{ pos: [-10, 8.5, 12], look: [0, 0, -1.8], mm: 35 }, { pos: [-3, 7.8, 13], look: [0.5, 0, -1.8], mm: 37 }, { pos: [4.5, 7.2, 11.5], look: [1, 0.2, -2.0], mm: 40 }], { accel: 0.3, decel: 0.45, float: 0.02 });
      out.update = (t, p) => {
        motes.update(t); move(camera, p, t); camera.updateMatrixWorld();
        const kE = K.range(t, 0.1, T * 0.33);
        ed.forEach(([i, j], e) => { const kk = K.range(kE * ed.length - e * 0.9, 0, 1); const a = nodes[i], bb = nodes[j]; lines.seg(e, [a.x, 0.05, a.z], [K.lerp(a.x, bb.x, kk), 0.05, K.lerp(a.z, bb.z, kk)], kk > 0 ? COOL : [0, 0, 0]); }); lines.commit();
        const yaw = Math.atan2(camera.position.x, camera.position.z);
        const put = (im, idx, list, t0) => list.forEach((ni, k) => { const on = t0 == null ? 1 : K.outCubic(K.range(t, t0 + k * 0.15, t0 + k * 0.15 + 0.4)); const nn = nodes[ni];
          const yy = Math.atan2(camera.position.x - nn.x, camera.position.z - nn.z); q.setFromEuler(new THREE.Euler(0, yy, 0)); m4.compose(V3(nn.x, 0, nn.z + 0.01), q, V3(on, on, on)); im.setMatrixAt(k, m4); });
        put(plain, 0, nodes.map((_, i) => i)); put(hotT, 0, trig, tT); put(hotO, 0, other, tO);
        plain.instanceMatrix.needsUpdate = hotT.instanceMatrix.needsUpdate = hotO.instanceMatrix.needsUpdate = true;
        rings.forEach(({ m, i }) => { const t0 = trig.includes(i) ? tT + trig.indexOf(i) * 0.15 : tO + other.indexOf(i) * 0.15; const k = K.outCubic(K.range(t, t0, t0 + 0.5)); m.scale.setScalar(0.4 + k * 0.6); m.material.opacity = k; });
        lbl.forEach(({ i, t0, el }) => { const [x, y] = toScr([nodes[i].x, 0.95, nodes[i].z], camera); place(el, x, y, 22, -12); const k = K.range(t, t0, t0 + 0.4); el.style.opacity = k; el.style.clipPath = `inset(0 ${100 - k * 100}% 0 0)`; });
      };
      return out;
    }

    if (mode === 'connects') {
      // one bright node; lines shoot out to every cluster
      const world = clusterWorld({ n: 14, per: 380, spread: 34, seed: 71, ring: true });
      world.centers.forEach(c => c.y -= 6); world.pts.forEach(q => q.y -= 6);
      const pts = glowPoints(ctx, world.pts.length, { fog: 0.012 }); scene.add(pts); drawCloud(world, pts, { size: 0.15, var: 0.3 });
      const base1 = Float32Array.from(pts.col);
      const ed = knnEdges(world.pts, 2, 2.4, 2.4).filter(([i, j]) => world.owner[i] === world.owner[j]).slice(0, 4000);
      const lines = glowLines(ed.length, { fog: 0.012, gain: 0.25 }); scene.add(lines); ed.forEach(([i, j], k) => lines.seg(k, world.pts[i].toArray(), world.pts[j].toArray(), COOL)); lines.commit();
      const core = glowPoints(ctx, 2, { fog: 0.003 }); scene.add(core);
      const beams = world.centers.map(() => beam(scene, SODIUM, 0.045, { halo: 4, haloA: 0.18 }));
      const order = world.centers.map((_, i) => i); const rr = K.rng(5); order.sort(() => rr() - 0.5);
      const tS = 0.5, tE = Math.max(tS + 2, T * 0.7); const arrive = world.centers.map((_, i) => tS + order.indexOf(i) * (tE - tS) / world.centers.length);
      const move = C.path([{ pos: [0, 10, 78], look: [0, 0, 0], mm: 28 }, { pos: [30, 14, 58], look: [0, 0, 0], mm: 28 }, { pos: [46, 8, 26], look: [0, 0, 0], mm: 30 }], { accel: 0.3, decel: 0.4, float: 0.04 });
      out.update = (t, p) => {
        motes.update(t); move(camera, p, t);
        const pulse = 1 + 0.15 * Math.sin(t * 3);
        core.set(0, [0, 0, 0], WHITE.map(v => v * 2.4), 1.2 * pulse); core.set(1, [0, 0, 0], SOD.map(v => v * 0.6), 6 * pulse); core.commit();
        const lit = world.centers.map((_, i) => K.range(t, arrive[i] + 0.35, arrive[i] + 1.1));
        for (let i = 0; i < world.pts.length; i++) { const l = 1 + lit[world.owner[i]] * 1.3; pts.col[i * 3] = base1[i * 3] * l + lit[world.owner[i]] * 0.12; pts.col[i * 3 + 1] = base1[i * 3 + 1] * l; pts.col[i * 3 + 2] = base1[i * 3 + 2] * l; }
        pts.geometry.attributes.aCol.needsUpdate = true;
        beams.forEach((bm, i) => bm.set(V3(0, 0, 0), world.centers[i], K.outCubic(K.range(t, arrive[i], arrive[i] + 0.55))));
      };
      return out;
    }

    if (mode === 'choose') {
      // three linked people highlight in turn; a red marker loop chooses one
      const world = clusterWorld({ n: 10, per: 260, spread: 30, seed: 90 }); world.pts.forEach(q => q.add(V3(0, -2, -22)));
      const pts = glowPoints(ctx, world.pts.length, { fog: 0.03 }); scene.add(pts); drawCloud(world, pts, { size: 0.12, var: 0.3 });
      const people = [V3(-4.2, 1.2, 0), V3(0, 2.1, -1.5), V3(4.3, 0.9, 0.4)];
      const ids = ['SUBJ-0217', 'SUBJ-0881', 'SUBJ-0462'];
      const discs = people.map((pp, i) => {
        const g = new THREE.Group(); g.position.copy(pp); scene.add(g);
        const tex = canvasTex(512, 640, (x, w, h) => { x.fillStyle = '#0a0d12'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(159,196,255,.6)'; x.lineWidth = 4; x.strokeRect(8, 8, w - 16, h - 16);
          const bt = bustTex({ fill: '#1a1f27', rim: '#7d8ba0', lw: 6 }).image; x.drawImage(bt, 96, 60, 320, 400); x.fillStyle = '#cfd8e6'; x.font = '500 34px "Plex Mono"'; x.fillText(ids[i], 40, 530); x.fillStyle = '#5d6876'; x.font = '400 26px "Plex Mono"'; x.fillText(`LINKS ${[14, 31, 9][i]} · SCORE —`, 40, 580); });
        const card = mesh(new THREE.PlaneGeometry(2.4, 3.0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: 0x777777 }), [0, 0, 0], g); card.castShadow = false;
        return { g, card };
      });
      const links = [[0, 1], [1, 2], [0, 2]].map(([a, c]) => ({ a, c, bm: beam(scene, 0x9fc4ff, 0.012, { halo: 3, haloA: 0.12 }) }));
      const hi = [T * 0.18, T * 0.36, T * 0.54], chosen = 1, tLoop = T * 0.7;
      const svg = K.svgLayer(layer);
      const move = C.path([{ pos: [-1.5, 1.8, 17], look: [0, 1.85, 0], mm: 40 }, { pos: [0.4, 2.0, 15], look: [0.1, 1.95, -0.5], mm: 42 }], { accel: 0.3, decel: 0.5, float: 0.015 });
      // the loop is shaped once, from the camera pose at the moment it is drawn, then tracked
      move(camera, tLoop / T, tLoop); const [lx0, ly0] = toScr(people[chosen], camera); const [lx2, ly2] = toScr(people[chosen].clone().add(V3(1.2, 1.5, 0)), camera);
      const loop = K.markerLoop(svg, { cx: lx0, cy: ly0, rx: Math.abs(lx2 - lx0) * 1.35, ry: Math.abs(ly2 - ly0) * 1.25, seed: 7 });
      out.update = (t, p) => {
        motes.update(t); move(camera, p, t); camera.updateMatrixWorld();
        links.forEach(({ a, c, bm }) => { bm.set(people[a].clone().setZ(people[a].z - 0.3), people[c].clone().setZ(people[c].z - 0.3), 1); bm.fade(0.6); });
        discs.forEach(({ card }, i) => { const on = Math.max(K.range(t, hi[i], hi[i] + 0.3) * (1 - K.range(t, hi[i] + 0.9, hi[i] + 1.3)), i === chosen ? K.range(t, tLoop - 0.3, tLoop) : 0);
          const v = 0.42 + 0.58 * on; card.material.color.setRGB(v, v, v); });
        const [x, y] = toScr(people[chosen], camera); loop.setAttribute('transform', `translate(${x - lx0},${y - ly0})`);
        loop.draw(K.inOut(K.range(t, tLoop, tLoop + 0.8)));
      };
      return out;
    }
    throw new Error(`[ops] graph: unknown mode ${mode}`);
  }

  // ---------------------------------------------------------------- shared props
  // 2D value noise (deterministic), for terrain, screens and satellite plates
  const hash2 = (x, y, s) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
  const vnoise = (x, y, s = 0) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return K.lerp(K.lerp(hash2(xi, yi, s), hash2(xi + 1, yi, s), u), K.lerp(hash2(xi, yi + 1, s), hash2(xi + 1, yi + 1, s), u), v); };
  const fbm = (x, y, s = 0, o = 5) => { let a = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { t += a * vnoise(x * f, y * f, s + i * 17); f *= 2.03; a *= 0.5; } return t; };
  const matte = () => new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.88, metalness: 0.05 });
  // an operator: UAL mannequin in matte near-black, or a block silhouette if it isn't available
  function operator(scene, { clip = 'Sitting_Idle_Loop', phase = 0, pos = [0, 0, 0], rotY = 0, scale = 1 } = {}) {
    if (UAL_OK) { const ch = C.character('UAL', { clip, material: matte(), phase, scale }); ch.root.position.set(...pos); ch.root.rotation.y = rotY; scene.add(ch.root); return ch; }
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; scene.add(g); const m = matte(); const sit = clip.startsWith('Sit');
    mesh(new THREE.CapsuleGeometry(0.2, sit ? 0.45 : 0.6, 4, 12), m, [0, sit ? 0.95 : 1.25, 0], g); mesh(new THREE.SphereGeometry(0.12, 16, 12), m, [0, sit ? 1.45 : 1.7, 0], g);
    return { root: g, update() {} };
  }
  // screen textures for the war room
  const SCR = {
    sat: (seed = 1) => canvasTex(512, 288, (x, w, h) => { const im = x.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const n = fbm(i / 60, j / 60, seed); const v = 60 + n * 130 + (hash2(i, j, seed) - 0.5) * 18; const o = (j * w + i) * 4; im.data[o] = v * 0.95; im.data[o + 1] = v * 0.93; im.data[o + 2] = v * 0.85; im.data[o + 3] = 255; } x.putImageData(im, 0, 0);
      x.strokeStyle = 'rgba(230,230,220,.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, h * 0.62); x.bezierCurveTo(w * 0.3, h * 0.5, w * 0.6, h * 0.8, w, h * 0.55); x.stroke();
      x.strokeStyle = 'rgba(159,196,255,.8)'; x.lineWidth = 1.5; x.strokeRect(w * 0.55, h * 0.36, 44, 30); x.beginPath(); x.moveTo(w / 2, h / 2 - 16); x.lineTo(w / 2, h / 2 + 16); x.moveTo(w / 2 - 16, h / 2); x.lineTo(w / 2 + 16, h / 2); x.stroke();
      x.fillStyle = '#cfd8e6'; x.font = '400 13px "Plex Mono"'; x.fillText(`EO-${seed}4 · 0.31 M GSD`, 10, 18); }),
    map: (seed = 2) => canvasTex(512, 288, (x, w, h) => { x.fillStyle = '#06101c'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(80,120,170,.25)'; x.lineWidth = 1; for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let j = 0; j < h; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
      x.strokeStyle = 'rgba(159,196,255,.75)'; x.lineWidth = 1.6; x.beginPath(); for (let i = 0; i <= 80; i++) { const u = i / 80; const y = h * (0.35 + 0.25 * fbm(u * 3, 0, seed)); i ? x.lineTo(u * w, y) : x.moveTo(0, y); } x.stroke();
      const r = K.rng(seed); for (let i = 0; i < 26; i++) { x.fillStyle = r() < 0.15 ? '#ffa860' : '#9fc4ff'; x.beginPath(); x.arc(r() * w, h * 0.45 + r() * h * 0.5, 2.5, 0, 7); x.fill(); } }),
    thermal: (seed = 3) => canvasTex(512, 288, (x, w, h) => { const im = x.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = 30 + fbm(i / 80, j / 80, seed) * 70; const o = (j * w + i) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = v; im.data[o + 3] = 255; } x.putImageData(im, 0, 0);
      const r = K.rng(seed); for (let i = 0; i < 5; i++) { const cx = r() * w, cy = r() * h; const g = x.createRadialGradient(cx, cy, 0, cx, cy, 10); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - 12, cy - 12, 24, 24); }
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; x.strokeRect(w / 2 - 50, h / 2 - 30, 100, 60); }),
    graph: (seed = 4) => canvasTex(512, 288, (x, w, h) => { x.fillStyle = '#04070d'; x.fillRect(0, 0, w, h); const r = K.rng(seed); const P = Array.from({ length: 70 }, () => [w / 2 + (r() + r() - 1) * w * 0.48, h / 2 + (r() + r() - 1) * h * 0.46]);
      x.strokeStyle = 'rgba(159,196,255,.35)'; x.lineWidth = 1; P.forEach((p, i) => { const q = P[(i * 7 + 3) % P.length], s = P[(i * 13 + 5) % P.length]; x.beginPath(); x.moveTo(...p); x.lineTo(...q); x.lineTo(...s); x.stroke(); });
      P.forEach((p, i) => { x.fillStyle = i % 11 === 0 ? '#ffa860' : '#cfe0ff'; x.beginPath(); x.arc(p[0], p[1], i % 11 === 0 ? 4.5 : 2.4, 0, 7); x.fill(); }); }),
    table: (seed = 5) => canvasTex(512, 288, (x, w, h) => { x.fillStyle = '#060a10'; x.fillRect(0, 0, w, h); const r = K.rng(seed); x.font = '400 13px "Plex Mono"'; for (let i = 0; i < 15; i++) { x.fillStyle = i === 0 ? '#9fc4ff' : i % 5 === 3 ? '#ffa860' : '#7d8a9b'; x.fillText(i === 0 ? 'TRACK   CLASS   CONF   AGE' : `T-${String(Math.floor(r() * 9000) + 1000)}   ${['VEH', 'STRUCT', 'VESSEL', 'EMIT'][Math.floor(r() * 4)]}   0.${Math.floor(r() * 90 + 10)}   ${Math.floor(r() * 59)}s`, 16, 26 + i * 17.5); } }),
    por: () => canvasTex(1024, 576, (x, w, h) => { x.fillStyle = '#050a12'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(159,196,255,.35)'; x.lineWidth = 2; x.strokeRect(24, 24, w - 48, h - 48);
      x.fillStyle = '#8fa3bd'; x.font = '500 26px "Plex Mono"'; x.fillText('STATUS', 70, 200); x.fillStyle = '#eef3fa'; x.font = '500 64px "Plex Mono"'; x.fillText('PROGRAM OF RECORD', 70, 290);
      x.fillStyle = '#ffa860'; x.fillRect(70, 330, 120, 4); x.fillStyle = '#5d6876'; x.font = '400 22px "Plex Mono"'; x.fillText('FUNDED · ENDURING · ENTERPRISE', 70, 380); }),
  };

  // ================================================================ SILOS
  function silos(ctx, shot) {
    const P0 = shot.params; const mode = P0.mode ?? 'walls'; const T = shot.duration;
    const nhs = mode === 'nhs'; const fogC = nhs ? 0x03060a : 0x030303;
    const b = base(ctx, { floor: nhs ? 0x15181c : 0x121212, fog: fogC, density: nhs ? 0.04 : 0.03, fov: 30 });
    const { scene, camera, layer } = b; const r = K.rng(33);
    b.ground.material.roughness = 0.4; b.ground.material.metalness = 0.12; const gr = K.grimeTexture(5, 150); gr.repeat.set(40, 40); b.ground.material.roughnessMap = gr;
    const LIGHT = nhs ? 0xe4eeff : 0xfff0dc;
    C.sky(scene, 'moonless_golf', { background: false, intensity: nhs ? 0.1 : 0.14 });
    const glass = new THREE.MeshStandardMaterial({ color: nhs ? 0xa8c4dc : 0x9fb0b8, roughness: 0.05, metalness: nhs ? 0.1 : 0.3, transparent: true, opacity: nhs ? 0.12 : 0.16, depthWrite: false, side: THREE.DoubleSide });
    const frameM = std(0x2a2d31, { metalness: 0.7, roughness: 0.4 });
    const steel = std(nhs ? 0x8d949c : 0x5c5f63, { metalness: 0.5, roughness: 0.5 });
    const W = 4.6, Dp = 3.8, Hh = 3.0;
    const contents = {
      cabinets(g) { for (let i = 0; i < 4; i++) { const c = new THREE.Group(); c.position.set(-1.5 + i * 1.0, 0, -1.2); g.add(c); mesh(new THREE.BoxGeometry(0.85, 1.6, 0.8), steel, [0, 0.8, 0], c);
        for (let k = 0; k < 4; k++) { mesh(new THREE.BoxGeometry(0.78, 0.36, 0.02), std(0x6e7176, { metalness: 0.6, roughness: 0.4 }), [0, 0.22 + k * 0.39, 0.41], c); mesh(new THREE.BoxGeometry(0.22, 0.03, 0.04), std(0xb0b4b8, { metalness: 1, roughness: 0.2 }), [0, 0.3 + k * 0.39, 0.44], c); } }
        const box = mesh(new THREE.BoxGeometry(0.6, 0.35, 0.45), std(0xb9a27a, { roughness: 0.9 }), [1.2, 0.18, 0.5], g); box.rotation.y = 0.4; },
      racks(g) { const ledM = new THREE.MeshBasicMaterial({ color: FLUO }); for (let i = 0; i < 2; i++) { const x = -0.8 + i * 1.6; mesh(new THREE.BoxGeometry(0.9, 2.2, 1.0), std(0x0e0f11, { metalness: 0.6, roughness: 0.35 }), [x, 1.1, -1.0], g);
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.02, 0.01), ledM, 60); const m4 = new THREE.Matrix4(); for (let k = 0; k < 60; k++) { m4.makeTranslation(x - 0.35 + (k % 6) * 0.05, 0.3 + Math.floor(k / 6) * 0.19, -0.49); im.setMatrixAt(k, m4); } g.add(im); } },
      paper(g) { const pm = std(0xe8e1d0, { roughness: 0.95 }); mesh(new THREE.BoxGeometry(2.6, 0.06, 1.2), std(0x3a2a1c, { roughness: 0.6 }), [0, 0.78, -0.6], g); for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.6, 0.75, 0.6), std(0x2a1c12), [-1.1 + i * 0.73, 0.38, -0.6], g);
        for (let i = 0; i < 7; i++) { const h = 0.15 + r() * 0.5; const m = mesh(new THREE.BoxGeometry(0.42, h, 0.3), pm, [-1.1 + i * 0.36, 0.81 + h / 2, -0.6 + (r() - 0.5) * 0.4], g); m.rotation.y = (r() - 0.5) * 0.3; } },
      tape(g) { for (let i = 0; i < 2; i++) { const x = -0.8 + i * 1.6; mesh(new THREE.BoxGeometry(1.1, 2.0, 0.6), std(0xb8b2a2, { roughness: 0.6 }), [x, 1.0, -1.1], g);
        for (const y of [1.45, 0.95]) { const reel = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 40), std(0x2a2a2a, { metalness: 0.6, roughness: 0.3 }), [x, y, -0.78], g); reel.rotation.x = Math.PI / 2; reel.name = 'reel'; } } },
      screens(g) { mesh(new THREE.BoxGeometry(2.8, 0.06, 1.0), std(0x1a1a1c, { roughness: 0.5 }), [0, 0.76, -0.7], g); const tx = [SCR.table(9), SCR.map(7), SCR.thermal(5)];
        for (let i = 0; i < 3; i++) { const m = mesh(new THREE.PlaneGeometry(0.85, 0.5), new THREE.MeshBasicMaterial({ map: tx[i] }), [-0.9 + i * 0.9, 1.15, -0.95], g); m.rotation.y = (1 - i) * 0.25; }
        const l = new THREE.PointLight(0x9fc4ff, 2.5, 4, 2); l.position.set(0, 1.2, -0.4); g.add(l); },
      cards(g) { const wood = std(0x5a3a22, { roughness: 0.55 }); for (let i = 0; i < 2; i++) { const x = -0.7 + i * 1.4; mesh(new THREE.BoxGeometry(1.2, 1.5, 0.6), wood, [x, 0.75, -1.0], g);
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.12, 0.02), std(0x7a5232, { roughness: 0.5 }), 36); const m4 = new THREE.Matrix4(); for (let k = 0; k < 36; k++) { m4.makeTranslation(x - 0.5 + (k % 6) * 0.2, 0.2 + Math.floor(k / 6) * 0.22, -0.69); im.setMatrixAt(k, m4); } g.add(im); }
        for (let i = 0; i < 9; i++) { const c = mesh(new THREE.BoxGeometry(0.2, 0.004, 0.13), std(0xf0ead8), [-0.2 + (r() - 0.5) * 1.5, 0.002, 0.3 + (r() - 0.5) * 0.8], g); c.rotation.y = r() * 3; } },
      records(g) { const cols = [0x3b6fa8, 0xc8b36a, 0x9a3a32, 0x4f8a5a, 0xd9d2c3]; for (let s = 0; s < 2; s++) { const x = -1.0 + s * 2.0; mesh(new THREE.BoxGeometry(1.5, 2.3, 0.5), std(0xb9bfc6, { metalness: 0.4, roughness: 0.5 }), [x, 1.15, -1.15], g);
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.3, 0.36), std(0xffffff, { roughness: 0.85 }), 5 * 34); const m4 = new THREE.Matrix4(), c = new THREE.Color(); let k = 0;
        for (let sh = 0; sh < 5; sh++) for (let i = 0; i < 34; i++) { m4.makeTranslation(x - 0.64 + i * 0.039, 0.32 + sh * 0.44, -0.9); im.setMatrixAt(k, m4); im.setColorAt(k, c.set(cols[Math.floor(r() * cols.length)]).multiplyScalar(0.7 + r() * 0.3)); k++; } g.add(im); } },
    };
    const realLights = [];
    function room(x, z, label, kind, { light = true, sub = null } = {}) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      const walls = new THREE.Group(); g.add(walls);
      for (const [px, pz, w, d] of [[0, -Dp / 2, W, 0.03], [0, Dp / 2, W, 0.03], [-W / 2, 0, 0.03, Dp], [W / 2, 0, 0.03, Dp]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, Hh, d), glass); m.position.set(px, Hh / 2, pz); m.renderOrder = 2; walls.add(m); }
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, Hh, Dp)), new THREE.LineBasicMaterial({ color: nhs ? 0x9fb8d0 : 0x8a8f96, transparent: true, opacity: 0.55 })); edges.position.y = Hh / 2; walls.add(edges);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.06, Hh, 0.06), frameM, [sx * W / 2, Hh / 2, sz * Dp / 2], walls);
      mesh(new THREE.BoxGeometry(W, 0.02, Dp), std(nhs ? 0x2a3038 : 0x1e1d1b, { roughness: 0.7 }), [0, 0.01, 0], g);
      contents[kind](g);
      // pendant lamp and its pool
      const lampShade = mesh(new THREE.ConeGeometry(0.32, 0.26, 32, 1, true), std(0x111111, { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }), [0, Hh - 0.25, 0], walls);
      mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: LIGHT }), [0, Hh - 0.36, 0], walls);
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.2, 4), frameM, [0, Hh + 0.4, 0], walls);
      let spot = null;
      if (light) { spot = new THREE.SpotLight(LIGHT, nhs ? 110 : 420, 11, 0.9, 0.7, 1.3); spot.position.set(x, Hh - 0.4, z); spot.target.position.set(x, 0, z - 0.3); scene.add(spot, spot.target); realLights.push(spot); }
      const pool = mesh(new THREE.CircleGeometry(1.8, 48), new THREE.MeshBasicMaterial({ map: poolTex, color: LIGHT, transparent: true, opacity: light ? 0.3 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false }), [0, 0.025, 0], g); pool.rotation.x = -Math.PI / 2;
      const el = K.div(layer, `${MONO}`, sub ? `${label}<br><span style="color:#8f897d;font-size:.82em">${sub}</span>` : label);
      return { g, walls, x, z, el, spot, pool };
    }
    const poolTex = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    const motes = K.dust(scene, { count: nhs ? 250 : 450, box: [40, 6, 30], center: [0, 3, -4], size: 0.035, opacity: 0.3, color: LIGHT });
    scene.add(new THREE.HemisphereLight(nhs ? 0x5a7090 : 0x404a5a, 0x050505, 0.1));
    const out = { ...b }; const labels = (rooms, dy = 0) => rooms.forEach(rm => { const [x, y] = toScr([rm.x - W / 2 + 0.1, Hh + 0.35 + dy, rm.z + Dp / 2], camera); place(rm.el, x, y, 0, -20); });
    let rooms;
    if (mode === 'walls' || mode === 'formats' || mode === 'down') {
      const names = mode === 'formats' ? [['PAPER', 'FBI'], ['MAGNETIC TAPE', 'CIA'], ['SCREENS', 'NSA'], ['INDEX CARDS', 'STATE'], ['FILING', 'CUSTOMS'], ['SERVERS', 'DEA']]
        : [['FBI'], ['CIA'], ['NSA'], ['STATE'], ['CUSTOMS'], ['DEA']];
      const kinds = mode === 'formats' ? ['paper', 'tape', 'screens', 'cards', 'cabinets', 'racks'] : ['cabinets', 'racks', 'racks', 'cabinets', 'cabinets', 'racks'];
      const grid = mode === 'walls' ? (i) => [(i - 2.5) * 6.2, -i * 0.0] : (i) => [((i % 3) - 1) * 6.4, Math.floor(i / 3) * -6.2 + 2];
      rooms = names.map(([a, s], i) => { const [x, z] = grid(i); return room(x, z, a, kinds[i], { sub: s }); });
      if (mode === 'walls') {
        const move = C.path([{ pos: [-15, 1.7, 12.5], look: [-8, 1.4, 0], mm: 35 }, { pos: [-1, 1.75, 13.5], look: [4, 1.4, 0], mm: 35 }, { pos: [11, 1.8, 13], look: [15, 1.4, -1], mm: 35 }], { accel: 0.3, decel: 0.35, float: 0.02 });
        out.update = (t, p) => { motes.update(t); move(camera, p, t); rooms.forEach(rm => rm.el.style.opacity = K.range(t, 0.3, 0.9)); labels(rooms); };
        return out;
      }
      if (mode === 'formats') {
        rooms.forEach(rm => rm.g.traverse(o => { if (o.name === 'reel') o.userData.spin = true; }));
        const move = C.path([{ pos: [-9, 15, 16], look: [0, 0, -2.5], mm: 32 }, { pos: [3, 10, 13], look: [0.5, 0.4, -3], mm: 35 }], { accel: 0.3, decel: 0.45, float: 0.02 });
        out.update = (t, p) => { motes.update(t); move(camera, p, t); rooms.forEach(rm => { rm.el.style.opacity = K.range(t, 0.3, 0.9); rm.g.traverse(o => { if (o.userData.spin) o.rotation.y = t * 1.5; }); }); labels(rooms); };
        return out;
      }
      // down: on "tear" the glass slides into the floor and light floods across
      const tTear = Math.max(0.12, wt(shot, 'tear')); const flood = glowLines(400, { fog: 0.02, gain: 0.55 }); scene.add(flood);
      const fl = []; const rr = K.rng(8); for (let i = 0; i < 150; i++) { const a = rooms[Math.floor(rr() * 6)], c = rooms[Math.floor(rr() * 6)]; if (a === c) continue; fl.push([V3(a.x + (rr() - 0.5) * 3, 0.03 + rr() * 1.4, a.z + (rr() - 0.5) * 2.5), V3(c.x + (rr() - 0.5) * 3, 0.03 + rr() * 1.4, c.z + (rr() - 0.5) * 2.5), rr()]); }
      const move = C.path([{ pos: [-3, 0.5, 11], look: [0, 1.2, -1], mm: 24 }, { pos: [1.5, 2.4, 10], look: [0, 0.8, -2], mm: 24 }], { accel: 0.25, decel: 0.5, float: 0.02 });
      out.update = (t, p) => {
        motes.update(t); move(camera, p, t);
        rooms.forEach((rm, i) => { const k = K.inOut(K.range(t, tTear + 0.05 + i * 0.07, tTear + 1.3 + i * 0.07)); rm.walls.position.y = -Hh * 1.02 * k; rm.el.style.opacity = K.range(t, 0, 0.3) * (1 - k * 0.6); rm.pool.material.opacity = 0.18 + 0.3 * K.range(t, tTear + 0.6, tTear + 1.8); });
        const kf = K.range(t, tTear + 0.6, tTear + 2.4); let n = 0;
        fl.forEach(([a, c, d]) => { const k = K.outCubic(K.clamp(kf * 1.6 - d * 0.6)); if (k <= 0) return; const e = a.clone().lerp(c, k); flood.seg(n++, a.toArray(), e.toArray(), [0.55, 0.48, 0.36], [1.0, 0.75, 0.5]); });
        flood.count(n); flood.commit(); labels(rooms);
      };
      return out;
    }
    if (mode === 'nhs') {
      const names = [['PATIENT RECORDS', 'ACUTE TRUST'], ['PATHOLOGY', 'LAB SYSTEM'], ['GP RECORDS', 'PRIMARY CARE'], ['PHARMACY', 'DISPENSING'], ['WAITING LISTS', 'ELECTIVE'], ['A&E', 'URGENT CARE']];
      // a quiet terrace of records rooms under cold light, seen from above and slowly approached
      rooms = names.map(([a, s], i) => { const ang = (i - 2.5) * 0.16; return room(Math.sin(ang) * 30, 30 - Math.cos(ang) * 30 - 0, a, i % 3 === 1 ? 'cabinets' : 'records', { sub: s, light: true }); });
      rooms.forEach((rm, i) => rm.g.rotation.y = -(i - 2.5) * 0.16);
      b.ground.material.color.set(0x1a1f26);
      // the motivating key: a long fluorescent tube hung over the walkway in front of the rooms
      mesh(new THREE.BoxGeometry(18, 0.04, 0.07), new THREE.MeshBasicMaterial({ color: 0xeef4ff }), [0, 4.4, 3.2], scene); mesh(new THREE.BoxGeometry(18.4, 0.06, 0.22), std(0x2a2e33, { metalness: 0.6 }), [0, 4.46, 3.2], scene);
      for (const xx of [-7, 0, 7]) { const fl = new THREE.SpotLight(0xe4eeff, 260, 22, 1.0, 0.9, 1.5); fl.position.set(xx, 4.5, 4.2); fl.target.position.set(xx * 0.9, 0, 1); scene.add(fl, fl.target); }
      K.lightShaft(scene, { pos: [0, 4.5, 4.2], target: [0, 0, 1.5], radius: 4.5, color: 0xe4eeff, intensity: 0.03 });
      const move = C.path([{ pos: [3, 6.2, 12.5], look: [0, 1.3, -1], mm: 35 }, { pos: [1.8, 4.9, 9.8], look: [0, 1.3, -1.2], mm: 38 }], { accel: 0.4, decel: 0.5, float: 0.01 });
      out.update = (t, p) => { motes.update(t); move(camera, p, t); rooms.forEach(rm => rm.el.style.opacity = K.range(t, 0.4, 1.2) * 0.9); labels(rooms); };
      return out;
    }
    if (mode === 'agencies') {
      const names = ['IRS', 'DHS', 'SSA', 'EDUCATION', 'HHS', 'USCIS', 'TREASURY', 'LABOR', 'HUD', 'VA', 'USDA', 'STATE'];
      const kinds = ['cabinets', 'racks', 'records', 'cabinets', 'records', 'cabinets', 'racks', 'cabinets', 'records', 'racks', 'cabinets', 'records'];
      rooms = names.map((a, i) => room(((i % 4) - 1.5) * 6.2, Math.floor(i / 4) * -5.6 + 3, a, kinds[i], { light: false }));
      const key = K.keySpot(scene, { color: 0xfff0dc, intensity: 40000, pos: [0, 30, 6], target: [0, 0, -2], angle: 0.6, penumbra: 0.9, shadow: 2048 });
      const cap = caption(layer, P0.caption, 'left:6%;top:8%;max-width:46%'); const src = sourceLine(layer, P0.source);
      const move = C.path([{ pos: [-14, 26, 22], look: [0, 0, -2.5], mm: 30 }, { pos: [-2, 22, 23], look: [0.5, 0, -2.5], mm: 32 }, { pos: [9, 18, 21], look: [1, 0, -3], mm: 34 }], { accel: 0.3, decel: 0.4, float: 0.02 });
      out.update = (t, p) => { motes.update(t); move(camera, p, t); rooms.forEach((rm, i) => rm.el.style.opacity = K.range(t, 0.2 + i * 0.08, 0.6 + i * 0.08)); labels(rooms); if (cap) cap.style.opacity = K.range(t, 0.5, 1.2); if (src) src.style.opacity = K.range(t, 1, 1.8); };
      return out;
    }
    if (mode === 'center') {
      // no walls left: every line runs through one core, which becomes the brightest thing in frame
      const names = ['FBI', 'CIA', 'NSA', 'IRS', 'DHS', 'SSA', 'STATE', 'CUSTOMS'];
      const kinds = ['cabinets', 'racks', 'racks', 'cabinets', 'records', 'cabinets', 'records', 'racks'];
      rooms = names.map((a, i) => { const ang = i / names.length * Math.PI * 2; const rm = room(Math.sin(ang) * 11, Math.cos(ang) * 11, a, kinds[i], { light: false }); rm.walls.visible = false; rm.g.rotation.y = ang + Math.PI; rm.el.style.fontSize = '.55em'; return rm; });
      const core = new THREE.Group(); scene.add(core);
      const pillar = mesh(new THREE.CylinderGeometry(0.14, 0.14, 5, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd2a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), [0, 2.5, 0], core);
      mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.25, 48), std(0x111214, { metalness: 0.7, roughness: 0.3 }), [0, 0.12, 0], core);
      const glowP = glowPoints(ctx, 3, { fog: 0.005 }); scene.add(glowP);
      const coreL = new THREE.PointLight(SODIUM, 0, 40, 1.6); coreL.position.set(0, 2.6, 0); scene.add(coreL);
      const key = K.keySpot(scene, { color: 0xfff0dc, intensity: 3500, pos: [0, 26, 10], target: [0, 0, 0], angle: 0.7, penumbra: 1, shadow: 0 });
      const ins = rooms.map(rm => beam(scene, SODIUM, 0.03, { halo: 4, haloA: 0.2 }));
      const lines = glowLines(160, { fog: 0.02, gain: 0.55 }); scene.add(lines); const rr = K.rng(4); const L = Array.from({ length: 160 }, () => { const rm = rooms[Math.floor(rr() * rooms.length)]; return [V3(rm.x + (rr() - 0.5) * 3.5, 0.05 + rr() * 2.2, rm.z + (rr() - 0.5) * 3.5), V3((rr() - 0.5) * 0.5, 0.6 + rr() * 4, (rr() - 0.5) * 0.5), rr()]; });
      const move = C.path([{ pos: [6, 12, 26], look: [0, 2, 0], mm: 30 }, { pos: [3.5, 7.5, 21], look: [0, 2.4, 0], mm: 35 }, { pos: [1.5, 5, 16.5], look: [0, 2.6, 0], mm: 38 }], { accel: 0.3, decel: 0.5, float: 0.015 });
      out.update = (t, p) => {
        motes.update(t); move(camera, p, t);
        const g = K.smooth(K.range(p, 0.05, 0.85)); const pulse = 1 + 0.06 * Math.sin(t * 2.4);
        pillar.material.color.setRGB(0.25 + g * 0.6, 0.18 + g * 0.4, 0.1 + g * 0.22);
        glowP.set(0, [0, 2.6, 0], colArr(0xfff0dc, (0.6 + g * 2.6) * pulse), 1.6 + g * 3); glowP.set(1, [0, 2.6, 0], colArr(SODIUM, 0.25 + g * 0.6), 9 + g * 12); glowP.set(2, [0, 0.3, 0], colArr(SODIUM, 0.4 * g), 6); glowP.commit();
        coreL.intensity = 40 + g * 260; key.intensity = 3500 * (1 - g * 0.7);
        ins.forEach((bm, i) => { const rm = rooms[i]; bm.set(V3(rm.x, 1.2, rm.z), V3(0, 2.6, 0), K.outCubic(K.range(t, 0.2 + i * 0.12, 1.2 + i * 0.12))); });
        L.forEach(([a, c, d], i) => { const k = K.outCubic(K.range(t, 0.4 + d * 2.5, 1.4 + d * 2.5)); lines.seg(i, a.toArray(), a.clone().lerp(c, k).toArray(), [0.3, 0.22, 0.14], colArr(SODIUM, 0.7 * k)); }); lines.commit();
        rooms.forEach(rm => rm.el.style.opacity = 0.75 * (1 - g * 0.6)); labels(rooms);
      };
      return out;
    }
    throw new Error(`[ops] silos: unknown mode ${mode}`);
  }

  // ================================================================ WARROOM
  function warroom(ctx, shot) {
    const P0 = shot.params; const mode = P0.mode ?? 'ops'; const T = shot.duration;
    if (mode === 'call') return boardroom(ctx, shot);
    const b = base(ctx, { floor: 0x0d0f12, fog: 0x02040a, density: 0.045, fov: 30 });
    const { scene, camera, layer } = b; const r = K.rng(12);
    b.ground.material.roughness = 0.3; b.ground.material.metalness = 0.4;
    const glow = mode === 'glow';
    // the screen wall
    const wall = new THREE.Group(); wall.position.set(0, 0, -9); scene.add(wall);
    mesh(new THREE.BoxGeometry(26, 8, 0.4), std(0x08090b, { roughness: 0.6 }), [0, 4, -0.3], wall);
    const kinds = ['sat', 'map', 'thermal', 'table', 'graph', 'sat', 'map', 'thermal', 'table', 'map', 'sat', 'graph', 'thermal', 'table', 'map', 'sat', 'thermal', 'graph'];
    const gtex = SCR.graph(4); const screens = [];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
      const i = row * 6 + col; const x = (col - 2.5) * 3.55, y = 1.9 + row * 2.05; const centre = (col === 2 || col === 3) && row >= 1;
      if (centre && !(col === 2 && row === 1)) continue;
      const w = centre ? 7.0 : 3.45, h = centre ? 4.0 : 1.95; const cx = centre ? 0 : x, cy = centre ? 4.95 : y;
      const tex = glow ? gtex : centre ? (mode === 'screens' ? SCR.por() : SCR.graph(9)) : SCR[kinds[i]](i + 1);
      const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff }), [cx, cy, 0], wall); m.castShadow = false;
      mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.06), std(0x050505), [cx, cy, -0.05], wall);
      screens.push({ m, centre, x: cx, y: cy, w });
    }
    // three tiers of desks, each operator with two monitors
    const deskM = std(0x0c0d10, { roughness: 0.75, metalness: 0.2 }); const monTex = [SCR.table(2), SCR.map(3), SCR.graph(6), SCR.thermal(8)];
    const ops = [];
    for (let row = 0; row < 3; row++) {
      const z = -4.2 + row * 3.4, y0 = row * 0.35; if (row) mesh(new THREE.BoxGeometry(22, y0, 3.4), std(0x0c0d10, { roughness: 0.7 }), [0, y0 / 2, z + 0.6], scene);
      mesh(new THREE.BoxGeometry(18, 0.06, 1.0), deskM, [0, y0 + 0.76, z], scene); mesh(new THREE.BoxGeometry(18, 0.7, 0.05), deskM, [0, y0 + 0.4, z + 0.45], scene);
      for (let s = 0; s < 7; s++) {
        const x = (s - 3) * 2.5 + (row % 2) * 0.6;
        for (const dx of [-0.36, 0.36]) { const mon = mesh(new THREE.PlaneGeometry(0.62, 0.38), new THREE.MeshBasicMaterial({ map: glow ? gtex : monTex[(s + row + (dx > 0 ? 1 : 0)) % 4], color: 0xd0d8e6 }), [x + dx, y0 + 1.06, z - 0.28], scene); mon.rotation.y = -dx * 0.5; mon.castShadow = false; mesh(new THREE.BoxGeometry(0.64, 0.4, 0.03), std(0x050505), [x + dx, y0 + 1.06, z - 0.3], scene).rotation.y = -dx * 0.5; }
        if (r() < 0.82) { const op = operator(scene, { clip: r() < 0.3 ? 'Sitting_Talking_Loop' : 'Sitting_Idle_Loop', phase: r() * 4, pos: [x, y0 + 0.02, z + 0.95], rotY: Math.PI }); ops.push(op);
          mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), matte(), [x, y0 + 0.47, z + 0.95], scene); mesh(new THREE.BoxGeometry(0.5, 0.7, 0.07), matte(), [x, y0 + 0.85, z + 1.25], scene); }
      }
    }
    // two standing at the front, watching the wall
    ops.push(operator(scene, { clip: 'Idle_Loop', phase: 1.3, pos: [-3.2, 0, -6.4], rotY: Math.PI + 0.2 }), operator(scene, { clip: 'Idle_Talking_Loop', phase: 0.4, pos: [-2.4, 0, -6.9], rotY: Math.PI - 0.5 }));
    // cold monitor-blue key from the wall, through haze
    const keyC = glow ? 0x9fc4ff : 0x7d9fd8;
    const key = K.keySpot(scene, { color: keyC, intensity: glow ? 3200 : 3400, pos: [0, 6.5, -8.2], target: [0, 0.5, 2], angle: 0.85, penumbra: 0.9, shadow: 1024 });
    K.lightShaft(scene, { pos: [0, 5, -8.6], target: [0, 0, 4], radius: 9, color: keyC, intensity: glow ? 0.05 : 0.035 });
    const back = new THREE.SpotLight(0x5a6a8a, 400, 30, 0.6, 0.8, 1.5); back.position.set(6, 8, 10); back.target.position.set(0, 1, -4); scene.add(back, back.target);
    scene.add(new THREE.HemisphereLight(0x20304a, 0x020202, 0.25));
    K.dust(scene, { count: 600, box: [24, 7, 16], center: [0, 3.5, -2], size: 0.03, opacity: 0.35, color: 0xbcd0ff }).name = 'motes';
    const motes = scene.getObjectByName('motes');
    const out = { ...b };
    if (mode === 'ops') {
      const move = C.path([{ pos: [-8, 2.5, 6.4], look: [-3.5, 2.0, -6], mm: 35 }, { pos: [-2, 2.6, 6.8], look: [1, 2.1, -6], mm: 35 }, { pos: [4, 2.7, 6.4], look: [4.5, 2.2, -6], mm: 35 }], { accel: 0.35, decel: 0.35, float: 0.015 });
      out.update = (t, p) => { motes.update(t); ops.forEach(o => o.update(t)); move(camera, p, t); };
      return scope(out);
    }
    if (mode === 'screens') {
      const cap = caption(layer, P0.caption, 'left:6%;top:8%'); const src = sourceLine(layer, P0.source);
      const move = C.path([{ pos: [-9, 3.6, 0], look: [-6, 4.0, -9], mm: 50 }, { pos: [-4, 3.6, 3], look: [-1.5, 4.3, -9], mm: 50 }, { pos: [0.3, 3.4, 6.5], look: [0, 4.6, -9], mm: 45 }], { accel: 0.3, decel: 0.5, float: 0.012 });
      out.update = (t, p) => { motes.update(t); ops.forEach(o => o.update(t)); move(camera, p, t); if (cap) cap.style.opacity = K.range(t, 0.5, 1.2); if (src) src.style.opacity = K.range(t, 1.0, 1.8); };
      return out;
    }
    // glow: high angle; every screen shows the same graph, the operators lit by it
    const move = C.path([{ pos: [-6, 9.5, 9], look: [0, 1.8, -5], mm: 28 }, { pos: [3, 9, 8.5], look: [0.5, 1.8, -5], mm: 30 }], { accel: 0.35, decel: 0.45, float: 0.015 });
    out.update = (t, p) => { motes.update(t); ops.forEach(o => o.update(t)); move(camera, p, t); };
    return out;
  }

  // the empty room at night where the CEO said it: a conference speaker and an earnings-call waveform
  function boardroom(ctx, shot) {
    const b = base(ctx, { floor: 0x0d0c0b, fog: 0x020305, density: 0.03, fov: 30 }); const { scene, camera, layer } = b; const T = shot.duration;
    const wood = std(0x140d09, { roughness: 0.35, metalness: 0.1 });
    mesh(new THREE.BoxGeometry(2.4, 0.08, 7.5), wood, [0, 0.76, 0], scene); mesh(new THREE.BoxGeometry(0.6, 0.72, 5), std(0x0b0b0b), [0, 0.38, 0], scene);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const c = new THREE.Group(); c.position.set(s * 1.65, 0, -2.8 + i * 1.4); c.rotation.y = -s * Math.PI / 2 + (i % 2 ? 0.12 : -0.08); scene.add(c);
      mesh(new THREE.BoxGeometry(0.58, 0.1, 0.55), std(0x111111, { roughness: 0.6 }), [0, 0.5, 0], c); mesh(new THREE.BoxGeometry(0.58, 0.75, 0.08), std(0x111111, { roughness: 0.6 }), [0, 0.98, 0.26], c); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), std(0x333333, { metalness: 0.8 }), [0, 0.24, 0], c); }
    // conference speaker: a three-lobed puck with a lit ring
    const sp = new THREE.Shape(); for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 2; const rr = 0.3 + 0.06 * Math.cos(3 * a); i ? sp.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sp.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const puck = mesh(new THREE.ExtrudeGeometry(sp, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3 }), std(0x1a1b1d, { roughness: 0.4, metalness: 0.3 }), [0.5, 0.8, -1.35], scene); puck.rotation.x = -Math.PI / 2; puck.scale.setScalar(0.6);
    const ring = mesh(new THREE.TorusGeometry(0.11, 0.008, 8, 48), new THREE.MeshBasicMaterial({ color: 0x5fa8c8 }), [0.5, 0.848, -1.35], scene); ring.scale.setScalar(0.6); ring.rotation.x = -Math.PI / 2;
    const ringL = new THREE.PointLight(0x9fe0ff, 0.03, 0.6, 2); ringL.position.set(0.5, 0.95, -1.35); scene.add(ringL);
    // laptop with a live waveform
    const lap = new THREE.Group(); lap.position.set(-0.3, 0.81, -0.9); lap.rotation.y = 0.3; scene.add(lap);
    mesh(new THREE.BoxGeometry(0.62, 0.02, 0.42), std(0x7d8186, { metalness: 0.85, roughness: 0.3 }), [0, 0, 0], lap);
    const lid = new THREE.Group(); lid.position.set(0, 0.01, -0.21); lid.rotation.x = -0.32; lap.add(lid);
    mesh(new THREE.BoxGeometry(0.62, 0.42, 0.012), std(0x7d8186, { metalness: 0.85, roughness: 0.3 }), [0, 0.21, -0.008], lid);
    const cv = document.createElement('canvas'); cv.width = 768; cv.height = 480; const cx = cv.getContext('2d'); const wtex = new THREE.CanvasTexture(cv); wtex.colorSpace = THREE.SRGBColorSpace;
    const scr = mesh(new THREE.PlaneGeometry(0.58, 0.37), new THREE.MeshBasicMaterial({ map: wtex }), [0, 0.21, 0.0], lid); scr.castShadow = false;
    
    // night window wall and a city far below
    for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.06, 3.4, 0.06), std(0x0a0a0a), [-4 + i * 2, 1.7, -5.2], scene);
    mesh(new THREE.PlaneGeometry(10, 3.4), new THREE.MeshStandardMaterial({ color: 0x0a0e16, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.35 }), [0, 1.7, -5.2], scene);
    const city = glowPoints(ctx, 900, { fog: 0.0, minPx: 1.4 }); scene.add(city); const rr = K.rng(3);
    for (let i = 0; i < 900; i++) { const c = rr() < 0.6 ? colArr(SODIUM, 0.6) : colArr(0xdde6ff, 0.5); city.set(i, [(rr() - 0.5) * 120, -3 - rr() * 14 + Math.max(0, gauss(rr) * 6), -30 - rr() * 90], c.map(v => v * (0.4 + rr())), 0.25 + rr() * 0.3); } city.commit();
    scene.add(new THREE.HemisphereLight(0x223048, 0x050505, 0.35));
    const moon = new THREE.SpotLight(0x8fa6d8, 60, 20, 0.5, 0.8, 1.2); moon.position.set(-3.5, 3.2, -6); moon.target.position.set(0.3, 0.8, 0.5); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); scene.add(moon, moon.target);
    C.sky(scene, 'moonless_golf', { background: false, intensity: 0.22 });
    K.lightShaft(scene, { pos: [-3.5, 3.2, -6], target: [0.3, 0.6, 0.5], radius: 1.6, color: 0x8fa6d8, intensity: 0.05 });
    K.dust(scene, { count: 250, box: [4, 2, 4], center: [0, 1.4, 0.2], size: 0.012, opacity: 0.5, color: 0xbcd4ff }).name = 'm';
    const motes = scene.getObjectByName('m');
    const move = C.path([{ pos: [0.8, 1.12, 1.5], look: [-0.15, 0.97, -1.0], mm: 40 }, { pos: [0.5, 1.02, 0.55], look: [-0.2, 0.98, -1.0], mm: 45 }], { accel: 0.3, decel: 0.5, float: 0.008 });
    const drawWave = (t) => {
      const w = 768, h = 480; cx.fillStyle = '#0b1018'; cx.fillRect(0, 0, w, h); cx.fillStyle = '#121a26'; cx.fillRect(0, 0, w, 52);
      cx.fillStyle = '#e6edf6'; cx.font = '500 22px "Plex Mono"'; cx.fillText('Q4 2024 EARNINGS CALL', 28, 34); cx.fillStyle = '#e0241b'; cx.beginPath(); cx.arc(w - 120, 26, 7, 0, 7); cx.fill(); cx.fillStyle = '#9aa6b6'; cx.font = '400 18px "Plex Mono"'; cx.fillText('LIVE', w - 104, 33);
      cx.fillStyle = '#5d6876'; cx.font = '400 16px "Plex Mono"'; cx.fillText('FEB 3 2025 · AUDIO ONLY', 28, 92);
      const N = 120; for (let i = 0; i < N; i++) { const x = 28 + i * ((w - 56) / N); const tt = t * 8 - (N - i) * 0.12; const env = 0.25 + 0.75 * Math.abs(Math.sin(tt * 0.37) * Math.sin(tt * 0.11 + 1)); const a = env * (0.3 + 0.7 * hash2(Math.floor(tt * 3), i, 2)) * 120;
        cx.fillStyle = i > N - 4 ? '#ffffff' : '#7fa3d8'; cx.fillRect(x, 270 - a, 3, a * 2); }
      cx.fillStyle = '#2a3442'; cx.fillRect(28, 420, w - 56, 3); cx.fillStyle = '#9fc4ff'; cx.fillRect(28, 420, (w - 56) * (0.42 + t / T * 0.1), 3);
      wtex.needsUpdate = true;
    };
    return scope({ ...b, update(t, p) { motes.update(t); move(camera, p, t); drawWave(t); ring.material.color.setRGB(0.25, 0.5, 0.62).multiplyScalar(0.7 + 0.3 * Math.sin(t * 2.2)); } });
  }


  // ---------------------------------------------------------------- terrain
  // Painted ground: a low-res noise base upscaled smoothly, crisp features drawn on top, fine sensor grain.
  function paintGround({ size, res = 2048, low = 320, base, draw, grain = 9, seed = 1 }) {
    const lc = document.createElement('canvas'); lc.width = lc.height = low; const lx = lc.getContext('2d'); const im = lx.createImageData(low, low);
    for (let j = 0; j < low; j++) for (let i = 0; i < low; i++) { const c = base((i / (low - 1) - 0.5) * size, (j / (low - 1) - 0.5) * size); const o = (j * low + i) * 4; im.data[o] = c[0] * 255; im.data[o + 1] = c[1] * 255; im.data[o + 2] = c[2] * 255; im.data[o + 3] = 255; }
    lx.putImageData(im, 0, 0);
    const tex = canvasTex(res, res, (x) => {
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(lc, 0, 0, res, res);
      const S = res / size; const P = (wx, wz) => [(wx / size + 0.5) * res, (wz / size + 0.5) * res];
      draw?.(x, P, S);
      if (grain) { const d = x.getImageData(0, 0, res, res); const a = d.data; let s = seed * 9301 + 49297; for (let k = 0; k < a.length; k += 4) { s = (s * 1664525 + 1013904223) >>> 0; const g = ((s >>> 24) / 255 - 0.5) * grain; a[k] += g; a[k + 1] += g; a[k + 2] += g; } x.putImageData(d, 0, 0); }
    });
    tex.anisotropy = 8; return tex;
  }
  function terrain(scene, { size = 200, seg = 160, height = () => 0, map, mat = 'basic', rough = 0.95, under = null } = {}) {
    const g = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2); const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setY(i, height(pa.getX(i), pa.getZ(i)));
    g.computeVertexNormals();
    const m = mat === 'basic' ? new THREE.MeshBasicMaterial({ map }) : new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0 });
    const t = new THREE.Mesh(g, m); t.receiveShadow = true; scene.add(t);
    if (under != null) { const u = new THREE.Mesh(new THREE.PlaneGeometry(size * 8, size * 8).rotateX(-Math.PI / 2), mat === 'basic' ? new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...under, THREE.SRGBColorSpace) }) : new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...under, THREE.SRGBColorSpace), roughness: 1 })); u.position.y = -1.5; scene.add(u); }
    return t;
  }
  const srgb = (r, g = r, b = g === r ? r : g) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
  const softDot = (x, cx, cy, rad, rgba) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)')); x.fillStyle = gr; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); };
  const strokePath = (x, P, fn, n, w, style) => { x.strokeStyle = style; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); for (let i = 0; i <= n; i++) { const [a, b] = fn(i / n); const [px, py] = P(a, b); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
  // HUD: thin, quiet sensor graphics in 1920x1080 SVG units
  function hud(layer, { color = 'rgba(235,235,225,.85)', reticle = true, corners = true, vignette = 0.55 } = {}) {
    if (vignette) K.div(layer, `inset:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,${vignette}) 100%)`, '').style.opacity = 1;
    const svg = K.svgLayer(layer); const A = { stroke: color, 'stroke-width': 1.2, fill: 'none' };
    if (corners) for (const [x, y, dx, dy] of [[90, 80, 1, 1], [1830, 80, -1, 1], [90, 1000, 1, -1], [1830, 1000, -1, -1]]) svg.make('polyline', { ...A, points: `${x},${y + dy * 46} ${x},${y} ${x + dx * 46},${y}` });
    if (reticle) { for (const [x1, y1, x2, y2] of [[960, 470, 960, 515], [960, 565, 960, 610], [890, 540, 935, 540], [985, 540, 1030, 540]]) svg.make('line', { ...A, x1, y1, x2, y2 }); svg.make('circle', { ...A, cx: 960, cy: 540, r: 3 }); }
    const txt = (css, s) => K.div(layer, `${MONO_DIM};color:${color};${css}`, s);
    return { svg, txt, A };
  }
  const bracket = (svg, A) => { const p = svg.make('path', { ...A, d: '' }); p.at = (x, y, w, h, k = 1) => { const c = Math.min(w, h) * 0.28; const L = x - w / 2, R = x + w / 2, Tp = y - h / 2, B = y + h / 2;
    p.setAttribute('d', `M${L},${Tp + c}V${Tp}H${L + c}M${R - c},${Tp}H${R}V${Tp + c}M${R},${B - c}V${B}H${R - c}M${L + c},${B}H${L}V${B - c}`); p.setAttribute('opacity', k); }; return p; };

  // ================================================================ FEED
  function feed(ctx, shot) {
    const P0 = shot.params; const mode = P0.mode ?? 'thermal'; const T = shot.duration; const r = K.rng(77);
    const thermal = ['thermal', 'priority', 'top'].includes(mode);
    const fogC = thermal ? 0x1a1a1a : mode === 'artillery' ? 0xd2d6dc : 0xc4b8a2;
    const b = base(ctx, { floor: null, fog: fogC, density: thermal ? 0.0011 : mode === 'drone' ? 0.0016 : 0.0007, fov: 20 });
    const { scene, camera, layer } = b; const out = { ...b };
    if (mode !== 'drone' && mode !== 'priority') camera.up.set(0, 0, -1); // near-nadir views: keep north up, no roll flip over the target
    const vehicles = []; const addVeh = (x, z, rot, { hot = true, len = 4.6, wid = 2.0, color } = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
      const c = thermal ? (hot ? 0.92 : 0.62) : 0;
      const bodyM = thermal ? new THREE.MeshBasicMaterial({ color: srgb(c) }) : std(color ?? 0x2b2d2a, { roughness: 0.6, metalness: 0.3 });
      const cabM = thermal ? new THREE.MeshBasicMaterial({ color: srgb(c * 0.82) }) : std(0x15171a, { roughness: 0.2, metalness: 0.6 });
      mesh(new THREE.BoxGeometry(len, 1.0, wid), bodyM, [0, 0.6, 0], g); mesh(new THREE.BoxGeometry(len * 0.5, 0.7, wid * 0.9), cabM, [-len * 0.08, 1.35, 0], g);
      if (thermal && hot) mesh(new THREE.BoxGeometry(len * 0.25, 1.02, wid * 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }), [len * 0.33, 0.62, 0], g);
      vehicles.push(g); return g;
    };
    const meta = (h, list) => list.forEach(([css, s]) => h.txt(css, s).style.opacity = 1);

    if (thermal) {
      // white-hot vehicles on cold ground; roads hold the day's heat, trees are cold
      const SZ = 260; const roadA = (u) => { const x = (u - 0.5) * SZ; return [x, 8 * Math.sin(x / 40)]; }, roadB = (u) => { const z = (u - 0.5) * SZ; return [-30 - 6 * Math.sin(z / 30), z]; };
      const hAt = (x, z) => fbm(x / 60, z / 60, 3) * 3;
      const blds = Array.from({ length: 7 }, (_, i) => [-58 + i * 13, -27 - (i % 2) * 7, 9, 7, 3 + (i % 3)]);
      const trees = Array.from({ length: 70 }, () => [(r() - 0.5) * 220, 16 + r() * 80, 2 + r() * 3]);
      const map = paintGround({ size: SZ, seed: 4, base: (x, z) => { const n = fbm(x / 22, z / 22, 9), f = fbm(x / 7, z / 7, 2); const v = 0.13 + n * 0.12 + (f > 0.6 ? -0.03 : 0.0) + (fbm(x / 50, z / 50, 6) > 0.55 ? 0.05 : 0); return [v, v, v]; },
        draw: (x, P, S) => {
          for (const [cx, cz, rad] of trees) { const [px, py] = P(cx, cz); softDot(x, px, py, rad * S * 1.4, 'rgba(10,10,10,.75)'); }
          for (const fn of [roadA, roadB]) { strokePath(x, P, fn, 200, 9 * S, 'rgba(70,70,70,1)'); strokePath(x, P, fn, 200, 6.5 * S, 'rgba(112,112,112,1)'); strokePath(x, P, fn, 200, 0.25 * S, 'rgba(140,140,140,.6)'); }
          for (const [bx, bz, w, d] of blds) { const [px, py] = P(bx - w / 2 - 1.5, bz - d / 2 - 1.5); x.fillStyle = 'rgba(60,60,60,.35)'; x.fillRect(px, py, (w + 3) * S, (d + 3) * S); }
          for (let i = 0; i < 6; i++) { const [px, py] = P(-26 + Math.cos(i) * 4, -16 + Math.sin(i * 1.7) * 4); softDot(x, px, py, 2.4 * S, 'rgba(150,150,150,.35)'); }
        } });
      terrain(scene, { size: SZ, seg: 120, height: hAt, map, under: [0.16, 0.16, 0.16] });
      for (const [x, z, w, d, h] of blds) { const roof = new THREE.MeshBasicMaterial({ color: srgb(0.34 + (x % 3) * 0.02) }), wall = new THREE.MeshBasicMaterial({ color: srgb(0.24) });
        mesh(new THREE.BoxGeometry(w, h, d), [wall, wall, roof, wall, wall, wall], [x, hAt(x, z) + h / 2 - 0.4, z], scene); }
      const parked = [[-30, -10, 1.57], [-31, -2, 1.57], [-29, 12, 1.5], [10, -14, 0.3], [24, -12, 0.2], [-60, -16, 0]];
      parked.forEach(([x, z, a], i) => addVeh(x, z, a, { hot: i % 2 === 0 }));
      vehicles.forEach(v => v.position.y = hAt(v.position.x, v.position.z) - 0.2);
      const mover = [addVeh(0, 0, 0), addVeh(0, 0, 0), addVeh(0, 0, 0)];
      const people = glowPoints(ctx, 14, { fog: 0.0, minPx: 2.5 }); scene.add(people);
      const heat = glowPoints(ctx, 12, { fog: 0, minPx: 2 }); scene.add(heat);
      const H0 = hud(layer); const boxes = []; const ids = ['TGT-0412', 'TGT-0388', 'TGT-0517', 'TGT-0771', 'TGT-0209', 'TGT-0634'];
      const targets = [...mover, vehicles[0], vehicles[2], vehicles[3]];
      targets.forEach((v, i) => { boxes.push({ v, br: bracket(H0.svg, H0.A), id: K.div(layer, `${MONO_DIM};color:rgba(235,235,225,.9)`, ids[i % ids.length]) }); });
      meta(H0, [['left:6%;top:8%', 'IR · WHITE HOT · NFOV'], ['right:6%;top:8%;text-align:right', 'SENSOR 2 · AUTO TRACK'], ['left:6%;bottom:8%', 'GAIN 1.4 · LVL 0.52'], ['right:6%;bottom:8%;text-align:right', 'ZOOM 4.0× · SLANT 6.2 KM']]);
      const readout = H0.txt('left:50%;top:8%;transform:translateX(-50%)', ''); readout.style.opacity = 1;
      const list = [];
      if (mode === 'priority' || mode === 'top') {
        const left = mode === 'top';
        K.div(layer, `${left ? 'left' : 'right'}:0;top:0;bottom:0;width:34%;background:linear-gradient(${left ? 270 : 90}deg,rgba(0,0,0,0),rgba(0,0,0,.78) 32%)`, '').style.opacity = 1;
        const hdr = K.div(layer, `${MONO};${left ? 'left' : 'right'}:5%;top:22%;width:24%;color:#8f897d;border-bottom:1px solid rgba(214,207,191,.4);padding-bottom:.5em`, 'PRIORITY · RANKED'); hdr.style.opacity = 1;
        const rows = left ? [['TGT-0388', 91], ['TGT-0517', 88], ['TGT-0209', 84], ['TGT-0634', 79], ['TGT-0145', 73], ['TGT-0771', 62]] : [['TGT-0412', 94], ['TGT-0388', 91], ['TGT-0517', 88], ['TGT-0771', 82], ['TGT-0209', 77], ['TGT-0634', 71], ['TGT-0145', 64]];
        rows.forEach(([id, s], i) => { const el = K.div(layer, `${MONO};${left ? 'left' : 'right'}:5%;width:24%;display:flex;justify-content:space-between;align-items:center;padding:.35em .5em;box-sizing:border-box`, `<span><span class="rk" style="color:#8f897d">${String(i + 1).padStart(2, '0')}</span>&nbsp;&nbsp;${id}</span><span style="display:flex;align-items:center;gap:.8em"><span style="display:inline-block;height:2px;width:${s * 0.9}px;background:${PAPER};opacity:.55"></span>0.${s}</span>`); list.push({ el, i, id }); });
      }
      function tick(t) {
        mover.forEach((v, i) => { const u = ((t * (0.01 + i * 0.003) + 0.25 + i * 0.13) % 1) * 0.8 + 0.1; const [x, z] = roadA(u); const [x2, z2] = roadA(u + 0.001); v.position.set(x, hAt(x, z) - 0.25, z + (i % 2 ? 1.5 : -1.5)); v.rotation.y = -Math.atan2(z2 - z, x2 - x); });
        for (let i = 0; i < 14; i++) { const ang = i * 2.1 + t * 0.05 * (i % 3); people.set(i, [-26 + Math.cos(ang) * (2 + i * 0.4), 1.2, -16 + Math.sin(ang) * (2 + i * 0.3)], [0.9, 0.9, 0.9], 0.5); } people.commit();
        [...mover, vehicles[0], vehicles[2], vehicles[4]].forEach((v, i) => heat.set(i, [v.position.x, v.position.y + 1.2, v.position.z], [0.22, 0.22, 0.22], 7)); heat.commit();
      }
      function track(t, which, tStart, step, dim = 1) {
        camera.updateMatrixWorld();
        boxes.forEach(({ v, br, id }, i) => { const on = which.includes(i); const t0 = tStart + which.indexOf(i) * step; const k = on ? K.outCubic(K.range(t, t0, t0 + 0.35)) : 0; const [x, y] = toScr([v.position.x, v.position.y + 0.8, v.position.z], camera);
          const s = 1 + (1 - k) * 0.8; const wpx = 70 * s, hpx = 54 * s; br.at(x, y, wpx, hpx, k * dim); place(id, x, y, -wpx / 2, -hpx / 2 - 30); id.style.opacity = k * dim; });
      }
      const coords = (p) => `${(31.5112 + p * 0.0004).toFixed(4)}N  ${(64.1218 - p * 0.0003).toFixed(4)}E`;
      if (mode === 'thermal') {
        const move = C.path([{ pos: [-8, 250, 10], look: [-6, 0, -4], mm: 85 }, { pos: [4, 230, -6], look: [0, 0, -6], mm: 100 }], { accel: 0.3, decel: 0.4, float: 0.15 });
        out.update = (t, p) => { tick(t); move(camera, p, t); camera.rotation.z += K.lerp(-0.08, 0.06, K.inOut(p)); track(t, [0, 1, 2, 3, 4, 5], T * 0.3, 0.45); readout.textContent = coords(p); };
      } else if (mode === 'priority') {
        const move = C.path([{ pos: [-90, 120, 140], look: [-12, 0, -4], mm: 70 }, { pos: [-72, 106, 122], look: [-10, 0, -4], mm: 78 }], { accel: 0.3, decel: 0.4, float: 0.1 });
        out.update = (t, p) => { tick(t); move(camera, p, t); camera.updateMatrixWorld(); track(t, [0, 1, 2, 3, 4, 5], 0.2, 0.18);
          list.forEach(({ el, i }) => { const t0 = 0.25 + i * Math.min(0.5, (T - 0.9) / 7); const k = K.range(t, t0, t0 + 0.3); place(el, 0, 300 + i * 46, 0, 0); el.style.left = ''; el.style.opacity = k; el.style.clipPath = `inset(0 0 0 ${100 - k * 100}%)`; });
          readout.textContent = coords(p); };
      } else {
        // top: one target climbs to the top of the list; the sensor pushes in and locks
        const hero = targets[3]; const lockBr = bracket(H0.svg, { ...H0.A, stroke: '#e0241b', 'stroke-width': 2 });
        const move = C.path([{ pos: [-20, 150, 52], look: [-30, 0, -10], mm: 85 }, { pos: [-24, 105, 30], look: [-30, 0, -10], mm: 120 }], { accel: 0.25, decel: 0.5, float: 0.06 });
        const t0 = Math.max(0.25, T * 0.15), t1 = Math.min(T - 0.3, t0 + 1.4);
        out.update = (t, p) => { tick(t); move(camera, p, t); camera.updateMatrixWorld(); track(t, [0, 1, 2], 0.0, 0.0, 0.45);
          const v = hero.position; const [x, y] = toScr([v.x, v.y + 0.8, v.z], camera); const k = K.outCubic(K.range(t, 0.05, t0 + 0.4)); lockBr.at(x, y, K.lerp(300, 120, k), K.lerp(240, 92, k), 1);
          const climb = K.inOut(K.range(t, t0, t1)); const N1 = list.length - 1, hotSlot = K.lerp(N1, 0, climb);
          list.forEach(({ el, i }) => { const hot = i === N1; const slot = hot ? hotSlot : i + K.smooth(K.clamp(i + 1 - hotSlot));
            place(el, 0, 300 + slot * 46, 0, 0); el.style.left = '5%'; el.style.opacity = 1; el.style.outline = hot ? `1.5px solid ${RED_CSS}` : 'none'; el.style.background = hot ? 'rgba(0,0,0,.6)' : 'none'; el.style.zIndex = hot ? 2 : 1;
            const num = el.querySelector('.rk'); if (num) num.textContent = String(Math.round(slot) + 1).padStart(2, '0'); });
          readout.textContent = `TRACK ${list.at(-1).id} · LOCK`; };
      }
      return out;
    }

    if (mode === 'sat') {
      // optical satellite plate: a walled desert compound, low sun, grid overlay
      const sun = new THREE.DirectionalLight(0xfff1dc, 3.0); sun.position.set(-60, 45, -30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, far: 300 }); sun.shadow.bias = -0.0005; scene.add(sun, sun.target);
      scene.add(new THREE.HemisphereLight(0xbcd0e8, 0x6a5a40, 0.7));
      const SZ = 240; const trk = (u) => { const x = (u - 0.5) * SZ; return [x, 0.3 * x + 22 + 4 * Math.sin(x / 17)]; };
      const map = paintGround({ size: SZ, seed: 7, base: (x, z) => { const n = fbm(x / 16, z / 16, 7), m = fbm(x / 4, z / 4, 11), w = fbm(x / 45, z / 45, 3); const v = 0.6 + n * 0.22 + (m - 0.5) * 0.08 - (w > 0.6 ? 0.06 : 0); return [v * 0.9, v * 0.77, v * 0.58]; },
        draw: (x, P, S) => { strokePath(x, P, trk, 160, 3.2 * S, 'rgba(232,214,182,.9)'); strokePath(x, P, (u) => [-17 + (u - 0.5) * 2, 17 + u * 30], 20, 2.2 * S, 'rgba(225,206,172,.8)');
          for (let i = 0; i < 40; i++) { const [px, py] = P((r() - 0.5) * SZ, (r() - 0.5) * SZ); softDot(x, px, py, (0.8 + r() * 1.5) * S, 'rgba(70,72,40,.55)'); } } });
      terrain(scene, { size: SZ, seg: 140, mat: 'std', height: (x, z) => fbm(x / 90, z / 90, 4) * 2.5, map, under: [0.62, 0.53, 0.4] });
      const wallM = std(0xb89a72, { roughness: 0.95 }); const S0 = 34;
      for (const [x, z, w, d] of [[0, -S0 / 2, S0, 0.6], [0, S0 / 2, S0, 0.6], [-S0 / 2, 0, 0.6, S0], [S0 / 2, 0, 0.6, S0]]) mesh(new THREE.BoxGeometry(w, 2.8, d), wallM, [x, 2.4, z], scene);
      [[-8, -8, 12, 8, 3.4], [8, -9, 9, 10, 4.2], [-9, 8, 9, 9, 3.2], [9, 9, 7, 6, 6.5], [22, -30, 8, 6, 3]].forEach(([x, z, w, d, h]) => { mesh(new THREE.BoxGeometry(w, h, d), std(0xd6c4a2, { roughness: 0.9 }), [x, h / 2 + 1.2, z], scene); mesh(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), std(0xc9b48e), [x, h + 1.3, z], scene); });
      for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(1.6, 12, 8), std(0x4a5634, { roughness: 1 }), [-2 + i * 2.2, 3, 1 + (i % 2) * 2], scene);
      addVeh(4, 2, 0.4, { color: 0xe6e2da }); addVeh(26, 30, 1.2, { color: 0x4a4a46 }); vehicles.forEach(v => v.position.y = 1.2);
      const H0 = hud(layer, { color: 'rgba(240,236,226,.85)', reticle: false, vignette: 0.35 });
      for (let i = 1; i < 8; i++) H0.svg.make('line', { ...H0.A, x1: i * 240, y1: 0, x2: i * 240, y2: 1080, opacity: 0.22 });
      for (let j = 1; j < 5; j++) H0.svg.make('line', { ...H0.A, x1: 0, y1: j * 216, x2: 1920, y2: j * 216, opacity: 0.22 });
      'ABCDEFGH'.split('').forEach((c, i) => { const d = K.div(layer, `${MONO_DIM};color:rgba(240,236,226,.75);left:${(i * 240 + 10) / 19.2}%;top:1.5%`, c); d.style.opacity = 1; });
      meta(H0, [['left:6%;top:8%', 'EO · PAN-SHARPENED · 0.31 M GSD'], ['right:6%;bottom:8%;text-align:right', 'SUN EL 24° · AZ 241° · NADIR 4°'], ['left:6%;bottom:8%', 'ILLUSTRATIVE RECONSTRUCTION']]);
      const box = bracket(H0.svg, { ...H0.A, 'stroke-width': 1.6 });
      const move = C.path([{ pos: [6, 420, 4], look: [6, 0, 0], mm: 70 }, { pos: [2, 360, 1], look: [2, 0, 0], mm: 110 }], { accel: 0.3, decel: 0.5, float: 0.2 });
      out.update = (t, p) => { move(camera, p, t); camera.rotation.z = 0.06; camera.updateMatrixWorld(); const [x, y] = toScr([0, 2, 0], camera); const k = K.outCubic(K.range(t, T * 0.35, T * 0.35 + 0.5)); const [x2] = toScr([S0 / 2, 2, 0], camera); const w = (x2 - x) * 2.25; box.at(x, y, w, w, k); };
      return out;
    }

    if (mode === 'drone') {
      // oblique drone look: long lens, slow orbit over the edge of a village
      const sun = new THREE.DirectionalLight(0xffe6c4, 2.6); sun.position.set(40, 35, -50); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, far: 220 }); sun.shadow.bias = -0.0004; scene.add(sun, sun.target);
      scene.add(new THREE.HemisphereLight(0xcfd8e4, 0x5a4a34, 0.9));
      const SZ = 320; const hAt = (x, z) => fbm(x / 70, z / 70, 21) * 6 - 2; const road = (u) => { const x = (u - 0.5) * SZ; return [x, 6 * Math.sin(x / 30) - 4]; };
      const map = paintGround({ size: SZ, seed: 3, base: (x, z) => { const n = fbm(x / 20, z / 20, 22), f = fbm(x / 35, z / 35, 5); const v = 0.5 + n * 0.2; return f > 0.56 ? [v * 0.6, v * 0.66, v * 0.42] : [v * 0.88, v * 0.78, v * 0.6]; },
        draw: (x, P, S) => { strokePath(x, P, road, 200, 5 * S, 'rgba(206,190,160,1)'); for (let i = 0; i < 12; i++) { const z0 = -60 + i * 10; strokePath(x, P, (u) => [40 + u * 70, z0 + u * 6], 4, 0.4 * S, 'rgba(90,96,60,.35)'); } } });
      terrain(scene, { size: SZ, seg: 140, mat: 'std', height: hAt, map, under: [0.5, 0.44, 0.34] });
      const wallM = std(0xb8a888, { roughness: 0.95 });
      for (let i = 0; i < 22; i++) { const cx = -40 + (i % 6) * 14 + (r() - 0.5) * 3, cz = (i < 12 ? 10 : -20) + Math.floor((i % 12) / 6) * 13 + (r() - 0.5) * 3; const w = 6 + r() * 4, d = 5 + r() * 3, h = 3 + r() * 2;
        mesh(new THREE.BoxGeometry(w, h, d), std([0xc8b898, 0xb8a888, 0xd0c4a8][i % 3], { roughness: 0.95 }), [cx, hAt(cx, cz) + h / 2 - 0.3, cz], scene);
        if (r() < 0.6) { const yy = hAt(cx, cz) + 0.9; mesh(new THREE.BoxGeometry(w + 4, 1.8, 0.3), wallM, [cx, yy, cz + d / 2 + 2], scene); mesh(new THREE.BoxGeometry(0.3, 1.8, d + 4), wallM, [cx + w / 2 + 2, yy, cz], scene); } }
      const treeG = new THREE.IcosahedronGeometry(1, 1), treeM = std(0x4c5a32, { roughness: 1 }); const im = new THREE.InstancedMesh(treeG, treeM, 160); const m4 = new THREE.Matrix4();
      for (let i = 0; i < 160; i++) { const x = (r() - 0.5) * 160, z = (r() - 0.5) * 120; if (Math.abs(z - 6 * Math.sin(x / 30) + 4) < 4) { i--; continue; } const s = 1.2 + r() * 1.4; m4.compose(V3(x, hAt(x, z) + s * 0.9, z), new THREE.Quaternion(), V3(s, s * 0.9, s)); im.setMatrixAt(i, m4); }
      im.castShadow = true; scene.add(im);
      const v1 = addVeh(14, -4, 0.2, { color: 0xdedad2 }); v1.position.y = hAt(14, -4) + 0.1;
      const H0 = hud(layer, { color: 'rgba(245,244,236,.85)', vignette: 0.4 });
      const hdg = H0.txt('left:6%;bottom:8%', ''), alt = H0.txt('right:6%;bottom:8%;text-align:right', ''); hdg.style.opacity = alt.style.opacity = 1;
      meta(H0, [['left:6%;top:8%', 'EO · DAY · WFOV'], ['right:6%;top:8%;text-align:right', 'ORBIT 2 · CW']]);
      out.update = (t, p) => { const a = K.lerp(-0.45, 0.0, K.inOut(p)) + 0.6; const R = 250, H1 = 170; camera.position.set(Math.sin(a) * R, H1, Math.cos(a) * R); camLens(camera, 135); camera.lookAt(2, 0, -2); const h = K.handheld(t, 0.25, 3); camera.position.x += h.x; camera.position.y += h.y;
        hdg.textContent = `HDG ${String(Math.round((200 + a * 57.3 + 360) % 360)).padStart(3, '0')}° · TGT RNG 3.2 KM`; alt.textContent = `ALT ${(15800 + Math.round(Math.sin(t * 0.3) * 40)).toLocaleString('en-US')} FT`; };
      return out;
    }

    if (mode === 'artillery') {
      // a winter field from above: snow, treelines, a few vehicles; a coordinate readout updates
      scene.add(new THREE.HemisphereLight(0xe8eef6, 0x8a929c, 1.4)); const sun = new THREE.DirectionalLight(0xf2f4f8, 1.1); sun.position.set(-30, 60, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, far: 220 }); sun.shadow.bias = -0.0004; scene.add(sun, sun.target);
      const SZ = 300; const hAt = (x, z) => fbm(x / 80, z / 80, 31) * 3;
      const lines = [[-120, -40, 1, 0.05, 200], [-110, 46, 1, -0.08, 200], [-40, -140, 0.1, 1, 150], [60, -120, -0.05, 1, 150]];
      const map = paintGround({ size: SZ, seed: 5, grain: 7, base: (x, z) => { const n = fbm(x / 12, z / 12, 32), f = fbm(x / 30, z / 30, 33); const v = 0.86 + n * 0.1 - (f > 0.62 ? 0.12 : 0); return [v * 0.95, v * 0.97, v]; },
        draw: (x, P, S) => { // vehicle tracks pressed into the snow, and the dark stubble along field edges
          const tracks = [(u) => [(u - 0.5) * SZ, 14 * Math.sin((u - 0.5) * SZ / 50) + 10], (u) => [18 - 0.25 * ((u - 0.5) * SZ), (u - 0.5) * SZ], (u) => [-12 + u * 40, 8 + u * 14]];
          for (const fn of tracks) { for (const off of [-1.1, 1.1]) strokePath(x, P, (u) => { const [a, c] = fn(u); return [a, c + off]; }, 220, 0.55 * S, 'rgba(120,128,138,.55)'); }
          for (const [x0, z0, dx, dz, n] of lines) strokePath(x, P, (u) => [x0 + dx * u * n * 1.3, z0 + dz * u * n * 1.3], 40, 9 * S, 'rgba(150,156,160,.35)'); } });
      terrain(scene, { size: SZ, seg: 140, mat: 'std', height: hAt, map, under: [0.82, 0.84, 0.87] });
      const treeM = std(0x56604f, { roughness: 1 }); const im = new THREE.InstancedMesh(new THREE.ConeGeometry(1.0, 4.5, 7), treeM, 900); im.castShadow = true; const m4 = new THREE.Matrix4(); let k = 0;
      for (const [x0, z0, dx, dz, n] of lines) for (let i = 0; i < n * 1.4 && k < 900; i++) { const x = x0 + dx * i * 0.95 + gauss(r) * 2.2, z = z0 + dz * i * 0.95 + gauss(r) * 2.2; const s = 0.6 + r() * 0.6; m4.compose(V3(x, hAt(x, z) + 2.2 * s, z), new THREE.Quaternion(), V3(s, s, s)); im.setMatrixAt(k++, m4); }
      im.count = k; scene.add(im);
      [[-12, 8, 0.3], [6, 22, 1.2], [24, -6, 2.0], [-30, -18, 0.8]].forEach(([x, z, a]) => { const v = addVeh(x, z, a, { color: 0x3a3f38 }); v.position.y = hAt(x, z); });
      const H0 = hud(layer, { color: 'rgba(28,32,38,.85)', vignette: 0.25 });
      const coord = K.div(layer, `${MONO};color:#1e2228;right:6%;top:8%;text-align:right;font-size:1.05em`, ''); coord.style.opacity = 1;
      meta(H0, [['left:6%;top:8%', 'EO · OVERCAST · ILLUSTRATIVE'], ['left:6%;bottom:8%', 'GRID · UTM 37U'], ['right:6%;bottom:8%;text-align:right', 'NO STRIKE DEPICTED']]);
      const cross = vehicles.map(v => v.position); const br = bracket(H0.svg, { ...H0.A, stroke: 'rgba(28,32,38,.9)', 'stroke-width': 1.6 });
      const move = C.path([{ pos: [-30, 230, 60], look: [-4, 0, 2], mm: 60 }, { pos: [10, 215, 40], look: [2, 0, 2], mm: 70 }], { accel: 0.3, decel: 0.4, float: 0.1 });
      const dwell = Math.max(0.8, T / cross.length);
      out.update = (t, p) => { move(camera, p, t); camera.updateMatrixWorld();
        const seg = Math.min(cross.length - 1, Math.floor(t / dwell)); const v = cross[seg]; const [x, y] = toScr([v.x, v.y + 1, v.z], camera); const lt = t - seg * dwell; const kk = K.outCubic(K.clamp(lt / 0.5)); br.at(x, y, K.lerp(160, 70, kk), K.lerp(130, 56, kk), 1);
        const e = 41270 + Math.round(v.x * 10), n = 88360 - Math.round(v.z * 10); const spin = K.clamp(lt / 0.45); const show = (val) => String(spin < 1 ? Math.floor(val + (1 - spin) * 997 * hash2(Math.floor(t * 20), seg, 1)) % 100000 : val).padStart(5, '0');
        coord.innerHTML = `37U CQ ${show(e)} ${show(n)}<br><span style="color:#4a5058;font-size:.8em">ELEV ${Math.round(152 + v.y * 3)} M · TRK ${String(seg + 1).padStart(2, '0')}</span>`; };
      return out;
    }
    throw new Error(`[ops] feed: unknown mode ${mode}`);
  }

  // ================================================================ ADDRESSES
  function addresses(ctx, shot) {
    const P0 = shot.params; const mode = P0.mode ?? 'night'; const T = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x03050a, density: 0.0028, fov: 30 }); const { scene, camera, layer } = b; const r = K.rng(404);
    // streets every 46 m in x, 38 m in z; lots along both sides
    const SX = 46, SZ = 38, NX = 6, NZ = 7;
    const lawnT = K.grimeTexture(31, 70); lawnT.wrapS = lawnT.wrapT = THREE.RepeatWrapping; lawnT.repeat.set(30, 30); mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: 0x1c2219, roughness: 1, map: lawnT }), [0, -0.02, 0], scene).rotation.x = -Math.PI / 2;
    const asphalt = new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.55, metalness: 0.2 });
    for (let i = -NX; i <= NX; i++) mesh(new THREE.PlaneGeometry(8, 520), asphalt, [i * SX, 0.01, 0], scene).rotation.x = -Math.PI / 2;
    for (let j = -NZ; j <= NZ; j++) mesh(new THREE.PlaneGeometry(520, 8), asphalt, [0, 0.012, j * SZ], scene).rotation.x = -Math.PI / 2;
    const lots = []; for (let i = -NX; i < NX; i++) for (let j = -NZ; j < NZ; j++) for (let k = 0; k < 4; k++) for (const side of [0, 1]) { const x = i * SX + 4 + 4.5 + k * 9.5 + (r() - 0.5) * 1.2, z = j * SZ + 4 + (side ? SZ - 8 - 8 : 8) + (r() - 0.5) * 1.5; lots.push({ x, z, side, w: 6 + r() * 1.6, d: 8 + r() * 1.6, h: 3 + r() * 0.7, rot: side ? Math.PI : 0 }); }
    const n = lots.length; const wallM = std(0x9a958a, { roughness: 0.9 }), roofM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.1 });
    const gable = new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]); const roofG = new THREE.ExtrudeGeometry(gable, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5);
    const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), wallM, n); const roofs = new THREE.InstancedMesh(roofG, roofM, n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cc = new THREE.Color();
    lots.forEach((L, i) => { q.setFromEuler(new THREE.Euler(0, L.rot, 0)); m4.compose(V3(L.x, 0, L.z), q, V3(L.w, L.h, L.d)); walls.setMatrixAt(i, m4);
      m4.compose(V3(L.x, L.h, L.z), q, V3(L.w * 1.12, L.w * 0.32, L.d * 1.06)); roofs.setMatrixAt(i, m4); roofs.setColorAt(i, cc.setHSL(0.06 + r() * 0.06, 0.07, 0.2 + r() * 0.16)); });
    walls.castShadow = roofs.castShadow = true; walls.receiveShadow = roofs.receiveShadow = true; scene.add(walls, roofs);
    // trees, driveways
    const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std(0x10160f, { roughness: 1 }), 900); let k = 0;
    for (let i = 0; i < 900; i++) { const L = lots[Math.floor(r() * n)]; const s = 2 + r() * 2.2; m4.compose(V3(L.x + (r() - 0.5) * 12, s * 0.9, L.z + (L.side ? -1 : 1) * (6 + r() * 4)), q.identity(), V3(s, s * 0.9, s)); trees.setMatrixAt(k++, m4); } trees.castShadow = false; scene.add(trees);
    // streetlights: sodium heads and their pools on the asphalt
    const poolTex = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    const lamps = []; for (let i = -NX; i <= NX; i++) for (let j = -NZ * 2; j <= NZ * 2; j++) if ((i + j) % 2 === 0) lamps.push([i * SX + 4.5, j * SZ / 2 + 2]);
    const heads = glowPoints(ctx, lamps.length, { fog: 0.004, minPx: 2 }); scene.add(heads);
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex, color: SODIUM, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), lamps.length);
    lamps.forEach(([x, z], i) => { heads.set(i, [x, 7, z], colArr(SODIUM, 1.4), 0.9); m4.compose(V3(x - 1.5, 0.05, z), q.identity(), V3(22, 1, 22)); pools.setMatrixAt(i, m4); }); heads.commit(); scene.add(pools);
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 7, 6).translate(0, 3.5, 0), std(0x1a1a1a), lamps.length); lamps.forEach(([x, z], i) => { m4.makeTranslation(x, 0, z); poles.setMatrixAt(i, m4); }); scene.add(poles);
    // lit windows: a few houses still awake
    const winTex = poolTex; const wins = glowPoints(ctx, 70, { fog: 0.004, minPx: 2 }); scene.add(wins);
    for (let i = 0; i < 70; i++) { const L = lots[Math.floor(r() * n)]; wins.set(i, [L.x + (r() - 0.5) * L.w * 0.6, 1.4 + r() * 1.2, L.z + (L.side ? -1 : 1) * (L.d / 2 + 0.05)], colArr(0xffc890, 1.2 + r() * 0.8), 1.3); } wins.commit();
    const moon = new THREE.DirectionalLight(0x8296c0, 1.5); moon.position.set(-80, 120, -60); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, far: 400 }); scene.add(moon, moon.target);
    scene.add(new THREE.HemisphereLight(0x2a3550, 0x050505, 0.5));
    const sod = new THREE.PointLight(SODIUM, 0, 40, 1.4); scene.add(sod);
    const streets = ['ELM CT', 'WILLOW DR', 'HAWTHORN LN', 'ASH ST', 'LINDEN WAY', 'BIRCH RD', 'ALDER PL', 'MAPLE AVE', 'CEDAR CT', 'ROWAN ST'];
    const tagOf = (i, pct, big = false) => { const L = lots[i]; const addr = `${100 + (i * 37) % 1800} ${streets[i % streets.length]}`;
      const el = K.div(layer, `padding:.45em .7em;background:rgba(6,8,12,.72);border:1px solid rgba(214,207,191,.35);white-space:nowrap`, `<div style="${MONO_DIM}">${addr}</div><div class="pct" style="${NUM};font-size:${big ? 2.6 : 1.5}em;margin-top:.15em">${pct}%</div>`);
      return { i, L, el, pct, addr }; };
    const svg = K.svgLayer(layer); const out = { ...b };
    const pin = (tg, cam, k, dx = 40, dy = -110) => { const [x, y] = toScr([tg.L.x, tg.L.h + 2, tg.L.z], cam); place(tg.el, x, y, dx, dy); tg.el.style.opacity = k; if (!tg.ln) { tg.ln = svg.make('polyline', { fill: 'none', stroke: '#d6cfbf', 'stroke-width': 1.2 }); tg.dot = svg.make('circle', { r: 3.5, fill: SODIUM_CSS }); }
      tg.ln.setAttribute('points', `${x},${y} ${x + dx},${y + dy + 40}`); tg.ln.setAttribute('opacity', k * 0.8); tg.dot.setAttribute('cx', x); tg.dot.setAttribute('cy', y); tg.dot.setAttribute('opacity', k); return [x, y]; };
    const focus = lots.findIndex(L => Math.abs(L.x - 13) < 6 && Math.abs(L.z - 12) < 6 && !L.side) >= 0 ? lots.findIndex(L => Math.abs(L.x - 13) < 6 && Math.abs(L.z - 12) < 6 && !L.side) : 0;
    const F = lots[focus];
    if (mode === 'night') {
      const move = C.path([{ pos: [-40, 150, 70], look: [-10, 0, 0], mm: 40 }, { pos: [10, 140, 55], look: [20, 0, -8], mm: 40 }], { accel: 0.3, decel: 0.3, float: 0.12 });
      out.update = (t, p) => { move(camera, p, t); };
      return out;
    }
    if (mode === 'scores') {
      const cap = caption(layer, P0.caption, 'left:6%;top:8%');
      const pcts = [87, 64, 92, 41, 78, 55, 83, 69, 96, 72];
      // pick ten houses spread across the frame the camera will hold
      const moveS = C.path([{ pos: [-70, 95, 120], look: [10, 0, 10], mm: 32 }, { pos: [-40, 80, 115], look: [20, 0, 4], mm: 34 }]); moveS(camera, 0.6, 0); camera.updateMatrixWorld();
      const slots = [[420, 330], [880, 260], [1360, 300], [620, 520], [1120, 480], [1560, 560], [380, 760], [860, 720], [1300, 780], [1700, 380]];
      const scr = lots.map(L => toScr([L.x, L.h, L.z], camera));
      const picks = slots.map(([sx, sy]) => { let best = 0, bd = 1e9; scr.forEach(([x, y], i) => { const d = (x - sx) ** 2 + (y - sy) ** 2; if (d < bd) { bd = d; best = i; } }); return best; });
      const tags = picks.map((i, k2) => tagOf(i, pcts[k2]));
      const move = C.path([{ pos: [-70, 95, 120], look: [10, 0, 10], mm: 32 }, { pos: [-40, 80, 115], look: [20, 0, 4], mm: 34 }], { accel: 0.3, decel: 0.4, float: 0.1 });
      out.update = (t, p) => { move(camera, p, t); camera.updateMatrixWorld(); if (cap) cap.style.opacity = K.range(t, 0.4, 1.1);
        tags.forEach((tg, k2) => { const t0 = 0.6 + k2 * Math.min(0.45, (T - 1.5) / tags.length); const [x, y] = toScr([tg.L.x, tg.L.h, tg.L.z], camera); const vis = x > 80 && x < 1840 && y > 160 && y < 1000; pin(tg, camera, vis ? K.range(t, t0, t0 + 0.3) : 0, 30, -80); }); };
      return out;
    }
    const hero = tagOf(focus, 87, true); sod.position.set(F.x - 8, 7, F.z + 7); sod.intensity = 60; sod.distance = 25; sod.decay = 2;
    if (mode === 'one') {
      const move = C.path([{ pos: [F.x - 60, 140, F.z + 90], look: [F.x, 0, F.z], mm: 35 }, { pos: [F.x - 28, 62, F.z + 52], look: [F.x, 2, F.z], mm: 40 }, { pos: [F.x - 18, 34, F.z + 36], look: [F.x, 2.5, F.z], mm: 45 }], { accel: 0.25, decel: 0.55, float: 0.05 });
      const t0 = T * 0.45, t1 = T * 0.9;
      out.update = (t, p) => { move(camera, p, t); camera.updateMatrixWorld(); pin(hero, camera, K.range(t, t0 - 0.5, t0), 60, -170); hero.el.querySelector('.pct').textContent = `${Math.round(87 * K.outCubic(K.range(t, t0, t1)))}%`; };
      return out;
    }
    // ring: a red marker loop chooses the address
    const move = C.path([{ pos: [F.x + 20, 36, F.z + 34], look: [F.x, 2.5, F.z], mm: 50 }, { pos: [F.x + 17, 32, F.z + 30], look: [F.x, 2.5, F.z], mm: 52 }], { accel: 0.3, decel: 0.5, float: 0.03 });
    move(camera, 0.6, T * 0.6); camera.updateMatrixWorld(); const [hx, hy] = toScr([F.x, F.h + 2, F.z], camera);
    const loop = K.markerLoop(svg, { cx: hx + 60 + 80, cy: hy - 170 + 42, rx: 140, ry: 78, seed: 3 });
    out.update = (t, p) => { move(camera, p, t); camera.updateMatrixWorld(); const [x, y] = pin(hero, camera, 1, 60, -170); hero.el.querySelector('.pct').textContent = '87%'; loop.setAttribute('transform', `translate(${x - hx},${y - hy})`); loop.draw(K.inOut(K.range(t, 0.15, Math.min(T - 0.2, 1.1)))); };
    return out;
  }
  const SODIUM_CSS = '#ffa860', RED_CSS = '#e0241b';

  // ================================================================ POLICE
  function police(ctx, shot) {
    const P0 = shot.params; const mode = P0.mode ?? 'street'; const T = shot.duration;
    if (mode === 'council') return council(ctx, shot);
    if (mode === 'door') return door(ctx, shot);
    const b = base(ctx, { floor: null, fog: 0x05070c, density: 0.022, fov: 30 }); const { scene, camera, layer } = b; const r = K.rng(1718);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V3(1, 1, 1);
    // ---- wet, cracked asphalt. Puddles are glossy and see-through to a mirrored world of light under the road.
    const RW = 1024, RH = 256, RX = 40; // texture covers 40 m x 9 m, repeated along the street
    const pud = []; for (let i = 0; i < 40; i++) pud.push([r() * RW, r() * RH, 14 + r() * 60, 6 + r() * 20, r() * 3]);
    const drawPuddles = (x, inside, outside) => { x.fillStyle = outside; x.fillRect(0, 0, RW, RH); for (const [px, py, rx, ry, a] of pud) for (const dx of [-RW, 0, RW]) { x.fillStyle = inside; x.beginPath(); x.ellipse(px + dx, py, rx, ry, a * 0.15, 0, 7); x.fill(); } };
    const crack = (x) => { const rr = K.rng(9); x.lineCap = 'round'; for (let i = 0; i < 60; i++) { let px = rr() * RW, py = rr() * RH, ang = rr() * 6.28; x.strokeStyle = `rgba(0,0,0,${0.35 + rr() * 0.4})`; x.lineWidth = 0.6 + rr() * 1.6; x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 14; k++) { ang += (rr() - 0.5) * 1.1; px += Math.cos(ang) * 9; py += Math.sin(ang) * 9; x.lineTo(px, py); } x.stroke(); }
      for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(${20 + rr() * 20},${20 + rr() * 20},${22 + rr() * 20},.55)`; x.fillRect(rr() * RW, rr() * RH, 40 + rr() * 140, 20 + rr() * 60); } };
    const colT = canvasTex(RW, RH, (x) => { x.fillStyle = '#0c0d0f'; x.fillRect(0, 0, RW, RH); const rr = K.rng(4); for (let i = 0; i < 9000; i++) { const v = 8 + rr() * 18; x.fillStyle = `rgb(${v},${v},${v + 2})`; x.fillRect(rr() * RW, rr() * RH, 1 + rr() * 2, 1 + rr() * 2); } crack(x);
      x.globalAlpha = 0.5; drawPuddles(x, '#040506', 'rgba(0,0,0,0)'); x.globalAlpha = 1; x.strokeStyle = 'rgba(200,200,200,.18)'; x.setLineDash([60, 40]); x.lineWidth = 4; x.beginPath(); x.moveTo(0, RH / 2); x.lineTo(RW, RH / 2); x.stroke(); });
    // roughness in G, metalness in B: puddles are mirror-smooth, the dry asphalt dull
    const roughT = canvasTex(RW, RH, (x) => { drawPuddles(x, 'rgb(0,6,255)', 'rgb(0,150,12)'); crack(x); });
    const maskT = canvasTex(RW, RH, (x) => { drawPuddles(x, 'rgb(255,255,255)', 'rgb(0,0,0)'); x.filter = 'blur(5px)'; x.drawImage(x.canvas, 0, 0); });
    for (const t of [colT, roughT, maskT]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(160 / RX, 1); }
    roughT.colorSpace = maskT.colorSpace = THREE.NoColorSpace;
    const road = mesh(new THREE.PlaneGeometry(160, 9), new THREE.MeshStandardMaterial({ map: colT, color: 0x3c3c3c, roughnessMap: roughT, metalnessMap: roughT, roughness: 1, metalness: 1, envMapIntensity: 1.5 }), [20, 0, 0], scene); road.rotation.x = -Math.PI / 2;
    // puddles: a real planar reflection (half resolution) shown only through the puddle mask
    const puddleShader = { name: 'Puddle', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, tMask: { value: maskT }, uRep: { value: new THREE.Vector2(160 / RX, 1) } },
      vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vUv2; void main(){ vUv = textureMatrix * vec4(position, 1.0); vUv2 = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform sampler2D tMask; uniform vec2 uRep; varying vec4 vUv; varying vec2 vUv2;
        void main(){ float m = texture2D(tMask, vUv2 * uRep).g; vec2 ripple = vec2(sin(vUv2.x * 2600.0 + vUv2.y * 40.0) * 0.0005, 0.0); vec4 base = texture2DProj(tDiffuse, vUv + vec4(ripple * vUv.w, 0.0, 0.0));
          gl_FragColor = vec4(base.rgb * color, m * 0.92);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` };
    const pw = Math.round((ctx.width || 1920) / 2), ph = Math.round((ctx.height || 1080) / 2);
    const mirror = new Reflector(new THREE.PlaneGeometry(160, 9), { color: 0x9a9a9a, textureWidth: pw, textureHeight: ph, clipBias: 0.003, shader: puddleShader, multisample: 0 });
    mirror.material.transparent = true; mirror.material.depthWrite = false; mirror.rotation.x = -Math.PI / 2; mirror.position.set(20, 0.004, 0); mirror.renderOrder = 2; scene.add(mirror);
    const curbT = K.grimeTexture(14, 110); curbT.repeat.set(30, 1);
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(160, 0.16, 2.4), std(0x3a3632, { roughness: 0.5, metalness: 0.15, roughnessMap: curbT }), [20, 0.08, s * 5.7], scene); mesh(new THREE.BoxGeometry(160, 0.17, 0.22), std(0x77736c, { roughness: 0.6 }), [20, 0.085, s * 4.55], scene); }
    // ---- Creole-townhouse facades: recessed openings, trims, open shutters, iron galleries, gas lanterns
    const facadeCols = [0x8a5e50, 0x5f6e5e, 0x8f7a58, 0x56667a, 0x94786a, 0x6e5258, 0x7a7f86];
    const ironM = std(0x0a0a0a, { metalness: 0.6, roughness: 0.5 });
    const glassM = new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.08, metalness: 0.85 });
    const roomT = canvasTex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffcf8a'); g.addColorStop(0.55, '#e79a52'); g.addColorStop(1, '#6a3a1a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(60,25,10,.55)'; x.fillRect(0, 0, w * 0.22, h); x.fillRect(w * 0.78, 0, w * 0.22, h); x.fillStyle = 'rgba(40,20,10,.8)'; x.fillRect(w * 0.47, 0, w * 0.06, h); x.fillRect(0, h * 0.48, w, h * 0.04); });
    const litM = new THREE.MeshBasicMaterial({ map: roomT, color: 0xbfbfbf });
    const pieces = { glass: [], lit: [], jamb: [], head: [], shut: [], door: [], bal: [], post: [] };
    const winGlow = glowPoints(ctx, 220, { fog: 0.018, minPx: 2 }); scene.add(winGlow); let wg = 0;
    const streakTex = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.12, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'destination-in'; const g2 = x.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(0.5, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.fillRect(0, 0, w, h); });
    const streak = (x, y, z, color, s = 1, op = 0.5) => { if (op >= 0) return { position: V3(), material: {} }; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: streakTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); sp.center.set(0.5, 1); sp.position.set(x, -0.02, z); sp.scale.set(0.9 * s, Math.max(1.5, y * 0.9) * s, 1); sp.renderOrder = 0; scene.add(sp); return sp; };
    const lanterns = [];
    for (const side of [-1, 1]) { let x = -40; let i = 0;
      while (x < 80) { const w = 6 + r() * 3, h = 7 + Math.floor(r() * 2) * 3.4; const zf = side * 7.0; const z = zf + side * 1.0; const col = facadeCols[(i * 3 + (side > 0 ? 2 : 0)) % facadeCols.length];
        mesh(new THREE.BoxGeometry(w - 0.06, h, 2), std(col, { roughness: 0.9 }), [x + w / 2, h / 2, z], scene);
        mesh(new THREE.BoxGeometry(w, 0.45, 2.35), std(0x2a2622, { roughness: 0.8 }), [x + w / 2, h + 0.1, z], scene);       // cornice
        mesh(new THREE.BoxGeometry(w - 0.06, 0.6, 2.1), std(0x3a332c, { roughness: 0.9 }), [x + w / 2, 0.3, z], scene);       // plinth
        const floors = Math.round(h / 3.4), cols = w > 7.5 ? 3 : 2;
        for (let f = 0; f < floors; f++) for (let wi = 0; wi < cols; wi++) {
          const wx = x + w * (wi + 0.5) / cols, wy = f === 0 ? 1.55 : f * 3.4 + 1.75, hh = f === 0 ? 2.7 : 2.3, ww = f === 0 ? 1.15 : 1.0; const lit = r() < (f === 0 ? 0.22 : 0.17);
          const fz = zf - side * 0.0; // facade front plane
          // the opening is set back 0.22 m: glass at the back, jambs and head form the reveal
          (lit ? pieces.lit : f === 0 && wi === 0 ? pieces.door : pieces.glass).push([wx, wy, fz + side * 0.22 - side * 0.0, ww, hh]);
          pieces.jamb.push([wx - ww / 2 - 0.06, wy, fz, 0.14, hh + 0.1]); pieces.jamb.push([wx + ww / 2 + 0.06, wy, fz, 0.14, hh + 0.1]);
          pieces.head.push([wx, wy + hh / 2 + 0.12, fz, ww + 0.5, 0.22]); if (f > 0) pieces.head.push([wx, wy - hh / 2 - 0.06, fz, ww + 0.36, 0.1]);
          if (r() < 0.75) { const open = r() < 0.65; for (const sx of [-1, 1]) pieces.shut.push(open ? [wx + sx * (ww / 2 + 0.36), wy, fz - side * 0.06, 0.5, hh, sx * side * 1.35] : [wx + sx * ww / 4, wy, fz - side * 0.05, ww / 2 - 0.02, hh, 0]); }
          if (lit && wg < 220) { winGlow.set(wg++, [wx, wy, fz - side * 0.4], colArr(0xffb070, 0.28), 2.4); streak(wx, wy, fz - side * 0.5, 0xffb070, 0.9, 0.22); } }
        // gas lantern by the door, on a bracket
        if (r() < 0.7) { const lx = x + w / cols * 0.5 + 0.95, ly = 2.6; lanterns.push([lx, ly, zf - side * 0.35, side]); }
        // wrought-iron gallery over the sidewalk: slab, railing, cast-iron posts to the kerb
        if (r() < 0.8) { const gy = 3.6, gz = zf - side * 2.55; mesh(new THREE.BoxGeometry(w - 0.1, 0.14, 2.7), std(0x1c1a18), [x + w / 2, gy, zf - side * 1.3], scene);
          for (let k = 0; k < Math.floor(w / 0.16); k++) pieces.bal.push([x + 0.1 + k * 0.16, gy + 0.55, gz]); pieces.bal.push(null);
          mesh(new THREE.BoxGeometry(w - 0.1, 0.06, 0.08), ironM, [x + w / 2, gy + 1.08, gz], scene); mesh(new THREE.BoxGeometry(w - 0.1, 0.05, 0.05), ironM, [x + w / 2, gy + 0.12, gz], scene);
          for (let k = 0; k <= 2; k++) pieces.post.push([x + 0.25 + k * (w - 0.5) / 2, gy / 2, gz]);
          if (h > 9) { const gy2 = gy + 3.4, gz2 = zf - side * 1.1; mesh(new THREE.BoxGeometry(w - 0.1, 0.12, 1.1), std(0x1c1a18), [x + w / 2, gy2, zf - side * 0.55], scene);
            for (let k = 0; k < Math.floor(w / 0.16); k++) pieces.bal.push([x + 0.1 + k * 0.16, gy2 + 0.55, gz2]); mesh(new THREE.BoxGeometry(w - 0.1, 0.06, 0.08), ironM, [x + w / 2, gy2 + 1.08, gz2], scene); } }
        x += w; i++; } }
    // build the instanced pieces
    const inst = (geo, mat, list, place) => { const items = list.filter(Boolean); const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length)); items.forEach((it, k) => { place(it); im.setMatrixAt(k, m4); }); im.count = items.length; im.castShadow = true; im.receiveShadow = true; scene.add(im); return im; };
    const faceY = (z) => (z > 0 ? Math.PI : 0);
    inst(new THREE.PlaneGeometry(1, 1), glassM, pieces.glass, ([x, y, z, w, h]) => { q.setFromEuler(e.set(0, faceY(z), 0)); m4.compose(V3(x, y, z), q, V3(w, h, 1)); });
    inst(new THREE.PlaneGeometry(1, 1), std(0x2a1a12, { roughness: 0.55 }), pieces.door, ([x, y, z, w, h]) => { q.setFromEuler(e.set(0, faceY(z), 0)); m4.compose(V3(x, y, z), q, V3(w, h, 1)); });
    inst(new THREE.PlaneGeometry(1, 1), litM, pieces.lit, ([x, y, z, w, h]) => { q.setFromEuler(e.set(0, faceY(z), 0)); m4.compose(V3(x, y, z), q, V3(w, h, 1)); }).castShadow = false;
    const trimM = std(0xcfc6b4, { roughness: 0.8 });
    inst(new THREE.BoxGeometry(1, 1, 0.5), trimM, pieces.jamb, ([x, y, z, w, h]) => { m4.compose(V3(x, y, z - Math.sign(z) * 0.0), q.identity(), V3(w, h, 1)); });
    inst(new THREE.BoxGeometry(1, 1, 0.56), trimM, pieces.head, ([x, y, z, w, h]) => { m4.compose(V3(x, y, z), q.identity(), V3(w, h, 1)); });
    const shutG = new THREE.BoxGeometry(1, 1, 0.05); const sp = shutG.attributes.position; // louvres read through a striped map
    const louvT = canvasTex(64, 256, (x, w, h) => { x.fillStyle = '#2f4a3c'; x.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 9) { x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(4, y, w - 8, 3); } x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 6; x.strokeRect(0, 0, w, h); });
    inst(shutG, new THREE.MeshStandardMaterial({ map: louvT, roughness: 0.7 }), pieces.shut, ([x, y, z, w, h, rot]) => { q.setFromEuler(e.set(0, rot, 0)); m4.compose(V3(x, y, z), q, V3(w, h, 1)); });
    inst(new THREE.BoxGeometry(0.025, 0.95, 0.025), ironM, pieces.bal, ([x, y, z]) => { m4.compose(V3(x, y, z), q.identity(), one); }).castShadow = false;
    inst(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 8), ironM, pieces.post, ([x, y, z]) => { m4.compose(V3(x, y, z), q.identity(), one); });
    // gas lanterns: a small glazed box with a warm flame, glow and a reflection streak
    const lanG = glowPoints(ctx, lanterns.length * 2, { fog: 0.016, minPx: 2 }); scene.add(lanG);
    const lanM = new THREE.MeshBasicMaterial({ color: 0xffc070 });
    lanterns.forEach(([x, y, z, side], k) => { mesh(new THREE.BoxGeometry(0.22, 0.34, 0.22), lanM, [x, y, z], scene).castShadow = false; mesh(new THREE.ConeGeometry(0.2, 0.18, 4), ironM, [x, y + 0.26, z], scene).rotation.y = Math.PI / 4;
      mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), ironM, [x, y + 0.1, z + side * 0.2], scene);
      lanG.set(k * 2, [x, y, z], colArr(0xffc070, 1.6), 0.22); lanG.set(k * 2 + 1, [x, y, z], colArr(0xffa860, 0.3), 1.6); streak(x, y, z - side * 0.2, 0xffb070, 0.6, 0.5); });
    lanG.commit();
    // sodium streetlights
    const lampXs = [-18, -2, 14, 30, 46, 62]; const heads = glowPoints(ctx, lampXs.length * 2, { fog: 0.01 }); scene.add(heads);
    lampXs.forEach((x, i) => { const z = (i % 2 ? 1 : -1) * 4.9; mesh(new THREE.CylinderGeometry(0.08, 0.11, 6.2, 8), ironM, [x, 3.1, z], scene); mesh(new THREE.BoxGeometry(0.12, 0.08, 1.2), ironM, [x, 6.1, z * 0.88], scene);
      mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.45, 8), ironM, [x, 5.85, z * 0.78], scene);
      heads.set(i * 2, [x, 5.6, z * 0.78], colArr(SODIUM, 2), 0.35); heads.set(i * 2 + 1, [x, 5.6, z * 0.78], colArr(SODIUM, 0.35), 2.2); streak(x, 5.6, z * 0.78, SODIUM, 1.4, 0.95); });
    heads.commit();
    [0, 1, 2, 3].forEach(i => { const x = lampXs[i], z = (i % 2 ? 1 : -1) * 4.9 * 0.78; const l = new THREE.SpotLight(SODIUM, 1000, 26, 1.05, 0.8, 1.6); l.position.set(x, 5.6, z); l.target.position.set(x, 0, z * 0.4); if (i === 2) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); } scene.add(l, l.target); });
    K.lightShaft(scene, { pos: [lampXs[1], 5.6, 4.9 * 0.78], target: [lampXs[1], 0, 1.6], radius: 3.6, color: SODIUM, intensity: 0.05 });
    K.lightShaft(scene, { pos: [lampXs[2], 5.6, -4.9 * 0.78], target: [lampXs[2], 0, -1.6], radius: 3.6, color: SODIUM, intensity: 0.04 });
    scene.add(new THREE.HemisphereLight(0x2a3a5a, 0x050505, 0.35));
    C.sky(scene, 'moonless_golf', { background: false, intensity: 0.35 });
    // ---- patrol car: an extruded sedan profile with real wheel arches, a glass cabin and a slim light bar
    const car = new THREE.Group(); car.position.set(mode === 'turn' ? 20 : 34, 0, 2.3); car.rotation.y = mode === 'turn' ? Math.PI * 0.93 : Math.PI; scene.add(car);
    const arch = (s, cx, R0) => { for (let k = 0; k <= 12; k++) { const a = Math.PI - k / 12 * Math.PI; s.lineTo(cx + Math.cos(a) * R0 * (cx > 0 ? -1 : -1) * -1, 0.34 + Math.sin(a) * R0); } };
    const prof = new THREE.Shape(); prof.moveTo(-2.42, 0.36);
    prof.lineTo(-2.46, 0.62); prof.quadraticCurveTo(-2.47, 0.9, -2.3, 0.95); prof.lineTo(-1.2, 1.0); prof.lineTo(1.0, 0.98); prof.quadraticCurveTo(2.25, 0.9, 2.42, 0.8); prof.quadraticCurveTo(2.5, 0.6, 2.44, 0.38);
    prof.lineTo(1.98, 0.34); for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI; prof.lineTo(1.5 + Math.cos(a) * 0.46, 0.34 + Math.sin(a) * 0.46); }
    prof.lineTo(-1.02, 0.34); for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI; prof.lineTo(-1.5 + Math.cos(a) * 0.46, 0.34 + Math.sin(a) * 0.46); } prof.lineTo(-2.42, 0.34);
    const W2 = 1.66; const bodyG = new THREE.ExtrudeGeometry(prof, { depth: W2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: 4, curveSegments: 8 }).translate(0, 0, -W2 / 2);
    const paint = new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.22, metalness: 0.6 }); const body = mesh(bodyG, paint, [0, 0, 0], car);
    const doorBand = mesh(new THREE.BoxGeometry(2.0, 0.34, W2 + 0.22), std(0xb8bcc2, { roughness: 0.3, metalness: 0.4 }), [-0.1, 0.66, 0], car); // white doors
    const cab = new THREE.Shape(); cab.moveTo(-1.32, 0.96); cab.quadraticCurveTo(-1.05, 1.36, -0.82, 1.42); cab.lineTo(0.38, 1.44); cab.quadraticCurveTo(0.62, 1.4, 1.02, 0.96); cab.lineTo(-1.32, 0.96);
    const cabG = new THREE.ExtrudeGeometry(cab, { depth: 1.42, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10 }).translate(0, 0, -0.71);
    mesh(cabG, new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.04, metalness: 0.95 }), [0, 0, 0], car);
    mesh(new THREE.BoxGeometry(1.15, 0.04, 1.44), paint, [-0.22, 1.47, 0], car); // roof skin
    for (const z of [-0.74, 0.74]) mesh(new THREE.BoxGeometry(0.09, 0.44, 0.04), paint, [-0.18, 1.2, z], car); // B-pillars
    const tyreM = std(0x060606, { roughness: 0.9 }), hubM = std(0x8a8d92, { metalness: 0.9, roughness: 0.35 });
    for (const [x, z] of [[1.5, 0.84], [-1.5, 0.84], [1.5, -0.84], [-1.5, -0.84]]) { const w = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 24), tyreM, [x, 0.36, z], car); w.rotation.x = Math.PI / 2; const hcap = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.27, 16), hubM, [x, 0.36, z], car); hcap.rotation.x = Math.PI / 2; }
    for (const z of [-0.6, 0.6]) { mesh(new THREE.BoxGeometry(0.06, 0.12, 0.38), new THREE.MeshBasicMaterial({ color: 0xfff3dc }), [2.5, 0.72, z], car); mesh(new THREE.BoxGeometry(0.06, 0.12, 0.34), new THREE.MeshBasicMaterial({ color: 0x7a0e0a }), [-2.5, 0.8, z], car); }
    mesh(new THREE.BoxGeometry(0.22, 0.06, 1.25), std(0x111111, { roughness: 0.4 }), [-0.28, 1.51, 0], car);
    const barL = mesh(new THREE.BoxGeometry(0.2, 0.07, 0.5), new THREE.MeshBasicMaterial({ color: 0x2f6bff }), [-0.28, 1.57, 0.3], car), barR = mesh(new THREE.BoxGeometry(0.2, 0.07, 0.5), new THREE.MeshBasicMaterial({ color: 0x2f6bff }), [-0.28, 1.57, -0.3], car);
    const beacon = new THREE.SpotLight(0x2f6bff, 0, 40, 0.42, 0.6, 1.2); car.add(beacon); beacon.position.set(-0.28, 1.6, 0); const bt = new THREE.Object3D(); car.add(bt); beacon.target = bt;
    const barGlow = glowPoints(ctx, 2, { fog: 0.01 }); scene.add(barGlow);
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(160,190,255,.7)'); g.addColorStop(1, 'rgba(40,80,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(140,170,255,.35)'; x.fillRect(w * 0.2, h / 2 - 1.5, w * 0.6, 3); }), color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false })); scene.add(flare);
    const blueStreak = streak(0, 1.6, 0, 0x2f6bff, 1.4, 0);
    const motes = K.dust(scene, { count: 600, box: [40, 7, 12], center: [10, 3.5, 0], size: 0.03, opacity: 0.35, color: 0xffd0a0 });
    const out = { ...b }; const cap = caption(layer, P0.caption, SCOPE_TOP); const src = scopeSource(layer, P0.source);
    const wp = V3(), cp = V3();
    const lightBar = (t, toCam = 0) => {
      const a = (t * 5.2) % (Math.PI * 2); const flash = 0.5 + 0.5 * Math.sign(Math.sin(t * 9));
      barL.material.color.setRGB(0.12 + 0.88 * flash * 0.4, 0.3 + 0.7 * flash * 0.7, 1); barR.material.color.setRGB(0.12 + 0.3 * (1 - flash), 0.3 + 0.5 * (1 - flash), 1);
      car.updateMatrixWorld(); camera.updateMatrixWorld();
      const sweep = V3(Math.cos(a) * 9, -1.5, Math.sin(a) * 9); const camLocal = car.worldToLocal(camera.position.clone()).sub(V3(-0.28, 1.6, 0));
      const aim = sweep.lerp(camLocal.setLength(9), toCam); bt.position.set(-0.28 + aim.x, 1.6 + aim.y, aim.z); beacon.intensity = 900;
      beacon.getWorldPosition(wp); barGlow.set(0, wp.toArray(), [0.25, 0.45, 1.6], 0.3); barGlow.set(1, wp.toArray(), [0.05, 0.12, 0.6], 2.8); barGlow.commit();
      blueStreak.position.set(wp.x, -0.02, wp.z); blueStreak.material.opacity = 0.45 + 0.3 * flash;
      const dir = bt.getWorldPosition(cp).sub(wp).normalize(); const toC = camera.position.clone().sub(wp).normalize(); const f = Math.pow(Math.max(0, dir.dot(toC)), 6);
      flare.position.copy(wp); const s = wp.distanceTo(camera.position) * (0.02 + f * 0.1); flare.scale.set(s * 2.4, s, 1); flare.material.opacity = 0.2 + 0.8 * f;
    };
    if (mode === 'street') {
      // low on the asphalt, long lens: the street stacks up, the puddles carry the light
      const move = C.path([{ pos: [-26, 0.42, -2.6], look: [30, 1.0, 1.4], mm: 75 }, { pos: [-18, 0.45, -2.2], look: [32, 1.05, 1.6], mm: 75 }, { pos: [-10, 0.5, -1.9], look: [34, 1.1, 1.8], mm: 80 }], { accel: 0.3, decel: 0.35, float: 0.006 });
      out.update = (t, p) => { motes.update(t); move(camera, p, t); lightBar(t, 0); if (cap) cap.style.opacity = K.range(t, 0.6, 1.4); if (src) src.style.opacity = K.range(t, 1.2, 2.0); };
      return scope(out);
    }
    // turn: the other kerb, still low and long; the light bar swings round to the lens
    const move = C.path([{ pos: [-16, 0.75, 3.4], look: [20, 1.2, 1.6], mm: 85 }, { pos: [-12, 0.7, 3.1], look: [20, 1.2, 1.8], mm: 95 }], { accel: 0.3, decel: 0.5, float: 0.006 });
    const tTurn = T * 0.55;
    out.update = (t, p) => { motes.update(t); move(camera, p, t); lightBar(t, K.inOut(K.range(t, tTurn, tTurn + 1.2))); if (cap) cap.style.opacity = K.range(t, 0.6, 1.4); };
    return scope(out);
  }

  function council(ctx, shot) {
    const b = base(ctx, { floor: 0x14100c, fog: 0x030303, density: 0.035, fov: 30 }); const { scene, camera, layer } = b; const r = K.rng(5);
    b.ground.material.color.set(0x2a1416); b.ground.material.roughness = 0.95; // old carpet
    const wood = std(0x2c1a10, { roughness: 0.4, metalness: 0.1 });
    // the dais: a curved bench with seven empty chairs, nameplates face the room
    const R0 = 9; for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.15; const x = Math.sin(a) * R0, z = -12 + (1 - Math.cos(a)) * R0;
      const seg = mesh(new THREE.BoxGeometry(1.45, 1.2, 0.9), wood, [x, 1.1, z], scene); seg.rotation.y = -a; mesh(new THREE.BoxGeometry(1.5, 0.06, 1.2), wood, [x, 1.72, z - 0.1], scene).rotation.y = -a;
      if (i > 0 && i < 8) { const ch = new THREE.Group(); ch.position.set(Math.sin(a) * (R0 - 1.1), 0.5, -12 - 1.1 + (1 - Math.cos(a)) * R0); ch.rotation.y = -a; scene.add(ch);
        mesh(new THREE.BoxGeometry(0.7, 0.14, 0.7), std(0x120c0a, { roughness: 0.5 }), [0, 0.5, 0], ch); mesh(new THREE.BoxGeometry(0.72, 1.3, 0.14), std(0x120c0a, { roughness: 0.45 }), [0, 1.2, -0.32], ch);
        const np = mesh(new THREE.BoxGeometry(0.6, 0.12, 0.02), std(0xb08d4a, { metalness: 1, roughness: 0.3 }), [x, 1.8, z + 0.42], scene); np.rotation.y = -a; } }
    mesh(new THREE.BoxGeometry(24, 0.5, 6), std(0x1a120c), [0, 0.25, -12.5], scene); mesh(new THREE.BoxGeometry(26, 9, 0.4), std(0x4a3020, { roughness: 0.7 }), [0, 4.5, -15.5], scene);
    // a tall window high on the left wall: the night street's sodium light rakes across the empty seats
    mesh(new THREE.PlaneGeometry(2.2, 5.5), new THREE.MeshBasicMaterial({ color: 0xffc890 }), [-11.9, 5.2, -6], scene).rotation.y = Math.PI / 2;
    for (const dz of [-0.55, 0.55]) mesh(new THREE.BoxGeometry(0.1, 5.5, 0.08), std(0x111111), [-11.85, 5.2, -6 + dz], scene);
    mesh(new THREE.BoxGeometry(0.4, 9, 30), std(0x2e2018, { roughness: 0.8 }), [-12.1, 4.5, -2], scene);
    { const sun = K.keySpot(scene, { color: SODIUM, intensity: 9000, pos: [-11.6, 6.5, -6], target: [3, 0, -2], angle: 0.42, penumbra: 0.6, shadow: 1024 }); sun.decay = 1.7;
      K.lightShaft(scene, { pos: [-11.6, 6.5, -6], target: [3, 0, -2], radius: 3.6, color: SODIUM, intensity: 0.07 }); }
    for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(0.12, 9, 0.2), std(0x24170e), [-10.5 + i * 3, 4.5, -15.2], scene);
    // papers on the centre desk
    const paperT = canvasTex(400, 520, (x, w, h) => { x.fillStyle = '#e9e2d2'; x.fillRect(0, 0, w, h); fakeText(x, w, h, { seed: 3, lines: 26 }); });
    for (let i = 0; i < 4; i++) { const pp = mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshStandardMaterial({ map: paperT, roughness: 0.9 }), [-0.3 + i * 0.18 + (r() - 0.5) * 0.1, 1.76 + i * 0.002, -12.15 + (r() - 0.5) * 0.1], scene); pp.rotation.x = -Math.PI / 2; pp.rotation.z = (r() - 0.5) * 0.5; }
    // rows of public seats
    const seatG = new THREE.BoxGeometry(0.55, 0.1, 0.5), backG = new THREE.BoxGeometry(0.55, 0.6, 0.08); const seatM = std(0x3a1a1c, { roughness: 0.8 });
    const seats = new THREE.InstancedMesh(seatG, seatM, 160), backs = new THREE.InstancedMesh(backG, seatM, 160); const m4 = new THREE.Matrix4(); let k = 0;
    for (let row = 0; row < 8; row++) for (let c = 0; c < 20; c++) { if (c === 9 || c === 10) continue; const x = (c - 9.5) * 0.66, z = -4 + row * 1.15; m4.makeTranslation(x, 0.48, z); seats.setMatrixAt(k, m4); m4.makeTranslation(x, 0.82, z + 0.25); backs.setMatrixAt(k, m4); k++; }
    seats.count = backs.count = k; seats.castShadow = backs.castShadow = true; seats.receiveShadow = true; scene.add(seats, backs);
    // one light, over the desk
    K.keySpot(scene, { color: 0xfff0dc, intensity: 2600, pos: [0.5, 9, -10], target: [0, 1.7, -12.1], angle: 0.42, penumbra: 0.8, shadow: 2048 });
    K.keySpot(scene, { color: 0xfff0dc, intensity: 260, pos: [0.5, 9, -10], target: [0, 0, -2], angle: 0.75, penumbra: 1, shadow: 0 }); // the same lamp's soft spill over the seats
    K.lightShaft(scene, { pos: [0.5, 9, -10], target: [0, 1.7, -12.1], radius: 2.6, intensity: 0.06 });
    mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.3, 24), std(0x111111, { metalness: 0.5 }), [0.5, 9.2, -10], scene);
    scene.add(new THREE.HemisphereLight(0x3a4458, 0x080505, 0.4));
    const motes = K.dust(scene, { count: 500, box: [10, 9, 8], center: [0, 4, -9], size: 0.025, opacity: 0.45, color: 0xfff0dc });
    const move = C.path([{ pos: [3.0, 2.0, 9.5], look: [0, 1.3, -12], mm: 40 }, { pos: [1.2, 2.4, 4.0], look: [0, 1.5, -12], mm: 45 }], { accel: 0.3, decel: 0.5, float: 0.01 });
    return scope({ ...b, update(t, p) { motes.update(t); move(camera, p, t); } });
  }

  function door(ctx, shot) {
    const b = base(ctx, { floor: 0x2a2620, fog: 0x020202, density: 0.05, fov: 30 }); const { scene, camera, layer } = b; const P0 = shot.params;
    b.ground.material.roughness = 0.18; b.ground.material.metalness = 0.3; const g = K.grimeTexture(7, 160); g.repeat.set(4, 20); b.ground.material.roughnessMap = g;
    const wallM = std(0x6a6458, { roughness: 0.9 });
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(0.2, 3.2, 26), wallM, [s * 1.3, 1.6, -9], scene); mesh(new THREE.BoxGeometry(0.06, 0.15, 26), std(0x2a241e), [s * 1.18, 0.08, -9], scene);
      for (let i = 0; i < 3; i++) { mesh(new THREE.BoxGeometry(0.08, 2.2, 1.0), std(0x3a2a1c, { roughness: 0.6 }), [s * 1.2, 1.1, -3 - i * 6], scene); } }
    mesh(new THREE.BoxGeometry(2.8, 0.2, 26), std(0x4a463e, { roughness: 0.95 }), [0, 3.2, -9], scene);
    for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.5, 0.04, 1.2), std(0x8a8880, { roughness: 0.5 }), [0, 3.08, -1 - i * 4.5], scene);
    // the end wall and the door
    mesh(new THREE.BoxGeometry(2.6, 3.2, 0.2), wallM, [0, 1.6, -22], scene);
    const doorG = new THREE.Group(); doorG.position.set(0, 0, -21.88); scene.add(doorG);
    mesh(new THREE.BoxGeometry(1.0, 2.15, 0.06), std(0x3b2414, { roughness: 0.45 }), [0, 1.1, 0.02], doorG);
    for (const [x, y, w, h] of [[-0.55, 1.1, 0.08, 2.3], [0.55, 1.1, 0.08, 2.3], [0, 2.28, 1.18, 0.08]]) mesh(new THREE.BoxGeometry(w, h, 0.1), std(0x2a1a10, { roughness: 0.5 }), [x, y, 0.04], doorG);
    for (const [y, h] of [[1.55, 0.7], [0.55, 0.7]]) mesh(new THREE.BoxGeometry(0.7, h, 0.02), std(0x341f12, { roughness: 0.5 }), [0, y, 0.06], doorG);
    mesh(new THREE.SphereGeometry(0.035, 12, 8), std(0xb08d4a, { metalness: 1, roughness: 0.25 }), [0.38, 1.0, 0.1], doorG);
    const plaque = mesh(new THREE.PlaneGeometry(0.34, 0.09), new THREE.MeshStandardMaterial({ map: canvasTex(512, 136, (x, w, h) => { x.fillStyle = '#a8864a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6a5228'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#1c140a'; x.font = '500 64px "Plex Mono"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PRIVATE', w / 2, h / 2 + 4); }), metalness: 0.8, roughness: 0.3 }), [0, 1.6, 0.075], doorG);
    // light under the door
    mesh(new THREE.PlaneGeometry(0.98, 0.012), new THREE.MeshBasicMaterial({ color: 0xffe0b0 }), [0, 0.006, 0.08], doorG);
    const under = new THREE.SpotLight(0xffd8a0, 12, 9, 0.5, 0.7, 1.4); under.position.set(0, 0.02, -21.8); under.target.position.set(0, 0, -16); scene.add(under, under.target);
    const plaqueL = new THREE.SpotLight(0xfff0dc, 30, 8, 0.3, 0.8, 1.5); plaqueL.position.set(0, 3.0, -19.5); plaqueL.target.position.set(0, 1.5, -21.8); plaqueL.castShadow = true; plaqueL.shadow.mapSize.set(1024, 1024); scene.add(plaqueL, plaqueL.target);
    scene.add(new THREE.HemisphereLight(0x303848, 0x050505, 0.18));
    const motes = K.dust(scene, { count: 300, box: [2.4, 3, 20], center: [0, 1.5, -12], size: 0.012, opacity: 0.4, color: 0xffe0b0 });
    const src = scopeSource(layer, P0.source);
    const move = C.path([{ pos: [0.15, 1.55, 2], look: [0, 1.3, -22], mm: 40 }, { pos: [0.05, 1.5, -12.5], look: [0, 1.3, -22], mm: 50 }], { accel: 0.35, decel: 0.5, float: 0.008 });
    return scope({ ...b, update(t, p) { motes.update(t); move(camera, p, t); if (src) src.style.opacity = K.range(t, 1.0, 1.8); } });
  }

  return { graph, silos, warroom, feed, addresses, police };
}
