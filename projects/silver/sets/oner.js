// COLD OPEN one-take (episode 7). Grandma's fork → crucible → ingot → the reveal: the foundry stands on a mountain of
// silver bars with two tiny cowboy-hat figures at the summit.
// Cue words (params.cues overrides { name: { word, at } }; at = default seconds):
//   fork   the fork lifts off the velvet          spoon  a spoon follows       coins  coins tip in
//   pour   the crucible tilts and pours           bar    the bar is lifted out (cooled)
//   reveal the crane up and back                  brothers  the figures' pill
// Everything is a pure function of t.
import * as THREE from 'three';
import * as S from './studio-kit.js';
import * as PR from './silver-props.js';

const BAR = { l: 3.05, w: 1.36, h: 0.86 };

// stepped "mountain" of bars: layers shrink by one bar on each side; textured in world units so each cell reads as a bar
function mountainGeometry({ nx = 40, nz = 70, layers = 18 } = {}) {
  const pos = [], nor = [], uv = [], idx = [];
  const quad = (a, b, c, d, n, uvs) => { const i0 = pos.length / 3; for (const p of [a, b, c, d]) pos.push(...p); for (let k = 0; k < 4; k++) nor.push(...n); uv.push(...uvs); idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); };
  for (let i = 0; i < layers; i++) {
    const cx = Math.max(1, nx - 2 * i), cz = Math.max(1, nz - 2 * i); const X = cx * BAR.l / 2, Z = cz * BAR.w / 2, y0 = i * BAR.h, y1 = y0 + BAR.h;
    // top (only the ring not covered by the next layer would be visible; draw all, cheap)
    quad([-X, y1, Z], [X, y1, Z], [X, y1, -Z], [-X, y1, -Z], [0, 1, 0], [-X / BAR.l, Z / BAR.w, X / BAR.l, Z / BAR.w, X / BAR.l, -Z / BAR.w, -X / BAR.l, -Z / BAR.w]);
    // sides: front/back show bar ends (cells w×h), left/right show bar long faces (cells l×h)
    const vy0 = y0 / BAR.h, vy1 = y1 / BAR.h;
    quad([-X, y0, Z], [X, y0, Z], [X, y1, Z], [-X, y1, Z], [0, 0, 1], [-X / BAR.l, vy0, X / BAR.l, vy0, X / BAR.l, vy1, -X / BAR.l, vy1]);
    quad([X, y0, -Z], [-X, y0, -Z], [-X, y1, -Z], [X, y1, -Z], [0, 0, -1], [X / BAR.l, vy0, -X / BAR.l, vy0, -X / BAR.l, vy1, X / BAR.l, vy1]);
    quad([X, y0, Z], [X, y0, -Z], [X, y1, -Z], [X, y1, Z], [1, 0, 0], [Z / BAR.w, vy0, -Z / BAR.w, vy0, -Z / BAR.w, vy1, Z / BAR.w, vy1]);
    quad([-X, y0, -Z], [-X, y0, Z], [-X, y1, Z], [-X, y1, -Z], [-1, 0, 0], [-Z / BAR.w, vy0, Z / BAR.w, vy0, Z / BAR.w, vy1, -Z / BAR.w, vy1]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
// cell texture for the mountain: a rounded bar face with dark seams (bump) and a faint stamp
function cellTextures() {
  const bump = S.canvasTex(256, 128, (g, W, H) => { g.fillStyle = '#202020'; g.fillRect(0, 0, W, H); g.fillStyle = '#9a9a9a'; g.beginPath(); g.roundRect(7, 7, W - 14, H - 14, 16); g.fill(); g.filter = 'blur(3px)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none'; g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.roundRect(W * 0.3, H * 0.3, W * 0.4, H * 0.4, 8); g.fill(); }, { srgb: false, repeat: [1, 1] });
  const col = S.canvasTex(256, 128, (g, W, H) => { g.fillStyle = '#4c4c4c'; g.fillRect(0, 0, W, H); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dedede'); g.fillStyle = gr; g.beginPath(); g.roundRect(5, 5, W - 10, H - 10, 16); g.fill(); g.filter = 'blur(1.5px)'; g.drawImage(g.canvas, 0, 0); }, { repeat: [1, 1] });
  return { bump, col };
}

export default function oner(H) {
  return {
    async 'cold-open'(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadFont();
      const C = { fork: 1.2, spoon: 3.0, coins: 4.4, pour: 6.5, bar: 11.5, reveal: 13.5, brothers: 18.5, ...(P0.at ?? {}) };
      const cues = P0.cues ?? {};
      for (const k of Object.keys(C)) C[k] = S.cue(shot, cues[k] ?? null, C[k]);
      // force order with minimum gaps
      const order = ['fork', 'spoon', 'coins', 'pour', 'bar', 'reveal', 'brothers'], gap = [0, 1.0, 0.9, 1.2, 3.2, 1.4, 2.5];
      for (let i = 1; i < order.length; i++) C[order[i]] = Math.max(C[order[i]], C[order[i - 1]] + gap[i]);
      const dur = Math.max(shot.duration ?? 24, C.brothers + 4);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 0.05, 3000);
      // the mountain: the summit plateau is at y = TOP; the foundry table stands on it
      const NX = 40, NZ = 56, LAYERS = 16, TOP = LAYERS * BAR.h;
      const st = S.studio(scene, ctx.renderer, { target: [0, TOP, 0], span: 9, az: 128, el: 46, fog: [260, 900], cyc: { width: 1600, depth: 900, radius: 200, height: 700 }, contact: false });
      const tex = cellTextures();
      const mMat = S.silverMat({ rough: 0.24 }); mMat.map = tex.col; mMat.bumpMap = tex.bump; mMat.bumpScale = 3.5; mMat.roughnessMap = null;
      const mountain = new THREE.Mesh(mountainGeometry({ nx: NX, nz: NZ, layers: LAYERS }), mMat); mountain.castShadow = mountain.receiveShadow = true; scene.add(mountain);
      // summit: real bars in the top layer around the foundry (detailed), so close-ups read as real metal
      const barGeo = S.barGeometry(), barMat = S.barMaterial();
      const top = [];
      const tx = NX - 2 * LAYERS, tz = NZ - 2 * LAYERS; // cells on the summit
      for (let i = 0; i < tx; i++) for (let k = 0; k < tz; k++) { const x = (i - (tx - 1) / 2) * BAR.l, z = (k - (tz - 1) / 2) * BAR.w; if (Math.abs(x) < 7 && Math.abs(z) < 5) continue; top.push({ p: [x, TOP, z], r: [0, (S.hash(i, k) - 0.5) * 0.02, 0], c: new THREE.Color().setScalar(0.9 + S.hash(k, i) * 0.1) }); }
      scene.add(S.instances(barGeo, barMat, top));
      // the summit pad: a velvet tray (fork), crucible, mould
      const tray = new THREE.Mesh(S.roundBox(3.4, 0.12, 2.0, 0.06), S.velvet('#1d3557')); tray.position.set(-4.2, TOP, 0.6); tray.receiveShadow = true; tray.castShadow = true; scene.add(tray);
      const plinth = new THREE.Mesh(S.roundBox(14, 0.3, 10, 0.1), S.clay('#ece7dc', { rough: 0.8 })); plinth.position.set(0, TOP - 0.31, 0); plinth.receiveShadow = true; scene.add(plinth);
      const fork = new THREE.Mesh(PR.forkGeometry(), S.polishedSilver({ rough: 0.06 })); fork.castShadow = true; scene.add(fork);
      const spoon = new THREE.Mesh(PR.spoonGeometry(), S.polishedSilver({ rough: 0.06 })); spoon.castShadow = true; scene.add(spoon);
      const coinGeo = S.coinGeometry({ r: 0.19 }), coinMat = S.polishedSilver({ rough: 0.12 });
      const coins = new THREE.InstancedMesh(coinGeo, coinMat, 9); coins.castShadow = true; scene.add(coins);
      // the crucible pivots on its right lip (toward the mould)
      const cruPivot = new THREE.Group(); const LIP = [0.54, TOP + 1.4, 0.2]; cruPivot.position.set(...LIP); scene.add(cruPivot);
      const cru = PR.crucible({ r: 0.9, h: 1.4 }); cru.position.set(-0.94, -1.4, 0); cruPivot.add(cru); cru.userData.setLevel(0.55);
      const MO = { x: 3.4, z: 0.4 };
      const mould = PR.mould({ l: 3.4, w: 1.6, h: 0.95 }); mould.position.set(MO.x, TOP, MO.z); scene.add(mould);
      const stream = PR.pourStream([LIP[0] + 0.95, LIP[1] + 1.05, 0.2], [MO.x - 0.3, TOP + 0.75, MO.z], { r: 0.06 }); scene.add(stream);
      // the new bar (glowing → silver), lifted out and set down at the summit edge
      const hot = PR.moltenMat(1); const cold = S.barMaterial({ serial: 'Nº 1980-0118' });
      const newBar = new THREE.Mesh(barGeo, cold); newBar.castShadow = true; scene.add(newBar);
      const glowBar = new THREE.Mesh(barGeo, hot); glowBar.scale.setScalar(1.002); scene.add(glowBar);
      // the brothers (tiny figurines at the summit edge, looking out)
      const fig = (o) => { const p = PR.person(o); p.scale.setScalar(0.55); scene.add(p); return p; };
      const b1 = fig({ hat: 'cowboy', coat: '#14233d', tie: '#e0241b' }); b1.position.set(6.4, TOP, -2.6); b1.rotation.y = -0.5;
      const b2 = fig({ hat: 'stetson', coat: '#5b6b80' }); b2.position.set(7.6, TOP, -2.0); b2.rotation.y = -0.8;
      st.applyEnv();
      const fx = H.P.post(ctx, scene, camera, { ao: { radius: 0.6, intensity: 1.8, falloff: 0.8 }, dof: { focus: 6, range: 2, bokeh: 3.6 }, bloom: { intensity: 1.2, threshold: 1.1, radius: 0.75 }, tone: 'neutral', quality: P0.quality ?? 'high' });

      // ---- DOM: date slab + price counter + brothers pill + reveal caption
      const layer = H.layerOf(ctx);
      const cap = H.caption(layer, P0.date ?? 'WINTER 1979–80', 'left:5.5%;top:7.5%', { at: 0.4 });
      const sc = H.sc();
      const price = H.K.div(layer, `opacity:0;left:5.5%;top:15%;font:700 ${120 * sc}px 'Archivo Narrow';color:#14233d;letter-spacing:-.01em;line-height:1`, '');
      const priceSub = H.K.div(layer, `opacity:0;left:5.6%;top:27.5%;font:600 ${26 * sc}px 'Plex Mono';letter-spacing:.12em;color:#4b5a70;background:rgba(251,248,242,.85);padding:.3em .6em;border-radius:.3em`, 'SILVER · $ PER OUNCE');
      const pill = H.pill(layer, P0.pill ?? 'THE HUNT BROTHERS', { size: 30 });
      const src = H.sourceLine(layer, P0.source ?? 'ILLUSTRATION · NOT TO SCALE');
      const P6 = P0.from ?? 6, P50 = P0.to ?? 50;
      const priceAt = S.cue(shot, P0.priceAt ?? cues.price ?? 'fifty', C.bar + 0.4);

      // camera keys (positions relative to the summit). The move is continuous: macro on the fork → follow → crane out.
      const T = (x, y, z) => [x, TOP + y, z];
      const shots = [
        { t: 0, pos: T(-6.2, 0.9, 3.2), look: T(-4.1, 0.15, 0.6), mm: 90 },
        { t: C.fork + 0.4, pos: T(-5.4, 1.6, 4.4), look: T(-3.0, 0.7, 0.5), mm: 70 },
        { t: C.coins + 0.6, pos: T(-3.2, 3.0, 6.0), look: T(-0.6, 1.2, 0.3), mm: 60 },
        { t: C.pour + 1.0, pos: T(0.6, 3.6, 9.0), look: T(1.9, 1.5, 0.4), mm: 50 },
        { t: C.bar, pos: T(3.4, 3.2, 9.0), look: T(3.6, 0.9, 0.4), mm: 50 },
        { t: C.bar + 1.6, pos: T(6.0, 3.8, 9.5), look: T(5.0, 0.9, 0.6), mm: 50 },
        { t: C.reveal + 0.2, pos: T(8, 6, 14), look: T(4, 0.6, -1), mm: 42 },
        { t: C.brothers, pos: T(38, 22, 70), look: T(2, -TOP * 0.45, -4), mm: 35 },
        { t: dur, pos: T(46, 26, 84), look: T(2, -TOP * 0.5, -4), mm: 35 },
      ];
      const camAt = (t) => {
        let i = 0; while (i < shots.length - 2 && t > shots[i + 1].t) i++;
        const a = shots[i], b = shots[i + 1]; const u = S.inOutSine(S.range(t, a.t, b.t));
        // blend through a Catmull-Rom of all keys for smooth velocity across keys
        const keys = shots.map(s => ({ pos: s.pos, look: s.look, mm: s.mm }));
        const uu = (i + u) / (shots.length - 1);
        return S.rig(camera, keys, uu, { t0: 0, t1: 1, ease: (x) => x, float: t < C.reveal ? 0.015 : 0.0, seed: 3 });
      };
      const dropIn = (t0, t, from, into) => { // arc from `from` to `into` over 1.0 s, then sink
        const u = S.range(t, t0, t0 + 1.0); const e = S.inOut(u);
        const p = [S.lerp(from[0], into[0], e), S.lerp(from[1], into[1], e) + Math.sin(Math.PI * Math.min(1, u * 1.05)) * 1.3, S.lerp(from[2], into[2], e)];
        const sink = S.range(t, t0 + 1.0, t0 + 1.7); p[1] -= sink * 0.9;
        return { p, u, sink, gone: sink >= 1 };
      };
      const melt = cru.userData.melt;
      const glow = cru.userData.glow;
      return {
        scene, camera, layer,
        update(t) {
          const c = camAt(t);
          // fork: rests on velvet, lifts at C.fork (spring), flips tines-down, drops into the crucible
          const forkRest = [-4.2, TOP + 0.13, 0.6], into = [-0.4, TOP + 1.2, 0.2];
          const lift = S.spring(t - C.fork, { zeta: 0.55, freq: 1.6 });
          if (t < C.fork + 0.9) { fork.position.set(forkRest[0], forkRest[1] + lift * 1.4, forkRest[2]); fork.rotation.set(0, 0.35 + lift * 0.3, lift * 0.25); fork.visible = true; }
          else { const d = dropIn(C.fork + 0.9, t, [forkRest[0], forkRest[1] + 1.4, forkRest[2]], into); fork.position.set(...d.p); fork.rotation.set(0, 0.65, 0.25 - d.u * 1.6); fork.visible = !d.gone; }
          // spoon, then coins
          const sd = dropIn(C.spoon, t, [-4.6, TOP + 2.6, -1.2], into); spoon.position.set(...sd.p); spoon.rotation.set(0.3, -0.4, -0.3 - sd.u * 1.4); spoon.visible = t >= C.spoon - 0.4 && !sd.gone; spoon.scale.setScalar(S.outBack(S.range(t, C.spoon - 0.4, C.spoon)));
          for (let k = 0; k < 9; k++) { const t0 = C.coins + k * 0.09; const d = dropIn(t0, t, [-3.8 + k * 0.15, TOP + 3.0 + (k % 3) * 0.2, -0.8 + (k % 2) * 0.3], [into[0] + Math.sin(k) * 0.2, into[1], into[2] + Math.cos(k) * 0.2]);
            const vis = t >= t0 - 0.3 && !d.gone; S.place(coins, k, d.p, [k + d.u * 6, k, d.u * 3], vis ? S.outBack(S.range(t, t0 - 0.3, t0)) * 1.4 : 0.0001); }
          coins.instanceMatrix.needsUpdate = true;
          // melt pulses when things go in
          const hits = [C.fork + 1.9, C.spoon + 1.0, C.coins + 1.2].map(h => Math.exp(-Math.max(0, t - h) * 3) * (t > h ? 1 : 0));
          const pulse = hits.reduce((a, b) => a + b, 0);
          melt.material.emissiveIntensity = 3 + pulse * 3; glow.intensity = 6 + pulse * 8;
          // pour: the crucible tilts toward the mould (pivot), stream, mould fills
          const tilt = S.inOut(S.range(t, C.pour, C.pour + 1.2)) - S.inOut(S.range(t, C.pour + 3.4, C.pour + 4.2));
          cruPivot.rotation.z = -tilt * 1.15; cruPivot.position.set(LIP[0] + tilt * 0.95, LIP[1] + tilt * 1.1, LIP[2]);
          cru.userData.setLevel(0.55 - S.range(t, C.pour + 1.0, C.pour + 3.6) * 0.4);
          const s0 = S.range(t, C.pour + 0.9, C.pour + 1.3), s1 = S.range(t, C.pour + 3.3, C.pour + 3.8);
          stream.userData.set(s1, s0); stream.material.emissiveIntensity = 3.4;
          mould.userData.setFill(S.smoother(S.range(t, C.pour + 1.2, C.pour + 3.6)) * 0.95);
          // cool: the mould's fill fades from glowing to silver (crossfade by hiding the fill, showing the bar in place)
          const cool = S.range(t, C.pour + 3.8, C.bar - 0.2);
          mould.userData.fill.material.emissiveIntensity = 3 * (1 - cool) + 0.05; mould.userData.fill.visible = t < C.bar - 0.15;
          // the bar: sits in the mould (y slightly sunk) then lifts out at C.bar (spring), swings to the summit edge, sets down
          const barIn = t >= C.bar - 0.2;
          const up = S.spring(t - C.bar, { zeta: 0.5, freq: 1.4 });
          const mv = S.inOut(S.range(t, C.bar + 0.9, C.bar + 2.2));
          const bx = S.lerp(MO.x, 5.6, mv), bz = S.lerp(MO.z, 1.6, mv), by = TOP + 0.12 + up * 0.8 * (1 - S.range(t, C.bar + 1.8, C.bar + 2.4)) + (1 - mv) * 0.0;
          newBar.visible = barIn; glowBar.visible = barIn && t < C.bar + 1.2;
          newBar.position.set(bx, by, bz); newBar.rotation.set(0, mv * 0.4, (1 - mv) * up * 0.08);
          glowBar.position.copy(newBar.position); glowBar.rotation.copy(newBar.rotation);
          glowBar.material.emissiveIntensity = 3.0 * (1 - S.range(t, C.bar - 0.2, C.bar + 1.2)); glowBar.material.opacity = 1;
          // figures pop at the reveal (they were always there; tiny bob)
          b1.position.y = TOP + Math.max(0, Math.sin(t * 2.1)) * 0.0; b2.position.y = TOP;
          // focus follows the action, then opens up for the reveal
          const focusD = t < C.pour ? c.dist : t < C.reveal ? c.dist : c.dist * 0.9;
          fx.focus(focusD); fx.set({ bokeh: S.lerp(3.6, 1.2, S.range(t, C.reveal, C.brothers)) });
          // shadows follow the camera's area of interest (tight frustum early, wide for the reveal)
          const span = S.lerp(9, 110, S.smoother(S.range(t, C.reveal, C.brothers)));
          const kc = st.key.shadow.camera; if (Math.abs(kc.right - span) > 0.01) { kc.left = -span; kc.right = span; kc.top = span; kc.bottom = -span; kc.far = 400 + span * 4; kc.updateProjectionMatrix(); }
          st.key.position.set(-Math.sin(128 * Math.PI / 180) * 0.68 * 200, TOP + 0.77 * 200, Math.cos(128 * Math.PI / 180) * 0.68 * 200); st.key.target.position.set(0, TOP * (1 - S.range(t, C.reveal, C.brothers)), 0); st.key.target.updateMatrixWorld();
          // DOM
          cap?.type(t);
          const pk = S.range(t, priceAt - 0.3, priceAt + 1.6);
          const val = t < priceAt - 0.3 ? P6 : S.lerp(P6, P50, S.outQuint(S.range(t, priceAt - 0.3, priceAt + 1.6)));
          const pVis = S.range(t, C.bar - 0.6, C.bar) * (1 - S.range(t, C.brothers - 0.6, C.brothers));
          price.style.opacity = priceSub.style.opacity = String(pVis);
          price.textContent = `$${val.toFixed(val < 10 ? 2 : 2)}`; price.style.color = pk >= 1 ? '#e0241b' : '#14233d';
          // the brothers pill, projected from the figures' heads
          const hp = new THREE.Vector3(7.0, TOP + 1.5, -2.3).project(camera);
          const pa = S.range(t, C.brothers - 0.3, C.brothers + 0.3);
          pill.at((hp.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-hp.y * 0.5 + 0.5) * 1080, pa);
          if (src) src.style.opacity = String(S.range(t, C.reveal, C.reveal + 0.6));
        },
      };
    },
  };
}
