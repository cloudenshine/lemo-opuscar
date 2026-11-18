export const length=29;
export const title='这件旧衣，明天还穿';
export const folder='mending-one-line';
const strokes=[
  {t:0,end:5.75,path:'M 411 702 C 433 712 466 728 496 740 C 509 732 515 716 523 705 L 506 688 L 528 678 L 516 665 L 540 651 L 533 634'},
  {t:6.3,end:12.2,path:'M 533 634 L 553 640 L 538 649 L 554 657 L 530 667 L 546 679 L 522 687 L 541 700 L 523 705'},
  {t:13.05,end:23.2,path:'M 523 705 L 496 740 C 463 727 432 713 411 702 C 448 591 494 435 550 310 Q 563 281 603 264 L 777 222 Q 850 148 904 150 Q 965 146 1010 222 L 1187 263 Q 1229 277 1249 324 L 1358 690 L 1266 725 L 1170 473 L 1160 883 Q 921 901 649 883 L 638 470 C 593 548 557 639 523 705'},
  {t:23.5,end:25.4,path:'M 523 705 Q 579 565 638 470 L 649 883 Q 765 891 893 892 L 893 279 Q 838 262 777 222'},
] as const;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const q=clamp(v);return q*q*(3-2*q);};
const paper='#f3ecdd',ink='#231e19',thread='#a03928';
type Sample={x:number;y:number};
let points:Sample[][]|null=null;
let grain:HTMLCanvasElement|null=null;

function drawing(){
  if(points)return points;
  points=strokes.map(({path})=>{
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',path);
    const len=p.getTotalLength(),n=Math.ceil(len/2.2);
    return Array.from({length:n+1},(_,i)=>{
      const v=p.getPointAtLength(len*i/n);
      return {x:v.x,y:v.y};
    });
  });
  return points;
}
function surface(){
  if(grain)return grain;
  grain=document.createElement('canvas');
  grain.width=960;grain.height=540;
  const g=grain.getContext('2d')!;
  g.fillStyle=paper;g.fillRect(0,0,960,540);
  let state=29128;
  function rand(){state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;}
  for(let i=0;i<47000;i++){
    g.fillStyle=rand()>.48?'rgba(120,90,55,.035)':'rgba(255,255,255,.23)';
    g.fillRect(rand()*960,rand()*540,rand()*1.5+.18,rand()*.8+.12);
  }
  return grain;
}
function progress(t:number,i:number){
  const s=strokes[i];
  const q=clamp((t-s.t)/(s.end-s.t));
  return q+.028*Math.sin(q*2*Math.PI);
}
export function picture(g:CanvasRenderingContext2D,t:number){
  const sets=drawing();
  const counts=sets.map((line,i)=>Math.floor(progress(t,i)*(line.length-1)));
  let section=strokes.findLastIndex(s=>t>=s.t);
  if(section<0)section=0;
  const tip=sets[section][counts[section]];
  const pull=ease((t-12.6)/6.5);
  const revealed=sets.flatMap((line,i)=>i<=section?line.slice(0,counts[i]+1):[]);
  let left=tip.x,right=tip.x,top=tip.y,bottom=tip.y;
  for(const p of revealed){
    left=Math.min(left,p.x);right=Math.max(right,p.x);
    top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);
  }
  const intendedZoom=4.75*Math.pow(.93/4.75,pull);
  const z=Math.min(intendedZoom,1616/(right-left+24),828/(bottom-top+24));
  const anchorX=492+28*ease(t/6),anchorY=689-14*ease(t/6);
  const desiredX=(anchorX*.88+tip.x*.12)*(1-pull)+891*pull;
  const desiredY=(anchorY*.80+tip.y*.20)*(1-pull)+514*pull;
  // Keep the nib and the repair in the same view while the outline starts growing.
  const centerX=Math.max(right-810/z,Math.min(left+810/z,desiredX));
  const centerY=Math.max(bottom-415/z,Math.min(top+415/z,desiredY));
  const originX=960-centerX*z,originY=540-centerY*z;
  g.fillStyle=paper;g.fillRect(0,0,1920,1080);
  g.save();g.translate(originX,originY);g.scale(z,z);
  g.fillStyle=g.createPattern(surface(),'repeat')!;
  g.fillRect(-originX/z,-originY/z,1920/z,1080/z);
  for(let startAt=0;startAt<=section;startAt++){
    const line=sets[startAt],n=counts[startAt];
    if(n<1)continue;
    const w=Math.max(2.25,4.8/z);
    const contour=(side:number,reverse:boolean)=>{
      for(let j=0;j<=n;j++){
        const i=reverse?n-j:j;
        const p=line[i],a=line[Math.max(0,i-1)],b=line[Math.min(n,i+1)];
        const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;
        const fine=1+.06*Math.sin(i*2.29)+.07*Math.cos(i*.16);
        const x=p.x+side*(-dy/l)*w*.5*fine,y=p.y+side*(dx/l)*w*.5*fine;
        if(j===0&&!reverse)g.moveTo(x,y);else g.lineTo(x,y);
      }
    };
    g.beginPath();contour(1,false);contour(-1,true);g.closePath();
    g.fillStyle=startAt===1?thread:ink;g.fill();
  }
  if(t<25.4){
    const shadow=g.createRadialGradient(tip.x+4,tip.y-6,0,tip.x+4,tip.y-6,22/z);
    shadow.addColorStop(0,'rgba(64,43,31,.20)');shadow.addColorStop(1,'rgba(64,43,31,0)');
    g.fillStyle=shadow;g.beginPath();g.ellipse(tip.x+4,tip.y-6,29/z,16/z,-.8,0,2*Math.PI);g.fill();
    g.fillStyle=section===1?thread:ink;g.beginPath();g.arc(tip.x,tip.y,Math.max(1.4,2/z),0,2*Math.PI);g.fill();
  }
  g.restore();
  const label=t<5.7?[.8,5.7,'袖口裂了一道缝。']:t<12.8?[7.2,12.4,'先把裂口两边接起来。']:[25.5,29,'这件旧衣，明天还穿。'];
  const [a,b,text]=label as [number,number,string];
  if(t>=a&&t<b){
    g.font=(t<25?'45':'51')+'px KaiTi, SimSun, serif';g.textBaseline='top';
    const x=t<25?110:125,y=t<25?924:945;
    const width=g.measureText(text).width;
    g.save();g.globalAlpha=clamp((b-t)/.48);
    g.beginPath();g.rect(x,y-4,width*clamp((t-a)/.58)+3,86);g.clip();
    g.fillStyle=ink;g.fillText(text,x,y);g.restore();
  }
}
export function signal(t:number):[number,number]{
  if((t>12.25&&t<13.05)||t>28.9)return [0,0];
  const phase=Math.floor(t*48000);
  const rand=(n:number)=>((Math.imul(n^(n>>>11),0x45d9f3b)>>>11)%65536)/32768-1;
  const grit=rand(phase)-rand(phase-4);
  const working=strokes.some(s=>t>=s.t&&t<=s.end);
  const pan=.25*Math.sin(t*.37);
  const pen=working?grit*(t<12.2?.013:.009)*Math.min(1,t/.13):0;
  const notes=[[.12,48],[2.2,55],[4.45,57],[6.4,60],[8.1,64],[10.5,67],[13.07,55],[14.8,57],[17.2,60],[20.4,67],[23.55,64],[25.5,60]];
  let note=0;
  for(const [at,midi] of notes){
    const age=t-at;
    if(age<0||age>3.6)continue;
    const f=440*2**((midi-69)/12),p=2*Math.PI*f*age;
    const attack=Math.min(1,age/.017);
    note+=attack*Math.exp(-age*1.45)*.14*(Math.sin(p)+.28*Math.sin(p*2.001)+.08*Math.sin(p*3.004));
  }
  const fade=1-ease((t-27.3)/1.5);
  return [fade*(note+pen*(1-pan)),fade*(note+pen*(1+pan))];
}
