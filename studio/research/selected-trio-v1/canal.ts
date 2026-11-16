import { seg, lockState } from './timeline.ts';
import {rect,poly,line,text,circle,arrow,background,ship,amber,ink,muted} from './draw.ts';
export async function canal(g:CanvasRenderingContext2D) {
  const photo=new Image();photo.src='./assets/panama-20230818.jpg';await photo.decode();
  const photograph=(t:number,end=false)=>{
    background(g,t);const z=1+Math.min(end?t-78:t,12)*.002;g.save();g.beginPath();g.rect(0,0,1300,1080);g.clip();g.translate(650,540);g.scale(z,z);g.filter='saturate(0.3) contrast(1.15)';g.drawImage(photo,-650,-587,1300,1174);g.filter='none';g.restore();
    const shade=g.createLinearGradient(1000,0,1440,0);shade.addColorStop(0,'#0d191f00');shade.addColorStop(1,'#0d191f');g.fillStyle=shade;g.fillRect(1000,0,920,1080);
    text(g,'巴拿马运河 · 太平洋入口',72,70,28);text(g,'2023 / 08 / 18',72,112,24,muted);
    text(g,'NASA Earth Observatory / Landsat · USGS',72,930,22,muted);
    // Keep the photograph unannotated: individual vessel positions were not independently geolocated.
    if(end){text(g,'脚下是海',1370,415,62);text(g,'通行依赖湖水',1370,505,46,amber);line(g,[[1370,555],[1780,555]],'#50656a');text(g,'降雨 → 湖泊 → 船闸',1370,615,29,muted);}
    else {text(g,'在海上',1370,390,66);text(g,'因为缺水',1370,490,66,amber);text(g,'等待',1370,590,94);}
  };
  const overview=(t:number)=>{background(g,t);text(g,'把航道转过来看',110,125,48);text(g,'原理示意 · 非比例',110,177,24,muted);
    poly(g,[[90,830],[90,760],[460,760],[570,640],[680,520],[1230,520],[1360,640],[1470,760],[1830,760],[1830,830]],'#30464a');
    const top=760-seg(t,16,21)*250;rect(g,90,760,420,160,'#254b61');rect(g,1410,760,420,160,'#254b61');rect(g,685,top,550,830-top,'#3f7783');line(g,[[685,top],[1235,top]],amber,3);
    text(g,'海面',200,735,32);text(g,'海面',1650,735,32);text(g,'湖面',930,top-35,36,amber);ship(g,315+seg(t,12,23)*610,760-seg(t,16,21)*250,.8);
    line(g,[[1310,top],[1310,760]],muted,2,[6,7]);text(g,'船要先升到高处',1110,350,40,amber);};
  const lift=(t:number)=>{background(g,t);const s=lockState(t), surface=760-s.fill*250;
    text(g,'船闸：用水升降',110,120,48);text(g,'单闸室原理示意 · 非比例',110,171,24,muted);
    rect(g,90,760,520,140,'#254b61');rect(g,610,surface,550,900-surface,'#3b7180');rect(g,1160,510,670,390,'#3b7180');
    // Feed arrives from the high-water side through a closed culvert.
    poly(g,[[90,900],[1830,900],[1830,965],[90,965]],'#445355');line(g,[[1510,650],[1510,930],[885,930],[885,880]],'#8aa9ad',16);
    if(s.phase==='fill'){for(let i=0;i<13;i++){const p=((t-33)*.22+i/13)%1;const x=p<.45?1510:1510-(p-.45)/.55*625,y=p<.45?650+p/.45*280:930;circle(g,x,y,4,amber);}arrow(g,885,901,885,851,amber);}
    line(g,[[90,760],[610,760]],'#8fb3b8',3);line(g,[[610,surface],[1160,surface]],amber,3);line(g,[[1160,510],[1830,510]],'#8fb3b8',3);
    const leftH=435*s.gateLeft,rightH=435*s.gateRight;rect(g,598,900-leftH,24,leftH,'#bec4b9');rect(g,1148,900-rightH,24,rightH,'#bec4b9');
    ship(g,s.x,s.y,1);text(g,'低水位侧',130,710,28,muted);text(g,'高水位侧',1500,460,28,muted);text(g,'来自高处的水',1275,825,28,amber);
    const states=['关门','注水浮升','平水','开门'];for(let i=0;i<4;i++){const active=i===0?s.phase==='close':i===1?s.phase==='fill':i===2?s.phase==='equalize':s.phase==='open'||s.phase==='leave';text(g,states[i],550+i*240,340,36,active?amber:muted,'center');}
  };
  const catchment=(t:number)=>{background(g,t);text(g,'水从哪里来？',110,125,48);text(g,'供水关系示意 · 非比例',110,177,24,muted);
    poly(g,[[180,760],[360,445],[560,650],[770,375],[1000,695],[1200,760]],'#304b50');rect(g,790,640,500,150,'#3d7884');line(g,[[790,640],[1290,640]],amber,3);text(g,'湖泊',1020,615,40,amber,'center');
    for(let i=0;i<8;i++){circle(g,400+i*70,285+Math.sin(i)*20,66,'#74868a');}
    for(let i=0;i<48;i++){const x=355+(i*71%540),y=360+((t*65+i*37)%220);line(g,[[x,y],[x-7,y+20]],'#9ab9bd',2);}
    arrow(g,565,560,835,650,amber,4);arrow(g,1280,670,1530,790,amber,4);rect(g,1450,800,330,90,'#31576b');text(g,'船闸 → 海',1450,750,35);text(g,'降雨补给',490,210,36);text(g,'高处',1330,620,26,muted);text(g,'低处',1760,845,26,muted);
    if(t>=58)text(g,'海水不会自动流上高处',200,875,40,amber);
  };
  const drought=(t:number)=>{background(g,t);text(g,'2023年：供水吃紧',110,145,54);text(g,'历史事件 · 非当前通航状态',110,196,25,muted);
    const labels=['降雨不足','湖泊低水位','限制通行','等待增加'];for(let i=0;i<4;i++){const x=145+i*440,y=405+i*55;circle(g,x+120,y,76,i<2?'#385864':'#745c3f');text(g,String(i+1).padStart(2,'0'),x+120,y+18,44,amber,'center');text(g,labels[i],x+120,y+150,38,ink,'center');if(i<3)arrow(g,x+230,y+25,x+355,y+45,muted);}
    text(g,'依据：NASA Earth Observatory，2023-09-01',110,890,25,muted);
  };
  return (t:number)=>{if(t<12)photograph(t);else if(t<24)overview(t);else if(t<50)lift(t);else if(t<66)catchment(t);else if(t<78)drought(t);else photograph(t,true);};
}
