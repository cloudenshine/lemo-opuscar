// @ts-expect-error The upstream browser engine is JavaScript with an absolute web import.
import { mk, draw, drawSeq, TONE } from '/styles/ink-wash/demo/ink.js';
// @ts-expect-error The upstream compositor is served unchanged.
import { makeComp, layerSet } from '/styles/ink-wash/demo/comp.js';
// @ts-expect-error The upstream landscape library is served unchanged.
import { mountainLayer, ridgeFn } from '/styles/ink-wash/demo/land.js';

declare global {
  interface Window {
    PERFORMANCE: (t: number) => {phase: string; actors: Array<{id: string; x: number; y: number; [key: string]: string | number | boolean}>};
    STROKES?: (t: number) => Array<{id:string;progress:number;deformation:number;points:number[][]}>;
    SOLIDS?: (t: number) => Array<{id:string;vertices:number[][];front:number[][];faces:number[][];depth:number;thickness:number}>;
    CAMERA?: (t: number) => Record<string, number>;
    READY: boolean; DUR: number; render: (t: number) => void;
    TEXTS: (t: number) => Array<{ id: string; text: string; x0: number; y0: number; x1: number; y1: number }>;
    EV: Array<{ t: number; type: string }>;
    SHOTS: Array<{ start: number; end: number; framing: string; move: string }>;
  }
}
const W = 1920, H = 1080;
const canvas = document.querySelector('canvas')!;
canvas.width = W; canvas.height = H;
const layer = layerSet(W, H), composite = makeComp(canvas);
const data: { title: string; inscription: string; seal: string } = await fetch('./content.json').then(r => {
  if (!r.ok) throw new Error('content.json could not be loaded'); return r.json();
});
await document.fonts.ready;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
const far = mountainLayer({ W: W + 240, H, ridge: ridgeFn([[300, 160, 210], [630, 205, 190], [930, 150, 210], [1530, 250, 250]], 510, 13, 25), depth: 260, tone: .17, mist: .7, seed: 27 });
const near = mountainLayer({ W: W + 240, H, ridge: ridgeFn([[1160, 190, 140], [1430, 300, 130], [1680, 170, 170]], 660, 7, 38), depth: 340, tone: .30, mist: .6, seed: 9, xmask: (x: number) => smooth((x - 800) / 500) });
const stems: unknown[] = [], leaves: unknown[] = [];
for (let j = 0; j < 3; j++) {
  const bx = 1280 + j * 145, height = 570 - j * 95;
  for (let i = 0; i < 5; i++) {
    const y = 900 - height * i / 5, next = y - height / 5;
    stems.push(mk([[bx - i * 14, y], [bx - i * 14 - 5, (y + next) / 2], [bx - (i + 1) * 14, next + 6]], { w: 15 - j * 2, tone: TONE.nong, dry: .25, wet: .7, side: .85, prof: 'even', seed: 100 + j * 20 + i }));
    if (i > 1) {
      for (let k = 0; k < 4; k++) {
        const dx = (k + i) % 2 ? -1 : 1, x = bx - i * 14, ly = y + k * 5;
        const reach = 55 + (i * 29 + j * 17 + k * 31) % 77;
        const drop = [-52, 20, -14, 61][(k + j) % 4];
        leaves.push(mk([[x, ly], [x + dx * reach * .5, ly + drop * .4 - 9], [x + dx * reach, ly + drop]], { w: 10 + k * 2, tone: TONE.zhong, dry: .3, wet: .6, side: .8, prof: 'tip', seed: 230 + j * 40 + i * 4 + k }));
      }
    }
  }
}
const fallenLeaf = mk([[-60, 4], [-10, -8], [65, -2]], { w: 30, tone: TONE.nong, dry: .22, wet: .6, prof: 'lens', seed: 913, side: .7 });

const birdParts = {
  body: mk([[-18, -5], [2, 5], [23, 9]], {w:38,tone:TONE.nong,wet:.7,dry:.35,prof:'lens',seed:1201}),
  neck: mk([[-17,-18],[-13,-4],[0,3]], {w:18,tone:TONE.nong,wet:.6,dry:.3,prof:'lens',seed:1208}),
  head: mk([[-5,0],[4,-3],[12,0]], {w:25,tone:TONE.nong,wet:.6,dry:.25,prof:'lens',seed:1202}),
  beak: mk([[-7,0],[-29,5]], {w:7,tone:TONE.nong,wet:.3,dry:.4,prof:'tip',seed:1203}),
  wing: mk([[3,-4],[20,8],[42,16]], {w:22,tone:TONE.zhong,wet:.6,dry:.5,prof:'tip',seed:1204}),
  wingtip: mk([[0,0],[20,6],[43,13]], {w:20,tone:TONE.nong,wet:.4,dry:.45,prof:'tip',seed:1209}),
  tail: mk([[16,9],[43,24],[65,30]], {w:15,tone:TONE.nong,wet:.4,dry:.4,prof:'tip',seed:1205}),
  foot: mk([[0,0],[-3,17],[-13,19],[8,19]], {w:2,tone:TONE.nong,wet:.2,dry:.4,prof:'even',seed:1206}),
  branch: mk([[1238,558],[1280,572],[1320,580],[1360,584]], {w:5,tone:TONE.nong,wet:.5,dry:.4,prof:'tip',seed:1207}),
};

function birdPose(t: number) {
  const enter = smooth((t - 1.5) / 2.75), leave = smooth((t - 20.5) / 3);
  const hop = smooth((t - 6.5) / 1), arc = Math.sin(Math.PI * hop) ** 2;
  const land = t >= 4.25 && t < 20.5 && !(t > 6.5 && t < 7.5);
  const settle = (at: number) => t >= at ? Math.sin((t - at) * 14) * Math.exp(-(t - at) * 5) * 7 : 0;
  const crouch = 8 * Math.sin(Math.PI * smooth((t - 6) / .5)) + 7 * Math.sin(Math.PI * smooth((t - 19.75) / .75));
  const gust = Math.sin(Math.PI * smooth((t - 10.5) / 1.5));
  const x = 1760 - 440 * enter + 30 * hop - 520 * leave;
  const y = 300 + 250 * enter + 3 * hop - 45 * arc - 310 * leave + settle(4.25) + settle(7.5) + crouch;
  const gaze = t < 8 ? -.2 + .3 * smooth((t - 5) / 1) : t < 14 ? -.1 - .25 * smooth((t - 10.5) / 1.5) : -.35 - .5 * smooth((t - 14) / 3) + 1.05 * smooth((t - 19.5) / 1);
  const flying = t < 4.25 || t >= 20.5;
  return { x, y, land, footX: flying ? x : 1320 + 30 * hop, footY: flying ? y + 30 : 580 + 3 * hop - 40 * arc,
    head: gaze - .2 * Math.sin(Math.PI * smooth((t - 10.75) / .75)), torso: -.22 * gust + .14 * arc, squash: 1 - crouch / 65,
    wing: flying ? Math.sin(t * 24) * 1.1 : -.9 * arc - .65 * gust,
    wrist: flying ? Math.sin(t * 24 - .8) * .8 : -.65 * arc + .4 * gust,
    tail: .4 * gust - .3 * arc, beak: .25 * Math.sin(Math.PI * clamp((t - 8.5) / .45)) };
}
function legPose(b: ReturnType<typeof birdPose>, side: number) {
  const lx = side * 8 * (1 + (1 - b.squash) * .2), ly = 13 * b.squash;
  const hx = b.x + lx * Math.cos(b.torso) - ly * Math.sin(b.torso);
  const hy = b.y + lx * Math.sin(b.torso) + ly * Math.cos(b.torso);
  const fx = b.footX + side * 7, fy = b.footY;
  const dx = fx - hx, dy = fy - hy, distance = Math.hypot(dx, dy);
  const bend = Math.sqrt(Math.max(0, 19 ** 2 - (distance / 2) ** 2));
  return { hx, hy, kx: (hx + fx) / 2 - dy / Math.max(distance, 1) * bend,
    ky: (hy + fy) / 2 + dx / Math.max(distance, 1) * bend, fx, fy };
}

function companionPose(t: number): ReturnType<typeof birdPose> {
  const arrival = smooth((t - 8.75) / 1.5), depart = smooth((t - 22) / 2);
  const yieldStep = smooth((t - 10.75) / .75), arc = Math.sin(Math.PI * yieldStep)**2;
  const land = t >= 10.25 && t < 22 && !(t > 10.75 && t < 11.5);
  const settle = t >= 10.25 ? 4 * Math.sin((t - 10.25) * 13) * Math.exp(-(t - 10.25) * 5) : 0;
  const x = 970 + 195 * arrival - 35 * yieldStep + 470 * depart, y = 350 + 170 * arrival - 260 * depart + settle - 25 * arc;
  return {x,y,land,footX:x,footY:land?550:y+30,
    head: -.12 - .24 * Math.sin(Math.PI * smooth((t - 11.25) / .75)) - 2 * smooth((t - 15.25) / .75) + 2 * smooth((t - 20) / 1),
    torso: .1 * Math.sin(Math.PI * smooth((t - 10.5) / 1.5)), squash: 1,
    wing: land ? -.2 * Math.sin(Math.PI * smooth((t - 10.5) / 1.5)) : Math.sin(t*23+.7),
    wrist: land ? 0 : .8*Math.sin(t*23-.2),tail:land?.08*Math.sin(t*1.4):-.2,
    beak:.3*Math.sin(Math.PI*clamp((t-10.75)/.5))};
}
const companionFacing = (_t: number) => -1;
const companionBranch = mk([[1238,558],[1200,547],[1165,550],[1130,552]],{w:5,tone:TONE.nong,wet:.4,dry:.4,prof:'tip',seed:1210});

function ensemblePose(t: number, i: number): ReturnType<typeof birdPose> {
  const arrival=smooth((t-(i===0?5.25:10.75))/(i===0?1.25:1));
  const departure=smooth((t-(i===0?21:22.75))/(i===0?2.5:1.25));
  const x=i===0?1850-420*arrival+400*departure:1050-50*departure;
  const y=i===0?100+310*arrival-300*departure:650*arrival-300*departure;
  const land=arrival===1&&departure===0;
  const attention=smooth((t-(14.25+i*.25))/1.5);
  return {x,y,land,footX:x,footY:land?(i===0?440:680):y+30,
    head:-.1-.65*attention+.2*Math.sin(Math.PI*smooth((t-11.5-i*.25)/.5)),
    torso:land?.05*Math.sin(t*1.5+i):-.12,squash:1,
    wing:land?-.15*Math.sin(t+i):Math.sin(t*(21+i*2)+i),wrist:land?0:.7*Math.sin(t*(21+i*2)-.6+i),
    tail:land?.12*Math.sin(t*1.2+i):-.2,beak:.22*Math.sin(Math.PI*clamp((t-(i===0?10.5:11.75))/.25))};
}
const ensembleBranches=[mk([[1370,454],[1430,440],[1500,443]],{w:5,tone:TONE.nong,wet:.3,dry:.4,prof:'tip',seed:1230}),
  mk([[1275,640],[1120,674],[1050,680],[1010,684]],{w:4,tone:TONE.nong,wet:.3,dry:.4,prof:'tip',seed:1231})];

function cameraPose(t: number) {
  const fall = smooth((t - 14) / 3), travel = smooth((t - 17) / 7);
  const leafX = 1230 - fall * 180 - travel * 310, leafY = 525 + fall * 286;
  let zoom = 1, cx = 960, cy = 540;
  if (t < 4) { zoom = 1 + smooth(t / 4) * .08; cx += smooth(t / 4) * 45; }
  else if (t < 8) { zoom = 1.65; cx = 1220; cy = 560 - 5 * smooth((t - 4) / 4); }
  else if (t < 14) { zoom = 1.85; cx = 1190 + 65 * smooth((t - 8) / 3.5); cy = 555; }
  else if (t < 17) { zoom = 1.85 + .15 * fall; cx = leafX + 25; cy = leafY + 30; }
  else if (t < 19.5) { zoom = 2.25 - .1 * smooth((t - 17) / 3); cx = 1020; cy = 790; }
  else { const p = smooth((t - 19.5) / 4); zoom = 1.7 - .68 * p; cx = 1170 - 210 * p; cy = 650 - 110 * p; }
  return {zoom,cx,cy};
}
window.PERFORMANCE = t => {
  const b = birdPose(t), leg = legPose(b,-1), other = companionPose(t), camera = cameraPose(t);
  return { phase: t < 8.5 ? 'call preparation' : t < 12 ? 'call and answer' : t < 20.5 ? 'shared attention' : 'staggered departure',
    actors: [{id:'bird',...b,...leg,facing:1},{id:'perch',x:1320+30*smooth(t-6.5),y:580+3*smooth(t-6.5)},
      {id:'companion',...other,facing:companionFacing(t),visible:t>=8.75,screenX:1100+(other.x-camera.cx)*camera.zoom,screenScale:camera.zoom},
      ...[0,1].map(i=>({id:i===0?'lookout':'latecomer',...ensemblePose(t,i),facing:i===0?1:-1,visible:t>=(i===0?5.25:10.75)}))]};
};
function paintBird(b: ReturnType<typeof birdPose>, facing = 1, density = 1) {
  const contexts = [layer.cw, layer.cd];
  for(const c of contexts) {c.save();c.translate(b.x,b.y);c.scale(facing,1);c.translate(-b.x,-b.y);}
  const part = (stroke: unknown, x: number, y: number, angle = 0, alpha = 1) => {
    for (const c of contexts) { c.save(); c.translate(x, y); c.rotate(angle); }
    draw(layer.ink, stroke, 1, alpha * density); for (const c of contexts) c.restore();
  };
  for (const side of [-1, 1]) {
    const leg = legPose(b, side);
    part(mk([[leg.hx,leg.hy],[leg.kx,leg.ky],[leg.fx,leg.fy],[leg.fx-8,leg.fy+1]], {w:2,tone:TONE.nong,wet:.25,dry:.35,prof:'even',seed:1300+side}),0,0);
  }
  for (const c of contexts) { c.save(); c.translate(b.x,b.y); c.rotate(b.torso); c.scale(1 + (1 - b.squash) * .2,b.squash); }
  part(birdParts.tail,0,0,b.tail);
  part(birdParts.wing,4,-3,-b.wing*.65,.55);
  part(birdParts.body,0,0); part(birdParts.neck,0,0);
  for (const c of contexts) { c.save(); c.rotate(b.wing); }
  part(birdParts.wing,0,0,0,.85); part(birdParts.wingtip,40,15,b.wrist,.7);
  for (const c of contexts) c.restore();
  for (const c of contexts) { c.save(); c.translate(-19,-17); c.rotate(b.head); }
  part(birdParts.head,0,0); part(birdParts.beak,0,0,-b.beak); part(birdParts.beak,0,3,b.beak,.7);
  const eye = layer.cd; eye.fillStyle = '#eee6d4'; eye.beginPath(); eye.arc(-1,-3,2,0,Math.PI*2); eye.fill();
  for (const c of contexts) { c.restore(); c.restore(); c.restore(); }
}

function typography(t: number) {
  const c: CanvasRenderingContext2D = layer.cd;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#171b18'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '64px KaiTi, STKaiti, SimSun, serif';
  [...data.title].forEach((ch, i) => c.fillText(ch, 325, 235 + i * 72));
  c.font = '30px SimSun, Songti SC, serif'; c.fillText(data.inscription, 960, 972);
  const seal: CanvasRenderingContext2D = layer.cc;
  seal.setTransform(1, 0, 0, 1, 0, 0); seal.fillStyle = '#a63b32';
  seal.fillRect(395, 220, 49, 69); seal.clearRect(399, 224, 2, 59);
  seal.fillStyle = '#f3ede0'; seal.font = '23px SimSun, serif'; seal.textAlign = 'center'; seal.textBaseline = 'middle';
  [...data.seal].forEach((ch, i) => seal.fillText(ch, 420, 241 + i * 27));
  void t;
}
window.DUR = 24;
window.SHOTS = [
  { start: 0, end: 4, framing: 'landscape', move: 'parallax drift' },
  { start: 4, end: 8, framing: 'bamboo detail', move: 'rise' },
  { start: 8, end: 14, framing: 'branch close', move: 'lateral track and hold' },
  { start: 14, end: 17, framing: 'falling leaf', move: 'subject follow' },
  { start: 17, end: 19.5, framing: 'water insert', move: 'impact push' },
  { start: 19.5, end: 24, framing: 'landscape return', move: 'pull back' },
];
window.EV = [{ t: 0, type: 'mist' }, { t: 3.5, type: 'silence' }, { t: .25, type: 'brush' }, { t: 4.25, type: 'landing' }, { t: 6.5, type: 'hop' }, { t: 7.5, type: 'landing' }, { t: 8.5, type: 'chirp' }, { t: 10.25, type: 'landing-second' }, { t: 10.75, type: 'answer' }, {t:6.5,type:'flock-land'},{t:10.5,type:'lookout-call'},{t:10.75,type:'yield-hop'},{t:11.75,type:'late-answer'},{t:21,type:'lookout-wings'},{t:22.75,type:'late-wings'}, { t: 22, type: 'follow-wings' }, { t: 20.5, type: 'wings' }, { t: 7.75, type: 'air' }, { t: 8, type: 'leaves' }, { t: 10.5, type: 'wind' }, { t: 12, type: 'silence' }, { t: 14, type: 'fall' }, { t: 17, type: 'water' }, { t: 18.5, type: 'ripple' }, { t: 19.5, type: 'ripple' }, { t: 19.75, type: 'air' }, { t: 20.5, type: 'harmonic' }];
window.TEXTS = () => [
  { id: 'title', text: data.title, x0: 285, y0: 195, x1: 365, y1: 270 + ([...data.title].length - 1) * 72 },
  { id: 'inscription', text: data.inscription, x0: 540, y0: 947, x1: 1380, y1: 999 },
  { id: 'seal', text: data.seal, x0: 395, y0: 220, x1: 444, y1: 289 },
];
window.render = (seconds: number) => {
  const t = Math.max(0, Math.min(24, seconds));
  layer.clear();
  const fall = smooth((t - 14) / 3), travel = smooth((t - 17) / 7);
  const leafX = 1230 - fall * 180 - travel * 310, leafY = 525 + fall * 286;
  const {zoom,cx,cy} = cameraPose(t);
  const camera = (depth: number) => { const z = 1 + (zoom - 1) * depth; layer.xf(z, 1100 - (960 + (cx - 960) * depth) * z, 570 - (540 + (cy - 540) * depth) * z); };
  camera(.25); layer.cw.globalAlpha = .72 + .28 * smooth(t / 4); layer.cw.drawImage(far, 0, 0);
  camera(.6); layer.cw.globalAlpha = smooth((t - 1) / 5); layer.cw.drawImage(near, 0, 0); layer.cw.globalAlpha = 1;
  camera(1);
  drawSeq(layer.ink, stems, smooth(t / 1.5), .88);
  drawSeq(layer.ink, leaves, smooth((t - .5) / 2), .85);
  draw(layer.ink, birdParts.branch, 1, smooth(t / 1.5));
  draw(layer.ink, companionBranch, 1, smooth(t/1.5));
  for(const branch of ensembleBranches) draw(layer.ink,branch,1,smooth(t/1.5));
  if(t>=5.25) paintBird(ensemblePose(t,0),1,.68);
  if(t>=10.75) paintBird(ensemblePose(t,1),-1,.88);
  if(t>=8.75) paintBird(companionPose(t),companionFacing(t),.8);
  if(t>=1.5) paintBird(birdPose(t));
  if (t >= 0) {
    for (const c of [layer.cw, layer.cd]) { c.save(); c.translate(leafX, leafY); c.rotate(-.3 + Math.sin(fall * 6) * .5 + travel * .1 + (t < 12 ? Math.sin(t * 1.8) * .06 : 0)); }
    draw(layer.ink, fallenLeaf, 1, smooth(t / 1.5));
    for (const c of [layer.cw, layer.cd]) c.restore();
    if (t >= 17) {
      for (const c of [layer.cw, layer.cd]) { c.save(); c.translate(leafX, 830); c.scale(1, -.25); c.rotate(-.3 + Math.sin(fall * 6) * .5 + travel * .1); }
      draw(layer.ink, fallenLeaf, 1, .15 * smooth((t - 17) / .4));
      for (const c of [layer.cw, layer.cd]) c.restore();
    }
  }
  for (const onset of [17, 18.5, 19.5]) {
    const age = t - onset;
    if (age <= 0 || age >= 5) continue;
    const radius = 24 + 90 * Math.pow(age, .6), points: number[][] = [];
    for (let i = 0; i <= 44; i++) {
      const a = i / 44 * Math.PI * 1.85;
      points.push([1050 + Math.cos(a) * radius, 811 + Math.sin(a) * radius * .16]);
    }
    draw(layer.ink, mk(points, { w: 1.5, tone: .24, dry: .6, wet: .3, seed: 600 + onset * 10 }), 1, (1 - age / 5) * smooth(age * 3));
  }
  for (const c of [layer.cw, layer.cd]) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out';
    const breathingRoom = c.createRadialGradient(325, 480, 45, 325, 480, 300);
    breathingRoom.addColorStop(0, '#000000ed'); breathingRoom.addColorStop(1, '#00000000');
    c.fillStyle = breathingRoom; c.fillRect(0, 130, 660, 780); c.restore();
  }
  typography(t);
  composite(layer, null, { paperCol: [.954, .938, .895], bleed: 4.4, rim: .9, vig: .12, warm: .1, paper: [0, 0, 1] });
};
window.render(0); window.READY = true;
document.querySelector('#loading')?.remove();
