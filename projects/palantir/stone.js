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
  const EMBER = 0xff5a1a, MOON = 0xaabbe0, MONITOR = 0x6f9dff, FIRE = 0xff8a3a, WORK = 0xfff0dc;

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
    uniform float uT, uEmber, uFlare, uSmoke, uThin, uIris, uCardAmt, uCardScale, uVisAmt, uVisScale, uFocus, uAperture, uKeyI, uSpin, uSeed, uTint, uRim, uExposure;
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
      vec2 q = abs(uv) / s; float d = max(q.x, q.y);
      float e = 0.06 + blur * 1.2;
      float h = 1.0 - smoothstep(1.0 - e, 1.0 + e, d);
      float area = (uKeySize.x * uKeySize.y) / (s.x * s.y);
      float halo = exp(-dot(uv, uv) / (dot(s, s) * 5.0 + 0.002)) * 0.05;
      return h * area + halo;
    }
    vec3 env(vec3 r, float blur){
      vec3 c = uAmbCol * (0.25 + 0.75 * smoothstep(-0.4, 1.0, r.y));
      c += uKeyCol * uKeyI * keyLight(r, blur);
      if (uCardAmt > 0.0) {
        vec3 rv = (viewMatrix * vec4(r, 0.0)).xyz;
        if (rv.z > 0.0) { vec2 uv = rv.xy / (1.0 + rv.z) * uCardScale + 0.5;
          vec2 m = smoothstep(vec2(0.0), vec2(0.06), uv) * smoothstep(vec2(1.0), vec2(0.94), uv);
          c += texture(uCard, uv, blur * 5.0).rgb * uCardAmt * m.x * m.y; }
      }
      return c;
    }
    float dens(vec3 p, float blur){
      float r2 = dot(p, p);
      vec3 q = rotY(p, uT * uSpin * (1.7 - r2) + uSeed);   // inner layers turn faster: the smoke curls
      q.y += uT * 0.015;
      vec4 w = texture(uNoise, q * 0.42 + vec3(uSeed * 0.13, 0.0, 0.31));
      q += (w.bab - 0.5) * 0.95;
      vec4 s = texture(uNoise, q * 0.75 + vec3(0.37, uSeed * 0.07, 0.11));
      float f = mix(s.r, s.g, clamp(blur, 0.0, 1.0));
      return smoothstep(0.46, 0.8, f) * smoothstep(1.0, 0.72, r2);
    }
    void main(){
      vec3 p0 = normalize(vPos); vec3 rd = normalize(vPos - vCam); vec3 n = p0;
      float cosi = max(dot(-rd, n), 0.0);
      float F = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      float rb = uAperture * abs(uFocus - 0.25);                 // the reflection's virtual image sits just behind the surface
      vec3 refl = env(reflect(rd, n), rb);
      vec3 rr = refract(rd, n, 1.0 / 1.52);
      float tE = max(0.0, -2.0 * dot(p0, rr));
      const int N = 20;
      float dt = tE / float(N), j = hash(gl_FragCoord.xy);
      float tv = dot(rr, uVisDir) != 0.0 ? -dot(p0, uVisDir) / dot(rr, uVisDir) : -1.0; bool vis = uVisAmt <= 0.0;
      vec3 vx = normalize(cross(vec3(0.0, 1.0, 0.0), uVisDir)), vy = cross(uVisDir, vx);
      vec3 ix = abs(uIrisDir.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), uIrisDir)), iy = cross(uIrisDir, ix);
      vec3 col = vec3(0.0); float T = 1.0;
      float hot = uEmber * (1.0 + uFlare * 9.0);
      for (int i = 0; i < N; i++) {
        float t = (float(i) + j) * dt; vec3 p = p0 + rr * t; float r2 = dot(p, p);
        float blur = uAperture * abs(uFocus - (0.25 + t * 0.55)) * 1.4;
        float d = dens(p, blur);
        float core = hot / (0.05 + r2 * 2.4);
        vec3 em = uEmberCol * core * (uThin + d * 1.4);
        em += uSmokeCol * d * uKeyI * 0.004 * (0.3 + 0.7 * max(dot(normalize(p + 1e-4), uKeyDir), 0.0));
        float sig = d * uSmoke;
        if (uIris > 0.001) {
          float z = dot(p, uIrisDir); vec2 xy = vec2(dot(p, ix), dot(p, iy)); float rho = length(xy), th = atan(xy.y, xy.x);
          float sw = th + 2.4 * log(rho + 0.04) - uT * 0.35;
          vec4 fib = texture(uNoise, vec3(cos(sw) * 0.6, sin(sw) * 0.6, rho * 0.9 + 0.2));
          float slab = exp(-z * z * 9.0);
          float ring = exp(-pow((rho - 0.46) / 0.2, 2.0)) * slab;
          float fibres = smoothstep(0.35, 0.75, fib.r);
          float di = ring * (0.35 + 0.65 * fibres) * 1.3;
          float pupil = smoothstep(0.17, 0.1, rho) * slab;
          d = mix(d, di, uIris);
          em = mix(em, uEmberCol * hot * (ring * fibres * 7.0 * smoothstep(0.18, 0.32, rho) + exp(-pow((rho - 0.24) / 0.06, 2.0)) * slab * 6.0) + uEmberCol * core * uThin * 0.4, uIris);
          sig = mix(sig, di * uSmoke * 0.6 + pupil * 30.0, uIris);
        }
        if (!vis && t > tv) { vis = true; vec3 x = p0 + rr * tv; vec2 uv = vec2(dot(x, vx), dot(x, vy)) * uVisScale + 0.5;
          float m = smoothstep(0.5, 0.36, length(uv - 0.5));
          col += T * texture(uVis, uv, blur * 4.0).rgb * uVisAmt * m; }
        col += T * em * dt; T *= exp(-sig * dt);
      }
      // the light behind the stone, refracted (and inverted) through the dark glass
      vec3 pe = p0 + rr * tE; vec3 ro = refract(rr, -pe, 1.52);
      if (dot(ro, ro) > 0.0) col += T * env(ro, rb + 0.05) * uTint;
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
      uT: { value: 0 }, uEmber: { value: o.ember ?? 0.05 }, uFlare: { value: 0 }, uSmoke: { value: o.smoke ?? 7 }, uThin: { value: o.thin ?? 0.25 },
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
    const pl = new THREE.PointLight(o.emberCol ?? EMBER, 0, lightDist, 2); pl.position.copy(s.position); scene.add(pl);
    const u = mat.uniforms; const tmp = new THREE.Vector3();
    return {
      mesh: s, u, light: pl, radius,
      set(k, v) { u[k].value = v; },
      // per-frame: time, glow, and the camera-facing directions for the vision plane and iris
      update(t, camera, { ember, flare = 0, iris = 0, irisDir = null } = {}) {
        u.uT.value = t; if (ember !== undefined) u.uEmber.value = ember; u.uFlare.value = flare; u.uIris.value = iris;
        tmp.copy(camera.position).sub(s.position).normalize(); u.uVisDir.value.copy(tmp);
        u.uIrisDir.value.copy(irisDir ?? tmp).normalize();
        pl.intensity = light * u.uEmber.value * (1 + flare * 9) * 60 * radius * radius / 0.25;
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
      x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, w, h); const rh = h / rows;
      for (let i = 0; i < rows; i++) { let cx = -r() * 120; while (cx < w) { const bw = 120 + r() * 160; const v = light + (r() - 0.5) * vr;
        x.fillStyle = `rgb(${v},${v - 2},${v - 6})`; x.fillRect(cx + 4, i * rh + 4, bw - 8, rh - 8);
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
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const th = Math.atan2(z, x); const k = 1 - (y - y0) / (y1 - y0);
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
    const win = new THREE.Group(); win.position.set(wx, 5.4, wz); win.lookAt(0, 5.4, 0); scene.add(win);
    const skyM = new THREE.MeshBasicMaterial({ color: dark ? 0x05070c : 0x4a5a78, fog: false });
    mesh(new THREE.PlaneGeometry(0.36, 2.6), skyM, [0, 0, -0.02], win);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.4, 2.9, 0.9), wallM, [s * 0.38, 0, 0.35], win);
    mesh(new THREE.BoxGeometry(1.2, 0.3, 0.9), wallM, [0, 1.45, 0.35], win); mesh(new THREE.BoxGeometry(1.2, 0.3, 0.9), wallM, [0, -1.45, 0.35], win);
    // pedestal: a dark basalt column with a shallow cup
    const basalt = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.55, metalness: 0.1 });
    const ped = mesh(new THREE.LatheGeometry([[0.001, 0], [0.75, 0], [0.75, 0.12], [0.55, 0.2], [0.42, 0.35], [0.36, 1.05], [0.48, 1.15], [0.52, 1.24], [0.4, 1.3], [0.001, 1.28]].map(([x, y]) => new THREE.Vector2(x, y)), 64), basalt, [0, 0, 0], scene);
    const stone = makeStoneObj(scene, { radius: 0.42, pos: [0, 1.67, 0], keyDir: [wx, 5.4 - 1.67, wz], keySize: [0.035, 0.24], keyI: dark ? 0 : 70, keyCol: MOON, amb: dark ? 0x010102 : 0x07090d, ember: dark ? 0.09 : 0.045, light: 1.2, lightDist: 7, seed: 1.3 });
    // moonlight through the slit
    const moonPos = [wx * 2.2, 9.6, wz * 2.2];
    const moon = K.keySpot(scene, { color: MOON, intensity: dark ? 0 : 2600, pos: moonPos, target: [0, 1.2, 0], angle: 0.16, penumbra: 0.4, shadow: 2048 });
    moon.map = slitCookie(); moon.shadow.camera.near = 4; moon.shadow.bias = -0.0008;
    const shaft = K.lightShaft(scene, { pos: [wx * 0.98, 5.6, wz * 0.98], target: [0.2, 0.6, 0.2], radius: 0.9, color: MOON, intensity: dark ? 0 : 0.11 });
    scene.add(new THREE.HemisphereLight(0x223048, 0x050505, dark ? 0.02 : 0.12));
    const motes = K.dust(scene, { count: 900, box: [5, 6, 5], center: [wx * 0.45, 3.4, wz * 0.45], size: 0.025, opacity: dark ? 0.15 : 0.5, color: 0xcfd8ff });
    const ember = K.dust(scene, { count: 220, box: [1.6, 1.6, 1.6], center: [0, 1.9, 0], size: 0.012, opacity: dark ? 0.6 : 0.25, color: 0xff8a50, seed: 9 });
    const dur = shot.duration;
    const move = dark
      ? C.path([{ pos: [-1.6, 1.85, 2.0], look: [0, 1.62, 0], mm: 50 }, { pos: [-3.6, 2.6, 4.6], look: [0, 1.7, 0], mm: 40 }], { duration: dur, accel: 0.2, decel: 0.6, float: 0.012, seed: 4 })
      : C.path([{ pos: [-2.4, 1.15, 5.6], look: [0.15, 1.9, 0], mm: 40 }, { pos: [-1.3, 1.45, 3.4], look: [0.05, 1.75, 0], mm: 40 }], { duration: dur, accel: 0.3, decel: 0.5, float: 0.012, seed: 2 });
    const cap = caption(layer, P0.caption, 'left:6%;top:17%');
    return scopeSet({ ...b, update(t, p) {
      motes.update(t); ember.update(t);
      move(camera, p, t);
      stone.update(t, camera, { ember: dark ? 0.06 + 0.04 * K.smooth(K.range(t, 0.5, dur)) : 0.045 });
      fade(cap, t, 0.8);
    } });
  }

  return {
    stone(ctx, shot) {
      const m = shot.params.mode;
      const f = { chamber }[m];
      if (!f) return chamber(ctx, shot);
      return f(ctx, shot);
    },
  };
}
