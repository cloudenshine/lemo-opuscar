import { film, state, cues, smooth, type Point } from './motion.ts';
import { bodyFrame, limbSurface, type BodyFrame } from './body.ts';

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
function fillVolume(d: string, x: number, y: number, width: number, colors: string[]) {
  const g = ctx.createLinearGradient(x - width, y, x + width, y + 15);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = g; ctx.fill(new Path2D(d));
}
function curve(points: Point[], color: string, width: number) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y); ctx.stroke();
}
function head(f: BodyFrame, other: boolean) {
  const h = f.head, neck = f.shoulder, tilt = f.pitch, yaw = f.turn;
  shape(`M${neck.x - 13} ${neck.y + 7} Q${neck.x - 12} ${neck.y - 18} ${h.x - 12} ${h.y + 24} L${h.x + 15} ${h.y + 21} Q${neck.x + 10} ${neck.y - 9} ${neck.x + 18} ${neck.y + 9}Z`, '#bd9674');
  ctx.save(); ctx.translate(h.x, h.y); ctx.scale(f.facing, 1);
  // Pitch changes the jaw and facial planes rather than rotating a flat profile.
  const eyeY = -10 + tilt * 24, chinY = 36 - tilt * 12, noseX = 30 - 13 * yaw;
  const outline = `M-29 -17 C-32 -43 -11 -52 11 -45 C31 -41 34 -23 31 -8 Q${noseX + 9} ${eyeY + 12} ${noseX + 7} ${eyeY + 16} L29 ${eyeY + 19} Q31 ${chinY - 4} 13 ${chinY} Q-10 ${chinY + 5} -22 19 Q-30 7 -29 -17Z`;
  fillVolume(outline, 0, 0, 37, ['#ad866b', '#d5af88', '#e8c79d', '#c49c78']);
  ctx.save(); ctx.globalAlpha = .3;
  shape(`M-17 -2 Q-7 8 6 11 Q15 22 9 ${chinY} Q-14 ${chinY - 1} -21 17Z`, '#a88770'); ctx.restore();
  ellipse(-19, 8 + tilt * 8, 8, 11, '#dcba93');
  curve([{ x: -21, y: 4 + tilt * 8 }, { x: -14, y: 1 + tilt * 8 }, { x: -17, y: 13 + tilt * 8 }], '#ae856b', 1.5);
  if (other) {
    shape('M-28 16 C-43 -4 -40 -39 -16 -49 C1 -60 30 -45 33 -25 Q22 -18 9 -31 Q-9 -14 -18 -10 L-20 26 Q-34 31 -36 18Z', '#283c43');
    curve([{ x: -28, y: -28 }, { x: -15, y: -48 }, { x: 9, y: -39 }], '#45514e', 3);
    ellipse(-30, 24, 12, 14, '#2c3c40');
  } else {
    shape('M-29 7 C-40 -21 -33 -47 -9 -50 Q20 -53 32 -29 L11 -24 Q-5 -30 -15 -10 L-17 7Z', '#283a41');
    fillVolume('M-36 -26 Q-32 -58 -4 -60 Q22 -59 31 -34 L46 -25 Q38 -18 18 -20 L-36 -20Z', 0, -30, 40, ['#29414c', '#4b6871', '#29444f']);
    curve([{ x: -28, y: -39 }, { x: -5, y: -53 }, { x: 17, y: -38 }], '#647e80', 1.4);
  }
  const near = 8 + 8 * yaw, far = 27, eyeOpen = Math.max(.12, 1 - f.blink);
  for (const [x, scale] of [[near, 1], [far, .55]]) {
    ellipse(x, eyeY, 4.3 * scale, 2.2 * eyeOpen, '#efe0bd');
    ellipse(x + 1, eyeY, 1.9 * scale, 2 * eyeOpen, '#344148');
    curve([{ x: x - 4 * scale, y: eyeY - 1 }, { x, y: eyeY - 3 * eyeOpen }, { x: x + 4 * scale, y: eyeY - .5 }], '#68564a', 1.25);
    curve([{ x: x - 5 * scale, y: eyeY - 7 - 2 * f.effort }, { x, y: eyeY - 9 }, { x: x + 4 * scale, y: eyeY - 6 + f.effort * 3 }], '#625347', 2);
  }
  curve([{ x: noseX, y: eyeY + 2 }, { x: noseX - 1, y: eyeY + 10 }, { x: noseX + 5, y: eyeY + 13 }], '#ab8065', 1.4);
  curve([{ x: 12, y: eyeY + 27 + f.effort * 2 }, { x: 20, y: eyeY + 27 }, { x: 27, y: eyeY + 27 + f.effort * 2 - f.relief * 1.5 }], '#8d6758', 1.7);
  curve([{ x: 17, y: eyeY + 31 }, { x: 22, y: eyeY + 33 }, { x: 25, y: eyeY + 30 }], '#ddb990', 1.5);
  ctx.restore();
}
function leg(hip: Point, foot: Point, facing: number, rear: boolean) {
  const end = { x: foot.x, y: foot.y - 13 }, surf = limbSurface(hip, end, 112, 118, -facing, [24, 20, 11]);
  fillVolume(surf.d, surf.hinge.x, hip.y, 35, rear ? ['#203740', '#304b54', '#243b45'] : ['#243d48', '#48616a', '#2e4753']);
  curve([surf.left[1], { x: surf.hinge.x + facing * 7, y: surf.hinge.y + 6 }, { x: surf.hinge.x - facing * 5, y: surf.hinge.y + 17 }], '#203840', 1.6);
  curve([{ x: end.x - 7, y: end.y - 24 }, { x: end.x + 5, y: end.y - 17 }, { x: end.x + 9, y: end.y - 19 }], '#607077', 1.3);
  ctx.save(); ctx.translate(foot.x, foot.y - 5); ctx.scale(facing, 1);
  fillVolume('M-16 -12 Q-1 -16 10 -12 Q15 -2 31 0 Q37 4 32 9 L-19 9Z', 8, 0, 28, ['#1a3039', '#354b52', '#1b3038']);
  line([{ x: -17, y: 9 }, { x: 31, y: 9 }], '#7a8073', 2); ctx.restore();
}
function hand(p: Point, angle: number, opening: number, facing: number, palmUp = false) {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.rotate(palmUp ? (facing > 0 ? -.12 : Math.PI + .12) : angle);
  const spread = opening;
  fillVolume(`M-13 -7 Q-3 -11 5 -7 Q${12 + 6 * spread} ${-8 - 5 * spread} ${12 + 9 * spread} ${-3 - 5 * spread} Q${17 + 4 * spread} 2 9 4 L4 8 Q-5 10 -12 5Z`, 2, 0, 18, ['#b48d70', '#e0bb90', '#c9a27f']);
  for (let i = 0; i < 3; i++) curve([{ x: 3 + i * 2, y: -4 + i * 3 }, { x: 12 + 6 * spread, y: -5 + i * 3 }, { x: 10 + 10 * spread, y: -1 + i * 3 }], '#ad8267', .9);
  curve([{ x: -5, y: 5 }, { x: -1, y: -9 - 5 * spread }, { x: 8, y: -7 - 6 * spread }], '#e5bf94', 5);
  ctx.restore();
}
function arm(start: Point, end: Point, other: boolean, side: number, opening = 0, palmUp = false, drawHand = true) {
  const surf = limbSurface(start, end, 100, 105, side, [21, 16, 8]);
  const colors = other ? ['#814f43', '#ba7c61', '#d19b77', '#9b5e4e'] : ['#284653', '#4d7580', '#648994', '#345764'];
  fillVolume(surf.d, surf.hinge.x, surf.hinge.y, 34, colors);
  const elbow = surf.hinge;
  curve([{ x: elbow.x - side * 11, y: elbow.y - 8 }, { x: elbow.x + side * 3, y: elbow.y + 1 }, { x: elbow.x + side * 10, y: elbow.y - 3 }], other ? '#8d5448' : '#2c4b58', 1.6);
  curve([{ x: elbow.x - side * 12, y: elbow.y - 1 }, { x: elbow.x + side * 2, y: elbow.y + 6 }, { x: elbow.x + side * 7, y: elbow.y + 4 }], other ? '#d69e7b' : '#73929a', 1.1);
  line([surf.left[2], surf.right[2]], other ? '#d6a081' : '#7b9b9e', 3);
  if (drawHand) hand(end, surf.wristAngle, opening, other ? -1 : 1, palmUp);
}
function coat(f: BodyFrame, other: boolean) {
  const { pelvis: h, waist: w, chest: c, shoulder: s, chestWidth: cw, waistWidth: ww } = f;
  const outline = `M${s.x - 32} ${s.y - 2} Q${s.x - 13} ${s.y - 16} ${s.x + 7} ${s.y - 9} Q${s.x + 32} ${s.y - 9} ${s.x + 36} ${s.y + 17} C${c.x + cw} ${c.y} ${w.x + ww} ${w.y - 18} ${w.x + ww} ${w.y} Q${h.x + 39} ${h.y - 10} ${h.x + 47} ${h.y + 13} Q${h.x + 10} ${h.y + 30} ${h.x - 46} ${h.y + 15} Q${w.x - ww} ${w.y + 18} ${w.x - ww} ${w.y} C${w.x - ww - 4} ${w.y - 32} ${c.x - cw} ${c.y} ${s.x - 32} ${s.y - 2}Z`;
  fillVolume(outline, c.x, c.y, 58, other ? ['#835345', '#bb7a5e', '#d59c78', '#a36651'] : ['#274754', '#456c79', '#6a8b93', '#355c6a']);
  const face = f.facing;
  shape(`M${s.x - 12} ${s.y - 7} Q${s.x + 1} ${s.y + 2} ${s.x + 14} ${s.y - 6} L${c.x + face * 9} ${c.y + 25} Q${c.x} ${c.y + 32} ${c.x - face * 7} ${c.y + 18}Z`, other ? '#e4c49a' : '#cbb58d');
  curve([{ x: s.x + face * 19, y: s.y + 3 }, { x: c.x + face * 18, y: c.y + 16 }, { x: w.x + face * 5, y: w.y + 15 }], other ? '#815243' : '#294a59', 2.4);
  curve([{ x: w.x + face * 5, y: w.y + 15 }, { x: h.x + face * 13, y: h.y }, { x: h.x + face * 9, y: h.y + 17 }], other ? '#95604e' : '#315562', 1.4);
  for (let i = 0; i < 3; i++) {
    const y = w.y + i * 10, depth = 7 + f.effort * (10 - i * 2);
    curve([{ x: w.x - face * 22, y }, { x: w.x, y: y + depth }, { x: w.x + face * (19 - i * 4), y: y + 3 }], other ? '#a76b54' : '#365966', 1.3);
  }
  ellipse(w.x + face * 10, w.y + 2, 2.3, 2.6, '#c9b58f');
  curve([{ x: h.x - 33, y: h.y + 10 }, { x: h.x, y: h.y + 19 }, { x: h.x + 35, y: h.y + 10 }], other ? '#d29a75' : '#6e8a8c', 1.6);
}
function bag(s: ReturnType<typeof state>) {
  ctx.save(); ctx.translate(s.bag.x, s.bag.y); ctx.rotate(s.bag.angle);
  if (s.performance.active === 0) line([{ x: -22, y: -45 }, { x: -20, y: -65 }, { x: 20, y: -65 }, { x: 22, y: -45 }], '#655d45', 7);
  else {
    ctx.strokeStyle = '#655d45'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-22, -45); ctx.quadraticCurveTo(-26, s.bag.handleY, 0, s.bag.handleY); ctx.quadraticCurveTo(26, s.bag.handleY, 22, -45); ctx.stroke();
  }
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
  const a = s.a, b = s.b, p = s.performance, fa = bodyFrame(t, 'a'), fb = bodyFrame(t, 'b');
  leg({ x: a.hip.x - 6, y: a.hip.y }, a.feet[1], 1, true); leg(a.hip, a.feet[0], 1, false);
  arm({ x: a.shoulder.x - 12, y: a.shoulder.y + 15 }, a.other, false, 1);
  coat(fa, false); head(fa, false);
  bag(s);
  arm({ x: a.shoulder.x + 19, y: a.shoulder.y + 17 }, a.hand, false, 1, Math.max(a.invite, p.fingers), a.invite > .5);
  hand(a.other, 0, .55, 1, true);
  leg({ x: b.hip.x + 5, y: b.hip.y }, b.feet[1], -1, true); leg(b.hip, b.feet[0], -1, false);
  // The farther hand rests on the thigh once seated; the near hand carries the offer.
  const restHand = { x: b.hip.x + 16, y: b.hip.y + 45 - 28 * b.sit };
  arm({ x: b.shoulder.x + 17, y: b.shoulder.y + 15 }, restHand, true, -1, .2);
  coat(fb, true); head(fb, true);
  hand(restHand, Math.PI * .6, .2, -1);
  arm({ x: b.shoulder.x - 17, y: b.shoulder.y + 15 }, b.hand, true, -1, s.offer * .8, s.offer > .5);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(grain, 0, 0);
  const vignette = ctx.createRadialGradient(960, 550, 360, 960, 550, 1100); vignette.addColorStop(0, '#142d3600'); vignette.addColorStop(1, '#142d3680'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, 1920, 1080);
  if (s.title) { ctx.globalAlpha = s.title; ctx.fillStyle = '#eedfc0'; ctx.font = '400 64px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('空  位', 960, 360); ctx.globalAlpha = 1; }
}
window.DUR = film.duration;
window.EV = cues.map(c => ({ t: c.t, type: c.kind }));
window.SHOTS = [{ start: 0, end: 4.5, framing: 'arrival', move: 'wide' }, { start: 4.5, end: 6.5, framing: 'notice the occupied seat', move: 'two-shot' }, { start: 6.5, end: 12, framing: 'lift and invite', move: 'hold' }, { start: 12, end: 16.7, framing: 'sit', move: 'wide' }, { start: 16.7, end: 21.3, framing: 'strain, offer and acknowledgement', move: 'hold both faces and offered palm' }, { start: 21.3, end: 26.6, framing: 'take the load and release the grip', move: 'closer on hands' }, { start: 26.6, end: 32, framing: 'release and relief', move: 'return to both bodies' }];
window.render = render;
window.TEXTS = t => t >= 29.5 ? [{ id: 'title', text: '空位', x0: 860, x1: 1060, y0: 296, y1: 373 }] : [];
render(0); window.READY = true;
export {};
