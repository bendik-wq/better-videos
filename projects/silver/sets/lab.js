// Look-dev sets for the studio look (not used in the episode).
import * as THREE from 'three';
import * as S from './studio-kit.js';

export default function lab(H) {
  return {
    async 'lab-stack'(ctx, shot) {
      const P0 = shot.params ?? {};
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.5, 2000);
      const st = S.studio(scene, ctx.renderer, { ...(P0.studio ?? {}), target: [0, 0, 0], span: 14, az: P0.az ?? 125, el: P0.el ?? 40, contact: P0.nocontact ? false : { w: 36, d: 28, blur: 2.6, darkness: 1.1, opacity: 0.8 } });
      const geo = S.barGeometry();
      const mat = S.barMaterial({ serial: 'Nº 1980-0117' });
      // pyramid 6-5-4-3 rows (alternating orientation like a vault stack)
      const items = [];
      const L = 3.05, W = 1.36, Hh = 0.86;
      let layer = 0;
      for (const [nx, nz] of [[4, 6], [3, 5], [2, 4], [1, 3]]) {
        for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
          const x = (i - (nx - 1) / 2) * L, z = (k - (nz - 1) / 2) * W;
          items.push({ p: [x + (S.hash(i, k, layer) - 0.5) * 0.06, layer * Hh, z + (S.hash(k, i, layer) - 0.5) * 0.05], r: [0, (S.hash(layer, i, k) - 0.5) * 0.03, 0], c: new THREE.Color().setScalar(0.9 + S.hash(i, k, layer, 9) * 0.1) });
        }
        layer++;
      }
      const stack = S.instances(geo, mat, items); scene.add(stack);
      // hero bar that drops onto the top with a spring settle
      const hero = new THREE.Mesh(geo, S.barMaterial({ serial: 'Nº 1980-0127', rough: 0.17 })); hero.castShadow = hero.receiveShadow = true; scene.add(hero);
      // a loose coin pile in front
      const cgeo = S.coinGeometry(), cmat = S.polishedSilver();
      const r = S.rng(4), coins = [];
      for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 1.6; coins.push({ p: [5.2 + Math.cos(a) * d, 0.0 + Math.floor(i / 9) * 0.022, 4.2 + Math.sin(a) * d * 0.7], r: [(r() - 0.5) * 0.06, r() * 6, (r() - 0.5) * 0.06], s: 3 }); }
      scene.add(S.instances(cgeo, cmat, coins));
      st.applyEnv();
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.9, intensity: 2.0, falloff: 0.8 }, dof: P0.dof === false ? false : { focus: 22, range: 6, bokeh: P0.bokeh ?? 3.2 }, tone: P0.tone ?? 'neutral', quality: P0.quality ?? 'high' });
      scene.userData.post = fx; if (P0.nopost) fx.enabled = false;
      const layerEl = H.layerOf(ctx);
      const keys = P0.keys ?? [
        { pos: [-17, 9.5, 25], look: [0, 2.2, 0], mm: 45 },
        { pos: [-9, 6.5, 20], look: [0.5, 2.6, 0], mm: 55 },
      ];
      return {
        scene, camera, layer: layerEl,
        update(t) {
          const dur = shot.duration ?? 8;
          const c = S.rig(camera, keys, t, { t0: 0, t1: dur, float: 0.04 });
          const at = P0.dropAt ?? 1.0;
          const d = S.drop(t - at, { h: 7, g: 60, e: 0.22, bounces: 2 });
          const topY = 4 * Hh;
          hero.position.set(0, topY + d.y, 0);
          const tilt = (1 - S.spring(t - at - 0.3, { zeta: 0.35, freq: 3 })) * 0.12;
          hero.rotation.set(tilt * 0.4, 0.08 + (1 - S.smoother(S.range(t, at, at + 0.6))) * 0.5, tilt);
          if (fx.dof) fx.focus?.(c.dist) ?? (fx.dof.cocMaterial.focusDistance = c.dist);
          st.contact?.update([st.cyc]);
        },
        dispose() { st.contact?.dispose(); },
      };
    },
  };
}
