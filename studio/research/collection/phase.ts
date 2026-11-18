export const length=30;
export const title='同一组频率，为什么能画出不同的花';
export const folder='phase-flowers';
const tau=2*Math.PI;
const baseHz=110;
const phaseOffset=Math.PI/4;
const green='#72ff9f';
const dim='#5ab878';
const amber='#ffc769';
const hot='#e6ffed';
const clamp=(t:number)=>Math.max(0,Math.min(1,t));
const ease=(t:number)=>{const p=clamp(t);return p*p*(3-2*p);};
export function point(phi:number,phase:number):[number,number]{
  return [Math.sin(2*phi),Math.sin(3*phi+phase)];
}
export const phaseAt=(t:number)=>phaseOffset*ease((t-14)/5);

export function picture(g:CanvasRenderingContext2D,t:number){
  function type(s:string,x:number,y:number,size=30,colour=green,font='Consolas'){
    g.font=`${size}px ${font}`;g.textBaseline='top';g.fillStyle=colour;g.fillText(s,x,y);
  }
  function draw(points:[number,number][],colour:string,width:number,glow=0){
    if(points.length<2)return;
    g.beginPath();g.moveTo(...points[0]);
    for(const p of points.slice(1))g.lineTo(...p);
    if(glow>0){
      g.strokeStyle=colour;g.lineWidth=width+9;
      g.globalAlpha=.105*glow;g.stroke();
      g.lineWidth=width+3;g.globalAlpha=.22*glow;g.stroke();
    }
    g.globalAlpha=1;g.strokeStyle=colour;g.lineWidth=width;g.stroke();
  }
  function spot(x:number,y:number,r:number,colour:string){
    g.fillStyle=colour;g.beginPath();g.arc(x,y,r,0,tau);g.fill();
  }
  function screen(cx:number,cy:number,step:number,n:number){
    g.fillStyle='#285c3a';
    for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++)g.fillRect(cx+i*step,cy+j*step,2,2);
    draw([[cx-n*step,cy],[cx+n*step,cy]],'#245438',1);
    draw([[cx,cy-n*step],[cx,cy+n*step]],'#245438',1);
  }
  function curve(cx:number,cy:number,amplitude:number,phase:number,phi:number,progress=1){
    const trace:[number,number][]=[];
    for(let i=0;i<=Math.round(560*progress);i++){
      const [x,y]=point(i/560*tau,phase);
      trace.push([cx+amplitude*x,cy-amplitude*y]);
    }
    draw(trace,green,2.35,1);
    for(let age=7;age>=0;age--){
      const [x,y]=point(phi-age*.024,phase);
      spot(cx+amplitude*x,cy-amplitude*y,age===0?5.5:3,age===0?hot:age<3?green:'#2b8651');
    }
  }
  function wave(cx:number,cy:number,c:'X'|'Y',phase:number,phi:number){
    draw([[cx,cy],[cx+571,cy]],'#286341',1);
    const trace:[number,number][]=[];
    for(let i=0;i<=240;i++){
      const xy=point(i/240*tau,phase);
      trace.push([cx+i/240*571,cy-69*xy[c==='X'?0:1]]);
    }
    draw(trace,green,2,1);
    const k=(phi%tau+tau)%tau;
    const q=point(k,phase);
    spot(cx+k/tau*571,cy-69*q[c==='X'?0:1],4.7,hot);
    type(c+'   '+(c==='X'?baseHz*2:baseHz*3)+' Hz',cx,cy-117,33);
  }
  function caption(s:string){
    g.fillStyle='#010905';g.fillRect(92,911,1736,100);
    g.fillStyle=green;g.fillRect(97,931,3,43);
    type(s,121,924,41,hot,'SimSun');
  }
  g.fillStyle='#020805';g.fillRect(0,0,1920,1080);
  const glass=g.createRadialGradient(960,490,60,960,490,1020);
  glass.addColorStop(0,'#12271a');glass.addColorStop(1,'#020805');
  g.fillStyle=glass;g.fillRect(0,0,1920,1080);
  type('X–Y  /  2:3',96,58,32);type('计算信号 · 慢速扫描',1435,59,27,dim,'SimSun');
  draw([[96,126],[1824,126]],'#245438',2);
  const phase=phaseAt(t);
  const phi=tau*t*.28;
  if(t<4){
    const p=ease(t/1.1);
    screen(965,506,54,7);
    curve(965,506,326,phaseOffset,tau*p,p);
    caption('两条正弦波，能画出什么？');
    return;
  }
  if(t<22.5){
    const zoom=1+.10*ease((t-13)/4);
    const cx=1240,cy=519;
    screen(cx,cy,51,6);
    wave(105,390,'X',phase,phi);
    wave(105,681,'Y',phase,phi);
    const [px,py]=point(phi,phase);
    if(t<14){
      draw([[cx+292*zoom*px,cy],[cx+292*zoom*px,cy-292*zoom*py]],'#396c48',2);
      draw([[cx,cy-292*zoom*py],[cx+292*zoom*px,cy-292*zoom*py]],'#396c48',2);
    }
    curve(cx,cy,292*zoom,phase,phi);
    if(t>=11.5){
      const phaseDegree=Math.round(phase*180/Math.PI);
      type('Y 相位　'+String(phaseDegree).padStart(2,'0')+'°',112,794,32,amber,'Microsoft YaHei');
      if(t>=14) draw([[111,852],[111+571*phase/phaseOffset,852]],amber,3);
    }
    const text=t<8.5?'第一条波控制左右，第二条控制上下。':
      t<13?'两条波的频率保持在 220 和 330 Hz。':
      t<19?'现在，只挪动第二条波的起点。':'图形已经变了。频率比还是 2:3。';
    caption(text);return;
  }
  for(let i=0;i<2;i++){
    const cx=530+860*i,cy=522;
    const compared=i*phaseOffset;
    screen(cx,cy,48,6);
    curve(cx,cy,235,compared,tau*.16);
    type('相位 '+Math.round(compared*180/Math.PI)+'°',cx-254,181,43,amber,'Microsoft YaHei');
  }
  draw([[960,150],[960,850]],'#245438',2);
  caption('频率决定重复的节奏，相位改变轨迹。');
}

export function signal(t:number):[number,number] {
  // Sound plays only during stable phase holds. The transition uses a relay tick.
  const windows=[[.08,3.72,phaseOffset],[4.05,13.6,0],[19.15,22.25,phaseOffset],[22.7,25.65,0],[26.1,29.55,phaseOffset]];
  const w=windows.find(([start,end])=>t>=start&&t<end);
  let channels:[number,number]=[0,0];
  if(w){
    const env=ease((t-w[0])/.11)*ease((w[1]-t)/.18)*(.44+.56*Math.exp(-((t-w[0])%1.5)*1.6));
    const [x,y]=point(tau*baseHz*t,w[2]);
    channels=[.16*x*env,.16*y*env];
  }
  for(const at of [0,4,11.5,14,19,22.5,25.8,29.7]){
    const dt=t-at;
    if(dt<0||dt>.2) continue;
    const relay=.14*Math.sin(tau*1805*dt)*Math.sin(tau*581*dt)*Math.min(1,dt/.004)*Math.exp(-dt*32);
    channels[0]+=relay;channels[1]+=relay;
  }
  return channels;
}
