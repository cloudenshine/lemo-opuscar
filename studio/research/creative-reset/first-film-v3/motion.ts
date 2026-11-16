export type Point = { x: number; y: number };
export const film = { id: 'space-for-two-v3', duration: 32, fps: 30 };
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
export const cues = [
  ...footContacts(),
  { t: .3, kind: 'note', pan: -.2, pitch: 220 }, { t: 3, kind: 'note', pan: .1, pitch: 261.63 },
  { t: 7.3, kind: 'cloth', pan: .05, pitch: 0 }, { t: 9.5, kind: 'cloth', pan: -.2, pitch: 0 },
  { t: 15.7, kind: 'seat', pan: .2, pitch: 0 }, { t: 16.2, kind: 'note', pan: -.2, pitch: 220 }, { t: 16.45, kind: 'note', pan: .2, pitch: 329.63 }, { t: 27.3, kind: 'note', pan: .1, pitch: 293.66 },
  { t: 17, kind: 'cloth', pan: -.15, pitch: 0 }, { t: 17.7, kind: 'cloth', pan: -.15, pitch: 0 },
  { t: 23.5, kind: 'cloth', pan: .05, pitch: 0 }, { t: 25.5, kind: 'breath', pan: -.1, pitch: 0 },
];
export function state(t: number) {
  const lift = smooth((t - 7.3) / 2.2), lean = smooth((t - 6.5) / .8) * (1 - smooth((t - 8.5) / 1));
  const share = smooth((t - 23.5) / 1.5), reach = smooth((t - 22.3) / 1.2);
  const offer = smooth((t - 19.2) / .6), accept = smooth((t - 20.4) / .9);
  const strain = smooth((t - 16.7) / .35) * (1 - smooth((t - 17.5) / .45));
  const relax = smooth((t - 25.6) / 1.2), load = smooth((t - 16.7) / .6) * (1 - relax);
  const scoot = smooth((t - 21.3) / 1);
  const bag = { x: mix(1080, 850, lift) + 65 * share + 9 * strain, y: mix(667, 650, lift) - 25 * Math.sin(Math.PI * lift) + 8 * strain, angle: -.10 * Math.sin(Math.PI * lift) + .12 * strain };
  const bagPoint = (x: number, y: number) => ({ x: bag.x + Math.cos(bag.angle) * x - Math.sin(bag.angle) * y, y: bag.y + Math.sin(bag.angle) * x + Math.cos(bag.angle) * y });
  const handle = bagPoint(0, -64), support = bagPoint(mix(-54, 40, lift) - 80 * share, 43);
  const invite = smooth((t - 10.5) / .8) * (1 - smooth((t - 12.5) / .7));
  const hand = blend(blend({ x: 867, y: 667 }, handle, smooth((t - 6.3) / 1)), { x: 1017, y: 632 }, invite);
  const a = { hip: { x: 800, y: 711 }, shoulder: { x: 800 + lean * 85 + 24 * load, y: 562 + lean * 13 + 12 * load }, hand,
    other: blend({ x: 902, y: 703 }, support, smooth((t - 6.7) / .6)), headAngle: .25 - .22 * smooth((t - 4.7) / .5) + .2 * smooth((t - 5.5) / .7) * (1 - smooth((t - 10) / .6)) + .18 * load * (1 - smooth((t - 19.8) / .5)) + .28 * Math.sin(Math.PI * accept), feet: [{ x: 902, y: 870 }, { x: 936, y: 870 }], invite };
  const travel = smooth((t - .8) / 3.7) * 230 + smooth((t - 12) / 1.8) * 200;
  const bx = 1590 - travel - 30 * scoot, sit = smooth((t - 13.8) / 2.2);
  const walkFoot = (offset: number): Point => {
    const cycle = travel / 85 + offset, q = cycle - Math.floor(cycle), swing = smooth((q - .58) / .42);
    return { x: 1590 - (Math.floor(cycle) - offset) * 85 + 10 - 85 * swing, y: 870 - 32 * Math.sin(Math.PI * swing) };
  };
  const standing = smooth((t - 4.1) / .4) * (1 - smooth((t - 12) / .2));
  const settled = smooth((t - 13.4) / .4);
  const feet = [0, .5].map((phase, i) => blend(blend(walkFoot(phase), { x: 1360 + (i ? 28 : -22), y: 870 }, standing), { x: 1160 + (i ? -35 : -85), y: 870 }, settled));
  feet.forEach((foot, i) => { const step = smooth((t - 21.3 - i * .45) / .45); foot.x -= 30 * step; foot.y -= 9 * Math.sin(Math.PI * step); });
  const hesitate = Math.sin(Math.PI * smooth((t - 4.3) / 1.4));
  const helpLean = 40 * reach * (1 - .6 * share);
  const b = { hip: { x: bx, y: mix(646, 711, sit) }, shoulder: { x: bx - 6 - 25 * Math.sin(Math.PI * sit) - helpLean - 18 * hesitate, y: mix(497, 562, sit) + 7 * hesitate + 12 * reach * (1 - share) }, feet, sit, headAngle: -.06 - .25 * smooth((t - 4.5) / .7) + .25 * smooth((t - 11) / .6) - .24 * smooth((t - 17.1) / .65) * (1 - smooth((t - 18.8) / .4)) - .12 * reach * (1 - relax) - .12 * Math.sin(Math.PI * smooth((t - 11.1) / .8)) };
  const rightSupport = bagPoint(68, 47);
  const bHand = blend(blend({ x: b.hip.x - 14 - 53 * b.sit, y: b.hip.y + 60 - 74 * b.sit }, { x: 1030, y: 636 }, offer), rightSupport, reach);
  const camera = t < 4.5 ? { x: 960, y: 630, scale: 1 } : t < 6.5 ? { x: 1100, y: 590, scale: 1.38 } : t < 12 ? { x: 980, y: 620, scale: 1.38 } : t < 16.7 ? { x: 980, y: 630, scale: 1.08 } : t < 21.3 ? { x: 975, y: 590, scale: 1.65 } : t < 25.1 ? { x: 935, y: 635, scale: 1.85 } : { x: 960, y: 630, scale: 1.12 };
  return { bag, handle, support, rightSupport, share, reach, offer, accept, strain, relax, scoot, a: { ...a, headDrop: 6 * Math.sin(Math.PI * accept), hand: blend(a.hand, { x: 850, y: 706 }, smooth((t - 25.1) / 1)) }, b: { ...b, hand: bHand }, camera, title: smooth((t - 29.1) / .4) };

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
