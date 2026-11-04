// engine/sea/fft.js: a deterministic FFT ocean (Tessendorf 2001) computed on the CPU as a pure
// function of t, in three cascades (long swell, wind sea, capillary detail).
//
//   const S = new Spectrum({ wind: 7, dir: 30, hs: 0.9, chop: 0.85, seed: 3 });
//   S.update(t);               // fills S.cascades[i].disp (Dx, h, Dz, J) and .slope (sx, sz, sx^2, sz^2)
//   S.height(x, z)             // CPU height (m) at a world point, for floating ships
//   S.cascades[i].tD / .tS     // THREE.DataTextures (float RGBA, mipmapped) for the shaders
//
// h(k, t) = h0(k) e^{i w t} + conj(h0(-k)) e^{-i w t}, w = sqrt(g k tanh(k d)); h0 from a seeded
// Gaussian (K.rng-style mulberry32), so every frame is a pure function of (t, params): no state.
// Spectrum: JONSWAP (fetch-limited wind sea) with a cos^2s directional spread, plus an optional swell
// peak. Each cascade only keeps the wavenumbers in its own band, so the bands sum to the full spectrum
// with no double counting. The total is normalised so the significant wave height is exactly `hs`.
// Displacement convention: x' = x + chop * sum(i k/|k| h): crests pinch, troughs widen (J < 1 at crests).
import * as THREE from 'three';

const G = 9.81;
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { const u = Math.max(1e-9, r()), v = r(); return [Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v)]; }

// in-place radix-2 FFT plan (inverse, unnormalised: sum X_k e^{+i 2 pi k n / N})
function plan(N) {
  const bits = Math.log2(N), rev = new Uint32Array(N);
  for (let i = 0; i < N; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
  const cs = new Float32Array(N / 2), sn = new Float32Array(N / 2);
  for (let i = 0; i < N / 2; i++) { cs[i] = Math.cos(2 * Math.PI * i / N); sn[i] = Math.sin(2 * Math.PI * i / N); }
  return { N, rev, cs, sn };
}
function fft1(P, re, im, off, stride) {
  const { N, rev, cs, sn } = P;
  for (let i = 0; i < N; i++) { const j = rev[i]; if (j > i) { const a = off + i * stride, b = off + j * stride; let t = re[a]; re[a] = re[b]; re[b] = t; t = im[a]; im[a] = im[b]; im[b] = t; } }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1, step = N / size;
    for (let i = 0; i < N; i += size) for (let j = 0; j < half; j++) {
      const k = j * step, wr = cs[k], wi = sn[k];
      const a = off + (i + j) * stride, b = off + (i + j + half) * stride;
      const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
      re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
  }
}
function fft2(P, re, im) { const N = P.N; for (let r = 0; r < N; r++) fft1(P, re, im, r * N, 1); for (let c = 0; c < N; c++) fft1(P, re, im, c, N); }

export const DEFAULTS = { wind: 7, dir: 35, hs: 0.9, chop: 1.05, seed: 7, fetch: 120000, spread: 2.5, swell: { hs: 0.35, dir: 120, period: 9 }, depth: 80,
  sizes: [420, 61, 8.3], N: [128, 128, 128] };

export class Spectrum {
  constructor(o = {}) {
    this.o = { ...DEFAULTS, ...o, swell: o.swell === null ? null : { ...DEFAULTS.swell, ...(o.swell ?? {}) } };
    const O = this.o;
    this.cascades = O.sizes.map((L, ci) => {
      const N = O.N[ci] ?? 128, n2 = N * N;
      return { L, N, P: plan(N), h0r: new Float32Array(n2), h0i: new Float32Array(n2), w: new Float32Array(n2), kx: new Float32Array(n2), kz: new Float32Array(n2),
        bufs: Array.from({ length: 8 }, () => new Float32Array(n2)), disp: new Float32Array(n2 * 4), slope: new Float32Array(n2 * 4) };
    });
    // band edges in k: cascade i keeps kLo_i < |k| <= kLo_{i+1}
    const kLo = O.sizes.map((L, i) => i === 0 ? 0 : 2 * Math.PI / L * 6);
    // JONSWAP parameters (Hasselmann 1973) from wind and fetch
    const U = O.wind, X = O.fetch, xt = G * X / (U * U);
    const alpha = 0.076 * Math.pow(xt, -0.22), wp = 22 * (G * G / (U * X)) ** (1 / 3), gam = 3.3;
    const dirW = O.dir * Math.PI / 180;
    const S = (kx, kz) => {
      const k = Math.hypot(kx, kz); if (k < 1e-6) return 0;
      const w = Math.sqrt(G * k * Math.tanh(Math.min(k * O.depth, 20))), dwdk = G / (2 * w);
      const sig = w <= wp ? 0.07 : 0.09, r = Math.exp(-((w - wp) ** 2) / (2 * sig * sig * wp * wp));
      let Sw = alpha * G * G / w ** 5 * Math.exp(-1.25 * (wp / w) ** 4) * Math.pow(gam, r);
      const th = Math.atan2(kz, kx) - dirW, c = Math.cos(th);
      let D = c > 0 ? Math.pow(c, 2 * O.spread) : 0.0; // waves travel downwind (no backward lobe)
      D *= (O.spread + 1) / (Math.PI); // approximately normalised
      let val = Sw * D * dwdk / k;
      // capillary damping (no ripples < 2 cm)
      val *= Math.exp(-((k * 0.012) ** 2));
      if (O.swell) { // a narrow swell peak
        const ws = 2 * Math.PI / O.swell.period, ths = Math.atan2(kz, kx) - O.swell.dir * Math.PI / 180, cs = Math.cos(ths);
        const Ss = Math.exp(-((w - ws) ** 2) / (2 * (0.06 * ws) ** 2)) * (cs > 0 ? Math.pow(cs, 40) : 0);
        val += this._swellK * Ss * dwdk / k;
      }
      return val;
    };
    this._swellK = 0;
    // textures
    for (const c of this.cascades) {
      const mk = (data) => { const t = new THREE.DataTexture(data, c.N, c.N, THREE.RGBAFormat, THREE.FloatType); t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t; };
      c.tD = mk(c.disp); c.tS = mk(c.slope);
    }
    // seed amplitudes, then normalise wind sea and swell separately to their Hs
    const gen = (withSwell) => {
      let m0 = 0;
      for (let ci = 0; ci < this.cascades.length; ci++) {
        const c = this.cascades[ci], { N, L } = c, dk = 2 * Math.PI / L, r = mulberry(O.seed * 1000 + ci * 7919 + 1);
        const lo = kLo[ci], hi = ci + 1 < this.cascades.length ? kLo[ci + 1] : 1e9;
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const m = i < N / 2 ? i : i - N, n = j < N / 2 ? j : j - N, idx = j * N + i;
          const kx = m * dk, kz = n * dk, k = Math.hypot(kx, kz);
          c.kx[idx] = kx; c.kz[idx] = kz; c.w[idx] = Math.sqrt(G * k * Math.tanh(Math.min(k * O.depth, 20)));
          const [g1, g2] = gauss(r);
          const inBand = k > lo && k <= hi && i !== N / 2 && j !== N / 2;
          const s = inBand ? S(kx, kz) : 0, A = Math.sqrt(Math.max(0, s) * dk * dk / 2);
          c.h0r[idx] = g1 * A; c.h0i[idx] = g2 * A; m0 += (g1 * g1 + g2 * g2) * A * A * 2 / 2;
        }
      }
      return m0;
    };
    const mWind = gen(false);
    if (O.swell && O.swell.hs > 0) { // swell energy relative to the wind sea, in the same (unnormalised) units
      this._swellK = 1; const mSw = Math.max(1e-12, gen(true) - mWind);
      this._swellK = (O.swell.hs / Math.max(O.hs, 1e-3)) ** 2 * mWind / mSw;
    }
    gen(true);
    // normalise the total to the combined significant wave height, measured on the field itself
    this.t = null; this.update(0);
    const target = Math.hypot(O.hs, O.swell?.hs ?? 0), f = target / Math.max(this.measuredHs(), 1e-9);
    for (const c of this.cascades) for (let i = 0; i < c.h0r.length; i++) { c.h0r[i] *= f; c.h0i[i] *= f; }
    this.t = null;
    // unresolved slope variance (finer than the last cascade): integral of k^2 S over k > its Nyquist, approximated
    // (set below from Cox-Munk once the resolved variance is known)
    // unresolved slope variance per axis: Cox-Munk (1954) total mean-square slope 0.003 + 5.12e-3 U, minus
    // what the cascades resolve; this is what turns the sun into a broad glitter road at a distance
    this.update(0); let res = 0; for (const c of this.cascades) { let m = 0; for (let i = 0; i < c.slope.length; i += 4) m += c.slope[i + 2] + c.slope[i + 3]; res += m / (c.N * c.N); }
    this.resolvedSlopeVar = res;
    this.sigmaUnresolved = Math.max(0.0015, (0.003 + 0.00512 * U - res) * (O.roughness ?? 0.7)) / 2;
    this.t = null;
  }

  // the whole field at time t (pure function of t)
  update(t) {
    if (this.t === t) return this; this.t = t;
    const chop = this.o.chop;
    for (const c of this.cascades) {
      const { N, P, h0r, h0i, w, kx, kz, bufs } = c, n2 = N * N;
      const [aR, aI, bR, bI, cR, cI, dR, dI] = bufs;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const idx = j * N + i, mi = ((N - i) % N) + ((N - j) % N) * N;
        const wt = w[idx] * t, co = Math.cos(wt), si = Math.sin(wt);
        // h = h0 e^{iwt} + conj(h0(-k)) e^{-iwt}
        const hr = h0r[idx] * co - h0i[idx] * si + h0r[mi] * co - h0i[mi] * si;
        const hi = h0r[idx] * si + h0i[idx] * co - (h0r[mi] * si + h0i[mi] * co);
        const KX = kx[idx], KZ = kz[idx], k = Math.hypot(KX, KZ) || 1;
        // fields (complex spectra, each Hermitian): h, Dx = i kx/k h, Dz = i kz/k h, sx = i kx h, sz = i kz h,
        // Jxx = -kx^2/k h, Jzz = -kz^2/k h, Jxz = -kx kz/k h
        const dxr = -KX / k * hi, dxi = KX / k * hr, dzr = -KZ / k * hi, dzi = KZ / k * hr;
        const sxr = -KX * hi, sxi = KX * hr, szr = -KZ * hi, szi = KZ * hr;
        const jxx = -KX * KX / k, jzz = -KZ * KZ / k, jxz = -KX * KZ / k;
        // pack pairs: A = h + i Dx ; B = Dz + i sx ; C = sz + i Jxx ; D = Jzz + i Jxz
        aR[idx] = hr - dxi; aI[idx] = hi + dxr;
        bR[idx] = dzr - sxi; bI[idx] = dzi + sxr;
        cR[idx] = szr - jxx * hi; cI[idx] = szi + jxx * hr;
        dR[idx] = jzz * hr - jxz * hi; dI[idx] = jzz * hi + jxz * hr;
      }
      fft2(P, aR, aI); fft2(P, bR, bI); fft2(P, cR, cI); fft2(P, dR, dI);
      const D = c.disp, S = c.slope;
      for (let idx = 0; idx < n2; idx++) {
        // (-1)^(i+j) shift is not needed: indices are already in FFT order (m = i or i - N)
        const h = aR[idx], dx = chop * aI[idx], dz = chop * bR[idx], sx = bI[idx], sz = cR[idx];
        const jxx = 1 + chop * cI[idx], jzz = 1 + chop * dR[idx], jxz = chop * dI[idx];
        D[idx * 4] = dx; D[idx * 4 + 1] = h; D[idx * 4 + 2] = dz; D[idx * 4 + 3] = jxx * jzz - jxz * jxz;
        S[idx * 4] = sx; S[idx * 4 + 1] = sz; S[idx * 4 + 2] = sx * sx; S[idx * 4 + 3] = sz * sz;
      }
      c.tD.needsUpdate = true; c.tS.needsUpdate = true;
    }
    return this;
  }

  // CPU samples (bilinear, ignoring the small horizontal displacement): height and slope at (x, z)
  sample(x, z, out = { h: 0, sx: 0, sz: 0 }) {
    out.h = 0; out.sx = 0; out.sz = 0;
    for (const c of this.cascades) {
      const { N, L, disp, slope } = c, u = ((x / L) % 1 + 1) % 1 * N - 0.5, v = ((z / L) % 1 + 1) % 1 * N - 0.5;
      const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
      const at = (a, xx, yy, ch) => a[((((yy % N) + N) % N) * N + (((xx % N) + N) % N)) * 4 + ch];
      const bil = (a, ch) => (at(a, x0, y0, ch) * (1 - fx) + at(a, x0 + 1, y0, ch) * fx) * (1 - fy) + (at(a, x0, y0 + 1, ch) * (1 - fx) + at(a, x0 + 1, y0 + 1, ch) * fx) * fy;
      out.h += bil(disp, 1); out.sx += bil(slope, 0); out.sz += bil(slope, 1);
    }
    return out;
  }
  height(x, z) { return this.sample(x, z).h; }
  // Hs measured on the current field (diagnostic)
  measuredHs() { let s = 0, n = 0; for (const c of this.cascades) { let m = 0; for (let i = 1; i < c.disp.length; i += 4) m += c.disp[i] * c.disp[i]; s += m / (c.disp.length / 4); } return 4 * Math.sqrt(s); }
  dispose() { for (const c of this.cascades) { c.tD.dispose(); c.tS.dispose(); } }
}
