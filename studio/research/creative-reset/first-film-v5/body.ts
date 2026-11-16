import { state, blend, smooth, joint, type Point } from './motion.ts';

export type BodyFrame = ReturnType<typeof bodyFrame>;
export function bodyFrame(t: number, who: 'a' | 'b') {
  const s = state(t), actor = s[who], facing = who === 'a' ? 1 : -1, p = s.performance;
  const lifting = smooth((t - 6.5) / .7) * (1 - smooth((t - 9) / .8));
  const effort = who === 'a' ? Math.max(lifting * .8, p.catchBody * (1 - .72 * p.torsoRest)) : .45 * p.takeWeight + .35 * s.reach * (1 - s.share);
  // A compressed waist and expanded upper back cannot be expressed by rotating a rigid torso.
  const pelvis = { x: actor.hip.x - facing * 4 * effort, y: actor.hip.y };
  const waist = blend(pelvis, actor.shoulder, .38);
  waist.x -= facing * (11 + 12 * effort); waist.y += 5 * effort;
  const chest = blend(pelvis, actor.shoulder, .77);
  chest.x += facing * (6 + 9 * effort); chest.y += 6 * effort;
  const shoulder = { ...actor.shoulder };
  const turn = who === 'a' ? .3 + .26 * p.gazeA - .12 * effort : .42 + .13 * s.offer;
  const pitch = actor.headAngle * facing;
  const head = { x: shoulder.x + facing * (5 + 8 * effort + 24 * pitch), y: shoulder.y - 48 + 32 * Math.max(0, pitch) };
  return { pelvis, waist, chest, shoulder, head, facing, effort, turn, pitch,
    chestWidth: 37 + 6 * effort, waistWidth: 29 - 4 * effort,
    blink: who === 'a' ? p.aBlink : p.bBlink, relief: p.neckRest,
    hand: actor.hand, hip: actor.hip, feet: actor.feet };
}

export type LimbSurface = ReturnType<typeof limbSurface>;
export function limbSurface(start: Point, end: Point, first: number, second: number, side: number, widths: [number, number, number]) {
  const hinge = joint(start, end, first, second, side);
  const normal = (a: Point, b: Point) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: -(b.y - a.y) / d, y: (b.x - a.x) / d };
  };
  const n0 = normal(start, hinge), n1 = normal(hinge, end);
  const n = { x: (n0.x + n1.x) * .5, y: (n0.y + n1.y) * .5 };
  const length = Math.hypot(n.x, n.y) || 1;
  n.x /= length; n.y /= length;
  const offset = (p: Point, direction: Point, width: number, sign: number): Point => ({ x: p.x + direction.x * width * sign, y: p.y + direction.y * width * sign });
  const edge = (sign: number) => [offset(start, n0, widths[0], sign), offset(hinge, n, widths[1], sign), offset(end, n1, widths[2], sign)];
  const left = edge(1), right = edge(-1);
  // Curved sides wrap a rounded bend; the centerline remains constrained by the contact solver.
  const sidePath = (points: Point[]) => {
    const [a, b, c] = points, before = blend(a, b, .73), after = blend(b, c, .27);
    const mid = blend(a, before, .5), finish = blend(after, c, .6);
    return `C${mid.x} ${mid.y} ${before.x} ${before.y} ${before.x} ${before.y} Q${b.x} ${b.y} ${after.x} ${after.y} Q${finish.x} ${finish.y} ${c.x} ${c.y}`;
  };
  const d = `M${left[0].x} ${left[0].y} ${sidePath(left)} L${right[2].x} ${right[2].y} ${sidePath([...right].reverse())} Q${start.x + n0.y * widths[0]} ${start.y - n0.x * widths[0]} ${left[0].x} ${left[0].y}Z`;
  return { start, end, hinge, left, right, d, wristAngle: Math.atan2(end.y - hinge.y, end.x - hinge.x) };
}
