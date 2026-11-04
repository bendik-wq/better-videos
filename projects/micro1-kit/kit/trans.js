// LEDGER kit transitions drawn on the 2D comp (engine/transitions.js covers the rest).
//   pop  (0.34 s) A recedes a touch, B scale-pops in from 80% with overshoot. Exact: e=0 is A, e=1 is B.
import * as L from './ledger.js';

export const META = { pop: { dur: 0.34, kind: 'geo' } };
export const has = (name) => !!META[name];

function put(x, img, W, H, s = 1, a = 1, dy = 0) {
  if (a <= 0) return;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = Math.min(1, a);
  x.translate(W / 2, H * 0.45 + dy); x.scale(s, s); x.translate(-W / 2, -H * 0.45);
  x.drawImage(img, 0, 0, W, H); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
}
export function render(x, name, A, B, e, W, H) {
  e = L.clamp(e);
  if (name === 'pop') {
    if (e >= 1) return put(x, B, W, H);
    put(x, A, W, H, 1 - 0.06 * L.outCubic(e));
    put(x, B, W, H, L.lerp(0.8, 1, L.outBack(e, 2.1)), L.clamp(e * 3.2), (1 - L.outCubic(e)) * H * 0.02);
  }
}
// type layers are canvas-drawn here, nothing to cross-fade; kept for parity with engine transitions
export const layerMix = (name, e) => ({ out: e < 0.5 ? 1 : 0, in: e < 0.5 ? 0 : 1 });
