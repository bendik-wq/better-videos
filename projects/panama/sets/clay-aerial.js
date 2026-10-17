// PANAMA clay sets, aerials: aerial (bright B-roll of the canal and lake), queue (anchored ships, a counter).
// Both fly over the clay world (sets/clay-world.js): a stylised isthmus at metre scale, Gatun Lake at 26 m.
// Parameters: projects/panama/SETS.md.
import * as THREE from 'three';
import * as CK from './clay-kit.js';
import * as CW from './clay-world.js';

const { clamp, lerp, range, sstep, smoother, HOUSE, mat } = CK;
const FT = 0.3048;

export default function makeClayAerial(H) {
  const { C, P, K } = H;
  const stage = (ctx, P0, o = {}) => {
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, ctx.width / ctx.height, 1, 30000);
    const az = P0.sunAz ?? 130, el = P0.sunEl ?? 46;
    const sun = CK.brightLight(scene, { target: [0, 0, 15000], span: 900, fog: true, near: 2500, far: 30000, mapSize: 4096, el, az, fill: 0.7, hemiI: 1.05 });
    const W = CW.world(scene, { sunAz: az, sunEl: el, ...o });
    const fx = P.post(ctx, scene, camera, { ao: { radius: 6, intensity: 1.4, falloff: 1 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
    return { scene, camera, sun, W, fx, layer: H.layerOf(ctx) };
  };
  const rig = (shot, keys) => C.path(keys, { duration: shot.duration, float: 0, accel: 0.3, decel: 0.3 });

  // ======================================================================== aerial
  // modes: lake-islands | locks-wide | ships-transit | jungle-shore | dry-shore ; cam: 0 | 1 | 2 (variants per mode)
  const Z0 = CW.LOCK_S.z0;
  const VIEWS = {
    'lake-islands': [
      [{ pos: [2600, 420, 13800], look: [-1200, 26, 9800], mm: 30 }, { pos: [2300, 400, 13300], look: [-1500, 26, 9400], mm: 30 }],
      [{ pos: [-3600, 300, 16200], look: [-600, 26, 12400], mm: 26 }, { pos: [-3300, 290, 15700], look: [-300, 26, 12000], mm: 26 }],
      [{ pos: [0, 1500, 15500], look: [-900, 26, 11000], mm: 32 }, { pos: [300, 1450, 15200], look: [-700, 26, 10700], mm: 32 }],
    ],
    'locks-wide': [
      [{ pos: [900, 520, Z0 + 700], look: [0, 10, Z0 - 380], mm: 30 }, { pos: [760, 500, Z0 + 600], look: [0, 10, Z0 - 380], mm: 30 }],
      [{ pos: [-700, 260, Z0 - 1200], look: [0, 10, Z0 - 250], mm: 32 }, { pos: [-560, 250, Z0 - 1150], look: [0, 10, Z0 - 230], mm: 32 }],
      [{ pos: [120, 1400, Z0 + 200], look: [0, 0, Z0 - 420], mm: 34 }, { pos: [200, 1380, Z0 + 120], look: [0, 0, Z0 - 420], mm: 34 }],
    ],
    'jungle-shore': [
      [{ pos: [-500, 150, 15800], look: [1200, 30, 13800], mm: 26 }, { pos: [-300, 145, 15300], look: [1400, 30, 13400], mm: 26 }],
      [{ pos: [-400, 170, 12300], look: [-2600, 40, 11200], mm: 26 }, { pos: [-300, 165, 11900], look: [-2500, 40, 10800], mm: 26 }],
      [{ pos: [300, 240, 17900], look: [1800, 30, 15600], mm: 28 }, { pos: [450, 235, 17500], look: [1950, 30, 15200], mm: 28 }],
    ],
  };
  VIEWS['dry-shore'] = VIEWS['jungle-shore'].map(v => v.map(k => ({ ...k, pos: [k.pos[0], k.pos[1] * 0.45, k.pos[2]] })));
  async function aerial(ctx, shot) {
    const P0 = shot.params ?? {}, mode = P0.mode ?? 'lake-islands', v = clamp(P0.cam ?? 0, 0, 2) | 0;
    const dry = mode === 'dry-shore', lakeY = CW.LAKE - (dry ? (P0.drop ?? 6) * FT : 0);
    const { scene, camera, sun, W, fx, layer } = stage(ctx, P0, { lakeLevel: lakeY });
    W.lakeMesh.position.y = lakeY;
    // ships-transit follows the first lake ship; the others are keyed views
    let cam = null;
    if (mode === 'ships-transit') {
      const s0 = W.lakeShips[0], off = [[-320, 120, 160], [180, 60, -260], [-90, 260, 40]][v];
      cam = (camera, p, t) => { W.tick(t, camera, sun); const sp = s0.position; camera.position.set(sp.x + off[0] - t * 2, sp.y + off[1], sp.z + off[2]); camera.lookAt(sp.x + 60, sp.y + 8, sp.z - 20); camera.fov = CK.lerp(30, 30, 0); camera.updateProjectionMatrix(); };
    } else if ((mode === 'jungle-shore' || dry) && !P0.camera) {
      // find a real shoreline on the detail patch: march from open water until the land rises above the lake
      const a = [-0.5, 2.4, 0.9][v], o0 = [[0, 15600], [-600, 11800], [600, 16800]][v];
      let sx = o0[0], sz = o0[1];
      for (let k = 0; k < 600; k++) { sx += Math.cos(a) * 15; sz += Math.sin(a) * 15; if (W.h(sx, sz) > CW.LAKE + 0.5) break; }
      const back = dry ? 170 : 300, up = dry ? 32 : 75, side = [-1, 1, -1][v] * 90;
      const px = sx - Math.cos(a) * back - Math.sin(a) * side, pz = sz - Math.sin(a) * back + Math.cos(a) * side;
      const r = rig(shot, [{ pos: [px, up + lakeY, pz], look: [sx + Math.cos(a) * 120, CW.LAKE + 10, sz + Math.sin(a) * 120], mm: 26 },
        { pos: [px + Math.sin(a) * 60, up + lakeY - 4, pz - Math.cos(a) * 60], look: [sx + Math.cos(a) * 120 + Math.sin(a) * 60, CW.LAKE + 10, sz + Math.sin(a) * 120 - Math.cos(a) * 60], mm: 26 }]);
      cam = (camera, p, t) => r(camera, p, t);
    } else { const r = rig(shot, P0.camera ?? VIEWS[mode]?.[v] ?? VIEWS['lake-islands'][0]); cam = (camera, p, t) => r(camera, p, t); }
    // the dry shore: tree stumps on the exposed bank, and a pale band label
    if (dry) {
      const st = CK.scatter(900, { x0: -5000, x1: 5000, z0: 10000, z1: 18500, height: W.h, ok: (x, z, y) => y < CW.LAKE + 0.2 && y > lakeY + 0.15 && CW.lakeMask(x, z) > 0.4, seed: 21, s: [1.2, 2.4], tries: 40 });
      scene.add(CK.instanced(new THREE.CylinderGeometry(0.35, 0.5, 1, 7).translate(0, 0.5, 0), mat('#8c7a66', 0.95), st.map(q => ({ x: q.x, y: q.y - 0.2, z: q.z, sx: q.s, sy: q.s * 1.6, sz: q.s }))));
    }
    const for0 = W.flightS; for (let i = 0; i < 2; i++) for (let l = 0; l < 2; l++) for0.setLevel(i, l, for0.pool(i + (i + l) % 2));
    const cap = H.caption(layer, P0.caption ?? (dry ? `GATUN LAKE · −${P0.drop ?? 6} FT` : null));
    const src = H.sourceLine(layer, P0.source ?? null);
    return { scene, camera, layer, update(t, p) {
      cam(camera, p, t);
      if (mode !== 'ships-transit') W.tick(t, camera, sun);
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  // ======================================================================== queue: ships anchored at the entrance, counting up
  async function queue(ctx, shot) {
    const P0 = shot.params ?? {}, N = P0.count ?? 163;
    const { scene, camera, sun, W, fx, layer } = stage(ctx, P0, { anchored: false });
    // instanced anchored ships, baked per kind; they appear one by one with the counter
    const kinds = ['container', 'bulk', 'tanker', 'lpg', 'neo'], baked = kinds.map(k => CK.bake(CK.ship(k, { seed: 3, accent: null })));
    const shipM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    const ims = baked.map(g => { const im = new THREE.InstancedMesh(g, shipM, N); im.castShadow = im.receiveShadow = true; im.count = 0; scene.add(im); im.frustumCulled = false; return im; });
    const r = CK.rng(P0.seed ?? 33), spots = [];
    // half off the Pacific entrance, half off the Atlantic (only the Pacific half is in frame by default)
    for (let i = 0; i < N; i++) {
      const pac = i % 5 !== 4, z0 = pac ? CW.LOCK_S.z0 + 2200 : CW.LOCK_N.z0 - 2200, dz = (pac ? 1 : -1) * (300 + Math.pow(r(), 0.7) * 9000);
      let x = (r() - 0.5) * 16000 * (0.4 + Math.abs(dz) / 9000), z = z0 + dz;
      if (W.h(x, z) > -4) { z += (pac ? 1 : -1) * 2500; }
      spots.push({ x, z, hd: Math.PI / 2 + 0.35 + (r() - 0.5) * 0.25, k: Math.floor(r() * kinds.length), at: r() });
    }
    spots.sort((a, b) => a.at - b.at);
    const tC = H.cue(shot, P0.at, 0.8), span = P0.span ?? Math.max(3, shot.duration - 3);
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
    const keys = P0.camera ?? [{ pos: [9000, 6200, Z0 + 15500], look: [-300, 0, Z0 + 2600], mm: 30 }, { pos: [7600, 5200, Z0 + 13600], look: [-300, 0, Z0 + 2600], mm: 30 }];
    const r2 = rig(shot, keys);
    const s = window.innerHeight / 1080;
    const ctr = K.div(layer, `opacity:1;left:5.5%;top:7%;padding:${10 * s}px ${22 * s}px;background:#0b0b0b;color:#fff;font:700 ${92 * s}px/1 ${H.FONT.ui}`, '0');
    const sub = H.slab(layer, P0.label ?? 'SHIPS WAITING', 'left:5.5%;top:18.2%', { size: 30 }); sub.style.background = '#fbf8f2'; sub.style.color = '#0f1e33';
    const cap = H.caption(layer, P0.caption ?? '9 AUGUST 2023', 'left:5.5%;top:25%');
    const src = H.sourceLine(layer, P0.source ?? 'SOURCE: PANAMA CANAL AUTHORITY · REUTERS');
    return { scene, camera, layer, update(t, p) {
      r2(camera, p, t); W.tick(t, camera, sun);
      const shown = N * smoother(clamp((t - tC) / span));
      const cnt = kinds.map(() => 0);
      for (let i = 0; i < N; i++) { const a = clamp(shown - i, 0, 1); if (a <= 0) break; const sp = spots[i], sc = CK.outCubic(a);
        Q.setFromAxisAngle(V.set(0, 1, 0), sp.hd); M4.compose(V.set(sp.x, 0, sp.z), Q, S.setScalar(sc)); ims[sp.k].setMatrixAt(cnt[sp.k]++, M4); }
      ims.forEach((im, k) => { im.count = cnt[k]; im.instanceMatrix.needsUpdate = true; });
      ctr.textContent = Math.round(shown).toLocaleString('en-US'); ctr.style.opacity = String(sstep(tC - 0.3, tC, t));
      cap?.type(t);
    }, dispose() { fx.dispose(); } };
  }

  return { aerial, queue };
}
