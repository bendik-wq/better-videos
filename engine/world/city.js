// Procedural city, deterministic by seed: a jittered street grid clipped by a noisy radius,
// avenues every n lines, blocks with sidewalks, parcels, buildings (instanced boxes whose shader
// draws floors, bays, storefronts, lit offices, crowns, roofs; antialiased to an average so wide
// aerials never shimmer), setback towers downtown, rooftop plant, parks, parking, street trees,
// lamp posts. One draw call per family. The same buildings flatten into map footprints.
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE, rng, fbm, sstep, clamp, lerp } from './core.js';
import { road } from './roads.js';

// ---------------------------------------------------------------- building material
export function buildingMaterial(world) {
  return world._bldgMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`
      attribute vec3 aSize; attribute vec4 aStyle, aSeed; attribute vec3 aCol;
      varying vec3 vRel, vLocal, vN, vON, vPm; flat varying vec3 fSize, fCol; flat varying vec4 fStyle, fSeed;
      void main() {
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin;
        float base = aSeed.z;
        float fy = flatY(local);
        local.y = mix(local.y, fy + .4 + (local.y - base) * .015, uFlat); wp.y = local.y - uOrigin.y;
        vRel = wp.xyz; vLocal = local; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vON = normal;
        vPm = position * aSize; fSize = aSize; fStyle = aStyle; fSeed = aSeed; fCol = aCol;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragment: /* glsl */`
      varying vec3 vRel, vLocal, vN, vON, vPm; flat varying vec3 fSize, fCol; flat varying vec4 fStyle, fSeed;
      void main() {
        vec3 n = normalize(vN); vec3 on = vON;
        vec3 v = normalize(-vRel); float fres = .04 + .96 * pow(1. - max(dot(n, v), 0.), 5.);
        vec3 alb = fCol; vec3 emit = vec3(0.);
        float floorH = fStyle.x, bayW = fStyle.y, winR = fStyle.z, glass = fStyle.w;
        int seed = int(fSeed.x); float dens = fSeed.y, gf = fSeed.w;
        vec3 sod = vec3(1., .6, .28);
        float facadeAvg = 0.;
        if (on.y > .5) { // roof: gravel, parapet ring, map outline
          float e = min(fSize.x * .5 - abs(vPm.x), fSize.z * .5 - abs(vPm.z));
          float par = 1. - smoothstep(.5, .9, e);
          alb = mix(vec3(.1, .1, .105) * (.8 + .4 * texture(uNoise, vPm.xz / 7.).g), alb * .8, par);
        } else if (floorH > 0.) {
          float u = (abs(on.x) > .5 ? vPm.z + fSize.z * .5 : vPm.x + fSize.x * .5);
          float face = abs(on.x) > .5 ? (on.x > 0. ? 1. : 2.) : (on.z > 0. ? 3. : 4.);
          float y = vPm.y;
          vec2 cell = vec2(u / bayW, (y - gf) / floorH);
          vec2 id = floor(cell), f = cell - id;
          vec2 fw = fwidth(cell);
          float aa = smoothstep(.25, .7, max(fw.x, fw.y));
          float mx = (1. - winR) * .5;
          vec2 w2 = smoothstep(vec2(mx, .2) - fw, vec2(mx, .2) + fw, f) * (1. - smoothstep(vec2(1. - mx, .86) - fw, vec2(1. - mx, .86) + fw, f));
          float win = w2.x * w2.y * step(gf, y) * step(y, fSize.y - 1.4);
          // window joinery: a mullion and a transom inside each opening (fade out with the pattern)
          vec2 wf = (f - vec2(mx, .2)) / vec2(1. - 2. * mx, .66);
          float join = (1. - smoothstep(.0, fw.x * 3., abs(wf.x - .5) - .012)) * step(.6, glass < .5 ? 1. : 0.) + (1. - smoothstep(.0, fw.y * 2., abs(wf.y - .7) - .02)) * .8;
          win *= 1. - clamp(join, 0., 1.) * (1. - smoothstep(.15, .35, max(fw.x, fw.y)));
          float area = (1. - 2. * mx) * .66;
          // lit: whole floors of offices plus scattered rooms
          float hf = hash2u(seed, int(id.y), 3), hw = hash2u(seed + int(face) * 7919 + int(id.x) * 31, int(id.y), 5);
          float lit = step(hf, dens * 1.3) * step(hw, .85) + step(hw, dens * .35);
          // curtains and blinds: some lit rooms glow only in the lower part, others dimly
          float cur = hash2u(seed + int(id.x) * 3, int(id.y), 8);
          lit *= cur < .2 ? smoothstep(.62, .5, f.y) : cur < .35 ? .45 : 1.;
          lit = clamp(lit, 0., 1.) * uNight;
          float tone = hash2u(seed, 1, 9);
          vec3 inner = tone < .55 ? vec3(1., .78, .52) : tone < .9 ? vec3(.85, .93, 1.) : vec3(.7, 1., .82);
          inner *= (.5 + .8 * hash2u(seed + int(id.x), int(id.y), 6)) * (1.1 - glass * .35);
          // ceiling lights read as a brighter band at the top of the window
          inner *= .8 + .5 * smoothstep(.55, .85, f.y);
          vec3 rf = reflect(-v, n);
          vec3 rsky = mix(uHorizon, uZenith, clamp(rf.y * 1.5 + .2, 0., 1.)) + uGlow * .2 * clamp(1. - rf.y * 3., 0., 1.);
          vec3 glassC = vec3(.02, .025, .03) + rsky * (.25 + .75 * fres) * (.6 + .5 * glass) + uSunCol * pow(max(dot(rf, uSunDir), 0.), 60.) * .5;
          vec3 winC = glassC + inner * lit;
          vec3 avgWin = glassC + inner * clamp(dens * .9, 0., 1.) * uNight * .8;
          // storefronts
          float shop = step(y, gf) * step(.6, y);
          // storefronts: bays 6 m wide with frames, a dark fascia above, some shuttered
          float bayS = fract(u / 6.), fu6 = fwidth(u / 6.);
          float frame = max(1. - smoothstep(.0, fu6 * 1.5 + .01, abs(bayS - .5) - .47), step(gf - 1.1, y));
          float open = step(hash2u(seed + int(face), int(u / 6.), 4), .6);
          vec3 shopIn = vec3(1., .78, .52) * .32 * (.5 + .9 * hash2u(seed + int(face), int(u / 6.), 7)) * smoothstep(.6, 2.6, y) * open;
          vec3 shopC = (glassC * .6 + shopIn * uNight) * (1. - frame) + vec3(.03) * frame;
          vec3 wallC = alb;
          // slab bands and weathering: darker at the base, a lighter cornice line at each floor
          float slabB = 1. - smoothstep(.0, fw.y * 1.5, abs(fract((y - gf) / floorH) - .02) - .03);
          alb *= (.82 + .18 * smoothstep(0., 6., y)) * (1. + .12 * slabB * (1. - aa)) * (.9 + .2 * texture(uNoise, vec2(u, y) / 37.).g);
          float wm = mix(win, area, aa);
          emit = mix(vec3(0.), mix(winC, avgWin, aa), wm) + shopC * shop * .9;
          alb = mix(alb, vec3(0.), wm) * (1. - shop * .7);
          // crown light on tall towers
          if (fSize.y > 70. && hash2u(seed, 2, 2) < .45) emit += vec3(1., .92, .8) * 1.8 * uNight * smoothstep(fSize.y - 3.5, fSize.y - 2.5, y) * (1. - smoothstep(fSize.y - 1.2, fSize.y - .8, y));
          facadeAvg = 1.;
        }
        vec3 col = alb * lightDiffuse(n, vLocal) + alb * headlights(vLocal, n) + emit;
        // LOD: beyond ~12 km a building is a few pixels; its windows already average, and from ~25 km
        // the whole city blends to a flat urban tone so roofs and plates never moire
        float far = smoothstep(12000., 30000., length(vRel));
        col = mix(col, vec3(.07, .07, .075) * lightDiffuse(upAt(vLocal), vLocal) + vec3(1., .7, .45) * .05 * uNight, far);
        // sodium bounce at street level
        col += alb * sod * .25 * uNight * exp(-max(vPm.y, 0.) / 6.) * (1. - on.y);
        col = applyFog(col, vRel, vLocal);
        if (uMap > .001) {
          vec3 m = uMapBldg * (on.y > .5 ? 1. : .7);
          if (on.y > .5) { float e = min(fSize.x * .5 - abs(vPm.x), fSize.z * .5 - abs(vPm.z)); float fw = fwidth(e); m = mix(uMapInk * .3, m, mix(smoothstep(.8, .8 + fw, e), .85, smoothstep(.5, 1.5, fw))); }
          col = mix(col, m, uMap);
        }
        gl_FragColor = vec4(col, 1.);
        ${GLSL_TONE}
      }`,
  });
}

// ---------------------------------------------------------------- plates (sidewalks, plazas, parks, parking)
function plateMaterial(world) {
  return world._plateMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`
      attribute vec3 aSize; attribute vec4 aKind;
      varying vec3 vRel, vLocal, vON, vPm; flat varying vec3 fSize; flat varying vec4 fKind;
      void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin;
        local.y = mix(local.y, flatY(local) + .3 + position.y * .1, uFlat); wp.y = local.y - uOrigin.y;
        vRel = wp.xyz; vLocal = local; vON = normal; vPm = position * aSize; fSize = aSize; fKind = aKind; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      varying vec3 vRel, vLocal, vON, vPm; flat varying vec3 fSize; flat varying vec4 fKind;
      void main() {
        vec3 n = upAt(vLocal); float kind = fKind.x;
        float e = min(fSize.x * .5 - abs(vPm.x), fSize.z * .5 - abs(vPm.z));
        vec2 p = vPm.xz; float nz = texture(uNoise, p / 23.).r;
        vec3 alb;
        if (kind < .5) { // concrete sidewalk / plaza: joints every 1.5 m, curb
          vec2 g = abs(fract(p / 1.5) - .5); vec2 fw = fwidth(p / 1.5);
          float j = 1. - min(smoothstep(.0, fw.x * 1.5, .5 - g.x), smoothstep(.0, fw.y * 1.5, .5 - g.y)) * 0.;
          float joint = max(1. - smoothstep(.47 - fw.x, .49, g.x), 1. - smoothstep(.47 - fw.y, .49, g.y));
          alb = vec3(.2, .195, .185) * (.85 + .3 * nz) * mix(.8, 1., joint);
          alb = mix(vec3(.24, .235, .22), alb, smoothstep(.2, .35, e));
        } else if (kind < 1.5) { // grass
          alb = vec3(.07, .1, .05) * (.7 + .6 * nz);
          alb = mix(vec3(.2, .195, .185), alb, smoothstep(1.6, 1.9, e));
        } else { // parking: asphalt with bay stripes
          alb = vec3(.06, .06, .062) * (.8 + .4 * nz);
          float bay = abs(fract(vPm.x / 2.7) - .5); float fw = fwidth(vPm.x / 2.7);
          float stripe = (1. - smoothstep(.46 - fw, .48, .5 - bay)) * step(2., e) * (1. - step(6.5, abs(abs(vPm.z) - fSize.z * .25)) ) ;
          alb = mix(alb, vec3(.45), stripe * .6);
          alb = mix(vec3(.2, .195, .185), alb, smoothstep(1.4, 1.7, e));
        }
        vec3 col = alb * lightDiffuse(n, vLocal) + alb * headlights(vLocal, n);
        // sodium pools along the kerb (lamps stand on the sidewalk edge)
        col += alb * vec3(1., .6, .28) * uNight * (.7 * exp(-e / 4.) * step(.5, vON.y) + .12);
        col = mix(col, vec3(.07, .07, .075) * lightDiffuse(n, vLocal) + vec3(1., .7, .45) * .05 * uNight, smoothstep(8000., 25000., length(vRel)));
        col = applyFog(col, vRel, vLocal);
        if (uMap > .001) col = mix(col, kind > .5 && kind < 1.5 ? mix(uMapLand, vec3(.08, .12, .08), .5) : uMapLand * 1.25, uMap);
        gl_FragColor = vec4(col, 1.); ${GLSL_TONE} }`,
  });
}

const PALETTE = [0x8a8378, 0x6f6a62, 0x9a8f80, 0x7c6a5c, 0x5c5450, 0x8f7a68, 0xa39886, 0x4e4e52, 0x6b5546, 0x857d74].map(h => new THREE.Color(h));

// ---------------------------------------------------------------- generator
export function city(world, o = {}) {
  const r = rng(o.seed ?? 7), F = world.frame;
  const C0 = o.center ?? [0, 0], R = o.radius ?? 1500, ang = o.angle ?? 0, ca = Math.cos(ang), sa = Math.sin(ang);
  const toG = (x, z) => [C0[0] + x * ca - z * sa, C0[1] + x * sa + z * ca];
  const DT = o.downtown ?? {}, dC = DT.at ?? C0, dR = DT.radius ?? 520, dH = DT.height ?? 190;
  const bMin = o.block?.[0] ?? 95, bMax = o.block?.[1] ?? 135, every = o.avenueEvery ?? 4;
  const seed = o.seed ?? 7;
  // ---- flatten the ground to a best-fit plane over the city (real DEM keeps its gentle tilt)
  {
    let sx = 0, sz = 0, sh = 0, sxx = 0, szz = 0, sxz = 0, sxh = 0, szh = 0, n = 0;
    for (let i = 0; i < 400; i++) { const a = i * 2.39996, d = Math.sqrt(i / 400) * R * 1.2, x = C0[0] + Math.cos(a) * d, z = C0[1] + Math.sin(a) * d, h = world.heightRaw(x, z);
      sx += x; sz += z; sh += h; sxx += x * x; szz += z * z; sxz += x * z; sxh += x * h; szh += z * h; n++; }
    const mx = sx / n, mz = sz / n, mh = sh / n, cxx = sxx / n - mx * mx, czz = szz / n - mz * mz, cxz = sxz / n - mx * mz, cxh = sxh / n - mx * mh, czh = szh / n - mz * mh;
    const det = cxx * czz - cxz * cxz || 1, b = (cxh * czz - czh * cxz) / det, c = (czh * cxx - cxh * cxz) / det;
    const plane = (x, z) => mh + b * (x - mx) + c * (z - mz);
    world.addMod((x, z, h) => { const d = Math.hypot(x - C0[0], z - C0[1]); const k = 1 - sstep(R * 1.02, R * 1.45, d); return k > 0 ? lerp(h, plane(x, z), k) : h; });
    world.cityPlane = plane;
  }
  // ---- grid lines (city frame)
  const lines = (n0) => { const L = []; let x = -R * 1.12; let i = 0; while (x < R * 1.12) { L.push({ c: x, avenue: (i - n0) % every === 0 }); x += bMin + r() * (bMax - bMin); i++; } return L; };
  const LX = lines(1), LZ = lines(2);
  const KA = { kind: 'avenue', cutEnds: true }, KS = { kind: 'street', cutEnds: true };
  const half = (l) => l.avenue ? 10.9 : 5.6;
  const avoid = o.avoid ?? [], pad = o.avoidPad ?? 12;
  const blocked = (gx, gz, extra = 0) => {
    for (const rd of avoid) { const q = rd.nearest(gx, gz, rd.H.edge + rd.K.verge + pad + extra + 40); if (q && q.d < rd.H.edge + rd.K.verge * 0.5 + pad + extra) return true; }
    return false;
  };
  const reserve = o.reserve ?? [];
  const reserved = (gx, gz, m = 0) => reserve.some(q => Math.hypot(gx - q.gx, gz - q.gz) < q.r + m);
  // ---- blocks
  const blocks = [], exists = new Map();
  for (let i = 0; i < LX.length - 1; i++) for (let j = 0; j < LZ.length - 1; j++) {
    const x0 = LX[i].c + half(LX[i]), x1 = LX[i + 1].c - half(LX[i + 1]), z0 = LZ[j].c + half(LZ[j]), z1 = LZ[j + 1].c - half(LZ[j + 1]);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, [gx, gz] = toG(cx, cz);
    const d = Math.hypot(cx, cz), lim = R * (0.72 + 0.45 * fbm(gx / 1400, gz / 1400, seed + 3, 3));
    if (d > lim) continue;
    if (blocked(gx, gz, Math.max(x1 - x0, z1 - z0) * 0.5)) continue;
    const b = { i, j, x0, x1, z0, z1, cx, cz, gx, gz }; blocks.push(b); exists.set(i * 1000 + j, b);
  }
  const has = (i, j) => exists.has(i * 1000 + j);
  // ---- street segments and junctions
  const segs = [], lamps = [], trees = [];
  const addSeg = (a, b, kind, lineIdx, axis) => {
    const [ax, az] = toG(...a), [bx, bz] = toG(...b), len = Math.hypot(bx - ax, bz - az); if (len < 6) return;
    const mid = [(ax + bx) / 2, (az + bz) / 2]; if (blocked(mid[0], mid[1])) return;
    const rd = road(world, { points: [[ax, az], [bx, bz]], ...(kind === 'avenue' ? KA : KS), noCut: true, register: false, step: Math.max(4, len / Math.ceil(len / 12)), lampPhase: 14, smooth: 4,
      lampSpacing: kind === 'avenue' ? 34 : 38, liftMesh: 0.12 });
    rd.axis = axis; rd.line = lineIdx; segs.push(rd); lamps.push(...rd.lamps);
  };
  for (let i = 0; i < LX.length; i++) for (let j = 0; j < LZ.length - 1; j++) {
    if (!(has(i - 1, j) || has(i, j))) continue;
    const l = LX[i], z0 = LZ[j].c + half(LZ[j]), z1 = LZ[j + 1].c - half(LZ[j + 1]);
    addSeg([l.c, z0], [l.c, z1], l.avenue ? 'avenue' : 'street', i, 'x');
  }
  for (let j = 0; j < LZ.length; j++) for (let i = 0; i < LX.length - 1; i++) {
    if (!(has(i, j - 1) || has(i, j))) continue;
    const l = LZ[j], x0 = LX[i].c + half(LX[i]), x1 = LX[i + 1].c - half(LX[i + 1]);
    addSeg([x0, l.c], [x1, l.c], l.avenue ? 'avenue' : 'street', j, 'z');
  }
  const junctions = [];
  for (let i = 0; i < LX.length; i++) for (let j = 0; j < LZ.length; j++) {
    if (!(has(i - 1, j - 1) || has(i, j - 1) || has(i - 1, j) || has(i, j))) continue;
    const hx = half(LX[i]), hz = half(LZ[j]); const [a0, a1] = toG(LX[i].c - hx, LZ[j].c), [b0, b1] = toG(LX[i].c + hx, LZ[j].c);
    if (blocked((a0 + b0) / 2, (a1 + b1) / 2)) continue;
    const jr = road(world, { points: [[a0, a1], [b0, b1]], kind: 'street', noCut: true, register: false, lamps: false, step: hx, liftMesh: 0.11 });
    jr.K = { ...jr.K, kind: -1, cutEnds: false }; jr.H = { m: 0, lanesFrom: 0, lanesTo: 0, edge: hz };
    junctions.push(jr);
  }
  // ---- plates, parcels, buildings
  const plates = [], bldgs = [], props = [];
  const hAt = (gx, gz) => world.height(gx, gz);
  const isDown = (gx, gz) => Math.exp(-((Math.hypot(gx - dC[0], gz - dC[1]) / dR) ** 2));
  for (const b of blocks) {
    const w = b.x1 - b.x0, d = b.z1 - b.z0, base = hAt(b.gx, b.gz);
    const down = isDown(b.gx, b.gz), dist = Math.hypot(b.cx, b.cz) / R;
    const roll = r();
    const isPark = !reserved(b.gx, b.gz, 60) && (roll < (o.parks ?? 0.05) * (1 - down) || (o.parkBlocks ?? []).some(([pi, pj]) => pi === b.i && pj === b.j));
    plates.push({ cx: b.cx, cz: b.cz, w, d, base, kind: 0 });
    const sw = 3.6, lx0 = b.x0 + sw, lx1 = b.x1 - sw, lz0 = b.z0 + sw, lz1 = b.z1 - sw;
    // street trees along the sidewalk (not downtown)
    if (down < 0.5) for (const [ax, az, bx, bz] of [[b.x0 + 1.4, b.z0 + 1.4, b.x1 - 1.4, b.z0 + 1.4], [b.x0 + 1.4, b.z1 - 1.4, b.x1 - 1.4, b.z1 - 1.4], [b.x0 + 1.4, b.z0 + 1.4, b.x0 + 1.4, b.z1 - 1.4], [b.x1 - 1.4, b.z0 + 1.4, b.x1 - 1.4, b.z1 - 1.4]]) {
      const len = Math.hypot(bx - ax, bz - az), nT = Math.floor(len / 14);
      for (let k = 1; k < nT; k++) { if (r() > 0.55) continue; const t = k / nT, [gx, gz] = toG(lerp(ax, bx, t), lerp(az, bz, t)); trees.push({ gx, gz, h: base + 0.15, size: 7 + r() * 4, kind: r() < 0.8 ? 0 : 3, tint: 0.8 + r() * 0.4 }); }
    }
    if (isPark) {
      plates.push({ cx: b.cx, cz: b.cz, w: w - 2 * sw, d: d - 2 * sw, base: base + 0.02, kind: 1 });
      const nT = Math.floor((w * d) / 260);
      for (let k = 0; k < nT; k++) { const [gx, gz] = toG(lerp(lx0 + 4, lx1 - 4, r()), lerp(lz0 + 4, lz1 - 4, r())); trees.push({ gx, gz, h: base + 0.15, size: 8 + r() * 7, kind: r() < 0.25 ? 1 : 0, tint: 0.7 + r() * 0.5 }); }
      continue;
    }
    // parcels: split along the long side; deep blocks get two rows
    const along = w >= d ? 'x' : 'z', L0 = along === 'x' ? [lx0, lx1] : [lz0, lz1], Dp = along === 'x' ? [lz0, lz1] : [lx0, lx1];
    const rows = (Dp[1] - Dp[0]) > 55 ? 2 : 1;
    for (let row = 0; row < rows; row++) {
      const q0 = lerp(Dp[0], Dp[1], row / rows), q1 = lerp(Dp[0], Dp[1], (row + 1) / rows);
      let p = L0[0];
      while (p < L0[1] - 6) {
        const pw = Math.min(L0[1] - p, (down > 0.4 ? 30 + r() * 40 : dist > 0.7 ? 12 + r() * 14 : 18 + r() * 26));
        const a = p, bb = p + pw; p = bb;
        const px0 = along === 'x' ? a : q0, px1 = along === 'x' ? bb : q1, pz0 = along === 'x' ? q0 : a, pz1 = along === 'x' ? q1 : bb;
        const pcx = (px0 + px1) / 2, pcz = (pz0 + pz1) / 2, [gx, gz] = toG(pcx, pcz);
        if (reserved(gx, gz)) { plates.push({ cx: pcx, cz: pcz, w: px1 - px0, d: pz1 - pz0, base: base + 0.03, kind: 0 }); continue; }
        if (r() < (o.parking ?? 0.07) * (1 - down * 0.8)) { plates.push({ cx: pcx, cz: pcz, w: px1 - px0, d: pz1 - pz0, base: base + 0.02, kind: 2 }); continue; }
        const set = down > 0.3 ? 0 : 0.5 + r() * 2.5;
        const fw = Math.max(5, px1 - px0 - set * 2), fd = Math.max(5, pz1 - pz0 - set * 2);
        const mid = 9 + 26 * Math.exp(-((dist / 0.55) ** 2));
        let h = mid * (0.55 + 0.9 * r()) + dH * down * Math.pow(r(), 1.6) * 1.15;
        h = Math.max(7, h);
        const glass = h > 60 ? (r() < 0.6 ? 0.6 + r() * 0.4 : r() * 0.3) : r() * 0.15;
        const floorH = glass > 0.5 ? 3.9 : h > 30 ? 3.6 : 3.3, gf = h > 20 ? 5.2 : 4.2;
        h = gf + Math.max(1, Math.round((h - gf) / floorH)) * floorH + 1.4;
        const col = PALETTE[Math.floor(r() * PALETTE.length)].clone().multiplyScalar(0.3 + r() * 0.3);
        if (glass > 0.5) col.setRGB(0.05, 0.06, 0.07);
        const style = [floorH, glass > 0.5 ? 1.5 : 2.2 + r() * 1.6, glass > 0.5 ? 0.9 : 0.42 + r() * 0.3, glass];
        const dens = (0.05 + r() * 0.2 + down * 0.1) * (glass > 0.5 ? 0.6 : 1), sd = Math.floor(r() * 1e6);
        const B = (cx, cz, w2, d2, y0, hh) => bldgs.push({ cx, cz, w: w2, d: d2, y: y0, h: hh, style, col, seed: sd, dens, gf: y0 > base + 0.5 ? -100 : gf, base });
        if (h > 75 && fw > 22 && fd > 22) { // podium + tower + crown setback
          const ph = gf + Math.round(4 + r() * 3) * floorH;
          B(pcx, pcz, fw, fd, base, ph);
          const tw = fw * (0.6 + r() * 0.25), td = fd * (0.6 + r() * 0.25), ox = (fw - tw) * (r() - 0.5) * 0.6, oz = (fd - td) * (r() - 0.5) * 0.6;
          const t2 = h * (0.72 + r() * 0.15);
          B(pcx + ox, pcz + oz, tw, td, base + ph, t2 - ph);
          B(pcx + ox, pcz + oz, tw * 0.78, td * 0.78, base + t2, h - t2);
          if (r() < 0.5) props.push({ cx: pcx + ox, cz: pcz + oz, w: 0.6, d: 0.6, y: base + h, h: 8 + r() * 14 });
        } else {
          B(pcx, pcz, fw, fd, base, h);
          // rooftop plant
          const nP = Math.floor(fw * fd / 260) + (r() < 0.6 ? 1 : 0);
          for (let k = 0; k < nP; k++) { const s1 = 1.5 + r() * 3.5, s2 = 1.5 + r() * 3.5; props.push({ cx: pcx + (r() - 0.5) * (fw - s1 - 2), cz: pcz + (r() - 0.5) * (fd - s2 - 2), w: s1, d: s2, y: base + h, h: 1 + r() * 2.2 }); }
        }
      }
    }
  }
  // ---- meshes
  const group = new THREE.Group(); group.name = 'city';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ang), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const bm = buildingMaterial(world);
  const im = new THREE.InstancedMesh(box.clone(), bm, bldgs.length);
  {
    const aSize = new Float32Array(bldgs.length * 3), aStyle = new Float32Array(bldgs.length * 4), aSeed = new Float32Array(bldgs.length * 4), aCol = new Float32Array(bldgs.length * 3);
    bldgs.forEach((b, i) => { const [gx, gz] = toG(b.cx, b.cz); F.surface(gx, gz, b.y, v); sc.set(b.w, b.h, b.d); m4.compose(v, q, sc); im.setMatrixAt(i, m4);
      aSize.set([b.w, b.h, b.d], i * 3); aStyle.set(b.style, i * 4); F.surface(gx, gz, b.base, sc); aSeed.set([b.seed, b.dens, sc.y, b.gf], i * 4); aCol.set([b.col.r, b.col.g, b.col.b], i * 3); });
    im.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3)); im.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(aStyle, 4));
    im.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); im.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
    im.frustumCulled = false; im.name = 'buildings'; group.add(im);
  }
  // rooftop plant + masts: plain boxes in the building material (floorH 0 = no windows)
  if (props.length) {
    const pm = new THREE.InstancedMesh(box.clone(), bm, props.length);
    const aSize = new Float32Array(props.length * 3), aStyle = new Float32Array(props.length * 4), aSeed = new Float32Array(props.length * 4), aCol = new Float32Array(props.length * 3);
    props.forEach((b, i) => { const [gx, gz] = toG(b.cx, b.cz); F.surface(gx, gz, b.y, v); sc.set(b.w, b.h, b.d); m4.compose(v, q, sc); pm.setMatrixAt(i, m4);
      aSize.set([b.w, b.h, b.d], i * 3); aStyle.set([0, 1, 0, 0], i * 4); aSeed.set([i, 0, v.y, 0], i * 4); aCol.set([0.2, 0.2, 0.21], i * 3); });
    pm.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3)); pm.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(aStyle, 4));
    pm.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); pm.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
    pm.frustumCulled = false; pm.name = 'roofProps'; group.add(pm);
  }
  {
    const pl = new THREE.InstancedMesh(box.clone(), plateMaterial(world), plates.length);
    const aSize = new Float32Array(plates.length * 3), aKind = new Float32Array(plates.length * 4);
    plates.forEach((b, i) => { const [gx, gz] = toG(b.cx, b.cz); F.surface(gx, gz, b.base, v); sc.set(b.w, 0.16, b.d); m4.compose(v, q, sc); pl.setMatrixAt(i, m4); aSize.set([b.w, 0.16, b.d], i * 3); aKind.set([b.kind, 0, 0, 0], i * 4); });
    pl.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3)); pl.geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(aKind, 4));
    pl.frustumCulled = false; pl.name = 'plates'; group.add(pl);
  }
  // ---- full-length lines as roads for routing: city.line('x', i) -> road (not rendered)
  const lineRoad = (axis, i) => {
    const l = axis === 'x' ? LX[i] : LZ[i], ext = R * 1.15;
    const pts = axis === 'x' ? [toG(l.c, -ext), toG(l.c, ext)] : [toG(-ext, l.c), toG(ext, l.c)];
    return road(world, { points: pts, kind: l.avenue ? 'avenue' : 'street', noCut: true, register: false, lamps: false, step: 8 });
  };
  world.lamps.push(...lamps); world.trees.push(...trees);
  for (const s of [...segs, ...junctions]) world.cityRoads.push(s);
  const api = {
    group, blocks, segs, junctions, bldgs, LX, LZ, toG, R, center: C0, angle: ang,
    line: lineRoad,
    // index of the grid line nearest to a city-frame coordinate
    nearestLine(axis, c) { const L = axis === 'x' ? LX : LZ; let bi = 0; L.forEach((l, i) => { if (Math.abs(l.c - c) < Math.abs(L[bi].c - c)) bi = i; }); return bi; },
    toCity(gx, gz) { const x = gx - C0[0], z = gz - C0[1]; return [x * ca + z * sa, -x * sa + z * ca]; },
    stats: { blocks: blocks.length, buildings: bldgs.length, segments: segs.length, lamps: lamps.length, trees: trees.length },
  };
  return api;
}

// A paved plaza / forecourt (sidewalk material) of w x d metres at ground coords, rotated by angle.
export function plaza(world, gx, gz, w, d, angle = 0, kind = 0) {
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const pl = new THREE.InstancedMesh(box, plateMaterial(world), 1); const v = new THREE.Vector3();
  world.frame.surface(gx, gz, world.height(gx, gz) + 0.02, v);
  pl.setMatrixAt(0, new THREE.Matrix4().compose(v, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle), new THREE.Vector3(w, 0.16, d)));
  box.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array([w, 0.16, d]), 3)); box.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array([kind, 0, 0, 0]), 4));
  pl.frustumCulled = false; return pl;
}
