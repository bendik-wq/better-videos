// Cinematography layer: spline camera rigs, follow cams, animated characters, HDR skies.
// Everything is deterministic in time t so frames can render in any order / any worker.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as K from 'kit';

const chars = {}, skies = {}, envs = {};

export async function preload(renderer, { characters = ['Soldier', 'Xbot'], hdris = [] } = {}) {
  const gl = new GLTFLoader(), rl = new RGBELoader();
  await Promise.all([
    ...characters.map(async (n) => { chars[n] = await gl.loadAsync(`/assets/models/${n}.glb`); }),
    ...hdris.map(async (n) => {
      const tex = await rl.loadAsync(`/assets/hdri/${n}.hdr`); tex.mapping = THREE.EquirectangularReflectionMapping; skies[n] = tex;
      const pm = new THREE.PMREMGenerator(renderer); envs[n] = pm.fromEquirectangular(tex).texture; pm.dispose();
    }),
  ]);
}

// HDR sky: image-based lighting + optional visible background.
export function sky(scene, name, { background = true, intensity = 1, bgIntensity = 1, blur = 0 } = {}) {
  scene.environment = envs[name]; scene.environmentIntensity = intensity;
  if (background) { scene.background = skies[name]; scene.backgroundIntensity = bgIntensity; scene.backgroundBlurriness = blur; }
}

// ---------- characters ----------
const SILHOUETTE = () => new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.55, metalness: 0.1 });
export function character(name = 'Soldier', { clip = 'Idle', material = 'silhouette', scale = 1, phase = 0, speed = 1 } = {}) {
  const src = chars[name]; const root = SkeletonUtils.clone(src.scene); root.scale.setScalar(scale);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; if (material === 'silhouette') o.material = SILHOUETTE(); else if (material) o.material = material; } });
  const mixer = new THREE.AnimationMixer(root); const actions = {};
  for (const c of src.animations) actions[c.name] = mixer.clipAction(c);
  let current = actions[clip] ?? Object.values(actions)[0]; current?.play();
  const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o; });
  return {
    root, bones,
    play(c) { if (actions[c] && actions[c] !== current) { current?.stop(); current = actions[c]; current.play(); } },
    update(t) { mixer.setTime(Math.max(0, t * speed + phase)); root.updateMatrixWorld(true); },
    // add rotations (radians) on top of the animated pose, e.g. { RightArm: [x, y, z] }
    pose(map, k = 1) { for (const b in map) { const n = bones[b]; if (!n) continue; const [x, y, z] = map[b]; n.rotation.x += x * k; n.rotation.y += y * k; n.rotation.z += z * k; } },
  };
}

// Skydiver arch: arms out and up, legs bent back.
export const POSE_FREEFALL = { LeftArm: [0, 0, -0.2], RightArm: [0, 0, 0.2], LeftForeArm: [0, 0, -0.6], RightForeArm: [0, 0, 0.6], LeftUpLeg: [0.35, 0, 0], RightUpLeg: [0.35, 0, 0], LeftLeg: [-1.1, 0, 0], RightLeg: [-1.1, 0, 0], Spine: [-0.25, 0, 0] };
export const POSE_RAISE_RIGHT = { RightArm: [0, 0, 1.6], RightForeArm: [0, 0, 0.3] };

// ---------- camera rigs ----------
const V = (a) => new THREE.Vector3(...a);
// Spline camera: keys = [{ pos, look, fov? }...]; travels the curve with a smooth ease.
export function rig(keys, { ease = K.inOut, float = 0.04, seed = 0 } = {}) {
  const P = new THREE.CatmullRomCurve3(keys.map(k => V(k.pos)), false, 'centripetal');
  const L = new THREE.CatmullRomCurve3(keys.map(k => V(k.look)), false, 'centripetal');
  const fovs = keys.map(k => k.fov ?? null);
  return (camera, p, t) => {
    const u = ease(K.clamp(p)); const pos = P.getPoint(u), look = L.getPoint(u); const h = K.handheld(t, float, seed);
    camera.position.set(pos.x + h.x, pos.y + h.y, pos.z); camera.lookAt(look); camera.rotation.z += h.r;
    if (fovs[0] !== null) { const f = u * (fovs.length - 1); const i = Math.min(fovs.length - 2, Math.floor(f)); camera.fov = K.lerp(fovs[i], fovs[i + 1], f - i); camera.updateProjectionMatrix(); }
  };
}

// ---------- clouds ----------
let cloudTex = null;
function cloudTexture() {
  if (cloudTex) return cloudTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const r = K.rng(5);
  for (let i = 0; i < 90; i++) { const px = 128 + (r() - 0.5) * 140, py = 128 + (r() - 0.5) * 90, rad = 20 + r() * 50;
    const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  cloudTex = new THREE.CanvasTexture(c); cloudTex.colorSpace = THREE.SRGBColorSpace; return cloudTex;
}
export function cloudLayer(scene, { y = -60, spread = 600, count = 160, size = 90, color = 0xfff4e8, seed = 3 } = {}) {
  const g = new THREE.Group(); const r = K.rng(seed); const tex = cloudTexture();
  for (let i = 0; i < count; i++) { const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, opacity: 0.85, fog: false });
    const s = new THREE.Sprite(m); const sc = size * (0.6 + r()); s.scale.set(sc, sc * 0.6, 1); s.position.set((r() - 0.5) * spread, y - r() * 40, (r() - 0.5) * spread); g.add(s); }
  scene.add(g); return g;
}
