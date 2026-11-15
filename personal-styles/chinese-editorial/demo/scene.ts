const canvas = document.querySelector('canvas')!;
canvas.width = 1920; canvas.height = 1080;
const ctx = canvas.getContext('2d')!;
const data = await fetch('./content.json').then(r => { if (!r.ok) throw new Error('Missing content'); return r.json(); });
await document.fonts.ready;
const C = { paper: '#f2eee5', ink: '#20231f', muted: '#77776e', rule: '#cfcec4', accent: '#b6382d' };
const ease = (x: number) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
type Box = { id: string; text: string; x0: number; y0: number; x1: number; y1: number };
let boxes: Box[] = [];
function text(id: string, value: string, x: number, y: number, size: number, color = C.ink, weight = 400) {
  ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`;
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(value, x, y);
  const m = ctx.measureText(value);
  const matrix = ctx.getTransform();
  const corners = [[x, y - size], [x + m.width, y - size], [x, y + size * .2], [x + m.width, y + size * .2]].map(([px, py]) => matrix.transformPoint({ x: px, y: py }));
  boxes.push({ id, text: value, x0: Math.min(...corners.map(p => p.x)), y0: Math.min(...corners.map(p => p.y)), x1: Math.max(...corners.map(p => p.x)), y1: Math.max(...corners.map(p => p.y)) });
}
function rect(x: number, y: number, w: number, h: number, color: string) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function rule(y: number, start = 96, end = 1824) { rect(start, y, end - start, 1, C.rule); }

type Pose = { x: number; y: number; w: number; h: number; angle: number };
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
function paperPose(t: number, i: number): Pose {
  const spread = ease((t - 6) / 1.25), edit = ease((t - 12) / 1.25), publish = ease((t - 18) / 1.5);
  const x = mix(960 + (i - 1) * 460, 960 + (i - 1) * 590, spread);
  const y = 560 + (i === 1 ? 0 : 25) * (1 - spread);
  return { x: mix(x, i === 1 ? 960 : 960 + (i - 1) * 720, edit),
    y: mix(y, i === 1 ? 560 : 830, edit), w: i === 1 ? mix(mix(410, 500, spread), 1080 + 220 * publish, edit) : mix(mix(410, 500, spread), 180, edit),
    h: i === 1 ? mix(510, 610, edit) : mix(510, 120, edit), angle: (i - 1) * .045 * (1 - spread) };
}
window.PERFORMANCE = t => ({ actors: [0, 1, 2].map(i => ({ id: `paper-${i}`, ...paperPose(t, i) })), phase: t < 6 ? 'collect' : t < 12 ? 'verify' : t < 18 ? 'edit' : 'publish' });
window.DUR = 24;
window.SHOTS = [
  { start: 0, end: 6, framing: 'desk spread', move: 'fan settle' },
  { start: 6, end: 12, framing: 'source grid', move: 'spread and trace' },
  { start: 12, end: 18, framing: 'edited page', move: 'paper expansion' },
  { start: 18, end: 24, framing: 'publication wall', move: 'layered reveal' },
];
window.EV = [{t:0,type:'page'},{t:5.5,type:'silence'},{t:6,type:'page'},{t:7.25,type:'align'},{t:9.5,type:'marker'},{t:10.25,type:'reject'},{t:12,type:'page'},{t:13.25,type:'edit'},{t:17,type:'silence'},{t:18,type:'stack'},{t:19.5,type:'stamp'}];
window.render = seconds => {
  const t = Math.max(0, Math.min(24, seconds)); boxes = []; ctx.setTransform(1,0,0,1,0,0);
  rect(0,0,1920,1080,C.paper); rule(132); rule(964);
  text('brand', data.seal, 96, 95, 30, C.ink, 600); text('title', data.title, 550, 95, 30);
  text('disclosure', '虚构编辑练习', 1530, 95, 24, C.muted);
  const phase = Math.min(3, Math.floor(t / 6));
  text(`heading-${phase}`, ['一条判断，从哪里来？','把来源与推断分开','让证据留下来','观点，要有来处。'][phase],96,220,58,C.ink,600);
  if (t >= 18) {
    const q = ease((t-18)/1.5);
    for (let i=0;i<12;i++) {
      const x=150+(i%6)*278, y=300+Math.floor(i/6)*340;
      ctx.save();ctx.translate(x,y);ctx.rotate((i%2?1:-1)*.035*q);
      rect(0,0,230,280,'#e4dfd3');rect(25,40,120*q,8,C.rule);rect(25,70,175*q,5,C.rule);ctx.restore();
    }
  }
  // The selected sheet remains the same object; side notes retain their identity in the tray.
  for (const i of [0,2,1]) {
    const p=paperPose(t,i); ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
    rect(-p.w/2+7,-p.h/2+9,p.w,p.h,'#d9d3c7');rect(-p.w/2,-p.h/2,p.w,p.h,'#faf8f1');
    rect(-p.w/2,-p.h/2,6,p.h,i===1?C.accent:C.rule);
    const x=-p.w/2+32,y=-p.h/2;
    if(t<12) {
      text(`source-${i}`,['观察记录','现场访谈','未经核实'][i],x,y+66,30,i===2?C.accent:C.muted,600);
      const lines=[['雨停了','人走进来'],['有人喜欢安静','有人更爱热闹'],['所有人都喜欢','只是一个猜测']][i];
      lines.forEach((v,j)=>text(`evidence-${i}-${j}`,v,x,y+180+j*66,34));
      for(let k=0;k<3;k++)rect(x,y+350+k*24,p.w-90-(k%2)*70,5,C.rule);
      if(i===2&&t>=10.25)rect(x,y+169,(p.w-64)*ease((t-10.25)/.5),4,C.accent);
      if(i===1&&t>=7.25)rect(x,y+260,(p.w-64)*ease((t-7.25)/1),3,C.accent);
    } else if(i===1&&t>=13.25) {
      text('verified','可以确认',x,y+76,28,C.accent,600);
      text('claim','同一处，也有不同感受。',x,y+215,64,C.ink,600);
      text('qualification','两条访谈，不能代表所有人。',x,y+303,34,C.muted);
      rect(x,y+355,p.w-100,1,C.rule);
      text('source-final','来源：观察记录与现场访谈',x,y+410,28,C.muted);
      if(t>=19.5) { const q=ease((t-19.5)/.25);ctx.save();ctx.translate(p.w/2-125,p.h/2-83);ctx.rotate(-.08);ctx.strokeStyle=C.accent;ctx.lineWidth=3;ctx.strokeRect(-53,-34,106,62);text('approved','定稿',-34,10,34,C.accent,600);ctx.restore();rect(x,y+243,610*q,4,C.accent); }
    }
    ctx.restore();
  }
  if(t>=7.25&&t<12) {
    const q=ease((t-7.25)/2), end=370+590*q;
    ctx.strokeStyle=C.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(370,869);ctx.bezierCurveTo(370,927,end,927,end,869);ctx.stroke();
    ctx.fillStyle=C.accent;ctx.beginPath();ctx.arc(end,869,6,0,Math.PI*2);ctx.fill();
  }
  text('inscription',data.inscription,96,1020,27,C.muted);
};
window.TEXTS = t => {window.render(t);return boxes;};
window.render(0);window.READY=true;document.querySelector('#loading')?.remove();
export {};
