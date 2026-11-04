// World: assembles a place (or a procedural one), terrain, sky, clouds, globe, roads, cities,
// props, vehicles; owns the shared uniforms and renders with a floating origin and a two-pass
// depth partition (near / far) so one camera can go from a kerb to orbit without z-fighting.
//
// Frame pipeline (World.render, every step a pure function of camera + state):
//   1. per-frame constants: Preetham sky + haze LUT (sunlit TODs), HDRI ambient/reflection weights
//      (low altitude), exposure adapted to altitude (deterministic curve per TOD)
//   2. sun shadows: two cascades fitted to the shot (light.js), when the sun is up
//   3. night puddle mirror at 1/4 res (light.js), when the street is wet and the camera low
//   4. the scene into a linear HDR target (near/far split as before), opaque families drawn
//      front-to-back (buildings, roads, then terrain, then sky) so early-z skips hidden pixels
//   5. bloom + AgX tone mapping + flare (light.js Post) to the canvas
// Quality knobs: W.create({ shadows: false | { size }, mirror: false, bloom: 0..1, ... }).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Frame, makeUniforms, applyTod, todMix, TOD, fbm, sstep, clamp, lerp, R_EARTH } from './core.js';
import { loadPlace, loadEarth } from './place.js';
import { buildTerrain, terrainMaterial } from './terrain.js';
import { buildSky, buildClouds } from './sky.js';
import { buildGlobe } from './globe.js';
import { road, roadGeometries, roadMaterial, barrierMaterial, route } from './roads.js';
import { city } from './city.js';
import { buildLamps, glowPoints, buildTrees } from './props.js';
import { fleet } from './vehicles.js';
import { loadPBR, loadEnv, loadTrees, preethamParams, preetham, hazeLut } from './materials.js';
import { Shadows, Mirror, Post, shadowMaterial } from './light.js';

const FAR_LAYER = 1;
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

export class World {
  constructor(opts, place, earth, lib = {}) {
    this.opts = opts; this.place = place; this.earth = earth; this.lib = lib;
    this.frame = place?.frame ?? new Frame({ lat: opts.lat ?? 40, lon: opts.lon ?? -100, elev: opts.elev ?? 0 });
    this.U = makeUniforms(this.frame);
    this.scene = new THREE.Scene(); this.root = new THREE.Group(); this.root.name = 'world'; this.scene.add(this.root);
    this.mods = []; this.roads = []; this.cityRoads = []; this.lamps = []; this.trees = []; this.cities = []; this.extra = [];
    this.globeH = opts.globeH ?? -40; // globe surface relative to the anchor's elevation
    this.seed = opts.seed ?? 1;
    this.tod = typeof opts.tod === 'object' ? opts.tod : TOD[opts.tod ?? 'blue'];
    this.built = false;
    const U = this.U;
    if (lib.pbr) { U.uPbrA.value = lib.pbr.A; U.uPbrN.value = lib.pbr.N; this.pbr = lib.pbr; }
    if (lib.env) { U.uEnvT.value = lib.env.tex; U.uEnvSH.value = lib.env.sh; U.uEnvLods.value = lib.env.lods; }
    if (lib.envN) { U.uEnvT2.value = lib.envN.tex; U.uEnvSH2.value = lib.envN.sh; }
    U.uWetness.value = opts.wet ?? 0;
    this.lightCfg = { shadows: opts.shadows ?? true, mirror: opts.mirror ?? true, bloom: opts.bloom ?? 1 };
  }
  // ---- heights (metres above the anchor's elevation, before curvature)
  heightRaw(gx, gz) {
    if (this.place) { const [la, lo] = this.frame.geoOf(gx, gz); return this.place.height(la, lo) - this.frame.elev; }
    const P = this.opts.relief ?? { amp: 60, scale: 6000 };
    return (fbm(gx / P.scale, gz / P.scale, this.seed, 5) - 0.5) * 2 * P.amp + (P.ridge ? Math.pow(Math.max(0, fbm(gx / P.ridge.scale, gz / P.ridge.scale, this.seed + 9, 4) - 0.45), 1.5) * P.ridge.amp : 0);
  }
  // Terrain modifiers run in two tiers: area mods (city planes, lakes; prio 0) first, then road
  // corridors (prio 1) in the order the roads were made. height(..., before) stops at a given road
  // mod, which is how a road samples the ground it is cut into.
  height(gx, gz, before = null) {
    let h = this.heightRaw(gx, gz);
    for (const m of this.mods) if (m.prio === 0) h = m.fn(gx, gz, h);
    for (const m of this.mods) { if (m.prio === 0) continue; if (m === before) break; h = m.fn(gx, gz, h); }
    return h;
  }
  addMod(fn, prio = 0) { const m = { fn, prio }; this.mods.push(m); return m; }
  // ---- content
  road(o) { return road(this, o); }
  city(o) { const c = city(this, o); this.cities.push(c); if (!this.cityCenter) this.setCity(c.center, c.R); return c; }
  route(pieces, o) { return route(this, pieces, o); }
  setCity(center, r) { this.cityCenter = center; this.U.uCityPos.value.set(center[0], 0, center[1]); this.U.uCityR.value = r * 1.6; }
  add(obj, { far = false } = {}) { if (far) obj.traverse(o => o.layers.set(FAR_LAYER)); this.root.add(obj); return obj; }

  build() {
    const o = this.opts;
    // sky + globe (far pass only). The sky draws last with a depth test: it only shades pixels nothing covered.
    this.sky = buildSky(this); this.sky.layers.set(FAR_LAYER); this.scene.add(this.sky); // not in root: follows the camera
    if (this.earth && o.globe !== false) { this.globe = buildGlobe(this, this.earth); this.add(this.globe.group, { far: true }); }
    // terrain
    this.terrain = buildTerrain(this, o.terrain ?? {}); this.root.add(this.terrain);
    // roads: merged surfaces (one draw), verges (terrain material), barriers
    const surf = [], verge = [], bar = [];
    for (const r of [...this.roads, ...this.cityRoads]) { const g = roadGeometries(this, r); surf.push(g.surface); verge.push(...g.verges); if (g.barrier) bar.push(g.barrier); }
    if (surf.length) { const m = new THREE.Mesh(mergeGeometries(surf), roadMaterial(this)); m.frustumCulled = false; m.name = 'roads'; this.root.add(m); this.roadMesh = m; }
    if (verge.length) { const m = new THREE.Mesh(mergeGeometries(verge), terrainMaterial(this, { polygonOffset: -1 })); m.frustumCulled = false; m.name = 'verges'; this.root.add(m); this.vergeMesh = m; }
    if (bar.length) { const m = new THREE.Mesh(mergeGeometries(bar), barrierMaterial(this)); m.frustumCulled = false; m.name = 'barriers'; this.root.add(m); this.barrierMesh = m; }
    for (const c of this.cities) this.root.add(c.group);
    // lamps in 600 m tiles so far tiles can be hidden (poles are sub-pixel there; glows remain)
    for (const l of this.lamps) if (Number.isNaN(l.h)) l.h = l.road.hAt(l.s);
    const tiles = new Map();
    for (const l of this.lamps) { const k = Math.floor(l.gx / 600) * 10007 + Math.floor(l.gz / 600); (tiles.get(k) ?? tiles.set(k, []).get(k)).push(l); }
    this.lampTiles = []; const heads = []; this.lampGroup = new THREE.Group(); this.lampGroup.name = 'lamps'; this.root.add(this.lampGroup);
    for (const list of tiles.values()) { const L = buildLamps(this, list); L.group.userData.c = this.frame.surface(list[0].gx, list[0].gz, list[0].h); this.lampGroup.add(L.group); this.lampTiles.push(L.group); heads.push(...L.heads); }
    if (heads.length) { this.lampGlow = glowPoints(this, heads.length, { size: 0.9, halo: 9, minPx: 1.4, intensity: 1.3 }); heads.forEach((h, i) => this.lampGlow.set(i, h.x, h.y, h.z, 1)); this.lampGlow.commit(); this.lampGlow.points.name = 'lampGlow'; this.root.add(this.lampGlow.points); }
    if (this.trees.length) { this.treeMesh = buildTrees(this, this.trees, o.treeFade ?? {}); this.root.add(this.treeMesh); }
    if (o.clouds) { this.clouds = buildClouds(this, o.clouds); this.root.add(this.clouds.group); }
    if (o.fleet !== false) { this.fleet = fleet(this, o.fleet ?? {}); this.root.add(this.fleet.group); }
    for (const e of this.extra) this.root.add(e);
    // draw order for early-z: tall/near-occluding families first, ground after, terrain late, sky last
    const order = (obj, k) => { if (obj) obj.renderOrder = k; };
    for (const c of this.cities) for (const m of c.group.children) order(m, m.name === 'plates' ? 3 : 1);
    order(this.roadMesh, 4); order(this.vergeMesh, 5); order(this.barrierMesh, 2); order(this.terrain, 6);
    if (this.globe) order(this.globe.mesh, 7);
    this.sky.renderOrder = 9;
    this.built = true;
    return this;
  }

  // shadow casters: [{ obj, mat }] (mat: null = generic depth material)
  casters() {
    if (!this._casters) {
      const list = [];
      for (const c of this.cities) for (const m of c.group.children) if (m.name !== 'plates') list.push({ obj: m, mat: null });
      for (const e of this.extra) e.traverse(o => { if (o.isMesh && !o.userData.noShadow && o.material?.transparent !== true) list.push({ obj: o, mat: null }); });
      if (this.barrierMesh) list.push({ obj: this.barrierMesh, mat: null });
      if (this.fleet) for (const m of this.fleet.group.children) if (m.isInstancedMesh && !m.userData.noShadow) list.push({ obj: m, mat: null });
      for (const g of this.lampTiles ?? []) for (const m of g.children) list.push({ obj: m, mat: null });
      if (this.treeMesh) { const u = { uAtlas: this.treeMesh.material.uniforms.uAtlas, uSunDirS: this.U.uSunDir, uFade: this.treeMesh.material.uniforms.uFade }; list.push({ obj: this.treeMesh, mat: shadowMaterial('tree', u) }); }
      this._casters = list;
    }
    return this._casters;
  }

  // ---- per-frame state: { t, tod (name | object), todMix: [a, b, k], map, flat, exposure, lightsFar, head: { pos, dir, on } }
  setState(s = {}) {
    const U = this.U;
    if (s.tod) this.tod = typeof s.tod === 'string' ? TOD[s.tod] : s.tod;
    applyTod(U, this.tod);
    if (s.t !== undefined) U.uTime.value = s.t;
    U.uMap.value = s.map ?? 0; U.uFlat.value = s.flat ?? 0; U.uLightsFar.value = s.lightsFar ?? 0; this.cloudFog = s.cloudFog ?? 0;
    this.exposure = s.exposure ?? this.tod.exposure;
    this.expAuto = s.autoExposure ?? true;
    U.uWetness.value = s.wet ?? this.opts.wet ?? 0; // per frame (sets share one world: no state may leak between them)
    if (s.head) { const { pos, fwd, right, on = 1 } = s.head; for (const [i, k] of [[0, -1], [1, 1]]) U.uHead.value[i].set(pos.x + right.x * 0.7 * k + fwd.x * 2.3, pos.y + 0.7, pos.z + right.z * 0.7 * k + fwd.z * 2.3, 2.6 * on * U.uNight.value); U.uHeadDir.value.copy(fwd); }
    else { U.uHead.value[0].w = 0; U.uHead.value[1].w = 0; }
  }

  // camera position in local frame -> altitude, AGL, near/far, cloud fog; returns info
  cameraInfo(cam) {
    const p = cam.position, F = this.frame;
    const alt = F.altitude(p);
    const gr = Math.hypot(p.x, p.z) < 2.5e5 ? this.height(p.x, p.z) + F.elev : F.elev + this.globeH;
    const agl = Math.max(0.05, alt - gr);
    return { alt, agl, ground: gr };
  }

  // exposure multiplier from the altitude (deterministic): night aerials read darker than the
  // street (fewer lights per pixel), sunlit aerials brighter (haze); tod.expAlt = [street, aerial]
  altExposure(agl) {
    const e = this.tod.expAlt ?? [1, 1];
    const k = sstep(Math.log(25), Math.log(2500), Math.log(Math.max(agl, 1)));
    return Math.exp(lerp(Math.log(e[0]), Math.log(e[1]), k));
  }

  // sky + haze + environment constants for this frame
  _lighting(info) {
    const U = this.U, tod = this.tod, sd = U.uSunDir.value;
    // Preetham sky / haze LUT when the sun is near or above the horizon
    const pb = sstep(-5, 1.5, tod.sunEl);
    U.uSkyPb.value = pb * (tod.preetham ?? 1);
    if (U.uSkyPb.value > 0.001) {
      const P = preethamParams([sd.x, sd.y, sd.z], tod.sky ?? {});
      U.uPbBetaR.value.set(...P.betaR); U.uPbBetaM.value.set(...P.betaM); U.uPbSunE.value = P.sunE;
      // scene units: the sky 90 degrees from the sun, 5 degrees up, matches this TOD's hand-set horizon brightness
      let gain = tod.skyGain;
      if (gain === undefined) { const az = Math.atan2(sd.x, -sd.z) + Math.PI / 2, el = 5 * Math.PI / 180; gain = lum(tod.horizon) * (tod.skyK ?? 1) / Math.max(lum(preetham([Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)], [sd.x, sd.y, sd.z], P)), 1e-6); }
      U.uPbGain.value = Math.min(gain, 40); // (sun below the horizon: the reference sky is tiny; never blow up)
      const key = [sd.x, sd.y, sd.z, U.uPbGain.value, tod.hazeGain ?? 0.85].map(x => x.toFixed(5)).join();
      if (key !== this._lutKey) { this._lutKey = key; U.uHazeLut.value = hazeLut(U.uHazeLut.value, [sd.x, sd.y, sd.z], P, U.uPbGain.value * (tod.hazeGain ?? 0.85)); }
    }
    // HDRI ambient + reflections at low altitude, normalised to this TOD's ambient level
    if (this.lib.env) {
      const near = 1 - sstep(80, 900, info.agl);
      U.uEnvW.value = near * (tod.envW ?? 0.75);
      U.uEnvMix.value = this.lib.envN ? clamp(tod.night) : 0;
      const target = lum(tod.ambSky) * (tod.envK ?? 1);
      const upIrr = (sh) => { const c = [0, 1, 2].map(i => sh[0].getComponent(i) + sh[1].getComponent(i) - sh[6].getComponent(i) - sh[8].getComponent(i)); return Math.max(lum(c), 1e-4); };
      U.uEnvGain.value = target / upIrr(this.lib.env.sh);
      if (this.lib.envN) U.uEnvGain2.value = target * (tod.envNightK ?? 1.6) / upIrr(this.lib.envN.sh);
      const phW = Math.atan2(sd.x, -sd.z);
      U.uEnvYaw.value = this.lib.env.sunAz - phW;
      U.uEnvYaw2.value = tod.envNightYaw ?? 0;
    }
  }

  render(renderer, cam, { near = null, far = null } = {}) {
    if (!this.built) this.build();
    this._renderer = renderer;
    const U = this.U, info = this.cameraInfo(cam);
    const origin = cam.position.clone();
    U.uOrigin.value.copy(origin); U.uCamAlt.value = info.alt;
    { // per-frame constants for the sky / haze shaders
      const up = this.frame.upAt(origin, U.uUpCam.value), sd = U.uSunDir.value; const h = Math.max(info.alt, 0);
      U.uSunH.value.copy(sd).addScaledVector(up, -sd.dot(up)); if (U.uSunH.value.lengthSq() < 1e-10) U.uSunH.value.set(1, 0, 0); U.uSunH.value.normalize();
      U.uDip.value = Math.acos(clamp(R_EARTH / (R_EARTH + h), 0, 1)); U.uSpace.value = sstep(18000, 110000, h);
      U.uLimbW.value = clamp(70000 / Math.sqrt(Math.max(h * (2 * R_EARTH + h), 1)), 0.002, 0.05);
    }
    this._lighting(info);
    // in-cloud fog: physical density at the camera, or a keyed whiteout (state.cloudFog 0..1) for a
    // designed pass through the deck; whichever is denser
    U.uCloudFog.value = this.clouds ? this.clouds.fogAt(origin.x, origin.z, info.alt - this.frame.elev, U.uTime.value) : 0;
    U.uWhite.value = this.cloudFog ?? 0;
    this.clouds?.setCamera(info.alt - this.frame.elev);
    U.uLightsFar.value = Math.max(U.uLightsFar.value, sstep(2500, 40000, info.agl));
    U.uCloudCol.value.copy(U.uCloudLit.value).multiplyScalar(0.85).add(U.uGlow.value.clone().multiplyScalar(0.12)).add(U.uCityGlow.value.clone().multiplyScalar(0.25));
    // internal render scale (quality knob): the scene renders at rs x the canvas and is upscaled with a
    // light sharpen in the present pass; DOM overlays (labels, type) stay at full resolution
    const full = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rs = this.opts.renderScale ?? 1, size = full.clone().multiplyScalar(rs).round();
    U.uPx.value = size.y / (2 * Math.tan(cam.fov * Math.PI / 360));
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    // floating origin: camera at 0, world shifted
    this.root.position.copy(origin).negate(); cam.position.set(0, 0, 0); cam.updateMatrixWorld();
    // lamp tiles beyond ~1.4 km: hidden (sub-pixel poles)
    for (const g of this.lampTiles ?? []) g.visible = !this.lampsOff && g.userData.c.distanceTo(origin) < 1400 + 450 && this.U.uMap.value < 0.99;
    this.fleet?.sort?.(origin);
    for (const c of this.cities) c.sort?.(origin);
    const sync = () => { if (this.profile) { const cur = renderer.getRenderTarget(); renderer.setRenderTarget(null); const g = renderer.getContext(); g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4)); renderer.setRenderTarget(cur); } };
    sync(); const t0 = performance.now(), ms = {};
    // ---- sun shadows
    const sunUp = U.uSunCol.value.lengthSq() > 1e-6 && U.uSunDir.value.y > 0.004;
    const shadowsOn = this.lightCfg.shadows && sunUp && U.uMap.value < 0.98 && info.agl < 9000;
    U.uShP.value.x = shadowsOn ? 1 : 0;
    U.uShP.value.w = shadowsOn ? sstep(0.3, 2.5, this.tod.sunEl) * (1 - U.uMap.value) * (1 - sstep(4000, 9000, info.agl)) : 0;
    if (shadowsOn) { (this.shadows ??= new Shadows(typeof this.lightCfg.shadows === 'object' ? this.lightCfg.shadows : { size: 1536 })).render(renderer, this, origin, fwd, info); }
    sync(); ms.shadow = performance.now() - t0;
    // ---- night puddle mirror (camera low over wet ground)
    const mirrorOn = this.lightCfg.mirror && U.uWetness.value > 0.05 && U.uNight.value > 0.3 && info.agl < 220 && U.uMap.value < 0.5;
    U.uReflOn.value = mirrorOn ? (1 - sstep(90, 220, info.agl)) : 0;
    if (mirrorOn) {
      const gy = info.ground - this.frame.elev; const gl = this.frame.surface(origin.x, origin.z, gy).y - origin.y;
      const hide = [this.terrain, this.roadMesh, this.vergeMesh, this.globe?.group, ...this.cities.map(c => c.group.getObjectByName('plates')), this.clouds?.group].filter(Boolean);
      (this.mirror ??= new Mirror()).render(renderer, this, cam, gl, size, hide);
    }
    sync(); ms.mirror = performance.now() - t0 - ms.shadow;
    // ---- main pass
    const R = R_EARTH, h = Math.max(info.alt, 0);
    const n = near ?? clamp(info.agl * 0.08, 0.12, 2e6);
    const f = far ?? (Math.sqrt(Math.max(0, (R + h) ** 2 - R * R)) + 260000 + (h > 2e5 ? R : 0));
    const rt = this._rt(renderer, size);
    renderer.setRenderTarget(rt);
    const ac = renderer.autoClear; renderer.autoClear = false; renderer.setClearColor(0x000000, 1); renderer.clear(true, true, true);
    const ratio = f / n, split = ratio > 3e4 ? n * 3000 : null;
    cam.layers.enable(FAR_LAYER);
    if (split) {
      cam.near = split * 0.999; cam.far = f; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      renderer.render(this.scene, cam);
      renderer.clearDepth(); cam.layers.disable(FAR_LAYER);
      cam.near = n; cam.far = split; cam.updateProjectionMatrix();
      renderer.render(this.scene, cam);
    } else {
      cam.near = n; cam.far = f; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      renderer.render(this.scene, cam);
    }
    cam.layers.enable(FAR_LAYER);
    renderer.autoClear = ac;
    sync(); ms.main = performance.now() - t0 - ms.shadow - ms.mirror;
    // ---- post: bloom, flare (sun in frame), exposure, AgX
    const expo = (this.exposure ?? 1) * (this.expAuto ? this.altExposure(info.agl) : 1);
    let flare = 0; const sunScr = new THREE.Vector3();
    if (sunUp && (this.tod.flare ?? 0) > 0) {
      sunScr.copy(U.uSunDir.value).multiplyScalar(1e5).project(cam);
      const inF = fwd.dot(U.uSunDir.value) > 0.2 && Math.abs(sunScr.x) < 1.05 && Math.abs(sunScr.y) < 1.05 && sunScr.z < 1;
      flare = inF ? this.tod.flare * (1 - sstep(0.75, 1.05, Math.max(Math.abs(sunScr.x), Math.abs(sunScr.y)))) * (1 - U.uMap.value) * (1 - U.uWhite.value) : 0;
      sunScr.set(sunScr.x * 0.5 + 0.5, sunScr.y * 0.5 + 0.5, 0);
    }
    (this.post ??= new Post()).render(renderer, rt, size, { sharpen: rs < 0.99 ? 0.35 : 0, bloom: (this.tod.bloom ?? 0.06) * this.lightCfg.bloom, thresh: this.tod.bloomThresh ?? 1.2, flare, sunScr, exposure: expo, sat: this.tod.sat, contrast: this.tod.contrast });
    renderer.setRenderTarget(null);
    sync(); ms.post = performance.now() - t0 - ms.shadow - ms.mirror - ms.main;
    cam.position.copy(origin); cam.updateMatrixWorld();
    this.root.position.set(0, 0, 0);
    this.last = { ...info, near: n, far: f, split, ms, exposure: expo };
    return this.last;
  }
  _rt(renderer, size) {
    if (!this.rt || this.rt.width !== size.x || this.rt.height !== size.y) {
      this.rt?.dispose();
      this.rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    }
    return this.rt;
  }
  dispose() { this.rt?.dispose(); this.scene.traverse(o => { o.geometry?.dispose?.(); }); }
}

export async function create(opts = {}) {
  const [place, earth, pbr, env, envN, trees] = await Promise.all([opts.place ? loadPlace(opts.place) : null, opts.globe === false ? null : loadEarth(),
    opts.pbr === false ? null : loadPBR(), opts.env === false ? null : loadEnv(opts.envDay ?? 'modern_buildings'), opts.env === false ? null : loadEnv(opts.envNight ?? 'modern_buildings_night'), loadTrees()]);
  return new World(opts, place, earth, { pbr, env, envN, trees });
}
