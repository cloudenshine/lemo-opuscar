import { film, state, cues, joint, smooth, type Point } from './motion.ts';

const canvas = document.querySelector('canvas')!;
canvas.width = 1920; canvas.height = 1080;
const ctx = canvas.getContext('2d')!;
await document.fonts.ready;
const C = { wall: '#39565e', rim: '#1c3741', cream: '#ead6aa', skin: '#d4ad83', a: '#355b68', adark: '#25424e', b: '#b76d53', bdark: '#854f43', trouser: '#283d45', shoe: '#182e36', bag: '#ad8651' };
function shape(d: string, color: string) { ctx.fillStyle = color; ctx.fill(new Path2D(d)); }
function line(points: Point[], color: string, width: number) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
}
function ellipse(x: number, y: number, rx: number, ry: number, color: string) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function rect(x: number, y: number, w: number, h: number, color: string) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
const grain = document.createElement('canvas'); grain.width = 1920; grain.height = 1080;
const gc = grain.getContext('2d')!; let seed = 84;
for (let i = 0; i < 22000; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const x = seed % 1920; seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; gc.fillStyle = i % 2 ? '#fff9df' : '#172f39'; gc.globalAlpha = .035 + (i % 4) * .008; gc.fillRect(x, seed % 1080, 1 + i % 3, 1); }
function environment(t: number) {
  rect(0, 0, 1920, 1080, C.wall);
  const glow = ctx.createRadialGradient(1030, 450, 25, 1030, 450, 1000); glow.addColorStop(0, '#e7cf9f'); glow.addColorStop(.55, '#aab8a5'); glow.addColorStop(1, '#45616a'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1920, 875);
  shape('M0 410 Q230 290 470 390 T930 370 T1460 390 T1920 300 L1920 900 L0 900Z', '#819c97');
  shape('M0 485 Q160 460 340 500 T660 468 T960 510 T1360 450 T1920 520 L1920 900 L0 900Z', '#678b89');
  // Parallel cut layers retain a fixed point of view; no fabricated volumetric lighting.
  rect(0, 590, 1920, 35, '#52797b'); rect(0, 642, 1920, 12, '#54787a');
  for (let i = 0; i < 21; i++) rect(i * 103, 621, 6, 170, '#668684');
  ctx.save(); ctx.globalAlpha = .22; ctx.strokeStyle = '#edf1db'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 57; i++) { const x = (i * 137 + 23) % 1920, y = (i * 71 + t * 110) % 710; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 9, y + 22); ctx.stroke(); } ctx.restore();
  rect(0, 0, 1920, 135, C.rim); rect(0, 130, 1920, 12, '#abc2b2');
  rect(0, 0, 220, 878, '#27454e'); rect(1710, 0, 210, 878, '#27454e');
  rect(210, 130, 28, 750, '#1d3b46'); rect(1684, 130, 28, 750, '#1d3b46');
  rect(230, 816, 1458, 54, '#4a6b6d'); rect(0, 870, 1920, 210, '#2c4b56');
  line([{ x: 0, y: 877 }, { x: 1920, y: 877 }], '#76918a', 3);
  line([{ x: 40, y: 1015 }, { x: 1890, y: 1015 }], '#365762', 2);
  // One warm lamp remains constant across the social change.
  rect(973, 135, 5, 112, '#25434b'); ellipse(975, 252, 52, 10, '#f6dda3');
  shape('M935 249 L951 224 L998 224 L1015 249Z', '#304c53');
  ellipse(964, 908, 360, 26, '#243f49');
  rect(687, 710, 26, 155, '#183640'); rect(1240, 710, 26, 155, '#183640');
  for (let i = 0; i < 3; i++) { rect(648, 609 + i * 31, 647, 25, '#678681'); rect(648, 609 + i * 31, 647, 3, '#9fab90'); }
  rect(630, 707, 680, 16, '#ae9d75'); rect(630, 723, 680, 14, '#526f6b');
}
function head(p: Point, facing: number, angle: number, other: boolean) {
  ctx.save(); ctx.translate(p.x, p.y - 48); ctx.rotate(angle); ctx.scale(facing, 1);
  rect(-10, 28, 23, 35, C.skin);
  shape('M-27 -19 Q-17 -49 8 -44 Q30 -41 33 -13 L43 2 L30 6 Q31 29 9 34 Q-16 34 -24 13Z', C.skin);
  if (other) shape('M-32 12 Q-43 -34 -8 -49 Q20 -55 33 -25 L13 -29 L4 -10 Q-12 -14 -9 10 L-15 28 L-32 27Z', '#303b40');
  else { shape('M-29 3 Q-41 -39 -9 -48 Q21 -54 34 -26 L15 -29 Q-10 -31 -15 -6 L-16 14Z', '#233a43'); shape('M-39 -28 Q-30 -62 3 -59 Q25 -55 30 -32 L45 -25 L42 -18 L-38 -18Z', '#29444e'); }
  ellipse(25, -9, 2.3, 2.2, '#33434a');
  line([{ x: 27, y: 16 }, { x: 32, y: 15 }], '#8b7564', 1.8);
  ctx.restore();
}
function leg(hip: Point, foot: Point, facing: number, rear: boolean) {
  const knee = joint(hip, { x: foot.x, y: foot.y - 12 }, 112, 118, -facing);
  line([hip, knee, { x: foot.x, y: foot.y - 13 }], rear ? '#233944' : C.trouser, rear ? 27 : 32);
  ctx.save(); ctx.translate(foot.x, foot.y - 5); ctx.scale(facing, 1); shape('M-16 -12 L10 -13 Q15 -2 31 0 L34 8 L-19 8Z', C.shoe); ctx.restore();
}
function arm(start: Point, hand: Point, color: string, side: number, open = false) {
  const elbow = joint(start, hand, 100, 105, side);
  line([start, elbow, hand], color, 30);
  ellipse(hand.x, hand.y, 10, 8, C.skin);
  if (open) line([{ x: hand.x - 3, y: hand.y + 2 }, { x: hand.x + 20, y: hand.y - 5 }], C.skin, 7);
}
function coat(hip: Point, shoulder: Point, color: string, facing: number) {
  shape(`M${shoulder.x - 28} ${shoulder.y - 4} Q${shoulder.x} ${shoulder.y - 15} ${shoulder.x + 29} ${shoulder.y} L${hip.x + 42} ${hip.y + 15} Q${hip.x} ${hip.y + 27} ${hip.x - 44} ${hip.y + 12}Z`, color);
  line([{ x: shoulder.x + facing * 6, y: shoulder.y + 13 }, { x: hip.x + facing * 8, y: hip.y + 7 }], facing > 0 ? '#4d7280' : '#c9896c', 2);
  for (let i = 0; i < 3; i++) ellipse(shoulder.x + facing * 12, shoulder.y + 47 + i * 29, 2.2, 2.2, '#d1b28b');
  shape(`M${shoulder.x - 14} ${shoulder.y - 8} L${shoulder.x + 11} ${shoulder.y - 4} L${shoulder.x + 9} ${shoulder.y + 74} L${shoulder.x - 4} ${shoulder.y + 69}Z`, facing > 0 ? '#c69a68' : '#d9b88c');
}
function bag(s: ReturnType<typeof state>) {
  ctx.save(); ctx.translate(s.bag.x, s.bag.y); ctx.rotate(s.bag.angle);
  line([{ x: -22, y: -45 }, { x: -20, y: -65 }, { x: 20, y: -65 }, { x: 22, y: -45 }], '#655d45', 7);
  shape('M-70 -47 Q0 -56 70 -47 L78 42 Q0 53 -78 42Z', C.bag);
  shape('M-70 -47 L-58 -34 L-65 40 L-78 42Z', '#8a6f48');
  line([{ x: -57, y: -34 }, { x: 58, y: -34 }], '#ceb080', 2);
  line([{ x: -40, y: -46 }, { x: -43, y: 42 }], '#8e714c', 7); line([{ x: 40, y: -46 }, { x: 43, y: 42 }], '#8e714c', 7);
  ctx.restore();
}
function render(t: number) {
  t = Math.max(0, Math.min(film.duration, t)); const s = state(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.translate(960, 630); ctx.scale(s.camera.scale, s.camera.scale); ctx.translate(-s.camera.x, -s.camera.y);
  environment(t);
  const a = s.a, b = s.b;
  leg({ x: a.hip.x - 6, y: a.hip.y }, a.feet[1], 1, true); leg(a.hip, a.feet[0], 1, false);
  coat(a.hip, a.shoulder, C.a, 1); head({ x: a.shoulder.x, y: a.shoulder.y + a.headDrop }, 1, a.headAngle, false);
  arm({ x: a.shoulder.x - 12, y: a.shoulder.y + 15 }, a.other, C.adark, 1);
  bag(s);
  arm({ x: a.shoulder.x + 19, y: a.shoulder.y + 17 }, a.hand, C.a, 1, a.invite > .5);
  // The supporting hand remains visible on the near corner of the bag.
  ellipse(a.other.x, a.other.y, 10, 8, C.skin);
  leg({ x: b.hip.x + 5, y: b.hip.y }, b.feet[1], -1, true); leg(b.hip, b.feet[0], -1, false);
  coat(b.hip, b.shoulder, C.b, -1); head(b.shoulder, -1, b.headAngle, true);
  arm({ x: b.shoulder.x - 17, y: b.shoulder.y + 15 }, b.hand, C.bdark, -1);
  if (s.offer > .5) {
    line([{ x: b.hand.x + 5, y: b.hand.y + 2 }, { x: b.hand.x - 20, y: b.hand.y + 2 }], C.skin, 9);
    line([{ x: b.hand.x + 4, y: b.hand.y }, { x: b.hand.x - 3, y: b.hand.y - 9 }], C.skin, 5);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(grain, 0, 0);
  const vignette = ctx.createRadialGradient(960, 550, 360, 960, 550, 1100); vignette.addColorStop(0, '#142d3600'); vignette.addColorStop(1, '#142d3680'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, 1920, 1080);
  if (s.title) { ctx.globalAlpha = s.title; ctx.fillStyle = '#eedfc0'; ctx.font = '400 64px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('空  位', 960, 360); ctx.globalAlpha = 1; }
}
window.DUR = film.duration;
window.EV = cues.map(c => ({ t: c.t, type: c.kind }));
window.SHOTS = [{ start: 0, end: 4.5, framing: 'arrival', move: 'wide' }, { start: 4.5, end: 6.5, framing: 'notice the occupied seat', move: 'two-shot' }, { start: 6.5, end: 12, framing: 'lift and invite', move: 'hold' }, { start: 12, end: 16.7, framing: 'sit', move: 'wide' }, { start: 16.7, end: 21.3, framing: 'strain, offer and acknowledgement', move: 'hold both faces and offered palm' }, { start: 21.3, end: 25.1, framing: 'move closer and support from below', move: 'closer on hands' }, { start: 25.1, end: 32, framing: 'release and relief', move: 'return to both bodies' }];
window.render = render;
window.TEXTS = t => t >= 29.5 ? [{ id: 'title', text: '空位', x0: 860, x1: 1060, y0: 296, y1: 373 }] : [];
render(0); window.READY = true;
export {};
