// Thumbnail / Reconstructed-style sets: white cutaway dioramas floating against a real blue sky (HDRI), glossy solid-colour
// mannequins (red = the Hunts, blue = the other side, pale cyan = the crowd). Also used as hero shots in the episode.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as S from './studio-kit.js';
import * as PR from './silver-props.js';

const skyCache = {};
export async function skyTex(renderer, name = 'kloppenheim_06_puresky') {
  if (skyCache[name]) return skyCache[name];
  const tex = await new RGBELoader().loadAsync(`/assets/hdri/${name}.hdr`); tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(tex).texture; pm.dispose();
  return (skyCache[name] = { tex, env });
}
// a hollow rounded tube section (the Reconstructed "cutaway box"): w × h outer, wall thickness, depth; open at the front, back wall closed
export function cutawayBox({ w = 16, h = 9, d = 10, wall = 0.9, r = 2.2, color = '#f4f4f2', inner = '#8d929a' } = {}) {
  const G = new THREE.Group();
  const rr = (s, x, y, W, H, R) => { s.moveTo(x + R, y); s.lineTo(x + W - R, y); s.quadraticCurveTo(x + W, y, x + W, y + R); s.lineTo(x + W, y + H - R); s.quadraticCurveTo(x + W, y + H, x + W - R, y + H); s.lineTo(x + R, y + H); s.quadraticCurveTo(x, y + H, x, y + H - R); s.lineTo(x, y + R); s.quadraticCurveTo(x, y, x + R, y); };
  const shape = new THREE.Shape(); rr(shape, -w / 2, 0, w, h, r);
  const hole = new THREE.Path(); rr(hole, -w / 2 + wall, wall, w - 2 * wall, h - 2 * wall, Math.max(0.3, r - wall)); shape.holes.push(hole);
  const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 4, curveSegments: 24 }), S.clay(color, { rough: 0.5, coat: 0.3 }));
  shell.position.z = -d; shell.castShadow = shell.receiveShadow = true; G.add(shell);
  // the interior lining (darker grey, like a cutaway), as a thin inner skin on floor, walls, ceiling and the back wall
  const iw = w - 2 * wall, ih = h - 2 * wall, m = S.clay(inner, { rough: 0.85 });
  const back = new THREE.Mesh(S.roundBox(iw, ih, 0.2, 0.05), m); back.position.set(0, wall, -d + 0.1); back.receiveShadow = true; G.add(back);
  const floor = new THREE.Mesh(S.roundBox(iw - 0.1, 0.06, d, 0.02), S.clay('#b9bdc3', { rough: 0.8 })); floor.position.set(0, wall - 0.02, -d / 2); floor.receiveShadow = true; G.add(floor);
  G.userData = { floorY: wall + 0.04, iw, ih, d };
  return G;
}

export default function thumbs(H) {
  // the vault cutaway: silver bars piled into a mountain inside; two red cowboy mannequins on top; sky behind
  async function vaultCut(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadMannequins(['suit', 'overcoat']);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.1, 5000);
      const sky = await skyTex(ctx.renderer, P0.sky ?? 'kloppenheim_06_puresky');
      scene.background = sky.tex; scene.backgroundIntensity = P0.bgI ?? 1.0; scene.backgroundRotation = new THREE.Euler(0, P0.skyRot ?? 1.2, 0);
      scene.environment = sky.env; scene.environmentIntensity = P0.envI ?? 0.9;
      const sun = new THREE.DirectionalLight('#fff4e6', 2.6); sun.position.set(-30, 50, 40); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
      const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 200; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun);
      const box = cutawayBox({ w: 18, h: P0.boxH ?? 12, d: 11 }); scene.add(box);
      // pedestal slab under the box (the box sits on a pale concrete pad)
      const pad = new THREE.Mesh(S.roundBox(24, 0.6, 16, 0.2), S.clay('#d9d7d1', { rough: 0.9 })); pad.position.set(0, -0.6, -5); pad.receiveShadow = true; scene.add(pad);
      // the silver mountain: a stepped pile of real bars (instanced), filling the box
      const geo = S.barGeometry(), mat = S.barMaterial(); const items = []; const fy = box.userData.floorY;
      const L = 3.05, W = 1.36, Hh = 0.86;
      const layers = P0.layers ?? 6;
      for (let l = 0; l < layers; l++) { const nx = 5 - Math.floor(l * 0.75), nz = 7 - l; for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) items.push({ p: [(i - (nx - 1) / 2) * L * 1.0, fy + l * Hh, -5.6 + (k - (nz - 1) / 2) * W * 1.02], r: [0, (S.hash(i, k, l) - 0.5) * 0.04, 0], c: new THREE.Color().setScalar(0.9 + S.hash(k, i, l) * 0.1) }); }
      const pile = S.instances(geo, mat, items); scene.add(pile);
      const topY = fy + layers * Hh;
      // the brothers, in red, on top
      const b1 = PR.mannequin('suit', PR.MQ.red, { hat: 'cowboy', unit: P0.unit ?? 1.7 }); const b2 = PR.mannequin('overcoat', PR.MQ.red, { hat: 'cowboy', unit: P0.unit ?? 1.7 });
      b1.root.position.set(-1.2, topY, -5.2); b1.root.rotation.y = 0.35; b2.root.position.set(1.4, topY, -5.8); b2.root.rotation.y = -0.4;
      scene.add(b1.root, b2.root);
      for (const o of [box, pad]) o.traverse(m => { if (m.isMesh && m.material) { m.material.envMap = sky.env; m.material.envMapIntensity = 0.7; } });
      mat.envMap = sky.env; mat.envMapIntensity = 1.5;
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.8, intensity: 2.0, falloff: 0.8 }, tone: 'neutral', quality: 'high' });
      const layer = H.layerOf(ctx);
      return {
        scene, camera, layer,
        update(t) {
          b1.play(P0.clip1 ?? 'idle', 1.2 + t).update(); b2.play(P0.clip2 ?? 'idle_b', 0.8 + t).update();
          S.rig(camera, P0.keys ?? [{ pos: [11, 5.5, 25], look: [0, 4.4, -4], mm: 32 }, { pos: [5, 5.0, 21], look: [0, 4.6, -4], mm: 34 }], t, { t0: 0, t1: shot.duration ?? 4, float: 0.02 });
        },
      };
  }
  return { 'thumb-vault': vaultCut, cutaway: vaultCut };
}
