// The shot-lab test world as data: the named handles every catalog recipe is written against.
// Pure (no DOM, no three.js scene), so the same handles drive the rendered sets in scene.js, the
// node smoothness tests and the catalog validator. A real episode supplies its own `W` with the
// same names (hero, car, figure, tower, window, ...), and the catalog recipes work unchanged.
import * as M from '../../engine/camera.js';

export const R = 150000; // the city sits on the north pole of a 150 km planet: pull-backs reach orbit, the horizon stays beyond the haze
export const ground = (x, z) => { const q = x * x + z * z; return -q / (R + Math.sqrt(Math.max(0, R * R - q))); }; // no cancellation
const g = (x, z, h = 0) => [x, ground(x, z) + h, z];

// road: a C2 spline through the city; the car cruises, then brakes to a stop at the office
export const roadPts = [[-230, 60], [-130, 42], [-55, 15], [0, 13], [55, 10], [105, -14], [140, -55], [160, -120], [168, -200]].map(([x, z]) => g(x, z, 0.02));
const road = M.spline(roadPts);
const V = 13, TB = 17, BRAKE = 4; // m/s, brake starts at 17 s and lasts 4 s
const dist = (t) => { if (t <= TB) return V * t; const x = Math.min(t - TB, BRAKE); return V * TB + V * (x / 2 + BRAKE / (2 * Math.PI) * Math.sin(Math.PI * x / BRAKE)); };
const S0 = 150; // car starts 150 m along the road at t = 0
const roadAt = (s) => road.at(s / road.length);
const roadDir = (s) => M.vec.flat(M.vec.sub(roadAt(s + 3), roadAt(s - 3))); // chord heading: C2
export function world() {
  const car = (t) => { const p = roadAt(S0 + dist(t)); return [p[0], p[1] + 0.75, p[2]]; };
  car.heading = (t) => roadDir(S0 + dist(t));
  // a pedestrian on the plaza edge, walking +x at 1.25 m/s, slowing to a stop at t = FS (C2 in t)
  const FS = 8, FB = 1.6, walk = (t) => { if (t <= FS - FB) return 1.25 * t; const x = Math.min(t - FS + FB, FB); return 1.25 * (FS - FB) + 1.25 * (x / 2 + FB / (2 * Math.PI) * Math.sin(Math.PI * x / FB)); };
  const figure = (t) => g(-14 + walk(t), 6.5, 0);
  figure.heading = () => [1, 0, 0];
  const W = {
    R, ground, road: roadPts, roadSpline: road,
    plaza: g(0, 0), hero: g(0, 0, 1.3), object: g(5, 3, 1.12), doc: { center: g(6.5, -4.5, 0.93), normal: [0, 1, 0], size: [0.42, 0.3] },
    tower: g(-34, -38, 36), towerTop: g(-34, -31, 72), towerBox: { min: g(-41, -45), max: g(-27, -31, 72) },
    office: g(26, -26, 10),
    window: { point: g(26, -19.8, 7.5), normal: [0, 0, 1], inside: g(26, -27, 6.6) },
    screen: { point: g(-13, -7.9, 4.2), normal: [0, 0, 1], size: [6.4, 3.6] },
    gap: { point: g(64, -58, 5), dir: [0, 0, -1] },
    ridge: { crest: g(0, 120, 16), dir: [0, 0, -1] },
    weave: [g(-70, 34, 6), g(-46, 18, 3.5), g(-22, 24, 4.5), g(-4, 9, 3), g(16, 18, 4), g(38, 4, 3.2), g(52, -18, 5), g(64, -44, 4)],
    planet: { center: [0, -R, 0], radius: R },
    globe: { center: [0, 0, 0], radius: 10 },
    car, carAt: (t) => car(t), carHeading: car.heading, carStop: TB + BRAKE,
    figure, figureStop: FS, figureAt: (t) => figure(t), figureHead: (t) => M.vec.add(figure(t), [0, 1.62, 0]),
    sun: [-0.55, 0.32, -0.77],
  };
  return W;
}
