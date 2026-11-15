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

type Pose = { x: number; y: number; w: number; h: number; angle: number; scale: number };
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
function paperPose(t: number, i: number): Pose {
  const spread = ease((t - 6) / 1.25), edit = ease((t - 12) / 1.25), publish = ease((t - 18) / 1.5);
  const turn = i === 1 ? -Math.PI / 2 * Math.sin(Math.PI * ease((t - 18) / 1.5)) : 0;
  const scale = Math.min(1, 640 / (1300 * Math.abs(Math.sin(turn)) + 610 * Math.abs(Math.cos(turn))));
  const x = mix(960 + (i - 1) * 460, 960 + (i - 1) * 590, spread);
  const y = 560 + (i === 1 ? 0 : 25) * (1 - spread);
  return { x: mix(x, i === 1 ? 960 : 960 + (i - 1) * 720, edit),
    y: mix(y, i === 1 ? 560 : 830, edit), w: i === 1 ? mix(mix(410, 500, spread), 1080 + 220 * publish, edit) : mix(mix(410, 500, spread), 180, edit),
    h: i === 1 ? mix(510, 610, edit) : mix(510, 120, edit), scale, angle: (i - 1) * .045 * (1 - spread) + turn };
}

type GlyphPose = {x: number; y: number; size: number; angle: number};
function openingGlyph(t: number, i: number): GlyphPose {
  const arrive = ease((t-i*.2)/.75), shrink = ease((t-3-i*.125)/.875);
  return {x:mix(510+i*450,96+i*58,shrink)+(i?160:-160)*(1-arrive)*(1-shrink),
    y:mix(720,220,shrink)+(i?100:-110)*(1-arrive)*(1-shrink),size:mix(450,58,shrink)*(.78+.22*arrive),
    angle:(i?.18:-.2)*(1-arrive)*(1-shrink)};
}
function rejectGlyph(t: number, i: number) {
  const progress = ease((t-10.25-i*.125)/.25);
  return {x:i*34,y:-8*Math.sin(Math.PI*progress),size:34,angle:.07*Math.sin(Math.PI*progress)*(i%2?1:-1),progress};
}
function posterGlyph(t: number, i: number): GlyphPose {
  const p = ease((t-19.5-i*.25)/.5);
  return {x:i*260+(i?40:-40)*(1-p),y:0,size:260*(.85+.15*p),angle:0};
}
type StrokePath = number[][];
const glyphCache=new Map<string,{paths:StrokePath[];maskHash:number;missing:boolean}>();
function rasterGlyph(ch: string) {
  const scratch=document.createElement('canvas');scratch.width=scratch.height=128;
  const g=scratch.getContext('2d',{willReadFrequently:true})!;g.font='700 100px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';g.fillText(ch,8,112);
  const rgba=g.getImageData(0,0,128,128).data,mask=new Uint8Array(128*128);let hash=2166136261;
  for(let i=0;i<mask.length;i++){mask[i]=rgba[i*4+3]>96?1:0;hash=Math.imul(hash^mask[i],16777619)>>>0;}
  return {mask,hash};
}
const missingGlyphHash=rasterGlyph('\uFFFF').hash;
function glyph(ch: string) {
  if([...ch].length!==1||/\s/u.test(ch))throw new Error('Glyph extraction requires one visible character');
  const cached=glyphCache.get(ch);if(cached)return cached;
  const {mask,hash}=rasterGlyph(ch),source=mask.slice(),N=128;
  // Zhang-Suen thinning preserves connectivity; graph branches are not semantic pen strokes.
  for(let iteration=0;iteration<64;iteration++) {
    let changed=0;
    for(let pass=0;pass<2;pass++) {
      const remove:number[]=[];
      for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++) {
        const i=y*N+x;if(!mask[i])continue;
        const p=[mask[i-N],mask[i-N+1],mask[i+1],mask[i+N+1],mask[i+N],mask[i+N-1],mask[i-1],mask[i-N-1]];
        const count=p.reduce((a,b)=>a+b,0),turns=p.reduce((a,b,k)=>a+Number(!b&&p[(k+1)%8]===1),0);
        if(count<2||count>6||turns!==1)continue;
        if(pass===0?p[0]*p[2]*p[4]||p[2]*p[4]*p[6]:p[0]*p[2]*p[6]||p[0]*p[4]*p[6])continue;
        remove.push(i);
      }
      for(const i of remove)mask[i]=0;changed+=remove.length;
    }
    if(!changed)break;
  }
  const offsets=[-N,-N+1,1,N+1,N,N-1,-1,-N-1];
  const neighbors=(i:number)=>offsets.map(d=>i+d).filter(j=>j>=0&&j<mask.length&&mask[j]&&Math.abs(j%N-i%N)<=1);
  const pixels=Array.from(mask.keys()).filter(i=>mask[i]),visited=new Set<string>(),paths:StrokePath[]=[];
  const key=(a:number,b:number)=>a<b?`${a}:${b}`:`${b}:${a}`;
  const walk=(start:number,next:number)=>{const path=[start];let prev=start,current=next;
    for(let guard=0;guard<mask.length;guard++) {
      visited.add(key(prev,current));path.push(current);const choices=neighbors(current);
      if(current===start||choices.length!==2)break;
      const candidate=choices.find(p=>p!==prev)!;if(visited.has(key(current,candidate)))break;prev=current;current=candidate;
    }
    if(path.length>=3)paths.push(path.map(i=>[i%N-8,Math.floor(i/N)-12]));
  };
  for(const start of [...pixels.filter(i=>neighbors(i).length!==2),...pixels])for(const next of neighbors(start))if(!visited.has(key(start,next)))walk(start,next);
  if(!paths.length&&source.some(v=>v))paths.push(pixels.map(i=>[i%N-8,Math.floor(i/N)-12]));
  const result={paths:paths.filter(p=>p.length>=2),maskHash:hash,missing:hash===missingGlyphHash||!source.some(v=>v)};glyphCache.set(ch,result);return result;
}
function resample(path: StrokePath,count=25):StrokePath {
  if(path.length<2||path.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v))))throw new Error('A finite path needs at least two points');
  const lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
  return Array.from({length:count},(_,i)=>{const at=lengths.at(-1)!*i/(count-1);let k=1;while(k<lengths.length-1&&lengths[k]<at)k++;
    const q=(at-lengths[k-1])/Math.max(1e-9,lengths[k]-lengths[k-1]);return [mix(path[k-1][0],path[k][0],q),mix(path[k-1][1],path[k][1],q)];});
}
function morphPath(source:StrokePath,target:StrokePath,progress:number):StrokePath {
  if(!Number.isFinite(progress))throw new Error('Morph progress must be finite');
  const a=resample(source),b=resample(target),p=Math.max(0,Math.min(1,progress));
  return a.map((v,i)=>[mix(v[0],b[i][0],p),mix(v[1],b[i][1],p)]);
}
window.GLYPH=ch=>glyph(ch);
window.MORPH_PATH=morphPath;
function strokePose(t: number, character: string, index: number, poster: boolean, glyphIndex: number) {
  const onset=(poster?19.5:0)+glyphIndex*.125, settle=ease((t-onset)/1.125);
  const paths=glyph(character).paths,progress=ease((t-onset-index/Math.max(1,paths.length-1)*.4)/.5), source=resample(paths[index],17);
  const points=Array.from({length:17},(_,k)=>{
    const u=k/16, along=u*(source.length-1), at=Math.min(source.length-2,Math.floor(along)), q=along-at;
    const x=mix(source[at][0],source[at+1][0],q),y=mix(source[at][1],source[at+1][1],q);
    return [x+((index%3-1)*18+12*Math.sin(Math.PI*u)),y+((index%2?1:-1)*14*Math.sin(Math.PI*u)+8*(u-.5))];
  });
  return {id:`${poster?'poster':'opening'}-${glyphIndex}-stroke-${index}`,progress,deformation:1-settle,points:morphPath(points,source,settle)};
}
window.STROKES=t=>['判断','有据'].flatMap((word,section)=>[...word].flatMap((ch,g)=>glyph(ch).paths.map((_,i)=>strokePose(t,ch,i,Boolean(section),g))));
function strokeGlyph(id: string, ch: string, p: GlyphPose, color: string, t: number, poster: boolean, glyphIndex: number) {
  const matrix=ctx.getTransform(), all: DOMPoint[]=[];
  const onset=(poster?19.5:0)+glyphIndex*.125, finish=ease((t-onset-.75)/.375);
  ctx.save();ctx.globalAlpha=1-finish;ctx.strokeStyle=color;ctx.lineWidth=p.size*.045;ctx.lineCap='round';ctx.lineJoin='round';
  glyph(ch).paths.forEach((_,i)=>{
    const stroke=strokePose(t,ch,i,poster,glyphIndex), points=stroke.points.map(([x,y])=>[x*p.size/100,(y/100-1)*p.size]);
    for(const [x,y] of points) for(const [dx,dy] of [[-1,-1],[1,1]]) all.push(matrix.transformPoint({x:x+dx*ctx.lineWidth/2,y:y+dy*ctx.lineWidth/2}));
    const end=stroke.progress*16;ctx.beginPath();ctx.moveTo(...points[0] as [number,number]);
    for(let k=1;k<=Math.floor(end);k++)ctx.lineTo(...points[k] as [number,number]);
    if(end<16){const k=Math.floor(end),q=end-k;ctx.lineTo(mix(points[k][0],points[k+1][0],q),mix(points[k][1],points[k+1][1],q));}
    if(stroke.progress>0)ctx.stroke();
  });
  ctx.restore();
  ctx.save();ctx.globalAlpha=finish;text(id,ch,0,0,p.size,color,700);ctx.restore();
  const native=boxes.pop()!;
  all.push(new DOMPoint(native.x0,native.y0),new DOMPoint(native.x1,native.y1));
  boxes.push({id,text:ch,x0:Math.min(...all.map(p=>p.x)),y0:Math.min(...all.map(p=>p.y)),x1:Math.max(...all.map(p=>p.x)),y1:Math.max(...all.map(p=>p.y))});
}
function glyphRun(id: string, value: string, poses: GlyphPose[], color: string, weight = 600, time = 0) {
  const start = boxes.length;
  [...value].forEach((ch,i)=>{
    const p=poses[i];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
    if(id==='opening-word'||id==='poster-word') strokeGlyph(`${id}-${i}`,ch,p,color,time,id==='poster-word',i);
    else text(`${id}-${i}`,ch,0,0,p.size,color,weight);ctx.restore();
  });
  const glyphBoxes=boxes.splice(start);
  boxes.push({id,text:value,x0:Math.min(...glyphBoxes.map(b=>b.x0)),y0:Math.min(...glyphBoxes.map(b=>b.y0)),
    x1:Math.max(...glyphBoxes.map(b=>b.x1)),y1:Math.max(...glyphBoxes.map(b=>b.y1))});
}
window.PERFORMANCE = t => ({actors:[...[0,1,2].map(i=>({id:`paper-${i}`,...paperPose(t,i)})),
  ...[0,1].map(i=>({id:`opening-${i}`,...openingGlyph(t,i)})),
  ...Array.from({length:6},(_,i)=>({id:`reject-${i}`,...rejectGlyph(t,i)})),
  ...[0,1].map(i=>({id:`poster-${i}`,...posterGlyph(t,i)}))],phase:t<6?'glyph assembly':t<12?'character rejection':t<18?'edit':'glyph resolution'});
window.DUR = 24;
window.SHOTS = [
  { start: 0, end: 6, framing: 'desk spread', move: 'fan settle' },
  { start: 6, end: 12, framing: 'source grid', move: 'spread and trace' },
  { start: 12, end: 18, framing: 'edited page', move: 'paper expansion' },
  { start: 18, end: 24, framing: 'publication wall', move: 'layered reveal' },
];
window.EV = [{t:0,type:'type-impact'},{t:.25,type:'stroke-draw'},{t:.75,type:'stroke-bind'},{t:19.75,type:'stroke-draw'},{t:20.5,type:'stroke-bind'},{t:4,type:'page'},{t:18,type:'type-flip'},{t:5.5,type:'silence'},{t:6,type:'page'},{t:7.25,type:'align'},{t:9.5,type:'marker'},{t:10.25,type:'reject'},{t:10.5,type:'glyph-cut'},{t:10.75,type:'glyph-cut'},{t:20,type:'glyph-land'},{t:20.25,type:'glyph-land'},{t:12,type:'page'},{t:13.25,type:'edit'},{t:17,type:'silence'},{t:18,type:'stack'},{t:19.5,type:'stamp'}];
window.render = seconds => {
  const t = Math.max(0, Math.min(24, seconds)); boxes = []; ctx.setTransform(1,0,0,1,0,0);
  rect(0,0,1920,1080,C.paper); rule(132); rule(964);
  text('brand', data.seal, 96, 95, 30, C.ink, 600); text('title', data.title, 550, 95, 30);
  text('disclosure', '虚构编辑练习', 1530, 95, 24, C.muted);
  const phase = Math.min(3, Math.floor(t / 6));
  if (t >= 6) text(`heading-${phase}`, ['一条判断，从哪里来？','把来源与推断分开','让证据留下来','观点，要有来处。'][phase],96,220,58,C.ink,600);
  if (t >= 18) {
    const q = ease((t-18)/1.5);
    for (let i=0;i<12;i++) {
      const x=150+(i%6)*278, y=300+Math.floor(i/6)*340;
      ctx.save();ctx.translate(x,y);ctx.rotate((i%2?1:-1)*.035*q);
      rect(0,0,230,280,'#e4dfd3');rect(25,40,120*q,8,C.rule);rect(25,70,175*q,5,C.rule);ctx.restore();
    }
  }
  // The selected sheet remains the same object; side notes retain their identity in the tray.
  for (const i of (t >= 4 ? [0,2,1] : [])) {
    const p=paperPose(t,i); ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(p.scale,p.scale);
    rect(-p.w/2+7,-p.h/2+9,p.w,p.h,'#d9d3c7');rect(-p.w/2,-p.h/2,p.w,p.h,'#faf8f1');
    rect(-p.w/2,-p.h/2,6,p.h,i===1?C.accent:C.rule);
    const x=-p.w/2+32,y=-p.h/2;
    if(t<12) {
      text(`source-${i}`,['观察记录','现场访谈','未经核实'][i],x,y+66,30,i===2?C.accent:C.muted,600);
      const lines=[['雨停了','人走进来'],['有人喜欢安静','有人更爱热闹'],['所有人都喜欢','只是一个猜测']][i];
      lines.forEach((v,j)=>{
        if(i===2&&j===0) glyphRun(`evidence-${i}-${j}`,v,[...v].map((_,k)=>{const p=rejectGlyph(t,k);return {...p,x:x+p.x,y:y+180+p.y};}),C.ink,400);
        else text(`evidence-${i}-${j}`,v,x,y+180+j*66,34);
      });
      for(let k=0;k<3;k++)rect(x,y+350+k*24,p.w-90-(k%2)*70,5,C.rule);
      if(i===2&&t>=10.25) for(let k=0;k<6;k++) rect(x+k*34,y+169,34*rejectGlyph(t,k).progress,4,C.accent);
      if(i===1&&t>=7.25)rect(x,y+260,(p.w-64)*ease((t-7.25)/1),3,C.accent);
    } else if(i===1&&t>=13.25) {
      text('verified','可以确认',x,y+76,28,C.accent,600);
      if(t>=18) glyphRun('poster-word','有据',[0,1].map(i=>{const g=posterGlyph(t,i);return {...g,x:x+135+g.x,y:y+330};}),C.accent,700,t);
      text('claim','同一处，也有不同感受。',x,t<18?y+215:y+430,t<18?64:44,C.ink,600);
      text('qualification','两条访谈，不能代表所有人。',x,t<18?y+303:y+490,t<18?34:28,C.muted);
      if(t<18) rect(x,y+355,p.w-100,1,C.rule);
      text('source-final','来源：观察记录与现场访谈',x,t<18?y+410:y+550,t<18?28:24,C.muted);
      if(t>=19.5) { const q=ease((t-19.5)/.25);ctx.save();ctx.translate(p.w/2-125,p.h/2-83);ctx.rotate(-.08);ctx.strokeStyle=C.accent;ctx.lineWidth=3;ctx.strokeRect(-53,-34,106,62);text('approved','定稿',-34,10,34,C.accent,600);ctx.restore();rect(x,y+444,610*q,4,C.accent); }
    }
    ctx.restore();
  }
  if(t>=7.25&&t<12) {
    const q=ease((t-7.25)/2), end=370+590*q;
    ctx.strokeStyle=C.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(370,869);ctx.bezierCurveTo(370,927,end,927,end,869);ctx.stroke();
    ctx.fillStyle=C.accent;ctx.beginPath();ctx.arc(end,869,6,0,Math.PI*2);ctx.fill();
  }
  if(t<6) {
    glyphRun('opening-word','判断',[0,1].map(i=>openingGlyph(t,i)),C.ink,700,t);
    if(t<3) text('opening-note','先看材料',96,880,38,C.accent,600);
  }
  text('inscription',data.inscription,96,1020,27,C.muted);
};
window.TEXTS = t => {window.render(t);return boxes.filter(b=>!(b.id==='opening-word'&&t<1.25)&&!(b.id==='poster-word'&&t<20.75));};
window.render(0);window.READY=true;document.querySelector('#loading')?.remove();
export {};
