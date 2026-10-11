// Vehicles: procedural low-poly cars (sedan, SUV, van), a semi tractor + trailer, an airliner.
// All share one shader (part ids per vertex: paint, glass, trim, tyre, rim, lamps), drawn as
// instanced fleets refilled every frame from pure functions of t: traffic(t) on roads, driver
// s(t) from a speed profile, wheels turning by s / r, headlight beams in the haze, light glows.
// (Kenney Car Kit, CC0, was evaluated: toy proportions; these are built to real dimensions.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { worldMaterial, GLSL_TONE, rng, clamp, lerp, smoother } from './core.js';
import { glowPoints } from './props.js';

const PART = { paint: 0, glass: 1, trim: 2, tyre: 3, head: 4, tail: 5, rim: 6, under: 7, amber: 8, cabin: 9, white: 10, chrome: 11 };
function tag(g, part) { g = g.index ? g.toNonIndexed() : g; const n = g.getAttribute('position').count; g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(n).fill(part), 1)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'aPart'].includes(k)) g.deleteAttribute(k); return g; }
const boxAt = (w, h, d, x, y, z, part) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return tag(g, part); };
// classify faces of a geometry by a function of (centre, normal) -> part
function classify(g, fn) {
  g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
  const p = g.getAttribute('position'), n = g.getAttribute('normal'), part = new Float32Array(p.count);
  for (let i = 0; i < p.count; i += 3) {
    const c = [0, 1, 2].map(k => (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3 * (k === 0) + (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3 * (k === 1) + (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3 * (k === 2));
    const nn = [(n.getX(i) + n.getX(i + 1) + n.getX(i + 2)) / 3, (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3, (n.getZ(i) + n.getZ(i + 1) + n.getZ(i + 2)) / 3];
    part.fill(fn(c, nn), i, i + 3);
  }
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'aPart'].includes(k)) g.deleteAttribute(k);
  return g;
}

// ---------------------------------------------------------------- car bodies (x forward, y up, z right)
function carGeo({ L = 4.8, W = 1.84, ride = 0.3, belt = 0.95, roof = 1.44, hood = 0.82, cowl = 1.05, wb = 2.8, wr = 0.34, greenFront = 0.15, greenBack = -0.95, tailTop = 0.96, boxy = 0 } = {}) {
  const h = L / 2, a = wb / 2, ar = wr + 0.06;
  const s = new THREE.Shape();
  s.moveTo(-h + 0.02, ride);
  const arch = (cx) => { s.lineTo(cx - ar, ride); for (let k = 0; k <= 10; k++) { const t = Math.PI - k / 10 * Math.PI; s.lineTo(cx + ar * Math.cos(t), wr + 0.02 + ar * Math.sin(t)); } s.lineTo(cx + ar, ride); };
  arch(-a); arch(a);
  s.lineTo(h - 0.02, ride); s.lineTo(h + 0.02, ride + 0.3); s.lineTo(h - 0.06, hood - 0.08); s.lineTo(h - 0.35, hood); s.lineTo(cowl, belt - 0.02);
  s.lineTo(-h + 0.55 + boxy * 0.4, tailTop); s.lineTo(-h + 0.05, tailTop - 0.1 - boxy * 0); s.lineTo(-h - 0.02, ride + 0.32);
  const body = new THREE.ExtrudeGeometry(s, { depth: W - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 4 });
  body.translate(0, 0, -(W - 0.12) / 2);
  const bodyC = classify(body, (c, n) => n[1] < -0.6 ? PART.under : c[1] < ride + 0.16 ? PART.trim : (c[0] > h - 0.12 && c[1] < hood - 0.18 && c[1] > ride + 0.12) ? PART.trim : PART.paint);
  const g = new THREE.Shape();
  const gb = boxy ? -h + 0.25 : greenBack;
  g.moveTo(cowl - 0.05, belt - 0.04); g.lineTo(greenFront, roof); g.lineTo(gb + (boxy ? 0.05 : 0), roof - 0.02); g.lineTo(boxy ? -h + 0.12 : -h + 0.6, boxy ? belt + 0.05 : tailTop - 0.02); g.lineTo(cowl - 0.05, belt - 0.04);
  const gh = new THREE.ExtrudeGeometry(g, { depth: W - 0.42, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 2, curveSegments: 2 });
  gh.translate(0, 0, -(W - 0.42) / 2);
  const ghC = classify(gh, (c, n) => (n[1] > 0.8 && c[1] > roof - 0.12) ? PART.paint : (Math.abs(n[2]) > 0.6 && c[0] > greenFront - 0.15 && c[0] < greenFront + 0.1) ? PART.paint : PART.glass);
  const parts = [bodyC, ghC];
  for (const z of [-1, 1]) {
    parts.push(boxAt(0.12, 0.13, 0.4, h - 0.12, hood - 0.18, z * (W / 2 - 0.3), PART.head));
    parts.push(boxAt(0.08, 0.1, 0.46, -h + 0.0, tailTop - 0.2, z * (W / 2 - 0.3), PART.tail));
    parts.push(boxAt(0.16, 0.1, 0.06, cowl - 0.15, belt + 0.05, z * (W / 2 + 0.03), PART.trim)); // mirrors
  }
  return { geo: mergeGeometries(parts), wheels: [[a, wr, -(W / 2 - 0.2)], [a, wr, W / 2 - 0.2], [-a, wr, -(W / 2 - 0.2)], [-a, wr, W / 2 - 0.2]], wr, L, W,
    head: [[h, hood - 0.18, -(W / 2 - 0.3)], [h, hood - 0.18, W / 2 - 0.3]], tail: [[-h - 0.02, tailTop - 0.2, -(W / 2 - 0.3)], [-h - 0.02, tailTop - 0.2, W / 2 - 0.3]] };
}

function tractorGeo() {
  // US conventional: long hood, sleeper, stacks. Rear axles at x = -2.2 / -3.5; front at 2.6. Fifth wheel at -2.85.
  const P = [];
  P.push(boxAt(7.6, 0.35, 0.95, -0.9, 0.95, 0, PART.under)); // frame rails
  P.push(boxAt(2.2, 1.1, 2.3, 2.6, 1.55, 0, PART.paint)); // hood
  P.push(boxAt(0.12, 0.85, 1.6, 3.72, 1.5, 0, PART.chrome)); // grille
  P.push(boxAt(0.3, 0.32, 2.5, 3.75, 0.85, 0, PART.chrome)); // bumper
  P.push(boxAt(1.7, 1.9, 2.45, 0.7, 2.25, 0, PART.paint)); // cab
  P.push(boxAt(0.05, 0.8, 2.1, 1.56, 2.75, 0, PART.glass)); // windshield
  for (const z of [-1, 1]) P.push(boxAt(1.0, 0.75, 0.04, 0.85, 2.7, z * 1.23, PART.glass));
  P.push(boxAt(2.0, 2.55, 2.45, -1.15, 2.55, 0, PART.paint)); // sleeper
  P.push(boxAt(1.6, 0.25, 2.3, -1.15, 3.92, 0, PART.paint)); // fairing
  for (const z of [-1, 1]) { const st = tag(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8), PART.chrome); st.translate(-0.05, 3.3, z * 1.15); P.push(st);
    const tk = tag(new THREE.CylinderGeometry(0.33, 0.33, 1.3, 12).rotateZ(Math.PI / 2), PART.chrome); tk.translate(0.2, 0.85, z * 1.05); P.push(tk);
    P.push(boxAt(0.12, 0.15, 0.32, 3.72, 1.35, z * 0.95, PART.head));
    P.push(boxAt(0.1, 0.08, 0.08, 1.6, 3.25, z * 0.9, PART.amber)); }
  P.push(boxAt(0.06, 0.06, 1.4, 1.55, 3.27, 0, PART.amber)); // cab marker lights
  return { geo: mergeGeometries(P), wheels: [[2.6, 0.52, -1.05], [2.6, 0.52, 1.05], [-2.15, 0.52, -0.95], [-2.15, 0.52, 0.95], [-3.45, 0.52, -0.95], [-3.45, 0.52, 0.95]], wr: 0.52, L: 7.6, W: 2.5,
    head: [[3.78, 1.35, -0.95], [3.78, 1.35, 0.95]], tail: [], marker: [[1.6, 3.25, -0.9], [1.6, 3.25, 0.9]] };
}
function trailerGeo() {
  // 53 ft box, kingpin at x = 0, box from +0.9 to -15.3
  const P = [];
  P.push(boxAt(16.2, 2.75, 2.6, -7.2, 2.72, 0, PART.white));
  P.push(boxAt(15.6, 0.25, 1.0, -7.2, 1.25, 0, PART.under));
  P.push(boxAt(0.1, 0.35, 2.4, -15.3, 0.75, 0, PART.under)); // underride
  for (const z of [-1, 1]) P.push(boxAt(0.06, 0.14, 0.24, -15.32, 1.35, z * 1.0, PART.tail));
  const markers = [];
  for (let x = 0.3; x > -15.3; x -= 3.9) for (const z of [-1, 1]) { P.push(boxAt(0.12, 0.08, 0.04, x, 1.45, z * 1.31, PART.amber)); markers.push([x, 1.45, z * 1.32]); }
  return { geo: mergeGeometries(P), wheels: [[-13.2, 0.52, -0.95], [-13.2, 0.52, 0.95], [-14.45, 0.52, -0.95], [-14.45, 0.52, 0.95]], wr: 0.52, L: 16.2, W: 2.6, head: [], tail: [[-15.34, 1.35, -1], [-15.34, 1.35, 1]], marker: markers };
}
function planeGeo() {
  // narrow-body airliner, ~38 m long, 36 m span. x forward.
  const P = [];
  const prof = []; const Lf = 38;
  for (let i = 0; i <= 24; i++) { const t = i / 24; const x = -Lf / 2 + t * Lf; let r = 1.95; if (t > 0.88) r *= Math.sqrt(Math.max(0, 1 - ((t - 0.88) / 0.12) ** 2)) * 0.95 + 0.05; if (t < 0.25) r *= 0.35 + 0.65 * Math.sqrt(t / 0.25); prof.push(new THREE.Vector2(Math.max(0.02, r), x)); }
  const fus = new THREE.LatheGeometry(prof, 16); fus.rotateZ(-Math.PI / 2); P.push(classify(fus, (c) => c[0] > Lf / 2 - 3.3 && c[1] > 0.4 ? PART.glass : PART.white));
  const wing = new THREE.Shape(); wing.moveTo(3, 0); wing.lineTo(-4.5, 17.5); wing.lineTo(-6.2, 17.5); wing.lineTo(-4.2, 0); wing.lineTo(3, 0);
  for (const z of [-1, 1]) { const w = new THREE.ExtrudeGeometry(wing, { depth: 0.35, bevelEnabled: false }); w.rotateX(Math.PI / 2 * z); w.translate(-1, -0.7, 0); P.push(tag(w, PART.white));
    const eng = tag(new THREE.CylinderGeometry(0.95, 0.85, 3.6, 14).rotateZ(Math.PI / 2), PART.trim); eng.translate(1.2, -1.6, z * 5.8); P.push(eng);
    const st = new THREE.Shape(); st.moveTo(-15, 0); st.lineTo(-18.8, 6.2); st.lineTo(-19.8, 6.2); st.lineTo(-18.6, 0); st.lineTo(-15, 0);
    const s = new THREE.ExtrudeGeometry(st, { depth: 0.2, bevelEnabled: false }); s.rotateX(Math.PI / 2 * z); s.translate(0, 0.6, 0); P.push(tag(s, PART.white)); }
  const fin = new THREE.Shape(); fin.moveTo(-13.5, 1.5); fin.lineTo(-18.2, 8.6); fin.lineTo(-19.7, 8.6); fin.lineTo(-18.8, 1.5); fin.lineTo(-13.5, 1.5);
  const f = new THREE.ExtrudeGeometry(fin, { depth: 0.3, bevelEnabled: false }); f.translate(0, 0, -0.15); P.push(tag(f, PART.paint));
  return { geo: mergeGeometries(P), wheels: [], wr: 1, L: 38, W: 36, head: [[17, -1.2, 0]], tail: [], nav: { left: [-5.6, -0.6, -17.5], right: [-5.6, -0.6, 17.5], tail: [-19.2, 0.5, 0], belly: [-2, -2.1, 0], top: [-2, 2.0, 0] } };
}
function wheelGeo() {
  const t = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true).rotateX(Math.PI / 2); const tt = tag(t, PART.tyre);
  const c1 = new THREE.CircleGeometry(0.98, 18); c1.translate(0, 0, 0.5); const c2 = new THREE.CircleGeometry(0.98, 18); c2.rotateY(Math.PI); c2.translate(0, 0, -0.5);
  return mergeGeometries([tt, tag(c1, PART.rim), tag(c2, PART.rim)]);
}

export const MODELS = {
  sedan: () => carGeo({}),
  suv: () => carGeo({ L: 4.9, W: 1.95, ride: 0.42, belt: 1.12, roof: 1.78, hood: 1.02, cowl: 1.0, wb: 2.9, wr: 0.38, greenFront: 0.25, greenBack: -1.9, tailTop: 1.1, boxy: 1 }),
  van: () => carGeo({ L: 5.3, W: 2.0, ride: 0.4, belt: 1.1, roof: 2.05, hood: 1.0, cowl: 1.6, wb: 3.4, wr: 0.36, greenFront: 1.0, greenBack: -2.4, tailTop: 1.9, boxy: 1 }),
  tractor: tractorGeo, trailer: trailerGeo, plane: planeGeo,
};

// ---------------------------------------------------------------- material
export function vehicleMaterial(world) {
  return world._vehMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`
      attribute float aPart; attribute vec3 aPaint; attribute vec4 aLit;
      varying vec3 vRel, vLocal, vN, vP; varying float vPart; varying vec3 vPaint; varying vec4 vLit;
      void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vRel = wp.xyz; vLocal = wp.xyz + uOrigin;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vP = position; vPart = aPart; vPaint = aPaint; vLit = aLit;
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      varying vec3 vRel, vLocal, vN, vP; varying float vPart; varying vec3 vPaint; varying vec4 vLit;
      void main() {
        vec3 n = normalize(vN); vec3 v = normalize(-vRel); vec3 rf = reflect(-v, n);
        float fres = .04 + .96 * pow(1. - max(dot(n, v), 0.), 5.);
        int p = int(vPart + .5);
        vec3 alb = vPaint; float gloss = .8; vec3 emit = vec3(0.);
        if (p == 1) { alb = vec3(.01); gloss = 1.; }
        else if (p == 2 || p == 7 || p == 9) { alb = vec3(.02); gloss = .15; }
        else if (p == 3) { alb = vec3(.015); gloss = 0.; }
        else if (p == 6) { float a = atan(vP.y, vP.x); float spokes = smoothstep(.3, .6, abs(sin(a * 2.5))) * step(.25, length(vP.xy)) * step(length(vP.xy), .78);
          alb = mix(vec3(.25), vec3(.03), spokes); gloss = .4; }
        else if (p == 4) { alb = vec3(.4); emit = vec3(1., .92, .8) * 40. * vLit.x; gloss = 1.; }
        else if (p == 5) { alb = vec3(.15, .01, .01); emit = vec3(1., .012, .006) * (.55 + 1.3 * vLit.y) * max(vLit.x, vLit.y); }
        else if (p == 8) { alb = vec3(.3, .2, .05); emit = vec3(1., .55, .12) * 5. * vLit.x; }
        else if (p == 10) { float rib = smoothstep(.04, .0, abs(fract(vP.x / 1.22) - .5) - .44); alb = vec3(.62, .62, .6) * (.88 + .12 * rib) * (.85 + .15 * smoothstep(.8, 2.4, vP.y)); gloss = .35; }
        else if (p == 11) { alb = vec3(.35); gloss = 1.; }
        vec3 col = alb * lightDiffuse(n, vLocal) + alb * headlights(vLocal, n) * .3;
        col += alb * vec3(1., .55, .24) * .45 * uNight * (n.y * .5 + .5);   // overhead sodium on lit roads
        // reflections: sky (clear coat), overhead sodium lamps streaking over the body, the sun
        vec3 rsky = skyColor(normalize(rf + vec3(0., .02, 0.)));
        float overhead = smoothstep(.55, .95, rf.y) * uNight;
        float streak = smoothstep(.75, 1., sin(dot(vLocal.xz, vec2(.7, .7)) * .12) * .5 + .5);
        col += (rsky * (p == 0 ? 2.0 : .7) + uCityGlow * (p == 0 ? .8 : .1) + vec3(1., .6, .28) * overhead * streak * 3.) * mix(fres, 1., (p == 0 ? .12 : .03) * gloss) * gloss;
        col += uSunCol * pow(max(dot(rf, uSunDir), 0.), 200.) * gloss * 3.;
        col += emit;
        col = applyFog(col, vRel, vLocal);
        col = mix(col, uMapRoad * 1.3, uMap);
        gl_FragColor = vec4(col, 1.); ${GLSL_TONE} }`,
  });
}
function beamMaterial(world) {
  return world._beamMat ??= worldMaterial(world.U, {
    uniforms: { uBeamLen: { value: 30 } },
    vertex: /* glsl */`
      attribute vec4 aLit; varying vec3 vRel, vN; varying float vAlong, vI;
      void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vRel = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vAlong = position.x; vI = aLit.x; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      varying vec3 vRel, vN; varying float vAlong, vI;
      void main() { vec3 v = normalize(-vRel); float edge = pow(abs(dot(normalize(vN), v)), 1.5);
        float k = pow(1. - clamp(vAlong, 0., 1.), 2.) * smoothstep(0., .04, vAlong);
        float haze = clamp(uHazeDen * 9000. + uCloudFog * 400., .15, 1.);
        vec3 col = vec3(1., .9, .75) * edge * k * vI * haze * .14 * (1. - uMap);
        gl_FragColor = vec4(col, 1.); ${GLSL_TONE} }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------- fleet (instanced, refilled each frame)
export function fleet(world, { capacity = {}, beams = true } = {}) {
  const group = new THREE.Group(); group.name = 'fleet';
  const mat = vehicleMaterial(world), wGeo = wheelGeo();
  const kinds = {};
  const cap = { sedan: 120, suv: 80, van: 40, tractor: 30, trailer: 30, plane: 2, ...capacity };
  let wheelCap = 0, lightCap = 0;
  for (const [k, n] of Object.entries(cap)) {
    if (!n) continue; const M = MODELS[k](); const geo = M.geo.clone();
    const im = new THREE.InstancedMesh(geo, mat, n); im.count = 0; im.frustumCulled = false;
    geo.setAttribute('aPaint', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute('aLit', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
    group.add(im); kinds[k] = { M, im, n, used: 0 };
    wheelCap += n * M.wheels.length; lightCap += n * (M.head.length + M.tail.length + (M.marker?.length ?? 0) + (M.nav ? 5 : 0));
  }
  const wheels = new THREE.InstancedMesh(wGeo, mat, Math.max(1, wheelCap)); wheels.count = 0; wheels.frustumCulled = false;
  wGeo.setAttribute('aPaint', new THREE.InstancedBufferAttribute(new Float32Array(wheels.instanceMatrix.count * 3), 3)); wGeo.setAttribute('aLit', new THREE.InstancedBufferAttribute(new Float32Array(wheels.instanceMatrix.count * 4), 4));
  group.add(wheels);
  const beamCap = beams ? (cap.sedan + cap.suv + cap.van + cap.tractor) * 2 : 0;
  let beamMesh = null;
  if (beamCap) {
    const cone = new THREE.CylinderGeometry(1, 0.03, 1, 20, 1, true); cone.rotateZ(-Math.PI / 2); cone.translate(0.5, 0, 0); // x: 0 at lamp, 1 at far end
    cone.setAttribute('aLit', new THREE.InstancedBufferAttribute(new Float32Array(beamCap * 4), 4));
    beamMesh = new THREE.InstancedMesh(cone, beamMaterial(world), beamCap); beamMesh.count = 0; beamMesh.frustumCulled = false; beamMesh.renderOrder = 30; group.add(beamMesh);
  }
  const glows = glowPoints(world, Math.max(1, lightCap), { size: 0.3, halo: 1.6, minPx: 1.2, night: false, intensity: 1.4, maxPx: 26 });
  group.add(glows.points);
  const m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3(), up = new THREE.Vector3();
  let nW = 0, nB = 0, nG = 0;
  const api = {
    group, kinds, glows,
    begin() { for (const k in kinds) kinds[k].used = 0; nW = 0; nB = 0; nG = 0; },
    // pose: { pos: Vector3 (local), quat: Quaternion }, wheelAngle (rad), paint [r,g,b], lights 0..1, brake 0..1
    add(kind, pose, { paint = [0.3, 0.3, 0.32], lights = 1, brake = 0, wheelAngle = 0, beam = true, scale = 1 } = {}) {
      const K = kinds[kind]; if (!K || K.used >= K.n) return;
      const i = K.used++; sc.setScalar(scale); m4.compose(pose.pos, pose.quat, sc); K.im.setMatrixAt(i, m4);
      K.im.geometry.getAttribute('aPaint').setXYZ(i, ...paint); K.im.geometry.getAttribute('aLit').setXYZW(i, lights, brake, 0, 0);
      for (const [x, y, z] of K.M.wheels) {
        if (nW >= wheels.instanceMatrix.count) break;
        const r = K.M.wr; w4.makeRotationZ(-wheelAngle); w4.scale(sc.set(r, r, 0.24 + (K.M.wr > 0.45 ? 0.35 : 0)).multiplyScalar(scale)); w4.setPosition(x * scale, y * scale, z * scale);
        m4.compose(pose.pos, pose.quat, sc.setScalar(1)).multiply(w4); wheels.setMatrixAt(nW, m4); nW++;
      }
      const L = (p, c, I) => { if (nG >= glows.n) return; v.set(...p).multiplyScalar(scale).applyQuaternion(pose.quat).add(pose.pos); glows.set(nG, v.x, v.y, v.z, I); glows.color(nG, c); nG++; };
      for (const p of K.M.head) L(p, [1, 0.92, 0.8], lights * 2.2);
      for (const p of K.M.tail) L(p, [1, 0.06, 0.03], (0.25 + brake * 1.2) * Math.max(lights, brake));
      for (const p of K.M.marker ?? []) L(p, [1, 0.5, 0.1], lights * 0.22);
      if (K.M.nav) { const t = world.U.uTime.value; const strobe = (ph) => (Math.sin((t + ph) * Math.PI * 2 / 1.2) > 0.96 ? 3 : 0);
        L(K.M.nav.left, [1, 0.08, 0.05], 1.2); L(K.M.nav.right, [0.1, 1, 0.3], 1.2); L(K.M.nav.tail, [1, 1, 1], 0.6 + strobe(0.3)); L(K.M.nav.belly, [1, 0.1, 0.05], strobe(0.6) ? 2 : 0.2); L(K.M.nav.top, [1, 1, 1], strobe(0.0)); }
      if (beamMesh && beam && lights > 0.01 && K.M.head.length && kind !== 'plane') {
        for (const p of K.M.head) { if (nB >= beamCap) break;
          const len = 28 * scale, rad = 3.2 * scale;
          w4.makeScale(len, rad * 0.5, rad); w4.premultiply(new THREE.Matrix4().makeRotationZ(-0.045)); w4.setPosition(p[0] * scale, p[1] * scale, p[2] * scale);
          m4.compose(pose.pos, pose.quat, sc.setScalar(1)).multiply(w4); beamMesh.setMatrixAt(nB, m4); beamMesh.geometry.getAttribute('aLit').setXYZW(nB, lights, 0, 0, 0); nB++; }
      }
    },
    end() {
      for (const k in kinds) { const K = kinds[k]; K.im.count = K.used; K.im.instanceMatrix.needsUpdate = true; K.im.geometry.getAttribute('aPaint').needsUpdate = true; K.im.geometry.getAttribute('aLit').needsUpdate = true; }
      wheels.count = nW; wheels.instanceMatrix.needsUpdate = true;
      if (beamMesh) { beamMesh.count = nB; beamMesh.instanceMatrix.needsUpdate = true; beamMesh.geometry.getAttribute('aLit').needsUpdate = true; }
      for (let i = nG; i < glows.n; i++) glows.set(i, 0, 0, 0, 0);
      glows.commit();
    },
  };
  return api;
}

// ---------------------------------------------------------------- poses
// Ground pose on a path that has at(s) -> { gx, gz, h, tx, tz }: position on the sphere, heading
// from the tangent, pitch from the grade, optional roll (lateral acceleration lean).
const Y = new THREE.Vector3(0, 1, 0);
export function groundPose(world, path, s, { lift = 0, roll = 0, u = 0 } = {}, out = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }) {
  const a = path.at(s), b = path.at(s + 2), c = path.at(s - 2);
  const rx = -a.tz, rz = a.tx;
  world.frame.surface(a.gx + rx * u, a.gz + rz * u, a.h + lift, out.pos);
  const yaw = Math.atan2(-a.tz, a.tx), pitch = Math.atan2(b.h - c.h, 4);
  out.quat.setFromEuler(new THREE.Euler(roll, yaw, pitch, 'YZX'));
  return out;
}

// Speed profile -> s(t). keys: [[t, speed m/s], ...] eased between keys (smootherstep), integrated
// on a fine fixed grid so s(t) is deterministic and exactly repeatable.
export function driver(keys, { s0 = 0, dt = 1 / 240 } = {}) {
  const t0 = keys[0][0], t1 = keys.at(-1)[0];
  const vAt = (t) => { if (t <= t0) return keys[0][1]; if (t >= t1) return keys.at(-1)[1]; let i = 0; while (keys[i + 1][0] < t) i++; const [ta, va] = keys[i], [tb, vb] = keys[i + 1]; return lerp(va, vb, smoother((t - ta) / (tb - ta))); };
  const N = Math.ceil((t1 - t0) / dt) + 1, S = new Float64Array(N); S[0] = s0;
  for (let i = 1; i < N; i++) { const ta = t0 + (i - 1) * dt; S[i] = S[i - 1] + (vAt(ta) + 4 * vAt(ta + dt / 2) + vAt(ta + dt)) / 6 * dt; }
  const s = (t) => { if (t <= t0) return s0 + keys[0][1] * (t - t0); if (t >= t1) return S[N - 1] + keys.at(-1)[1] * (t - t1); const f = (t - t0) / dt, i = Math.min(N - 2, Math.floor(f)); return lerp(S[i], S[i + 1], f - i); };
  const accel = (t) => (vAt(t + 0.05) - vAt(t - 0.05)) / 0.1;
  return { s, v: vAt, accel };
}

// Traffic on a road: lanes (road.lane indices, negative = opposite direction), deterministic.
// Returns (t, fleet, { skip(s, laneIdx) }) that adds every vehicle for time t.
export function traffic(world, rd, { lanes = [0, 1, -1, -2], perKm = 6, speed = [24, 31], seed = 3, from = 0, to = null, mix = { sedan: 0.55, suv: 0.25, van: 0.08, truck: 0.12 }, fade = 60, lights = 1, paints = null } = {}) {
  const r = rng(seed); to = to ?? rd.L; const span = to - from;
  const PAINTS = paints ?? [[0.02, 0.02, 0.022], [0.32, 0.32, 0.33], [0.6, 0.6, 0.58], [0.08, 0.1, 0.16], [0.25, 0.04, 0.03], [0.5, 0.48, 0.44], [0.04, 0.06, 0.05], [0.7, 0.7, 0.68]];
  const TRUCK_PAINTS = [[0.5, 0.06, 0.04], [0.04, 0.06, 0.12], [0.6, 0.6, 0.58], [0.03, 0.03, 0.03], [0.1, 0.18, 0.1]];
  const cars = [];
  for (const ln of lanes) {
    const n = Math.max(1, Math.round(span / 1000 * perKm)); const v = speed[0] + r() * (speed[1] - speed[0]);
    for (let k = 0; k < n; k++) {
      const x = r(); const kind = x < mix.sedan ? 'sedan' : x < mix.sedan + mix.suv ? 'suv' : x < mix.sedan + mix.suv + mix.van ? 'van' : 'truck';
      cars.push({ lane: ln, u: rd.lane(ln), s0: (k + r() * 0.6) / n * span, v: v * (kind === 'truck' ? 0.88 : 0.97 + r() * 0.06), kind, paint: kind === 'truck' ? TRUCK_PAINTS[Math.floor(r() * TRUCK_PAINTS.length)] : PAINTS[Math.floor(r() * PAINTS.length)] });
    }
  }
  const pa = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, pb = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
  const flip = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI);
  const path = { at: (s) => rd.pose(s, 0) };
  return (t, F, { skip } = {}) => {
    for (const c of cars) {
      const dir = c.lane < 0 ? -1 : 1;
      let d = ((c.s0 + c.v * t) % span + span) % span;
      const s = dir > 0 ? from + d : to - d;
      if (skip?.(s, c.lane)) continue;
      const edge = Math.min(d, span - d), sc = clamp(edge / fade);
      if (sc <= 0.01) continue;
      const lp = { at: (x) => { const p = rd.pose(x, c.u); return { ...p, tx: p.tx * dir, tz: p.tz * dir }; } };
      if (c.kind === 'truck') {
        groundPose(world, lp, s, { lift: 0 }, pa); F.add('tractor', pa, { paint: c.paint, lights, wheelAngle: s / 0.52 * dir, scale: sc });
        groundPose(world, lp, s - dir * 3.0 - dir * 7, { lift: 0 }, pb);
        // trailer: kingpin over the tractor's fifth wheel, heading towards it from its rear axle
        const king = rd.pose(s - dir * 2.85, c.u), rear = rd.pose(s - dir * 2.85 - dir * 13.8, c.u);
        const yaw = Math.atan2(-(king.gz - rear.gz), king.gx - rear.gx);
        world.frame.surface(king.gx, king.gz, king.h, pb.pos); pb.quat.setFromEuler(new THREE.Euler(0, yaw, 0, 'YZX'));
        F.add('trailer', pb, { paint: [0.6, 0.6, 0.58], lights, wheelAngle: s / 0.52 * dir, scale: sc, beam: false });
      } else {
        groundPose(world, lp, s, {}, pa);
        F.add(c.kind, pa, { paint: c.paint, lights, wheelAngle: s / 0.34 * dir, scale: sc });
      }
    }
  };
}
