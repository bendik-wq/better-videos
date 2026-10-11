// World: assembles a place (or a procedural one), terrain, sky, clouds, globe, roads, cities,
// props, vehicles; owns the shared uniforms and renders with a floating origin and a two-pass
// depth partition (near / far) so one camera can go from a kerb to orbit without z-fighting.
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

const FAR_LAYER = 1;

export class World {
  constructor(opts, place, earth) {
    this.opts = opts; this.place = place; this.earth = earth;
    this.frame = place?.frame ?? new Frame({ lat: opts.lat ?? 40, lon: opts.lon ?? -100, elev: opts.elev ?? 0 });
    this.U = makeUniforms(this.frame);
    this.scene = new THREE.Scene(); this.root = new THREE.Group(); this.root.name = 'world'; this.scene.add(this.root);
    this.mods = []; this.roads = []; this.cityRoads = []; this.lamps = []; this.trees = []; this.cities = []; this.extra = [];
    this.globeH = opts.globeH ?? -40; // globe surface relative to the anchor's elevation
    this.seed = opts.seed ?? 1;
    this.tod = TOD[opts.tod ?? 'blue'];
    this.built = false;
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
    // sky + globe (far pass only)
    this.sky = buildSky(this); this.sky.layers.set(FAR_LAYER); this.scene.add(this.sky); // not in root: follows the camera
    if (this.earth && o.globe !== false) { this.globe = buildGlobe(this, this.earth); this.add(this.globe.group, { far: true }); }
    // terrain
    this.terrain = buildTerrain(this, o.terrain ?? {}); this.root.add(this.terrain);
    // roads: merged surfaces (one draw), verges (terrain material), barriers
    const surf = [], verge = [], bar = [];
    for (const r of [...this.roads, ...this.cityRoads]) { const g = roadGeometries(this, r); surf.push(g.surface); verge.push(...g.verges); if (g.barrier) bar.push(g.barrier); }
    if (surf.length) { const m = new THREE.Mesh(mergeGeometries(surf), roadMaterial(this)); m.frustumCulled = false; m.name = 'roads'; this.root.add(m); }
    if (verge.length) { const m = new THREE.Mesh(mergeGeometries(verge), terrainMaterial(this, { polygonOffset: -1 })); m.frustumCulled = false; m.name = 'verges'; this.root.add(m); }
    if (bar.length) { const m = new THREE.Mesh(mergeGeometries(bar), barrierMaterial(this)); m.frustumCulled = false; this.root.add(m); }
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
    this.built = true;
    return this;
  }

  // ---- per-frame state: { t, tod (name | object), todMix: [a, b, k], map, flat, exposure, lightsFar, head: { pos, dir, on } }
  setState(s = {}) {
    const U = this.U;
    if (s.tod) this.tod = typeof s.tod === 'string' ? TOD[s.tod] : s.tod;
    applyTod(U, this.tod);
    if (s.t !== undefined) U.uTime.value = s.t;
    U.uMap.value = s.map ?? 0; U.uFlat.value = s.flat ?? 0; U.uLightsFar.value = s.lightsFar ?? 0; this.cloudFog = s.cloudFog ?? 0;
    this.exposure = s.exposure ?? this.tod.exposure;
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

  render(renderer, cam, { near = null, far = null } = {}) {
    if (!this.built) this.build();
    const U = this.U, info = this.cameraInfo(cam);
    const origin = cam.position.clone();
    U.uOrigin.value.copy(origin); U.uCamAlt.value = info.alt;
    { // per-frame constants for the sky / haze shaders
      const up = this.frame.upAt(origin, U.uUpCam.value), sd = U.uSunDir.value; const h = Math.max(info.alt, 0);
      U.uSunH.value.copy(sd).addScaledVector(up, -sd.dot(up)); if (U.uSunH.value.lengthSq() < 1e-10) U.uSunH.value.set(1, 0, 0); U.uSunH.value.normalize();
      U.uDip.value = Math.acos(clamp(R_EARTH / (R_EARTH + h), 0, 1)); U.uSpace.value = sstep(18000, 110000, h);
      U.uLimbW.value = clamp(70000 / Math.sqrt(Math.max(h * (2 * R_EARTH + h), 1)), 0.002, 0.05);
    }
    // in-cloud fog: physical density at the camera, or a keyed whiteout (state.cloudFog 0..1) for a
    // designed pass through the deck; whichever is denser
    U.uCloudFog.value = this.clouds ? this.clouds.fogAt(origin.x, origin.z, info.alt - this.frame.elev, U.uTime.value) : 0;
    U.uWhite.value = this.cloudFog ?? 0;
    this.clouds?.setCamera(info.alt - this.frame.elev);
    U.uLightsFar.value = Math.max(U.uLightsFar.value, sstep(2500, 40000, info.agl));
    U.uCloudCol.value.copy(U.uCloudLit.value).multiplyScalar(0.85).add(U.uGlow.value.clone().multiplyScalar(0.12)).add(U.uCityGlow.value.clone().multiplyScalar(0.25));
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    U.uPx.value = size.y / (2 * Math.tan(cam.fov * Math.PI / 360));
    // floating origin: camera at 0, world shifted
    this.root.position.copy(origin).negate(); cam.position.set(0, 0, 0);
    // lamp tiles beyond ~1.4 km: hidden (sub-pixel poles)
    for (const g of this.lampTiles ?? []) g.visible = !this.lampsOff && g.userData.c.distanceTo(origin) < 1400 + 450 && this.U.uMap.value < 0.99;
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
    renderer.setRenderTarget(null);
    renderer.toneMappingExposure = this.exposure ?? 1;
    this._present(renderer);
    cam.position.copy(origin); cam.updateMatrixWorld();
    this.root.position.set(0, 0, 0);
    this.last = { ...info, near: n, far: f, split };
    return this.last;
  }
  _rt(renderer, size) {
    if (!this.rt || this.rt.width !== size.x || this.rt.height !== size.y) {
      this.rt?.dispose();
      this.rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: { tSrc: { value: this.rt.texture } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
        fragmentShader: 'uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture(tSrc, vUv).rgb, 1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
        depthTest: false, depthWrite: false, toneMapped: true,
      }));
      this.quad.frustumCulled = false; this.quadScene = new THREE.Scene(); this.quadScene.add(this.quad); this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    return this.rt;
  }
  _present(renderer) { renderer.render(this.quadScene, this.quadCam); }
  dispose() { this.rt?.dispose(); this.scene.traverse(o => { o.geometry?.dispose?.(); }); }
}

export async function create(opts = {}) {
  const [place, earth] = await Promise.all([opts.place ? loadPlace(opts.place) : null, opts.globe === false ? null : loadEarth()]);
  return new World(opts, place, earth);
}
