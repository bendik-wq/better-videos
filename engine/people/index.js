// engine/people: believable people for documentary shots (CPU-rendered, deterministic in t).
//
//   import * as PE from '/engine/people/index.js';
//   await PE.preload({ wardrobe: ['suit', 'analyst'] });          // clips.glb + bodies
//   const man = PE.person('suit', { dress: { outfit: { fabric: 'wool', color: 0x2b2d33 } } });
//   scene.add(man.root);
//   // in update(t): any of
//   man.play('idle', t).update();                                 // one clip
//   man.blend([['walk', t, 0.3], ['idle', t, 0.7]]).update();     // weighted clips, pure in t
//   const w = PE.walker(man, [[0, 0], [0, 8], [3, 14]], { clip: 'walk', t0: 0.5 }); w.update(t);
//   PE.acts.typing(man, t, { keys, screen });                     // IK acts on top of clips
//   const crowd = await PE.crowd(scene, { renderer, agents: PE.layouts.protest({ count: 800 }), clips: [...] });
//   crowd.update(t, camera);
//   const lights = PE.look.rig(scene, 'backlit'); lights.update(subjectPos, camera);
//
// Wardrobe (assets/people/wardrobe/*.glb, MakeHuman CC0 bodies + CC0/CC-BY clothes, see
// assets/CREDITS.md): suit, suit_b, suit_f, overcoat, military, hoodie, office, office_f, analyst,
// casual_a, casual_b, casual_f, protestor, labcoat, robe (+ <id>_lod1 for crowds).
// Clips (assets/people/clips.glb, CMU mocap, retargeted offline): walk, walk_b, walk_c, walk_slow,
// walk_brisk, walk_sad, walk_heavy, march, jog, run, idle, idle_b, idle_c, wait, look_around,
// talk, talk_b, argue, point, phone, fists, sit_idle, sit_type, sit_think, pace.
// Rebuild: engine/people/build/build_all.sh (Blender 4.2 + MPFB2 offline; see its header).
import * as PC from './core.js';
import * as look from './look.js';
import * as props from './props.js';
import * as acts from './acts.js';
import * as layouts from './layouts.js';
import { crowd } from './crowd.js';

export { PC as core, look, props, acts, layouts, crowd };
export const { Person, walker, groundPath, gait, contactAt, clip, lib } = PC;

export async function preload({ wardrobe = [], clips = true } = {}) {
  if (clips) await PC.loadClips();
  await Promise.all(wardrobe.map(id => PC.loadBody(id)));
}

// A dressed person. opts.dress: options for look.dresser (outfit/garments/skin/hair/silhouette),
// or a function (role, mesh) -> material. opts.scale: height scale (1 = the body as built).
export function person(id, { dress = {}, scale = 1, shadows = true } = {}) {
  const body = PC.lib.bodies[id]; if (!body) throw new Error(`[people] body ${id} not preloaded: PE.preload({ wardrobe: ['${id}'] })`);
  const p = new PC.Person(body, { scale });
  p.dress(typeof dress === 'function' ? dress : look.dresser(dress));
  p.castShadow = shadows; p.meshes.forEach(m => m.receiveShadow = true);
  return p;
}
