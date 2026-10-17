// Panama archive and satellite sets.
//   archive    a public-domain photograph as a paper print on the warm desk: depth parallax inside the print
//              (engine/parallax.js + engine/depth.py maps), a gentle Ken Burns move of the print, caption and credit.
//              params: photo (stem in assets/archive), caption, credit, date, move ('push'|'pull'|'lateral'|'rise'),
//              amount, center [u, v], depth, tilt (deg), treatment ('warm' | 'bw')
//   satellite  params.mode:
//              'wipe'   Sentinel-2 true colour of Gatun Lake, high water (5 Jan 2026, 88.82 ft) vs low water
//                       (3 Jun 2023, 80.09 ft); a divider slides between the dates. params: a, b (dates), pins
//              'queue'  NASA Earth Observatory's Landsat 8 image of 18 Aug 2023: ships at anchor off the Pacific
//                       entrance; rings pop on ships; counters give the sourced queue sizes (never our own count)
// Credits for every file: projects/panama/CREDITS.md.
import * as THREE from 'three';
import * as PX from '/engine/parallax.js';
import * as G from './graphics-kit.js';

const { P, F, E, clamp, lerp, range, sstep, TAU } = G;
const ARCH = '/projects/panama/assets/archive/';
// verbatim catalogue titles, shortened only where marked […]
export const PHOTOS = {
  'gamboa-blast-1913': { caption: 'Blowing up Gamboa Dyke: general view from west hill showing blast. Oct. 10, 1913', credit: 'HANDY & HALLEN · BUCKNELL UNIVERSITY SPECIAL COLLECTIONS (DAVIS_B019_0541) · PUBLIC DOMAIN', center: [0.48, 0.5] },
  'gamboa-pipes-1913': { caption: 'Gamboa Dyke: flooding of Culebra Cut thru valve pipes. Oct. 1, 1913', credit: 'HANDY & HALLEN · BUCKNELL UNIVERSITY SPECIAL COLLECTIONS (DAVIS_B019_0540) · PUBLIC DOMAIN', center: [0.55, 0.5] },
  'gatun-dam-1910': { caption: 'Gatun Dam construction, Panama Canal, 1910', credit: 'LIBRARY OF CONGRESS, PRINTS & PHOTOGRAPHS (2021640026) · NO KNOWN RESTRICTIONS', center: [0.5, 0.55] },
  'gatun-spillway-1913': { caption: 'At the foot of the spillway at Gatun Dam, Panama Canal, 11 June 1913', credit: 'KEYSTONE VIEW CO. · LIBRARY OF CONGRESS (96520535) · NO KNOWN RESTRICTIONS', center: [0.5, 0.6] },
  'culebra-flooded': { caption: 'Culebra Cut after flooding, showing slides (c. 1910–1914)', credit: 'DETROIT PUBLISHING CO. · LIBRARY OF CONGRESS (2016814013) · NO KNOWN RESTRICTIONS', center: [0.5, 0.45] },
  'cucaracha-slide-1913': { caption: 'Culebra Cut near Culebra, showing Cucaracha land slide of 47 acres at the left, 1913', credit: 'LIBRARY OF CONGRESS, PRINTS & PHOTOGRAPHS (2021639869) · NO KNOWN RESTRICTIONS', center: [0.5, 0.5] },
  'gatun-locks-1910': { caption: 'Gatun upper locks, looking north from east bank, March 15, 1910', credit: 'KEYSTONE VIEW CO. · LIBRARY OF CONGRESS (94511461) · NO KNOWN RESTRICTIONS', center: [0.5, 0.5] },
  'gatun-monolith-1912': { caption: 'North end of lower lock showing steel monolith forms on tracks, Gatun, 1912', credit: 'KEYSTONE VIEW CO. · LIBRARY OF CONGRESS (96520541) · NO KNOWN RESTRICTIONS', center: [0.5, 0.5] },
};
// warm sepia, lifted: never crushed blacks (bright mode)
const WARM = { mode: 1, contrast: 1.12, tintLo: [0.40, 0.31, 0.22], tintHi: [1.03, 0.96, 0.84] };

export default function makeArchive(H) {
  const set = async (ctx, shot, paint, cam) => { await G.loadFonts(); return G.canvasSet(H, ctx, shot, paint, cam); };
  const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`cannot load ${src}`)); i.src = src; });

  // ---------------------------------------------------------------- archive
  async function archive(ctx, shot) {
    const Pm = shot.params ?? {}, stem = Pm.photo ?? 'gamboa-blast-1913', meta = PHOTOS[stem] ?? {}, D = shot.duration ?? 6;
    const url = ARCH + stem + '.jpg', probe = await img(url), a = probe.width / probe.height;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, a, 0.05, 100);
    const ph = await PX.photo(scene, url, { mm: Pm.mm ?? 50, aspect: a, depth: Pm.depth ?? 0.45, center: Pm.center ?? meta.center ?? [0.5, 0.5], treatment: Pm.treatment === 'bw' ? 'bw' : WARM, margin: 1.1 });
    const move = (PX.moves[Pm.move ?? 'push'] ?? PX.moves.push)(ph, { amount: Pm.amount, opts: { duration: D } });
    // print size: fit 1460 x 790, keep the photo's aspect
    let pw = 1440, phh = pw / a; if (phh > 730) { phh = 730; pw = phh * a; }
    const tilt = (Pm.tilt ?? -0.7) * Math.PI / 180, caption = Pm.caption ?? meta.caption ?? '', credit = Pm.credit ?? meta.credit ?? '';
    const r = ctx.renderer;
    const inst = await set(ctx, shot, (g, t, p, k) => {
      // render the parallax photo (GL) at its own aspect, then place it as a print
      move(camera, clamp(t / D), t); camera.aspect = a; camera.updateProjectionMatrix();
      const tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping; r.setRenderTarget(null); r.render(scene, camera); r.toneMapping = tm;
      k.view(0.3); G.paper(g, { tone: '#f3ead8' });
      k.view(1);
      const cx = 960, cy = caption ? 455 : 520, B = 28;
      g.save(); g.translate(cx, cy); g.rotate(tilt);
      G.shadow(g, 1.6); g.fillStyle = '#fbf7ef'; g.fillRect(-pw / 2 - B, -phh / 2 - B, pw + 2 * B, phh + 2 * B + 34); G.noShadow(g);
      G.grain(g, pw + 2 * B, phh + 2 * B + 34, 0.5, -pw / 2 - B, -phh / 2 - B);
      g.drawImage(r.domElement, -pw / 2, -phh / 2, pw, phh);
      // lift the floor and warm the paper (bright treatment): screen a dark umber, multiply a cream
      g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgb(34,26,16)'; g.fillRect(-pw / 2, -phh / 2, pw, phh);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = '#fbf1dc'; g.fillRect(-pw / 2, -phh / 2, pw, phh);
      g.globalCompositeOperation = 'source-over'; G.grain(g, pw, phh, 0.35, -pw / 2, -phh / 2);
      g.strokeStyle = 'rgba(80,60,30,0.25)'; g.lineWidth = 2; g.strokeRect(-pw / 2, -phh / 2, pw, phh);
      if (Pm.date ?? meta.date) G.text(g, Pm.date ?? meta.date, pw / 2, phh / 2 + B + 18, { size: 22, weight: 400, fam: F.serif, style: 'italic', color: P.inkSoft, align: 'right' });
      g.restore();
      // caption card (taped label) and credit
      if (caption) {
        const lines = G.wrap(g, caption, 1380, 44, 400, F.serif, 'italic');
        const kc = range(t, 0.5, 1.2), h = 36 + lines.length * 50 + 34, y0 = Math.min(1040 - h, cy + phh / 2 + 6);
        G.card(g, 210, y0, 1500, h, { r: 10, fill: P.white, lift: 1, alpha: clamp(kc * 2), grainA: 0.25 });
        g.fillStyle = P.red; g.fillRect(210, y0, 10 * clamp(kc * 2), h);
        lines.forEach((l, i) => G.text(g, l, 250, y0 + 64 + i * 50, { size: 44, weight: 400, fam: F.serif, style: 'italic', color: P.ink, alpha: E.outCubic(range(t, 0.6 + i * 0.1, 1.2 + i * 0.1)) }));
      }
      k.flat(); G.source(g, credit, range(t, 0.8, 1.6), { size: 16, y: 1066 });
    }, { push: 0.035, dx: 18, dy: 6 });
    const d0 = inst.dispose; inst.dispose = () => { ph.dispose(); d0(); };
    return inst;
  }

  // ---------------------------------------------------------------- satellite
  let META = null; const meta = () => META ??= fetch('/projects/panama/assets/satellite/meta.json').then(r => r.json());
  async function satellite(ctx, shot) {
    const Pm = shot.params ?? {}, mode = Pm.mode ?? 'wipe', D = shot.duration ?? 8;
    if (mode === 'queue') return queue(ctx, shot);
    const M = await meta(), A = Pm.a ?? '2026-01-05', B = Pm.b ?? '2023-06-03';
    const [ia, ib] = await Promise.all([img(`/projects/panama/assets/satellite/${A}.jpg`), img(`/projects/panama/assets/satellite/${B}.jpg`)]);
    const ma = M[A], mb = M[B], aw = ia.width, ah = ia.height;
    const fmtD = (d) => { const [y, m, dd] = d.split('-').map(Number); return `${dd} ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][m - 1]} ${y}`; };
    const t0 = G.cue(shot, Pm.at, 1.0);
    // cover the frame
    const sc = Math.max(1920 / aw, 1080 / ah) * 1.04, W = aw * sc, Hh = ah * sc, X0 = 960 - W / 2, Y0 = 540 - Hh / 2;
    const pins = Pm.pins ?? ['Gatun Locks', 'Barro Colorado Island'];
    return set(ctx, shot, (g, t, p, k) => {
      k.view(1);
      // divider: right edge -> far left -> centre, eased (the wipe)
      const u = range(t, t0, t0 + Math.max(2.5, D - t0 - 1.2));
      const div = u < 0.55 ? lerp(1860, 300, E.inOutCubic(u / 0.55)) : lerp(300, 1040, E.inOutCubic((u - 0.55) / 0.45));
      g.filter = 'brightness(1.16) saturate(1.18) contrast(1.04)';
      g.drawImage(ia, X0, Y0, W, Hh);
      g.save(); g.beginPath(); g.rect(div, -200, 2400, 1500); g.clip(); g.drawImage(ib, X0, Y0, W, Hh); g.restore();
      g.filter = 'none';
      // a lifted white sky wash at the top keeps type readable on the jungle
      const gr = g.createLinearGradient(0, -100, 0, 300); gr.addColorStop(0, 'rgba(246,241,231,0.7)'); gr.addColorStop(1, 'rgba(246,241,231,0)'); g.fillStyle = gr; g.fillRect(-200, -200, 2400, 520);
      // pins
      pins.forEach((n, i) => { const q = ma.pins?.[n]; if (!q) return; const x = X0 + q[0] * W, y = Y0 + q[1] * Hh, kk = range(t, 0.6 + i * 0.3, 1.1 + i * 0.3); G.pin(g, x, y, t, kk, { color: P.ink, pulse: false, r: 8 }); G.pill(g, n, x + 22, y, { size: 24, k: kk }); });
      // the divider
      g.save(); G.shadow(g, 0.8); g.fillStyle = P.white; g.fillRect(div - 3, -200, 6, 1500); g.restore();
      G.pill(g, `−${(ma.gatun_ft - mb.gatun_ft).toFixed(1)} FT`, div, 760, { size: 30, align: 'center', fill: P.red, color: P.white, weight: 900, k: range(t, t0, t0 + 0.4) });
      k.flat();
      const card = (x, y, date, ft, align, k2) => {
        if (k2 <= 0) return; const w = 470, x0 = align === 'right' ? x - w : x;
        G.card(g, x0, y, w, 132, { r: 18, lift: 1, alpha: clamp(k2 * 2), grainA: 0 });
        G.text(g, date, x0 + 26, y + 54, { size: 40, weight: 900, color: P.ink, alpha: k2 });
        G.text(g, `GATUN LAKE ${ft.toFixed(1)} FT`, x0 + 28, y + 100, { size: 26, weight: 800, color: align === 'right' ? P.red : P.waterDark, alpha: k2 });
      };
      card(70, 70, fmtD(A), ma.gatun_ft, 'left', range(t, 0.2, 0.7) * sstep(140, 560, div));
      card(1850, 70, fmtD(B), mb.gatun_ft, 'right', range(t, t0 + 0.2, t0 + 0.7) * sstep(1700, 1380, div));
      const src = `CONTAINS MODIFIED COPERNICUS SENTINEL DATA ${A.slice(0, 4)}, ${B.slice(0, 4)} · LAKE LEVELS: ACP`;
      const sw = G.measure(g, src, 17, 500, F.mono, 0.1); g.save(); G.rr(g, 1856 - sw - 20, 1014, sw + 36, 38, 8); g.fillStyle = 'rgba(255,253,248,0.88)'; g.fill(); g.restore();
      G.source(g, src, 1, { size: 17, y: 1040 });
    }, { push: 0.05, dx: 20, dy: 8 });
  }

  async function queue(ctx, shot) {
    const Pm = shot.params ?? {}, D = shot.duration ?? 8;
    const im = await img('/projects/panama/assets/satellite/nasa-queue-2023-08-18.jpg');
    const ships = (await (await fetch('/projects/panama/assets/satellite/ships.json')).json()).ships;
    const t0 = G.cue(shot, Pm.at, 0.8);
    const counters = Pm.counters ?? [
      { value: 163, label: 'SHIPS WAITING · 9 AUG 2023', sub: 'PEAK, BOTH ENDS · ACP', red: true },
      { value: 90, label: 'A NORMAL DAY', sub: 'ABOUT 90 · NASA EARTH OBSERVATORY' },
    ];
    const ph = 900, pw = ph * im.width / im.height;
    return set(ctx, shot, (g, t, p, k) => {
      k.view(0.3); G.paper(g);
      // the print, with its own slow push inside
      k.view(1);
      const x0 = 90, y0 = 90;
      G.card(g, x0 - 18, y0 - 18, pw + 36, ph + 36, { r: 6, fill: '#fbf7ef', lift: 1.5 });
      g.save(); g.beginPath(); g.rect(x0, y0, pw, ph); g.clip();
      const z = 1 + 0.08 * E.inOutSine(clamp(t / D)), fx = x0 + pw * 0.6, fy = y0 + ph * 0.6;
      g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
      g.filter = 'brightness(1.2) saturate(1.15)'; g.drawImage(im, x0, y0, pw, ph); g.filter = 'none';
      ships.forEach(([u, v], i) => {
        const tt = t0 + i * Math.min(0.06, (D * 0.5) / ships.length), kk = range(t, tt, tt + 0.35); if (kk <= 0) return;
        const x = x0 + u * pw, y = y0 + v * ph, r0 = 13 * (1 + 0.6 * (1 - E.outBack(kk)));
        g.strokeStyle = `rgba(255,210,63,${0.95 * clamp(kk * 2)})`; g.lineWidth = 3.5 / z; g.beginPath(); g.arc(x, y, r0 / z, 0, TAU); g.stroke();
      });
      g.restore();
      G.text(g, 'PACIFIC ENTRANCE · 18 AUG 2023', x0 + 24, y0 + 50, { size: 24, weight: 800, color: P.white, track: 0.06 });
      // counters
      const cx = x0 + pw + 80;
      counters.forEach((c, i) => {
        const tc = G.cue(shot, c.word, t0 + 0.4 + i * 1.6), kk = E.outExpo(range(t, tc, tc + 1.4)), y = 330 + i * 330;
        if (t < tc - 0.1) return;
        G.text(g, String(Math.round(c.value * kk)), cx, y, { size: i ? 120 : 190, weight: 900, color: c.red ? P.red : P.ink });
        G.text(g, c.label, cx + 4, y + 56, { size: 30, weight: 800, alpha: range(t, tc + 0.3, tc + 0.9) });
        G.text(g, c.sub, cx + 4, y + 94, { size: 20, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.1, alpha: range(t, tc + 0.5, tc + 1.1) });
      });
      G.text(g, 'RINGS MARK SOME OF THE SHIPS AT ANCHOR', cx + 4, 960, { size: 18, weight: 500, fam: F.mono, color: P.inkSoft, track: 0.08, alpha: range(t, t0 + 1, t0 + 1.6) });
      k.flat(); G.source(g, 'NASA EARTH OBSERVATORY IMAGE BY WANMEI LIANG, USING LANDSAT DATA FROM THE USGS', range(t, 0.6, 1.4), { size: 16, y: 1066 });
    }, { push: 0.03 });
  }

  return { archive, satellite };
}
