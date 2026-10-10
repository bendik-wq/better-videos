// FX TEST: the cinematic toolkit in one short reel.
//   rack  dark library aisle, one sodium pendant. Rack focus from a book at arm's length to a
//         figure at the far end (post.js DOF), N8AO on the shelves, god rays from the bulb,
//         subtle lens; C1 slow push (cine.path).
//   walk  the same aisle: the figure (Quaternius UAL, CC0) walks and stops; follow-through camera.
//   huey  1966 archive photo, black and white, parallax push (parallax.js).
//   monk  1947 archive photo, sepia, lateral parallax move.
// Bench/debug: ?fx=none|dof|ao|rays|lens|all&q=draft|low|medium|high overrides the post chain.
import * as THREE from 'three';
import * as K from 'kit';
import * as C from '/engine/cine.js';
import * as P from '/engine/post.js';
import * as PX from '/engine/parallax.js';

const SODIUM = 0xffa860;
const qs = new URLSearchParams(location.search);
const FX = qs.get('fx'), FXQ = qs.get('q');
const ARCHIVE = '/projects/fx-test/assets/archive/';

// ---------------------------------------------------------------- library aisle
function bookShelves(scene, { length = 18, height = 4.6, depth = 0.42, x = 1.05, z0 = 3.5, seed = 4 } = {}) {
  const r = K.rng(seed);
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.72, metalness: 0 });
  const g = new THREE.Group();
  const shelfY = []; for (let y = 0.12; y < height - 0.3; y += 0.46) shelfY.push(y);
  const boards = [];
  for (const side of [-1, 1]) {
    const cx = side * (x + depth / 2);
    boards.push([depth, 0.035, length, cx, 0, z0 - length / 2]);
    for (const y of shelfY) boards.push([depth, 0.03, length, cx, y, z0 - length / 2]);
    boards.push([depth, 0.06, length, cx, height, z0 - length / 2]);
    boards.push([0.02, height, length, side * (x + depth), height / 2, z0 - length / 2]); // back panel
    for (let z = z0; z > z0 - length - 0.01; z -= 1.0) boards.push([depth + 0.02, height, 0.045, cx, height / 2, z]); // uprights
  }
  const box = new THREE.BoxGeometry(1, 1, 1);
  const im = new THREE.InstancedMesh(box, wood, boards.length); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  boards.forEach(([w, h, d, bx, by, bz], i) => { m4.compose(new THREE.Vector3(bx, by + (h === height ? 0 : h / 2), bz), q, new THREE.Vector3(w, h, d)); im.setMatrixAt(i, m4); });
  im.castShadow = im.receiveShadow = true; g.add(im);
  // books: leather, cloth and paper spines, muted; heights, widths and leans vary
  const tones = [0x4a2a1c, 0x2c3a2c, 0x5a1e18, 0x6b5a3c, 0x222a36, 0x3b2f28, 0x7a6a4e, 0x1f1c1a, 0x4b3b2b, 0x58443a];
  const items = [];
  for (const side of [-1, 1]) for (let s = 0; s < shelfY.length; s++) {
    const y = shelfY[s] + 0.015;
    for (let z = z0 - 0.03; z > z0 - length; ) {
      if (Math.floor(z) !== Math.floor(z + 0.04) && z < z0 - 0.1) { z -= 0.05; continue; } // skip uprights
      const w = 0.025 + r() * 0.05, h = 0.26 + r() * 0.15, d = 0.2 + r() * 0.14;
      if (r() < 0.04) { z -= 0.12 + r() * 0.2; continue; } // gaps
      const lean = r() < 0.08 ? (r() - 0.5) * 0.5 : 0;
      const pull = r() < 0.06 ? r() * 0.06 : 0;
      items.push({ w, h, d, x: side * (x + depth - d / 2 - 0.02 - pull), y, z: z - w / 2, lean, c: tones[Math.floor(r() * tones.length)], v: 0.75 + r() * 0.5 });
      z -= w + 0.002 + (lean ? 0.03 : 0);
    }
  }
  // spine: bands, a gilt rule and a paper label, multiplied by the per-book colour; worn noise
  const spine = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); const rr = K.rng(77);
    x.fillStyle = '#d8d0c4'; x.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 1400; i++) { const v = 150 + rr() * 90; x.fillStyle = `rgba(${v},${v * 0.95},${v * 0.9},.18)`; x.fillRect(rr() * 64, rr() * 256, 1 + rr() * 3, 1 + rr() * 6); }
    x.fillStyle = 'rgba(20,14,10,.55)'; for (const y of [22, 36, 214, 228]) x.fillRect(0, y, 64, 6);
    x.fillStyle = 'rgba(255,214,140,.9)'; x.fillRect(0, 44, 64, 2); x.fillRect(0, 206, 64, 2);
    x.fillStyle = 'rgba(240,228,200,.55)'; x.fillRect(10, 70, 44, 46);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
  const bookGeo = new THREE.BoxGeometry(1, 1, 1);
  // put the spine image on the +x / -x faces upright (u along z, v along y)
  const books = new THREE.InstancedMesh(bookGeo, new THREE.MeshStandardMaterial({ map: spine, roughness: 0.78, metalness: 0, bumpMap: spine, bumpScale: 0.3 }), items.length);
  const col = new THREE.Color();
  items.forEach((b, i) => {
    q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), b.lean);
    m4.compose(new THREE.Vector3(b.x, b.y + b.h / 2, b.z), q, new THREE.Vector3(b.d, b.h, b.w)); books.setMatrixAt(i, m4);
    books.setColorAt(i, col.setHex(b.c).multiplyScalar(b.v));
  });
  books.castShadow = books.receiveShadow = true; g.add(books);
  scene.add(g);
  return { group: g, shelfY };
}

function aisle(ctx, shot) {
  const { width, height } = ctx;
  const mode = shot.params?.mode ?? 'rack';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020306);
  scene.fog = new THREE.FogExp2(0x05070b, 0.045);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 80);
  // floor: worn parquet, dark
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.55, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -10; floor.receiveShadow = true; scene.add(floor);
  const ft = K.grimeTexture(31, 120); ft.repeat.set(3, 20); floor.material.roughnessMap = ft; floor.material.bumpMap = ft; floor.material.bumpScale = 0.4;
  bookShelves(scene, {});
  // end wall and ceiling
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ color: 0x1b1712, roughness: 0.9 })); wall.position.set(0, 3, -14.6); wall.receiveShadow = true; scene.add(wall);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 5.0, -10); scene.add(ceil);

  // the one key: a sodium pendant over the far end of the aisle
  const LZ = -9.2, LY = 3.55;
  const key = K.keySpot(scene, { color: SODIUM, intensity: 260, pos: [0, LY, LZ], target: [0, 0, LZ - 0.2], angle: 0.78, penumbra: 0.75, shadow: 2048 });
  key.shadow.camera.near = 0.3; key.shadow.camera.far = 8; key.shadow.bias = -0.0006; key.decay = 2;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.26, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }));
  shade.position.set(0, LY + 0.1, LZ); scene.add(shade);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 5 - LY - 0.2, 6), shade.material); cord.position.set(0, (5 + LY + 0.2) / 2, LZ); scene.add(cord);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(SODIUM).multiplyScalar(6), fog: false }));
  bulb.position.set(0, LY - 0.02, LZ); scene.add(bulb);
  // bounce: the pool of sodium on the floor lifts the shelves a touch (no shadow, very low)
  const bounce = new THREE.PointLight(SODIUM, 2.2, 7, 2); bounce.position.set(0, 0.4, LZ); scene.add(bounce);
  // night through unseen windows behind camera: a cold, dim, shadowless fill so the shelves read and AO has something to occlude
  scene.add(new THREE.HemisphereLight(0x46566e, 0x140e0a, 1.5));
  const moon = new THREE.DirectionalLight(0x8fa6c8, 2.4); moon.position.set(-1.5, 5, 9); scene.add(moon);
  const shaft = K.lightShaft(scene, { pos: [0, LY, LZ], target: [0, 0, LZ], radius: 2.4, color: SODIUM, intensity: 0.05 });
  const motes = K.dust(scene, { count: 500, box: [2.4, 3.4, 2.4], center: [0, 1.8, LZ], size: 0.018, color: 0xffc890, opacity: 0.45, seed: 9 });

  // the figure (CC0 UAL mannequin as a silhouette)
  const matte = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.85, metalness: 0 }); // a figure, not a game character
  const fig = C.character('UAL', { clip: mode === 'walk' ? 'Walk_Loop' : 'Idle_Loop', phase: 0.4, material: matte });
  fig.root.rotation.y = 0; scene.add(fig.root);

  // the near book, pulled half out of the left shelf at arm's length
  const leather = K.grimeTexture(52, 170); leather.repeat.set(0.6, 0.6);
  const nb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.33, 0.06), [
    new THREE.MeshStandardMaterial({ color: 0x5a1e18, roughness: 0.6, roughnessMap: leather, bumpMap: leather, bumpScale: 0.5 }), // spine (+x)
    new THREE.MeshStandardMaterial({ color: 0xcfc3a8, roughness: 0.9 }),                                                        // fore-edge pages
    new THREE.MeshStandardMaterial({ color: 0xcfc3a8, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: 0xcfc3a8, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x4a1814, roughness: 0.65, roughnessMap: leather, bumpMap: leather, bumpScale: 0.5 }), // covers
    new THREE.MeshStandardMaterial({ color: 0x4a1814, roughness: 0.65, roughnessMap: leather, bumpMap: leather, bumpScale: 0.5 })]);
  nb.position.set(-1.07, 1.68, 0.55); nb.rotation.y = -0.08; nb.castShadow = nb.receiveShadow = true; scene.add(nb);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.012, 0.062), new THREE.MeshStandardMaterial({ color: 0xb08d4a, metalness: 1, roughness: 0.35 }));
  band.position.y = 0.11; nb.add(band);

  const fxOpts = (() => {
    const all = { ao: { radius: 0.9, intensity: 2.6 }, dof: { focus: 1.4, fstop: 2.0, mm: 35, bokeh: 4 }, rays: { light: bulb, weight: 0.32, exposure: 0.45, decay: 0.93 }, lens: 'subtle' };
    if (!FX || FX === 'all') return all;
    if (FX === 'none') return null;
    if (FX === 'chain') return {};
    return { [FX]: all[FX] };
  })();
  const fx = fxOpts ? P.post(ctx, scene, camera, { ...fxOpts, quality: FXQ ?? undefined, hdr: qs.get('hdr') !== '0' }) : null;

  // camera
  let move, walkPos;
  if (mode === 'rack') {
    C.lens(camera, 35);
    move = C.path([
      { pos: [-0.55, 1.62, 2.55], look: [-0.25, 1.4, -10], mm: 35 },
      { pos: [-0.5, 1.6, 2.2], look: [-0.18, 1.36, -10], mm: 35 },
    ], { duration: shot.duration, accel: 0.3, decel: 0.5, float: 0.006 });
    fig.root.position.set(0.15, 0, LZ + 0.35); fig.root.rotation.y = 0.35;
  } else {
    // walk toward camera, stop under the lamp; the operator follows and settles after
    const stopT = shot.duration * 0.62;
    // walks away from camera into the pool of sodium light and stops: a backlit silhouette
    const v = 1.25; // m/s, Walk_Loop pace
    // distance = v * integral of (1 - walk/idle blend weight): decelerates exactly as the legs do
    const a = stopT - 0.35, b = stopT + 0.25;
    const dist = (t) => { t = Math.max(0, t); if (t <= a) return v * t; const u = K.clamp((t - a) / (b - a)); return v * (a + (b - a) * (u - (u ** 3 - u ** 4 / 2))); };
    walkPos = (t) => [0.05, 0, LZ + 4.0 - dist(t)];
    move = C.moves.followThrough({ subject: walkPos, mm: 40, offset: [0.3, 1.55, 5.6], lag: 0.55, overshoot: 0.1, lookHeight: 1.1, float: 0.006 });
    fig.root.rotation.y = Math.PI;
  }

  return {
    scene, camera,
    update(t, p) {
      if (mode === 'walk') {
        const stopT = shot.duration * 0.62;
        const pos = walkPos(t); fig.root.position.set(...pos);
        const k = K.smooth(K.range(t, stopT - 0.35, stopT + 0.25));
        fig.blend([['Walk_Loop', t, 1 - k], ['Idle_Loop', t - stopT + 0.35, k]]);
      } else fig.update(t);
      motes.update(t);
      move(camera, p, t);
      camera.updateMatrixWorld();
      if (fx?.dof) {
        if (mode === 'rack') {
          const dBook = camera.position.distanceTo(nb.getWorldPosition(new THREE.Vector3()));
          const dFig = camera.position.distanceTo(fig.root.position.clone().setY(1.5));
          fx.focus(P.rack(t, [[0, dBook], [2.2, dBook], [3.5, dFig]]));
        } else fx.focusOn(fig.root.position.clone().setY(1.4));
      }
    },
    dispose() { fx?.dispose(); },
  };
}

// ---------------------------------------------------------------- archive photo
async function photoSet(ctx, shot) {
  const { width, height } = ctx; const pr = shot.params;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 100);
  const ph = await PX.photo(scene, ARCHIVE + pr.src, { treatment: pr.treatment, mm: 50, dist: 10, depth: pr.depth ?? 0.5, center: pr.center, layers: pr.layers ?? 0 });
  const move = PX.moves[pr.move ?? 'push'](ph, { opts: { duration: shot.duration } });
  return { scene, camera, update(t, p) { move(camera, p, t); }, dispose() { ph.dispose(); } };
}

// ---------------------------------------------------------------- runtime + 2D compositor
export default async function create(ctx) {
  const { renderer, width, height, shots } = ctx;
  await C.preload(renderer, { characters: ['UAL'] });
  const gl = renderer.domElement;
  const comp = document.createElement('canvas'); comp.width = width; comp.height = height;
  comp.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`;
  gl.after(comp); gl.style.visibility = 'hidden';
  const cx = comp.getContext('2d');
  const prev = document.createElement('canvas'); prev.width = width; prev.height = height; const px = prev.getContext('2d');
  const live = new Map();
  // build every set up front (photo sets load textures asynchronously)
  for (const s of shots) {
    try { live.set(s.id, s.set === 'photo' ? await photoSet(ctx, s) : aisle(ctx, s)); }
    catch (e) { console.error(String(e.message ?? e)); live.set(s.id, { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), update() {} }); }
  }
  let last = null;
  return {
    frame({ shot, t, p }) {
      const inst = live.get(shot.id);
      if (last && last !== shot.id) px.drawImage(comp, 0, 0);
      inst.update(t, p);
      renderer.render(inst.scene, inst.camera); // routed through the set's post chain, if it has one
      const D = 0.35;
      if (last && t < D && shot !== shots[0]) {
        cx.drawImage(prev, 0, 0); cx.globalAlpha = K.smooth(t / D); cx.drawImage(gl, 0, 0, width, height); cx.globalAlpha = 1;
      } else cx.drawImage(gl, 0, 0, width, height);
      last = shot.id;
    },
  };
}
