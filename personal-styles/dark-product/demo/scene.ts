const canvas = document.querySelector('canvas')!;
canvas.width = 1920; canvas.height = 1080;
const ctx = canvas.getContext('2d')!;
const data = await fetch('./content.json').then(r => { if (!r.ok) throw new Error('Missing content'); return r.json(); });
await document.fonts.ready;
const C = { ink: '#e9edf5', muted: '#8e99b0', accent: '#a4b2ff', stage: '#090c13', surface: '#151b28' };
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
let boxes: Array<{ id: string; text: string; x0: number; y0: number; x1: number; y1: number }> = [];
function text(id: string, value: string, x: number, y: number, size: number, color = C.ink, weight = 400) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`; ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y); const m = ctx.measureText(value);
  const matrix = ctx.getTransform();
  const points = [[x, y - size], [x + m.width, y - size], [x, y + size * .2], [x + m.width, y + size * .2]].map(([px, py]) => matrix.transformPoint({ x: px, y: py }));
  boxes.push({ id, text: value, x0: Math.min(...points.map(p => p.x)), y0: Math.min(...points.map(p => p.y)), x1: Math.max(...points.map(p => p.x)), y1: Math.max(...points.map(p => p.y)) });
}
function panel(x: number, y: number, w: number, h: number, r = 16, color = C.surface) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = '#30394c'; ctx.lineWidth = 1; ctx.stroke();
}
function line(x: number, y: number, w: number, color = '#384256', h = 6) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function stage() {
  ctx.fillStyle = C.stage; ctx.fillRect(0, 0, 1920, 1080);
  const glow = ctx.createRadialGradient(1110, 300, 20, 1110, 300, 980); glow.addColorStop(0, '#1b2440'); glow.addColorStop(1, '#090c13'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1920, 1080);
  ctx.strokeStyle = '#ffffff07'; ctx.lineWidth = 1;
  for (let x = 0; x <= 1920; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke(); }
  for (let y = 0; y <= 1080; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke(); }
}
function card(x: number, y: number, w: number, h: number, i: number, accent = false) {
  panel(x, y, w, h, 12, i % 2 ? '#161d2b' : '#1b2333');
  const pad = Math.min(20, w * .1);
  line(x + pad, y + h * .2, w * .17, accent ? C.accent : '#74819b', Math.min(5,h*.07));
  line(x + pad, y + h * .46, w * .67, '#384256', Math.min(6,h*.08)); line(x + pad, y + h * .68, w * .43, '#2d3648', Math.min(5,h*.07));
}

type Pose = {x:number;y:number;w:number;h:number;z:number};
const smooth=(x:number)=>{const p=clamp(x);return p*p*(3-2*p);};
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;

const CARD_COUNT = 108;
function cloud(t: number, i: number): Pose {
  const q = smooth(Math.min(t,5)/5), depth = Math.floor(i/27);
  const a = (i%27)/27*Math.PI*2 + q*1.1 + depth*.19;
  const z = 700 + depth*260 + Math.sin(a)*220, scale = 700/z;
  return {x:960+Math.cos(a)*(430+depth*90)*scale,y:590+(Math.sin(a*3)*110+((i%3)-1)*30)*scale,w:160*scale,h:96*scale,z};
}
function recordPose(t: number, i: number): Pose {
  const start = cloud(Math.min(t,5),i), route = smooth((t-6-(i%9)*.125)/1.75);
  const inspect = smooth((t-12)/1.25), resolve = smooth((t-18-(i%6)*.125)/2.25);
  const gx = 160+(i%9)*115, gy = 320+Math.floor(i/9)*47;
  const bankX = (i%4<2?145:1655)+(i%2)*100, bankY = 320+Math.floor(i/4)*20;
  const x = lerp(lerp(start.x,gx,route),bankX,inspect), y = lerp(lerp(start.y,gy,route),bankY,inspect);
  return {x:lerp(x,235+(i%12)*132,resolve),y:lerp(y,325+Math.floor(i/12)*67,resolve)-Math.sin(resolve*Math.PI)*(i%2?35:-35),
    w:lerp(lerp(lerp(start.w,100,route),80,inspect),112,resolve),h:lerp(lerp(lerp(start.h,36,route),16,inspect),48,resolve),
    z:lerp(lerp(start.z,650+Math.floor(i/9)*5,route),700+(i%12)*5,resolve)};
}
function hero(t:number):Pose {
  const start=cloud(5,4),p=smooth((t-6)/2.5),open=smooth((t-12)/.75),close=smooth((t-18)/1.5);
  if(t<6)return cloud(t,4);
  const x=lerp(start.x,1505,p),y=lerp(start.y,560,p)-Math.sin(p*Math.PI)*120;
  return {x:lerp(lerp(x,960,open),960,close),y:lerp(lerp(y,555,open),570,close),w:lerp(lerp(start.w,360,p),1120,open)*(1-.45*close),h:lerp(lerp(start.h,230,p),570,open)*(1-.45*close),z:200};
}
function pointer(t:number) {
  const h=hero(t),picked=t>=4.5&&t<8.5;
  if(t>=4.5&&t<12)return {x:h.x+30,y:h.y-20,held:picked};
  if(t<4.5) {
    const q=smooth((t-3)/1.5),wrong=cloud(t,2);
    return {x:lerp(wrong.x, h.x+30,q),y:lerp(wrong.y,h.y-20,q)-Math.sin(q*Math.PI)*100,held:false};
  }
  const q=smooth((t-12)/1.5);
  return {x:lerp(1535,1360,q),y:lerp(540,735,q)-Math.sin(q*Math.PI)*70,held:false};
}
window.PERFORMANCE=t=>({phase:t<4.5?'explore':t<6?'select':t<8.5?'drag':t<12?'stored':t<18?'inspect':'resolve',actors:[{id:'task-4',...hero(t)},{id:'pointer',...pointer(t)},...Array.from({length:CARD_COUNT},(_,i)=>i).filter(i=>i!==4).map(i=>({id:`cloud-${i}`,...recordPose(t,i)}))]});
window.DUR=24;
window.SHOTS=[{start:0,end:6,framing:'depth cloud',move:'orbit and choose'},{start:6,end:12,framing:'library',move:'drag across space'},{start:12,end:18,framing:'source detail',move:'expand selected object'},{start:18,end:24,framing:'workspace',move:'pull back to relationships'}];
window.EV=[{t:0,type:'pulse'},{t:2.5,type:'hover'},{t:4.5,type:'grab'},{t:5,type:'silence'},{t:6,type:'sweep'},{t:6.5,type:'route'},{t:7,type:'route'},{t:7.5,type:'route'},{t:8.5,type:'drop'},{t:11.75,type:'sweep'},{t:13.5,type:'click'},{t:14,type:'search'},{t:17.25,type:'silence'},{t:18,type:'collapse'},{t:19.5,type:'lock'}];
window.render=seconds=>{
  const t=Math.max(0,Math.min(24,seconds));boxes=[];ctx.setTransform(1,0,0,1,0,0);stage();
  text('brand',data.seal,96,94,30,C.accent,600);text('title',data.title,550,94,30);
  text('disclosure','原创概念演示',1530,94,24,C.muted);
  const phase=Math.min(3,Math.floor(t/6));
  text(`heading-${phase}`,['想法很多，线索在哪？','选中它，放回资料库','找到内容，也找到来源','每个想法，都有来处。'][phase],96,210,56,C.ink,600);
  if(t>=6&&t<12){panel(1275,310,470,530,22,'#111722');text('library','资料库',1315,370,32,C.accent);}

  const others = Array.from({length:CARD_COUNT},(_,i)=>i).filter(i=>i!==4).map(i=>({i,...recordPose(t,i)})).sort((a,b)=>b.z-a.z);
  for (const c of others) {
    ctx.save();ctx.globalAlpha=1-.75*smooth((t-12)/1.25)+.3*smooth((t-18)/2.5);
    card(c.x-c.w/2,c.y-c.h/2,c.w,c.h,c.i);ctx.restore();
  }
  const h=hero(t);panel(h.x-h.w/2,h.y-h.h/2,h.w,h.h,18,'#1d2840');
  ctx.strokeStyle=C.accent;ctx.lineWidth=t>=4.5?3:1;ctx.strokeRect(h.x-h.w/2+6,h.y-h.h/2+6,h.w-12,h.h-12);
  if(t>=12.75){
    const scale=h.w/1120;ctx.save();ctx.translate(h.x-h.w/2,h.y-h.h/2);ctx.scale(scale,scale);
    text('task-name','研究札记',42,65,40,C.accent,600);
    text('task-title','把灵感整理成提案',42,155,54,C.ink,600);
    text('task-source','来源：自己的阅读与观察',42,230,40,C.muted);
    line(42,275,1036,'#36435e',1);
    if(t>=14){text('result','已定位 · 来源完整',42,365,40,C.accent);line(42,397,430*ease((t-14)/.7),C.accent,3);}
    panel(850,415,220,98,12,t>=13.5?'#344665':'#263751');text('search','检索',905,478,40);
    ctx.restore();
  }else{
    // Abstract lines carry identity before the close-up, without unreadable moving labels.
    line(h.x-h.w/2+24,h.y-h.h/2+30,h.w*.2,C.accent,6);
    line(h.x-h.w/2+24,h.y-h.h/2+60,h.w*.68);line(h.x-h.w/2+24,h.y-h.h/2+84,h.w*.43);
  }
  if(t>=18){
    const q=smooth((t-18)/1.5);ctx.strokeStyle='#a4b2ff88';ctx.lineWidth=2;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(960+side*h.w/2,570);ctx.bezierCurveTo(960+side*610,570,960+side*610,790,960+side*700,790);ctx.stroke();ctx.beginPath();ctx.arc(960+side*700,790,8*q,0,Math.PI*2);ctx.stroke();}
  }
  if(t>=2&&t<18){const p=pointer(t);ctx.save();ctx.translate(p.x,p.y);const press=1-.18*Math.sin(Math.PI*clamp((t-13.5)/.25));ctx.scale(press,press);ctx.fillStyle=p.held?C.accent:'#ffffff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1,34);ctx.lineTo(11,26);ctx.lineTo(20,42);ctx.lineTo(28,37);ctx.lineTo(19,21);ctx.lineTo(32,18);ctx.closePath();ctx.fill();ctx.restore();
    if(t>=4.5&&t<4.9||t>=8.5&&t<8.9||t>=13.5&&t<13.9){const a=t>=13.5?t-13.5:t>=8.5?t-8.5:t-4.5;ctx.strokeStyle=C.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,12+a*75,0,Math.PI*2);ctx.stroke();}
  }
  text('inscription',data.inscription,96,1015,27,C.muted);
};
window.TEXTS=t=>{window.render(t);return boxes;};window.render(0);window.READY=true;document.querySelector('#loading')?.remove();
export {};
