// Episode 7 3D sets (studio look). Every set: S.studio + post (AO, DOF, bloom, neutral tone), a continuous camera move
// (Catmull-Rom, smootherstep, micro float), springs for every pop. Params documented in projects/silver/SETS.md.
import * as THREE from 'three';
import * as S from './studio-kit.js';
import * as PR from './silver-props.js';

const BAR = { l: 3.05, w: 1.36, h: 0.86 };
const v3 = (a) => new THREE.Vector3(...a);

// ---------------------------------------------------------------- shared stage
async function stage(H, ctx, shot, o = {}) {
  await PR.loadFont();
  const P0 = shot.params ?? {};
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, o.near ?? 0.1, o.far ?? 3000);
  const st = S.studio(scene, ctx.renderer, { target: o.target ?? [0, 0, 0], span: o.span ?? 12, az: P0.az ?? o.az ?? 125, el: P0.el ?? o.el ?? 42, color: o.color, fog: o.fog, contact: o.contact ?? { w: (o.span ?? 12) * 2.4, d: (o.span ?? 12) * 1.8, blur: 2.4, darkness: 1.0, opacity: 0.7 }, cyc: o.cyc });
  const layer = H.layerOf(ctx);
  const dur = shot.duration ?? 8;
  const cap = P0.caption === null || P0.caption === '' ? null : H.caption(layer, P0.caption ?? o.caption, 'left:5.5%;top:7.5%', { at: 0.35 });
  const src = H.sourceLine(layer, P0.source === undefined ? o.source : P0.source);
  let fx = null;
  // sky: a floating white disc on the painted blue sky (Reconstructed look) instead of the studio cyc
  const skyTex = P0.sky ? (await import('./thumbs.js')).paintedSky(P0.seed ?? 5) : null;
  if (skyTex) { const r = P0.skyDisc ?? 7; const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, 0.8, 128), S.clay('#f4f2ee', { rough: 0.6, coat: 0.3 })); d.position.y = -0.4; d.receiveShadow = true; scene.add(d); }
  const finish = () => {
    if (skyTex) { scene.background = skyTex; scene.fog = null; st.cyc.visible = false; }
    st.applyEnv();
    fx = H.P.post(ctx, scene, camera, { ao: { radius: o.aoR ?? 0.8, intensity: o.aoI ?? 1.8, falloff: 0.8 }, dof: o.dof === false ? false : { focus: 10, range: o.dofRange ?? 4, bokeh: o.bokeh ?? 2.6 }, bloom: o.bloom ?? { intensity: 0.7, threshold: 1.25, radius: 0.7 }, tone: 'neutral', quality: P0.quality ?? 'medium' });
    return fx;
  };
  // project a world point to 1080p overlay px
  const toPx = (p) => { const q = v3(p).project(camera); return [(q.x * 0.5 + 0.5) * 1080 * ctx.width / ctx.height, (-q.y * 0.5 + 0.5) * 1080, q.z < 1]; };
  const cue = (spec, fb) => S.cue(shot, spec, fb);
  const cam = (keys, t, opt = {}) => { const c = S.rig(camera, P0.camera ?? keys, t, { t0: 0, t1: dur, float: 0.02, ...opt }); if (fx?.dof) fx.focus(opt.focus ?? c.dist); return c; };
  const frame = (t) => { cap?.type(t); st.contact?.update([st.cyc]); };
  return { P0, scene, camera, st, layer, dur, cap, src, finish, toPx, cue, cam, frame, fx: () => fx };
}
const pillAt = (H, layer, html, o) => { const p = H.pill(layer, html, o); p.at(0, 0, 0); return p; };
const pop = (t, at, o) => S.spring(t - at, { zeta: 0.45, freq: 2.2, ...o });

// a stack of n bars (instanced, interlocked layers), footprint centred at (x, z). Returns { mesh, positions } for animation.
function barStack(n, { x = 0, z = 0, cols = 2, rows = 2, seed = 1, mat } = {}) {
  const items = []; let k = 0, layer = 0;
  while (k < n) { const rot = layer % 2 === 1; for (let i = 0; i < cols && k < n; i++) for (let j = 0; j < rows && k < n; j++, k++) {
    const px = rot ? (j - (rows - 1) / 2) * BAR.l * 0.45 : (i - (cols - 1) / 2) * BAR.l * 0.98, pz = rot ? (i - (cols - 1) / 2) * BAR.w * 2.2 : (j - (rows - 1) / 2) * BAR.w * 1.02;
    items.push({ p: [x + px, layer * BAR.h, z + pz], r: [0, (rot ? Math.PI / 2 : 0) + (S.hash(seed, k) - 0.5) * 0.04, 0], c: new THREE.Color().setScalar(0.88 + S.hash(k, seed) * 0.12) }); }
    layer++; }
  return items;
}

export default function claySilver(H) {
  return {
    // ================================================================ price-tower: a chart built of silver bar stacks
    // params: points [{ label, price, word?, red? }], unit ($ per bar of height; default auto), mode 'rise' | 'crash' | 'hold',
    //   crashFrom (index whose bars fall), crashTo (price after the fall), crashAt (cue), title (caption), echo (bool: 2026 ghost column)
    async 'price-tower'(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 16, caption: 'SILVER · $ PER OUNCE', source: 'SOURCE: RESEARCH.md · ILLUSTRATIVE STACKS' });
      const { P0, scene } = G;
      const pts = P0.points ?? [{ label: 'JAN 1979', price: 6.08 }, { label: 'SEP 1979', price: 16.5 }, { label: 'DEC 1979', price: 34.45 }, { label: '17 JAN 1980', price: 49.45, red: true }];
      const max = Math.max(...pts.map(p => p.price), P0.crashTo ?? 0);
      const unit = P0.unit ?? max / 14; // dollars per bar layer
      const gapX = P0.gap ?? 4.4, n = pts.length, x0 = -(n - 1) * gapX / 2;
      const geo = S.barGeometry(), mat = S.barMaterial();
      const cols = pts.map((p, i) => ({ ...p, x: x0 + i * gapX, layers: Math.max(1, Math.round(p.price / unit)), at: G.cue(p.word, 0.8 + i * (Math.max(1.2, (G.dur - 3) / n))) }));
      const total = cols.reduce((a, c) => a + c.layers, 0);
      const bars = new THREE.InstancedMesh(geo, mat, total); bars.castShadow = bars.receiveShadow = true; scene.add(bars);
      const tint = new THREE.Color(); let k = 0; for (const c of cols) { c.k0 = k; for (let j = 0; j < c.layers; j++, k++) bars.setColorAt(k, tint.setScalar(0.88 + S.hash(k, 7) * 0.12)); }
      // price ruler at the back: a slim navy plate with $ ticks
      const ruler = new THREE.Group(); scene.add(ruler);
      const step = max > 60 ? 20 : 10;
      for (let v = 0; v <= max * 1.05; v += step) { const y = v / unit * BAR.h; const ln = new THREE.Mesh(new THREE.BoxGeometry((n - 1) * gapX + 6, 0.02, 0.02), S.clay('#c9c3b6')); ln.position.set(0, y, -2.2); ruler.add(ln);
        const lb = PR.labelPlane(`$${v}`, { w: 1.4, h: 0.5, bg: null, color: '#4b5a70', family: 'Plex Mono', font: '600' }); lb.position.set(x0 - 3.4, y + 0.05, -2.2); ruler.add(lb); }
      // labels under columns + price pills
      const pills = cols.map(c => pillAt(H, G.layer, `${c.label} · <b>$${c.price.toFixed(2)}</b>`, { size: 24, dot: c.red ? '#e0241b' : null }));
      const crashAt = G.cue(P0.crashAt, G.dur * 0.55), crashTo = P0.crashTo ?? null, crashIdx = P0.crashFrom ?? n - 1;
      const fx = G.finish();
      const midY = max / unit * BAR.h * 0.45;
      const keys = P0.mode === 'crash'
        ? [{ pos: [x0 + (n - 1) * gapX * 0.5 + 10, midY * 2.1 + 2, midY * 3.3 + 14], look: [x0 + (n - 1) * gapX * 0.5, midY, 0], mm: 35 }, { pos: [x0 + (n - 1) * gapX * 0.5 + 8, midY * 1.9 + 2, midY * 3.1 + 13], look: [x0 + (n - 1) * gapX * 0.5 + 0.5, midY * 0.95, 0], mm: 35 }]
        : [{ pos: [x0 - 6, 3, 15], look: [x0 + 2, 2, 0], mm: 38 }, { pos: [x0 + (n - 1) * gapX * 0.5, midY + 3, 22], look: [0, midY, 0], mm: 35 }, { pos: [x0 + (n - 1) * gapX + 5, midY * 1.6 + 3, 18], look: [x0 + (n - 1) * gapX - 2, midY * 1.4, 0], mm: 40 }];
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          G.cam(keys, t);
          let k = 0;
          for (const [i, c] of cols.entries()) {
            const hold = P0.mode === 'hold' || P0.mode === 'crash';
            for (let j = 0; j < c.layers; j++, k++) {
              const at = hold ? -10 : c.at + j * 0.035;
              const s = pop(t, at, { zeta: 0.5, freq: 3 });
              let y = j * BAR.h + (1 - Math.min(1, s)) * 2.5, rx = 0, rz = 0, x = c.x, z = 0;
              // crash: bars above crashTo topple off the column (pure function: ballistic arc + spin)
              if (P0.mode === 'crash' && i === crashIdx && crashTo !== null && j >= Math.round(crashTo / unit)) {
                const d = t - crashAt - (c.layers - j) * 0.05;
                if (d > 0) { const side = S.hash(j, 3) < 0.5 ? -1 : 1; x += side * d * (1.8 + S.hash(j) * 1.5); z += d * (2 + S.hash(j, 9) * 2); y = Math.max(-0.0, y + 2.0 * d - 9.8 * d * d); rx = d * (2 + S.hash(j, 1) * 3); rz = side * d * 2;
                  if (y <= 0.001) { y = 0; rx = Math.round(rx / (Math.PI / 2)) * Math.PI / 2; rz = 0; } }
              }
              S.place(bars, k, [x, y, z], [rx, (j % 2) * 0.02, rz], Math.min(1, Math.max(0.0001, s * 1.0)));
            }
            const top = [c.x, (P0.mode === 'crash' && i === crashIdx && crashTo !== null && t > crashAt + 0.6 ? Math.round(crashTo / unit) : c.layers) * BAR.h + 0.6, 0];
            const [px, py, vis] = G.toPx(top); const a = S.range(t, (P0.mode === 'hold' || P0.mode === 'crash' ? 0.3 : c.at + c.layers * 0.035), (P0.mode === 'hold' || P0.mode === 'crash' ? 0.7 : c.at + c.layers * 0.035 + 0.4));
            if (P0.mode === 'crash' && i === crashIdx && crashTo !== null && t > crashAt + 0.6) pills[i].innerHTML = P0.crashText ?? `${P0.crashLabel ?? 'NEXT DAY'} · <b style="color:#e0241b">$${crashTo.toFixed(2)}</b>`;
            pills[i].at(px, py, vis ? a : 0);
          }
          bars.instanceMatrix.needsUpdate = true;
          G.frame(t);
        },
      };
    },

    // ================================================================ vault: an exchange warehouse; paper contracts vs real bars
    // mode 'shelves' (full vault, slow dolly) | 'contract' (a paper contract card: 5,000 oz) | 'delivery' (card → bars roll out on a cart)
    //      'drain' (bars leave shelf by shelf; counter of share): share (0..1), shareLabel
    async vault(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 18, caption: 'AN EXCHANGE VAULT', source: 'ILLUSTRATION' });
      const { P0, scene } = G;
      const V = PR.vaultShelves({ rows: 3, bays: 4, levels: 4 }); scene.add(V.group);
      const geo = S.barGeometry({ l: 3.05, h: 0.86, w: 1.36, r: 0.1, seg: 2 }), mat = S.barMaterial({ stamp: false });
      const per = 2; // bars per slot (side by side along z)
      const items = []; V.slots.forEach((p, i) => { for (let q = 0; q < per; q++) items.push({ p: [p[0], p[1], p[2] + (q - 0.5) * 0.7], s: 1 }); });
      // bars on shelves (scaled to fit slot): 3.05 long → slot 3.4 wide
      const bars = new THREE.InstancedMesh(geo, mat, items.length); bars.castShadow = bars.receiveShadow = true; scene.add(bars);
      items.forEach((it, i) => { S.place(bars, i, it.p, [0, 0, 0], [0.98, 0.9, 0.48]); bars.setColorAt(i, new THREE.Color().setScalar(0.88 + S.hash(i) * 0.12)); });
      // the paper contract (a card that floats in front)
      const card = PR.sheet((g, W, Hh) => {
        g.fillStyle = '#14233d'; g.fillRect(0, 0, W, Hh * 0.16); g.fillStyle = '#fff'; g.font = `700 ${Hh * 0.07}px 'Archivo Narrow'`; g.fillText('SILVER FUTURES CONTRACT', W * 0.07, Hh * 0.105);
        g.fillStyle = '#14233d'; g.font = `700 ${Hh * 0.15}px 'Archivo Narrow'`; g.fillText('5,000 OZ', W * 0.07, Hh * 0.42);
        g.font = `500 ${Hh * 0.045}px 'Plex Mono'`; g.fillStyle = '#4b5a70'; ['DELIVERY: MARCH 1980', 'GRADE: 999 FINE SILVER', 'BARS OF ~1,000 OZ', 'SETTLE IN CASH — OR TAKE THE METAL'].forEach((l, i) => g.fillText(l, W * 0.07, Hh * (0.56 + i * 0.085)));
        g.strokeStyle = '#e0241b'; g.lineWidth = Hh * 0.008; g.strokeRect(W * 0.05, Hh * 0.88, W * 0.9, Hh * 0.08); g.fillStyle = '#e0241b'; g.font = `700 ${Hh * 0.045}px 'Archivo Narrow'`; g.fillText(P0.cardFoot ?? 'THE HUNTS: TAKE THE METAL', W * 0.08, Hh * 0.935);
      }, { w: 2.4, h: 3.0 });
      card.castShadow = true; scene.add(card);
      const cart = new THREE.Group(); scene.add(cart);
      const cartBed = new THREE.Mesh(S.roundBox(3.6, 0.2, 2.0, 0.05), S.clay('#e0241b', { rough: 0.5 })); cartBed.position.y = 0.4; cartBed.castShadow = true; cart.add(cartBed);
      for (const x of [-1.4, 1.4]) for (const z of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 20).rotateX(Math.PI / 2), S.clay('#2b2f38')); w.position.set(x, 0.22, z); cart.add(w); }
      const cartBars = new THREE.InstancedMesh(S.barGeometry(), S.barMaterial(), 6); cartBars.castShadow = true; cart.add(cartBars);
      for (let i = 0; i < 6; i++) S.place(cartBars, i, [((i % 3) - 1) * 1.05, 0.6 + Math.floor(i / 3) * 0.86, 0], [0, Math.PI / 2, 0], [1, 1, 1]);
      cart.scale.setScalar(0.9);
      const counter = H.K.div(G.layer, `opacity:0;right:6%;top:8%;font:700 ${64 * H.sc()}px 'Archivo Narrow';color:#14233d;background:rgba(251,248,242,.9);padding:.15em .4em;border-radius:.15em`, '');
      G.finish();
      const mode = P0.mode ?? 'shelves', at = G.cue(P0.at, 1.0);
      const keys = {
        shelves: [{ pos: [-14, 4.5, 14], look: [0, 2.4, -3], mm: 32 }, { pos: [-4, 3.6, 11], look: [3, 2.4, -4], mm: 35 }],
        contract: [{ pos: [2, 3.2, 12], look: [1.5, 2.6, 6], mm: 50 }, { pos: [3.2, 3.0, 10.6], look: [1.5, 2.6, 6], mm: 55 }],
        delivery: [{ pos: [3, 3.4, 15], look: [1, 2.0, 4], mm: 40 }, { pos: [8, 4.2, 15], look: [4, 1.6, 4], mm: 38 }],
        drain: [{ pos: [-16, 9, 18], look: [0, 2.0, -3], mm: 32 }, { pos: [-10, 7, 17], look: [0, 2.0, -3], mm: 34 }],
      }[mode];
      const share = P0.share ?? 0.5;
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          G.cam(keys, t, mode === 'contract' ? { focus: 4.6 } : {});
          // the card: hovers in front of the shelves; in 'delivery' it flips and drops away as the cart rolls out
          const cardIn = mode === 'contract' || mode === 'delivery' ? pop(t, mode === 'contract' ? at : 0.2) : 0;
          card.visible = cardIn > 0.001;
          card.position.set(1.5, 2.6 + Math.sin(t * 1.3) * 0.05, 6); card.rotation.set(-0.05, -0.15 + Math.sin(t * 0.7) * 0.04, 0.02); card.scale.setScalar(Math.max(0.001, cardIn));
          if (mode === 'delivery') { const f = S.inOut(S.range(t, at, at + 0.8)); card.rotation.y = -0.15 + f * Math.PI; card.position.y = 2.6 + f * 0.5; card.scale.setScalar(Math.max(0.001, 1 - S.range(t, at + 0.6, at + 1.0))); }
          // the cart: rolls out from the vault toward camera-right with bars on it
          cart.visible = mode === 'delivery'; if (mode === 'delivery') { const r = S.inOut(S.range(t, at + 0.6, at + 3.4)); cart.position.set(S.lerp(-2, 7, r), 0, S.lerp(2.5, 5.5, r)); cart.rotation.y = -0.35; cartBars.scale.setScalar(1); }
          // drain: bars leave shelf by shelf up to `share`
          if (mode === 'drain') { const n = items.length, gone = Math.floor(n * share * S.smoother(S.range(t, at, at + G.dur * 0.55)));
            for (let i = 0; i < n; i++) { const idx = (i * 7919) % n; const left = i < gone; const d = left ? S.range(t, at + i / n * G.dur * 0.55, at + i / n * G.dur * 0.55 + 0.6) : 0;
              S.place(bars, idx, [items[idx].p[0], items[idx].p[1] + d * 1.5, items[idx].p[2] + d * 6], [0, 0, 0], d >= 1 ? 0.0001 : [0.98 * (1 - d * 0.3), 0.9, 0.48]); }
            bars.instanceMatrix.needsUpdate = true;
            counter.style.opacity = String(S.range(t, at, at + 0.4)); counter.innerHTML = `${P0.shareLabel ?? 'BOUGHT'} <span style="color:#e0241b">${Math.round(share * 100 * S.smoother(S.range(t, at, at + G.dur * 0.55)))}%</span>`; }
          G.frame(t);
        },
      };
    },

    // ================================================================ airlift: bars loaded onto a jet, guards in hats, takeoff
    // params: at (loading starts), takeoffAt, label ('DALLAS → ZURICH')
    async airlift(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 22, caption: P0caption(shot, 'SILVER TO SWITZERLAND'), source: 'ILLUSTRATION', fog: [90, 260] });
      const { P0, scene } = G;
      const runway = new THREE.Mesh(S.roundBox(60, 0.06, 7, 0.02), S.clay('#d9d4c8', { rough: 0.9 })); runway.receiveShadow = true; scene.add(runway);
      for (let i = -14; i <= 14; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 0.18), S.clay('#ffffff')); d.position.set(i * 2.2, 0.07, 0); scene.add(d); }
      const plane = PR.jet({ scale: 2.2 }); scene.add(plane);
      const geo = S.barGeometry(), mat = S.barMaterial();
      const N = 28; const pile = new THREE.InstancedMesh(geo, mat, N); pile.castShadow = true; scene.add(pile);
      await PR.loadMannequins(['casual_a', 'casual_b']);
      const gm = [0, 1, 2].map(i => PR.mannequin(i % 2 ? 'casual_b' : 'casual_a', PR.MQ.red, { hat: 'cowboy', unit: 1.2 }));
      const guards = gm.map(m => m.root);
      guards.forEach((g, i) => { g.position.set(-4 + i * 2.4, 0, 5.5 + (i % 2) * 0.6); g.rotation.y = -0.4 + i * 0.3; scene.add(g); });
      const label = pillAt(H, G.layer, P0.label ?? 'DALLAS → ZURICH', { size: 28 });
      G.finish();
      const at = G.cue(P0.at, 0.8), off = G.cue(P0.takeoffAt, G.dur * 0.62);
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          // plane: parked (nose +x) then rolls and lifts off
          const roll = Math.max(0, t - off); const x = 2 + 3.2 * roll * roll; const lift = Math.max(0, roll - 1.4);
          plane.position.set(x, lift * lift * 1.2, -0.5); plane.rotation.z = Math.min(0.18, lift * 0.12);
          // bars: a pile beside the plane hop one by one into the cargo door
          for (let i = 0; i < N; i++) { const t0 = at + i * 0.12; const u = S.range(t, t0, t0 + 0.55);
            const from = [-2.5 + (i % 4) * 1.0, Math.floor(i / 8) * BAR.h * 0.6, 3.2 + (Math.floor(i / 4) % 2) * 1.4], into = [x + 0.5, 1.6 + lift * lift * 1.2, -0.3];
            const p = [S.lerp(from[0], into[0], S.inOut(u)), S.lerp(from[1], into[1], S.inOut(u)) + Math.sin(Math.PI * u) * 1.2, S.lerp(from[2], into[2], S.inOut(u))];
            S.place(pile, i, p, [0, 0.3 + u * 1.2, 0], u >= 1 ? 0.0001 : 0.6 * (1 - u * 0.5)); }
          pile.instanceMatrix.needsUpdate = true;
          guards.forEach((g, i) => { gm[i].play(i === 1 ? 'look_around' : 'idle', t + i).update(); g.rotation.y = -0.4 + i * 0.3 + S.range(t, off, off + 1) * 0.6; });
          const c = G.cam(P0.camera ?? [{ pos: [2, 6, 26], look: [1, 1.6, 0], mm: 32 }, { pos: [6, 5, 24], look: [3, 1.8, 0], mm: 32 }, { pos: [12, 6, 24], look: [14, 4, -1], mm: 30 }], t);
          const [px, py, vis] = G.toPx([x, 4.5 + lift * lift * 1.2, -0.5]); label.at(px, py, vis ? S.range(t, at + 0.6, at + 1.0) : 0);
          G.frame(t);
        },
      };
    },

    // ================================================================ margin: the lever (loan vs silver collateral), red line, the phone rings
    // params: drop (0..1 how far the collateral value falls), at (fall start), callAt (phone rings), amount ('$135M'), line label
    async margin(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 12, caption: P0caption(shot, 'HOW A MARGIN CALL WORKS'), source: P0src(shot, 'ILLUSTRATION') });
      const { P0, scene } = G;
      // a wooden seesaw: left the loan (cash stacks), right the collateral (silver bars)
      const base = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 4).rotateY(Math.PI / 4), S.wood()); base.position.y = 0.8; base.castShadow = true; scene.add(base);
      const beam = new THREE.Group(); beam.position.y = 1.65; scene.add(beam);
      const plank = new THREE.Mesh(S.roundBox(12, 0.3, 2.4, 0.08), S.wood()); plank.position.y = -0.15; plank.castShadow = plank.receiveShadow = true; beam.add(plank);
      const cash = new THREE.Group(); cash.position.x = -4.2; beam.add(cash);
      for (let i = 0; i < 8; i++) { const c = PR.cashStack({ w: 1.56, d: 0.66, h: 0.3 }); c.position.set((i % 2) * 1.7 - 0.85, Math.floor(i / 2) * 0.3, 0); c.rotation.y = (S.hash(i) - 0.5) * 0.1; cash.add(c); }
      const silver = new THREE.Group(); silver.position.x = 4.2; beam.add(silver);
      const sb = new THREE.InstancedMesh(S.barGeometry(), S.barMaterial(), 6); sb.castShadow = true; silver.add(sb);
      for (let i = 0; i < 6; i++) S.place(sb, i, [((i % 2) - 0.5) * 1.45 * 0 , Math.floor(i / 2) * BAR.h * 0.8, ((i % 2) - 0.5) * 1.42], [0, Math.PI / 2, 0], 0.8);
      sb.instanceMatrix.needsUpdate = true;
      // red maintenance line: a thin red bar across at the safe height of the right end
      const red = new THREE.Mesh(S.roundBox(3.6, 0.05, 0.05, 0.02), new THREE.MeshStandardMaterial({ color: '#e0241b', emissive: '#e0241b', emissiveIntensity: 0.4 })); scene.add(red);
      const ph = PR.phone(); ph.scale.setScalar(0.9); ph.position.set(0.5, 0, 5.2); ph.rotation.y = -0.25; scene.add(ph);
      const lLoan = pillAt(H, G.layer, P0.loanLabel ?? 'BORROWED', { size: 26 }), lCol = pillAt(H, G.layer, P0.colLabel ?? 'SILVER PLEDGED', { size: 26 }), lRed = pillAt(H, G.layer, P0.lineLabel ?? 'MARGIN LINE', { size: 22, color: '#e0241b' });
      const call = H.K.div(G.layer, `opacity:0;left:50%;top:70%;transform:translate(-50%,0);font:700 ${54 * H.sc()}px 'Archivo Narrow';color:#fff;background:#e0241b;padding:.12em .5em;letter-spacing:.02em`, P0.callText ?? 'MARGIN CALL');
      G.finish();
      const at = G.cue(P0.at, 1.2), callAt = G.cue(P0.callAt, G.dur * 0.6), drop = P0.drop ?? 0.6;
      const tiltMax = 0.17;
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          // collateral value falls → the bars shrink (value) and the beam tips toward the loan side
          const f = S.smoother(S.range(t, at, at + Math.max(1.5, callAt - at - 0.2))) * drop;
          silver.scale.setScalar(1 - f * 0.55);
          const tilt = -tiltMax * 0.4 + f * tiltMax * 1.6; // + = right end up
          beam.rotation.z = -tilt * -1 * 0 + tilt; // right end rises as collateral loses weight
          const rightY = 1.65 + Math.sin(tilt) * 4.2;
          red.position.set(4.2, 1.65 + Math.sin(tiltMax * 0.35) * 4.2 + 1.2, 1.4);
          const ringing = ph.userData.ring(t - callAt, t >= callAt);
          call.style.opacity = String(S.range(t, callAt, callAt + 0.25)); call.style.transform = `translate(-50%,0) scale(${0.85 + 0.15 * S.outBack(S.range(t, callAt, callAt + 0.35))})`;
          G.cam([{ pos: [-2, 5.5, 17], look: [0, 2.0, 0], mm: 38 }, { pos: [3, 4.2, 14], look: [1.5, 1.8, 1.8], mm: 40 }], t);
          const a = S.range(t, 0.4, 0.8);
          let [x, y, v] = G.toPx([-4.2, 1.65 - Math.sin(tilt) * 4.2 + 1.8, 0]); lLoan.at(x, y, v ? a : 0);
          [x, y, v] = G.toPx([4.2, rightY + 2.2 * (1 - f * 0.55), 0]); lCol.at(x, y, v ? a : 0);
          [x, y, v] = G.toPx([6.1, red.position.y, 1.4]); lRed.at(x, y, v ? S.range(t, at, at + 0.4) : 0);
          G.frame(t);
        },
      };
    },

    // ================================================================ boardroom: the exchange board meets; a rule document; the stamp slams
    // params: stampAt (cue), stampText ('LIQUIDATION ONLY'), docTitle ('SILVER RULE 7'), docDate ('7 JAN 1980')
    async boardroom(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 10, caption: P0caption(shot, 'THE EXCHANGE BOARD'), source: P0src(shot, 'RECONSTRUCTION') });
      const { P0, scene } = G;
      const table = new THREE.Mesh(S.roundBox(9, 0.25, 4, 0.12), S.wood({ coat: 0.6 })); table.position.y = 2.2; table.castShadow = table.receiveShadow = true; scene.add(table);
      for (const x of [-3.8, 3.8]) for (const z of [-1.5, 1.5]) { const l = new THREE.Mesh(S.roundBox(0.25, 2.2, 0.25, 0.05), S.wood()); l.position.set(x, 0, z); l.castShadow = true; scene.add(l); }
      const figs = [];
      await PR.loadMannequins(['suit', 'suit_b', 'office']);
      for (let i = 0; i < 8; i++) { const side = i < 4 ? -1 : 1; const m = PR.mannequin(['suit', 'suit_b', 'office'][i % 3], PR.MQ.blue, { unit: 2.4 }); const p = m.root; p.position.set(-3.3 + (i % 4) * 2.2, 0, side * 3.1); p.rotation.y = side < 0 ? 0 : Math.PI; scene.add(p); figs.push({ m, ph: i * 0.7, clip: ['idle', 'talk', 'idle_b', 'look_around'][i % 4] }); }
      const doc = PR.sheet((g, W, Hh) => {
        g.fillStyle = '#14233d'; g.font = `700 ${Hh * 0.06}px 'Archivo Narrow'`; g.fillText(P0.docOrg ?? 'COMMODITY EXCHANGE, INC.', W * 0.08, Hh * 0.1);
        g.font = `700 ${Hh * 0.1}px 'Archivo Narrow'`; g.fillText(P0.docTitle ?? 'SILVER RULE 7', W * 0.08, Hh * 0.22);
        g.font = `500 ${Hh * 0.038}px 'Plex Mono'`; g.fillStyle = '#4b5a70'; g.fillText(P0.docDate ?? 'EFFECTIVE 7 JANUARY 1980', W * 0.08, Hh * 0.29);
        g.fillStyle = '#9aa1ab'; for (let i = 0; i < 12; i++) g.fillRect(W * 0.08, Hh * (0.36 + i * 0.045), W * (0.6 + S.hash(i) * 0.3), Hh * 0.014);
      }, { w: 2.2, h: 2.9 });
      doc.rotation.x = -Math.PI / 2; doc.position.set(0, 2.34, 0.2); scene.add(doc);
      const stamp = PR.rubberStamp(); stamp.scale.setScalar(0.7); scene.add(stamp);
      const ink = PR.labelPlane(P0.stampText ?? 'LIQUIDATION ONLY', { w: 1.9, h: 0.42, bg: null, color: '#e0241b', font: '700' }); ink.rotation.x = -Math.PI / 2; ink.rotation.z = 0.08; ink.position.set(0.05, 2.36, 0.5); scene.add(ink);
      G.finish();
      const at = G.cue(P0.stampAt, G.dur * 0.55);
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          // stamp: hovers, winds up, slams at `at` (fast in, tiny bounce), lifts away
          const wind = S.inOut(S.range(t, at - 0.9, at - 0.15)), slam = S.inCubic(S.range(t, at - 0.15, at)), lift = S.inOut(S.range(t, at + 0.35, at + 1.0));
          const y = 2.36 + 0.24 + 2.6 * (1 - slam) * wind + (wind < 1 ? 2.6 * (1 - wind) : 0) * 0 + lift * 2.4 + (t < at - 0.9 ? 2.6 : 0);
          stamp.position.set(0.05 + lift * 1.2, Math.max(2.6, y), 0.5); stamp.rotation.set(0, 0.08, -lift * 0.3);
          ink.material.opacity = t >= at ? 1 : 0; ink.material.transparent = true; ink.visible = t >= at;
          // heads turn to the doc as the stamp lands
          figs.forEach((f) => f.m.play(f.clip, f.ph + t).update());
          const kick = t > at ? Math.exp(-(t - at) * 8) * Math.sin((t - at) * 60) * 0.03 : 0;
          G.cam(P0.camera ?? [{ pos: [-13, 9.5, 17], look: [0, 3.0, 0], mm: 32 }, { pos: [-9, 8.5, 15], look: [0, 3.0, 0.2], mm: 34 }], t);
          G.camera.position.y += kick;
          G.frame(t);
        },
      };
    },

    // ================================================================ queue: people lined up in the cold outside a refinery ("WE BUY SILVER"), snow
    async queue(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 20, caption: P0caption(shot, 'WINTER 1980'), source: P0src(shot, 'ILLUSTRATION'), color: '#eef0f1', fog: [60, 180] });
      const { P0, scene } = G;
      const b = PR.building({ w: 9, d: 6, h: 4.5, cols: 0, label: P0.sign ?? 'WE BUY SILVER', color: '#f1ede6' }); b.position.set(6, 0, -3); scene.add(b);
      const door = new THREE.Mesh(S.roundBox(1.4, 2.4, 0.1, 0.04), S.clay('#14233d')); door.position.set(3.2, 0.54, 0.05); scene.add(door);
      const people = []; const N = P0.count ?? 26; const r = S.rng(5);
      const coats = ['#14233d', '#e0241b', '#2a8c86', '#a9c5ae', '#5b6b80', '#c9a45a', '#7b5235', '#3b4250'];
      await PR.loadMannequins(['casual_a', 'casual_b', 'overcoat', 'casual_f']);
      for (let i = 0; i < N; i++) { const m = PR.mannequin(['casual_a', 'casual_b', 'overcoat', 'casual_f'][i % 4], i === (P0.blueAt ?? 6) ? PR.MQ.blue : PR.MQ.cyan, {}); const p = m.root; p.scale.multiplyScalar(0.95 + r() * 0.1); p.position.set(2.2 - i * 1.0 - r() * 0.3, 0, 1.6 + Math.sin(i * 0.5) * 0.6 + (r() - 0.5) * 0.4); p.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.5; scene.add(p); people.push({ m, ph: r() * 4, clip: ['idle', 'wait', 'idle_b', 'look_around'][i % 4] });
        const held = new THREE.Mesh(i % 3 === 0 ? new THREE.CylinderGeometry(0.05, 0.08, 0.35, 16) : S.roundBox(0.34, 0.12, 0.24, 0.03), i % 3 === 0 ? S.polishedSilver() : S.clay('#7b5235')); held.castShadow = true; scene.add(held); people.at(-1).held = held; }
      // snow: small white points falling (pure function of t)
      const SN = 1400, sg = new THREE.BufferGeometry(), sp = new Float32Array(SN * 3), seeds = []; for (let i = 0; i < SN; i++) seeds.push([r() * 50 - 30, r() * 14, r() * 24 - 8, 0.4 + r() * 0.6]);
      sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.09, transparent: true, opacity: 0.9, depthWrite: false })); scene.add(snow);
      G.finish();
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          for (let i = 0; i < SN; i++) { const [x, y, z, v] = seeds[i]; sp[i * 3] = x + Math.sin(t * 0.7 + i) * 0.3; sp[i * 3 + 1] = ((y - t * v) % 14 + 14) % 14; sp[i * 3 + 2] = z; }
          sg.attributes.position.needsUpdate = true;
          people.forEach((p) => { p.m.play(p.clip, p.ph + t).update(); const hp = p.m.worldPos('hand_r'); p.held.position.set(hp.x, hp.y - 0.08, hp.z); });
          G.cam([{ pos: [-26, 3.5, 12], look: [-10, 1.4, 1], mm: 40 }, { pos: [-8, 3.2, 12], look: [2, 1.6, 0], mm: 38 }], t);
          G.frame(t);
        },
      };
    },

    // ================================================================ oilfield: the family fortune (derricks + pumpjacks) and the collateral tags
    // params: mode 'fortune' | 'collateral' (red tags pop on, a $ loan pill), tagAt, label
    async oilfield(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 26, caption: P0caption(shot, 'THE HUNT OIL FORTUNE'), source: P0src(shot, 'ILLUSTRATION'), color: '#efe6d6', fog: [80, 240] });
      const { P0, scene } = G;
      const rigs = []; const r = S.rng(3);
      for (let i = 0; i < 14; i++) { const isD = i % 3 === 0; const o = isD ? PR.derrick({ h: 5 + r() * 2 }) : PR.pumpjack(); o.position.set(-18 + (i % 7) * 6 + r() * 1.5, 0, -(Math.floor(i / 7)) * 8 + r() * 1.5); o.rotation.y = r() * 0.6 - 0.3; scene.add(o); rigs.push(o); }
      const tags = rigs.map((o, i) => { const tg = PR.labelPlane(P0.tagText ?? 'PLEDGED', { w: 1.6, h: 0.45, red: true }); tg.position.copy(o.position).add(new THREE.Vector3(0, 3.6, 0.6)); tg.visible = false; scene.add(tg); return tg; });
      G.finish();
      const tagAt = G.cue(P0.tagAt, G.dur * 0.4);
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          rigs.forEach((o, i) => o.userData.tick?.(t + i * 0.7));
          tags.forEach((tg, i) => { const s = P0.mode === 'collateral' ? pop(t, tagAt + i * 0.12) : 0; tg.visible = s > 0.001; tg.scale.setScalar(Math.max(0.001, s)); tg.rotation.y = Math.sin(t * 1.5 + i) * 0.1; });
          G.cam([{ pos: [-20, 7, 20], look: [-4, 2, -3], mm: 32 }, { pos: [4, 6.5, 22], look: [2, 2, -3], mm: 32 }], t);
          G.frame(t);
        },
      };
    },


    // ================================================================ figures: glossy mannequins (Reconstructed look) on the studio floor, 1 unit = 1 m
    // params: figs [{ w (wardrobe 'suit'|'overcoat'|'office'|'casual_a'|...), c ('red'|'blue'|'cyan'|'white'|hex), hat, clip ('idle'), t0, x, z, ry, label, labelAt }]
    //   props: ['desk' | 'witness' | 'cash' | 'cashflow' | 'bars' | 'balance' | 'phone' | 'car' | 'crowd' | 'plinth'], flow: { from: [x,z], to: [x,z], at, n }
    //   cam: 'push' | 'orbit' | 'low' | 'wide' | 'close' (or camera keys), focusOn: figure index, tilt (balance), sky (true: blue sky backdrop)
    async figures(ctx, shot) {
      const P0 = shot.params ?? {};
      const figs = P0.figs ?? [{ w: 'suit', c: 'red', hat: 'cowboy', clip: 'idle', x: 0, z: 0, ry: 0.3 }];
      const wards = [...new Set([...figs.map(f => f.w ?? 'suit'), ...(P0.props ?? []).includes('crowd') ? ['casual_a', 'casual_b', 'office'] : []])];
      await PR.loadMannequins(wards);
      const G = await stage(H, ctx, shot, { span: P0.span ?? 4, caption: P0caption(shot, null), source: P0src(shot, null), bokeh: 3.2, dofRange: 1.2, aoR: 0.25, aoI: 1.6, contact: { w: 10, d: 8, blur: 2.2, darkness: 1.2, opacity: 0.75 } });
      const { scene } = G; const props = new Set(P0.props ?? []);
      const col = (c) => PR.MQ[c] ?? c ?? PR.MQ.blue;
      const people = figs.map((f, i) => { const m = PR.mannequin(f.w ?? 'suit', col(f.c), { hat: f.hat ?? null }); m.root.position.set(f.x ?? 0, 0, f.z ?? 0); m.root.rotation.y = f.ry ?? 0; scene.add(m.root); return { m, f }; });
      let crowd = [];
      if (props.has('crowd')) { const r = S.rng(7); for (let i = 0; i < (P0.crowdN ?? 14); i++) { const m = PR.mannequin(['casual_a', 'casual_b', 'office'][i % 3], PR.MQ.cyan, {}); m.root.position.set(-4 + (i % 7) * 1.2 + r() * 0.3, 0, -2.2 - Math.floor(i / 7) * 1.2 + r() * 0.3); m.root.rotation.y = (r() - 0.5) * 0.8; scene.add(m.root); crowd.push({ m, ph: r() * 5, clip: ['idle', 'idle_b', 'phone', 'look_around'][i % 4] }); } }
      const S01 = (o, s) => { o.scale.multiplyScalar(s); scene.add(o); return o; };
      if (props.has('desk')) { const d = new THREE.Mesh(S.roundBox(2.0, 0.76, 0.9, 0.04), S.wood({ coat: 0.5 })); d.position.set(P0.deskX ?? 0, 0, P0.deskZ ?? 0.9); d.castShadow = d.receiveShadow = true; scene.add(d); }
      if (props.has('witness')) { const d = new THREE.Mesh(S.roundBox(3.2, 0.76, 0.8, 0.04), S.wood({ coat: 0.5 })); d.position.set(0, 0, 0.75); d.castShadow = d.receiveShadow = true; scene.add(d);
        for (const x of [-0.7, 0.7]) { const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8), S.clay('#2b2f38')); mic.position.set(x, 0.93, 0.55); mic.rotation.x = -0.5; scene.add(mic); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), S.clay('#2b2f38')); hd.position.set(x, 1.08, 0.47); scene.add(hd); }
        const plate = PR.labelPlane(P0.plate ?? 'HUNT', { w: 0.8, h: 0.16 }); plate.position.set(0, 0.79, 1.16); plate.rotation.x = -0.25; scene.add(plate); }
      if (props.has('bars')) { const b = S.instances(S.barGeometry(), S.barMaterial(), barStack(P0.barsN ?? 10, { cols: 2, rows: 2, x: 0, z: 0 })); b.scale.setScalar(0.1); b.position.set(...(P0.barsAt ?? [0.9, 0, 0.6])); scene.add(b); }
      if (props.has('cash')) for (let i = 0; i < 6; i++) { const c = PR.cashStack(); c.scale.setScalar(0.1); c.position.set((P0.cashAt?.[0] ?? -0.9) + (i % 2) * 0.17, Math.floor(i / 2) * 0.03, (P0.cashAt?.[2] ?? 0.6)); scene.add(c); }
      let bal = null; if (props.has('balance')) { bal = PR.balance(); bal.scale.setScalar(P0.balanceScale ?? 0.4); bal.position.set(...(P0.balanceAt ?? [0, 0, 0.9])); scene.add(bal);
        const coin = new THREE.Mesh(S.coinGeometry({ r: 0.19 }), S.polishedSilver()); coin.scale.setScalar(1.6); bal.userData.pans[0].add(coin); coin.position.y = -1.78;
        const bb = S.instances(S.barGeometry(), S.barMaterial(), barStack(6, { cols: 1, rows: 2 })); bb.scale.setScalar(0.5); bb.position.y = -1.78; bal.userData.pans[1].add(bb); }
      let ph = null; if (props.has('phone')) { ph = PR.phone(); ph.scale.setScalar(0.11); ph.position.set(...(P0.phoneAt ?? [0.35, 0.76, 0.85])); ph.rotation.y = -0.4; scene.add(ph); }
      if (props.has('car')) { const car = new THREE.Group(); const body = S.glossy(P0.carColor ?? '#e9e6df', { rough: 0.25, coat: 0.9 });
        const lower = new THREE.Mesh(S.roundBox(5.6, 0.75, 2.0, 0.25), body); lower.position.y = 0.28; car.add(lower); const cab = new THREE.Mesh(S.roundBox(2.8, 0.6, 1.8, 0.22), body); cab.position.set(-0.3, 1.0, 0); car.add(cab);
        const glass = new THREE.Mesh(S.roundBox(2.6, 0.45, 1.82, 0.18), S.glossy('#22303f', { rough: 0.1, coat: 1 })); glass.position.set(-0.3, 1.06, 0); car.add(glass);
        for (const x of [-1.8, 1.8]) for (const z of [-0.9, 0.9]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24).rotateX(Math.PI / 2), S.clay('#22262c')); wh.position.set(x, 0.36, z); car.add(wh); }
        car.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); car.position.set(...(P0.carAt ?? [-3.2, 0, -1.4])); car.rotation.y = P0.carRy ?? 0.25; scene.add(car); }
      if (props.has('plinth')) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.12, 64), S.clay('#f4f2ee', { rough: 0.5, coat: 0.4 })); pl.position.y = -0.06; pl.receiveShadow = true; scene.add(pl); }
      // cash flow: bundles hop on arcs from `from` to `to` (who pays whom)
      const flow = P0.flow ?? null; const hop = [];
      if (props.has('cashflow') && flow) for (let i = 0; i < (flow.n ?? 10); i++) { const c = PR.cashStack(); c.scale.setScalar(0.24); scene.add(c); hop.push(c); }
      const labels = people.map(p => p.f.label ? pillAt(H, G.layer, p.f.label, { size: 24, dot: p.f.c === 'red' ? '#e0241b' : null }) : null);
      G.finish();
      const D = G.dur, fz = people[P0.focusOn ?? 0]?.f ?? { x: 0, z: 0 };
      const cx = fz.x ?? 0, cz = fz.z ?? 0;
      const presets = {
        push: [{ pos: [cx + 1.4, 1.55, cz + 5.2], look: [cx, 1.2, cz], mm: 50 }, { pos: [cx + 0.9, 1.5, cz + 3.6], look: [cx, 1.3, cz], mm: 55 }],
        orbit: [{ pos: [cx + 4.2, 1.7, cz + 3.0], look: [cx, 1.0, cz], mm: 40 }, { pos: [cx + 1.0, 1.6, cz + 5.0], look: [cx, 1.05, cz], mm: 40 }, { pos: [cx - 3.4, 1.7, cz + 3.6], look: [cx, 1.05, cz], mm: 40 }],
        low: [{ pos: [cx + 2.2, 0.45, cz + 4.6], look: [cx, 1.5, cz], mm: 32 }, { pos: [cx + 1.2, 0.5, cz + 4.0], look: [cx, 1.55, cz], mm: 32 }],
        wide: [{ pos: [cx - 3.5, 3.4, cz + 9.5], look: [cx, 0.9, cz - 0.5], mm: 35 }, { pos: [cx + 2.5, 3.0, cz + 9.0], look: [cx, 0.9, cz - 0.5], mm: 35 }],
        close: [{ pos: [cx + 0.8, 1.65, cz + 2.4], look: [cx, 1.45, cz], mm: 70 }, { pos: [cx + 0.5, 1.62, cz + 2.0], look: [cx, 1.5, cz], mm: 75 }],
        high: [{ pos: [cx + 3, 6.5, cz + 6.5], look: [cx, 0.6, cz], mm: 35 }, { pos: [cx + 1.5, 5.8, cz + 6.0], look: [cx, 0.6, cz], mm: 35 }],
      };
      const allX = [...figs.map(f => f.x ?? 0), ...(bal ? [bal.position.x] : [])]; const mx = (Math.min(...allX) + Math.max(...allX)) / 2, spanX = Math.max(...allX) - Math.min(...allX);
      presets.pair = [{ pos: [mx + 0.6, 1.5, 3.4 + spanX * 1.0], look: [mx, 1.0, 0.2], mm: 40 }, { pos: [mx + 0.2, 1.45, 3.0 + spanX * 0.9], look: [mx, 1.05, 0.2], mm: 42 }];
      const keys = Array.isArray(P0.cam) ? P0.cam : (P0.camera ?? presets[P0.cam ?? 'push']);
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          for (const { m, f } of people) { m.play(f.clip ?? 'idle', (f.t0 ?? 0.5) + t).update(); }
          for (const c of crowd) c.m.play(c.clip, c.ph + t).update();
          if (bal) bal.userData.set((P0.tilt ?? -0.18) * S.smoother(S.range(t, G.cue(P0.tiltAt, 0.8), G.cue(P0.tiltAt, 0.8) + 1.4)));
          if (ph) ph.userData.ring(t - G.cue(P0.ringAt, 0.6), P0.ring !== false);
          if (hop.length) { const at = G.cue(flow.at, 0.6), period = flow.period ?? 0.45; hop.forEach((c, i) => {
            const t0 = at + i * period, u = S.range(t, t0, t0 + 0.9); const a = flow.from, b = flow.to;
            c.visible = t >= t0 - 0.05; c.position.set(S.lerp(a[0], b[0], S.inOut(u)), 0.9 + Math.sin(Math.PI * u) * 0.9 - (u >= 1 ? 0.9 - Math.floor(i / 2) * 0.03 - 0.0 : 0), S.lerp(a[1], b[1], S.inOut(u)) + (u >= 1 ? (i % 2) * 0.12 : 0)); c.rotation.y = u * 3; }); }
          G.cam(keys, t);
          people.forEach(({ m, f }, i) => { if (!labels[i]) return; m.root.updateMatrixWorld(true); const hp = m.worldPos('head'); const [x, y, v] = G.toPx([hp.x, hp.y + 0.42, hp.z]); labels[i].at(x, y, v ? S.range(t, G.cue(f.labelAt, 0.6), G.cue(f.labelAt, 0.6) + 0.35) : 0); });
          G.frame(t);
        },
      };
    },

    // ================================================================ cube: 195M oz as one solid silver cube (8.3 m), beside a three-storey house and people for scale
    async cube(ctx, shot) {
      const P0 = shot.params ?? {};
      await PR.loadMannequins(['casual_a', 'office']);
      const G = await stage(H, ctx, shot, { span: 14, caption: P0caption(shot, '195 MILLION OUNCES, AS ONE CUBE'), source: P0src(shot, 'OUR MATH: 195M OZ × 31.1 G ÷ 10.49 G/CM³ ≈ 578 M³ · SEC STAFF REPORT (1982)'), fog: [120, 320], bokeh: 1.4, dofRange: 10 });
      const { scene } = G; const side = 8.33;
      const cubeMat = S.silverMat({ rough: 0.4, env: 1.0, color: '#c4c9cf' }); const cubeG = new THREE.Mesh(S.roundBox(side, side, side, 0.12, 4), cubeMat); cubeG.castShadow = cubeG.receiveShadow = true; scene.add(cubeG);
      const house = new THREE.Group(); const wall = S.clay('#f1ede6'), roof = S.clay('#14233d', { rough: 0.6 });
      const hb = new THREE.Mesh(S.roundBox(5, 9.0, 4, 0.06), wall); house.add(hb);
      const rs = new THREE.Shape([new THREE.Vector2(-2.8, 0), new THREE.Vector2(2.8, 0), new THREE.Vector2(0, 2.2)]); const rg = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 4.4, bevelEnabled: false }), roof); rg.position.set(0, 9.0, -2.2); house.add(rg);
      for (let f = 0; f < 3; f++) for (const x of [-1.4, 1.4]) { const w = new THREE.Mesh(S.roundBox(1.0, 1.3, 0.06, 0.03), S.glossy('#9fc1d8', { rough: 0.1 })); w.position.set(x, 1.0 + f * 2.9, 2.02); house.add(w); }
      house.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); house.position.set(-10.5, 0, -1.0); scene.add(house);
      const ppl = [0, 1, 2].map(i => { const m = PR.mannequin(i === 1 ? 'office' : 'casual_a', PR.MQ.blue); m.root.position.set(5.6 + i * 0.9, 0, 4.8 - i * 0.4); m.root.rotation.y = -0.6; scene.add(m.root); return m; });
      const tag = pillAt(H, G.layer, P0.tag ?? '≈ 8.3 M · 6,065 TONNES', { size: 28 });
      G.finish();
      const at = G.cue(P0.at, 0.6);
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          const s = S.spring(t - at, { zeta: 0.55, freq: 1.3 }); cubeG.scale.set(1, Math.max(0.001, s), 1); cubeG.position.y = 0;
          ppl.forEach((m, i) => m.play(i === 0 ? 'look_around' : 'idle', t + i).update());
          G.cam(P0.camera ?? [{ pos: [14, 2.2, 24], look: [-1, 4.5, 0], mm: 32 }, { pos: [6, 1.6, 22], look: [-2, 5, 0], mm: 30 }], t);
          const [x, y, v] = G.toPx([0, side + 0.8, 0]); tag.at(x, y, v ? S.range(t, at + 0.8, at + 1.2) : 0);
          G.frame(t);
        },
      };
    },

    // ================================================================ heirlooms: grandma's silver on velvet (macro product shots)
    // mode 'table' (fork, spoon, candlestick, coins, a film canister; price tags rise at `at`) | 'coins' (a heap of coins: the Byzantine collection) | 'fork' (the ending: one fork)
    async heirlooms(ctx, shot) {
      const P0 = shot.params ?? {}; const mode = P0.mode ?? 'table';
      const G = await stage(H, ctx, shot, { span: 3, caption: P0caption(shot, null), source: P0src(shot, null), bokeh: 4.5, dofRange: 0.5, aoR: 0.12, aoI: 1.5, contact: { w: 8, d: 6, blur: 2, darkness: 1.2, opacity: 0.7 } });
      const { scene } = G;
      const cloth = new THREE.Mesh(S.roundBox(9, 0.1, 6, 0.04), S.velvet(P0.velvet ?? '#1d3557')); cloth.receiveShadow = true; scene.add(cloth);
      const tags = [];
      const fork = new THREE.Mesh(PR.forkGeometry(), S.polishedSilver({ rough: 0.06 })); fork.castShadow = true; fork.position.set(0, 0.1, 0.4); fork.rotation.y = 0.5; if (mode === 'fork') fork.scale.setScalar(1.5); scene.add(fork);
      if (mode === 'table' || mode === 'coins') { fork.visible = mode === 'table'; }
      if (mode === 'table') {
        const spoon = new THREE.Mesh(PR.spoonGeometry(), S.polishedSilver({ rough: 0.06 })); spoon.castShadow = true; spoon.position.set(0.3, 0.1, 1.1); spoon.rotation.y = 0.35; scene.add(spoon);
        const cs = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.28, 0], [0.3, 0.05], [0.08, 0.12], [0.06, 0.9], [0.1, 1.0], [0.14, 1.04], [0.06, 1.1], [0, 1.1]].map(([x, y]) => new THREE.Vector2(x, y)), 48), S.polishedSilver({ rough: 0.08 })); cs.scale.setScalar(1.3); cs.position.set(-1.6, 0.1, -0.6); cs.castShadow = true; scene.add(cs);
        const film = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.45, 32), S.glossy('#2b2f38', { rough: 0.3 })); film.position.set(1.7, 0.33, -0.3); film.castShadow = true; scene.add(film);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 32), S.glossy('#e0241b')); cap.position.set(1.7, 0.58, -0.3); scene.add(cap);
        const coins = S.instances(S.coinGeometry(), S.polishedSilver({ rough: 0.12 }), Array.from({ length: 7 }, (_, i) => ({ p: [1.0 + (i % 3) * 0.1, 0.1 + i * 0.022, 1.0], r: [0, i, 0], s: 1.3 }))); scene.add(coins);
        for (const [x, z, txt] of P0.tags ?? [[0.4, 0.4, '+'], [-1.6, -0.6, '+'], [1.7, -0.3, '+']]) { const lp = PR.labelPlane(txt, { w: 0.6, h: 0.22, red: true }); lp.position.set(x, 1.0, z + 0.2); scene.add(lp); tags.push(lp); }
      }
      let heap = null;
      if (mode === 'coins') { const r = S.rng(3), items = []; for (let i = 0; i < 420; i++) { const a = r() * 6.28, d = Math.pow(r(), 0.7) * 2.2; const h = Math.max(0, 0.9 - d * 0.38) * r(); items.push({ p: [Math.cos(a) * d, 0.1 + h, Math.sin(a) * d * 0.8], r: [(r() - 0.5) * 1.2, r() * 6, (r() - 0.5) * 1.2], s: 1.5 }); }
        heap = S.instances(S.coinGeometry(), S.goldMat({ color: '#e8cf8a', rough: 0.22 }), items); scene.add(heap); }
      G.finish();
      const at = G.cue(P0.at, 1.0);
      const keys = P0.camera ?? (mode === 'fork' ? [{ pos: [5.0, 3.2, 8.0], look: [0, 0.2, 0.4], mm: 50 }, { pos: [3.8, 2.4, 6.4], look: [0, 0.2, 0.4], mm: 55 }]
        : mode === 'coins' ? [{ pos: [3.6, 2.2, 5.0], look: [0, 0.4, 0], mm: 50 }, { pos: [2.4, 1.6, 4.2], look: [0, 0.4, 0], mm: 55 }]
        : [{ pos: [-0.5, 2.4, 5.6], look: [0, 0.4, 0.2], mm: 45 }, { pos: [0.8, 1.9, 4.8], look: [0.2, 0.4, 0.2], mm: 50 }]);
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          tags.forEach((tg, i) => { const s = pop(t, at + i * 0.25); tg.scale.setScalar(Math.max(0.001, s)); tg.position.y = 0.9 + S.range(t, at + i * 0.25, at + 3) * 0.35; tg.rotation.y = Math.sin(t + i) * 0.1; });
          G.cam(keys, t);
          G.frame(t);
        },
      };
    },

    // ================================================================ hero-bar: one bar on a velvet plinth; the price label rolls (macro product shot)
    // params: from, to (price roll), at, span, label (kicker), date, red (bool), spin (deg)
    async 'hero-bar'(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 6, caption: P0caption(shot, null), source: P0src(shot, null), bokeh: 4, dofRange: 1.4 });
      const { P0, scene } = G;
      const plinth = new THREE.Mesh(S.roundBox(5, 1.2, 3.2, 0.12), S.velvet(P0.velvet ?? '#1d3557')); plinth.castShadow = plinth.receiveShadow = true; scene.add(plinth);
      const bar = new THREE.Mesh(S.barGeometry(), S.barMaterial({ serial: P0.serial ?? 'Nº 1980-0117', rough: 0.15 })); bar.castShadow = true; bar.position.y = 1.2; scene.add(bar);
      const d = H.sc();
      const big = H.K.div(G.layer, `opacity:0;left:6%;top:58%;font:700 ${150 * d}px 'Archivo Narrow';color:#14233d;line-height:1`, '');
      const kick = H.K.div(G.layer, `opacity:0;left:6.3%;top:52%;font:600 ${26 * d}px 'Plex Mono';letter-spacing:.14em;color:#4b5a70`, P0.label ?? 'ONE OUNCE OF SILVER');
      const date = H.K.div(G.layer, `opacity:0;left:6.3%;top:76%;font:600 ${26 * d}px 'Plex Mono';letter-spacing:.12em;color:#fff;background:#14233d;padding:.25em .6em`, P0.date ?? '');
      G.finish();
      const at = G.cue(P0.at, 0.8), span = P0.span ?? 1.8, from = P0.from ?? 6, to = P0.to ?? 50;
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          bar.rotation.y = (P0.spin ?? 25) * Math.PI / 180 * (t / G.dur) - 0.35;
          G.cam([{ pos: [3.5, 3.4, 8.5], look: [0.6, 1.6, 0], mm: 70 }, { pos: [5.0, 2.8, 7.2], look: [0.6, 1.6, 0], mm: 80 }], t, { focus: undefined });
          const k = S.outQuint(S.range(t, at, at + span)); const v = from + (to - from) * k;
          big.textContent = `$${v.toFixed(2)}`; big.style.opacity = kick.style.opacity = String(S.range(t, 0.2, 0.6)); date.style.opacity = P0.date ? String(S.range(t, 0.4, 0.8)) : '0';
          big.style.color = P0.red && k >= 1 ? '#e0241b' : '#14233d';
          G.frame(t);
        },
      };
    },

    // ================================================================ bailout: a bank (columns) + a giant loan ticket ($1.1B) sliding onto the plinth
    async bailout(ctx, shot) {
      const G = await stage(H, ctx, shot, { span: 16, caption: P0caption(shot, 'THE RESCUE LOAN'), source: P0src(shot, 'ILLUSTRATION') });
      const { P0, scene } = G;
      const banks = P0.mode === 'banks' ? (P0.banks ?? ['BARCLAYS', 'DEUTSCHE BANK', 'CANADIAN BANKS']) : null;
      const bank = PR.building({ w: 10, d: 6, h: 5, cols: 6, label: P0.bankLabel ?? 'THE BANKS' }); bank.position.set(0, 0, -4); if (!banks) scene.add(bank);
      const noTags = [];
      if (banks) banks.forEach((n, i) => { const b = PR.building({ w: 6, d: 4.5, h: 3.6, cols: 4, label: n }); b.position.set((i - 1) * 8, 0, -3); scene.add(b);
        const tg = PR.labelPlane(P0.no ?? 'NO', { w: 2.2, h: 1.0, red: true }); tg.position.set((i - 1) * 8, 5.9, -0.4); tg.visible = false; scene.add(tg); noTags.push(tg); });
      const cash = new THREE.Group(); scene.add(cash); const stacks = [];
      for (let i = 0; i < 24; i++) { const c = PR.cashStack(); c.position.set(((i % 6) - 2.5) * 1.75, Math.floor(i / 12) * 0.3, 3 + (Math.floor(i / 6) % 2) * 0.8); cash.add(c); stacks.push(c); }
      const amount = H.K.div(G.layer, `opacity:0;left:50%;top:14%;transform:translateX(-50%);font:700 ${110 * H.sc()}px 'Archivo Narrow';color:#14233d`, P0.amount ?? '$1.1 BILLION');
      G.finish();
      const at = G.cue(P0.at, 1.0);
      return {
        scene, camera: G.camera, layer: G.layer,
        update(t) {
          noTags.forEach((tg, i) => { const k = pop(t, G.cue((P0.noAt ?? [])[i], at + i * 0.9)); tg.visible = k > 0.001; tg.scale.setScalar(Math.max(0.001, k)); tg.rotation.z = (i - 1) * 0.06; });
          if (banks) { cash.visible = false; amount.style.opacity = '0'; G.cam([{ pos: [-6, 7, 26], look: [0, 3, -2], mm: 35 }, { pos: [5, 6, 24], look: [0, 3, -2], mm: 35 }], t); G.frame(t); return; }
          stacks.forEach((c, i) => { const s = pop(t, at + i * 0.06, { zeta: 0.5, freq: 2.6 }); c.scale.setScalar(Math.max(0.001, s)); c.position.y = Math.floor(i / 12) * 0.3 + (1 - Math.min(1, s)) * 1.2; });
          amount.style.opacity = String(S.range(t, at + 0.6, at + 1.0));
          G.cam([{ pos: [-10, 6, 20], look: [0, 3, -1], mm: 35 }, { pos: [6, 5, 19], look: [0, 3, -1], mm: 35 }], t);
          G.frame(t);
        },
      };
    },
  };
}
const P0caption = (shot, d) => (shot.params?.caption === undefined ? d : shot.params.caption);
const P0src = (shot, d) => (shot.params?.source === undefined ? d : shot.params.source);
