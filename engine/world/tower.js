// Hero tower: a glass curtain-wall building with interior-mapped offices (rooms with ceiling light
// panels, desks, side walls, parallax-correct from any angle), mullions, spandrels, a lit double-height
// lobby and a glass crown. Built for close camera work (crane up the facade); flattens to a map
// footprint with an annotation outline.
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE } from './core.js';

// plan: chamfered rectangle (w x d, chamfer c), rotated by `angle` (rad), at ground coords (gx, gz).
export function tower(world, { gx = 0, gz = 0, w = 40, d = 30, c = 5, h = 190, angle = 0, floorH = 4.1, bay = 1.55, lobby = 9, seed = 5, lit = 0.48, crown = 14, tint = [0.06, 0.09, 0.11] } = {}) {
  const F = world.frame, base = world.height(gx, gz), b0 = new THREE.Vector3(); F.surface(gx, gz, base, b0);
  const P = [[w / 2 - c, -d / 2], [w / 2, -d / 2 + c], [w / 2, d / 2 - c], [w / 2 - c, d / 2], [-w / 2 + c, d / 2], [-w / 2, d / 2 - c], [-w / 2, -d / 2 + c], [-w / 2 + c, -d / 2]];
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const rot = ([x, z]) => [x * ca - z * sa, x * sa + z * ca];
  const pos = [], nor = [], fac = [], tan = [], idx = [];
  let u = 0;
  const tiers = [[0, h, 1], [h, h + crown, 0.86]]; // main shaft, inset glass crown
  for (const [y0, y1, k] of tiers) {
    u = 0;
    for (let i = 0; i < P.length; i++) {
      const a = rot(P[i].map(v => v * k)), b = rot(P[(i + 1) % P.length].map(v => v * k));
      const ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez), tx = ex / L, tz = ez / L, nx = tz, nz = -tx; // outward for CW... fixed below
      const v0 = pos.length / 3;
      for (const [px, pz, uu] of [[a[0], a[1], u], [b[0], b[1], u + L]]) for (const yy of [y0, y1]) {
        pos.push(b0.x + px, b0.y + yy, b0.z + pz); nor.push(nx, 0, nz); fac.push(uu, yy, y1 > h ? 1 : 0); tan.push(tx, 0, tz);
      }
      idx.push(v0, v0 + 1, v0 + 2, v0 + 1, v0 + 3, v0 + 2);
      u += L;
    }
  }
  // roof caps
  for (const [yy, k] of [[h, 1], [h + crown, 0.86]]) {
    const v0 = pos.length / 3; pos.push(b0.x, b0.y + yy, b0.z); nor.push(0, 1, 0); fac.push(0, yy, 2); tan.push(1, 0, 0);
    for (const p of P) { const q = rot(p.map(v => v * k)); pos.push(b0.x + q[0], b0.y + yy, b0.z + q[1]); nor.push(0, 1, 0); fac.push(0, yy, 2); tan.push(1, 0, 0); }
    for (let i = 0; i < P.length; i++) idx.push(v0, v0 + 1 + (i + 1) % P.length, v0 + 1 + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aFac', new THREE.Float32BufferAttribute(fac, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3)); g.setIndex(idx);
  const mat = worldMaterial(world.U, {
    uniforms: { uFloorH: { value: floorH }, uBay: { value: bay }, uLobby: { value: lobby }, uSeed: { value: seed }, uLit: { value: lit }, uTint: { value: new THREE.Vector3(...tint) }, uH: { value: h }, uBaseY: { value: b0.y }, uOutline: { value: 0 } },
    vertex: /* glsl */`
      attribute vec3 aFac, aTan; uniform float uBaseY;
      varying vec3 vRel, vLocal, vN, vT, vFac;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin;
        local.y = mix(local.y, flatY(local) + .5 + (local.y - uBaseY) * .015, uFlat); wp.y = local.y - uOrigin.y;
        vRel = wp.xyz; vLocal = local; vN = normal; vT = aTan; vFac = aFac; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      uniform float uFloorH, uBay, uLobby, uSeed, uLit, uH, uOutline; uniform vec3 uTint;
      varying vec3 vRel, vLocal, vN, vT, vFac;
      void main() {
        vec3 n = normalize(vN); vec3 v = normalize(-vRel);
        vec3 col;
        if (vFac.z > 1.5) { // roof
          col = vec3(.03) * lightDiffuse(n, vLocal);
        } else {
          vec3 T = normalize(vT), B = vec3(0., 1., 0.);
          float u = vFac.x, y = vFac.y; bool crownTier = vFac.z > .5;
          float fres = .04 + .96 * pow(1. - max(dot(n, v), 0.), 5.);
          vec3 rf = reflect(-v, n);
          vec3 refl = skyEnv(normalize(rf + vec3(0., .015, 0.)));
          // city below reflected in the lower glass: warm haze when the reflected ray points down
          refl = mix(refl, uCityGlow * .35 + uHazeCol * .25, smoothstep(.0, -.25, rf.y));
          refl += uSunCol * pow(max(dot(rf, uSunDir), 0.), 300.) * 4.;
          // ---- interior mapping: rooms 4 bays wide, one floor high, 7 m deep
          float roomW = uBay * 4., roomD = 7.;
          float yy = y - uLobby;
          vec3 vd = -v; vec3 dt = vec3(dot(vd, T), dot(vd, B), dot(vd, -n));
          vec2 cell = vec2(u / roomW, yy / uFloorH); vec2 id = floor(cell); vec2 f = cell - id;
          vec3 p = vec3(f, 0.); vec3 dd = dt / vec3(roomW, uFloorH, roomD);
          vec3 tt = vec3((step(0., dd.x) - p.x) / dd.x, (step(0., dd.y) - p.y) / dd.y, 1. / max(dd.z, 1e-4));
          float t = min(tt.x, min(tt.y, tt.z)); vec3 hp = p + dd * t;
          float hsh = hash2u(int(id.x) + int(uSeed) * 131, int(id.y), 31);
          float on = step(hsh, uLit) * uNight;
          vec3 lightC = mix(vec3(1., .86, .66), vec3(.9, .96, 1.), step(.7, hash2u(int(uSeed), int(id.y), 32)));
          vec3 room;
          if (t == tt.y && dd.y > 0.) { // ceiling with light panels (2 x 3 grid)
            vec2 q = fract(vec2(hp.x * 2., hp.z * 3.)); float panel = step(.3, q.x) * step(q.x, .7) * step(.35, q.y) * step(q.y, .65);
            room = vec3(.02) + lightC * (panel * 5. + .06) * on;
          } else if (t == tt.y) { // floor: carpet, lit from above
            room = vec3(.03, .026, .022) * (.3 + 1.6 * on);
          } else if (t == tt.z) { // back wall: desks band, screens
            float desk = step(.18, hp.y) * step(hp.y, .26);
            float screen = step(.27, hp.y) * step(hp.y, .37) * step(.5, fract(hp.x * 5.)) * step(fract(hp.x * 5.), .82);
            room = vec3(.07, .068, .065) * (.15 + 1.3 * on) * (1. - desk * .7) + vec3(.4, .55, .7) * screen * .6 * on;
          } else { room = vec3(.05, .05, .048) * (.15 + 1.3 * on); }
          room *= .85 + .3 * hash2u(int(id.x), int(id.y) + 7, 33);
          // ---- glass, mullions, spandrels
          // box-filtered mullions and spandrels: they thin to their average coverage at distance
          float fu = fwidth(u / uBay), mw = .05 / uBay;
          float mul = abs(fract(u / uBay + .5) - .5);
          float mull = mix(1. - smoothstep(mw * .5, mw * .5 + fu, mul), mw, smoothstep(.15, .4, fu));
          float slab = fract(yy / uFloorH); float sfw = fwidth(yy / uFloorH);
          float spandrel = mix(smoothstep(.8 - sfw, .8 + sfw, slab), .2, smoothstep(.12, .35, sfw));
          spandrel = clamp(spandrel, 0., 1.) * step(uLobby, y);
          vec3 glass = room * mix(vec3(1.), uTint * 9., .45) * .7 * (1. - fres) + refl * mix(.3, 1., fres);
          // lobby: double height, warm, brighter
          if (y < uLobby) { glass = vec3(1., .74, .48) * .3 * (.4 + .6 * uNight) * (1. - fres) * (.7 + .3 * step(.5, fract(u / 6.))) + refl * fres + vec3(.01); spandrel = 0.; }
          if (crownTier) { glass = refl * mix(.3, 1., fres) + vec3(.85, .9, 1.) * .22 * uNight * smoothstep(.4, 1., fract(u / uBay)) * smoothstep(0., 6., y - uH); }
          vec3 alum = vec3(.03, .033, .036) * lightDiffuse(n, vLocal) + refl * .12;
          col = mix(glass, alum, max(mull, spandrel * .92));
          col += headlights(vLocal, n) * .02;
        }
        col = applyFog(col, vRel, vLocal);
        if (uMap > .001) {
          vec3 m = uMapBldg * 1.3;
          col = mix(col, m, uMap);
        }
        gl_FragColor = vec4(col, 1.);
        ${GLSL_TONE}
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'tower';
  const top = new THREE.Vector3(); F.surface(gx, gz, base + h + crown, top);
  return { mesh, mat, base: b0, top, h, w, d, gx, gz, angle, plan: P.map(rot), facePoint(i, along, y, out = 0) { // point on face i at fraction `along`, height y, offset out (m)
    const a = rot(P[i]), b = rot(P[(i + 1) % P.length]); const px = a[0] + (b[0] - a[0]) * along, pz = a[1] + (b[1] - a[1]) * along;
    const ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez); let nx = ez / L, nz = -ex / L; if (nx * px + nz * pz < 0) { nx = -nx; nz = -nz; }
    return new THREE.Vector3(b0.x + px + nx * out, b0.y + y, b0.z + pz + nz * out);
  } };
}
