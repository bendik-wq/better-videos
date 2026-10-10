// THE SEEING STONE. The palantír set: one black glass sphere, ~25 shots, cold open to final frame.
//
// The stone is a single ShaderMaterial on a sphere (see stoneMaterial): fresnel reflection of the
// room's one light (an analytic window/softbox, plus an optional "behind the camera" card for
// reflected silhouettes), refraction into a ray-marched volume of slowly turning smoke lit from
// within by an ember core, an optional iris vortex, and an optional image plane ("true images")
// seen through the smoke. Rack focus inside the glass is done in the shader (reflection layer vs.
// depth), because a depth buffer only knows the glass surface; post.js DOF does the room around it.
//
// Modes (params.mode): chamber, macro, seven, seen, eye, office, glass, web, awake, gift, tower,
// saruman, pyre, visions, keys, next, aragorn. Variants per SET-USAGE.md.
import * as C from '/engine/cine.js';

// UAL mannequin for the modern silhouettes (keys). scene.js preloads HDRIs only; loading the
// character here (no renderer needed) keeps that file untouched. Top-level await: scene.js waits.
try { await C.preload(null, { characters: ['UAL'], hdris: [] }); } catch (e) { console.warn('[stone] UAL preload failed', e); }

export function makeStone(H) {
  const { THREE, K, PP, base, mesh, std, caption, sourceLine, wt, vo0, voEnd, canvasTex, CAP, SERIF, RED, SODIUM, FLUO, ICE, PAPER } = H;
  const D2R = Math.PI / 180;
  const V3 = (a) => new THREE.Vector3(...a);
  const EMBER = 0xff6a24, MOON = 0xaabbe0, MONITOR = 0x6f9dff, FIRE = 0xff8a3a, WORK = 0xfff0dc;

  // ------------------------------------------------------------------ noise volume (shared)
  // 64^3 tileable value-noise fbm. R: 4 octaves, G: the same field low-passed (2 octaves) for
  // out-of-focus depth, B/A: an independent field for domain warping.
  let NOISE = null;
  function noise3D() {
    if (NOISE) return NOISE;
    const S = 64, N3 = S * S * S, out = new Uint8Array(N3 * 4);
    const lattice = (period, seed) => { const r = K.rng(seed), a = new Float32Array(period ** 3); for (let i = 0; i < a.length; i++) a[i] = r(); return a; };
    const sm = (x) => x * x * (3 - 2 * x);
    const field = (periods, seed) => {
      const acc = new Float32Array(N3); let wsum = 0;
      periods.forEach((P, o) => {
        const L = lattice(P, seed + o * 101), w = Math.pow(0.5, o); wsum += w; const cell = S / P;
        const idx = (i, j, k) => ((i % P) * P + (j % P)) * P + (k % P);
        for (let z = 0; z < S; z++) { const fz = z / cell, kz = Math.floor(fz), tz = sm(fz - kz);
          for (let y = 0; y < S; y++) { const fy = y / cell, ky = Math.floor(fy), ty = sm(fy - ky);
            for (let x = 0; x < S; x++) { const fx = x / cell, kx = Math.floor(fx), tx = sm(fx - kx);
              const c000 = L[idx(kx, ky, kz)], c100 = L[idx(kx + 1, ky, kz)], c010 = L[idx(kx, ky + 1, kz)], c110 = L[idx(kx + 1, ky + 1, kz)];
              const c001 = L[idx(kx, ky, kz + 1)], c101 = L[idx(kx + 1, ky, kz + 1)], c011 = L[idx(kx, ky + 1, kz + 1)], c111 = L[idx(kx + 1, ky + 1, kz + 1)];
              const a = c000 + (c100 - c000) * tx, b = c010 + (c110 - c010) * tx, c = c001 + (c101 - c001) * tx, d = c011 + (c111 - c011) * tx;
              const e = a + (b - a) * ty, f = c + (d - c) * ty;
              acc[(z * S + y) * S + x] += w * (e + (f - e) * tz); } } }
      });
      for (let i = 0; i < N3; i++) acc[i] /= wsum;
      // stretch the contrast (fbm piles up around 0.5)
      for (let i = 0; i < N3; i++) acc[i] = K.clamp((acc[i] - 0.5) * 1.9 + 0.5);
      return acc;
    };
    const R = field([4, 8, 16, 32], 11), G = field([4, 8], 11), B = field([4, 8, 16], 57), A = field([4, 8, 16], 91);
    for (let i = 0; i < N3; i++) { out[i * 4] = R[i] * 255; out[i * 4 + 1] = G[i] * 255; out[i * 4 + 2] = B[i] * 255; out[i * 4 + 3] = A[i] * 255; }
    const t = new THREE.Data3DTexture(out, S, S, S);
    t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType; t.minFilter = t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping; t.unpackAlignment = 1; t.needsUpdate = true;
    NOISE = t; return t;
  }
  const BLACK = (() => { const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); t.needsUpdate = true; return t; })();

  // ------------------------------------------------------------------ the stone
  const STONE_VS = `
    varying vec3 vPos; varying vec3 vCam;
    void main(){ vPos = position; vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
  const STONE_FS = `
    precision highp float; precision highp sampler3D;
    uniform sampler3D uNoise; uniform sampler2D uCard; uniform sampler2D uVis;
    uniform int uSteps; uniform float uVisBlur; uniform float uRound, uT, uEmber, uFlare, uSmoke, uThin, uIris, uCardAmt, uCardScale, uVisAmt, uVisScale, uFocus, uAperture, uKeyI, uSpin, uSeed, uTint, uRim, uExposure;
    uniform vec3 uEmberCol, uHotCol, uSmokeCol, uKeyDir, uKeyCol, uAmbCol, uIrisDir, uVisDir;
    uniform vec2 uKeySize;
    varying vec3 vPos; varying vec3 vCam;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
    float keyLight(vec3 r, float blur){
      vec3 kz = uKeyDir; float c = dot(r, kz); if (c <= 0.02) return 0.0;
      vec3 up = abs(kz.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
      vec3 kx = normalize(cross(up, kz)), ky = cross(kz, kx);
      vec2 uv = vec2(dot(r, kx), dot(r, ky)) / c;
      vec2 s = uKeySize + blur * 0.18;
      vec2 q = abs(uv) / s; float d = mix(max(q.x, q.y), length(q), uRound);
      float e = 0.06 + blur * 1.2;
      float h = 1.0 - smoothstep(1.0 - e, 1.0 + e, d);
      float area = (uKeySize.x * uKeySize.y) / (s.x * s.y);
      float halo = exp(-dot(uv, uv) / (dot(s, s) * 3.0 + 0.002)) * 0.006;
      return h * area + halo;
    }
    vec3 env(vec3 r, float blur, float card){
      vec3 c = uAmbCol * (0.25 + 0.75 * smoothstep(-0.4, 1.0, r.y));
      c += uKeyCol * uKeyI * keyLight(r, blur);
      if (uCardAmt * card > 0.0) {
        vec3 rv = (viewMatrix * vec4(r, 0.0)).xyz;
        if (rv.z > 0.0) { vec2 uv = rv.xy / (1.0 + rv.z) * uCardScale + 0.5;
          vec2 m = smoothstep(vec2(0.0), vec2(0.06), uv) * smoothstep(vec2(1.0), vec2(0.94), uv);
          c += texture(uCard, uv, blur * 5.0).rgb * uCardAmt * m.x * m.y; }
      }
      return c;
    }
    // two fields: glowing ribbons of smoke (thin sheets where the warped noise crosses a level) and
    // slow dark masses that swallow the light
    vec2 dens(vec3 p, float blur){
      float r2 = dot(p, p);
      vec3 q = rotY(p, uT * uSpin * (1.7 - r2) + uSeed);   // inner layers turn faster: the smoke curls
      q.y += uT * 0.015;
      vec4 w = texture(uNoise, q * 0.42 + vec3(uSeed * 0.13, 0.0, 0.31));
      q += (w.bab - 0.5) * 1.1;
      vec4 s = texture(uNoise, q * 0.75 + vec3(0.37, uSeed * 0.07, 0.11));
      float f = mix(s.r, s.g, clamp(blur, 0.0, 1.0));
      float shell = smoothstep(1.0, 0.7, r2);
      float rib = smoothstep(0.0, 1.0, 1.0 - abs(f - 0.55) * mix(7.0, 3.0, clamp(blur, 0.0, 1.0)));
      float mass = smoothstep(0.5, 0.75, w.a);
      return vec2(rib * rib * shell, mass * shell);
    }
    void main(){
      vec3 p0 = normalize(vPos); vec3 rd = normalize(vPos - vCam); vec3 n = p0;
      float cosi = max(dot(-rd, n), 0.0);
      float F = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      float rb = uAperture * abs(uFocus - 0.25);                 // the reflection's virtual image sits just behind the surface
      vec3 refl = env(reflect(rd, n), rb, 1.0);
      vec3 rr = refract(rd, n, 1.0 / 1.22);   // a gentler bend than real glass keeps the core small and deep
      float tE = max(0.0, -2.0 * dot(p0, rr));
      int N = uSteps;
      float dt = tE / float(N), j = hash(gl_FragCoord.xy);
      float tv = dot(rr, uVisDir) != 0.0 ? -dot(p0, uVisDir) / dot(rr, uVisDir) : -1.0; bool vis = uVisAmt <= 0.0;
      vec3 vx = normalize(cross(vec3(0.0, 1.0, 0.0), uVisDir)), vy = cross(uVisDir, vx);
      vec3 ix = abs(uIrisDir.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), uIrisDir)), iy = cross(uIrisDir, ix);
      vec3 col = vec3(0.0); float T = 1.0;
      float hot = uEmber * (1.0 + uFlare * 6.0);
      for (int i = 0; i < 24; i++) {
        if (i >= N) break;
        float t = (float(i) + j) * dt; vec3 p = p0 + rr * t; float r2 = dot(p, p);
        float blur = uAperture * abs(uFocus - (0.25 + t * 0.55)) * 1.4;
        vec2 dm = dens(p, blur); float d = dm.x;
        float core = hot * (30.0 * exp(-r2 * 11.0) + 0.8 * exp(-r2 * 2.5));
        vec3 em = uEmberCol * core * (uThin + d * 2.2) + uHotCol * (d * core * core * 0.12 + hot * 45.0 * exp(-r2 * 40.0));
        em += uSmokeCol * d * uKeyI * 0.0006 * (0.3 + 0.7 * max(dot(normalize(p + 1e-4), uKeyDir), 0.0));
        float sig = (d * 0.5 + dm.y * 0.7) * uSmoke;
        if (uIris > 0.001) {
          float z = dot(p, uIrisDir); vec2 xy = vec2(dot(p, ix), dot(p, iy)); float rho = length(xy), th = atan(xy.y, xy.x);
          float sw = th + 1.1 * log(rho + 0.04) - uT * 0.3;
          vec4 fib = texture(uNoise, vec3(cos(sw) * 1.7, sin(sw) * 1.7, rho * 2.4 + 0.2));
          float slab = exp(-z * z * 9.0);
          float ring = exp(-pow((rho - 0.46) / 0.2, 2.0)) * slab;
          float fibres = smoothstep(0.35, 0.75, fib.r);
          float di = ring * (0.35 + 0.65 * fibres) * 1.3;
          float pupil = smoothstep(0.17, 0.1, rho) * slab;
          d = mix(d, di, uIris);
          em = mix(em, uEmberCol * hot * (ring * fibres * fibres * 9.0 * smoothstep(0.18, 0.32, rho) + exp(-pow((rho - 0.22) / 0.05, 2.0)) * slab * 6.0 * (0.4 + fibres)) + uHotCol * hot * exp(-pow((rho - 0.2) / 0.02, 2.0)) * slab * 3.0 * fibres, uIris);
          sig = mix(sig, di * uSmoke * 0.6 + pupil * 30.0, uIris);
        }
        if (!vis && t > tv) { vis = true; vec3 x = p0 + rr * tv; vec2 uv = vec2(dot(x, vx), dot(x, vy)) * uVisScale + 0.5;
          float m = smoothstep(0.46, 0.18, length(uv - 0.5)) * (1.0 - 0.7 * dm.y) * smoothstep(tE, tE - 0.5, tv) * smoothstep(0.0, 0.3, tv);
          col += mix(T, 1.0, 0.65) * texture(uVis, uv, blur * 4.0 + uVisBlur).rgb * uVisAmt * m; }
        col += T * em * dt; T *= exp(-sig * dt);
      }
      // the light behind the stone, refracted (and inverted) through the dark glass
      vec3 pe = p0 + rr * tE; vec3 ro = refract(rr, -pe, 1.22);
      if (dot(ro, ro) > 0.0) col += T * env(ro, rb + 0.05, 0.0) * uTint;
      col = mix(col, col * uHotCol / max(max(uEmberCol.r, uEmberCol.g), 0.01), clamp(uFlare, 0.0, 1.0) * 0.6);
      vec3 rim = uEmberCol * hot * uRim * pow(1.0 - cosi, 2.5);
      vec3 c = refl * F + (1.0 - F) * col + rim;
      gl_FragColor = vec4(c * uExposure, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  function stoneMaterial(o = {}) {
    const u = {
      uNoise: { value: noise3D() }, uCard: { value: o.card ?? BLACK }, uVis: { value: o.vis ?? BLACK },
      uSteps: { value: 20 }, uVisBlur: { value: o.visBlur ?? 0 }, uRound: { value: o.round ?? 0 }, uT: { value: 0 }, uEmber: { value: o.ember ?? 0.05 }, uFlare: { value: 0 }, uSmoke: { value: o.smoke ?? 7 }, uThin: { value: o.thin ?? 0.35 },
      uIris: { value: 0 }, uCardAmt: { value: o.cardAmt ?? 0 }, uCardScale: { value: o.cardScale ?? 0.5 }, uVisAmt: { value: 0 }, uVisScale: { value: o.visScale ?? 0.62 },
      uFocus: { value: 0.6 }, uAperture: { value: 0 }, uKeyI: { value: o.keyI ?? 40 }, uSpin: { value: o.spin ?? 0.06 }, uSeed: { value: o.seed ?? 0 },
      uTint: { value: o.tint ?? 0.12 }, uRim: { value: o.rim ?? 0.05 }, uExposure: { value: o.exposure ?? 1 },
      uEmberCol: { value: new THREE.Color(o.emberCol ?? EMBER) }, uHotCol: { value: new THREE.Color(o.hotCol ?? 0xffd2a0) }, uSmokeCol: { value: new THREE.Color(o.smokeCol ?? 0x8ea4c8) },
      uKeyDir: { value: V3(o.keyDir ?? [0.5, 0.6, 0.6]).normalize() }, uKeyCol: { value: new THREE.Color(o.keyCol ?? MOON) }, uAmbCol: { value: new THREE.Color(o.amb ?? 0x0a0c10) },
      uIrisDir: { value: V3([0, 0, 1]) }, uVisDir: { value: V3([0, 0, 1]) }, uKeySize: { value: new THREE.Vector2(...(o.keySize ?? [0.08, 0.3])) },
    };
    const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: STONE_VS, fragmentShader: STONE_FS });
    return m;
  }

  // A stone: the sphere, an ember point light inside it, and per-frame bookkeeping.
  function makeStoneObj(scene, { radius = 0.5, pos = [0, 1, 0], light = 1, lightDist = 6, ...o } = {}) {
    const mat = stoneMaterial(o);
    const s = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat);
    s.scale.setScalar(radius); s.position.set(...pos); scene.add(s);
    s.castShadow = true; s.receiveShadow = false;
    const pl = new THREE.PointLight(o.lightCol ?? 0xff8a40, 0, lightDist, 2); pl.position.copy(s.position); pl.position.y += radius * 0.2; scene.add(pl);
    const u = mat.uniforms; const tmp = new THREE.Vector3();
    return {
      mesh: s, u, light: pl, radius,
      set(k, v) { u[k].value = v; },
      // per-frame: time, glow, and the camera-facing directions for the vision plane and iris
      update(t, camera, { ember, flare = 0, iris = 0, irisDir = null } = {}) {
        u.uT.value = t; if (ember !== undefined) u.uEmber.value = ember; u.uFlare.value = flare; u.uIris.value = iris;
        tmp.copy(camera.position).sub(s.position); const dist = tmp.length(); tmp.normalize(); u.uVisDir.value.copy(tmp);
        // fewer march steps as the stone fills more of the frame (cost is per pixel)
        const frac = s.scale.x / Math.max(1e-3, dist * Math.tan(camera.fov * D2R / 2));
        u.uSteps.value = frac > 0.75 ? 11 : frac > 0.4 ? 14 : 20;
        u.uIrisDir.value.copy(irisDir ?? tmp).normalize();
        pl.intensity = light * u.uEmber.value * (1 + flare * 9) * 12 * radius * radius / 0.25;
      },
      dist(camera) { return camera.position.distanceTo(s.position); },
    };
  }

  // ------------------------------------------------------------------ textures
  const texCache = {};
  function stoneWallTex(seed = 3, { rows = 9, light = 120, var: vr = 40 } = {}) {
    const key = `wall${seed}${rows}${light}`; if (texCache[key]) return texCache[key];
    const r = K.rng(seed);
    const map = canvasTex(1024, 1024, (x, w, h) => {
      x.fillStyle = `rgb(${light * 0.55},${light * 0.55},${light * 0.55})`; x.fillRect(0, 0, w, h); const rh = h / rows;
      for (let i = 0; i < rows; i++) { let cx = -r() * 120; while (cx < w) { const bw = 120 + r() * 160; const v = light + (r() - 0.5) * vr;
        x.fillStyle = `rgb(${v},${v - 2},${v - 6})`; x.fillRect(cx + 3 + r() * 3, i * rh + 3 + r() * 3, bw - 7, rh - 7);
        for (let k = 0; k < 60; k++) { const s = v + (r() - 0.5) * 50; x.fillStyle = `rgba(${s},${s},${s},.35)`; x.fillRect(cx + 4 + r() * (bw - 12), i * rh + 4 + r() * (rh - 12), 2 + r() * 10, 2 + r() * 6); }
        cx += bw; } }
    });
    map.wrapS = map.wrapT = THREE.RepeatWrapping; texCache[key] = map; return map;
  }
  function slitCookie() { // a tall narrow window, mullion-less, soft edges: the moonlight cookie
    if (texCache.slit) return texCache.slit;
    const t = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.filter = 'blur(3px)'; x.fillStyle = '#fff';
      x.beginPath(); x.moveTo(112, 236); x.lineTo(112, 40); x.quadraticCurveTo(128, 14, 144, 40); x.lineTo(144, 236); x.fill(); });
    t.colorSpace = THREE.NoColorSpace; texCache.slit = t; return t;
  }
  function radialTex(stops = [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], size = 128) {
    return canvasTex(size, size, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  }

  // ------------------------------------------------------------------ robed figures
  // Cloth silhouettes, not game models: a lathe robe with deep vertical folds that widen toward
  // the hem, a mantle, a peaked hood with a black void for a face, wide sleeves. Matte with a
  // little sheen so a rim light reads as cloth.
  function clothMat(color = 0x0b0b0d, sheen = 0x3a3e46) {
    return new THREE.MeshPhysicalMaterial({ color, roughness: 0.92, metalness: 0, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color(sheen) });
  }
  function foldLathe(profile, { folds = 9, depth = 0.08, seed = 1, flatten = 0.78, segs = 72 } = {}) {
    const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs);
    const p = g.attributes.position, r = K.rng(seed); const ph = Array.from({ length: 4 }, () => r() * 6.28);
    const y0 = profile[0][1], y1 = profile.at(-1)[1];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const th = Math.atan2(z, x); const k = K.clamp(1 - (y - y0) / (y1 - y0));
      const f = 1 + depth * Math.pow(k, 1.3) * (Math.sin(th * folds + ph[0] + Math.sin(th * 3 + ph[1]) * 1.2) * 0.7 + Math.sin(th * (folds * 2 + 1) + ph[2]) * 0.3);
      p.setXYZ(i, x * f, y, z * f * flatten); }
    g.computeVertexNormals(); return g;
  }
  function robe({ mat = clothMat(), lean = 0, arms = 'down', hood = true, height = 1.0, seed = 1 } = {}) {
    const g = new THREE.Group(); const upper = new THREE.Group(); upper.position.y = 1.0; g.add(upper);
    const skirt = new THREE.Mesh(foldLathe([[0.001, 0], [0.5, 0.0], [0.47, 0.06], [0.38, 0.4], [0.27, 0.8], [0.22, 1.02], [0.001, 1.04]], { seed, depth: 0.1 }), mat);
    g.add(skirt);
    const torso = new THREE.Mesh(foldLathe([[0.001, -0.06], [0.23, -0.04], [0.25, 0.2], [0.27, 0.42], [0.2, 0.52], [0.08, 0.58], [0.001, 0.6]], { seed: seed + 3, depth: 0.035, folds: 6, flatten: 0.7 }), mat);
    upper.add(torso);
    const mantle = new THREE.Mesh(foldLathe([[0.001, 0.25], [0.36, 0.25], [0.33, 0.36], [0.2, 0.52], [0.06, 0.6], [0.001, 0.61]], { seed: seed + 5, depth: 0.06, folds: 11, flatten: 0.72 }), mat);
    upper.add(mantle);
    const head = new THREE.Group(); head.position.set(0, 0.68, 0.02); upper.add(head);
    if (hood) {
      const hg = new THREE.SphereGeometry(0.15, 32, 24); const hp = hg.attributes.position;
      for (let i = 0; i < hp.count; i++) { let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
        if (y > 0 && z < 0.05) { const k = y / 0.15; y += k * k * 0.12 * K.clamp((0.05 - z) / 0.15); z -= k * k * 0.05; } // peak, falling back
        if (z > 0.08) { z = 0.08 + (z - 0.08) * 0.6; }
        hp.setXYZ(i, x * 1.05, y * 1.1, z * 1.15); }
      hg.computeVertexNormals(); head.add(new THREE.Mesh(hg, mat));
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.085, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })); face.position.set(0, -0.01, 0.168); face.scale.y = 1.25; head.add(face);
      const drape = new THREE.Mesh(foldLathe([[0.001, -0.2], [0.24, -0.2], [0.2, -0.1], [0.15, 0.0], [0.001, 0.02]], { seed: seed + 7, depth: 0.05, folds: 8 }), mat); head.add(drape);
    } else { head.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), mat)); }
    const sleeve = (side) => { const sg = new THREE.Group(); sg.position.set(side * 0.27, 0.46, 0); upper.add(sg);
      const up = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.34, 16, 1, true), mat); up.position.y = -0.17; sg.add(up);
      const fore = new THREE.Group(); fore.position.y = -0.33; sg.add(fore);
      const fm = new THREE.Mesh(foldLathe([[0.14, -0.34], [0.12, -0.24], [0.08, -0.1], [0.065, 0.0], [0.001, 0.01]], { seed: seed + side * 9, depth: 0.12, folds: 5, flatten: 1 }), mat); fore.add(fm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), mat); hand.position.y = -0.36; hand.scale.set(0.8, 1.3, 0.6); fore.add(hand);
      return { sg, fore, hand }; };
    const L = sleeve(-1), R = sleeve(1);
    const pose = (k) => {
      upper.rotation.x = lean * k;
      if (arms === 'down') { L.sg.rotation.z = -0.08; R.sg.rotation.z = 0.08; }
      if (arms === 'reach') { for (const [s, A] of [[-1, L], [1, R]]) { A.sg.rotation.set(-0.7 * k - 0.1, 0, s * 0.18); A.fore.rotation.set(-0.7 * k, 0, -s * 0.25); } }
      if (arms === 'hold') { for (const [s, A] of [[-1, L], [1, R]]) { A.sg.rotation.set(-0.55, 0, s * 0.12); A.fore.rotation.set(-1.05, 0, -s * 0.5); } }
      if (arms === 'cup') { for (const [s, A] of [[-1, L], [1, R]]) { A.sg.rotation.set(-0.35, 0, s * 0.1); A.fore.rotation.set(-0.9, 0, -s * 0.55); } }
    };
    pose(1); g.scale.setScalar(height * 1.0);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { g, upper, head, L, R, pose };
  }

  // where a figure's hands meet (after pose), for a stone held between them
  function handsCenter(fig, fwd = 0.1) { fig.g.updateMatrixWorld(true); const a = fig.L.hand.getWorldPosition(new THREE.Vector3()), b = fig.R.hand.getWorldPosition(new THREE.Vector3());
    const c = a.add(b).multiplyScalar(0.5); const f = new THREE.Vector3(0, 0, 1).applyQuaternion(fig.g.getWorldQuaternion(new THREE.Quaternion())); return c.addScaledVector(f, fwd).toArray(); }

  // ------------------------------------------------------------------ overlays
  function quoteCard(layer, P0, css = 'left:6%;bottom:17%') {
    if (!P0.quote) return null;
    return K.div(layer, `${css};max-width:40%;line-height:1.1`,
      `<div style="${SERIF};font-size:3.1em;font-style:italic;letter-spacing:-.005em;text-shadow:0 0 40px #000">${P0.quote}</div>` +
      `<div style="${CAP};font-size:.72em;margin-top:1.1em;color:#a59e90">${P0.by ?? ''}</div>`);
  }
  const scopeSet = (o) => ({ ...o, scope: true });
  const fade = (el, t, a, b = a + 0.8) => { if (el) el.style.opacity = K.smooth(K.range(t, a, b)); };

  // ------------------------------------------------------------------ sets
  // CHAMBER: a round tower room at night, one cold shaft of moonlight through a slit window.
  function chamber(ctx, shot) {
    const P0 = shot.params, dark = P0.variant === 'dark';
    const b = base(ctx, { floor: null, fog: 0x020306, density: dark ? 0.05 : 0.035, fov: 30 });
    const { scene, camera, layer } = b;
    const wall = stoneWallTex(3, { rows: 14, light: 110 }); const wallM = new THREE.MeshStandardMaterial({ color: 0x8a8c94, map: wall, bumpMap: wall, bumpScale: 2.2, roughness: 0.92 });
    wallM.map = wall.clone(); wallM.map.repeat.set(5, 2); wallM.bumpMap = wallM.map;
    const R = 6.5, Hh = 11;
    const tower = mesh(new THREE.CylinderGeometry(R, R, Hh, 64, 1, true), wallM, [0, Hh / 2, 0], scene); tower.material.side = THREE.BackSide; tower.castShadow = false;
    const flag = stoneWallTex(8, { rows: 6, light: 90, var: 30 }).clone(); flag.repeat.set(3, 3);
    const floor = mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshStandardMaterial({ color: 0x77787c, map: flag, bumpMap: flag, bumpScale: 1.5, roughness: 0.85 }), [0, 0, 0], scene); floor.rotation.x = -Math.PI / 2;
    // the slit window: a deep reveal in the wall facing the pedestal, sky beyond
    const winA = 0.9, wx = Math.sin(winA) * (R - 0.05), wz = -Math.cos(winA) * (R - 0.05);
    const win = new THREE.Group(); win.position.set(wx * 0.995, 5.4, wz * 0.995); win.lookAt(0, 5.4, 0); scene.add(win);
    const slitA = slitCookie();
    const skyM = new THREE.MeshBasicMaterial({ color: dark ? 0x26304a : 0x9aaed8, alphaMap: slitA, transparent: true, fog: false, depthWrite: false });
    mesh(new THREE.PlaneGeometry(1.8, 3.2), skyM, [0, 0.1, 0.03], win).castShadow = false;
    const revealM = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: slitA, transparent: true, depthWrite: false });
    const rv = mesh(new THREE.PlaneGeometry(2.3, 3.6), revealM, [0, 0.1, 0.02], win); rv.castShadow = false;
    // pedestal: a dark basalt column with a shallow cup
    const basalt = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.55, metalness: 0.1 });
    const ped = mesh(new THREE.LatheGeometry([[0.001, 0], [0.75, 0], [0.75, 0.12], [0.55, 0.2], [0.42, 0.35], [0.36, 1.0], [0.44, 1.06], [0.44, 1.12], [0.26, 1.16], [0.12, 1.22], [0.001, 1.22]].map(([x, y]) => new THREE.Vector2(x, y)), 64), basalt, [0, 0, 0], scene);
    const iron = std(0x0c0c0c, { metalness: 0.8, roughness: 0.45 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.4; const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12, ang = -Math.PI / 2 - 0.15 + u * 1.25; pts.push(V3([Math.sin(a) * Math.cos(ang) * 0.45, 1.67 + Math.sin(ang) * 0.45, Math.cos(a) * Math.cos(ang) * 0.45])); }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 8), iron, [0, 0, 0], scene); }
    const stone = makeStoneObj(scene, { radius: 0.42, pos: [0, 1.67, 0], keyDir: [wx, 5.4 - 1.67, wz], keySize: [0.035, 0.24], keyI: dark ? 25 : 70, keyCol: MOON, amb: dark ? 0x05060a : 0x07090d, ember: dark ? 0.09 : 0.06, light: 1.2, exposure: 1.35, lightDist: 7, seed: 1.3 });
    // moonlight through the slit
    const moonPos = [wx * 2.2, 9.6, wz * 2.2];
    const moon = K.keySpot(scene, { color: MOON, intensity: dark ? 700 : 2600, pos: moonPos, target: [-0.5, 0.4, 0.6], angle: 0.17, penumbra: 0.4, shadow: 2048 });
    moon.shadow.camera.near = 4; moon.shadow.bias = -0.0008;
    const shaft = K.lightShaft(scene, { pos: [wx * 0.98, 5.6, wz * 0.98], target: [-wx * 0.12, -0.8, -wz * 0.12], radius: 1.0, color: MOON, intensity: dark ? 0.04 : 0.11 });
    scene.add(new THREE.HemisphereLight(0x223048, 0x050505, dark ? 0.08 : 0.12));
    // moonlight spilling off the reveal onto the stone wall around the window
    const spill = new THREE.PointLight(MOON, dark ? 0 : 7, 6, 1.6); spill.position.set(wx * 0.86, 5.0, wz * 0.86); scene.add(spill);
    const motes = K.dust(scene, { count: 900, box: [5, 6, 5], center: [wx * 0.45, 3.4, wz * 0.45], size: 0.025, opacity: dark ? 0.15 : 0.5, color: 0xcfd8ff });
    const ember = K.dust(scene, { count: 220, box: [1.6, 1.6, 1.6], center: [0, 1.9, 0], size: 0.012, opacity: dark ? 0.6 : 0.25, color: 0xff8a50, seed: 9 });
    const dur = shot.duration;
    const move = dark
      ? C.path([{ pos: [-1.6, 1.85, 2.0], look: [0, 1.62, 0], mm: 50 }, { pos: [-3.6, 2.6, 4.6], look: [0, 1.7, 0], mm: 40 }], { duration: dur, accel: 0.2, decel: 0.6, float: 0.012, seed: 4 })
      : C.path([{ pos: [-3.0, 1.3, 5.9], look: [0.6, 2.4, -1], mm: 32 }, { pos: [-1.25, 1.62, 2.55], look: [0.1, 1.82, -0.3], mm: 40 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.012, seed: 2 });
    const cap = caption(layer, P0.caption, 'left:6%;top:17%');
    return scopeSet({ ...b, update(t, p) {
      motes.update(t); ember.update(t);
      move(camera, p, t);
      stone.update(t, camera, { ember: dark ? 0.1 + 0.08 * K.smooth(K.range(t, 0.5, dur)) : 0.075 });
      fade(cap, t, 0.8);
    } });
  }

  // ------------------------------------------------------------------ 2D images for inside the glass
  // A figure's silhouette in 2D: hooded or bare-headed, optionally leaning in.
  function figure2D(x, cx, cy, h, { hood = false, lean = 0, color = '#000', spear = false } = {}) {
    x.save(); x.translate(cx, cy); x.rotate(lean); x.fillStyle = color; x.strokeStyle = color;
    const s = h / 10;
    x.beginPath(); x.moveTo(-1.6 * s, 0); x.lineTo(-1.9 * s, -5.6 * s); x.quadraticCurveTo(-1.9 * s, -7.4 * s, -0.7 * s, -7.6 * s); x.lineTo(0.7 * s, -7.6 * s);
    x.quadraticCurveTo(1.9 * s, -7.4 * s, 1.9 * s, -5.6 * s); x.lineTo(1.6 * s, 0); x.fill();
    if (hood) { x.beginPath(); x.moveTo(-1.1 * s, -7.2 * s); x.quadraticCurveTo(-1.2 * s, -9.6 * s, 0.2 * s, -10 * s); x.quadraticCurveTo(1.2 * s, -9.4 * s, 1.1 * s, -7.2 * s); x.fill(); }
    else { x.beginPath(); x.arc(0, -8.6 * s, 0.95 * s, 0, 7); x.fill(); x.fillRect(-0.4 * s, -8 * s, 0.8 * s, 0.6 * s); }
    if (spear) { x.lineWidth = Math.max(0.6, s * 0.25); x.beginPath(); x.moveTo(1.4 * s, -1 * s); x.lineTo(1.6 * s, -14 * s); x.stroke(); }
    x.restore();
  }
  function drawArmy(x, w, h, t, { seed = 3, glow = 1, near = false } = {}) {
    const r = K.rng(seed), hor = h * (near ? 0.38 : 0.5);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000'); g.addColorStop(hor / h - 0.12, `rgba(${60 * glow},${22 * glow},${6 * glow},1)`);
    g.addColorStop(hor / h, `rgba(${150 * glow},${60 * glow},${16 * glow},1)`); g.addColorStop(Math.min(1, hor / h + 0.08), `rgba(${40 * glow},${16 * glow},${5 * glow},1)`); g.addColorStop(1, '#030100');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const fx = r() * w, fr = 20 + r() * 50; const fg = x.createRadialGradient(fx, hor, 0, fx, hor, fr); fg.addColorStop(0, `rgba(255,140,50,${0.5 * glow})`); fg.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = fg; x.fillRect(fx - fr, hor - fr, fr * 2, fr * 2); }
    const rows = near ? 14 : 30;
    for (let k = rows; k >= 0; k--) { const u = k / rows, y = hor + 4 + Math.pow(u, 1.8) * (h - hor), s = 3 + Math.pow(u, 1.8) * (near ? 150 : 70);
      const sp = s * 0.62, off = (r() * sp + t * s * 0.35) % sp;
      if (s < 9) { x.fillStyle = '#000'; for (let cx = -sp + off; cx < w + sp; cx += sp) { const fx = cx + (r() - 0.5) * sp * 0.3; x.fillRect(fx - s * 0.17, y - s * 0.85, s * 0.34, s * 0.85); x.fillRect(fx + s * 0.14, y - s * 1.4, Math.max(0.6, s * 0.05), s * 1.3); } }
      else for (let cx = -sp + off; cx < w + sp; cx += sp) figure2D(x, cx + (r() - 0.5) * sp * 0.3, y, s, { spear: true, color: '#000' }); }
  }
  function drawFleet(x, w, h, t, { seed = 5, glow = 1 } = {}) {
    const r = K.rng(seed), hor = h * 0.46;
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000'); g.addColorStop(0.36, `rgba(${40 * glow},${30 * glow},${26 * glow},1)`); g.addColorStop(0.46, `rgba(${120 * glow},${70 * glow},${40 * glow},1)`);
    g.addColorStop(0.5, `rgba(${30 * glow},${20 * glow},${16 * glow},1)`); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { const y = hor + 3 + Math.pow(r(), 2) * (h - hor), a = 0.25 * glow * (1 - (y - hor) / (h - hor)); x.fillStyle = `rgba(255,170,110,${a})`; x.fillRect((r() * w + t * 6) % w, y, 4 + r() * 30, 1); }
    const n = 34;
    for (let i = 0; i < n; i++) { const u = Math.pow(i / n, 1.5), y = hor + 2 + u * (h - hor) * 0.55, s = 4 + u * 60, cx = (r() * w * 1.2 - w * 0.1 + t * s * 0.4) % (w * 1.1), bob = Math.sin(t * 1.3 + i) * s * 0.05;
      x.save(); x.translate(cx, y + bob); x.fillStyle = '#000';
      x.beginPath(); x.moveTo(-3 * s, -0.6 * s); x.lineTo(3.2 * s, -0.6 * s); x.lineTo(2.4 * s, 0.4 * s); x.lineTo(-2.4 * s, 0.4 * s); x.fill();
      const masts = 1 + Math.floor(r() * 3);
      for (let m = 0; m < masts; m++) { const mx = (m - (masts - 1) / 2) * 1.6 * s; x.fillRect(mx - 0.08 * s, -5.4 * s, 0.16 * s, 4.8 * s);
        x.beginPath(); x.moveTo(mx - 1.0 * s, -4.9 * s); x.quadraticCurveTo(mx + 0.3 * s, -3.6 * s, mx - 1.0 * s, -1.4 * s); x.lineTo(mx + 1.0 * s, -1.4 * s); x.quadraticCurveTo(mx + 1.5 * s, -3.6 * s, mx + 1.0 * s, -4.9 * s); x.fill(); }
      x.restore(); }
  }
  function hallwayTex() { // a long government corridor, lit panels, one tiny figure at the far end
    if (texCache.hall) return texCache.hall;
    texCache.hall = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, w, h); const vx = w / 2, vy = h * 0.47;
      const end = x.createRadialGradient(vx, vy, 0, vx, vy, 60); end.addColorStop(0, 'rgba(220,255,235,.95)'); end.addColorStop(0.3, 'rgba(120,200,160,.35)'); end.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = end; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(200,255,220,.9)'; x.fillRect(vx - 9, vy - 14, 18, 26);
      for (let k = 1; k < 14; k++) { const d = 1 / (k * 0.45); const y = vy - 150 * d * 0.5, ww = 16 * d, hh = 3 * d; x.fillStyle = `rgba(190,255,215,${0.9 - k * 0.04})`; x.fillRect(vx - ww, y, ww * 2, hh);
        x.fillStyle = `rgba(120,200,160,${0.25 - k * 0.012})`; x.fillRect(vx - ww, vy + (vy - y) * 0.9, ww * 2, hh * 0.7);
        for (const sd of [-1, 1]) { x.fillStyle = `rgba(110,170,140,${0.18 - k * 0.01})`; x.fillRect(vx + sd * 260 * d * 0.5 - (sd > 0 ? 2 * d : 0), vy - 80 * d * 0.5, 2 * d, 140 * d * 0.5); } }
      x.strokeStyle = 'rgba(90,140,115,.35)'; x.lineWidth = 1.5;
      for (const [a, b] of [[[0, 0], [vx - 12, vy - 16]], [[w, 0], [vx + 12, vy - 16]], [[0, h], [vx - 12, vy + 14]], [[w, h], [vx + 12, vy + 14]]]) { x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); }
      figure2D(x, vx, vy + 12, 24, { color: '#000' });
    });
    return texCache.hall;
  }
  // What is behind the camera, for the reflection: a lit doorway, with or without someone in it.
  function watcherCard(who = true, tint = '160,180,220') {
    const key = `card${who}${tint}`; if (texCache[key]) return texCache[key];
    texCache[key] = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      const g = x.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, w * 0.5); g.addColorStop(0, `rgba(${tint},.22)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.filter = 'blur(6px)'; x.fillStyle = `rgba(${tint},.95)`; x.fillRect(w * 0.38, h * 0.16, w * 0.24, h * 0.58); x.filter = 'blur(2px)';
      if (who) { figure2D(x, w * 0.5, h * 0.98, h * 0.82, { hood: true, lean: -0.05, color: '#000' }); }
    });
    return texCache[key];
  }
  function blindsCard() { // the office behind the camera: a window of green-lit blinds and a door
    if (texCache.blinds) return texCache.blinds;
    texCache.blinds = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      x.filter = 'blur(1.5px)'; for (let i = 0; i < 22; i++) { const e = Math.sin(i / 21 * Math.PI); x.fillStyle = `rgba(88,255,160,${(0.25 + 0.3 * Math.sin(i * 1.7) ** 2) * e})`; x.fillRect(w * 0.2, h * 0.2 + i * 11, w * 0.38, 5); }
      x.fillStyle = 'rgba(255,240,220,.18)'; x.fillRect(w * 0.7, h * 0.18, w * 0.12, h * 0.5); });
    return texCache.blinds;
  }

  // ------------------------------------------------------------------ the office
  // A modern, dark government office. Window wall with blinds (z = -3), green fluorescent tubes
  // in the corridor beyond; the desk faces +z with the chair behind it; door on the left wall.
  function office(scene, { tubes = 6, spill = 1 } = {}) {
    const o = {};
    const wallM = new THREE.MeshStandardMaterial({ color: 0x3a3e3c, roughness: 0.85 });
    const floorTex = K.grimeTexture(21, 60); floorTex.repeat.set(6, 6);
    const floor = mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x2a2b2d, roughness: 0.95, roughnessMap: floorTex }), [0, 0, 0], scene); floor.rotation.x = -Math.PI / 2;
    const ceil = mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x1e1f20, roughness: 0.9 }), [0, 3.1, 0], scene); ceil.rotation.x = Math.PI / 2;
    // back wall with the window opening x[-2.6,2.6] y[0.85,2.65]
    const bw = (w, h, x, y) => mesh(new THREE.BoxGeometry(w, h, 0.25), wallM, [x, y, -3.12], scene);
    bw(4.4, 3.1, -4.8, 1.55); bw(4.4, 3.1, 4.8, 1.55); bw(5.2, 0.85, 0, 0.425); bw(5.2, 0.45, 0, 2.875);
    // left wall, with a doorway at z 0.9..1.85
    mesh(new THREE.BoxGeometry(0.25, 3.1, 4.0), wallM, [-4.2, 1.55, -1.1], scene); mesh(new THREE.BoxGeometry(0.25, 3.1, 5.05), wallM, [-4.2, 1.55, 4.375], scene);
    mesh(new THREE.BoxGeometry(0.25, 0.95, 0.95), wallM, [-4.2, 2.625, 1.375], scene);
    mesh(new THREE.BoxGeometry(0.25, 3.1, 10), wallM, [4.2, 1.55, 1.9], scene);
    mesh(new THREE.BoxGeometry(8.6, 3.1, 0.25), wallM, [0, 1.55, 6.9], scene);
    // blinds: horizontal slats, half open
    const slatG = new THREE.BoxGeometry(5.2, 0.006, 0.05), slatM = new THREE.MeshStandardMaterial({ color: 0x5a5c58, roughness: 0.5, metalness: 0.2 });
    const NS = 46, slats = new THREE.InstancedMesh(slatG, slatM, NS); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(V3([1, 0, 0]), 0.62);
    for (let i = 0; i < NS; i++) { m4.compose(V3([0, 0.88 + i * 0.038, -2.95]), q, V3([1, 1, 1])); slats.setMatrixAt(i, m4); }
    slats.castShadow = true; slats.receiveShadow = true; scene.add(slats);
    // corridor beyond: green tubes on a ceiling, a dim far wall
    const tubeM = []; o.tubes = [];
    for (let i = 0; i < tubes; i++) { const m = new THREE.MeshBasicMaterial({ color: 0xc8ffdc, fog: false }); tubeM.push(m);
      const tb = mesh(new THREE.BoxGeometry(0.09, 0.05, 1.5), m, [-2.2 + i * (4.4 / (tubes - 1)), 2.75, -4.3], scene); tb.castShadow = false; o.tubes.push(tb); }
    const farM = new THREE.MeshStandardMaterial({ color: 0x1c2a22, roughness: 0.8 });
    mesh(new THREE.PlaneGeometry(12, 4), farM, [0, 1.6, -5.4], scene);
    // the green spill: one shadowed spot behind the blinds, so the slats cut it into bands
    o.spot = K.keySpot(scene, { color: FLUO, intensity: 380 * spill, pos: [-1.0, 3.0, -5.6], target: [0.4, 0.5, 0.2], angle: 0.6, penumbra: 0.35, shadow: 2048 });
    o.spot.shadow.camera.near = 1.5; o.spot.shadow.bias = -0.0006; o.spot.shadow.radius = 2;
    o.fill = new THREE.PointLight(FLUO, 1.5 * spill, 6, 2); o.fill.position.set(0, 2.6, -4.2); scene.add(o.fill);
    o.shaft = K.lightShaft(scene, { pos: [-1.0, 3.0, -5.0], target: [0.4, 0.5, 0.3], radius: 2.2, color: FLUO, intensity: 0.035 * spill });
    o.amb = new THREE.HemisphereLight(0x203028, 0x050505, 0.08); scene.add(o.amb);
    o.setTubes = (on) => { const n = on.length; let s = 0; on.forEach((v, i) => { tubeM[i].color.setRGB(0.78 * v, 1.0 * v, 0.86 * v); s += v; });
      const k = s / n; o.spot.intensity = 380 * spill * k; o.fill.intensity = 1.5 * spill * k; o.shaft.material.uniforms.uI.value = 0.035 * spill * k; o.amb.intensity = 0.08 * k + 0.004; farM.color.setRGB(0.11 * k + 0.01, 0.16 * k + 0.01, 0.13 * k + 0.01); };
    // desk
    const wood = new THREE.MeshStandardMaterial({ color: 0x22160f, roughness: 0.38, metalness: 0.05 });
    const desk = new THREE.Group(); desk.position.set(0, 0, -1.1); scene.add(desk);
    mesh(new THREE.BoxGeometry(2.1, 0.06, 0.95), wood, [0, 0.76, 0], desk);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.5, 0.73, 0.88), wood, [s * 0.78, 0.365, 0], desk);
    mesh(new THREE.BoxGeometry(1.06, 0.6, 0.03), wood, [0, 0.43, 0.43], desk);
    const paper = new THREE.MeshStandardMaterial({ color: 0x8c8a84, roughness: 0.9 });
    const pr = K.rng(4); for (let i = 0; i < 5; i++) { const pp = mesh(new THREE.BoxGeometry(0.21, 0.004, 0.297), paper, [-0.55 + pr() * 0.12, 0.792 + i * 0.004, 0.05 + pr() * 0.08], desk); pp.rotation.y = (pr() - 0.5) * 0.3; }
    const folder = mesh(new THREE.BoxGeometry(0.24, 0.012, 0.32), new THREE.MeshStandardMaterial({ color: 0x3a2e1c, roughness: 0.8 }), [-0.62, 0.82, 0.1], desk); folder.rotation.y = 0.12;
    const blk = std(0x0c0c0d, { roughness: 0.4, metalness: 0.3 });
    mesh(new THREE.BoxGeometry(0.2, 0.05, 0.22), blk, [0.82, 0.815, -0.2], desk); // phone
    const lamp = new THREE.Group(); lamp.position.set(-0.85, 0.79, -0.25); desk.add(lamp);
    mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 24), blk, [0, 0.015, 0], lamp); mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 8), blk, [0, 0.2, 0], lamp);
    const shade = mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.12, 24, 1, true), std(0x10201a, { roughness: 0.3, metalness: 0.4 }), [0.06, 0.36, 0], lamp); shade.rotation.z = 0.5; shade.material.side = THREE.DoubleSide;
    // a small black stand for the stone
    mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.05, 32), blk, [0.38, 0.815, 0.12], desk);
    o.stonePos = [0.38, 0.79 + 0.05 + 0.125, -1.1 + 0.12];
    // the chair (executive, high back), behind the desk
    const leather = std(0x0d0d0e, { roughness: 0.45, metalness: 0.05 });
    const chair = new THREE.Group(); chair.position.set(-0.45, 0, -1.95); chair.rotation.y = 0.3; scene.add(chair);
    const seat = mesh(new THREE.BoxGeometry(0.56, 0.1, 0.52), leather, [0, 0.5, 0], chair);
    const bs = new THREE.Shape(), bw2 = 0.27, bh = 0.95, rr = 0.13; bs.moveTo(-bw2 + 0.04, 0); bs.lineTo(bw2 - 0.04, 0); bs.quadraticCurveTo(bw2 + 0.02, bh * 0.5, bw2, bh - rr); bs.quadraticCurveTo(bw2, bh, bw2 - rr, bh);
    bs.lineTo(-bw2 + rr, bh); bs.quadraticCurveTo(-bw2, bh, -bw2, bh - rr); bs.quadraticCurveTo(-bw2 - 0.02, bh * 0.5, -bw2 + 0.04, 0);
    const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 16 });
    const back = mesh(bg, leather, [0, 0.58, -0.3], chair); back.rotation.x = -0.14;
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(0.05, 0.04, 0.36), leather, [s * 0.3, 0.72, 0.0], chair); mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), blk, [s * 0.3, 0.6, 0.08], chair); }
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 12), std(0x777, { metalness: 0.9, roughness: 0.3 }), [0, 0.28, 0], chair);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = mesh(new THREE.BoxGeometry(0.05, 0.04, 0.34), blk, [Math.sin(a) * 0.16, 0.08, Math.cos(a) * 0.16], chair); leg.rotation.y = a; }
    o.chair = chair;
    // a furled flag in the corner, a dark seal on the wall
    const pole = mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 8), std(0x8a7a4a, { metalness: 0.9, roughness: 0.3 }), [-2.4, 1.2, -2.5], scene);
    mesh(foldLathe([[0.001, 0.9], [0.09, 1.0], [0.13, 1.5], [0.1, 2.0], [0.04, 2.15], [0.001, 2.2]], { folds: 7, depth: 0.25, flatten: 1 }), new THREE.MeshStandardMaterial({ color: 0x141a2a, roughness: 0.8 }), [-2.4, 0, -2.5], scene);
    mesh(new THREE.CircleGeometry(0.32, 48), std(0x2a261e, { metalness: 0.6, roughness: 0.4 }), [2.2, 1.9, -2.98], scene);
    // the door on the left wall: hinged at its back edge; the corridor behind it is lit
    const doorPivot = new THREE.Group(); doorPivot.position.set(-4.06, 0, 0.9); scene.add(doorPivot);
    mesh(new THREE.BoxGeometry(0.05, 2.15, 0.95), std(0x2c2f30, { roughness: 0.6 }), [0, 1.075, 0.475], doorPivot);
    const corM = new THREE.MeshBasicMaterial({ color: 0x000000 }); mesh(new THREE.PlaneGeometry(3, 2.6), corM, [-6.2, 1.3, 1.375], scene).rotation.y = Math.PI / 2;
    o.door = doorPivot; o.corridor = corM;
    return o;
  }

  // OFFICE: the thumbnail. Also 'back' (the stone between us and the empty chair) and 'dark' (lights die).
  function officeSet(ctx, shot) {
    const P0 = shot.params, look = P0.look ?? 'front', dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x010302, density: 0.04, fov: 30 });
    const { scene, camera, layer } = b;
    const o = office(scene);
    const stone = makeStoneObj(scene, { radius: 0.13, pos: o.stonePos, keyDir: [-0.35, 0.45, -1], keySize: [0.22, 0.12], keyI: 9, keyCol: FLUO, amb: 0x020403, visScale: 1.7,
      ember: 0.05, light: 0.35, lightDist: 2.5, vis: hallwayTex(), cardAmt: 0.5, card: blindsCard(), seed: 2.1, rim: 0.08 });
    stone.u.uVisAmt.value = 0.8;
    const fx = PP.post(ctx, scene, camera, { dof: { focus: 2, range: 0.35, bokeh: 4.5 } });
    let move, rack; const chairPos = new THREE.Vector3();
    if (look === 'back') {
      // an arc round the stone until it sits dead centre, the empty chair squared up behind it
      const s0 = o.stonePos, arc = (az, d, y) => ({ pos: [s0[0] + Math.sin(az * D2R) * d, s0[1] + y, s0[2] + Math.cos(az * D2R) * d], look: [s0[0], s0[1] + 0.01, s0[2]], mm: 65 });
      move = C.path([arc(72, 1.9, 0.22), arc(40, 1.7, 0.12), arc(12, 1.55, 0.05), arc(0, 1.5, 0.03)], { duration: dur, accel: 0.25, decel: 0.55, float: 0.004, seed: 3 });
      o.chair.position.set(s0[0] - 0.15, 0, -2.0); o.chair.rotation.y = -0.45;
      rack = () => 0;
    } else if (look === 'dark') {
      move = C.path([{ pos: [1.05, 1.08, 0.55], look: [0.3, 0.99, -1.0], mm: 45 }, { pos: [0.92, 1.05, 0.25], look: [0.33, 0.99, -1.0], mm: 50 }], { duration: dur, accel: 0.4, decel: 0.6, float: 0.004, seed: 5 });
      rack = () => 0;
    } else {
      move = C.path([{ pos: [1.25, 0.98, 0.95], look: [0.05, 0.98, -1.3], mm: 50 }, { pos: [1.02, 0.96, 0.55], look: [0.15, 0.97, -1.25], mm: 50 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.008, seed: 1 });
      const ts = wt(shot, 'stones');
      rack = (t) => K.smooth(K.range(t, Math.max(0.6, ts - 1.3), Math.max(1.6, ts - 0.1)));
    }
    o.chair.updateMatrixWorld(true); chairPos.setFromMatrixPosition(o.chair.matrixWorld).setY(1.0);
    const offAt = look === 'dark' ? [0.5, 1.15, 1.7, 2.3, 2.9, 3.5].map(x => x * Math.max(0.7, (voEnd(shot) - 0.5) / 4)) : null;
    const flick = (t, i) => { if (!offAt) return 1; const a = offAt[i]; if (t < a - 0.22) return 1; if (t > a) return 0; const z = Math.sin(t * 97 + i * 13) * Math.sin(t * 41 + i * 3); return z > 0.1 ? 0.85 : 0.08; };
    const cap = caption(layer, P0.caption, 'right:5%;top:8%');
    return { ...b, update(t, p) {
      move(camera, p, t);
      if (offAt) { const on = o.tubes.map((_, i) => flick(t, [2, 4, 0, 5, 1, 3][i])); o.setTubes(on); const kk = on.reduce((a, v) => a + v, 0) / on.length; stone.u.uKeyI.value = 9 * kk; stone.u.uCardAmt.value = 0.5 * kk; }
      const glow = look === 'dark' ? 0.06 + 0.1 * K.smooth(K.range(t, offAt[5] - 1.5, offAt[5] + 1.0)) : look === 'back' ? 0.07 : 0.05;
      stone.update(t, camera, { ember: glow, iris: look === 'back' ? 0.22 * K.smooth(K.range(t, dur * 0.4, dur)) : 0 });
      stone.u.uVisAmt.value = look === 'back' ? 0.2 : look === 'dark' ? 0.6 : 1.1;
      // rack from the empty chair to the stone (on "stones"); the other looks hold on the stone
      const dS = stone.dist(camera) - stone.radius * 0.8, dC = camera.position.distanceTo(chairPos);
      fx.focus(look === 'front' ? 1 / K.lerp(1 / dC, 1 / dS, rack(t)) : dS);
      if (look === 'dark') stone.u.uExposure.value = 1.6;
      fade(cap, t, 0.8);
    } };
  }

  // KEYS: the empty chair; a door opens on a shaft of corridor light and someone new steps in.
  function keysSet(ctx, shot) {
    const dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x010302, density: 0.05, fov: 30 });
    const { scene, camera } = b;
    const o = office(scene, { spill: 0.55 });
    const stone = makeStoneObj(scene, { radius: 0.13, pos: o.stonePos, keyDir: [-1, 0.2, 0.5], keySize: [0.06, 0.3], keyI: 18, keyCol: WORK, amb: 0x020403, ember: 0.06, light: 0.3, lightDist: 2.5, seed: 4.4 });
    const doorLight = K.keySpot(scene, { color: WORK, intensity: 0, pos: [-5.6, 1.9, 1.35], target: [1.0, 0, 0.1], angle: 0.38, penumbra: 0.5, shadow: 1024 });
    doorLight.shadow.camera.near = 1;
    const shaft = K.lightShaft(scene, { pos: [-4.3, 1.9, 1.35], target: [0.6, 0.0, 0.4], radius: 1.4, color: WORK, intensity: 0 });
    const man = C.character('UAL', { clip: 'Walk_Formal_Loop', material: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85 }), scale: 1.0 });
    scene.add(man.root); man.root.rotation.y = Math.PI / 2 + 0.25;
    const t0 = -0.45, open = (t) => K.smooth(K.range(t, t0, t0 + 0.9));
    const move = C.path([{ pos: [2.6, 1.5, 3.4], look: [-2.6, 1.05, 0.5], mm: 28 }, { pos: [2.35, 1.45, 3.15], look: [-2.8, 1.05, 0.6], mm: 28 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.01, seed: 8 });
    return { ...b, update(t, p) {
      const k = open(t); o.door.rotation.y = -k * 1.35;
      o.corridor.color.setRGB(2.2 * k, 2.0 * k, 1.8 * k);
      doorLight.intensity = 260 * k; shaft.material.uniforms.uI.value = 0.06 * k;
      const x = -5.0 + Math.max(0, t + 0.3) * 0.9;
      man.update(t); man.root.position.set(x, 0, 1.35 - (x + 4.9) * 0.15);
      move(camera, p, t);
      stone.update(t, camera, { ember: 0.06 });
    } };
  }

  // NEXT: a slow pull-back from the stone on the desk; the office drains into darkness.
  function nextSet(ctx, shot) {
    const dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.035, fov: 30 });
    const { scene, camera } = b;
    const o = office(scene, { spill: 0.8 });
    const stone = makeStoneObj(scene, { radius: 0.13, pos: o.stonePos, keyDir: [-0.35, 0.6, -1], keySize: [0.22, 0.12], keyI: 6, keyCol: FLUO, amb: 0x010201, ember: 0.07, light: 0.8, lightDist: 3, seed: 6.2, card: blindsCard(), cardAmt: 0.25, exposure: 1.3 });
    const sp = o.stonePos;
    const move = C.path([{ pos: [sp[0] + 0.15, sp[1] + 0.55, sp[2] + 0.55], look: sp, mm: 50 }, { pos: [sp[0] + 1.4, sp[1] + 2.0, sp[2] + 3.0], look: [sp[0], sp[1] - 0.1, sp[2]], mm: 40 }, { pos: [sp[0] + 1.7, 2.4, sp[2] + 4.4], look: [sp[0], sp[1] - 0.15, sp[2]], mm: 35 }], { duration: dur, accel: 0.15, decel: 0.55, float: 0.006, seed: 9 });
    return { ...b, update(t, p) {
      move(camera, p, t);
      const k = 1 - K.smooth(K.range(t, 0.4, dur * 0.85));
      o.setTubes(o.tubes.map((_, i) => K.clamp(0.25 + k * 1.2 - i * 0.06))); stone.u.uKeyI.value = 4 + 8 * k; stone.u.uCardAmt.value = 0.25 * k;
      stone.update(t, camera, { ember: 0.09 + 0.06 * (1 - k) });
    } };
  }

  // GLASS: a slow push until the curved surface fills the frame. In the reflection, someone looks in.
  function glassSet(ctx, shot) {
    const P0 = shot.params, empty = P0.variant === 'empty', dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.05, fov: 30 });
    const { scene, camera } = b;
    const stone = makeStoneObj(scene, empty
      ? { radius: 0.5, pos: [0, 0, 0], keyDir: [0.6, 0.3, 0.75], keySize: [0.025, 0.14], keyI: 14, keyCol: FLUO, amb: 0x030806, ember: 0.04, exposure: 1.4, card: watcherCard(false, '110,240,160'), cardAmt: 1.6, cardScale: 1.25, seed: 3.3 }
      : { radius: 0.5, pos: [0, 0, 0], keyDir: [-0.7, 0.5, 0.5], keySize: [0.03, 0.22], keyI: 40, keyCol: MOON, amb: 0x020304, ember: 0.05, card: watcherCard(true), cardAmt: 1.8, cardScale: 0.8, seed: 7.7 });
    const ped = mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.6, 48), std(0x111113, { roughness: 0.6 }), [0, -1.32, 0], scene);
    scene.add(new THREE.HemisphereLight(0x223040, 0x000000, 0.05));
    const fx = PP.post(ctx, scene, camera, { dof: { focus: 2, range: 0.5, bokeh: 3 } });
    const az = empty ? 0.35 : -0.2;
    const at = (d, a, e) => [Math.sin(a) * d, Math.sin(e) * d, Math.cos(a) * d];
    const move = C.path([{ pos: at(3.6, az, 0.12), look: [0, 0, 0], mm: 50 }, { pos: at(1.25, az * 0.6, 0.06), look: [0, 0.02, 0], mm: 65 }], { duration: dur, accel: 0.25, decel: 0.55, float: 0.004, seed: 2 });
    const tw = empty ? wt(shot, 'glass') : wt(shot, 'other');
    return { ...b, update(t, p) {
      move(camera, p, t);
      // rack inside the glass: from the smoke out to the reflection on "other side of the glass"
      const k = K.smooth(K.range(t, tw - 0.6, tw + 0.7));
      stone.update(t, camera, { ember: empty ? 0.06 : K.lerp(0.09, 0.03, k) });
      stone.u.uAperture.value = 1.6; stone.u.uFocus.value = K.lerp(1.0, 0.22, k);
      stone.u.uCardAmt.value = (empty ? 3.0 : 3.0) * K.lerp(0.4, 1, k);
      fx.focus(stone.dist(camera) - 0.5);
    } };
  }

  // MACRO: extreme close-up inside the glass; rack from the surface reflection into the depths.
  // variant 'question': another angle, cold monitor-blue key, the rack the other way.
  function macroSet(ctx, shot) {
    const P0 = shot.params, q = P0.variant === 'question', dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.04, fov: 30 });
    const { scene, camera } = b;
    const armies = canvasTex(512, 512, () => {}); const ac = armies.image.getContext('2d');
    const stone = makeStoneObj(scene, q
      ? { radius: 0.5, pos: [0, 0, 0], keyDir: [0.9, 0.15, 0.4], keySize: [0.32, 0.2], keyI: 40, keyCol: MONITOR, amb: 0x060c1c, ember: 0.06, smokeCol: 0x8fb4ff, seed: 5.5, emberCol: 0xff6a2a, exposure: 1.5 }
      : { radius: 0.5, pos: [0, 0, 0], keyDir: [-0.55, 0.62, 0.55], keySize: [0.03, 0.2], keyI: 60, keyCol: MOON, amb: 0x020305, ember: 0.05, seed: 1.9, vis: armies, visScale: 1.15, visBlur: 1.5 });
    if (q) { const mon = mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: 0x3a5ab0 }), [3.6, 0.6, 1.6], scene); mon.lookAt(0, 0, 0); const ml = new THREE.RectAreaLight ? null : null;
      const key = new THREE.DirectionalLight(MONITOR, 0.6); key.position.set(3, 0.5, 1.4); scene.add(key); }
    else { const key = new THREE.DirectionalLight(MOON, 0.5); key.position.set(-2, 2.4, 2); scene.add(key); }
    const fx = PP.post(ctx, scene, camera, { dof: { focus: 1, range: 0.6, bokeh: 4 } });
    const move = q
      ? C.path([{ pos: [-1.9, -0.55, 1.75], look: [0.05, 0.02, 0], mm: 85 }, { pos: [-1.62, -0.42, 1.62], look: [0.05, 0.04, 0], mm: 85 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.002, seed: 6 })
      : C.path([{ pos: [0.35, 0.95, 2.6], look: [-0.06, 0.06, 0], mm: 85 }, { pos: [0.25, 0.72, 2.15], look: [-0.05, 0.05, 0], mm: 85 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.002, seed: 6 });
    const ta = q ? wt(shot, 'actually') : wt(shot, 'watch');
    return { ...b, update(t, p) {
      move(camera, p, t);
      const k = K.smooth(K.range(t, ta, ta + 1.4));
      stone.u.uAperture.value = K.lerp(0.9, 0.45, k);
      stone.u.uFocus.value = q ? K.lerp(1.1, 0.24, k) : K.lerp(0.22, 1.05, k);
      if (!q) { const kv = K.smooth(K.range(t, wt(shot, 'armies') - 0.5, wt(shot, 'armies') + 0.8)); const fk = Math.floor(t * 12); if (kv > 0 && armies.userData.k !== fk) { armies.userData.k = fk; drawArmy(ac, 512, 512, fk / 12, { seed: 4, glow: 1 }); armies.needsUpdate = true; } stone.u.uVisAmt.value = 0.45 * kv * (1 - K.range(t, dur - 0.6, dur)); }
      stone.update(t, camera, { ember: q ? 0.06 : 0.05 });
      fx.focus(stone.dist(camera) - 0.48);
    } };
  }

  // EYE: the smoke coalesces into a slow vortex, a ring that turns toward camera. Push in.
  function eyeSet(ctx, shot) {
    const dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.04, fov: 30 });
    const { scene, camera } = b;
    const stone = makeStoneObj(scene, { radius: 0.5, pos: [0, 0, 0], keyDir: [0.6, 0.7, 0.35], keySize: [0.03, 0.18], keyI: 30, keyCol: MOON, amb: 0x010203, ember: 0.08, seed: 8.8, smoke: 9, thin: 0.12, exposure: 1.4 });
    const move = C.path([{ pos: [0.35, 0.12, 4.8], look: [0, 0, 0], mm: 65 }, { pos: [0.1, 0.03, 3.2], look: [0, 0, 0], mm: 65 }], { duration: dur, accel: 0.2, decel: 0.5, float: 0.004, seed: 3 });
    const d0 = V3([-0.85, 0.4, 0.35]).normalize(), d1 = V3([0, 0, 1]);
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t);
      const k = K.smooth(K.range(t, 0.1, dur * 0.7)), turn = K.smooth(K.range(t, dur * 0.25, dur * 0.95));
      const dir = d0.clone().lerp(d1.clone().copy(camera.position).normalize(), turn).normalize();
      stone.update(t, camera, { ember: K.lerp(0.1, 0.12, k), iris: k, irisDir: dir });
    } });
  }

  // AWAKE: "Then AI arrived." The stone holds at ember, then ignites.
  function awakeSet(ctx, shot) {
    const dur = shot.duration;
    const b = base(ctx, { floor: 0x141414, fog: 0x000000, density: 0.06, fov: 30 });
    const { scene, camera } = b;
    b.ground.material.roughness = 0.35; b.ground.material.metalness = 0.3; const tex = K.grimeTexture(31, 90); tex.repeat.set(30, 30); b.ground.material.roughnessMap = tex;
    const wall = mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.9 }), [0, 6, -4], scene);
    const ped = mesh(new THREE.BoxGeometry(0.7, 1.1, 0.7), std(0x161618, { roughness: 0.5 }), [0, 0.55, 0], scene);
    const stone = makeStoneObj(scene, { radius: 0.36, pos: [0, 1.46, 0], keyDir: [0, 0.9, 0.3], keySize: [0.25, 0.08], keyI: 6, keyCol: WORK, amb: 0x020202, ember: 0.03, light: 8, lightDist: 14, seed: 9.9 });
    stone.mesh.castShadow = false; stone.light.castShadow = true; stone.light.shadow.mapSize.set(512, 512); stone.light.shadow.bias = -0.002;
    const motes = K.dust(scene, { count: 600, box: [8, 4, 6], center: [0, 2, 0], size: 0.02, opacity: 0.4, color: 0xffc89a });
    const ta = wt(shot, 'arrived');
    const move = C.path([{ pos: [0, 1.0, 4.4], look: [0, 1.42, 0], mm: 65 }, { pos: [0, 1.05, 4.0], look: [0, 1.44, 0], mm: 65 }], { duration: dur, accel: 0.4, decel: 0.4, float: 0.004, seed: 1 });
    return { ...b, update(t, p) {
      move(camera, p, t); motes.update(t);
      const f = K.outExpo(K.range(t, ta + 0.3, ta + 0.8)) * (1 - 0.25 * K.smooth(K.range(t, ta + 0.6, dur)));
      stone.update(t, camera, { ember: 0.05 + f * 0.04, flare: f });
      motes.material.opacity = 0.1 + 0.5 * f;
    } };
  }

  // WEB: the interior resolves into a network of connections suspended in the smoke.
  function webSet(ctx, shot) {
    const dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.02, fov: 30 });
    const { scene, camera } = b;
    const R = 0.6;
    const stone = makeStoneObj(scene, { radius: R, pos: [0, 0, 0], keyDir: [-0.6, 0.6, 0.5], keySize: [0.04, 0.2], keyI: 30, keyCol: MOON, amb: 0x010203, ember: 0.04, seed: 3.7 });
    const net = new THREE.Group(); scene.add(net); const r = K.rng(17); const nodes = [];
    for (let i = 0; i < 90; i++) { let v; do { v = V3([r() - 0.5, r() - 0.5, r() - 0.5]).multiplyScalar(2); } while (v.length() > 1); v.multiplyScalar(R * 0.78); nodes.push(v); }
    nodes.sort((a, c) => a.length() - c.length());
    const edges = []; for (let i = 0; i < nodes.length; i++) { const cand = nodes.map((v, j) => [v.distanceTo(nodes[i]), j]).filter(([d, j]) => j < i).sort((a, c) => a[0] - c[0]).slice(0, 2); for (const [, j] of cand) edges.push([j, i]); }
    const dot = radialTex([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,240,220,.5)'], [1, 'rgba(255,240,220,0)']], 64);
    const pg = new THREE.BufferGeometry().setFromPoints(nodes); const pc = new Float32Array(nodes.length * 3); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.05, map: dot, vertexColors: true, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    pts.renderOrder = 5; net.add(pts);
    const lp = new Float32Array(edges.length * 6), lc = new Float32Array(edges.length * 6);
    edges.forEach(([a, c], i) => { lp.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[c].x, nodes[c].y, nodes[c].z], i * 6); });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    lines.renderOrder = 4; net.add(lines);
    const tc = wt(shot, 'connections'), ta = wt(shot, 'map');
    const move = C.path([{ pos: [0.5, 0.25, 2.9], look: [0, 0, 0], mm: 50 }, { pos: [0.2, 0.1, 1.4], look: [0, 0, 0], mm: 45 }, { pos: [0.05, 0.02, 0.62], look: [0, 0, -0.3], mm: 35 }], { duration: dur, accel: 0.25, decel: 0.35, float: 0.004, seed: 4 });
    const ice = new THREE.Color(0x9fc4ff), paper = new THREE.Color(0xe8e0d0);
    return { ...b, update(t, p) {
      move(camera, p, t);
      const g = K.range(t, ta - 1.2, Math.min(dur - 0.2, tc + 1.2));
      net.rotation.y = t * 0.05; net.rotation.x = 0.15;
      nodes.forEach((_, i) => { const k = K.smooth(K.range(g * 1.25 - i / nodes.length, 0, 0.12)); pc[i * 3] = paper.r * k * 1.4; pc[i * 3 + 1] = paper.g * k * 1.4; pc[i * 3 + 2] = paper.b * k * 1.4; });
      pg.attributes.color.needsUpdate = true;
      edges.forEach(([a, c], i) => { const k = Math.min(pc[a * 3], pc[c * 3]) / 1.4 * 0.5; for (const o of [0, 3]) { lc[i * 6 + o] = ice.r * k; lc[i * 6 + o + 1] = ice.g * k; lc[i * 6 + o + 2] = ice.b * k; } });
      lg.attributes.color.needsUpdate = true;
      // the smoke thins as the structure appears; once we are inside, the glass is gone
      stone.u.uSmoke.value = K.lerp(7, 3, g); stone.u.uThin.value = K.lerp(0.25, 0.1, g);
      const inside = camera.position.length() < R * 1.02; stone.mesh.visible = !inside;
      stone.update(t, camera, { ember: K.lerp(0.05, 0.03, g) });
    } };
  }

  // ------------------------------------------------------------------ SEVEN: the relief map
  // An invented continent: a western coast with a deep gulf, a long north-south range, and in the
  // east a land walled in by mountains. Seven stones, one of them (G) in the walled land.
  const MAP = { W: 44, D: 30, N: 220 };
  const STONES7 = [[-15.5, -5.5], [-11, -10], [-6.5, -4.5], [-1.2, 1.2], [3.8, 5.6], [7.2, 3.6], [12.5, 2.5]];
  const LINKS7 = [[0, 1], [1, 2], [0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [2, 4], [3, 5]];
  let MAPGEO = null;
  function mapGeometry() {
    if (MAPGEO) return MAPGEO;
    const { W, D, N } = MAP; const r = K.rng(31); const L = new Float32Array(66 * 66).map(() => r());
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const g = (i, j) => L[(((i % 64) + 64) % 64) * 66 + (((j % 64) + 64) % 64)];
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return K.lerp(K.lerp(g(xi, yi), g(xi + 1, yi), u), K.lerp(g(xi, yi + 1), g(xi + 1, yi + 1), u), v); };
    const fbm = (x, y, o = 5) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };
    const blobs = [[-8, -2, 9, 8], [2, 2, 9, 7], [11, 3, 7, 6], [-12, -9, 6, 4], [5, 10, 6, 3], [-3, 9, 5, 3], [14, -6, 5, 4]];
    const seg = (px, pz, a, c) => { const dx = c[0] - a[0], dz = c[1] - a[1]; const k = K.clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz)); return Math.hypot(px - a[0] - dx * k, pz - a[1] - dz * k); };
    const ranges = [[[-3.5, -12], [-2.4, -3], [-2.8, 0]], [[8.5, -3.2], [16.5, -3.6]], [[8.5, -3.2], [9.2, 7.5]], [[9.2, 7.5], [17, 6.8]], [[-11, 3], [-6, 5.5]]];
    const g = new THREE.PlaneGeometry(W, D, N, N); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), H = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i);
      let land = 0; for (const [bx, bz, sx, sz] of blobs) land += Math.exp(-(((x - bx) / sx) ** 2 + ((z - bz) / sz) ** 2));
      land += (fbm(x * 0.12 + 3, z * 0.12 + 7) - 0.5) * 1.3; land -= Math.exp(-(((x + 13) / 3.5) ** 2 + ((z - 1) / 2.2) ** 2)) * 1.1; // the gulf
      land -= Math.exp(-(((x - 4) / 3) ** 2 + ((z + 6) / 2) ** 2)) * 0.8; // an inland sea
      let h = (land - 0.55) * 1.2;
      if (h > 0) { const c = K.smooth(K.clamp(h / 0.35)); h = 0.03 + h * 0.3 + (fbm(x * 0.4, z * 0.4, 4) - 0.5) * 0.3 * c;
        let m = 0; for (const pl of ranges) for (let k = 0; k < pl.length - 1; k++) m = Math.max(m, Math.exp(-((seg(x, z, pl[k], pl[k + 1]) / 1.3) ** 2)));
        const ridge = 1 - Math.abs(fbm(x * 0.7 + 9, z * 0.7, 4) * 2 - 1); h += m * c * (0.35 + ridge * 0.45); h = Math.max(0.02, h); }
      else h = Math.max(-0.3, h * 0.4) + 0.01;
      H[i] = h; p.setY(i, h);
      const lv = h > 0 ? 0.16 + Math.min(h, 2.0) * 0.08 : 0.01; const tone = h > 0 ? [lv * 1.04, lv, lv * 0.9] : [0.006, 0.009, 0.014];
      col.set(tone, i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const height = (x, z) => { const fx = (x + W / 2) / W * N, fz = (z + D / 2) / D * N; const i = Math.round(fz) * (N + 1) + Math.round(fx); return Math.max(0, H[K.clamp(i, 0, H.length - 1)] ?? 0); };
    MAPGEO = { g, height }; return MAPGEO;
  }
  function sevenSet(ctx, shot) {
    const P0 = shot.params, red = !!P0.red, spread = P0.variant === 'spread', dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x010204, density: 0.012, fov: 30 });
    const { scene, camera } = b;
    const { g, height } = mapGeometry();
    const land = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.05 })); land.receiveShadow = land.castShadow = true; scene.add(land);
    const sea = mesh(new THREE.PlaneGeometry(MAP.W * 3, MAP.D * 3), new THREE.MeshStandardMaterial({ color: 0x020305, roughness: 0.25, metalness: 0.6 }), [0, -0.01, 0], scene); sea.rotation.x = -Math.PI / 2;
    const moon = new THREE.DirectionalLight(0x8fa4d0, 2.2); moon.position.set(-30, 7, -26); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 20, bottom: -20, near: 1, far: 90 }); moon.shadow.bias = -0.0008; scene.add(moon);
    scene.add(new THREE.HemisphereLight(0x1a2234, 0x000000, 0.25));
    const glowT = radialTex([[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,220,180,.8)'], [0.4, 'rgba(255,140,60,.18)'], [1, 'rgba(255,120,40,0)']]);
    const st = STONES7.map(([x, z], i) => { const y = height(x, z) + 0.12;
      const sm = new THREE.SpriteMaterial({ map: glowT, color: 0xffb070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const sp = new THREE.Sprite(sm); sp.position.set(x, y + 0.1, z); sp.scale.setScalar(1.6); scene.add(sp);
      const l = new THREE.PointLight(0xff8a40, 6, 7, 1.8); l.position.set(x, y + 0.6, z); scene.add(l);
      return { x, y, z, sm, sp, l }; });
    const ENEMY = 6;
    const lineM = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const links = LINKS7.map(([a, c]) => { const A = st[a], B = st[c]; const len = Math.hypot(A.x - B.x, A.z - B.z);
      const mid = V3([(A.x + B.x) / 2, Math.max(A.y, B.y) + 0.8 + len * 0.12, (A.z + B.z) / 2]);
      const curve = new THREE.QuadraticBezierCurve3(V3([A.x, A.y + 0.1, A.z]), mid, V3([B.x, B.y + 0.1, B.z]));
      const geo = new THREE.TubeGeometry(curve, 80, 0.028, 5, false); const m = new THREE.Mesh(geo, lineM(0xffd8b0)); scene.add(m);
      const geo2 = new THREE.TubeGeometry(curve, 80, 0.045, 5, false); const m2 = new THREE.Mesh(geo2, lineM(RED)); scene.add(m2);
      return { a, c, m, m2, n: geo.index.count, curve }; });
    // order of corruption: breadth-first from the enemy's stone, one link at a time
    const order = []; { const seen = new Set([ENEMY]); let front = [ENEMY]; while (front.length) { const nx = []; for (const s of front) for (const L of links) { const o = L.a === s ? L.c : L.c === s ? L.a : -1; if (o >= 0 && !seen.has(o)) { seen.add(o); nx.push(o); order.push({ L, from: s, to: o }); } } front = nx; } }
    const motes = K.dust(scene, { count: 500, box: [40, 4, 26], center: [0, 2, 0], size: 0.06, opacity: 0.18, color: 0x9fb0d0 });
    let move;
    if (spread) move = C.path([{ pos: [16, 17, 20], look: [2, 0, 0], mm: 35 }, { pos: [4, 19, 23], look: [0, 0, -0.5], mm: 35 }, { pos: [-8, 18, 21], look: [-1, 0, -1], mm: 35 }], { duration: dur, accel: 0.3, decel: 0.4, float: 0.02, seed: 7 });
    else if (red) move = C.path([{ pos: [-6, 15, 19], look: [9, 0.4, 2.0], mm: 50 }, { pos: [-1.5, 12.5, 15.5], look: [10.8, 0.4, 2.3], mm: 50 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.01, seed: 5 });
    else move = C.path([{ pos: [-1.5, 40, 6], look: [-1.5, 0, -0.5], mm: 35 }, { pos: [-2, 22, 16], look: [-2, 0, -1], mm: 35 }, { pos: [-3, 9, 19], look: [-2.5, 0.5, -2], mm: 40 }], { duration: dur, accel: 0.25, decel: 0.55, float: 0.02, seed: 3 });
    const tEnemy = red && !spread ? wt(shot, 'enemy') : 0;
    const tS0 = spread ? wt(shot, 'enemy') : 0, tS1 = spread ? Math.min(dur - 0.8, voEnd(shot) - 0.4) : 0;
    const warm = new THREE.Color(0xffb070), redC = new THREE.Color(0xff2a1a);
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t); motes.update(t);
      // speak: the faint links between the stones draw on
      const draw = red || spread ? 1 : K.smooth(K.range(t, 0.2, Math.max(1.2, voEnd(shot) - 0.6)));
      links.forEach((L, i) => { const k = K.clamp(draw * links.length * 0.55 - i * 0.55 * 0.9); L.m.geometry.setDrawRange(0, Math.floor(L.n * k / 3) * 3); L.m.material.opacity = (spread ? 0.35 : red ? 0.35 : 0.6) * (k > 0 ? 1 : 0); L.m2.geometry.setDrawRange(0, 0); });
      const redness = st.map(() => 0);
      if (red) redness[ENEMY] = spread ? 1 : K.smooth(K.range(t, tEnemy - 0.1, tEnemy + 0.5));
      if (spread) order.forEach((o, i) => { const a = K.lerp(tS0, tS1, i / order.length), c = K.lerp(tS0, tS1, (i + 1) / order.length); const k = K.smooth(K.range(t, a, c));
        o.L.m2.geometry.setDrawRange(0, Math.floor(o.L.n * k / 3) * 3); o.L.m2.material.opacity = k > 0 ? 0.9 : 0;
        // the tube is built a->c: if the corruption runs c->a, reverse by drawing from the far end is not possible with drawRange; flip the mesh
        if (o.L.a !== o.from && !o.L.m2.userData.flipped) { const cv = o.L.curve; const rc = new THREE.QuadraticBezierCurve3(cv.v2, cv.v1, cv.v0); o.L.m2.geometry.dispose(); o.L.m2.geometry = new THREE.TubeGeometry(rc, 80, 0.045, 5, false); o.L.m2.userData.flipped = true; }
        redness[o.to] = Math.max(redness[o.to], K.smooth(K.range(t, c - 0.1, c + 0.3))); });
      st.forEach((s, i) => { const k = redness[i]; const fl = 0.92 + 0.08 * Math.sin(t * 2.3 + i * 1.7);
        s.sm.color.copy(warm).lerp(redC, k); s.l.color.copy(warm).lerp(redC, k); s.l.intensity = (6 + k * 2) * fl; s.sp.scale.setScalar((1.5 - k * 0.3) * fl); });
    } });
  }

  // ------------------------------------------------------------------ SEEN: from inside the stone
  // The room is rendered to a target; a full-screen pass bends it through the ball of glass,
  // splits it at the edges, and lays the smoke over it.
  function seenSet(ctx, shot) {
    const dur = shot.duration, { renderer } = ctx;
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.0, fov: 30 });
    const { scene, camera, layer } = b;
    const inner = new THREE.Scene(); inner.fog = new THREE.FogExp2(0x020306, 0.06); inner.background = new THREE.Color(0x010103);
    const icam = new THREE.PerspectiveCamera(70, ctx.width / ctx.height, 0.02, 100);
    const wall = stoneWallTex(3, { rows: 14, light: 110 }).clone(); wall.repeat.set(5, 2);
    const tower = mesh(new THREE.CylinderGeometry(6.5, 6.5, 11, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a8c94, map: wall, roughness: 0.92, side: THREE.BackSide }), [0, 5.5, 0], inner); tower.castShadow = false;
    const win = mesh(new THREE.PlaneGeometry(0.5, 2.8), new THREE.MeshBasicMaterial({ color: 0xc0d0f0, fog: false }), [0, 5.6, -6.4], inner);
    const fig = robe({ lean: 0.55, arms: 'reach', seed: 4, mat: clothMat(0x0a0a0c, 0x5a6478) }); fig.g.position.set(0, 0, -1.0); fig.g.scale.setScalar(1.1); inner.add(fig.g);
    const moon = K.keySpot(inner, { color: MOON, intensity: 4200, pos: [0.4, 6.5, -6.6], target: [0, 1.4, -0.6], angle: 0.25, penumbra: 0.5, shadow: 0 });
    K.lightShaft(inner, { pos: [0, 5.6, -6.3], target: [0, 1.4, -0.4], radius: 1.4, color: MOON, intensity: 0.2 });
    const under = new THREE.PointLight(0xff7030, 0.25, 3, 2); under.position.set(0, 1.25, 0); inner.add(under);
    inner.add(new THREE.HemisphereLight(0x223048, 0x050505, 0.08));
    const motes = K.dust(inner, { count: 500, box: [3, 4, 3], center: [0, 2.6, -1.5], size: 0.02, opacity: 0.45, color: 0xcfd8ff });
    const rt = new THREE.WebGLRenderTarget(ctx.width, ctx.height, { type: THREE.HalfFloatType, depthBuffer: true });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { uTex: { value: rt.texture }, uNoise: { value: noise3D() }, uT: { value: 0 }, uAspect: { value: ctx.width / ctx.height }, uEmber: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `precision highp float; precision highp sampler3D; uniform sampler2D uTex; uniform sampler3D uNoise; uniform float uT, uAspect, uEmber; varying vec2 vUv;
        void main(){
          vec2 c = (vUv - 0.5) * vec2(uAspect, 1.0); float r = length(c);
          float R = 0.98;                                  // the glass boundary, seen from inside
          float k = 0.62 + 0.55 * r * r;                   // a strong barrel: the world bends round the ball
          vec3 col;
          col.r = texture(uTex, 0.5 + c * k * 1.012 / vec2(uAspect, 1.0)).r;
          col.g = texture(uTex, 0.5 + c * k / vec2(uAspect, 1.0)).g;
          col.b = texture(uTex, 0.5 + c * k * 0.988 / vec2(uAspect, 1.0)).b;
          float edge = smoothstep(R - 0.25, R + 0.02, r);
          col *= 0.35 + 0.65 * (1.0 - edge) * vec3(0.95, 0.9, 0.85);
          // the inside of the ball: the ember glow pooled at the bottom, smoke drifting across the view
          vec3 q = vec3(c * 1.3, uT * 0.03); q.x += uT * 0.02;
          vec4 w = texture(uNoise, q * 0.6 + vec3(0.2, 0.1, 0.0));
          float sm = smoothstep(0.42, 0.85, texture(uNoise, q + (w.bab - 0.5) * 0.6).r);
          vec3 ember = vec3(1.0, 0.35, 0.1) * uEmber;
          float low = smoothstep(0.2, -0.75, c.y);
          col = mix(col, col * 0.55, sm * 0.35) + ember * (sm * 0.05 + 0.01) * (0.1 + low * 1.6);
          col += ember * edge * 0.1 * (0.5 + 0.5 * sm);   // light trapped in the glass at the rim
          col += vec3(0.7, 0.75, 0.9) * smoothstep(0.035, 0.0, abs(r - R)) * 0.12;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`, depthTest: false, depthWrite: false }));
    quad.frustumCulled = false; scene.add(quad);
    const look0 = V3([0, 2.05, -0.95]), look1 = V3([0, 1.85, -0.7]);
    return scopeSet({ ...b, update(t, p) {
      const k = K.inOut(p); motes.update(t);
      fig.upper.rotation.x = K.lerp(0.38, 0.55, K.smooth(p)); fig.head.rotation.x = K.lerp(0.35, 0.6, K.smooth(p));
      for (const [s, A] of [[-1, fig.L], [1, fig.R]]) { A.sg.rotation.set(-0.95, 0, s * 0.25); A.fore.rotation.set(-0.45, 0, -s * 0.35); }
      const h = K.handheld(t, 0.01, 4);
      icam.position.set(0.05 + h.x, 1.25 + h.y, 0.02 - k * 0.1); icam.lookAt(look0.clone().lerp(look1, k)); icam.rotation.z += 0.05 * Math.sin(t * 0.2);
      icam.fov = K.lerp(86, 78, k); icam.updateProjectionMatrix();
      renderer.setRenderTarget(rt); renderer.render(inner, icam); renderer.setRenderTarget(null);
      quad.material.uniforms.uT.value = t; quad.material.uniforms.uEmber.value = 0.8 + 0.2 * Math.sin(t * 0.7);
      camera.position.set(0, 0, 1); camera.lookAt(0, 0, 0);
    } });
  }

  // ------------------------------------------------------------------ GIFT: seven stones on velvet, firelit
  function hallBits(scene, { columns = true } = {}) {
    const wall = stoneWallTex(12, { rows: 10, light: 100 }).clone(); wall.repeat.set(1, 4);
    const colM = new THREE.MeshStandardMaterial({ color: 0x7a6c60, map: wall, bumpMap: wall, bumpScale: 1.5, roughness: 0.9 });
    if (columns) for (let i = 0; i < 6; i++) for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.45, 0.5, 9, 24), colM, [s * 4.2, 4.5, 2 - i * 4], scene);
    const back = stoneWallTex(13, { rows: 12, light: 90 }).clone(); back.repeat.set(4, 2);
    mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ color: 0x6a5a50, map: back, roughness: 0.92 }), [0, 6, -20], scene);
  }
  function velvet(w, d, seed = 2) {
    const g = new THREE.PlaneGeometry(w, d, 120, 80); g.rotateX(-Math.PI / 2); const p = g.attributes.position; const r = K.rng(seed);
    const folds = Array.from({ length: 7 }, () => [r() * w - w / 2, r() * d - d / 2, 0.3 + r() * 0.5, r() * 6.28]);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); let y = 0;
      for (const [fx, fz, s, a] of folds) { const u = (x - fx) * Math.cos(a) + (z - fz) * Math.sin(a), v = -(x - fx) * Math.sin(a) + (z - fz) * Math.cos(a); y += 0.035 * Math.exp(-((u / (s * 0.25)) ** 2)) * Math.exp(-((v / (s * 3)) ** 2)); }
      // the cloth spills over the front edge of the table
      if (z > d / 2 - 0.25) y -= (z - (d / 2 - 0.25)) * 2.6;
      p.setY(i, y); }
    g.computeVertexNormals(); return g;
  }
  function giftSet(ctx, shot) {
    const P0 = shot.params, kings = P0.variant === 'kings', dur = shot.duration;
    const b = base(ctx, { floor: 0x16110d, fog: 0x0a0503, density: kings ? 0.07 : 0.06, fov: 30 });
    const { scene, camera } = b;
    hallBits(scene, { columns: !kings });
    const table = mesh(new THREE.BoxGeometry(3.4, 0.9, 1.6), std(0x1a100a, { roughness: 0.6 }), [0, 0.45, 0], scene);
    const vel = new THREE.Mesh(velvet(3.5, 1.7, kings ? 5 : 2), new THREE.MeshPhysicalMaterial({ color: 0x070203, roughness: 0.95, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(0x3a1418) }));
    vel.position.y = 0.905; vel.receiveShadow = true; scene.add(vel);
    const r = K.rng(9); const xs = [-1.25, -0.85, -0.42, 0.0, 0.42, 0.85, 1.25];
    const fireDir = [1, 0.5, 0.6];
    const stones = xs.map((x, i) => { const rad = i === 3 ? 0.12 : 0.075 + r() * 0.025; const z = -0.25 + Math.pow(Math.abs(x), 1.6) * 0.32;
      return makeStoneObj(scene, { radius: rad, pos: [x, 0.92 + rad, z], keyDir: fireDir, keySize: [0.12, 0.1], round: 1, keyI: 30, keyCol: SODIUM, amb: 0x0c0604, ember: 0.05, light: 0, seed: i * 1.7, rim: 0.03, exposure: 1.4 }); });
    // the fire: off to the right, a flickering key and a glow in the haze
    const fire = new THREE.PointLight(0xff9a50, 75, 14, 1.6); fire.position.set(4.0, 1.6, 1.5); fire.castShadow = true; fire.shadow.mapSize.set(1024, 1024); scene.add(fire);
    const fill = new THREE.PointLight(0xff7a30, 30, 30, 1.2); fill.position.set(-2, 5, -10); scene.add(fill);
    const hearth = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex([[0, 'rgba(255,200,120,1)'], [0.3, 'rgba(255,120,40,.4)'], [1, 'rgba(255,80,20,0)']]), color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    hearth.position.set(kings ? 0 : 6, kings ? 4 : 1.4, kings ? -14 : 0.5); hearth.scale.setScalar(kings ? 14 : 6); scene.add(hearth);
    const motes = K.dust(scene, { count: 700, box: [10, 5, 10], center: [0, 2.5, -2], size: 0.03, opacity: 0.4, color: 0xffb070 });
    let move;
    if (kings) {
      // the seven kings: banners and crowned throne-backs, silhouettes in the haze behind
      const banM = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide });
      const crownM = std(0x050403, { roughness: 0.6 });
      for (let i = 0; i < 7; i++) { const x = (i - 3) * 2.2; const bg = new THREE.PlaneGeometry(1.1, 4.4, 8, 20); const bp = bg.attributes.position;
        for (let j = 0; j < bp.count; j++) { const yy = bp.getY(j), xx = bp.getX(j); bp.setZ(j, Math.sin(xx * 5 + i) * 0.05 + Math.sin(yy * 2 + i) * 0.03); if (yy < -2.0) bp.setY(j, yy + Math.abs(xx) * 1.2 - 0.3); }
        bg.computeVertexNormals(); const ban = mesh(bg, banM([0x2a0a08, 0x0a1020, 0x141008][i % 3]), [x, 6.8, -9 - Math.abs(i - 3) * 0.6], scene);
        const tb = mesh(new THREE.BoxGeometry(0.9, 2.6, 0.2), crownM, [x, 1.3, -6.5 - Math.abs(i - 3) * 0.5], scene);
        const crown = new THREE.Group(); crown.position.set(x, 2.75, -6.5 - Math.abs(i - 3) * 0.5); scene.add(crown);
        mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.18, 24, 1, true), crownM, [0, 0, 0], crown).material.side = THREE.DoubleSide;
        for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; mesh(new THREE.ConeGeometry(0.045, 0.2, 6), crownM, [Math.sin(a) * 0.27, 0.18, Math.cos(a) * 0.27], crown); } }
      const back = K.keySpot(scene, { color: 0xffa060, intensity: 2200, pos: [0, 9, -18], target: [0, 1, -4], angle: 0.6, penumbra: 0.8, shadow: 0 });
      K.lightShaft(scene, { pos: [0, 10, -17], target: [0, 0, -4], radius: 5, color: 0xffa060, intensity: 0.05 });
      move = C.path([{ pos: [-0.9, 0.86, 2.4], look: [0.0, 1.6, -3], mm: 28 }, { pos: [0.5, 0.88, 2.15], look: [0.2, 1.7, -3], mm: 28 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.01, seed: 2 });
    } else {
      move = C.path([{ pos: [-3.0, 1.75, 3.3], look: [-0.5, 0.95, 0], mm: 50 }, { pos: [0.4, 1.7, 3.5], look: [0.7, 0.95, 0], mm: 50 }], { duration: dur, accel: 0.3, decel: 0.4, float: 0.008, seed: 3 });
    }
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t); motes.update(t);
      const fl = 0.85 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1) + 0.05 * Math.sin(t * 13.7);
      fire.intensity = 75 * fl; hearth.material.opacity = 0.5 * fl;
      stones.forEach((s, i) => s.update(t, camera, { ember: 0.06 + 0.012 * Math.sin(t * 0.8 + i) }));
    } });
  }

  // ------------------------------------------------------------------ TOWER: black obsidian spire at night
  function towerGeometry() {
    // an original spire: an eight-pointed star in plan, extruded sheer, tapering with a slow twist,
    // flaring at the root and splitting into four leaning horns at the crown
    const g = new THREE.Group();
    const obs = new THREE.MeshStandardMaterial({ color: 0x2a2c34, roughness: 0.1, metalness: 0.92, flatShading: true });
    const sh = new THREE.Shape(); const n = 8;
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, r = i % 2 ? 6.0 : 9.0; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    const H = 118, geo = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: false, steps: 36 }); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = y / H;
      const tw = k * 0.32, sc = 1 - 0.2 * k + 0.55 * Math.exp(-y / 7);
      p.setXYZ(i, (x * Math.cos(tw) - z * Math.sin(tw)) * sc, y, (x * Math.sin(tw) + z * Math.cos(tw)) * sc); }
    geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, obs));
    const topR = 9 * 0.8, tw = 0.32;
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 8 * 0 + tw; const hg = new THREE.ConeGeometry(2.0, 24, 4); hg.translate(0, 12, 0);
      const h = new THREE.Mesh(hg, obs); h.position.set(Math.cos(a) * topR * 0.78, H - 1, -Math.sin(a) * topR * 0.78); h.lookAt(Math.cos(a) * 60, H + 200, -Math.sin(a) * 60); h.rotateX(Math.PI / 2); g.add(h); }
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.6, 3, 8), obs); crown.position.y = H + 1; g.add(crown);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.2), new THREE.MeshBasicMaterial({ color: 0xffa060, fog: false })); win.position.set(0, 104, 7.35); g.add(win);
    const rock = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.8, flatShading: true });
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(24, 30, 4, 16), rock); plinth.position.y = -1; g.add(plinth);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  function towerSet(ctx, shot) {
    const dur = shot.duration;
    const b = base(ctx, { floor: 0x0e0f12, fog: 0x05070b, density: 0.0035, fov: 30 });
    const { scene, camera } = b;
    C.sky(scene, 'kloppenheim_06_puresky', { intensity: 0.35, background: false });
    scene.background = new THREE.Color(0x03060d);
    const skyTex = canvasTex(16, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#03060d'); g.addColorStop(0.42, '#1a2a46'); g.addColorStop(0.5, '#3a4c6e'); g.addColorStop(0.56, '#0a0e16'); g.addColorStop(1, '#05070b'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 24), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })); skyDome.renderOrder = -1; scene.add(skyDome);
    const tw = towerGeometry(); scene.add(tw);
    // the ring wall of the plain
    const ring = mesh(new THREE.TorusGeometry(150, 3, 6, 128), std(0x08090b, { roughness: 0.7 }), [0, 1, 0], scene); ring.rotation.x = Math.PI / 2; ring.scale.z = 3;
    const moon = new THREE.DirectionalLight(0x9fb4e0, 3.0); moon.position.set(-160, 140, -120); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -60, right: 60, top: 150, bottom: -10, near: 10, far: 600 }); scene.add(moon);
    const rim = new THREE.DirectionalLight(0x8fa8e0, 2.2); rim.position.set(140, 90, -220); scene.add(rim);
    const moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex([[0, 'rgba(255,255,255,1)'], [0.08, 'rgba(230,236,255,1)'], [0.1, 'rgba(180,200,240,.35)'], [0.4, 'rgba(120,140,200,.08)'], [1, 'rgba(0,0,0,0)']], 256), transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    moonDisc.position.set(-230, 208, -376); moonDisc.scale.setScalar(150); moonDisc.renderOrder = 2; scene.add(moonDisc);
    const clouds = C.cloudLayer(scene, { y: 200, spread: 1400, count: 120, size: 260, color: 0x2c3448, seed: 4 });
    clouds.children.forEach(s => { s.material.opacity = 0.5; s.material.fog = false; s.material.color.set(0x56627e); });
    const low = C.cloudLayer(scene, { y: 40, spread: 500, count: 50, size: 120, color: 0x1a1f2a, seed: 9 }); low.children.forEach(s => { s.material.opacity = 0.35; });
    scene.add(new THREE.HemisphereLight(0x1c2436, 0x000000, 0.25));
    const move = C.path([{ pos: [95, 3, 235], look: [0, 62, 0], mm: 35 }, { pos: [78, 48, 200], look: [0, 84, 0], mm: 35 }, { pos: [62, 104, 165], look: [-8, 106, 0], mm: 40 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.08, seed: 5 });
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t);
      clouds.position.x = t * 3; low.position.x = t * 6;
    } });
  }

  // ------------------------------------------------------------------ SARUMAN: the steel web
  function sarumanSet(ctx, shot) {
    const P0 = shot.params, dur = shot.duration;
    const b = base(ctx, { floor: 0x0e0e10, fog: 0x010203, density: 0.05, fov: 30 });
    const { scene, camera, layer } = b;
    b.ground.material.roughness = 0.4; b.ground.material.metalness = 0.4;
    const ped = mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.95, 8), std(0x0c0c0e, { roughness: 0.3, metalness: 0.6, flatShading: true }), [0, 0.475, 0], scene);
    const stone = makeStoneObj(scene, { radius: 0.17, pos: [0, 1.12, 0], keyDir: [-0.6, 0.6, -0.5], keySize: [0.04, 0.25], keyI: 25, keyCol: 0xcfe0ff, amb: 0x010203, ember: 0.12, light: 1.4, lightDist: 5, seed: 5.1, emberCol: 0xff6020, exposure: 1.3 });
    const fig = robe({ lean: 0.35, arms: 'reach', seed: 11, mat: clothMat(0x0c0c0e, 0x6a7080) }); fig.g.position.set(0, 0, -0.55); fig.g.scale.setScalar(1.12); scene.add(fig.g);
    const cold = K.keySpot(scene, { color: 0xbcd0ff, intensity: 1400, pos: [-2.5, 7, -4], target: [0, 1.2, -0.5], angle: 0.3, penumbra: 0.6, shadow: 1024 });
    K.lightShaft(scene, { pos: [-2.5, 7, -4], target: [0, 0.4, -0.3], radius: 1.5, color: 0xbcd0ff, intensity: 0.07 });
    // the web: threads from the stone wind up and around the figure
    const r = K.rng(12); const threadM = new THREE.MeshBasicMaterial({ color: 0xd8e6ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const threads = Array.from({ length: 18 }, (_, i) => { const pts = []; const a0 = r() * 6.28, turns = 0.9 + r() * 1.4, dir = r() < 0.5 ? 1 : -1;
      const ya = 0.7 + r() * 0.5, yb = 1.5 + r() * 0.6, rad0 = 0.4 + r() * 0.16;
      const start = V3([Math.sin(a0) * 0.16, 1.12 + (r() - 0.5) * 0.1, Math.cos(a0) * 0.16]);
      for (let k = 0; k <= 80; k++) { const u = k / 80; const a = a0 + dir * u * turns * Math.PI * 2; const rad = rad0 * (1 + 0.08 * Math.sin(u * 7 + i));
        const hp = V3([Math.sin(a) * rad, K.lerp(ya, yb, u), -0.55 + Math.cos(a) * rad * 0.85]);
        pts.push(u < 0.18 ? start.clone().lerp(hp, K.smooth(u / 0.18)) : hp); }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.0022, 4, false); const m = new THREE.Mesh(geo, threadM); scene.add(m); return { m, n: geo.index.count, d: r() * 0.3 }; });
    const q = quoteCard(layer, P0, 'right:6%;bottom:17%;text-align:right');
    const move = C.path([{ pos: [2.9, 1.2, 3.6], look: [0, 1.25, -0.45], mm: 40 }, { pos: [2.2, 1.3, 2.8], look: [0, 1.3, -0.45], mm: 40 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.01, seed: 7 });
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t);
      threads.forEach((th) => { const k = K.smooth(K.range(t, 0.2 + th.d * dur * 0.6, dur * 0.95)); th.m.geometry.setDrawRange(0, Math.floor(th.n * k / 3) * 3); });
      stone.update(t, camera, { ember: 0.12 });
      fade(q, t, 0.6, 1.6);
    } });
  }

  // ------------------------------------------------------------------ PYRE: Denethor
  function fireMat() {
    return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uNoise: { value: noise3D() }, uT: { value: 0 }, uSeed: { value: 0 }, uI: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `precision highp float; precision highp sampler3D; uniform sampler3D uNoise; uniform float uT, uSeed, uI; varying vec2 vUv;
        void main(){ vec2 uv = vUv; float n = texture(uNoise, vec3(uv.x * 1.2 + uSeed, uv.y * 0.9 - uT * 0.55, uT * 0.06 + uSeed)).r;
          float n2 = texture(uNoise, vec3(uv.x * 2.4 - uSeed, uv.y * 1.8 - uT * 0.9, uT * 0.1)).r;
          float w = 1.0 - abs(uv.x - 0.5) * 2.0; float shape = (w * (1.0 - uv.y) * 1.6 + (n * 0.7 + n2 * 0.5) - 0.95 - uv.y * 0.4) * smoothstep(0.0, 0.2, uv.y) * smoothstep(0.0, 0.25, w);
          float f = smoothstep(0.0, 0.45, shape);
          vec3 c = mix(vec3(0.55, 0.08, 0.01), vec3(1.0, 0.55, 0.2), smoothstep(0.4, 1.0, f)) * f * f * 0.75 * uI;
          gl_FragColor = vec4(c, 1.0); }` });
  }
  function pyreSet(ctx, shot) {
    const P0 = shot.params, look = P0.variant === 'look', dur = shot.duration;
    const b = base(ctx, { floor: 0x120c08, fog: 0x0a0402, density: 0.06, fov: 30 });
    const { scene, camera } = b;
    const bier = mesh(new THREE.BoxGeometry(1.6, 0.9, 0.8), std(0x161210, { roughness: 0.8 }), [0, 0.45, -0.2], scene);
    const stone = makeStoneObj(scene, { radius: 0.17, pos: [0, 1.07, 0.05], keyDir: [0.3, 0.5, -1], keySize: [0.3, 0.15], keyI: 14, keyCol: FIRE, amb: 0x0a0402, ember: 0.12, light: 1.5, lightDist: 4, seed: 6.6, emberCol: 0xff4a10 });
    const flames = []; const r = K.rng(21);
    for (let i = 0; i < 22; i++) { const m = fireMat(); m.uniforms.uSeed.value = r() * 10; const w = 0.6 + r() * 1.4, h = 1.0 + r() * 2.6;
      const f = mesh(new THREE.PlaneGeometry(w, h), m, [(r() - 0.5) * 7, h / 2 - 0.05, -1.8 - r() * 3.5], scene); f.castShadow = f.receiveShadow = false; flames.push(f); }
    const fire = new THREE.PointLight(0xff7a30, 90, 12, 1.5); fire.position.set(0, 1.8, -2.0); fire.castShadow = true; fire.shadow.mapSize.set(1024, 1024); scene.add(fire);
    const smokeT = radialTex([[0, 'rgba(40,30,26,.55)'], [1, 'rgba(20,14,10,0)']]);
    const smokes = Array.from({ length: 26 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, opacity: 0.6 })); s.userData = { x: (r() - 0.5) * 6, z: -1.5 - r() * 3, ph: r() * 10, sp: 0.3 + r() * 0.3 }; scene.add(s); return s; });
    const sparks = K.dust(scene, { count: 300, box: [6, 5, 3], center: [0, 2.5, -2], size: 0.03, opacity: 0.9, color: 0xffa040, seed: 13 });
    const fig = robe({ lean: look ? 0.5 : 0.08, arms: look ? 'cup' : 'down', hood: true, seed: 17, mat: clothMat(0x090807, 0x5a3a28) }); fig.g.position.set(0, 0, look ? -0.62 : 0.9); fig.g.rotation.y = look ? 0 : Math.PI; fig.g.scale.setScalar(1.08); scene.add(fig.g);
    if (look) fig.head.rotation.x = 0.35;
    const move = look
      ? C.path([{ pos: [1.0, 1.75, 4.8], look: [0, 1.3, -0.6], mm: 40 }, { pos: [0.55, 1.6, 3.9], look: [0, 1.3, -0.6], mm: 40 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.01, seed: 2 })
      : C.path([{ pos: [-1.2, 1.4, 4.4], look: [0, 1.3, 0], mm: 40 }, { pos: [-0.6, 1.4, 3.6], look: [0, 1.3, 0], mm: 40 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.01, seed: 2 });
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t); sparks.update(t * 6);
      flames.forEach((f, i) => { f.material.uniforms.uT.value = t; f.quaternion.copy(camera.quaternion); });
      fire.intensity = 90 * (0.85 + 0.1 * Math.sin(t * 9.1) * Math.sin(t * 4.3) + 0.05 * Math.sin(t * 17));
      smokes.forEach(s => { const u = s.userData, k = ((t * u.sp + u.ph) % 4) / 4; s.position.set(u.x + Math.sin(k * 3 + u.ph) * 0.5, 1.5 + k * 6, u.z); s.scale.setScalar(1.5 + k * 3); s.material.opacity = 0.55 * Math.sin(k * Math.PI); });
      stone.update(t, camera, { ember: 0.12 + 0.02 * Math.sin(t * 2) });
    } });
  }

  // ------------------------------------------------------------------ VISIONS: true images, darker each time
  function visionsSet(ctx, shot) {
    const P0 = shot.params, dur = shot.duration;
    const b = base(ctx, { floor: null, fog: 0x000000, density: 0.03, fov: 30 });
    const { scene, camera, layer } = b;
    const vis = canvasTex(512, 512, () => {}); const vc = vis.image.getContext('2d');
    const stone = makeStoneObj(scene, { radius: 0.5, pos: [0, 0, 0], keyDir: [0.6, 0.55, 0.6], keySize: [0.03, 0.03], round: 1, keyI: 10, keyCol: FIRE, amb: 0x020101, ember: 0.03, vis, visScale: 0.95, seed: 2.9, smoke: 5 });
    const cuts = [['armies', 'army'], ['fleets', 'fleet'], ['chosen', 'near'], ['until', 'fleetDark'], ['despair', 'none']].map(([w, k]) => [wt(shot, w), k]);
    const q = quoteCard(layer, P0, 'right:6%;bottom:17%;text-align:right');
    const move = C.path([{ pos: [-0.15, 0.1, 1.55], look: [0, 0, 0], mm: 50 }, { pos: [0.1, 0.02, 1.2], look: [0, 0, 0], mm: 50 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.004, seed: 9 });
    let last = null;
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t);
      let cur = 'none', t0 = 0; for (const [tc, k] of cuts) if (t >= tc - 0.05) { cur = k; t0 = tc; }
      const glow = 1 - 0.55 * p;
      const key = cur + Math.floor(t * 15);
      if (key !== last) { last = key; vc.clearRect(0, 0, 512, 512);
        if (cur === 'army') drawArmy(vc, 512, 512, t - t0, { seed: 4, glow });
        else if (cur === 'fleet') drawFleet(vc, 512, 512, t - t0, { seed: 6, glow });
        else if (cur === 'near') drawArmy(vc, 512, 512, t - t0, { seed: 8, glow, near: true });
        else if (cur === 'fleetDark') drawFleet(vc, 512, 512, t - t0, { seed: 12, glow: glow * 0.5 });
        else { vc.fillStyle = '#000'; vc.fillRect(0, 0, 512, 512); }
        vis.needsUpdate = true; }
      const flick = cur === 'none' ? 0 : K.range(t, t0, t0 + 0.12) * (0.85 + 0.15 * Math.sin(t * 31));
      stone.u.uVisAmt.value = 3.2 * flick * glow;
      stone.u.uSmoke.value = K.lerp(2.5, 9, K.smooth(K.range(t, wt(shot, 'until'), dur)));
      stone.update(t, camera, { ember: K.lerp(0.025, 0.012, p) });
      fade(q, t, 0.8, 1.8);
    } });
  }

  // ------------------------------------------------------------------ ARAGORN: dangerous indeed, but not to all
  function aragornSet(ctx, shot) {
    const P0 = shot.params, dur = shot.duration;
    const b = base(ctx, { floor: 0x0b0b0b, fog: 0x000000, density: 0.07, fov: 30 });
    const { scene, camera, layer } = b;
    const rock = mesh(new THREE.CylinderGeometry(9, 10, 0.6, 11), std(0x0a0a0b, { roughness: 1, flatShading: true }), [0, 0.3, 0], scene);
    const fig = robe({ lean: 0.04, arms: 'cup', hood: true, seed: 23, mat: clothMat(0x0a0a0b, 0x111111) }); fig.g.position.set(0, 0.6, 0); fig.g.scale.setScalar(1.12); scene.add(fig.g);
    const stone = makeStoneObj(scene, { radius: 0.13, pos: handsCenter(fig, 0.06), keyDir: [0.2, 1, -0.4], keySize: [0.2, 0.2], keyI: 30, keyCol: WORK, amb: 0x030303, ember: 0.14, light: 1.5, lightDist: 2.5, seed: 4.1, emberCol: 0xffa050, exposure: 1.4 });
    const key = K.keySpot(scene, { color: WORK, intensity: 2800, pos: [0.8, 14, -5], target: [0, 1.4, 0], angle: 0.2, penumbra: 0.6, shadow: 1024 });
    K.lightShaft(scene, { pos: [0.8, 14, -5], target: [0, -0.5, 0.2], radius: 2.2, color: WORK, intensity: 0.045 });
    const motes = K.dust(scene, { count: 600, box: [4, 8, 4], center: [0, 4, -1], size: 0.03, opacity: 0.5, color: 0xfff0dc });
    const q = quoteCard(layer, P0, 'left:6%;bottom:17%');
    const move = C.path([{ pos: [1.6, 0.35, 3.6], look: [0, 2.0, 0], mm: 24 }, { pos: [1.0, 0.45, 2.7], look: [0, 2.05, 0], mm: 24 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.01, seed: 3 });
    return scopeSet({ ...b, update(t, p) {
      move(camera, p, t); motes.update(t);
      stone.update(t, camera, { ember: 0.14 });
      fade(q, t, wt(shot, 'dangerous') - 0.3, wt(shot, 'dangerous') + 0.6);
    } });
  }

  return {
    stone(ctx, shot) {
      const m = shot.params.mode;
      const f = { chamber, office: officeSet, keys: keysSet, next: nextSet, glass: glassSet, macro: macroSet, eye: eyeSet, awake: awakeSet, web: webSet,
        seven: sevenSet, seen: seenSet, gift: giftSet, tower: towerSet, saruman: sarumanSet, pyre: pyreSet, visions: visionsSet, aragorn: aragornSet }[m];
      if (!f) return chamber(ctx, shot);
      return f(ctx, shot);
    },
  };
}
