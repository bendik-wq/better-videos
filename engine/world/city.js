// Procedural city, deterministic by seed: a jittered street grid clipped by a noisy radius,
// avenues every n lines, blocks with sidewalks, parcels, buildings (instanced boxes whose shader
// draws floors, bays, storefronts, lit offices, crowns, roofs; antialiased to an average so wide
// aerials never shimmer), setback towers downtown, rooftop plant, parks, parking, street trees,
// lamp posts. One draw call per family. The same buildings flatten into map footprints.
import * as THREE from 'three';
import { worldMaterial, GLSL_TONE, rng, fbm, sstep, clamp, lerp } from './core.js';
import { road } from './roads.js';

// ---------------------------------------------------------------- building material
// Facade families (aMat.x): 0 brick, 1 stone, 2 concrete (all with punched windows set into a
// recess: parallax-correct reveals, lintel shadows from the sun), 3/4 photo facades aligned to the
// building's floors (ambientCG Facade018A/020A), 5 ribbon-window office (Facade006), 6 photo curtain
// wall (Facade001), 7 procedural curtain wall (mullions, spandrels), 8 metal-clad low-rise.
// Glass reflects the sky/HDRI with Fresnel; lit rooms are interior-mapped (ceiling panels, back wall,
// floor) so windows have depth from any angle; grime streaks under ledges; storefronts with fascia
// signs that glow at night. Antialiased: patterns fade to their average when sub-pixel.
export const FACADE = { brick: 0, stone: 1, concrete: 2, brickwin: 3, piers: 4, ribbon: 5, curtain: 6, glass: 7, metal: 8 };
export function buildingMaterial(world) {
  return world._bldgMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`
      attribute vec3 aSize; attribute vec4 aStyle, aSeed, aMat; attribute vec3 aCol;
      varying vec3 vRel, vLocal, vN, vON, vPm, vT; flat varying vec3 fSize, fCol; flat varying vec4 fStyle, fSeed, fMat;
      void main() {
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin;
        float base = aSeed.z;
        float fy = flatY(local);
        local.y = mix(local.y, fy + .4 + (local.y - base) * .015, uFlat); wp.y = local.y - uOrigin.y;
        mat3 m3 = mat3(modelMatrix) * mat3(instanceMatrix);
        vRel = wp.xyz; vLocal = local; vN = normalize(m3 * normal); vON = normal;
        vT = normalize(m3 * (abs(normal.x) > .5 ? vec3(0., 0., 1.) : vec3(1., 0., 0.)));
        vPm = position * aSize; fSize = aSize; fStyle = aStyle; fSeed = aSeed; fCol = aCol; fMat = aMat;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragment: /* glsl */`
      varying vec3 vRel, vLocal, vN, vON, vPm, vT; flat varying vec3 fSize, fCol; flat varying vec4 fStyle, fSeed, fMat;
      // interior-mapped room behind a window: f = position in the window cell (0..1), rd = view ray in
      // (along, up, into) metres; lit 0..1. Rooms: one bay wide, one floor high, 6 m deep.
      vec3 room(vec2 f, vec3 rd, vec2 cellM, float lit, float hs, vec3 lightC) {
        vec3 p = vec3(f, 0.); vec3 dd = rd / vec3(cellM, 6.);
        vec3 tt = vec3((step(0., dd.x) - p.x) / dd.x, (step(0., dd.y) - p.y) / dd.y, 1. / max(dd.z, 1e-4));
        float t = min(tt.x, min(tt.y, tt.z)); vec3 hp = p + dd * t;
        vec3 c;
        if (t == tt.y && dd.y > 0.) { vec2 q = fract(vec2(hp.x * 2., hp.z * 3.)); float panel = step(.3, q.x) * step(q.x, .7) * step(.35, q.y) * step(q.y, .65); c = vec3(.03) + lightC * (panel * 4. + .08) * lit; }
        else if (t == tt.y) c = vec3(.035, .03, .025) * (.25 + 1.8 * lit);
        else if (t == tt.z) { float desk = step(.2, hp.y) * step(hp.y, .28); float scr = step(.29, hp.y) * step(hp.y, .38) * step(.5, fract(hp.x * 3. + hs)) * step(fract(hp.x * 3. + hs), .8);
          c = mix(vec3(.08, .075, .07), vec3(.12, .1, .08), hs) * (.15 + 1.4 * lit) * (1. - desk * .6) + vec3(.4, .55, .7) * scr * .5 * lit; }
        else c = vec3(.06, .058, .055) * (.15 + 1.3 * lit);
        return c;
      }
      void main() {
        // Written branch-light on purpose: llvmpipe runs divergent branches with masks (both sides), so
        // every family shares ONE material fetch, ONE interior-mapped room and ONE shadow lookup.
        vec3 n = normalize(vN); vec3 on = vON; vec3 T = normalize(vT), B = vec3(0., 1., 0.);
        vec3 v = normalize(-vRel); float dist = length(vRel);
        float floorH = fStyle.x, bayW = fStyle.y, winR = fStyle.z, glassK = fStyle.w;
        int seed = int(fSeed.x); float dens = fSeed.y, gf = fSeed.w;
        float type = fMat.x; vec3 sod = vec3(1., .6, .28);
        float roof = step(.5, on.y), plant = step(floorH, 0.), wallF = (1. - roof) * (1. - plant);
        float photo = step(2.5, type) * step(type, 7.5), proc = step(6.5, type) * step(type, 7.5);
        float y = vPm.y;
        float u = (abs(on.x) > .5 ? vPm.z + fSize.z * .5 : vPm.x + fSize.x * .5);
        float face = abs(on.x) > .5 ? (on.x > 0. ? 1. : 2.) : (on.z > 0. ? 3. : 4.);
        vec3 rd = vec3(dot(-v, T), dot(-v, B), dot(-v, -n));
        float tone = hash2u(seed, 1, 9);
        vec3 lightC = tone < .55 ? vec3(1., .8, .56) : tone < .9 ? vec3(.86, .93, 1.) : vec3(.75, 1., .85);
        // ---- window cells (punched families) and photo-facade tiles
        vec2 cell = vec2(u / bayW, (y - gf) / floorH);
        vec2 id = floor(cell), f = cell - id;
        vec2 fw = fwidth(cell);
        float aa = smoothstep(.25, .7, max(fw.x, fw.y));
        vec2 grid = type < 4.5 ? vec2(6.) : type < 5.5 ? vec2(14., 8.) : vec2(16., 10.);
        vec2 tile = grid * vec2(bayW, floorH);
        vec2 puv = vec2(u, y - gf) / tile + vec2(hash2u(seed, 4, 4), 0.);
        // ---- the one material fetch
        float Lw = type < .5 ? L_BRICK : type < 1.5 ? L_STONE : type < 2.5 ? L_CONCRETE : type < 3.5 ? L_BRICKWIN : type < 4.5 ? L_PIERS : type < 5.5 ? L_RIBBON : type < 6.5 ? L_CURTAIN : type < 7.5 ? L_CURTAIN : L_METAL;
        float ts = type < 1.5 ? 3. : type < 2.5 ? 2.71 : 2.;
        float L = roof > .5 ? L_GRAVEL : plant > .5 ? L_METAL : Lw;
        vec2 uvT = roof > .5 ? vPm.xz / 2. : plant > .5 ? vec2(u, y) / 2. : photo > .5 ? puv : vec2(u, y) / ts;
        vec4 A = pbrA(L, uvT), N = pbrN(L, uvT);
        // ---- punched windows set into a recess: parallax-correct reveals, sun through the opening
        float mx = (1. - winR) * .5, recess = fMat.w;
        vec2 lo = vec2(mx, .22), hi = vec2(1. - mx, .86);
        vec2 cellM = vec2(bayW, floorH);
        vec2 g = f + rd.xy / max(rd.z, .08) * recess / cellM;
        float inOpen = step(lo.x, f.x) * step(f.x, hi.x) * step(lo.y, f.y) * step(f.y, hi.y);
        float onGlass = step(lo.x, g.x) * step(g.x, hi.x) * step(lo.y, g.y) * step(g.y, hi.y);
        vec3 sd = vec3(dot(uSunDir, T), dot(uSunDir, B), dot(uSunDir, n));
        vec2 gs = g - sd.xy / max(sd.z, .05) * recess / cellM;
        float sunIn = step(lo.x, gs.x) * step(gs.x, hi.x) * step(lo.y, gs.y) * step(gs.y, hi.y);
        float above = step(gf, y) * step(y, fSize.y - 1.4) * wallF;
        float win = mix(inOpen, (hi.x - lo.x) * (hi.y - lo.y), aa) * above;
        float glassP = win * mix(onGlass, 1., aa);
        float reveal = win * (1. - mix(onGlass, 1., aa)) * (1. - photo);
        // ---- photo / procedural curtain glass mask
        float gm = 1. - smoothstep(.06, .14, N.b);
        float fu = fwidth(u / bayW), mw = .06 / bayW;
        float mull = mix(1. - smoothstep(mw * .5, mw * .5 + fu, abs(fract(u / bayW + .5) - .5)), mw, smoothstep(.15, .4, fu));
        float span = mix(smoothstep(.8 - fw.y, .8 + fw.y, f.y), .2, smoothstep(.12, .35, fw.y));
        gm = mix(gm, 1. - max(mull, span * .95), proc);
        float glass = mix(glassP, gm * above, photo);
        // ---- albedo, roughness, normal
        vec3 alb = mix(A.rgb * fCol * 1.6, A.rgb * mix(vec3(1.), fCol * 2.2, .35), photo);
        alb = mix(alb, vec3(.1, .11, .12), proc);
        float rough = mix(max(N.b, .75), mix(N.b, .55, 1. - gm), photo);
        float sill = (1. - step(.03, abs(f.y - lo.y + .02))) * step(lo.x - .03, f.x) * step(f.x, hi.x + .03) * (1. - aa) * step(type, 1.5) * above;
        alb = mix(alb, vec3(.42, .4, .36) * fCol.r * 2., sill * .8);
        float gr = grime(vec2(u, 0.), y, fSize.y) + .6 * (1. - smoothstep(0., 1.6, lo.y - f.y)) * step(f.y, lo.y) * step(lo.x, f.x) * step(f.x, hi.x) * (1. - aa) * (1. - photo);
        alb *= 1. - .42 * clamp(gr, 0., 1.) * wallF;
        alb *= mix(1., .45, reveal);
        // roof: gravel ballast, parapet ring
        float e = min(fSize.x * .5 - abs(vPm.x), fSize.z * .5 - abs(vPm.z));
        float par = 1. - smoothstep(.5, .9, e);
        vec3 roofA = mix(A.rgb * mix(.45, .8, hash2u(seed, 3, 3)), fCol * .9, par) * (.85 + .3 * texture(uNoise, vPm.xz / 9.).g);
        alb = mix(alb, roofA, roof); rough = mix(rough, .95, roof);
        alb = mix(alb, A.rgb * fCol * 2.2, plant); rough = mix(rough, .5, plant);
        float metal = mix(0., .3, plant) + (1. - gm) * step(5.5, type) * .6 * photo * wallF;
        vec3 Tn = roof > .5 ? vec3(1., 0., 0.) : T, Bn = roof > .5 ? vec3(0., 0., 1.) : B;
        vec3 wallN = perturb(n, Tn, Bn, N, mix(mix(.6, .6 * (1. - gm), photo), .6, roof) * (1. - proc));
        // ---- storefront band: glass in 6 m bays, mullions, a fascia sign that glows at night
        float shop = step(y, gf) * step(.5, y) * step(.5, gf) * wallF;
        float bayS = fract(u / 6.), fu6 = fwidth(u / 6.); int bi = int(floor(u / 6.));
        float frameS = max(1. - smoothstep(.0, fu6 * 1.5 + .01, abs(bayS - .5) - .46), step(gf - 1.25, y));
        float open = step(hash2u(seed + int(face), bi, 4), .7);
        float fascia = step(gf - 1.15, y) * step(y, gf - .35) * step(.12, bayS) * step(bayS, .88) * step(hash2u(seed + int(face), bi, 11), .55);
        float hsg = hash2u(seed + int(face), bi, 12);
        vec3 signC = hsg < .45 ? vec3(1., .85, .6) : hsg < .65 ? vec3(1., .3, .2) : hsg < .85 ? vec3(.6, .8, 1.) : vec3(.9, 1., .85);
        float shopMask = shop * (1. - frameS);
        // ---- the one interior-mapped room (window, photo-facade window or shop)
        vec2 gid = floor(puv * grid);
        float litW = clamp(step(hash2u(seed, int(id.y), 3), dens * 1.3) * step(hash2u(seed + int(face) * 7919 + int(id.x) * 31, int(id.y), 5), .85) + step(hash2u(seed + int(face) * 7919 + int(id.x) * 31, int(id.y), 5), dens * .35), 0., 1.);
        float litP = clamp(step(hash2u(seed, int(gid.y), 3), dens * 1.3) * step(hash2u(seed + int(gid.x) * 31 + int(face) * 7919, int(gid.y), 5), .85) + step(hash2u(seed + int(gid.x), int(gid.y), 6), dens * .3), 0., 1.);
        vec2 rf0 = shop > .5 ? vec2(bayS, y / max(gf, 1.)) : photo > .5 ? fract(puv * grid) : fract(g);
        vec2 rc = shop > .5 ? vec2(6., gf) : photo > .5 ? tile / grid : cellM;
        float rl = shop > .5 ? open * .7 : mix(litW, litP, photo) * uNight;
        float rh = shop > .5 ? hsg : hash2u(seed + int(photo > .5 ? gid.x : id.x) * 7, int(photo > .5 ? gid.y : id.y), 33);
        vec3 inner = room(rf0, rd, rc, rl, rh, shop > .5 ? vec3(1., .82, .6) : lightC) * (shop > .5 ? 1.6 : 1.);
        float cur = hash2u(seed + int(id.x) * 3, int(id.y), 8);
        inner = mix(inner, inner * mix(1., .3, step(.75, cur)) * (cur < .2 ? 1. - .7 * step(.55, fract(g.y)) : 1.), (1. - photo) * (1. - shop));
        // ---- glass: reflection + interior, over the wall
        float sv = sunVis(vLocal, n);
        float nvG = max(dot(n, v), 1e-3);
        vec3 rf = reflect(-v, n);
        vec3 env = skyEnv(normalize(rf + vec3(0., .02, 0.)));
        env = mix(env, uCityGlow * .35 + uHazeCol * .3, smoothstep(.0, -.3, rf.y));
        if (uEnvW > .001) env = mix(env, envHdri(rf, .05), uEnvW * .7);
        vec3 Fg = fresnelR(nvG, vec3(.04), .05);
        float gAll = clamp(glass * mix(1., .35 + .65 * sunIn, step(.01, sd.z) * (1. - aa) * (1. - photo)) + shopMask, 0., 1.);
        vec3 glassC = inner * (1. - Fg) * (1. - glassK * .35) + env * Fg * mix(1., 1.3, glassK) + (uSunCol.r > 0. ? ggxSun(n, v, .03, vec3(.04)) * sv : vec3(0.));
        vec3 avgIn = lightC * .25 * clamp(dens * .9, 0., 1.) * uNight + vec3(.02);
        glassC = mix(glassC, avgIn * (1. - Fg) + env * Fg, aa * .7);
        float glyph = .55 + .45 * smoothstep(.3, .7, texture(uNoise, vec2(u * .9, y * 1.7)).g);
        vec3 emit = glassC * gAll + signC * .9 * uNight * fascia * shop * glyph * (1. - aa);
        alb *= 1. - gAll;
        alb = mix(alb, vec3(.03), shop * frameS);
        vec3 nn = normalize(mix(wallN, n, gAll));
        if (fSize.y > 70. && hash2u(seed, 2, 2) < .45) emit += vec3(1., .92, .8) * 1.8 * uNight * smoothstep(fSize.y - 3.5, fSize.y - 2.5, y) * (1. - smoothstep(fSize.y - 1.2, fSize.y - .8, y)) * wallF;
        alb *= mix(1., mix(.55, 1., smoothstep(0., 1.8, y)), wallF);   // ground-contact darkening
        float nv = max(dot(nn, v), 1e-3);
        vec3 col = alb * lightDiffuseV(nn, vLocal, sv) + alb * headlights(vLocal, nn) + emit;
        vec3 F0 = mix(vec3(.04), alb, metal);
        vec3 F = fresnelR(nv, F0, rough);
        col += ((uSunCol.r > 0. ? ggxSun(nn, v, rough, F0) * sv : vec3(0.)) + env * F * (1. - rough) * .5) * (1. - gAll);
        // LOD: beyond ~12 km a building is a few pixels; from ~25 km the city blends to a flat urban tone
        float far = smoothstep(12000., 30000., dist);
        col = mix(col, vec3(.07, .07, .075) * (uAmbSky * .6 + uSunCol * max(uSunDir.y, 0.)) + vec3(1., .7, .45) * .05 * uNight, far);
        // sodium bounce at street level
        col += alb * sod * .25 * uNight * exp(-max(vPm.y, 0.) / 6.) * (1. - on.y);
        col = applyFog(col, vRel, vLocal);
        if (uMap > .001) {
          vec3 m = uMapBldg * (on.y > .5 ? 1. : .7);
          if (on.y > .5) { float e = min(fSize.x * .5 - abs(vPm.x), fSize.z * .5 - abs(vPm.z)); float fw = fwidth(e); m = mix(uMapInk * .3, m, mix(smoothstep(.8, .8 + fw, e), .85, smoothstep(.5, 1.5, fw))); }
          col = mix(col, m, uMap);
        }
        gl_FragColor = vec4(col, 1.);
        ${GLSL_TONE}
      }`,
  });
}

// ---------------------------------------------------------------- plates (sidewalks, plazas, parks, parking)
function plateMaterial(world) {
  return world._plateMat ??= worldMaterial(world.U, {
    vertex: /* glsl */`
      attribute vec3 aSize; attribute vec4 aKind;
      varying vec3 vRel, vLocal, vON, vPm; flat varying vec3 fSize; flat varying vec4 fKind;
      void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vec3 local = wp.xyz + uOrigin;
        local.y = mix(local.y, flatY(local) + .3 + position.y * .1, uFlat); wp.y = local.y - uOrigin.y;
        vRel = wp.xyz; vLocal = local; vON = normal; vPm = position * aSize; fSize = aSize; fKind = aKind; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragment: /* glsl */`
      varying vec3 vRel, vLocal, vON, vPm; flat varying vec3 fSize; flat varying vec4 fKind;
      void main() {
        vec3 n = upAt(vLocal); float kind = fKind.x;
        float e = min(fSize.x * .5 - abs(vPm.x), fSize.z * .5 - abs(vPm.z));
        vec2 p = vPm.xz; float nz = texture(uNoise, p / 23.).r;
        vec3 alb; float rough = .8; vec4 nt = vec4(.5, .5, .8, 1.);
        float wetM = clamp(uWetness * (.4 + .6 * nz), 0., 1.);
        if (kind < .5) { // concrete pavers (Poly Haven concrete_pavement, 1.8 m), a cast-concrete kerb at the edge, grime near walls
          vec4 A = pbrA(L_PAVERS, p / 1.8); nt = pbrN(L_PAVERS, p / 1.8);
          vec4 K = pbrA(L_CONCRETE, p / 2.7);
          alb = A.rgb * .62 * (.85 + .3 * nz);
          float kerb = 1. - smoothstep(.25, .35, e);
          alb = mix(alb, K.rgb * .7, kerb); rough = mix(nt.b, .7, kerb);
          alb *= 1. - .25 * smoothstep(2.5, .4, e) * (1. - kerb) * texture(uNoise, p / 4.).g;
        } else if (kind < 1.5) { // lawn (ambientCG Grass004) worn to dirt in patches, a paved edge
          vec4 G = pbrA(L_GRASS, p / 2.), D = pbrA(L_DIRT, p / 2.);
          float bare = smoothstep(.55, .75, texture(uNoise, p / 19.).r * .7 + texture(uNoise, p / 3.).b * .3);
          alb = mix(G.rgb * .55, D.rgb * .5, bare * .7) * (.8 + .4 * nz); nt = mix(pbrN(L_GRASS, p / 2.), pbrN(L_DIRT, p / 2.), bare); rough = .9;
          vec4 A = pbrA(L_PAVERS, p / 1.8);
          float edge = 1. - smoothstep(1.6, 1.9, e);
          alb = mix(alb, A.rgb * .6, edge); wetM *= edge;
        } else { // parking: asphalt with worn bay stripes
          vec4 A = pbrA(L_ASPHALT, p / 3.); nt = pbrN(L_ASPHALT, p / 3.);
          alb = A.rgb * .5 * (.8 + .4 * nz); rough = nt.b;
          float bay = abs(fract(vPm.x / 2.7) - .5); float fw = fwidth(vPm.x / 2.7);
          float stripe = (1. - smoothstep(.46 - fw, .48, .5 - bay)) * step(2., e) * (1. - step(6.5, abs(abs(vPm.z) - fSize.z * .25)) ) ;
          alb = mix(alb, vec3(.5), stripe * .6 * wear(p));
          alb = mix(pbrA(L_CONCRETE, p / 2.7).rgb * .7, alb, smoothstep(1.4, 1.7, e));
        }
        float pud = kind > .5 && kind < 1.5 ? 0. : puddles(p, wetM) * uWetness;
        alb *= mix(1., .55, max(wetM * .5, pud)); rough = mix(rough * mix(1., .5, wetM), .03, pud);
        vec3 nn = perturb(n, vec3(1., 0., 0.), vec3(0., 0., 1.), nt, mix(.8, .1, pud));
        vec3 v = normalize(-vRel); float nv = max(dot(nn, v), 1e-3); vec3 rf = reflect(-v, nn);
        vec3 F = fresnelR(nv, vec3(.04), rough);
        vec3 env = skyEnv(normalize(vec3(rf.x, max(rf.y, .02), rf.z)));
        if (uEnvW > .001) env = mix(env, envHdri(rf, rough), uEnvW * .8);
        if (uReflOn > .001 && pud > .01) env = mix(env, planarRefl(vRel, (nt.xy - .5) * .01), uReflOn * pud);
        float sv = sunVis(vLocal, n);
        vec3 spec = env * F * (1. - rough * .8) * smoothstep(3000., 300., length(vRel)) + ggxSun(nn, v, rough, vec3(.04)) * sv;
        vec3 col = alb * lightDiffuseV(nn, vLocal, sv) + alb * headlights(vLocal, n) + spec;
        // sodium pools along the kerb (lamps stand on the sidewalk edge)
        col += alb * vec3(1., .6, .28) * uNight * (.7 * exp(-e / 4.) * step(.5, vON.y) + .12);
        col = mix(col, vec3(.07, .07, .075) * (uAmbSky * .6 + uSunCol * max(uSunDir.y, 0.)) + vec3(1., .7, .45) * .05 * uNight, smoothstep(8000., 25000., length(vRel)));
        col = applyFog(col, vRel, vLocal);
        if (uMap > .001) col = mix(col, kind > .5 && kind < 1.5 ? mix(uMapLand, vec3(.08, .12, .08), .5) : uMapLand * 1.25, uMap);
        gl_FragColor = vec4(col, 1.); ${GLSL_TONE} }`,
  });
}

// (FACADE families, see buildingMaterial)
const PALETTE = [0x8a8378, 0x6f6a62, 0x9a8f80, 0x7c6a5c, 0x5c5450, 0x8f7a68, 0xa39886, 0x4e4e52, 0x6b5546, 0x857d74].map(h => new THREE.Color(h));

// ---------------------------------------------------------------- generator
export function city(world, o = {}) {
  const r = rng(o.seed ?? 7), rf = rng((o.seed ?? 7) * 7 + 13), F = world.frame;
  const C0 = o.center ?? [0, 0], R = o.radius ?? 1500, ang = o.angle ?? 0, ca = Math.cos(ang), sa = Math.sin(ang);
  const toG = (x, z) => [C0[0] + x * ca - z * sa, C0[1] + x * sa + z * ca];
  const DT = o.downtown ?? {}, dC = DT.at ?? C0, dR = DT.radius ?? 520, dH = DT.height ?? 190;
  const bMin = o.block?.[0] ?? 95, bMax = o.block?.[1] ?? 135, every = o.avenueEvery ?? 4;
  const seed = o.seed ?? 7;
  // ---- flatten the ground to a best-fit plane over the city (real DEM keeps its gentle tilt)
  {
    let sx = 0, sz = 0, sh = 0, sxx = 0, szz = 0, sxz = 0, sxh = 0, szh = 0, n = 0;
    for (let i = 0; i < 400; i++) { const a = i * 2.39996, d = Math.sqrt(i / 400) * R * 1.2, x = C0[0] + Math.cos(a) * d, z = C0[1] + Math.sin(a) * d, h = world.heightRaw(x, z);
      sx += x; sz += z; sh += h; sxx += x * x; szz += z * z; sxz += x * z; sxh += x * h; szh += z * h; n++; }
    const mx = sx / n, mz = sz / n, mh = sh / n, cxx = sxx / n - mx * mx, czz = szz / n - mz * mz, cxz = sxz / n - mx * mz, cxh = sxh / n - mx * mh, czh = szh / n - mz * mh;
    const det = cxx * czz - cxz * cxz || 1, b = (cxh * czz - czh * cxz) / det, c = (czh * cxx - cxh * cxz) / det;
    const plane = (x, z) => mh + b * (x - mx) + c * (z - mz);
    world.addMod((x, z, h) => { const d = Math.hypot(x - C0[0], z - C0[1]); const k = 1 - sstep(R * 1.02, R * 1.45, d); return k > 0 ? lerp(h, plane(x, z), k) : h; });
    world.cityPlane = plane;
  }
  // ---- grid lines (city frame)
  const lines = (n0) => { const L = []; let x = -R * 1.12; let i = 0; while (x < R * 1.12) { L.push({ c: x, avenue: (i - n0) % every === 0 }); x += bMin + r() * (bMax - bMin); i++; } return L; };
  const LX = lines(1), LZ = lines(2);
  const KA = { kind: 'avenue', cutEnds: true }, KS = { kind: 'street', cutEnds: true };
  const half = (l) => l.avenue ? 10.9 : 5.6;
  const avoid = o.avoid ?? [], pad = o.avoidPad ?? 12;
  const blocked = (gx, gz, extra = 0) => {
    for (const rd of avoid) { const q = rd.nearest(gx, gz, rd.H.edge + rd.K.verge + pad + extra + 40); if (q && q.d < rd.H.edge + rd.K.verge * 0.5 + pad + extra) return true; }
    return false;
  };
  const reserve = o.reserve ?? [];
  const reserved = (gx, gz, m = 0) => reserve.some(q => Math.hypot(gx - q.gx, gz - q.gz) < q.r + m);
  // ---- blocks
  const blocks = [], exists = new Map();
  for (let i = 0; i < LX.length - 1; i++) for (let j = 0; j < LZ.length - 1; j++) {
    const x0 = LX[i].c + half(LX[i]), x1 = LX[i + 1].c - half(LX[i + 1]), z0 = LZ[j].c + half(LZ[j]), z1 = LZ[j + 1].c - half(LZ[j + 1]);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, [gx, gz] = toG(cx, cz);
    const d = Math.hypot(cx, cz), lim = R * (0.72 + 0.45 * fbm(gx / 1400, gz / 1400, seed + 3, 3));
    if (d > lim) continue;
    if (blocked(gx, gz, Math.max(x1 - x0, z1 - z0) * 0.5)) continue;
    const b = { i, j, x0, x1, z0, z1, cx, cz, gx, gz }; blocks.push(b); exists.set(i * 1000 + j, b);
  }
  const has = (i, j) => exists.has(i * 1000 + j);
  // ---- street segments and junctions
  const segs = [], lamps = [], trees = [];
  const addSeg = (a, b, kind, lineIdx, axis) => {
    const [ax, az] = toG(...a), [bx, bz] = toG(...b), len = Math.hypot(bx - ax, bz - az); if (len < 6) return;
    const mid = [(ax + bx) / 2, (az + bz) / 2]; if (blocked(mid[0], mid[1])) return;
    const rd = road(world, { points: [[ax, az], [bx, bz]], ...(kind === 'avenue' ? KA : KS), noCut: true, register: false, step: Math.max(4, len / Math.ceil(len / 12)), lampPhase: 14, smooth: 4,
      lampSpacing: kind === 'avenue' ? 34 : 38, liftMesh: 0.12 });
    rd.axis = axis; rd.line = lineIdx; segs.push(rd); lamps.push(...rd.lamps);
  };
  for (let i = 0; i < LX.length; i++) for (let j = 0; j < LZ.length - 1; j++) {
    if (!(has(i - 1, j) || has(i, j))) continue;
    const l = LX[i], z0 = LZ[j].c + half(LZ[j]), z1 = LZ[j + 1].c - half(LZ[j + 1]);
    addSeg([l.c, z0], [l.c, z1], l.avenue ? 'avenue' : 'street', i, 'x');
  }
  for (let j = 0; j < LZ.length; j++) for (let i = 0; i < LX.length - 1; i++) {
    if (!(has(i, j - 1) || has(i, j))) continue;
    const l = LZ[j], x0 = LX[i].c + half(LX[i]), x1 = LX[i + 1].c - half(LX[i + 1]);
    addSeg([x0, l.c], [x1, l.c], l.avenue ? 'avenue' : 'street', j, 'z');
  }
  const junctions = [];
  for (let i = 0; i < LX.length; i++) for (let j = 0; j < LZ.length; j++) {
    if (!(has(i - 1, j - 1) || has(i, j - 1) || has(i - 1, j) || has(i, j))) continue;
    const hx = half(LX[i]), hz = half(LZ[j]); const [a0, a1] = toG(LX[i].c - hx, LZ[j].c), [b0, b1] = toG(LX[i].c + hx, LZ[j].c);
    if (blocked((a0 + b0) / 2, (a1 + b1) / 2)) continue;
    const jr = road(world, { points: [[a0, a1], [b0, b1]], kind: 'street', noCut: true, register: false, lamps: false, step: hx, liftMesh: 0.11 });
    jr.K = { ...jr.K, kind: -1, cutEnds: false }; jr.H = { m: 0, lanesFrom: 0, lanesTo: 0, edge: hz };
    junctions.push(jr);
  }
  // ---- plates, parcels, buildings
  const plates = [], bldgs = [], props = [];
  const hAt = (gx, gz) => world.height(gx, gz);
  const isDown = (gx, gz) => Math.exp(-((Math.hypot(gx - dC[0], gz - dC[1]) / dR) ** 2));
  for (const b of blocks) {
    const w = b.x1 - b.x0, d = b.z1 - b.z0, base = hAt(b.gx, b.gz);
    const down = isDown(b.gx, b.gz), dist = Math.hypot(b.cx, b.cz) / R;
    const roll = r();
    const isPark = !reserved(b.gx, b.gz, 60) && (roll < (o.parks ?? 0.05) * (1 - down) || (o.parkBlocks ?? []).some(([pi, pj]) => pi === b.i && pj === b.j));
    plates.push({ cx: b.cx, cz: b.cz, w, d, base, kind: 0 });
    const sw = 3.6, lx0 = b.x0 + sw, lx1 = b.x1 - sw, lz0 = b.z0 + sw, lz1 = b.z1 - sw;
    // street trees along the sidewalk (not downtown)
    if (down < 0.5) for (const [ax, az, bx, bz] of [[b.x0 + 1.4, b.z0 + 1.4, b.x1 - 1.4, b.z0 + 1.4], [b.x0 + 1.4, b.z1 - 1.4, b.x1 - 1.4, b.z1 - 1.4], [b.x0 + 1.4, b.z0 + 1.4, b.x0 + 1.4, b.z1 - 1.4], [b.x1 - 1.4, b.z0 + 1.4, b.x1 - 1.4, b.z1 - 1.4]]) {
      const len = Math.hypot(bx - ax, bz - az), nT = Math.floor(len / 14);
      for (let k = 1; k < nT; k++) { if (r() > 0.55) continue; const t = k / nT, [gx, gz] = toG(lerp(ax, bx, t), lerp(az, bz, t)); trees.push({ gx, gz, h: base + 0.15, size: 7 + r() * 4, kind: r() < 0.8 ? 0 : 3, tint: 0.8 + r() * 0.4 }); }
    }
    if (isPark) {
      plates.push({ cx: b.cx, cz: b.cz, w: w - 2 * sw, d: d - 2 * sw, base: base + 0.02, kind: 1 });
      const nT = Math.floor((w * d) / 260);
      for (let k = 0; k < nT; k++) { const [gx, gz] = toG(lerp(lx0 + 4, lx1 - 4, r()), lerp(lz0 + 4, lz1 - 4, r())); trees.push({ gx, gz, h: base + 0.15, size: 8 + r() * 7, kind: r() < 0.25 ? 1 : 0, tint: 0.7 + r() * 0.5 }); }
      continue;
    }
    // parcels: split along the long side; deep blocks get two rows
    const along = w >= d ? 'x' : 'z', L0 = along === 'x' ? [lx0, lx1] : [lz0, lz1], Dp = along === 'x' ? [lz0, lz1] : [lx0, lx1];
    const rows = (Dp[1] - Dp[0]) > 55 ? 2 : 1;
    for (let row = 0; row < rows; row++) {
      const q0 = lerp(Dp[0], Dp[1], row / rows), q1 = lerp(Dp[0], Dp[1], (row + 1) / rows);
      let p = L0[0];
      while (p < L0[1] - 6) {
        const pw = Math.min(L0[1] - p, (down > 0.4 ? 30 + r() * 40 : dist > 0.7 ? 12 + r() * 14 : 18 + r() * 26));
        const a = p, bb = p + pw; p = bb;
        const px0 = along === 'x' ? a : q0, px1 = along === 'x' ? bb : q1, pz0 = along === 'x' ? q0 : a, pz1 = along === 'x' ? q1 : bb;
        const pcx = (px0 + px1) / 2, pcz = (pz0 + pz1) / 2, [gx, gz] = toG(pcx, pcz);
        if (reserved(gx, gz)) { plates.push({ cx: pcx, cz: pcz, w: px1 - px0, d: pz1 - pz0, base: base + 0.03, kind: 0 }); continue; }
        if (r() < (o.parking ?? 0.07) * (1 - down * 0.8)) { plates.push({ cx: pcx, cz: pcz, w: px1 - px0, d: pz1 - pz0, base: base + 0.02, kind: 2 }); continue; }
        const set = down > 0.3 ? 0 : 0.5 + r() * 2.5;
        const fw = Math.max(5, px1 - px0 - set * 2), fd = Math.max(5, pz1 - pz0 - set * 2);
        const mid = 9 + 26 * Math.exp(-((dist / 0.55) ** 2));
        let h = mid * (0.55 + 0.9 * r()) + dH * down * Math.pow(r(), 1.6) * 1.15;
        h = Math.max(7, h);
        const glass = h > 60 ? (r() < 0.6 ? 0.6 + r() * 0.4 : r() * 0.3) : r() * 0.15;
        // facade family by height and district (FACADE in the material)
        const fr = rf(); let ftype;
        if (glass > 0.5) ftype = fr < 0.5 ? FACADE.curtain : fr < 0.8 ? FACADE.glass : FACADE.ribbon;
        else if (h > 30) ftype = fr < 0.3 ? FACADE.ribbon : fr < 0.55 ? FACADE.concrete : fr < 0.8 ? FACADE.stone : FACADE.piers;
        else ftype = fr < 0.38 ? FACADE.brick : fr < 0.62 ? FACADE.brickwin : fr < 0.77 ? FACADE.stone : fr < 0.9 ? FACADE.concrete : (down < 0.2 ? FACADE.metal : FACADE.brick);
        const photo = ftype >= FACADE.brickwin && ftype <= FACADE.glass;
        const floorH = ftype === FACADE.curtain ? 3.9 : ftype === FACADE.ribbon ? 3.8 : ftype === FACADE.glass ? 3.9 : photo ? 3.4 : h > 30 ? 3.6 : 3.3, gf = h > 20 ? 5.2 : 4.2;
        h = gf + Math.max(1, Math.round((h - gf) / floorH)) * floorH + 1.4;
        const col = PALETTE[Math.floor(r() * PALETTE.length)].clone().multiplyScalar(0.3 + r() * 0.3);
        if (glass > 0.5 && ftype === FACADE.glass) col.setRGB(0.05, 0.06, 0.07);
        if (ftype !== FACADE.glass) col.setRGB(0.38 + rf() * 0.12, 0.38 + rf() * 0.1, 0.38 + rf() * 0.08); // tint around 1/1.6 for textured families
        const bayR = glass > 0.5 ? 1.5 : 2.2 + r() * 1.6, bay = ftype === FACADE.curtain ? 1.5 : ftype === FACADE.ribbon ? 1.6 : ftype === FACADE.glass ? 1.5 : photo ? 3.2 : bayR;
        const style = [floorH, bay, glass > 0.5 ? 0.9 : 0.42 + r() * 0.3, glass];
        const mat = [ftype, 0, 0, ftype <= FACADE.concrete ? 0.18 + rf() * 0.22 : 0.12];
        const dens = (0.05 + r() * 0.2 + down * 0.1) * (glass > 0.5 ? 0.6 : 1), sd = Math.floor(r() * 1e6);
        const B = (cx, cz, w2, d2, y0, hh) => bldgs.push({ cx, cz, w: w2, d: d2, y: y0, h: hh, style, col, seed: sd, dens, gf: y0 > base + 0.5 ? -100 : gf, base, mat });
        if (h > 75 && fw > 22 && fd > 22) { // podium + tower + crown setback
          const ph = gf + Math.round(4 + r() * 3) * floorH;
          B(pcx, pcz, fw, fd, base, ph);
          const tw = fw * (0.6 + r() * 0.25), td = fd * (0.6 + r() * 0.25), ox = (fw - tw) * (r() - 0.5) * 0.6, oz = (fd - td) * (r() - 0.5) * 0.6;
          const t2 = h * (0.72 + r() * 0.15);
          B(pcx + ox, pcz + oz, tw, td, base + ph, t2 - ph);
          B(pcx + ox, pcz + oz, tw * 0.78, td * 0.78, base + t2, h - t2);
          if (r() < 0.5) props.push({ cx: pcx + ox, cz: pcz + oz, w: 0.6, d: 0.6, y: base + h, h: 8 + r() * 14 });
        } else {
          B(pcx, pcz, fw, fd, base, h);
          // rooftop plant
          const nP = Math.floor(fw * fd / 260) + (r() < 0.6 ? 1 : 0);
          for (let k = 0; k < nP; k++) { const s1 = 1.5 + r() * 3.5, s2 = 1.5 + r() * 3.5; props.push({ cx: pcx + (r() - 0.5) * (fw - s1 - 2), cz: pcz + (r() - 0.5) * (fd - s2 - 2), w: s1, d: s2, y: base + h, h: 1 + r() * 2.2 }); }
        }
      }
    }
  }
  // ---- meshes
  const group = new THREE.Group(); group.name = 'city';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ang), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const bm = buildingMaterial(world);
  const im = new THREE.InstancedMesh(box.clone(), bm, bldgs.length);
  {
    const aSize = new Float32Array(bldgs.length * 3), aStyle = new Float32Array(bldgs.length * 4), aSeed = new Float32Array(bldgs.length * 4), aCol = new Float32Array(bldgs.length * 3), aMat = new Float32Array(bldgs.length * 4);
    bldgs.forEach((b, i) => { const [gx, gz] = toG(b.cx, b.cz); F.surface(gx, gz, b.y, v); sc.set(b.w, b.h, b.d); m4.compose(v, q, sc); im.setMatrixAt(i, m4);
      aSize.set([b.w, b.h, b.d], i * 3); aStyle.set(b.style, i * 4); F.surface(gx, gz, b.base, sc); aSeed.set([b.seed, b.dens, sc.y, b.gf], i * 4); aCol.set([b.col.r, b.col.g, b.col.b], i * 3); aMat.set(b.mat, i * 4); });
    im.geometry.setAttribute('aMat', new THREE.InstancedBufferAttribute(aMat, 4));
    im.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3)); im.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(aStyle, 4));
    im.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); im.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
    im.frustumCulled = false; im.name = 'buildings'; group.add(im);
  }
  // roof clutter (own rng, so the layout above never changes): HVAC units, water tanks on stilts,
  // antennas and satellite masts. Boxes and cylinders in the building material's plant path.
  const tanks = [];
  { const rc = rng(seed * 31 + 5);
    for (const b of bldgs) {
      const top = b.y + b.h, hh = top - b.base; if (b.w < 9 || b.d < 9) continue;
      const k = rc();
      if (hh > 18 && hh < 75 && k < 0.16) { const d = 3 + rc() * 2.5; tanks.push({ cx: b.cx + (rc() - 0.5) * (b.w - d - 3), cz: b.cz + (rc() - 0.5) * (b.d - d - 3), w: d, d, y: top + 2.2, h: 3.5 + rc() * 2 });
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) props.push({ cx: tanks.at(-1).cx + sx * d * 0.3, cz: tanks.at(-1).cz + sz * d * 0.3, w: 0.2, d: 0.2, y: top, h: 2.2 }); }
      if (hh > 25 && rc() < 0.3) props.push({ cx: b.cx + (rc() - 0.5) * b.w * 0.6, cz: b.cz + (rc() - 0.5) * b.d * 0.6, w: 0.25, d: 0.25, y: top, h: 4 + rc() * 9 });
      const nh = rc() < 0.7 ? 1 + Math.floor(rc() * 3) : 0;
      for (let j = 0; j < nh; j++) { const s1 = 1.2 + rc() * 2.4, s2 = 1.2 + rc() * 2.4; props.push({ cx: b.cx + (rc() - 0.5) * (b.w - s1 - 2), cz: b.cz + (rc() - 0.5) * (b.d - s2 - 2), w: s1, d: s2, y: top, h: 0.9 + rc() * 1.6 }); }
    }
  }
  if (tanks.length) {
    const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 14); cyl.translate(0, 0.5, 0);
    const tm = new THREE.InstancedMesh(cyl, bm, tanks.length);
    const aSize = new Float32Array(tanks.length * 3), aStyle = new Float32Array(tanks.length * 4), aSeed = new Float32Array(tanks.length * 4), aCol = new Float32Array(tanks.length * 3);
    tanks.forEach((b, i) => { const [gx, gz] = toG(b.cx, b.cz); F.surface(gx, gz, b.y, v); sc.set(b.w, b.h, b.d); m4.compose(v, q, sc); tm.setMatrixAt(i, m4);
      aSize.set([b.w, b.h, b.d], i * 3); aStyle.set([0, 1, 0, 0], i * 4); aSeed.set([i, 0, v.y, 0], i * 4); aCol.set([0.34, 0.3, 0.26], i * 3); });
    tm.geometry.setAttribute('aMat', new THREE.InstancedBufferAttribute(new Float32Array(tanks.length * 4), 4));
    tm.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3)); tm.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(aStyle, 4));
    tm.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); tm.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
    tm.frustumCulled = false; tm.name = 'roofTanks'; group.add(tm);
  }
  // rooftop plant + masts: plain boxes in the building material (floorH 0 = no windows)
  if (props.length) {
    const pm = new THREE.InstancedMesh(box.clone(), bm, props.length);
    const aSize = new Float32Array(props.length * 3), aStyle = new Float32Array(props.length * 4), aSeed = new Float32Array(props.length * 4), aCol = new Float32Array(props.length * 3);
    props.forEach((b, i) => { const [gx, gz] = toG(b.cx, b.cz); F.surface(gx, gz, b.y, v); sc.set(b.w, b.h, b.d); m4.compose(v, q, sc); pm.setMatrixAt(i, m4);
      aSize.set([b.w, b.h, b.d], i * 3); aStyle.set([0, 1, 0, 0], i * 4); aSeed.set([i, 0, v.y, 0], i * 4); aCol.set([0.42, 0.42, 0.43], i * 3); });
    pm.geometry.setAttribute('aMat', new THREE.InstancedBufferAttribute(new Float32Array(props.length * 4), 4));
    pm.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3)); pm.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(aStyle, 4));
    pm.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); pm.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
    pm.frustumCulled = false; pm.name = 'roofProps'; group.add(pm);
  }
  {
    const pl = new THREE.InstancedMesh(box.clone(), plateMaterial(world), plates.length);
    const aSize = new Float32Array(plates.length * 3), aKind = new Float32Array(plates.length * 4);
    plates.forEach((b, i) => { const [gx, gz] = toG(b.cx, b.cz); F.surface(gx, gz, b.base, v); sc.set(b.w, 0.16, b.d); m4.compose(v, q, sc); pl.setMatrixAt(i, m4); aSize.set([b.w, 0.16, b.d], i * 3); aKind.set([b.kind, 0, 0, 0], i * 4); });
    pl.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3)); pl.geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(aKind, 4));
    pl.frustumCulled = false; pl.name = 'plates'; group.add(pl);
  }
  // ---- full-length lines as roads for routing: city.line('x', i) -> road (not rendered)
  const lineRoad = (axis, i) => {
    const l = axis === 'x' ? LX[i] : LZ[i], ext = R * 1.15;
    const pts = axis === 'x' ? [toG(l.c, -ext), toG(l.c, ext)] : [toG(-ext, l.c), toG(ext, l.c)];
    return road(world, { points: pts, kind: l.avenue ? 'avenue' : 'street', noCut: true, register: false, lamps: false, step: 8 });
  };
  world.lamps.push(...lamps); world.trees.push(...trees);
  for (const s of [...segs, ...junctions]) world.cityRoads.push(s);
  const api = {
    group, blocks, segs, junctions, bldgs, LX, LZ, toG, R, center: C0, angle: ang,
    line: lineRoad,
    // index of the grid line nearest to a city-frame coordinate
    nearestLine(axis, c) { const L = axis === 'x' ? LX : LZ; let bi = 0; L.forEach((l, i) => { if (Math.abs(l.c - c) < Math.abs(L[bi].c - c)) bi = i; }); return bi; },
    toCity(gx, gz) { const x = gx - C0[0], z = gz - C0[1]; return [x * ca + z * sa, -x * sa + z * ca]; },
    stats: { blocks: blocks.length, buildings: bldgs.length, segments: segs.length, lamps: lamps.length, trees: trees.length },
  };
  return api;
}

// A paved plaza / forecourt (sidewalk material) of w x d metres at ground coords, rotated by angle.
export function plaza(world, gx, gz, w, d, angle = 0, kind = 0) {
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const pl = new THREE.InstancedMesh(box, plateMaterial(world), 1); const v = new THREE.Vector3();
  world.frame.surface(gx, gz, world.height(gx, gz) + 0.02, v);
  pl.setMatrixAt(0, new THREE.Matrix4().compose(v, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle), new THREE.Vector3(w, 0.16, d)));
  box.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array([w, 0.16, d]), 3)); box.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array([kind, 0, 0, 0]), 4));
  pl.frustumCulled = false; return pl;
}
