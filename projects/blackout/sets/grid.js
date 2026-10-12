// LIVE WIRE grid sets.
//
//   cursor    macro on a 2015 operator's LCD: the subpixel grid (RGB stripes, black matrix), a macro lens's
//             shallow focus band and glass, and the pointer moving by itself. params.mode:
//             'drift' (the pointer wanders by itself), 'click' (it crosses to a breaker, the confirm dialog opens,
//             it clicks OPEN, the breaker goes red, the alarm prints), 'still' (the operator's own, motionless
//             pointer; the pixels breathe). target (breaker id, default 'Q13'), move / click (words or s), zoom.
//   oneline   a single-line diagram of a 110/10 kV substation drawn stroke by stroke in phosphor green; breakers
//             flip green -> red (OPEN) on words; then it extrudes into 3D (cabinets, transformers, posts) as the
//             CRT dissolves into the world. params.mode: 'draw' | 'trip' | 'extrude' | 'full'; trips: [{ id, word }]
//             (ids F1..F8, T1, T2), at (extrude cue), drawDur.
// Also exported for other sets: LCD (GLSL), lcdMaterial(tex, size) and hmiState(t, cfg) (the phantom-cursor
// timeline shared with the control room and the cold open).
import * as THREE from 'three';
import * as LW from './lw.js';

const { clamp, lerp, range, sstep, smoother, hash, PAL, FONT } = LW;

// ---------------------------------------------------------------- LCD subpixels (GLSL)
// lcd(p, fw): colour of an LCD at monitor-pixel coordinate p (float), with fw = fwidth(p) for antialiasing.
// Vertical RGB stripes with a black matrix; when a subpixel is smaller than a screen pixel the pattern
// fades to the mip-filtered average (no moire).
export const LCD = /* glsl */`
uniform sampler2D tScreen; uniform vec2 uSize; uniform float uLcdGain;
vec3 lcd(vec2 p, vec2 fw, float blurLod) {
  vec2 px = floor(p); vec2 f = p - px;
  vec3 c = texelFetch(tScreen, ivec2(clamp(px, vec2(0.), uSize - 1.)), 0).rgb;
  float sx = f.x * 3.; float k = floor(sx); float u = sx - k;
  vec2 w = fw * vec2(3., 1.);
  float ex = smoothstep(.0, .14 + w.x, u) * smoothstep(1., .86 - w.x, u);
  float ey = smoothstep(.0, .06 + w.y, f.y) * smoothstep(1., .94 - w.y, f.y);
  vec3 ch = k < .5 ? vec3(1., .04, .03) : k < 1.5 ? vec3(.03, 1., .06) : vec3(.04, .08, 1.);
  vec3 sub = ch * dot(ch, c) * ex * ey * 2.4;
  vec3 avg = textureLod(tScreen, (p) / uSize, blurLod).rgb * .92;
  float far = smoothstep(.12, .45, max(fw.x, fw.y));
  return mix(sub, avg, max(far, smoothstep(0., 1.2, blurLod))) * uLcdGain;
}`;
export function lcdMaterial(tex, size, { gain = 1.6, emissive = true } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { tScreen: { value: tex }, uSize: { value: new THREE.Vector2(...size) }, uLcdGain: { value: gain }, uPower: { value: 1 }, uGlare: { value: 0.03 } },
    vertexShader: `varying vec2 vUv; varying vec3 vV; void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: LCD + /* glsl */`
      uniform float uPower, uGlare; varying vec2 vUv; varying vec3 vV;
      void main() { vec2 p = vUv * uSize; vec2 fw = fwidth(p);
        vec3 c = lcd(p, fw, 0.) * uPower;
        c += vec3(.02, .03, .03) * uGlare * 30. * pow(1. - abs(vUv.y - .7), 6.);
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the phantom cursor timeline
// cfg: { W, H (screen px), target, tMove, tClick, rest: [x, y], mode } -> drawHMI state at time t.
export function hmiState(t, cfg) {
  const { W = 1280, H = 1024, target = 'Q13', mode = 'click' } = cfg;
  const rest = cfg.rest ?? [W * 0.58, H * 0.36];
  const tm = cfg.tMove ?? 1.0, tc = cfg.tClick ?? tm + 2.6;
  const bx = LW.hmiBreaker(target, W, H);
  const s = H / 1024;
  const btn = [bx[0] + 40 * s + 120 * s + 50 * s, bx[1] - 40 * s + 110 * s + 18 * s]; // the OPEN button of the dialog
  let cur = rest.slice(), down = false, dialog = 0, open = {}, alarms = [['15:31:07', 'RTU 07  COMM RESTORED', 'ok']];
  const clock = (dt) => { const sec = 12 + Math.floor(Math.max(0, t + (cfg.clock0 ?? 0)) + dt); return `23.12.2015 15:35:${String(sec % 60).padStart(2, '0')}`; };
  if (mode === 'still') { cur = [rest[0] + 0.0, rest[1]]; }
  else if (mode === 'drift') { cur = LW.ghostPath(t, rest, [bx[0] + 6 * s, bx[1] + 4 * s], { at: tm, dur: 2.4, seed: 5 }); }
  else {
    // hover to the breaker, click (the dialog opens), move to OPEN, click: the breaker opens
    const tArrive = tm + 1.5, tDlg = tArrive + 0.25, tOpen = tc;
    cur = LW.ghostPath(t, rest, [bx[0] + 4 * s, bx[1] + 3 * s], { at: tm, dur: 1.5, seed: 5 });
    if (t > tDlg) cur = LW.ghostPath(t, [bx[0] + 4 * s, bx[1] + 3 * s], btn, { at: tDlg + 0.25, dur: Math.max(0.6, tOpen - tDlg - 0.5), seed: 9 });
    down = (t > tArrive && t < tArrive + 0.12) || (t > tOpen && t < tOpen + 0.12);
    dialog = t > tDlg ? (t < tOpen + 0.1 ? 1 : 0) : 0;
    open[target] = t > tOpen + 0.12 ? 1 : 0;
    if (t > tOpen + 0.3) alarms = [...alarms, [clock(0).slice(11), `SS-07 ${target} ${LW.HMI_BREAKERS.find(b => b[0] === target)?.[3] ?? ''}  CB OPEN  (REMOTE)`]];
    if (t > tOpen + 1.0) alarms = [...alarms, [clock(0).slice(11), `SS-07 ${target}  FEEDER DE-ENERGISED`]];
  }
  return { t, cursor: { x: cur[0], y: cur[1], down }, dialog, dialogId: target, dialogAt: [LW.HMI_BREAKERS.find(b => b[0] === target)?.[1] ?? 0.32, LW.HMI_BREAKERS.find(b => b[0] === target)?.[2] ?? 0.62],
    open, alarms, clock: clock(0), lockout: t > tm ? 1 : 0, opened: open[target] ?? 0 };
}

export default function makeGrid(H) {
  // ---------------------------------------------------------------- cursor (subpixel macro)
  async function cursor(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'click', D = shot.duration;
    const SW = 1280, SH = 1024;
    const scr = LW.canvas(SW, SH);
    const tex = new THREE.CanvasTexture(scr); tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.NearestFilter; tex.flipY = true;
    const { layer } = H.base(ctx);
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tMove = H.cue(shot, P.move, 0.8), tClick = H.cue(shot, P.click, Math.min(D - 1.2, tMove + 3.2));
    const U = { tScreen: { value: tex }, uSize: { value: new THREE.Vector2(SW, SH) }, uLcdGain: { value: 1.25 }, uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
      uCenter: { value: new THREE.Vector2(SW / 2, SH / 2) }, uZoom: { value: 10 }, uFocus: { value: 0.5 }, uDof: { value: 1 }, uTilt: { value: 0.18 }, uTime: { value: 0 }, uRot: { value: -0.035 } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false, toneMapped: false,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: LCD + /* glsl */`
        uniform vec2 uRes, uCenter; uniform float uZoom, uFocus, uDof, uTilt, uTime, uRot; varying vec2 vUv;
        float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main() {
          vec2 q = (vUv - .5) * uRes;
          // a macro lens looking down the screen at an angle: magnification falls off with height (keystone)
          float persp = 1. + uTilt * (vUv.y - .5);
          float cr = cos(uRot), sr = sin(uRot); q = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
          vec2 p = uCenter + vec2(q.x, -q.y) / (uZoom * persp);
          p.y = uSize.y - p.y; // canvas rows run down; the texture's rows run up
          vec2 fw = fwidth(p);
          // shallow focus: a band across the frame, blur grows away from it
          float dz = abs(vUv.y - uFocus) * 2.2 + .15 * abs(vUv.x - .5);
          float lod = uDof * max(0., dz - .22) * 4.5;
          vec3 c = lcd(p, fw, lod);
          // bloom of the bright subpixels (the lens and the panel's diffuser)
          vec3 b1 = textureLod(tScreen, p / uSize, 2.5 + lod * .3).rgb, b2 = textureLod(tScreen, p / uSize, 4.5).rgb;
          c += (b1 * .16 + b2 * .08) * uLcdGain;
          c = c / (1. + .35 * max(c - .9, 0.)); // soft shoulder on white UI so it never blows out
          // the glass: dust and a soft sheen
          float dust = step(.9985, h12(floor(vUv * uRes / 3.))) * .25;
          c += vec3(.05, .07, .07) * (dust + .5 * smoothstep(.3, 1., 1. - length((vUv - vec2(.2, .9)) * vec2(1., 1.6))));
          c *= 1. - .55 * smoothstep(.45, 1.1, length((vUv - .5) * vec2(1.25, 1.)));
          c += (h12(vUv * uRes + fract(uTime * 3.7) * 600.) - .5) * .025;
          gl_FragColor = vec4(c, 1.);
        }` });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false; scene.add(quad);
    const cap = P.caption ? H.caption(layer, P.caption) : null;
    const z0 = P.zoom ?? 7;
    return { scene, camera, layer, toneMapping: THREE.NoToneMapping,
      update(t) {
        const st = hmiState(t, { W: SW, H: SH, target: P.target ?? 'Q13', tMove, tClick, mode, clock0: P.clock0 ?? 0 });
        LW.drawHMI(scr.g, SW, SH, st); tex.needsUpdate = true;
        U.uTime.value = t;
        // the macro rig: holds on the pointer, follows late and soft (a camera operator who can't keep up)
        const lag = 0.55, cx = [], cy = [];
        let ax = 0, ay = 0, wsum = 0; for (let k = 0; k < 8; k++) { const tt = t - lag * k / 7, wk = 1 - k / 9, s2 = hmiState(tt, { W: SW, H: SH, target: P.target ?? 'Q13', tMove, tClick, mode }); ax += s2.cursor.x * wk; ay += s2.cursor.y * wk; wsum += wk; }
        let fx = ax / wsum + 30, fy = ay / wsum + 26;
        // after the click the operator's eye (and the lens) goes to the breaker that just opened
        if (mode === 'click') { const bx = LW.hmiBreaker(P.target ?? 'Q13', SW, SH), k = smoother(range(t, tClick + 0.25, tClick + 1.4)); fx = lerp(fx, bx[0] + 20, k); fy = lerp(fy, bx[1] + 10, k); }
        const zoom = z0 * (1 + 0.12 * smoother(t / Math.max(D, 1))) * (mode === 'still' ? 1.15 : 1);
        U.uCenter.value.set(fx, fy); U.uZoom.value = zoom * (ctx.height / 1080);
        U.uFocus.value = 0.5 + 0.03 * Math.sin(t * 0.4);
        cap?.type(t);
      },
      dispose() { tex.dispose(); mat.dispose(); } };
  }

  // ---------------------------------------------------------------- oneline
  async function oneline(ctx, shot) {
    const P = shot.params ?? {}, mode = P.mode ?? 'full', D = shot.duration;
    const { scene, camera, layer } = H.base(ctx, { fov: 30, near: 0.1, far: 400 });
    scene.background = new THREE.Color(0x000000);
    const drawDur = mode === 'trip' || mode === 'extrude' ? 0 : (P.drawDur ?? Math.min(4.2, D * 0.45));
    const tExt = mode === 'extrude' ? H.cue(shot, P.at, 0.8) : mode === 'full' ? H.cue(shot, P.at, Math.max(drawDur + 2.5, D - 3.6)) : Infinity;
    // layout (units: metres on the ground; x right, z toward camera)
    const G = new THREE.Color(PAL.phosphor), R = new THREE.Color(PAL.red), DEAD = new THREE.Color(0x1d3b2b);
    const items = []; let order = 0;
    const lineMat = () => new THREE.MeshBasicMaterial({ color: G.clone(), toneMapped: false });
    const seg = (x0, z0, x1, z1, w = 0.12, kind = 'line', feeds = null) => {
      const L = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lineMat());
      m.userData = { x0, z0, x1, z1, L, w, kind, order: order++, feeds }; scene.add(m); items.push(m); return m;
    };
    const feeders = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'];
    const fx = (i) => -10.5 + i * 3;
    // incoming 110 kV lines, transformers, busbar
    for (const [x, id] of [[-6, 'T1'], [6, 'T2']]) { seg(x, -14, x, -9.5, 0.16, 'line', id); }
    const brk = {}; const trafo = {};
    const box = (id, x, z, s = 1.0) => { const g = new THREE.Group(); g.position.set(x, 0, z);
      const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s, 1, s)), new THREE.LineBasicMaterial({ color: G.clone(), toneMapped: false }));
      const fill = new THREE.Mesh(new THREE.BoxGeometry(s * 0.86, 1, s * 0.86), new THREE.MeshBasicMaterial({ color: G.clone(), toneMapped: false }));
      const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.98, 1, s * 0.98), new THREE.MeshStandardMaterial({ color: 0x0c1410, roughness: 0.6, metalness: 0.4 }));
      g.add(body, frame, fill); scene.add(g); brk[id] = { g, frame, fill, body, s, order: order++ }; };
    for (const [x, id] of [[-6, 'T1'], [6, 'T2']]) {
      box(id, x, -8.8);
      seg(x, -8.1, x, -6.4, 0.16, 'line', id);
      const tg = new THREE.Group(); tg.position.set(x, 0, -5.4);
      const ring = (z) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 8, 48), lineMat()); r.rotation.x = Math.PI / 2; r.position.z = z; tg.add(r); return r; };
      const r1 = ring(-0.45), r2 = ring(0.45);
      const can = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1, 32), new THREE.MeshStandardMaterial({ color: 0x0c1410, roughness: 0.55, metalness: 0.5 }));
      const rad = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1, 0.3), new THREE.MeshStandardMaterial({ color: 0x0c1410, roughness: 0.5, metalness: 0.5 })); rad.position.z = 1.15;
      tg.add(can, rad); scene.add(tg); trafo[id] = { g: tg, r1, r2, can, rad, order: order++ };
      seg(x, -4.4, x, -2.2, 0.16, 'line', id);
    }
    seg(-12, -2, 12, -2, 0.34, 'bus');
    for (let i = 0; i < 8; i++) { seg(fx(i), -2, fx(i), 0.3, 0.12, 'line'); box(feeders[i], fx(i), 1.0, 0.9); seg(fx(i), 1.7, fx(i), 7.5, 0.12, 'line', feeders[i]); }
    // labels: canvas planes lying on the ground
    const label = (txt, x, z, size = 0.55) => { const c = LW.canvas(512, 96); c.g.font = `64px ${FONT.term}`; c.g.fillStyle = '#5dff9e'; c.g.textBaseline = 'middle'; c.g.fillText(txt, 6, 50);
      const t = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(size * 512 / 96, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.rotation.x = -Math.PI / 2; m.position.set(x + size * 512 / 96 / 2, 0.02, z); m.userData.order = order++; scene.add(m); return m; };
    const labels = [label('110 kV NORTH', -5.6, -13), label('110 kV SOUTH', 6.4, -13), label('10 kV BUS', -11.8, -2.9, 0.5), label('SS-07  110/10 kV', -12, -15.6, 0.8),
      ...feeders.map((f, i) => label(f, fx(i) + 0.4, 6.8, 0.48))];
    const nOrd = order;
    // trips: breakers flip green -> red on cues
    const trips = (P.trips ?? (mode === 'draw' ? [] : feeders.slice(0, 6).map((id, i) => ({ id, at: (mode === 'trip' ? 0.8 : drawDur + 0.8) + i * 0.55 })))).map(tr => ({ ...tr, t0: H.cue(shot, tr.word, tr.at ?? drawDur + 1) }));
    const tripAt = (id) => trips.find(x => x.id === id)?.t0 ?? Infinity;
    // light for the extruded world: a cold key from above, green bounce
    const key = new THREE.DirectionalLight(0xbfe8d0, 0.0); key.position.set(-8, 20, 10); scene.add(key);
    const amb = new THREE.HemisphereLight(0x2a4a3a, 0x000000, 0.0); scene.add(amb);
    const grid = new THREE.GridHelper(60, 60, 0x0f2a1c, 0x0a1a12); grid.position.y = -0.01; scene.add(grid);
    // render target -> CRT pass
    const rt = new THREE.WebGLRenderTarget(ctx.width, ctx.height, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, type: THREE.UnsignedByteType });
    const C = LW.crt(ctx, { texture: rt.texture, curve: 0.12, bloom: 1.1, scan: 0.22, encode: true });
    const cap = P.caption ? H.caption(layer, P.caption) : null;
    const tmp = new THREE.Vector3();
    let ext = 0, tNow = 0;
    return { scene, camera, layer,
      update(t) {
        tNow = t;
        ext = smoother(range(t, tExt, tExt + 2.6));
        const dk = (o) => drawDur <= 0 ? 1 : range(t, 0.25 + o / nOrd * drawDur, 0.25 + o / nOrd * drawDur + drawDur / nOrd * 2.2);
        // segments draw on, then (extrude) rise into raised conductors on posts
        for (const m of items) { const u = m.userData, k = dk(u.order); m.visible = k > 0.001;
          const L = u.L * k, dx = (u.x1 - u.x0) / u.L, dz = (u.z1 - u.z0) / u.L;
          const h = lerp(0.02, u.kind === 'bus' ? 0.5 : 0.18, ext), y = lerp(0.01, u.kind === 'bus' ? 2.6 : 1.8, ext);
          m.scale.set(Math.abs(dx) > 0.5 ? L : u.w, h, Math.abs(dz) > 0.5 ? L : u.w);
          m.position.set(u.x0 + dx * L / 2, y, u.z0 + dz * L / 2);
          const dead = u.feeds && t > tripAt(u.feeds) + 0.08;
          m.material.color.copy(dead ? DEAD : G); }
        for (const [id, b] of Object.entries(brk)) { const k = dk(b.order); b.g.visible = k > 0.01; const s = sstep(0, 1, k);
          const open = t > tripAt(id); const blink = open && t < tripAt(id) + 0.9 ? (Math.floor((t - tripAt(id)) * 8) % 2) : 0;
          const hgt = lerp(0.04, 2.2, ext); b.g.scale.set(s, hgt, s); b.g.position.y = hgt / 2;
          b.frame.material.color.copy(open ? R : G); b.fill.material.color.copy(open ? (blink ? R : new THREE.Color(0x200504)) : G);
          b.fill.scale.set(1, lerp(1, 0.08, ext), 1); b.fill.position.y = lerp(0, 0.5, ext); b.body.visible = ext > 0.02; }
        for (const tr of Object.values(trafo)) { const k = dk(tr.order); tr.g.visible = k > 0.01; tr.g.scale.setScalar(sstep(0, 1, k));
          const hgt = lerp(0.02, 3.2, ext); tr.can.scale.y = hgt; tr.can.position.y = hgt / 2; tr.rad.scale.y = hgt * 0.8; tr.rad.position.y = hgt * 0.4; tr.can.visible = tr.rad.visible = ext > 0.02;
          tr.r1.position.y = tr.r2.position.y = lerp(0.02, hgt + 0.08, ext); }
        for (const l of labels) { const k = dk(l.userData.order); l.material.opacity = k * (1 - 0.6 * ext); }
        key.intensity = 2.2 * ext; amb.intensity = 0.8 * ext; grid.material.opacity = 1; grid.visible = ext > 0.01 || true;
        // camera: top-down plan (a long lens, almost orthographic) that tilts into an oblique 3D view
        const tilt = lerp(89.5, 32, ext), az = lerp(0, -24, ext) + 4 * Math.sin(t * 0.07), dist = lerp(58, 34, ext) * (1 - 0.05 * smoother(t / Math.max(D, 1)));
        const el = tilt * Math.PI / 180, a = az * Math.PI / 180, look = new THREE.Vector3(0, lerp(0, 1, ext), lerp(-3.5, -2, ext));
        camera.position.set(look.x + Math.sin(a) * Math.cos(el) * dist, look.y + Math.sin(el) * dist, look.z + Math.cos(a) * Math.cos(el) * dist);
        camera.up.set(0, ext < 0.001 ? 0 : 1, ext < 0.001 ? -1 : 0); if (ext > 0) camera.up.set(0, 1, 0).lerp(new THREE.Vector3(0, 0, -1), 1 - sstep(0, 0.3, ext)).normalize();
        camera.fov = lerp(28, 34, ext); camera.updateProjectionMatrix(); camera.lookAt(look);
        cap?.type(t);
      },
      render(r) {
        r.setRenderTarget(rt); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, camera); r.setRenderTarget(null);
        // the CRT relaxes as the diagram becomes a place
        C.U.uCurve.value = 0.12 * (1 - ext); C.U.uScan.value = 0.22 * (1 - ext); C.U.uBloom.value = lerp(1.1, 0.55, ext);
        C.render(r, { t: tNow, dirty: false });
      },
      toneMapping: THREE.NoToneMapping,
      dispose() { rt.dispose(); C.dispose(); } };
  }

  return { cursor, oneline };
}
