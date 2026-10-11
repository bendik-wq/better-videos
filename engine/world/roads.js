// Roads: splines in ground coordinates (metres around the anchor) that cut their corridor into the
// terrain, then build a surface ribbon (lane markings, wet asphalt, sodium pools and their streaky
// reflections computed analytically from the lamp spacing) plus grass verges that blend back into
// the terrain. Routes chain road pieces with lane offsets for vehicles to drive analytically.
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE, sstep, clamp, lerp } from './core.js';
import { terrainMaterial } from './terrain.js';

// cross-section presets (metres). lanes per direction.
export const ROAD_KINDS = {
  highway: { lanes: 3, lane: 3.7, median: 12, shoulder: 3, inner: 1.2, verge: 34, smooth: 90, kind: 0, lampSpacing: 64, lampH: 13, lamp: 'median' },
  avenue: { lanes: 2, lane: 3.4, median: 3.4, shoulder: 2.4, inner: 0, verge: 0, smooth: 30, kind: 1, lampSpacing: 34, lampH: 9, lamp: 'both' },
  street: { lanes: 1, lane: 3.4, median: 0, shoulder: 2.2, inner: 0, verge: 0, smooth: 20, kind: 2, lampSpacing: 30, lampH: 8, lamp: 'both' },
  ramp: { lanes: 1, lane: 4.2, median: 0, shoulder: 2.5, inner: 0, verge: 22, smooth: 50, kind: 3, lampSpacing: 50, lampH: 11, lamp: 'right' },
  country: { lanes: 1, lane: 3.3, median: 0, shoulder: 1.0, inner: 0, verge: 14, smooth: 40, kind: 4, lampSpacing: 0, lampH: 0, lamp: 'none' },
};

// half widths: [median edge, lanes end, paved edge]
const halfOf = (k) => { const m = k.median / 2, e = m + k.inner + k.lanes * k.lane; return { m, lanesFrom: m + k.inner, lanesTo: e, edge: e + k.shoulder }; };

export function road(world, o) {
  const K = { ...ROAD_KINDS[o.kind ?? 'street'], ...o };
  const H = halfOf(K);
  // ---- centreline: centripetal Catmull-Rom through control points, resampled every `step` m
  const pts = o.points.map(p => new THREE.Vector3(p[0], 0, p[1]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const step = o.step ?? 4;
  const L0 = curve.getLength(), n = Math.max(2, Math.ceil(L0 / step) + 1);
  const sp = curve.getSpacedPoints(n - 1);
  const X = new Float64Array(n), Z = new Float64Array(n), S = new Float64Array(n), TX = new Float64Array(n), TZ = new Float64Array(n);
  for (let i = 0; i < n; i++) { X[i] = sp[i].x; Z[i] = sp[i].z; if (i) S[i] = S[i - 1] + Math.hypot(X[i] - X[i - 1], Z[i] - Z[i - 1]); }
  for (let i = 0; i < n; i++) { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1); const dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1; TX[i] = dx / l; TZ[i] = dz / l; }
  const L = S[n - 1];
  // ---- vertical profile: terrain under the centreline, smoothed (cut and fill)
  // computed lazily (first use), so area mods registered later (a city's ground plane) are included
  const HR = new Float64Array(n); let ready = false, myMod = null;
  const ensure = () => {
    if (ready) return; ready = true;
    const h0 = new Float64Array(n); for (let i = 0; i < n; i++) h0[i] = world.height(X[i], Z[i], myMod);
    const w = Math.max(1, Math.round(K.smooth / step));
    for (let i = 0; i < n; i++) { let a = 0, c = 0; for (let j = -w; j <= w; j++) { const k = clamp(i + j, 0, n - 1); const wt = 1 - Math.abs(j) / (w + 1); a += h0[k] * wt; c += wt; } HR[i] = a / c + (o.lift ?? 0); }
    if (o.heights) for (let i = 0; i < n; i++) HR[i] = o.heights(S[i], HR[i]);
  };
  // ---- spatial index for corridor queries
  const cell = 60, grid = new Map();
  for (let i = 0; i < n - 1; i++) { const kx = Math.floor(X[i] / cell), kz = Math.floor(Z[i] / cell), key = kx * 100003 + kz; (grid.get(key) ?? grid.set(key, []).get(key)).push(i); }
  const reach = H.edge + K.verge + (o.blend ?? 30);
  const R = Math.ceil(reach / cell);
  // nearest point on the polyline: { s, u (signed, + = right of travel), i, f }
  const nearest = (gx, gz, maxD = reach) => {
    const kx = Math.floor(gx / cell), kz = Math.floor(gz / cell); let best = null, bd = maxD * maxD;
    for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { const list = grid.get((kx + a) * 100003 + kz + b); if (!list) continue;
      for (const i of list) { const dx = X[i + 1] - X[i], dz = Z[i + 1] - Z[i], ll = dx * dx + dz * dz || 1; const f = clamp(((gx - X[i]) * dx + (gz - Z[i]) * dz) / ll);
        const px = X[i] + dx * f, pz = Z[i] + dz * f, d2 = (gx - px) ** 2 + (gz - pz) ** 2;
        if (d2 < bd) { bd = d2; const tl = Math.sqrt(ll); best = { i, f, s: S[i] + f * (S[i + 1] - S[i]), u: ((gx - px) * (-dz) + (gz - pz) * dx) / tl, d: Math.sqrt(d2) }; } } }
    return best;
  };
  const hAt = (s) => { ensure(); const i = Math.min(n - 2, Math.max(0, Math.floor(s / step))); let j = i; while (j < n - 2 && S[j + 1] < s) j++; while (j > 0 && S[j] > s) j--; const f = clamp((s - S[j]) / ((S[j + 1] - S[j]) || 1)); return lerp(HR[j], HR[j + 1], f); };
  // ---- terrain modifier: flatten the corridor to the road profile
  if (!o.noCut) myMod = world.addMod((gx, gz, h) => {
    const q = nearest(gx, gz); if (!q) return h;
    if ((q.s <= 0.01 || q.s >= L - 0.01) && q.d > H.edge) return h;
    const k = 1 - sstep(H.edge + 3, H.edge + K.verge + (o.blend ?? 30), Math.abs(q.u));
    return lerp(h, hAt(q.s) - (Math.abs(q.u) > H.edge + 2 ? 0.4 : 0), k);
  }, 1);
  // pose on the road: s (m), u lateral offset (m, + right of travel)
  const pose = (s, u = 0, out = {}) => {
    s = clamp(s, 0, L); let j = Math.min(n - 2, Math.floor(s / L * (n - 1))); while (j < n - 2 && S[j + 1] < s) j++; while (j > 0 && S[j] > s) j--;
    const f = clamp((s - S[j]) / ((S[j + 1] - S[j]) || 1));
    const tx = lerp(TX[j], TX[j + 1], f), tz = lerp(TZ[j], TZ[j + 1], f), tl = Math.hypot(tx, tz) || 1;
    const rx = -tz / tl, rz = tx / tl; // right of travel (x east, z south): heading (tx,tz) -> right = (-tz, tx)
    out.gx = lerp(X[j], X[j + 1], f) + rx * u; out.gz = lerp(Z[j], Z[j + 1], f); out.gz += rz * u; out.h = ready ? lerp(HR[j], HR[j + 1], f) : NaN; out.tx = tx / tl; out.tz = tz / tl; out.s = s;
    return out;
  };
  // lane centre offsets: lane 0 = innermost lane of the right-hand carriageway (+), negative = opposite direction
  const lane = (i) => { const k = Math.abs(i) - (i < 0 ? 1 : 0); const u = H.lanesFrom + (k + 0.5) * K.lane; return i < 0 ? -u : u; };
  const api = { kind: o.kind ?? 'street', K, H, L, n, X, Z, S, get HR() { ensure(); return HR; }, pose: (s, u, out) => { ensure(); return pose(s, u, out); }, poseXZ: pose, nearest, hAt, lane, name: o.name, lamps: [], ensure };
  // ---- lamps (collected; the world builds them instanced)
  if (K.lampSpacing > 0 && K.lamp !== 'none' && o.lamps !== false) {
    const from = o.lampFrom ?? 0, to = o.lampTo ?? L, spacing = K.lampSpacing, ph = o.lampPhase ?? spacing / 2;
    const rows = K.lamp === 'median' ? [0] : K.lamp === 'right' ? [H.edge + 0.6] : [-(H.edge + 0.6), H.edge + 0.6];
    for (const u of rows) for (let s = ph + (u < 0 ? spacing / 2 : 0); s < L; s += spacing) {
      if (s < from || s > to) continue;
      const p = pose(s, u); api.lamps.push({ gx: p.gx, gz: p.gz, h: NaN, road: api, s, dir: u === 0 ? 0 : Math.sign(u), tx: p.tx, tz: p.tz, H: K.lampH, double: u === 0 });
    }
    api.lampRows = rows; api.lampSpacing = spacing; api.lampPhase = ph; api.lampFrom = from; api.lampTo = to;
  }
  if (o.register !== false) world.roads.push(api);
  return api;
}

// ---------------------------------------------------------------- road material
// One shared material for every road surface; per-road parameters ride on vertex attributes so a
// whole city of street segments is a single draw call.
//   aRoad  = (kind, laneW, lanes, len)        aHalf = (median/2, lanesFrom, lanesTo, edge)
//   aLamp  = (spacing, phase, height, rows)   aLampU = (row0 u, row1 u, from, to)
export function roadMaterial(world) {
  return world._roadMat ??= worldMaterial(world.U, {
    uniforms: { uWet: { value: world.opts.wet ?? 0.6 } },
    vertex: /* glsl */`
      attribute vec2 aSU; attribute vec3 aT; attribute vec4 aRoad, aHalf, aLamp, aLampU;
      varying vec3 vRel, vLocal, vT, vN; varying vec2 vSU; flat varying vec4 fRoad, fHalf, fLamp, fLampU;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin;
        local.y = mix(local.y, flatY(local) + .6, uFlat); wp.y = local.y - uOrigin.y;
        vRel = wp.xyz; vLocal = local; vSU = aSU; vT = aT; vN = upAt(local);
        fRoad = aRoad; fHalf = aHalf; fLamp = aLamp; fLampU = aLampU;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragment: /* glsl */`
      uniform float uWet;
      varying vec3 vRel, vLocal, vT, vN; varying vec2 vSU; flat varying vec4 fRoad, fHalf, fLamp, fLampU;
      float band(float x, float a, float b) { float fw = fwidth(x) * .75; return smoothstep(a - fw, a + fw, x) * (1. - smoothstep(b - fw, b + fw, x)); }
      float dash(float s, float on, float per) { float fw = fwidth(s) * .75; float x = mod(s, per); return smoothstep(0., fw, x) * (1. - smoothstep(on - fw, on + fw, x)); }
      void main() {
        float kind = fRoad.x, laneW = fRoad.y, lanes = fRoad.z, len = fRoad.w;
        float s = vSU.x, u = vSU.y, au = abs(u);
        vec3 n = normalize(vN);
        float n1 = texture(uNoise, vec2(s, u) / 9.).g, n2 = texture(uNoise, vec2(s, u * 3.) / 180.).r, n3 = texture(uNoise, vec2(s, u) / 1.3).a;
        float lanePos = fract((au - fHalf.y) / laneW);
        float track = smoothstep(.12, .25, abs(lanePos - .5)) * step(fHalf.y, au) * step(au, fHalf.z);
        vec3 alb = vec3(.055, .055, .058) * (.75 + .35 * n2 + .15 * n3) * mix(.8, 1., track);
        float ink = 0.; vec3 inkCol = vec3(.75, .74, .7);
        bool cut = kind > 4.5;  // city segments: ends at junctions
        float k = kind < -.5 ? 9. : mod(kind, 5.);  // -1 = plain asphalt (junctions)
        float endFade = cut ? smoothstep(9., 12., s) * smoothstep(9., 12., len - s) : 1.;
        if (k < .5) { // highway: concrete median, edge lines, dashed lanes
          alb = mix(alb, vec3(.16, .155, .15) * (.8 + .3 * n1), step(au, fHalf.x));
          ink += band(au, fHalf.y + .05, fHalf.y + .2) + band(au, fHalf.z - .1, fHalf.z + .05);
          for (int i = 1; i < 4; i++) { if (float(i) >= lanes) break; float c = fHalf.y + float(i) * laneW; ink += band(au, c - .08, c + .08) * dash(s, 3.05, 12.2); }
        } else if (k < 1.5) { // avenue: double yellow, lane dashes, edge
          float dy = fHalf.x < .5 ? band(au, .1, .22) : band(au, fHalf.x - .2, fHalf.x - .08);
          inkCol = mix(inkCol, vec3(.8, .58, .18), step(.01, dy)); ink += dy * endFade;
          for (int i = 1; i < 3; i++) { if (float(i) >= lanes) break; float c = fHalf.y + float(i) * laneW; ink += band(au, c - .07, c + .07) * dash(s, 3.05, 12.2) * endFade; }
          ink += band(au, fHalf.z - .08, fHalf.z + .06) * endFade;
        } else if (k < 2.5) { // street: dashed centre
          ink += band(au, -.06, .06) * dash(s, 3.05, 9.) * endFade;
        } else if (k < 3.5) { // ramp: solid edges
          ink += band(au, fHalf.z - .12, fHalf.z + .02) + band(u, -fHalf.z - .02, -fHalf.z + .12);
        } else if (k < 4.5) { ink += band(au, -.06, .06) * dash(s, 3., 12.); }
        if (cut) { float cw = (1. - step(7.5, s)) * step(3., s) + (1. - step(7.5, len - s)) * step(3., len - s); ink += cw * step(.5, fract(u / 1.2)) * step(au, fHalf.w - .6) * step(.5, len - 16.); }
        ink = clamp(ink, 0., 1.) * (.75 + .25 * n1);
        alb = mix(alb, inkCol * .6, ink);
        vec3 col = alb * lightDiffuse(n, vLocal) + alb * headlights(vLocal, n) * 1.5;
        vec3 v = normalize(-vRel); vec3 rf = reflect(-v, n);
        float fres = .04 + .96 * pow(1. - max(dot(n, v), 0.), 5.);
        float wet = uWet * (.55 + .45 * n2) * (1. - ink * .6);
        // wet asphalt: the sky in puddles and damp patches, not a uniform mirror
        float puddle = smoothstep(.45, .7, texture(uNoise, vec2(s, u) / 23. + .5).r) * .8 + .2;
        vec3 rsky = mix(uHorizon, uZenith, clamp(dot(rf, n) * 2., 0., 1.)) + uGlow * .15 + uCityGlow * .12;
        col += rsky * fres * wet * puddle * .35;
        vec3 sod = vec3(1., .52, .2);
        if (fLamp.x > 0. && uNight > .01) {
          vec3 rgt = normalize(cross(vT, n));
          for (int r = 0; r < 2; r++) {
            if (float(r) >= fLamp.w) break;
            float ru = r == 0 ? fLampU.x : fLampU.y;
            float ph = fLamp.y + (ru < 0. ? fLamp.x * .5 : 0.);
            float k0 = floor((s - ph) / fLamp.x);
            for (int j = 0; j < 2; j++) {
              float ls = ph + (k0 + float(j)) * fLamp.x;
              if (ls < fLampU.z || ls > fLampU.w) continue;
              float lu = ru == 0. ? (u > 0. ? 1.6 : -1.6) : ru - sign(ru) * 1.8;
              vec3 L = vT * (ls - s) + rgt * (lu - u) + n * fLamp.z;
              float d2 = dot(L, L); vec3 Ld = L * inversesqrt(d2);
              col += alb * sod * 38. * max(dot(n, Ld), 0.) / (d2 + 25.) * uNight;
              col += sod * pow(max(dot(rf, Ld), 0.), 24.) * wet * fres * 3.5 * uNight;
            }
          }
        }
        col = applyFog(col, vRel, vLocal);
        if (uMap > .001) { vec3 m = k < .5 ? uMapInk * .62 : (k < 1.5 || k > 2.5 && k < 3.5) ? uMapInk * .42 : uMapRoad; col = mix(col, m, uMap); }
        gl_FragColor = vec4(col, 1.);
        ${GLSL_TONE}
      }`,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
  });
}

// Ribbon geometry over u columns. heightOf(i, u, pose) -> height above the anchor.
export function ribbon(world, r, cols, heightOf, { lift = 0, roadAttrs = false } = {}) {
  const F = world.frame, n = r.n, nc = cols.length, N = n * nc;
  const pos = new Float32Array(N * 3), su = new Float32Array(N * 2), tan = new Float32Array(N * 3), gr = new Float32Array(N * 2);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) {
    const p = r.pose(r.S[i], cols[c]); const h = heightOf(i, cols[c], p) + lift;
    F.surface(p.gx, p.gz, h, v); const k = i * nc + c;
    pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z; su[k * 2] = r.S[i]; su[k * 2 + 1] = cols[c]; tan[k * 3] = p.tx; tan[k * 3 + 2] = p.tz; gr[k * 2] = p.gx; gr[k * 2 + 1] = p.gz;
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) for (let c = 0; c < nc - 1; c++) { const a = i * nc + c, b = a + nc; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSU', new THREE.BufferAttribute(su, 2)); g.setAttribute('aT', new THREE.BufferAttribute(tan, 3)); g.setAttribute('aGround', new THREE.BufferAttribute(gr, 2));
  g.setIndex(idx);
  if (roadAttrs) {
    const K = r.K, H = r.H, rows = r.lampRows ?? [];
    const fill = (vals) => { const a = new Float32Array(N * 4); for (let k = 0; k < N; k++) a.set(vals, k * 4); return new THREE.BufferAttribute(a, 4); };
    g.setAttribute('aRoad', fill([K.kind + (K.cutEnds ? 5 : 0), K.lane, K.lanes, r.L]));
    g.setAttribute('aHalf', fill([H.m, H.lanesFrom, H.lanesTo, H.edge]));
    g.setAttribute('aLamp', fill([r.lampSpacing ?? 0, r.lampPhase ?? 0, K.lampH, rows.length]));
    g.setAttribute('aLampU', fill([rows[0] ?? 0, rows[1] ?? 0, r.lampFrom ?? 0, r.lampTo ?? 0]));
    g.deleteAttribute('aGround');
  }
  g.computeBoundingSphere();
  return g;
}

// Geometries for a road: { surface, verges[], barrier? }. The world merges surfaces into one mesh.
export function roadGeometries(world, r) {
  const e = r.H.edge, lift = r.K.liftMesh ?? 0.25, out = { verges: [] };
  out.surface = ribbon(world, r, [-e, -e * 0.5, 0, e * 0.5, e], (i) => r.HR[i], { lift, roadAttrs: true });
  if (r.K.verge > 0) {
    const vg = r.K.verge + 8, bb = world.place?.bbox;
    for (const side of [-1, 1]) {
      const cols = side > 0 ? [e, e + 1.5, e + vg * 0.35, e + vg * 0.7, e + vg] : [-e - vg, -e - vg * 0.7, -e - vg * 0.35, -e - 1.5, -e];
      if (r.K.verges && r.K.verges !== (side > 0 ? 'right' : 'left')) continue;
      const g = ribbon(world, r, cols, (i, u, p) => { const a = Math.abs(u) - e; if (a < 2) return r.HR[i] - 0.25; const t = world.height(p.gx, p.gz); return a >= vg - 0.1 ? t : lerp(r.HR[i] - 0.6, t, sstep(2, vg * 0.8, a)); }, { lift: 0.0 });
      const gr = g.getAttribute('aGround'), uv = new Float32Array(gr.count * 2), gu = new Float32Array(gr.count * 2);
      for (let k = 0; k < gr.count; k++) { const [la, lo] = world.frame.geoOf(gr.getX(k), gr.getY(k)); gu[k * 2] = (lo + 180) / 360; gu[k * 2 + 1] = (la + 90) / 180;
        if (bb) { uv[k * 2] = (lo - bb[0]) / (bb[2] - bb[0]); uv[k * 2 + 1] = (la - bb[1]) / (bb[3] - bb[1]); } }
      g.setAttribute('aImgUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aGeoUv', new THREE.BufferAttribute(gu, 2));
      g.computeVertexNormals();
      out.verges.push(g);
    }
  }
  if (r.K.kind === 0 && r.K.barrier !== false) out.barrier = ribbonBarrier(world, r);
  return out;
}

function ribbonBarrier(world, r) {
  // Jersey barrier profile (u, h)
  const prof = [[-0.3, 0], [-0.22, 0.25], [-0.08, 0.81], [0.08, 0.81], [0.22, 0.25], [0.3, 0]];
  const F = world.frame, n = r.n, pos = [], nor = [], idx = [], v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const p = r.pose(r.S[i], 0); const rx = -p.tz, rz = p.tx;
    for (const [u, h] of prof) { F.surface(p.gx + rx * u, p.gz + rz * u, r.HR[i] + 0.25 + h, v); pos.push(v.x, v.y, v.z); nor.push(rx * Math.sign(u) * 0.8, 0.6, rz * Math.sign(u) * 0.8); }
  }
  const np = prof.length;
  for (let i = 0; i < n - 1; i++) for (let c = 0; c < np - 1; c++) { const a = i * np + c, b = a + np; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}

export function barrierMaterial(world) {
  return world._barrierMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`varying vec3 vRel, vLocal, vN; void main() { vec4 wp = modelMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin; local.y = mix(local.y, flatY(local), uFlat); wp.y = local.y - uOrigin.y; vRel = wp.xyz; vLocal = local; vN = normal; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`varying vec3 vRel, vLocal, vN; void main() { vec3 n = normalize(vN); vec3 alb = vec3(.22, .215, .2);
      vec3 col = alb * lightDiffuse(n, vLocal) + alb * headlights(vLocal, n) + alb * vec3(1., .6, .28) * .25 * uNight;
      col = applyFog(col, vRel, vLocal); col = mix(col, uMapRoad, uMap); gl_FragColor = vec4(col, 1. ); ${GLSL_TONE} }`,
  });
}

// ---------------------------------------------------------------- routes
// pieces: [{ road, from, to, lane | u }] (from > to drives backwards). Joined and smoothed so lane
// changes and ramps are curvature-continuous. Returns { L, at(s) -> { gx, gz, h, tx, tz } }.
export function route(world, pieces, { step = 2, smooth = 14 } = {}) {
  const P = [];
  for (const pc of pieces) {
    const r = pc.road, a = pc.from ?? 0, b = pc.to ?? r.L, dir = Math.sign(b - a) || 1;
    const u0 = pc.u ?? (pc.lane !== undefined ? r.lane(pc.lane) : 0), u1 = pc.u1 ?? u0;
    const len = Math.abs(b - a), m = Math.max(2, Math.ceil(len / step));
    for (let i = 0; i <= m; i++) { const s = a + (b - a) * i / m; const p = r.pose(s, lerp(u0, u1, i / m) * dir); P.push([p.gx, p.gz, p.h]); }
  }
  // dedupe + resample by arc length
  const pts = [P[0]]; for (const p of P) { const q = pts.at(-1); if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5) pts.push(p); }
  // moving-average smoothing (removes the kinks where pieces join)
  const w = Math.max(1, Math.round(smooth / step)), sm = pts.map((_, i) => { let x = 0, z = 0, h = 0, c = 0; for (let j = -w; j <= w; j++) { const k = clamp(i + j, 0, pts.length - 1), wt = 1 - Math.abs(j) / (w + 1); x += pts[k][0] * wt; z += pts[k][1] * wt; h += pts[k][2] * wt; c += wt; } return [x / c, z / c, h / c]; });
  const n = sm.length, S = new Float64Array(n); for (let i = 1; i < n; i++) S[i] = S[i - 1] + Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]);
  const L = S[n - 1];
  const at = (s, out = {}) => {
    s = clamp(s, 0, L); let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid] <= s) lo = mid; else hi = mid; }
    const f = clamp((s - S[lo]) / ((S[hi] - S[lo]) || 1));
    // tangent from a centred difference over a few metres (smooth heading)
    const a = sm[Math.max(0, lo - 2)], b = sm[Math.min(n - 1, hi + 2)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    out.gx = lerp(sm[lo][0], sm[hi][0], f); out.gz = lerp(sm[lo][1], sm[hi][1], f); out.h = lerp(sm[lo][2], sm[hi][2], f); out.tx = dx / l; out.tz = dz / l; out.s = s;
    return out;
  };
  return { L, at, points: sm, S };
}
