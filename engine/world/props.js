// Street furniture and vegetation, all instanced: lamp posts (single / double arm), glow points
// (lamp heads, windows, vehicle lights: constant minimum pixel size so a city glitters from the air),
// and tree impostors (cylindrical billboards from a procedural atlas, shrinking out with distance).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { worldMaterial, GLSL_TONE, rng } from './core.js';

// ---------------------------------------------------------------- lamp posts
function lampGeometry(double) {
  const parts = [];
  const add = (g, emissive = 0) => { const c = new Float32Array(g.getAttribute('position').count * 3).fill(emissive); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); parts.push(g.toNonIndexed()); };
  const pole = new THREE.CylinderGeometry(0.09, 0.14, 10, 6, 1, true); pole.translate(0, 5, 0); add(pole);
  const base = new THREE.CylinderGeometry(0.22, 0.26, 0.6, 6); base.translate(0, 0.3, 0); add(base);
  for (const s of double ? [-1, 1] : [1]) {
    const arm = new THREE.BoxGeometry(0.08, 0.08, 1.9); arm.translate(0, 9.85, s * 0.95); add(arm);
    const head = new THREE.BoxGeometry(0.34, 0.12, 0.7); head.translate(0, 9.78, s * 1.75); add(head);
    const lens = new THREE.BoxGeometry(0.26, 0.02, 0.56); lens.translate(0, 9.71, s * 1.75); add(lens, 1);
  }
  return mergeGeometries(parts);
}
export function buildLamps(world, lamps) {
  const group = new THREE.Group(); group.name = 'lamps';
  if (!lamps.length) return { group, heads: [] };
  const mat = worldMaterial(world.U, {
    vertex: /* glsl */`
      attribute vec3 color; varying vec3 vRel, vLocal, vN; varying float vE;
      void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin;
        float base = (modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).y + uOrigin.y;
        local.y = mix(local.y, flatY(local) + (local.y - base) * .02, uFlat); wp.y = local.y - uOrigin.y;
        vRel = wp.xyz; vLocal = local; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vE = color.r; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      varying vec3 vRel, vLocal, vN; varying float vE;
      void main() { vec3 n = normalize(vN); vec3 alb = vec3(.09, .09, .095);
        vec3 col = alb * lightDiffuse(n, vLocal) + alb * vec3(1., .6, .28) * .6 * uNight;
        col += vE * vec3(1., .66, .34) * 18. * uNight;
        col = applyFog(col, vRel, vLocal); col = mix(col, uMapRoad, uMap);
        gl_FragColor = vec4(col, 1. - uMap); ${GLSL_TONE} }`,
    transparent: false,
  });
  const heads = [];
  const F = world.frame, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), up = new THREE.Vector3(), sc = new THREE.Vector3();
  for (const dbl of [false, true]) {
    const list = lamps.filter(l => !!l.double === dbl); if (!list.length) continue;
    const im = new THREE.InstancedMesh(lampGeometry(dbl), mat, list.length);
    list.forEach((l, i) => {
      F.surface(l.gx, l.gz, l.h + 0.15, p);
      // arm points across the road (towards -dir side's centre): yaw so local +z = across
      const yaw = Math.atan2(-l.tz, l.tx); // heading angle; local +z after yaw = right of travel
      const s = l.H / 10; sc.set(1, s, 1);
      q.setFromAxisAngle(up.set(0, 1, 0), yaw + (l.dir > 0 ? Math.PI : 0));
      m4.compose(p, q, sc); im.setMatrixAt(i, m4);
      // head positions (world-local) for glows
      const arms = dbl ? [-1, 1] : [1];
      for (const a of arms) { const hp = new THREE.Vector3(0, 9.7 * s, a * 1.75).applyQuaternion(q).add(p); heads.push(hp); }
    });
    im.frustumCulled = false; group.add(im);
  }
  return { group, heads };
}

// ---------------------------------------------------------------- glow points
// Static: positions fixed. Dynamic: call .set(i, x, y, z, intensity) each frame then .commit().
export function glowPoints(world, n, { color = [1, 0.64, 0.32], size = 1.6, halo = 7, minPx = 1.6, intensity = 1, night = true, dynamic = false, maxPx = 64, fade = [15000, 45000] } = {}) {
  const pos = new Float32Array(n * 3), inten = new Float32Array(n).fill(1), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set(color, i * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aI', new THREE.BufferAttribute(inten, 1)); g.setAttribute('aC', new THREE.BufferAttribute(col, 3));
  const mat = worldMaterial(world.U, {
    uniforms: { uFadeD: { value: new THREE.Vector2(...fade) }, uSize: { value: size }, uHalo: { value: halo }, uMinPx: { value: minPx }, uMaxPx: { value: maxPx }, uInt: { value: intensity }, uUseNight: { value: night ? 1 : 0 }, uPx: world.U.uPx },
    vertex: /* glsl */`
      attribute float aI; attribute vec3 aC; uniform float uSize, uHalo, uMinPx, uMaxPx, uPx;
      varying float vI, vCore; varying vec3 vC, vRel, vLocal;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin; vRel = wp.xyz; vLocal = local;
        vec4 mv = viewMatrix * wp; float d = -mv.z; float px = uHalo * uPx / max(d, .1);
        float core = uSize * uPx / max(d, .1);
        gl_PointSize = clamp(px, uMinPx * 3., uMaxPx); vCore = clamp(max(core, uMinPx) / gl_PointSize, .02, 1.);
        // brighter (energy-conserving) when the core is clamped up to the minimum size
        vI = aI * clamp(core / max(core, uMinPx), .25, 1.); vC = aC;
        gl_Position = projectionMatrix * mv; if (aI <= 0.) gl_Position = vec4(2., 2., 2., 1.); }`,
    fragment: /* glsl */`
      uniform float uInt, uUseNight; uniform vec2 uFadeD; varying float vI, vCore; varying vec3 vC, vRel, vLocal;
      void main() { float r = length(gl_PointCoord - .5) * 2.;
        float core = smoothstep(vCore, vCore * .35, r);
        float halo = exp(-r * r * 6.) * .08;
        float k = (core * 4. + halo) * vI * uInt * (uUseNight > .5 ? uNight : 1.) * (1. - uMap);
        float L = length(vRel); float od = uHazeDen * L * exp(-clamp(uCamAlt - uElev0, 0., 1e5) / uHazeH) * .6;
        k *= exp(-od) * exp(-uCloudFog * L) * (1. - uWhite) * (1. - smoothstep(uFadeD.x, uFadeD.y, L));
        if (k < .002) discard;
        gl_FragColor = vec4(vC * k, 1.); ${GLSL_TONE} }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 20;
  return {
    points: pts, n,
    set(i, x, y, z, I = 1) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; inten[i] = I; },
    color(i, c) { col.set(c, i * 3); },
    commit() { g.getAttribute('position').needsUpdate = true; g.getAttribute('aI').needsUpdate = true; g.getAttribute('aC').needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- tree impostors
let ATLAS = null;
function treeAtlas() {
  if (ATLAS) return ATLAS;
  const S = 256, c = document.createElement('canvas'); c.width = S * 4; c.height = S; const x = c.getContext('2d'); const r = rng(41);
  // a leaf cluster: dark core, lit upper-left rim (sun from above), ragged edge from small sub-blobs
  const cluster = (cx, cy, rad, shade) => {
    for (let k = 0; k < 7; k++) {
      const a = r() * 6.28, d = r() * rad * 0.55, px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d, rr = rad * (0.35 + r() * 0.35);
      const l = shade * (0.75 + 0.5 * (1 - (py - (cy - rad)) / (2 * rad)));
      const g = x.createRadialGradient(px - rr * 0.35, py - rr * 0.4, rr * 0.05, px, py, rr);
      g.addColorStop(0, `rgba(${Math.round(70 * l)},${Math.round(102 * l)},${Math.round(52 * l)},1)`);
      g.addColorStop(0.75, `rgba(${Math.round(34 * l)},${Math.round(52 * l)},${Math.round(28 * l)},1)`);
      g.addColorStop(1, 'rgba(20,30,16,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill();
    }
  };
  for (let v = 0; v < 4; v++) {
    const ox = v * S;
    // trunk and a few limbs
    x.strokeStyle = '#2b2119'; x.lineCap = 'round';
    x.lineWidth = v === 1 ? 6 : 9; x.beginPath(); x.moveTo(ox + S / 2, S); x.lineTo(ox + S / 2 + (r() - 0.5) * 6, S * (v === 1 ? 0.25 : 0.45)); x.stroke();
    if (v !== 1) { x.lineWidth = 4; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(ox + S / 2, S * (0.55 + r() * 0.15)); x.lineTo(ox + S / 2 + (r() - 0.5) * S * 0.45, S * (0.3 + r() * 0.2)); x.stroke(); } }
    if (v === 1) { // conifer: stacked tiers
      for (let i = 0; i < 26; i++) { const t = i / 26, w = (1 - t) * 0.42 * S + 8, cy = S * (0.92 - t * 0.86); for (let k = 0; k < 3; k++) cluster(ox + S / 2 + (r() - 0.5) * w, cy, 10 + (1 - t) * 14, 0.8 + t * 0.35); }
    } else if (v === 2) { // poplar
      for (let i = 0; i < 40; i++) { const t = r(); cluster(ox + S / 2 + (r() - 0.5) * S * 0.2, S * (0.1 + t * 0.66), 12 + r() * 9, 0.8 + (1 - t) * 0.4); }
    } else { // broadleaf crowns, irregular
      const k = v === 3 ? 0.72 : 1, cyc = S * (v === 3 ? 0.55 : 0.4);
      for (let i = 0; i < 55; i++) { const a = r() * 6.28, d = Math.pow(r(), 0.6) * S * 0.33 * k; const py = cyc + Math.sin(a) * d * 0.78; cluster(ox + S / 2 + Math.cos(a) * d, py, 13 + r() * 13, 0.85 + 0.35 * (1 - (py / S))); }
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
  ATLAS = t; return t;
}
// trees: [{ gx, gz, h, size, kind 0..3, tint }]
export function buildTrees(world, trees, { fadeFrom = 1500, fadeTo = 3200 } = {}) {
  const n = trees.length; const g = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1); quad.translate(0, 0.5, 0);
  g.index = quad.index; g.setAttribute('position', quad.getAttribute('position')); g.setAttribute('uv', quad.getAttribute('uv'));
  const aP = new Float32Array(n * 3), aS = new Float32Array(n * 4); const F = world.frame, v = new THREE.Vector3();
  trees.forEach((t, i) => { F.surface(t.gx, t.gz, t.h, v); aP.set([v.x, v.y, v.z], i * 3); aS.set([t.size, t.kind ?? 0, t.tint ?? 1, (i * 0.618) % 1], i * 4); });
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.instanceCount = n;
  const mat = worldMaterial(world.U, {
    uniforms: { uAtlas: { value: treeAtlas() }, uFade: { value: new THREE.Vector2(fadeFrom, fadeTo) } },
    vertex: /* glsl */`
      attribute vec3 aP; attribute vec4 aS; uniform vec2 uFade;
      varying vec2 vUv; varying vec3 vRel, vLocal; varying float vTint, vH;
      void main() {
        vec4 bw = modelMatrix * vec4(aP, 1.); vec3 local = bw.xyz + uOrigin;
        vec3 up = upAt(local); vec3 toCam = -bw.xyz; float d = length(toCam);
        vec3 right = normalize(cross(up, toCam / d));
        float k = 1. - smoothstep(uFade.x * (.8 + .4 * aS.w), uFade.y * (.8 + .4 * aS.w), d);
        float s = aS.x * k * (1. - uMap);
        vec3 p = bw.xyz + right * position.x * s * .8 + up * position.y * s;
        vUv = vec2((uv.x + aS.y) / 4., uv.y); vTint = aS.z; vH = position.y;
        vRel = p; vLocal = p + uOrigin;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); if (s < .01) gl_Position = vec4(2., 2., 2., 1.);
      }`,
    fragment: /* glsl */`
      uniform sampler2D uAtlas; varying vec2 vUv; varying vec3 vRel, vLocal; varying float vTint, vH;
      void main() { vec4 a = texture(uAtlas, vUv); if (a.a < .5) discard;
        vec3 alb = a.rgb * vTint;
        vec3 n = normalize(upAt(vLocal) * .6 - normalize(vRel) * .8);
        vec3 col = alb * lightDiffuse(n, vLocal) * (.6 + .5 * vH) + alb * headlights(vLocal, n);
        col += alb * vec3(1., .6, .28) * .35 * uNight * exp(-length(vLocal.xz - uCityPos.xz) / uCityR) * (1. - vH * .6);
        col = applyFog(col, vRel, vLocal);
        gl_FragColor = vec4(col, 1.); ${GLSL_TONE} }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'trees';
  return mesh;
}
