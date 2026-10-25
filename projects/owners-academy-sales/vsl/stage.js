/* Frame-accurate stage for the G&L VSL. render(t) draws the frame at time t (seconds) from the
 * timeline built by timeline.mjs; nothing depends on wall-clock time, so any frame can be
 * re-rendered on its own.
 *
 * Beats are HTML fragments animated through data attributes:
 *   data-d="s"        fade/rise in at s seconds after the beat starts
 *   class="split"     split text into words that rise in one after another (from its data-d)
 *   mark data-hd="s"  highlighter sweep at s
 *   data-w="%" / data-h="%"   grow width / height to % (from data-d)
 *   data-count="n" data-pre data-suf data-dec   count up to n (from data-d)
 *   data-draw         stroke-draw an SVG path (from data-d)
 *   data-lit="s"      add class "lit" at s
 */
(function () {
  'use strict';
  const IN = 0.55, OUT = 0.32;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  let TL = null;

  /* ---------- silk background: the landing page's hero shader, dark palette ---------- */
  const canvas = document.getElementById('silk');
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
  let uT = null;
  if (gl) {
    const FRAG = [
      'precision mediump float;',
      'uniform vec2 r;uniform float t;uniform vec3 c0,c1,c2,c3,c4;',
      'vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec2 m289(vec2 x){return x-floor(x*(1./289.))*289.;}',
      'vec3 perm(vec3 x){return m289(((x*34.)+1.)*x);}',
      'float sn(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);',
      'vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);',
      'vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=m289(i);vec3 p=perm(perm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));',
      'vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;',
      'vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;',
      'm*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/r;vec2 q=uv;q.x*=r.x/r.y;',
      '  float s=t*.022;',
      '  vec2 w=vec2(sn(q*.85+vec2(s,-s*.7)),sn(q*.85+vec2(-s*.6,s)+5.2));',
      '  vec2 w2=vec2(sn(q*1.3+w*1.1+vec2(1.7,9.2)+s*.5),sn(q*1.3+w*1.1+vec2(8.3,2.8)-s*.4));',
      '  float n=sn(q*.7+w2*.9+s*.3);',
      '  vec3 col=mix(c0,c1,smoothstep(-.6,.6,w.x));',
      '  col=mix(col,c2,smoothstep(-.3,.8,w2.y)*.6);',
      '  col=mix(col,c3,smoothstep(.1,.9,n)*.5);',
      '  col=mix(col,c4,smoothstep(.35,1.,w2.x)*.35);',
      '  float band=sin((q.x*1.6+q.y*.9+w2.x*1.4+n*.8)*3.2-t*.12);',
      '  col+=vec3(1.)*pow(max(band,0.),4.)*.03;',
      '  float v=.55+.35*smoothstep(.15,.95,uv.x);',
      '  col=mix(c0,col,v);',
      '  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;',
      '  gl_FragColor=vec4(col,1.);',
      '}'].join('\n');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(prog, 'r'), canvas.width, canvas.height);
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    ['#0b1220', '#13234a', '#1c2f6b', '#2a2457', '#3a2a3c'].forEach((c, i) => gl.uniform3fv(gl.getUniformLocation(prog, 'c' + i), hex(c)));
    uT = gl.getUniformLocation(prog, 't');
    // portrait layouts (render.mjs --vertical) resize the canvas after load
    window.resizeSilk = (w, h) => {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(gl.getUniformLocation(prog, 'r'), w, h);
    };
  }
  function silk(t) {
    if (!gl) return;
    // window.silkSpeed (render.mjs --bg-speed): 0 freezes the background, which leaves the encoder's bits for the face
    gl.uniform1f(uT, 40 + t * 2.5 * (window.silkSpeed ?? 1));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* ---------- beat elements ---------- */
  function splitWords(root) {
    root.querySelectorAll('.split').forEach((el) => {
      const base = parseFloat(el.dataset.d || 0);
      const step = parseFloat(el.dataset.step || 0.05);
      delete el.dataset.d;
      let i = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((c) => {
          if (c.nodeType === 3) {
            // punctuation straight after <em>/<mark> joins that element's last word, so a line can't break before it
            const lead = c.textContent.match(/^[,.;:?!)'"\u2019\u201d]+/);
            const prevWord = lead && c.previousSibling && c.previousSibling.nodeType === 1 && [...c.previousSibling.querySelectorAll('span')].pop();
            if (prevWord) { prevWord.textContent += lead[0]; c.textContent = c.textContent.slice(lead[0].length); }
            const frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              const s = document.createElement('span');
              s.textContent = part;
              s.style.display = 'inline-block';
              s.dataset.d = (base + i++ * step).toFixed(3);
              frag.appendChild(s);
            });
            c.replaceWith(frag);
          } else if (c.nodeType === 1) walk(c);
        });
      };
      walk(el);
    });
  }

  const built = new Map();
  function build(i) {
    if (built.has(i)) return built.get(i);
    const b = TL.beats[i];
    const el = document.createElement('div');
    el.className = 'beat';
    el.innerHTML = b.html;
    splitWords(el);
    el.querySelectorAll('[data-draw]').forEach((p) => { const L = p.getTotalLength ? 1200 : 0; p.style.strokeDasharray = L; p.dataset.len = L; });
    built.set(i, el);
    return el;
  }

  function fmt(v, el) {
    const dec = parseInt(el.dataset.dec || 0, 10);
    const s = v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return (el.dataset.pre || '') + s + (el.dataset.suf || '');
  }

  function animate(el, lt) {
    el.querySelectorAll('[data-d]').forEach((e) => {
      const d = parseFloat(e.dataset.d);
      if (e.dataset.w !== undefined) { e.style.width = (parseFloat(e.dataset.w) * ease((lt - d) / 0.9)) + '%'; return; }
      if (e.dataset.h !== undefined) { e.style.height = (parseFloat(e.dataset.h) * ease((lt - d) / 0.9)) + '%'; return; }
      if (e.dataset.count !== undefined) {
        const p = ease((lt - d) / 1.1);
        e.textContent = fmt(parseFloat(e.dataset.from || 0) + (parseFloat(e.dataset.count) - parseFloat(e.dataset.from || 0)) * p, e);
        e.style.opacity = clamp((lt - d) / 0.2);
        return;
      }
      if (e.dataset.draw !== undefined) { e.style.strokeDashoffset = e.dataset.len * (1 - ease((lt - d) / 0.8)); return; }
      const p = ease((lt - d) / IN);
      e.style.opacity = p;
      e.style.transform = `translateY(${(1 - p) * 22}px)`;
    });
    el.querySelectorAll('mark[data-hd]').forEach((m) => {
      m.style.backgroundSize = (ease((lt - parseFloat(m.dataset.hd)) / 0.5) * 100) + '% 100%';
    });
    el.querySelectorAll('[data-lit]').forEach((e) => e.classList.toggle('lit', lt >= parseFloat(e.dataset.lit)));
    el.querySelectorAll('img[data-kb]').forEach((e) => { e.style.transform = `scale(${1 + 0.08 * clamp(lt / 12)})`; });
  }

  /* ---------- captions ---------- */
  const capline = document.getElementById('capline');
  let capKey = null;
  function captions(t) {
    const g = TL.captions.find((c) => t >= c.t0 && t < c.t1);
    if (!g) { capline.innerHTML = ''; capKey = null; return; }
    if (capKey !== g.t0) {
      // w = [text, start, end, joinsPrevious]; "$500" + ",000" render without a space
      capline.innerHTML = g.words.map((w, i) => (i && !w[3] ? ' ' : '') + `<span class="w">${w[0]}</span>`).join('');
      capKey = g.t0;
    }
    const spans = capline.children;
    g.words.forEach((w, i) => {
      spans[i].classList.toggle('on', t >= w[1] && t < (g.words[i + 1] ? g.words[i + 1][1] : g.t1));
      spans[i].classList.toggle('past', t >= w[1]);
    });
    capline.style.opacity = clamp((t - g.t0) / 0.12);
  }

  /* ---------- header ---------- */
  const ticks = document.getElementById('ticks');
  const chapname = document.getElementById('chapname');
  function header(t) {
    if (!ticks.children.length) TL.chapters.forEach(() => ticks.appendChild(document.createElement('i')));
    ticks.style.display = TL.chapters.length > 1 ? '' : 'none';
    let k = -1;
    TL.chapters.forEach((c, i) => { if (t >= c.t0) k = i; });
    [...ticks.children].forEach((e, i) => { e.className = i < k ? 'on' : i === k ? 'now' : ''; });
    chapname.textContent = k >= 0 ? TL.chapters[k].name : '';
  }

  /* ---------- full-frame cards ---------- */
  const card = document.getElementById('card');
  const cardin = document.getElementById('cardin');
  const cardfine = document.getElementById('cardfine');
  let cardKey = null;
  function cards(seg, t) {
    if (!seg || seg.kind === 'clip') { card.style.display = 'none'; cardKey = null; return false; }
    card.style.display = 'block';
    if (cardKey !== seg.t0) {
      cardin.innerHTML = seg.html;
      cardfine.innerHTML = seg.fine || '';
      splitWords(cardin);
      cardKey = seg.t0;
    }
    const lt = t - seg.t0;
    // window.cardFade (render.mjs --vertical): the card fades in instead of cutting, so Reels end gently
    card.style.opacity = window.cardFade ? clamp(lt / 0.4) : 1;
    animate(cardin, lt);
    const r = cardin.querySelector('.rule');
    if (r) r.style.width = (ease((lt - 0.5) / 0.9) * 220) + 'px';
    cardfine.style.opacity = clamp((lt - 0.8) / 0.6);
    return true;
  }

  /* ---------- frame ---------- */
  const stage = document.getElementById('stage');
  window.loadTimeline = (tl) => { TL = tl; };
  window.render = (t) => {
    silk(t);
    const seg = TL.segments.find((s) => t >= s.t0 && t < s.t1) || TL.segments[TL.segments.length - 1];
    const onCard = cards(seg, t);
    header(t);
    captions(onCard ? -1 : t);
    const want = new Set();
    if (!onCard) TL.beats.forEach((b, i) => { if (t >= b.t0 && t < b.t1) want.add(i); });
    [...stage.children].forEach((c) => { if (!want.has(+c.dataset.i)) c.remove(); });
    want.forEach((i) => {
      const b = TL.beats[i];
      const el = build(i);
      el.dataset.i = i;
      if (el.parentNode !== stage) stage.appendChild(el);
      animate(el, t - b.t0);
      const o = clamp((b.t1 - t) / OUT);
      el.style.opacity = o;
      el.style.transform = `translateY(${-(1 - o) * 16}px)`;
    });
  };
})();
