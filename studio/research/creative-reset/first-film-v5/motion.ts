export type Point = { x: number; y: number };
export const film = { id: 'space-for-two-v5', duration: 32, fps: 30 };
export const smooth = (n: number) => { const x = Math.max(0, Math.min(1, n)); return x * x * (3 - 2 * x); };
export const mix = (a: number, b: number, u: number) => a + (b - a) * u;
export const blend = (a: Point, b: Point, u: number): Point => ({ x: mix(a.x, b.x, u), y: mix(a.y, b.y, u) });
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function joint(a: Point, b: Point, first: number, second: number, side: number): Point {
  const raw = distance(a, b), d = Math.min(first + second - .001, Math.max(Math.abs(first - second) + .001, raw));
  const dx = (b.x - a.x) / (raw || 1), dy = (b.y - a.y) / (raw || 1);
  const along = (first * first - second * second + d * d) / (2 * d), height = Math.sqrt(Math.max(0, first * first - along * along));
  return { x: a.x + dx * along - dy * height * side, y: a.y + dy * along + dx * height * side };
}
// Unequal holds and recoveries are authored acting, not a force simulation.
export function track(t: number, keys: readonly (readonly [number, number])[]) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return mix(keys[i - 1][1], keys[i][1], smooth((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
}
const blink = (t: number, at: number) => track(t, [[at, 0], [at + .065, 1], [at + .105, 1], [at + .23, 0]]);
export function acting(t: number) {
  const active = smooth((t - 16.5) / .15);
  const sag = track(t, [[16.5, 0], [16.84, .1], [17.08, 1], [17.22, 1], [17.76, .16], [18.12, .24], [18.5, .18], [23.5, .18], [24.2, 0]]);
  const catchBody = track(t, [[16.5, 0], [16.8, .3], [17.16, 1], [17.62, .72], [18.5, .66], [25.8, .66], [27.3, 0]]);
  const nod = track(t, [[20.25, 0], [20.38, -.055], [20.62, .23], [20.72, .23], [21.17, -.025], [21.4, 0]]);
  const fingers = smooth((t - 25.02) / .36), release = smooth((t - 25.42) / 1.03);
  const torsoRest = smooth((t - 26.05) / 1.45), neckRest = smooth((t - 26.45) / 1.1);
  const takeWeight = track(t, [[23.35, 0], [23.6, 1], [24.05, .12], [24.4, .24], [24.8, 0]]);
  const gazeA = smooth((t - 19.42) / .22), headFollow = smooth((t - 19.68) / .45);
  const breath = active * (.5 + .5 * torsoRest) * Math.sin((t - 16.5) * 1.45);
  return { active, sag, catchBody, nod, fingers, release, torsoRest, neckRest, takeWeight, gazeA, headFollow, breath,
    aBlink: Math.max(blink(t, 17.13), blink(t, 20.58), blink(t, 26.6)),
    bBlink: Math.max(blink(t, 18.4), blink(t, 21.1), blink(t, 27.2)) };
}
export const cues = [
  ...footContacts(),
  { t: .3, kind: 'note', pan: -.2, pitch: 220 }, { t: 3, kind: 'note', pan: .1, pitch: 261.63 },
  { t: 7.3, kind: 'cloth', pan: .05, pitch: 0 }, { t: 9.5, kind: 'cloth', pan: -.2, pitch: 0 },
  { t: 15.7, kind: 'seat', pan: .2, pitch: 0 }, { t: 16.2, kind: 'note', pan: -.2, pitch: 220 }, { t: 16.45, kind: 'note', pan: .2, pitch: 329.63 }, { t: 27.3, kind: 'note', pan: .1, pitch: 293.66 },
  { t: 17.15, kind: 'cloth', pan: -.15, pitch: 0 }, { t: 17.76, kind: 'cloth', pan: -.15, pitch: 0 },
  { t: 23.4, kind: 'cloth', pan: .05, pitch: 0 }, { t: 26.3, kind: 'breath', pan: -.1, pitch: 0 },
];
export function state(t: number) {
  const performance = acting(t);
  const lift = smooth((t - 7.3) / 2.2), lean = smooth((t - 6.5) / .8) * (1 - smooth((t - 8.5) / 1));
  const share = smooth((t - 23.55) / 1.45), reach = smooth((t - 22.1) / 1.25);
  const offer = smooth((t - 19.2) / .6), accept = smooth((t - 20.38) / .34);
  const strain = performance.sag;
  const relax = performance.torsoRest, load = performance.catchBody;
  const scoot = smooth((t - 21.05) / 1.05);
  const bag = { x: mix(1080, 850, lift) + 65 * share + 9 * strain, y: mix(667, 650, lift) - 25 * Math.sin(Math.PI * lift) + 10 * strain + 3 * performance.takeWeight, handleY: -64 - 5 * load * (1 - performance.fingers) + 10 * performance.fingers, angle: -.10 * Math.sin(Math.PI * lift) + .105 * strain + .018 * performance.takeWeight };
  const bagPoint = (x: number, y: number) => ({ x: bag.x + Math.cos(bag.angle) * x - Math.sin(bag.angle) * y, y: bag.y + Math.sin(bag.angle) * x + Math.cos(bag.angle) * y });
  const handle = bagPoint(0, bag.handleY), support = bagPoint(mix(-54, 40, lift) - 80 * share, 43);
  const invite = smooth((t - 10.5) / .8) * (1 - smooth((t - 12.5) / .7));
  const hand = blend(blend({ x: 867, y: 667 }, handle, smooth((t - 6.3) / 1)), { x: 1017, y: 632 }, invite);
  const a = { hip: { x: 800, y: 711 }, shoulder: { x: 800 + lean * 85 + 28 * load, y: 562 + lean * 13 + 10 * load + performance.breath }, hand,
    other: blend({ x: 902, y: 703 }, support, smooth((t - 6.7) / .6)), headAngle: .25 - .22 * smooth((t - 4.7) / .5) + .2 * smooth((t - 5.5) / .7) * (1 - smooth((t - 10) / .6)) + .22 * load * (1 - performance.headFollow) + performance.nod - .035 * performance.neckRest, feet: [{ x: 902, y: 870 }, { x: 936, y: 870 }], invite };
  const travel = smooth((t - .8) / 3.7) * 230 + smooth((t - 12) / 1.8) * 200;
  const bx = 1590 - travel - 30 * scoot, sit = smooth((t - 13.8) / 2.2);
  const walkFoot = (offset: number): Point => {
    const cycle = travel / 85 + offset, q = cycle - Math.floor(cycle), swing = smooth((q - .58) / .42);
    return { x: 1590 - (Math.floor(cycle) - offset) * 85 + 10 - 85 * swing, y: 870 - 32 * Math.sin(Math.PI * swing) };
  };
  const standing = smooth((t - 4.1) / .4) * (1 - smooth((t - 12) / .2));
  const settled = smooth((t - 13.4) / .4);
  const feet = [0, .5].map((phase, i) => blend(blend(walkFoot(phase), { x: 1360 + (i ? 28 : -22), y: 870 }, standing), { x: 1160 + (i ? -35 : -85), y: 870 }, settled));
  feet.forEach((foot, i) => { const step = smooth((t - 21.05 - i * .45) / .45); foot.x -= 30 * step; foot.y -= 9 * Math.sin(Math.PI * step); });
  const hesitate = Math.sin(Math.PI * smooth((t - 4.3) / 1.4));
  const helpLean = 40 * reach * (1 - .6 * share);
  const b = { hip: { x: bx, y: mix(646, 711, sit) }, shoulder: { x: bx - 6 - 25 * Math.sin(Math.PI * sit) - helpLean - 18 * hesitate, y: mix(497, 562, sit) + 7 * hesitate + 12 * reach * (1 - share) + 5 * performance.takeWeight + .55 * performance.breath }, feet, sit, headAngle: -.06 - .25 * smooth((t - 4.5) / .7) + .25 * smooth((t - 11) / .6) - .24 * smooth((t - 17.1) / .65) * (1 - smooth((t - 18.8) / .4)) - .12 * reach * (1 - relax) - .12 * Math.sin(Math.PI * smooth((t - 11.1) / .8)) - .06 * track(t, [[20.7, 0], [20.94, 1], [21.45, 0]]) };
  const rightSupport = bagPoint(68, 47);
  const bHand = blend(blend({ x: b.hip.x - 14 - 53 * b.sit, y: b.hip.y + 60 - 74 * b.sit }, { x: 1030, y: 636 }, offer), rightSupport, reach);
  const camera = t < 4.5 ? { x: 960, y: 630, scale: 1 } : t < 6.5 ? { x: 1100, y: 590, scale: 1.38 } : t < 12 ? { x: 980, y: 620, scale: 1.38 } : t < 16.7 ? { x: 980, y: 630, scale: 1.08 } : t < 21.3 ? { x: 975, y: 590, scale: 1.65 } : t < 26.6 ? { x: 935, y: 635, scale: 1.85 } : { x: 960, y: 630, scale: 1.12 };
  const release = performance.release;
  const releasedHand = { x: (1 - release) ** 2 * handle.x + 2 * (1 - release) * release * 945 + release ** 2 * 850,
    y: (1 - release) ** 2 * handle.y + 2 * (1 - release) * release * 695 + release ** 2 * 706 };
  return { bag, handle, support, rightSupport, share, reach, offer, accept, strain, relax, scoot, performance,
    a: { ...a, headDrop: 24 * Math.max(0, performance.nod) + .9 * performance.breath, hand: release > 0 ? releasedHand : a.hand },
    b: { ...b, hand: bHand }, camera, title: smooth((t - 29.1) / .4) };

}

function footContacts() {
  const raised = [false, false], events: { t: number; kind: string; pan: number; pitch: number }[] = [];
  for (let f = 0; f < 16 * film.fps; f++) {
    state(f / film.fps).b.feet.forEach((foot, i) => {
      if (foot.y < 862) raised[i] = true;
      if (foot.y > 869.8 && raised[i]) { events.push({ t: f / film.fps, kind: 'step', pan: (foot.x - 960) / 960, pitch: 0 }); raised[i] = false; }
    });
  }
  return events;
}
