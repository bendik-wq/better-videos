// Terrain: one radial mesh around the anchor (rings spaced geometrically, ~2-3 % of the radius),
// placed on the sphere, heights from the place DEM (or procedural fbm), modified by roads, cities
// and lakes. The shader blends satellite imagery (far / high) with procedural detail (near):
// section-line fields, centre-pivot circles, forests on slopes, snow, suburb street-light dots at
// night that average out to the Black Marble glow from altitude. Same mesh flattens to the map.
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE, sstep } from './core.js';

export function terrainMaterial(world, { polygonOffset = 0 } = {}) {
  const P = world.place;
  return worldMaterial(world.U, {
    uniforms: {
      uImg: { value: P?.image ?? null }, uNightTex: { value: P?.night ?? null }, uEDay: { value: world.earth?.day ?? null }, uENight: { value: world.earth?.night ?? null }, uEClouds: { value: world.earth?.clouds ?? null }, uEarthOn: { value: world.earth ? 1 : 0 }, uMapTex: { value: P?.map ?? null }, uImgOn: { value: P ? 1 : 0 },
      uBase: { value: new THREE.Color(world.opts.ground ?? 0x6b6450) }, uDetail: { value: world.opts.detail ?? 1 },
      uUrban: { value: new THREE.Vector4(...(world.opts.urban ?? [0, 0, 0, 0])) }, // city centre xz, radius, strength (ground tint)
    },
    vertex: /* glsl */`
      attribute vec2 aGround; attribute vec2 aImgUv; attribute vec2 aGeoUv;
      varying vec3 vRel, vLocal, vN; varying vec2 vG, vUv, vGeo;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.);
        vec3 local = wp.xyz + uOrigin;
        float fy = flatY(local);
        local.y = mix(local.y, fy, uFlat); wp.y = local.y - uOrigin.y;
        vLocal = local; vRel = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vG = aGround; vUv = aImgUv; vGeo = aGeoUv;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragment: /* glsl */`
      uniform sampler2D uImg, uNightTex, uMapTex, uEDay, uENight, uEClouds; uniform float uImgOn, uDetail, uEarthOn; uniform vec3 uBase; uniform vec4 uUrban;
      varying vec3 vRel, vLocal, vN; varying vec2 vG, vUv, vGeo;
      float aaLine(float x, float w, float fw) { return 1. - smoothstep(w * .5, w * .5 + fw * 1.2, abs(x)) ; }
      void main() {
        float dist = length(vRel);
        vec3 n = normalize(vN); vec3 up = upAt(vLocal);
        float slope = 1. - dot(n, up);
        vec3 img = uImgOn > .5 ? texture(uImg, vUv).rgb : uBase;
        float nl = uImgOn > .5 ? texture(uNightTex, vUv).r : 0.;
        // outside the regional tile: the global textures (same sources, coarser), blended over the tile's edge
        if (uEarthOn > .5) {
          vec2 e2 = min(vUv, 1. - vUv); float inTile = uImgOn > .5 ? smoothstep(0., .06, min(e2.x, e2.y)) : 0.;
          if (inTile < .999) { img = mix(texture(uEDay, vGeo).rgb, img, inTile); nl = mix(texture(uENight, vGeo).r, nl, inTile); }
        }
        float near = (1. - smoothstep(2500., 30000., dist)) * uDetail;
        // ---- procedural detail, as a multiplier around 1 so imagery colour is preserved at distance
        vec2 g = vG; vec2 fwg = fwidth(g);
        float urb = smoothstep(.12, .45, nl);
        float uc = uUrban.w * (1. - smoothstep(uUrban.z * .8, uUrban.z * 1.3, length(g - uUrban.xy)));
        vec3 det = vec3(1.);
        if (near > .002) {
          vec2 sec = g / 804.67; vec2 cs = floor(sec); vec2 fs = sec - cs;
          float h1 = hash2u(int(cs.x), int(cs.y), 11), h2 = hash2u(int(cs.x), int(cs.y), 12);
          vec3 field = mix(vec3(.82, .8, .72), vec3(1.25, 1.12, .9), h1);
          field = mix(field, vec3(.78, .92, .7), step(.72, h2) * .8);
          // centre-pivot circles (irrigated, darker and greener)
          float piv = step(.55, h2) * step(h1, .7);
          float pr = length(fs - .5) * 804.67;
          float circ = piv * (1. - smoothstep(370., 385., pr));
          field = mix(field, vec3(.62, .78, .52), circ);
          // section-line roads and field edges
          float lines = max(aaLine(fs.x, 9. / 804.67, fwg.x / 804.67), aaLine(fs.y, 9. / 804.67, fwg.y / 804.67));
          float tex1 = tnoise(g / 2200.), tex2 = tnoise(g / 310. + .37), tex3 = tnoise(g / 47.);
          det = field * (.82 + .3 * tex2) * (.9 + .2 * tex3);
          det = mix(det, vec3(1.15, 1.1, 1.0), lines * .6);
          // forest on slopes / rough noise
          float forest = smoothstep(.55, .7, tex1 + slope * 1.5) * (1. - urb);
          det = mix(det, vec3(.45, .55, .42) * (.8 + .4 * tex3), forest * .85);
          det = mix(det, vec3(.75 + .2 * tex3), urb * .8); // built-up ground: grey
          // urban core tint (the procedural city sits here)
          det = mix(det, vec3(.55), uc);
        }
        vec3 alb = img * mix(vec3(1.), det, near * (1. - smoothstep(.35, .6, slope) * .5));
        alb = mix(alb, vec3(.92, .94, 1.) * .9, smoothstep(.75, .9, dot(img, vec3(.33))) * near * .5); // keep snow clean
        // close to the camera: real ground (ambientCG Grass004 / Poly Haven dirt), dry and patchy, normal-mapped
        float nk = (1. - smoothstep(120., 900., dist)) * (1. - uMap);
        if (nk > .001) {
          vec2 tp = vG;
          vec4 Gr = pbrA(L_GRASS, tp / 2.), Di = pbrA(L_DIRT, tp / 2.5);
          float dry = smoothstep(.35, .75, texture(uNoise, tp / 37.).r * .8 + texture(uNoise, tp / 5.).b * .2 + slope * 2.);
          vec3 tex = mix(Gr.rgb * vec3(1.05, .92, .62), Di.rgb * .8, dry);
          alb = mix(alb, tex * (.45 + .5 * luma(alb) / .2) * .7, nk * .75);
          n = perturb(n, vec3(1., 0., 0.), vec3(0., 0., 1.), mix(pbrN(L_GRASS, tp / 2.), pbrN(L_DIRT, tp / 2.5), dry), nk * .8);
        }
        vec3 col = alb * lightDiffuse(n, vLocal) + alb * headlights(vLocal, n) * .35;
        // ---- night: suburb street lights on a street grid (160 m blocks, a lamp every 42 m), dense where
        // Black Marble is bright; they average out to the Black Marble glow from altitude.
        float dens = clamp(nl * 1.7 - .12, 0., 1.) * (1. - uc);
        float lit = 0., px = 0.;
        px = length(fwg);
        if (px > 24.) lit = dens * .009 * smoothstep(250., 900., dist);  // fully averaged: skip the grid
        else if (dens > .001 && uNight > .01 && dist > 250.) {
          // each 1-mile section is its own subdivision: block size, lamp spacing, grid offset and
          // whether it is built at all vary, so the grid never reads as one regular lattice
          vec2 sc = floor(g / 804.67); float hb = hash2u(int(sc.x), int(sc.y), 41), hc = hash2u(int(sc.x), int(sc.y), 42);
          float blk = mix(120., 210., hb), lsp = mix(34., 52., hc);
          vec2 o2 = vec2(hash2u(int(sc.x), int(sc.y), 43), hash2u(int(sc.x), int(sc.y), 44)) * blk;
          float built = step(.18, hash2u(int(sc.x), int(sc.y), 45)) * smoothstep(.25, .6, tnoise(g / 5200.) + dens * .6);
          vec2 gg = g + o2;
          vec2 q = gg / vec2(blk, lsp); vec2 cq = floor(q + .5); vec2 dq = (q - cq) * vec2(blk, lsp);       // N-S streets
          vec2 r2 = gg / vec2(lsp, blk); vec2 cr = floor(r2 + .5); vec2 dr = (r2 - cr) * vec2(lsp, blk);    // E-W streets
          float on1 = built * step(hash2u(int(cq.x), int(cq.y), 21), dens * 1.15), on2 = built * step(hash2u(int(cr.x), int(cr.y), 22), dens * 1.15);
          px = length(fwg);                                            // metres per pixel
          float rc = max(.9, px * .9);                                 // the core never gets thinner than ~1 px
          float c1 = on1 * (smoothstep(rc, 0., length(dq)) * 5. * (.9 / rc) * (.9 / rc) + exp(-dot(dq, dq) / 60.) * .25);
          float c2 = on2 * (smoothstep(rc, 0., length(dr)) * 5. * (.9 / rc) * (.9 / rc) + exp(-dot(dr, dr) / 60.) * .25);
          dens *= built;
          float avg = dens * .0045 * 2.;
          lit = mix(c1 + c2, avg, smoothstep(6., 24., px)) * smoothstep(250., 900., dist);
        }
        float glow = nl * nl * nl * .3;
        vec3 sodium = vec3(1., .62, .3);
        col += sodium * (lit * .9 + glow * mix(.03, 1., uLightsFar)) * uNight;
        // from orbit the patch is shaded exactly like the globe around it
        float orbit = uEarthOn > .5 ? smoothstep(60000., 250000., uCamAlt - uElev0) : 0.;
        if (orbit > 0.) col = mix(col, globeShade(img, nl, texture(uEClouds, vGeo).r, 1., n, vRel), orbit);
        col = applyFog(col, vRel, vLocal);
        // ---- map
        if (uMap > .001) {
          vec3 mk = uImgOn > .5 ? texture(uMapTex, vUv).rgb : vec3(1., 0., 0.);
          // land: the satellite image desaturated into the map palette + a hillshade, so the regional map
          // keeps its texture (plains, the Front Range) instead of going flat and dark between city and globe
          float shade = .7 + .6 * clamp(dot(n, normalize(vec3(-.5, .8, -.3))), 0., 1.);
          vec3 landC = (uMapLand * 1.4 + vec3(luma(img)) * .09) * shade;
          vec3 mcol = mix(uMapWater, landC, mk.r);
          float fwm = length(fwidth(vUv)) * 1024.;  // map texels per pixel: lines stay ~1 px, fade when sub-pixel
          mcol = mix(mcol, uMapInk * .45, mk.g * .8);
          mcol = mix(mcol, uMapInk * .85, clamp(mk.b * 1.6, 0., 1.) * .9);
          mcol += vec3(.012) * uc;
          col = mix(col, mcol, uMap);
        }
        gl_FragColor = vec4(col, 1.);
        ${GLSL_TONE}
      }`,
    polygonOffset: polygonOffset !== 0, polygonOffsetFactor: polygonOffset, polygonOffsetUnits: polygonOffset * 2,
  });
}

// Radial terrain mesh. world.height(gx, gz) gives metres above the anchor's elevation.
export function buildTerrain(world, { rMax = 450000, r0 = 12, k = 1.03, segs = 512 } = {}) {
  const F = world.frame, P = world.place;
  const rings = [0]; for (let r = r0; r < rMax; r *= k) rings.push(r); rings.push(rMax);
  const nR = rings.length, nV = 1 + (nR - 1) * segs;
  const pos = new Float32Array(nV * 3), gr = new Float32Array(nV * 2), uv = new Float32Array(nV * 2), geoUv = new Float32Array(nV * 2);
  const v = new THREE.Vector3();
  const bb = P?.bbox;
  const put = (i, gx, gz, r) => {
    let h = world.height(gx, gz);
    // fade the relief to the globe's surface at the edge of the patch
    const edge = sstep(rMax * 0.72, rMax * 0.98, r); h = h * (1 - edge) + world.globeH * edge;
    F.surface(gx, gz, h, v); pos.set([v.x, v.y, v.z], i * 3); gr.set([gx, gz], i * 2);
    const [la, lo] = F.geoOf(gx, gz); geoUv.set([(lo + 180) / 360, (la + 90) / 180], i * 2);
    if (bb) uv.set([(lo - bb[0]) / (bb[2] - bb[0]), (la - bb[1]) / (bb[3] - bb[1])], i * 2);
  };
  put(0, 0, 0, 0);
  for (let j = 1; j < nR; j++) for (let s = 0; s < segs; s++) {
    const a = (s + (j % 2) * 0.5) / segs * Math.PI * 2, r = rings[j];
    put(1 + (j - 1) * segs + s, Math.cos(a) * r, Math.sin(a) * r, r);
  }
  const idx = [];
  for (let s = 0; s < segs; s++) idx.push(0, 1 + (s + 1) % segs, 1 + s);
  for (let j = 1; j < nR - 1; j++) {
    const a0 = 1 + (j - 1) * segs, a1 = 1 + j * segs, odd = j % 2;
    for (let s = 0; s < segs; s++) {
      const s1 = (s + 1) % segs;
      const i00 = a0 + s, i01 = a0 + s1, i10 = a1 + s, i11 = a1 + s1;
      // the outer ring is rotated half a segment on odd rings: split the quad along the short diagonal
      if (odd) { idx.push(i00, i11, i10, i00, i01, i11); } else { idx.push(i00, i01, i10, i01, i11, i10); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aGround', new THREE.BufferAttribute(gr, 2));
  geo.setAttribute('aImgUv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('aGeoUv', new THREE.BufferAttribute(geoUv, 2));
  geo.setIndex(nV > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, terrainMaterial(world));
  mesh.frustumCulled = false; mesh.name = 'terrain';
  return mesh;
}
