import * as THREE from 'three';
import * as K from 'kit';
import * as PC from '/engine/people/core.js';
import * as LK from '/engine/people/look.js';
import { qa } from './qa.js';
import * as CR from '/engine/people/crowd.js';
import * as LY from '/engine/people/layouts.js';
import * as SH from './shots.js';
import * as PE from '/engine/people/index.js';

async function dev(ctx, shot) {
  const { width, height } = ctx; const pr = shot.params;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x15171a);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 200);
  scene.add(new THREE.HemisphereLight(0xdde6ff, 0x302820, pr.fill ?? 0.8));
  const lr = LK.rig(scene, pr.light ?? 'backlit');
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const bodies = pr.bodies ?? [pr.body ?? 'suit'];
  const clips = pr.clips ?? (pr.bodies ? pr.bodies.map(() => 'idle') : ['walk', 'idle', 'sit_type']);
  const ps = [];
  for (let i = 0; i < clips.length; i++) { const c = clips[i]; const body = await PC.loadBody(bodies[i % bodies.length]); const p = new PC.Person(body); ps.push(p); p.dress(LK.dresser({ outfit: { fabric: 'wool' } })); p.castShadow = true; scene.add(p.root); p.root.position.x = (i - (clips.length - 1) / 2) * (pr.spacing ?? 1.3); }
  return { scene, camera, update(t) {
    ps.forEach((p, i) => { if (pr.rest) p.update(); else p.play(clips[i], t).update(); });
    const az = (pr.az ?? 0) * Math.PI / 180;
    camera.position.set(Math.sin(az) * (pr.dist ?? 6.5), pr.camY ?? 1.3, Math.cos(az) * (pr.dist ?? 6.5)); camera.lookAt(0, pr.lookY ?? 0.9, 0);
    lr.update(new THREE.Vector3(0, 1.2, 0), camera);
  } };
}

// reference "plain frame": a lit floor and a box with one shadow (normalises timings under load)
function base(ctx) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x202020);
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.1, 100); camera.position.set(0, 2, 8); camera.lookAt(0, 1, 0);
  const L = new THREE.DirectionalLight(0xffffff, 3); L.position.set(3, 6, 2); L.castShadow = true; scene.add(L, new THREE.HemisphereLight(0xffffff, 0x222222, 0.5));
  const f = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x777777 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f);
  const b = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial({ color: 0xaa8866 })); b.position.y = 1; b.castShadow = true; scene.add(b);
  return { scene, camera, update() {} };
}

async function crowdDev(ctx, shot) {
  const { width, height, renderer } = ctx; const pr = shot.params;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1d22); scene.fog = new THREE.Fog(0x1a1d22, 20, 90);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 400);
  scene.add(new THREE.HemisphereLight(0xdde6ff, 0x302820, 0.6));
  const lr = LK.rig(scene, 'dusk', { shadowExtent: 20 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const agents = LY.protest({ count: pr.count ?? 800, radius: [22, 14], facing: Math.PI, seed: 3 });
  const cr = await CR.crowd(scene, { renderer, agents, clips: ['fists', 'idle', 'wait', 'talk', 'argue'] });
  if (pr.atlas) { const g = cr.groups[0]; const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: g.far.userData.rt.texture, transparent: true }));
    const s2 = new THREE.Scene(); s2.background = new THREE.Color(0x335533); s2.add(q); const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); const tx = g.far.userData.rt.texture; tx.repeat.set(1, 2 / 60); tx.offset.set(0, 0); return { scene: s2, camera: oc, update() {} }; }
  return { scene, camera, update(t) {
    camera.position.set(pr.cx ?? 3, pr.cy ?? 1.7, pr.cz ?? -22); camera.lookAt(0, 1.2, 0);
    lr.update(new THREE.Vector3(0, 1, 0), camera); cr.update(t, camera);
  }, crowd: cr };
}

export default async function create(ctx) {
  const { renderer, shots } = ctx;
  await PE.preload({ wardrobe: ['suit', 'analyst', 'robe', 'military', 'protestor', 'hoodie', 'casual_f'] });
  if (new URLSearchParams(location.search).get('qa')) await qa(ctx);
  const live = new Map();
  for (const s of shots) live.set(s.id, SH[s.set] ? await SH[s.set](ctx, s) : s.set === 'base' ? base(ctx) : s.set === 'crowd' ? await crowdDev(ctx, s) : await dev(ctx, s));
  if (new URLSearchParams(location.search).get('bench')) {
    const gl = renderer.getContext(); const px = new Uint8Array(4);
    for (const s of shots) { const i = live.get(s.id); const ts = [];
      // per sample time: best of 3 renders (contention from other processes only ever adds time)
      for (let k = 0; k < 10; k++) { const t = s.duration * (k + 0.5) / 10; let best = 1e9;
        for (let rep = 0; rep < 3; rep++) { const a = performance.now(); i.update(t, t / s.duration); renderer.render(i.scene, i.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); best = Math.min(best, performance.now() - a); }
        ts.push(best); }
      if (i.crowd && new URLSearchParams(location.search).get('bench') === '2') {
        const time = (label, fn) => { fn(true); const tt = []; for (let k = 0; k < 6; k++) { const t = s.duration * k / 6; const a = performance.now(); i.update(t); renderer.render(i.scene, i.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); tt.push(performance.now() - a); } fn(false); tt.sort((a, b) => a - b); console.log(`[scene] bench ${s.id} ${label}: ${tt[3].toFixed(0)} ms`); };
        const G = i.crowd.groups;
        const lodSave = { ...i.crowd.lod };
        for (const [nm, near, mid] of [['all-impostor', 0, 0], ['mid<60', 0, 60], ['near<60', 60, 60]]) time(nm, on => { i.crowd.lod.near = on ? near : lodSave.near; i.crowd.lod.mid = on ? mid : lodSave.mid; });
        const pr0 = renderer.getPixelRatio();
        time('quarter pixels', on => renderer.setPixelRatio(on ? pr0 * 0.5 : pr0));
        time('no far', on => G.forEach(g => g.far && (g.far.material.visible = !on)));
        time('no mid', on => G.forEach(g => g.mid && (g.mid.material.forEach?.(m => m.visible = !on))));
        time('no shadows', on => { renderer.shadowMap.enabled = !on; i.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); });
        time('empty', on => i.scene.traverse(o => { if (o.isInstancedMesh || o.geometry?.isInstancedBufferGeometry) o.visible = !on; }));
      }
      ts.sort((a, b) => a - b); console.log(`[scene] bench ${s.id}: median ${ts[ts.length >> 1].toFixed(0)} ms, max ${ts.at(-1).toFixed(0)} ms` + (i.crowd ? ' ' + JSON.stringify(i.crowd.stats()) : '') + ` calls ${renderer.info.render.calls} tris ${renderer.info.render.triangles}`); }
  }
  return { frame({ shot, t, p }) { const i = live.get(shot.id); renderer.toneMapping = SH[shot.set] ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = shot.params.exposure ?? 1; i.update(t, p); renderer.render(i.scene, i.camera); } };
}
