export const length = 26;
export const title = '99% 恢复供电，还有多少户摸黑';
export const folder = 'power-ninety-nine';
const white = '#edece7';
const ink = '#151414';
const fog = '#c6c3bd';
const red = '#d72b22';
const relief = [{total:100,restored:99},{total:100000,restored:99000}];
const number = (n:number) => n.toLocaleString('en-US');
const clamp = (n:number) => Math.min(1,Math.max(0,n));
function snap(n:number) {
  // Solve cubic-bezier(.7,0,.2,1) for x before evaluating its y.
  let lo = 0, hi = 1;
  const x = clamp(n);
  for(let i=0;i<14;i++){
    const p=(lo+hi)/2, q=1-p;
    if(2.1*q*q*p+.6*q*p*p+p*p*p<x) lo=p;
    else hi=p;
  }
  const p=(lo+hi)/2;
  return p*p*(3-2*p);
}
export function picture(g:CanvasRenderingContext2D,t:number) {
  const rect=(x:number,y:number,w:number,h:number,c:string=ink)=>{
    g.fillStyle=c;
    g.fillRect(x,y,w,h);
  };
  const label=(s:string,x:number,y:number,size:number=36,color:string=ink,weight=500)=>{
    g.fillStyle=color;
    g.font=`${weight} ${size}px "Microsoft YaHei", sans-serif`;
    g.textBaseline='top';
    g.letterSpacing=size>=100?'-5px':'0px';
    g.fillText(s,x,y);
  };
  function reveal(q:number,x:number,y:number,w:number,h:number,draw:()=>void){
    g.save();g.beginPath();g.rect(x,y,w*snap(q),h);g.clip();draw();g.restore();
  }
  function grid(x:number,y:number,u:number,ratio:number){
    for(let i=0;i<100;i++){
      if(i>=Math.ceil(ratio*100)) break;
      const c=i===99?red:ink;
      rect(x+i%10*u,y+Math.floor(i/10)*u,u-3,u-3,c);
    }
  }
  rect(0,0,1920,1080,white);
  const last=t>=21;
  label('供电恢复率',96,60,30,ink,700);
  label('两个假设情景',1512,62,28);
  rect(96,127,1728,2,ink);
  if(t<5.5){
    for(let i=0;i<2;i++){
      const x=96+864*i;
      label(i===0?'区域 A':'区域 B',x,202,34);
      reveal((t-i*.22)/.65,x,298,840,408,()=>label('99%',x-7,284,325,ink,700));
      rect(x,742,810,4,ink);
    }
    rect(932,185,2,596,fog);
    label(t<2.5?'两边都是 99%。':'哪边还有更多户没有来电？',96,877,54,ink,700);
    return;
  }
  const redUnit=relief[1].total-relief[1].restored;
  if(t<13.5){
    const phase=t-5.5;
    for(let i=0;i<2;i++){
      const x=96+864*i;
      label(i===0?'区域 A':'区域 B',x,201,34);
      grid(x+432,292,33,clamp(phase/.9));
      label(t<7?'99%':number(relief[i].total),x-2,302,t<7?112:i===0?118:94,ink,700);
      label(t<7?'恢复率':'总户数',x,446,29);
      if(t>=8.5) label(`每格 ${number(relief[i].total/100)} 户`,x+432,644,26);
      if(t>=10) {
        const remain=relief[i].total-relief[i].restored;
        rect(x,738,810,3,ink);
        label(number(remain)+' 户',x,775,88,red,700);
        label('还没来电',x+430,818,34);
      }
    }
    rect(932,185,2,698,fog);
    return;
  }
  if(!last){
    label('把那一格打开',96,212,70,ink,700);
    label('区域 B 尚未恢复',96,350,38);
    const q=snap((t-13.5)/.65);
    const x=1689-786*q,y=589-381*q;
    rect(x,y,30+858*q,30+599*q,red);
    if(t>=14.5){
      rect(903,208,888,629,white);
      const visible=Math.ceil(redUnit*clamp((t-14.5)/1.5));
      for(let i=0;i<visible;i++){
        rect(903+22.2*(i%40),208+25.16*Math.floor(i/40),15,17,red);
      }
      label('每一点是一户',903,866,28);
      if(t>=16) label(number(redUnit),88,468,185,red,700);
      if(t>=17) label('同一个百分点。',96,725,49);
    }
    return;
  }
  rect(96,214,14,407,red);
  label('看到 99%，',139,223,113,ink,700);
  label('再问两个数。',139,332,113,ink,700);
  reveal((t-22)/.48,140,578,1630,270,()=>{
    label('总共有多少？',140,573,72,ink,700);
    label('还剩下多少？',140,678,72,ink,700);
  });
  rect(96,898,1728,2,ink);
  label('区域 A 还剩 1 户　/　区域 B 还剩 1,000 户',96,933,35);
}

export function signal(t:number):[number,number] {
  const beat=Math.floor(t*4);
  const dt=t-beat/4;
  const pulse=t>=.3&&!(t>=12.75&&t<13.5)&&t<24.8;
  const hit=t<.2||[22,28,40,54,58,64,84,88].includes(beat);
  const tonal=(f:number)=>Math.sin(2*Math.PI*f*dt);
  const beatEnvelope=Math.min(1,dt/.007)*Math.exp(-dt*(hit?25:42));
  const bass=pulse?beatEnvelope*(hit?.24:.1)*(tonal(hit?69:138)+.16*tonal(421)):0;
  const tick=pulse?beatEnvelope*.045*tonal(1169+53*(beat%3)):0;
  const dot=t>=14.5&&t<19.75?.07*Math.exp(-(t-14.5)*.6)*Math.sin(2*Math.PI*(330*(t-14.5)+24*(t-14.5)**2)):0;
  return [bass+tick+dot*.9,bass-tick*.45+dot];
}
