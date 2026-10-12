// engine/sea/navy.js: warships and props for the Tanker War and today, built like ships.js (real
// proportions, haze grey, hull numbers), registered as ship kinds:
//   ffg7     Oliver Hazard Perry-class frigate (USS Stark FFG-31, USS Samuel B. Roberts FFG-58): 136 x 13.7 m,
//            long slab superstructure, Mk 13 single-arm launcher forward, STIR dome over the bridge, a tall
//            mast with the SPS-49 'bedspring', square stack, 76 mm Mk 75 gun on the deckhouse, twin hangars,
//            Phalanx on the hangar roof, flight deck aft
//   cruiser  Ticonderoga-class cruiser as built (USS Vincennes CG-49): 173 x 16.8 m, two deckhouses carrying
//            the four SPY-1 faces, twin-arm Mk 26 launchers fore and aft, 5-inch guns, two masts, two stack pairs
//   mine     moored contact mine (Hertz horns), awash
//   platform 1980s oil production platform on a four-leg jacket (derrick, crane, flare boom, helideck)
//   speedboat open fibreglass smuggler's boat (Musandam), two to three outboards, cargo
// All are pure in t (heave/pitch/roll from the waves), like every ship.
import * as THREE from 'three';
import { hullGeometry, defineKind, Ship, hullAtlas, std } from './ships.js';
import * as DT from './detail.js';
const { box, cyl, bar, sph, meshOf, paint } = DT;

function hullOf(S, o, dims, hgOpts, paintOpts) {
  const hg = hullGeometry({ ...dims, ...hgOpts });
  const atlas = hullAtlas(o, dims, paintOpts);
  const hull = new THREE.Mesh(hg.hull, std({ map: atlas.map, normalMap: atlas.normalMap, roughnessMap: atlas.roughnessMap, roughness: 1, metalness: 0.0 })); hull.castShadow = hull.receiveShadow = true; S.body.add(hull);
  S.body.add(new THREE.Mesh(hg.transom, std({ color: paintOpts.top, roughness: 0.65 })));
  return { hg, hull };
}
const deckMat = (c = 0x4b5052, seed = 3) => new THREE.MeshStandardMaterial({ map: DT.deckTexture({ color: '#' + new THREE.Color(c).getHexString(), walk: '#5c6163', L: 140, B: 14, seed, rust: 0.15, cl: false, res: 1024 }), roughness: 0.85 });

// ---------------------------------------------------------------- FFG-7
defineKind('ffg7', (o) => {
  const L = o.L ?? 136, B = 13.7, D = 9.2, T = 4.6;
  const S = new Ship('ffg7', { L, B, D, T, deckH: 9 }, { response: 0.8, ...o });
  const grey = o.grey ?? '#7d8386';
  const { hg, hull } = hullOf(S, o, { L, B, D, T }, { mid: [0.28, 0.5], entry: 1.3, run: 1.7, rake: 9, flare: 0.45, bulb: false, transom: 0.85, bilge: 2.2, sheer: 2.6, overhang: 0.5, stations: 130 },
    { top: grey, bottom: '#5a231d', boot: '#2a2c2e', hullNumber: o.number ?? '31', numberAt: 22, numberH: 3.2, numberY: 2.9, seed: o.seed ?? 31, rust: o.rust ?? 0.35, marks: false, bootH: 0.5, anchor: true, rough: 0.62 });
  const dk = new THREE.Mesh(hg.deck, deckMat(0x4b5052, o.seed ?? 31)); dk.receiveShadow = true; S.body.add(dk);
  const yd = D - T, hz = paint('navyGrey'), dark = paint('navyDark'), whites = [], greys = [], darks = [], rails = [];
  const X = (f) => -L / 2 + f * L;           // fraction of length from the stern
  // superstructure: one long two-level block from the hangars to the bridge, the bridge a level higher
  greys.push(box(X(0.70) - X(0.22), 5.4, B * 0.78, (X(0.70) + X(0.22)) / 2, yd + 2.7, 0));             // main deckhouse
  greys.push(box(X(0.70) - X(0.56), 3.0, B * 0.7, (X(0.70) + X(0.56)) / 2, yd + 6.9, 0));              // bridge level
  darks.push(box(0.3, 1.0, B * 0.66, X(0.70) + 0.1, yd + 7.3, 0));                                       // bridge windows
  greys.push(box(X(0.30) - X(0.17), 6.0, B * 0.86, (X(0.30) + X(0.17)) / 2, yd + 3.0, 0));             // twin hangars (taller, wider)
  darks.push(box(0.2, 4.5, B * 0.36, X(0.17) - 0.05, yd + 2.4, -B * 0.2), box(0.2, 4.5, B * 0.36, X(0.17) - 0.05, yd + 2.4, B * 0.2));   // hangar doors
  greys.push(box(X(0.47) - X(0.36), 2.2, B * 0.5, (X(0.47) + X(0.36)) / 2, yd + 6.5, 0));              // gun deck house
  // STIR / Mk 92 CAS dome over the bridge, the tall mast with the SPS-49 'bedspring' and the SPS-55
  const mx = X(0.585);
  whites.push(sph(1.5, X(0.66), yd + 10.8, 0, 14, 10), cyl(0.6, 0.8, 1.6, X(0.66), yd + 9.2, 0, 10));
  greys.push(bar([mx - 1.2, yd + 8.4, -1.4], [mx, yd + 22, 0], 0.22, 4), bar([mx - 1.2, yd + 8.4, 1.4], [mx, yd + 22, 0], 0.22, 4), bar([mx + 1.4, yd + 8.4, 0], [mx, yd + 22, 0], 0.22, 4));
  for (let k = 0; k < 5; k++) { const y = yd + 10 + k * 2.4; greys.push(box(0.12, 0.12, 2.6 - k * 0.45, mx - 0.4, y, 0)); }
  greys.push(box(1.6, 0.3, 2.2, mx, yd + 17.5, 0), box(1.2, 0.3, 1.6, mx, yd + 21, 0));
  darks.push(cyl(0.05, 0.05, 6, mx, yd + 25, 0, 4));
  const bed = new THREE.Mesh(DT.merge([box(0.5, 2.6, 7.2, 0, 0, 0), ...Array.from({ length: 6 }, (_, k) => box(0.12, 2.6, 0.08, 0.3, 0, -3.4 + k * 1.36))]), dark); bed.position.set(mx + 0.4, yd + 19.2, 0); bed.castShadow = true; S.body.add(bed); S.spin.push({ mesh: bed, rate: 2 * Math.PI / 5, phase: 1 });
  const s55 = new THREE.Mesh(box(0.35, 0.4, 3.0), dark); s55.position.set(mx, yd + 22.6, 0); S.body.add(s55); S.spin.push({ mesh: s55, rate: 2 * Math.PI / 3.2, phase: 0.3 });
  // the stack: a short square funnel with a raked cap
  greys.push(box(4.2, 4.8, 3.6, X(0.50), yd + 8.0, 0)); darks.push(box(4.4, 0.6, 3.8, X(0.50) - 0.2, yd + 10.6, 0));
  // 76 mm Mk 75 on its deckhouse, Phalanx on the hangar roof, Mk 13 launcher forward with its magazine ring
  greys.push(cyl(1.4, 1.7, 1.6, X(0.42), yd + 8.4, 0, 12)); darks.push(cyl(0.1, 0.12, 4.2, X(0.42) + 2.6, yd + 8.7, 0, 6, 'x'));
  whites.push(cyl(0.7, 0.7, 1.8, X(0.22), yd + 7.0, 0, 10), sph(0.75, X(0.22), yd + 8.2, 0, 10, 8)); darks.push(cyl(0.6, 0.7, 0.6, X(0.22), yd + 6.2, 0, 10));
  greys.push(cyl(2.2, 2.4, 1.2, X(0.82), yd + 0.6, 0, 16), cyl(0.7, 0.7, 1.8, X(0.82), yd + 1.9, 0, 8)); darks.push(bar([X(0.82), yd + 2.6, 0], [X(0.82) + 3.0, yd + 3.4, 0], 0.25, 'box'));
  // flight deck markings come from the deck texture; a net/edge rail, boats on davits amidships
  for (const sd of [-1, 1]) { whites.push(DT.lifeboatGeo(7, 2.3, X(0.48), yd + 5.2, sd * (B * 0.39 + 1.1))); darks.push(bar([X(0.48) - 2, yd + 3.2, sd * B * 0.38], [X(0.48) - 2, yd + 6.4, sd * (B * 0.39 + 1.4)], 0.12, 'box'), bar([X(0.48) + 2, yd + 3.2, sd * B * 0.38], [X(0.48) + 2, yd + 6.4, sd * (B * 0.39 + 1.4)], 0.12, 'box')); }
  for (const sd of [-1, 1]) { const pts = []; for (let i = 4; i < hg.deckEdge.length - 2; i += 3) { const [xx, yy, w] = hg.deckEdge[i]; pts.push([xx, yy, sd * w * 0.99]); } rails.push(...DT.railing(pts, { h: 1.0, step: 2 })); }
  rails.push(...DT.railing([[X(0.70), yd + 5.4, -B * 0.39], [X(0.22), yd + 5.4, -B * 0.39]], { step: 2 }), ...DT.railing([[X(0.70), yd + 5.4, B * 0.39], [X(0.22), yd + 5.4, B * 0.39]], { step: 2 }));
  meshOf(greys, hz, S.body); meshOf(darks, dark, S.body); meshOf(whites, std({ color: 0xa8aaa8, roughness: 0.5 }), S.body); meshOf(rails, paint('steel'), S.body, { cast: false });
  if (o.flag) { const f = DT.flag(o.flag, { w: 2.2, h: 1.3 }); f.mesh.position.set(X(0.0) + 1, yd + 3.4, 0); f.mesh.rotation.y = Math.PI; S.body.add(f.mesh); S.flags.push(f); }
  S.parts = { hull, bridge: [X(0.70) - 1, yd + 7.6, 0], stack: [X(0.50), yd + 10.8, 0], mast: [mx, yd + 22, 0], mid: [X(0.45), yd + 5, 0] };
  return S;
});

// ---------------------------------------------------------------- Ticonderoga cruiser (Mk 26 era)
defineKind('cruiser', (o) => {
  const L = o.L ?? 173, B = 16.8, D = 11.5, T = 6.4;
  const S = new Ship('cruiser', { L, B, D, T, deckH: 12 }, { response: 0.7, ...o });
  const grey = o.grey ?? '#7b8184';
  const { hg, hull } = hullOf(S, o, { L, B, D, T }, { mid: [0.3, 0.5], entry: 1.25, run: 1.6, rake: 11, flare: 0.5, bulb: false, transom: 0.82, bilge: 2.6, sheer: 3.4, overhang: 1, stations: 140 },
    { top: grey, bottom: '#5a231d', boot: '#2a2c2e', hullNumber: o.number ?? '49', numberAt: 26, numberH: 3.8, numberY: 3.2, seed: o.seed ?? 49, rust: o.rust ?? 0.25, marks: false, bootH: 0.6, anchor: true, rough: 0.62 });
  const dk = new THREE.Mesh(hg.deck, deckMat(0x4a4f51, o.seed ?? 49)); dk.receiveShadow = true; S.body.add(dk);
  const yd = D - T, hz = paint('navyGrey'), dark = paint('navyDark'), spyM = std({ color: 0x666d70, roughness: 0.45, metalness: 0.35 });
  const greys = [], darks = [], whites = [], rails = [];
  const X = (f) => -L / 2 + f * L;
  // forward deckhouse (tall, carrying two SPY-1 faces forward), aft deckhouse (two faces aft)
  greys.push(box(X(0.72) - X(0.52), 9.5, B * 0.74, (X(0.72) + X(0.52)) / 2, yd + 4.75, 0), box(X(0.72) - X(0.62), 3.2, B * 0.62, (X(0.72) + X(0.62)) / 2, yd + 11.1, 0));
  darks.push(box(0.3, 1.1, B * 0.58, X(0.72) + 0.12, yd + 11.4, 0));
  greys.push(box(X(0.42) - X(0.26), 8.0, B * 0.72, (X(0.42) + X(0.26)) / 2, yd + 4.0, 0));
  const faces = [];
  for (const sd of [-1, 1]) { faces.push([X(0.70), yd + 6.5, sd * B * 0.3, sd > 0 ? 0.6 : Math.PI - 0.6 + Math.PI], [X(0.30), yd + 5.6, sd * B * 0.3, sd > 0 ? Math.PI - 0.6 : 0.6 + Math.PI]); }
  for (const [x, y, z, ry] of faces) { const p = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.3, 8), spyM); p.rotation.set(Math.PI / 2, 0, 0); p.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), ry); p.position.set(x, y, z); S.body.add(p); }
  // masts: forward (lattice-ish tripod) and aft; stacks: two pairs of uptakes
  for (const [f, h] of [[0.6, 22], [0.45, 17]]) { const mx = X(f);
    greys.push(bar([mx - 1.4, yd + 9, -1.6], [mx, yd + h, 0], 0.25, 4), bar([mx - 1.4, yd + 9, 1.6], [mx, yd + h, 0], 0.25, 4), bar([mx + 1.6, yd + 9, 0], [mx, yd + h, 0], 0.25, 4));
    for (let k = 0; k < 4; k++) greys.push(box(0.12, 0.12, 3 - k * 0.6, mx - 0.4, yd + 11 + k * (h - 11) / 4, 0));
    greys.push(box(2.6, 0.3, 3.4, mx, yd + h - 2, 0)); darks.push(cyl(0.05, 0.05, 5, mx, yd + h + 2.4, 0, 4));
    const sc = new THREE.Mesh(box(0.4, 0.5, f > 0.5 ? 4.5 : 3.0), dark); sc.position.set(mx, yd + h + 0.3, 0); S.body.add(sc); S.spin.push({ mesh: sc, rate: 2 * Math.PI / (f > 0.5 ? 4.2 : 3), phase: f * 9 }); }
  for (const f of [0.55, 0.47]) { greys.push(box(3.6, 6, 6.6, X(f), yd + 11, 0)); darks.push(box(3.8, 0.5, 6.8, X(f), yd + 14.2, 0)); }
  // Mk 26 twin-arm launchers (fore, aft), 5-inch guns, Phalanx
  for (const f of [0.80, 0.14]) { greys.push(cyl(2.4, 2.6, 0.8, X(f), yd + 0.4, 0, 16), box(1.6, 1.4, 1.8, X(f), yd + 1.4, 0)); darks.push(box(3.2, 0.5, 0.5, X(f) + (f > 0.5 ? 1 : -1) * 1.2, yd + 2.3, -0.7), box(3.2, 0.5, 0.5, X(f) + (f > 0.5 ? 1 : -1) * 1.2, yd + 2.3, 0.7)); }
  for (const f of [0.89, 0.06]) { greys.push(cyl(1.5, 2.3, 2.2, X(f), yd + 1.1, 0, 10)); darks.push(cyl(0.12, 0.14, 6, X(f) + (f > 0.5 ? 3.6 : -3.6), yd + 1.6, 0, 6, 'x')); }
  for (const sd of [-1, 1]) { whites.push(cyl(0.7, 0.7, 1.8, X(0.4), yd + 9.2, sd * 4.5, 10), sph(0.75, X(0.4), yd + 10.4, sd * 4.5, 10, 8)); whites.push(DT.lifeboatGeo(7, 2.4, X(0.5), yd + 4.0, sd * (B * 0.37 + 1.2))); }
  for (const sd of [-1, 1]) { const pts = []; for (let i = 4; i < hg.deckEdge.length - 2; i += 3) { const [xx, yy, w] = hg.deckEdge[i]; pts.push([xx, yy, sd * w * 0.99]); } rails.push(...DT.railing(pts, { h: 1.0, step: 2 })); }
  meshOf(greys, hz, S.body); meshOf(darks, dark, S.body); meshOf(whites, std({ color: 0xa8aaa8, roughness: 0.5 }), S.body); meshOf(rails, paint('steel'), S.body, { cast: false });
  if (o.flag) { const f = DT.flag(o.flag, { w: 2.6, h: 1.5 }); f.mesh.position.set(X(0.0) + 1, yd + 3.4, 0); f.mesh.rotation.y = Math.PI; S.body.add(f.mesh); S.flags.push(f); }
  S.parts = { hull, bridge: [X(0.72) - 1, yd + 11.8, 0], mast: [X(0.6), yd + 22, 0] };
  return S;
});

// ---------------------------------------------------------------- contact mine (awash)
defineKind('mine', (o) => {
  const S = new Ship('mine', { L: 1.1, B: 1.1, D: 1.2, T: 0.62, deckH: 0.5 }, { response: 1.2, wake: 0, shadow: 0, ...o });
  const r = 0.55, m = std({ color: 0x2a2826, roughness: 0.7, metalness: 0.4 }), rust = std({ color: 0x5a3018, roughness: 0.95 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), m); ball.castShadow = true; S.body.add(ball);
  const horns = []; const dirs = [[0, 1, 0], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7], [0.6, 0.35, 0.6], [-0.6, 0.35, -0.6]];
  for (const d of dirs) { const v = new THREE.Vector3(...d).normalize(); const g = new THREE.CylinderGeometry(0.035, 0.06, 0.22, 8); g.translate(0, r + 0.1, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)); horns.push(g); }
  meshOf(horns, std({ color: 0x3b3a36, roughness: 0.6, metalness: 0.5 }), S.body);
  meshOf([new THREE.TorusGeometry(r * 1.002, 0.02, 6, 32).rotateX(Math.PI / 2)], std({ color: 0x2e2420, roughness: 0.9 }), S.body);
  meshOf([box(0.1, 0.18, 0.04, 0, r + 0.03, 0)], m, S.body);
  // weed and rust streaks: a second, slightly larger shell in rust colour, mottled by its vertex colours
  S.parts = { ball };
  return S;
});

// ---------------------------------------------------------------- oil platform (static)
defineKind('platform', (o) => {
  const S = new Ship('platform', { L: 60, B: 40, D: 30, T: 0, deckH: 26 }, { response: 0, wake: 0, shadow: 0, ...o });
  const steel = std({ color: 0x8a6d4f, roughness: 0.8, metalness: 0.3 }), yellow = paint('yellow'), white = paint('whiteDirty'), dark = paint('darkSteel');
  const legs = [], braces = [], decks = [], kit = [];
  const P = [[-18, -12], [18, -12], [-18, 12], [18, 12]];
  for (const [x, z] of P) legs.push(bar([x * 1.25, -30, z * 1.25], [x, 22, z], 0.9, 10));
  for (const y of [-8, 6, 18]) for (let i = 0; i < 4; i++) { const a = P[i], b = P[[1, 3, 0, 2][i]]; const f = (y + 30) / 52, s = 1.25 - 0.25 * f; braces.push(bar([a[0] * s, y, a[1] * s], [b[0] * s, y, b[1] * s], 0.4, 6)); }
  for (const [a, b] of [[0, 3], [1, 2]]) braces.push(bar([P[a][0] * 1.2, -8, P[a][1] * 1.2], [P[b][0] * 1.05, 18, P[b][1] * 1.05], 0.35, 6));
  decks.push(box(48, 1.2, 34, 0, 22, 0), box(44, 1.0, 30, 0, 29, 0));
  for (let i = 0; i < 6; i++) kit.push(box(6 + (i % 3) * 2, 4 + (i % 2) * 2, 5, -16 + i * 6.5, 25 + (i % 2), -8 + (i % 3) * 7));
  kit.push(box(14, 6, 10, 10, 33, 6));
  // derrick: a tapering lattice tower
  const dx = -12, dz = -6; for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) braces.push(bar([dx + a, 29.5, dz + b], [dx + a * 0.3, 58, dz + b * 0.3], 0.25, 4));
  for (let y = 33; y < 58; y += 4) { const s = 1 - (y - 29.5) / 28.5 * 0.7; for (const [a, b, c, d] of [[-3, -3, 3, 3], [3, -3, -3, 3]]) braces.push(bar([dx + a * s, y, dz + b * s], [dx + c * s, y + 4, dz + d * s], 0.12, 3)); }
  // flare boom out over the water, helideck
  braces.push(bar([22, 28, -10], [58, 44, -10], 0.6, 6), bar([22, 23, -14], [50, 42, -10], 0.3, 4), bar([22, 23, -6], [50, 42, -10], 0.3, 4));
  decks.push(cyl(9, 9, 0.6, 12, 37, 6, 20));
  meshOf(legs, steel, S.body); meshOf(braces, steel, S.body); meshOf(decks, dark, S.body); meshOf(kit, white, S.body); meshOf([box(2, 2, 2, 58, 44, -10)], yellow, S.body);
  S.parts = { flare: [58, 45, -10], deck: [0, 30, 0], derrick: [dx, 58, dz] };
  return S;
});

// ---------------------------------------------------------------- smuggler's speedboat
defineKind('speedboat', (o) => {
  const L = o.L ?? 11, B = 2.6, D = 1.4, T = 0.45;
  const S = new Ship('speedboat', { L, B, D, T, deckH: 1.0 }, { response: 1.5, wake: 1.4, shadow: 0.5, ...o }); S.planing = 1;
  const hg = hullGeometry({ L, B, D, T, mid: [0.15, 0.4], entry: 1.4, run: 4, rake: 1.6, flare: 0.4, bulb: false, transom: 0.95, bilge: 0.15, sheer: 0.35, overhang: 0, stations: 36, girth: 12 });
  const col = o.color ?? '#e9e6de';
  const atlas = hullAtlas(o, { L, D, T }, { top: col, bottom: o.stripe ?? '#2a4f7a', boot: o.stripe ?? '#2a4f7a', marks: false, anchor: false, thruster: false, seed: o.seed ?? 51, rust: 0.05, res: 512, bootH: 0.2, bootDepth: 0.15, rough: 0.35 });
  const hull = new THREE.Mesh(hg.hull, std({ map: atlas.map, roughness: 0.35, metalness: 0.0 })); hull.castShadow = true; S.body.add(hull);
  S.body.add(new THREE.Mesh(hg.transom, std({ color: col })));
  S.body.add(new THREE.Mesh(hg.deck, std({ color: 0xcfcac0, roughness: 0.7 })));
  const yd = D - T, r = DT.rng(o.seed ?? 51), cargo = [], dark = [], white = [];
  const n = o.engines ?? (r() < 0.5 ? 2 : 3);
  for (let k = 0; k < n; k++) { const z = (k - (n - 1) / 2) * 0.75; white.push(box(0.6, 1.0, 0.5, -L / 2 - 0.15, yd + 0.1, z)); dark.push(box(0.25, 0.9, 0.15, -L / 2 - 0.3, yd - 0.7, z)); }
  white.push(box(0.9, 1.0, 1.0, -L * 0.18, yd + 0.5, 0)); dark.push(box(0.1, 0.5, 0.9, -L * 0.18 + 0.5, yd + 1.2, 0));
  const pal = [0xd8cbb0, 0xb79a6a, 0xe8e4da, 0x9a8a6a, 0x5a6b7a];
  for (let i = 0; i < (o.cargo ?? 10); i++) cargo.push([box(0.7 + r() * 0.5, 0.5 + r() * 0.5, 0.6 + r() * 0.4, -L * 0.02 + r() * L * 0.35, yd + 0.35 + Math.floor(i / 6) * 0.55, (r() - 0.5) * 1.6), pal[i % pal.length]]);
  for (const [g, c] of cargo) meshOf([g], std({ color: c, roughness: 0.9 }), S.body);
  meshOf(white, std({ color: 0xe0ddd5, roughness: 0.4 }), S.body); meshOf(dark, paint('black'), S.body);
  S.parts = { hull, helm: [-L * 0.25, yd + 0.2, 0], crew: [[-L * 0.25, 0.3], [-L * 0.35, -0.5]] };
  return S;
});

// ---------------------------------------------------------------- lane buoy (special mark: yellow pillar)
defineKind('buoy', (o) => {
  const S = new Ship('buoy', { L: 2.6, B: 2.6, D: 1.8, T: 0.9, deckH: 1 }, { response: 1.3, wake: 0, shadow: 0, ...o });
  const y = std({ color: 0xd6b12a, roughness: 0.5 }), dark = paint('darkSteel'), rust = std({ color: 0x6b3a1e, roughness: 0.9 });
  meshOf([cyl(1.3, 1.1, 1.8, 0, 0, 0, 20)], y, S.body); meshOf([cyl(1.32, 1.32, 0.25, 0, -0.75, 0, 20)], rust, S.body);
  meshOf([cyl(0.5, 0.7, 3.2, 0, 2.5, 0, 12), box(0.9, 0.12, 0.9, 0, 4.1, 0)], y, S.body);
  const x = []; for (const a of [0.785, -0.785]) { const g = new THREE.BoxGeometry(0.12, 1.0, 0.12); g.rotateZ(a); g.translate(0, 4.9, 0); x.push(g); }
  meshOf(x, y, S.body); meshOf([cyl(0.12, 0.12, 0.4, 0, 4.35, 0, 8), cyl(0.18, 0.18, 0.3, 0, 5.6, 0, 8)], dark, S.body);
  meshOf([...DT.railing([[0.6, 4.15, 0.6], [-0.6, 4.15, 0.6], [-0.6, 4.15, -0.6], [0.6, 4.15, -0.6], [0.6, 4.15, 0.6]], { h: 0.6, step: 0.6, r: 0.025 })], dark, S.body);
  return S;
});
