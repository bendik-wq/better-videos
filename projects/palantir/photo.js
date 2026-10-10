// Archive photographs as 2.5D parallax plates (engine/parallax.js + engine/depth.py).
// Photojournalism look: monochrome / sepia / selenium print tones, a slow C1 move from the
// photo's own viewpoint, a sub-pixel deterministic gate weave and a breath of print density.
// Grain, halation and vignette come from the film finish.
//
// PX.photo is async and the runtime's get() is synchronous, so create() calls preloadPhotos()
// once for every photo shot (beats included) before the first frame. Each photo scene is built
// once and kept for the whole render (scene.persistent), only its overlay layer is rebuilt.
//
// Params: file, treatment ('bw' | 'sepia' | 'selenium'), move ('push' | 'pull' | 'lateral' | 'rise'),
// caption, source, optional amount / center / zoom / depth overrides.

const ARCHIVE = '/projects/palantir/assets/archive/';
const MAX_TEX = 2560; // long side: the plate never needs more at 1080p with these small moves

// Per-photo framing: center = photo point on the optical axis (u, v up), zoom crops off borders
// and printed captions, depth = relief. Chosen by looking at each print.
const FRAMING = {
  'cia-hq-aerial-1.jpg': { center: [0.6, 0.36], zoom: 1.35, depth: 0.42 },
  'cia-hq-aerial-2.jpg': { center: [0.56, 0.38], zoom: 1.3, depth: 0.42 },
  'census-tabulator-1939.jpg': { center: [0.52, 0.5], zoom: 1.12, depth: 0.5 },
  'census-keypunch-operators-1940.jpg': { center: [0.5, 0.58], zoom: 1.22, depth: 0.55 },
  'pentagon-aerial-2003.jpg': { center: [0.5, 0.45], zoom: 1.08, depth: 0.45 },
  'pentagon-aerial-1973.jpg': { center: [0.47, 0.5], zoom: 1.16, depth: 0.45 },
  'ibm704-langley-1957.jpg': { center: [0.42, 0.5], zoom: 1.06, depth: 0.5 },
  'ibm-edpm-1957.jpg': { center: [0.5, 0.48], zoom: 1.06, depth: 0.5 },
};
const FALLBACK = 'ibm704-ames-1958.jpg';

const built = new Map(); // shot.id -> { scene, ph, move }

async function exists(url) { try { const r = await fetch(url, { method: 'HEAD' }); return r.ok; } catch { return false; } }
function loadImg(url) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`[photo] cannot load ${url}`)); i.src = url; }); }
// downscale into a canvas so eight 4K prints don't sit in (llvmpipe) GPU memory at full size
function shrink(img) {
  const s = Math.min(1, MAX_TEX / Math.max(img.width, img.height)); if (s >= 1) return img;
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height); return c;
}

export async function preloadPhotos(H, ctx, shots) {
  const { THREE, PX, C } = H;
  const list = shots.filter(s => s.set === 'photo');
  if (!list.length) return;
  // Prime THREE.Cache with downscaled images under the exact URLs parallax.js asks for.
  const prevCache = THREE.Cache.enabled; THREE.Cache.enabled = true;
  try {
    for (const s of list) {
      const P0 = s.params || {};
      let file = P0.file;
      if (!(await exists(ARCHIVE + file))) { console.error(`[scene] photo ${file} missing, using ${FALLBACK}`); file = FALLBACK; }
      const url = ARCHIVE + file, stem = file.replace(/\.(jpe?g|png)$/i, '');
      for (const u of [url, `${ARCHIVE}depth/${stem}.depth.png`, `${ARCHIVE}depth/${stem}.plate.jpg`])
        if (THREE.Cache.get(u) === undefined) THREE.Cache.add(u, /depth\.png$/.test(u) ? await loadImg(u) : shrink(await loadImg(u)));
      const F = { ...(FRAMING[file] ?? { center: [0.5, 0.5], zoom: 1.05, depth: 0.5 }) };
      if (P0.center) F.center = P0.center; if (P0.zoom) F.zoom = P0.zoom; if (P0.depth) F.depth = P0.depth;
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
      const ph = await PX.photo(scene, url, { treatment: P0.treatment ?? 'bw', mm: 50, dist: 10, depth: F.depth, center: F.center, zoom: F.zoom });
      const kind = PX.moves[P0.move] ? P0.move : 'push';
      // amounts a touch under the presets: slow and smooth; long shots travel no farther
      const amount = P0.amount ?? { push: 0.15, pull: 0.13, lateral: 0.03, rise: 0.025 }[kind];
      const move = PX.moves[kind](ph, { amount, dir: P0.dir ?? 1, opts: { duration: s.duration, accel: 0.4, decel: 0.45 } });
      built.set(s.id, { scene, ph, move, file });
    }
  } finally { THREE.Cache.clear(); THREE.Cache.enabled = prevCache; }
}

export function makePhoto(H) {
  const { THREE, K, C, caption, sourceLine } = H;
  return {
    photo(ctx, shot) {
      const pre = built.get(shot.id);
      if (!pre) throw new Error(`[scene] photo ${shot.id} was not preloaded`);
      const { scene, ph, move } = pre; scene.persistent = true;
      const camera = new THREE.PerspectiveCamera(C.mmToFov(50), ctx.width / ctx.height, 0.05, 100);
      const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;display:none'; ctx.overlay.appendChild(layer);
      const P0 = shot.params;
      const cap = caption(layer, P0.caption, 'left:5.5%;top:7.5%;text-shadow:0 0 18px #000,0 0 4px #000');
      const src = sourceLine(layer, P0.source); if (src) src.style.textShadow = '0 0 14px #000';
      const mats = [ph.fg.material, ph.plate.material];
      const seed = [...shot.id].reduce((a, c) => a + c.charCodeAt(0), 0);
      const W = ctx.width, Hh = ctx.height;
      return {
        scene, camera, layer,
        update(t, p) {
          move(camera, p, t);
          // gate weave: sub-pixel, low-frequency, a pure function of t (no frame-to-frame jitter)
          const px = W / 1920, n = (f, ph0) => Math.sin(t * f + ph0 + seed);
          const wx = px * (0.45 * n(1.31, 0.4) + 0.2 * n(2.07, 1.9)), wy = px * (0.55 * n(1.13, 2.6) + 0.25 * n(1.87, 0.7));
          camera.setViewOffset(W, Hh, wx, wy, W, Hh);
          // print density breathes ~1 %: the projector lamp, not a flicker
          const ex = 1 + 0.008 * n(0.9, 3.1) + 0.004 * n(2.3, 0.2);
          for (const m of mats) m.uniforms.exposure.value = ex;
          if (cap) { cap.style.opacity = 1; K.typeOn(cap, P0.caption, K.range(t, 0.45, 1.6)); }
          if (src) src.style.opacity = K.range(t, 0.9, 1.6) * 0.9;
        },
      };
    },
  };
}
