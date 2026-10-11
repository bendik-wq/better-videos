// Places: baked regional data (assets/world/places/<name>/, see bake.py) -> textures + DEM samplers.
// Earth: global textures (assets/world/earth/). Loaded once per page and cached.
import * as THREE from 'three';
import { Frame, sstep } from './core.js';

const BASE = '/assets/world/';
const cache = {};
const texLoader = new THREE.TextureLoader();
function tex(url, { srgb = true, repeat = false } = {}) {
  return cache[url] ??= texLoader.loadAsync(url).then(t => {
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
    t.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
  });
}
async function demOf(url) {
  return cache[url] ??= (async () => {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0);
    const px = x.getImageData(0, 0, bmp.width, bmp.height).data, n = bmp.width * bmp.height, h = new Float32Array(n);
    for (let i = 0; i < n; i++) h[i] = (px[i * 4] * 256 + px[i * 4 + 1]) / 10 - 500;
    return { w: bmp.width, h: bmp.height, data: h };
  })();
}
// bilinear sample of an equirectangular grid over bbox [w, s, e, n]; null outside
function sampler(grid, bbox) {
  const [w, s, e, n] = bbox, W = grid.w, H = grid.h, d = grid.data;
  return (lat, lon) => {
    const u = (lon - w) / (e - w) * (W - 1), v = (n - lat) / (n - s) * (H - 1);
    if (u < 0 || v < 0 || u > W - 1 || v > H - 1) return null;
    const x0 = Math.min(W - 2, Math.floor(u)), y0 = Math.min(H - 2, Math.floor(v)), fx = u - x0, fy = v - y0, i = y0 * W + x0;
    return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + W] * (1 - fx) + d[i + W + 1] * fx) * fy;
  };
}

export async function loadEarth() {
  const [day, night, clouds, map] = await Promise.all([
    tex(BASE + 'earth/day.jpg'), tex(BASE + 'earth/night.jpg', { srgb: false }), tex(BASE + 'earth/clouds.jpg', { srgb: false }), tex(BASE + 'earth/map.png', { srgb: false })]);
  for (const t of [day, night, clouds, map]) t.wrapS = THREE.RepeatWrapping;
  return { day, night, clouds, map };
}

// A place: { frame, meta, image, night, map, height(lat, lon) metres ASL, bbox }
export async function loadPlace(name) {
  return cache['place:' + name] ??= (async () => {
    const dir = BASE + 'places/' + name + '/';
    const meta = await (await fetch(dir + 'place.json')).json();
    const [image, night, map, demR, demL] = await Promise.all([tex(dir + 'image.jpg'), tex(dir + 'night.jpg', { srgb: false }), tex(dir + 'map.png', { srgb: false }),
      demOf(dir + meta.region.dem), demOf(dir + meta.local.dem)]);
    const sR = sampler(demR, meta.region.bbox), sL = sampler(demL, meta.local.bbox);
    const lb = meta.local.bbox, mLat = (lb[3] - lb[1]) * 0.12, mLon = (lb[2] - lb[0]) * 0.12;
    const height = (lat, lon) => {
      const r = sR(lat, lon) ?? meta.elev;
      const l = sL(lat, lon); if (l === null) return r;
      // fade the fine DEM out towards the edge of its box
      const k = Math.min(sstep(0, mLat, lat - lb[1]), sstep(0, mLat, lb[3] - lat), sstep(0, mLon, lon - lb[0]), sstep(0, mLon, lb[2] - lon));
      return r + (l - r) * k;
    };
    return { name, meta, frame: new Frame({ lat: meta.lat, lon: meta.lon, elev: meta.elev }), image, night, map, height, bbox: meta.region.bbox };
  })();
}
