import {seg} from './timeline.ts';
import {gloveMotion,sealMotion} from './edit.ts';
import {rect,poly,line,visible} from './draw.ts';
const P={night:'#152536',shadow:'#27384a',wood:'#715147',woodLight:'#a77c55',gold:'#e8b76b',cream:'#f5e7bd',blue:'#527b9c',blueLight:'#91b0c2',skin:'#e4ac89',skinShade:'#b77868',red:'#bd665b',dark:'#302d3b',green:'#657e72',paper:'#dec39a'};
export function hero(main:CanvasRenderingContext2D) {
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const g=canvas.getContext('2d',{willReadFrequently:true})!;
  const r=(x:number,y:number,w:number,h:number,c:string)=>rect(g,Math.round(x),Math.round(y),Math.round(w),Math.round(h),c);
  const p=(points:number[][],c:string)=>poly(g,points.map(([x,y])=>[Math.round(x),Math.round(y)]),c);
  const glyphs=document.createElement('canvas');glyphs.width=320;glyphs.height=30;const glyph=glyphs.getContext('2d',{willReadFrequently:true})!;
  const txt=(s:string,x:number,y:number,n=12,c=P.cream,align:CanvasTextAlign='left')=>{n=Math.max(12,n);glyph.clearRect(0,0,320,30);glyph.font=`${n}px SimSun, serif`;glyph.textBaseline='alphabetic';glyph.fillStyle='#fff';glyph.fillText(s,0,n);const w=Math.ceil(glyph.measureText(s).width),x0=align==='center'?x-w/2:align==='right'?x-w:x;const data=glyph.getImageData(0,0,320,30).data;for(let yy=0;yy<n+4;yy++)for(let xx=0;xx<w;xx++)if(data[(yy*320+xx)*4+3]>92)r(x0+xx,y-n+yy,1,1,c);visible.push({id:s,text:s,x0:x0*6,y0:(y-n)*6,x1:(x0+w)*6,y1:(y+4)*6});};
  const rough=(x:number,y:number,w:number,h:number,c:string)=>{for(let a=0;a<w;a+=4)for(let b=0;b<h;b+=4)if((a+b)%8===0)r(x+a,y+b,1,1,c);};
  function cabin(){r(0,0,320,180,P.night);r(15,8,290,108,P.shadow);for(let x=16;x<308;x+=26){r(x,8,3,110,'#384451');r(x+4,8,1,110,'#44505a');}r(15,8,290,5,P.wood);r(15,110,290,8,P.wood);r(0,118,320,62,'#5b4545');for(let y=125;y<180;y+=13){r(0,y,320,1,P.dark);for(let x=(y%2)*23;x<320;x+=47)r(x,y,1,13,P.dark);}rough(0,120,320,60,'#76534c');
    // The window, shelf and foreground keep the room legible without camera shake.
    r(36,21,55,66,P.dark);r(40,25,47,58,'#85a5a5');p([[40,75],[48,54],[58,68],[72,45],[87,74],[87,83],[40,83]],'#597a79');r(61,25,4,58,P.wood);r(40,52,47,4,P.wood);r(33,84,61,5,P.gold);p([[43,89],[85,89],[140,131],[67,131]],'#8b7556');rough(67,119,63,12,'#a38b63');
    r(232,53,55,4,P.woodLight);for(let i=0;i<6;i++){r(236+i*7,37-i%3*4,5,16+i%3*4,[P.red,P.blue,P.gold][i%3]);r(237+i*7,41,3,1,P.cream);}r(274,83,18,25,P.woodLight);r(276,79,14,5,P.wood);r(281,67,3,13,P.green);p([[282,71],[268,62],[276,62],[284,68]],P.green);p([[283,74],[293,64],[291,73]],P.green);
    r(194,17,31,45,P.dark);r(198,21,23,37,P.woodLight);p([[209,27],[217,33],[215,46],[209,52],[202,46],[201,33]],P.blue);r(208,31,3,15,P.gold);
  }
  function table(){r(141,112,92,6,P.dark);r(143,109,88,5,P.woodLight);r(145,115,84,6,P.wood);r(149,120,6,30,P.woodLight);r(218,120,6,30,P.woodLight);r(145,150,14,3,P.dark);r(214,150,14,3,P.dark);r(151,130,69,4,P.wood);}
  function parcel(x:number,y:number,scale=1,opened=0){g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);r(-17,-15,35,18,P.dark);r(-16,-14,33,16,P.woodLight);p([[-16,-14],[-10,-20],[21,-20],[17,-14]],P.paper);p([[17,-14],[21,-20],[21,-3],[17,2]],'#8c624b');if(opened===0){r(-2,-19,5,21,P.red);r(-1,-17,1,16,'#e0946b');}r(8,-9,6,5,P.paper);r(10,-8,2,3,P.dark);if(opened>0){p([[-16,-14],[-16-opened*7,-14-opened*13],[0,-19],[0,-14]],P.paper);p([[0,-14],[18+opened*5,-14-opened*12],[18,-4]],P.paper);}g.restore();}
  function face(x:number,y:number,look=0,blink=false){g.save();g.translate(Math.round(x),Math.round(y));p([[1,1],[5,-2],[7,0],[12,-1],[15,3],[14,12],[10,15],[4,14],[0,9]],P.dark);p([[2,3],[12,3],[13,11],[9,13],[4,12],[2,9]],P.skin);r(3,9,2,2,P.skinShade);p([[0,4],[1,0],[4,-2],[5,1],[8,-1],[10,1],[13,0],[15,5],[10,4],[8,6],[7,3],[4,5]],P.gold);r(2,3,2,2,P.cream);r(5,7+Math.max(0,look),2,blink?1:2,P.dark);r(11,7+Math.max(0,look),2,blink?1:2,P.dark);r(9,11,3,1,look===2?P.cream:P.skinShade);if(look===1){r(5,5,2,1,P.dark);r(11,6,2,1,P.dark);}g.restore();}
  function actor(x:number,y:number,t:number,mode:string,bare=false,lift=0){g.save();g.translate(Math.round(x),Math.round(y));const effort=seg(t,15,16)*(1-seg(t,22.5,24)),bend=mode==='reach'?3:mode==='strain'?3+effort*2:mode==='look'?2:0, squat=mode==='strain'?effort*2:0, breath=mode==='strain'?0:Math.floor(t*2)%3===0?1:0;
    if(t>=5&&mode!=='sword'){p([[-15,-36],[-12,-37],[-21,-3],[-24,0]],P.blueLight);r(-17,-36,9,2,P.gold);r(-14,-41,3,6,P.woodLight);}
    // Each silhouette is redrawn; there are no rotated limb cutouts.
    p([[-8,-29],[-15,-20],[-17,-5],[-9,-2],[1,-8],[0,-28]],P.red);p([[-12,-25],[-15,-9],[-9,-7],[-5,-28]],'#8f4855');
    p([[-6,-12],[-6,-2],[-9,0],[-9,3],[-1,3],[1,-9],[5,-8],[6,2],[14,2],[14,-1],[10,-3],[9,-12]],P.dark);r(-6,-10,6,8,P.blue);r(5,-10,5,9,P.blue);r(-8,0,8,2,P.woodLight);r(7,0,8,2,P.woodLight);
    p([[-9,-29+squat],[-4+bend,-33+squat],[8+bend,-29+squat],[12,-15], [6,-9],[-7,-11]],P.dark);p([[-7,-27+squat],[-2+bend,-31+squat],[7+bend,-27+squat],[9,-16],[5,-12],[-6,-14]],P.blue);p([[-5,-27+squat],[-1+bend,-30+squat],[7+bend,-26+squat],[6,-21],[-5,-22]],P.blueLight);r(-6,-15,16,3,P.woodLight);r(1,-15,3,3,P.gold);
    face(-5+bend,-46+squat+breath,mode==='look'?1:mode==='happy'?2:0,Math.floor(t*4)%37===0);
    const hands=bare?P.skin:P.blueLight;
    if(mode==='reach'||mode==='strain'||mode==='look') {const slip=mode==='reach'?(seg(t,8.1,8.8)-seg(t,9.1,10)+seg(t,11.5,12.3)-seg(t,12.7,14))*5:0;const hx=17-slip,hy=-35-lift+slip;
      p([[6+bend,-28],[12,-29],[15,-24-lift*.4],[hx,hy],[hx+7,hy+5],[19,-17-lift*.4],[10,-20]],P.dark);p([[8+bend,-26],[12,-26],[16,-22-lift*.4],[hx+1,hy+3],[hx+4,hy+5],[17,-20-lift*.4],[10,-23]],P.blue);
      p([[hx-1,hy+1],[hx+1,hy-2],[hx+5,hy-2],[hx+8,hy+1],[hx+7,hy+5],[hx+4,hy+7],[hx,hy+5]],hands);r(hx,hy+4,5,2,P.gold);r(hx+4,hy,1,3,P.blue);r(hx+6,hy+1,1,3,P.blue);
      p([[-6,-26],[-11,-24],[-10,-13],[5,-8],[8,-12],[-4,-17],[-4,-23]],P.dark);p([[-7,-24],[-8,-15],[4,-10],[6,-12],[-5,-17],[-4,-23]],P.blue);r(4,-13,5,5,P.skin);
      if(mode==='strain'&&t>18&&t<21){r(10,-44,2,3,P.blueLight);r(12,-40,1,2,P.blueLight);}}
    else if(mode==='sword'){const draw= t<5?1:seg(t,26,27.5),lower=t<5?0:seg(t,29.2,31.2),put=t<5?0:seg(t,31.5,34);const hx=-14+draw*32+lower*3-put*35,hy=-38-draw*4+lower*18-put*14;
      p([[7,-28],[12,-27],[hx+4,hy],[hx+4,hy+6],[12,-18],[8,-21]],P.dark);line(g,[[10,-25],[hx,hy+3]],P.blue,5);r(hx-2,hy,6,6,hands);
      const tx=hx+1-put*12,ty=hy-26+put*58;line(g,[[hx+1,hy+1],[tx,ty]],P.blueLight,3);r(hx-4,hy,10,2,P.gold);r(hx,hy+2,2,6,P.woodLight);r(-10,-25,6,15,P.blue);r(-10,-11,5,5,P.skin);}
    else if(mode==='open'){const q=seg(t,60,61.2);line(g,[[7,-25],[17+q*18,-32-q*12]],P.blue,6);r(16+q*18,-33-q*12,6,5,P.skin);line(g,[[-5,-24],[5-q*6,-31-q*13]],P.blueLight,5);r(3-q*6,-33-q*13,5,5,P.skin);}
    else {p([[-8,-28],[-12,-26],[-12,-11],[-7,-8],[-5,-12],[-7,-23]],P.dark);r(-10,-24,4,12,P.blue);r(-10,-12,5,5,P.skin);p([[8,-28],[13,-25],[14,-10],[10,-8],[7,-13],[9,-23]],P.dark);r(10,-24,3,12,P.blueLight);r(10,-12,5,5,hands);}
    g.restore();}
  function portrait(t:number,mood=0){r(18,133,33,34,P.dark);r(20,135,29,30,P.wood);g.save();g.translate(21,137);g.scale(1.7,1.7);face(0,0,mood,Math.floor(t*4)%29===0);g.restore();}
  function message(t:number,s:string,mood=0,courier=false){r(12,128,296,44,P.dark);r(14,130,292,40,P.cream);r(16,132,288,36,P.night);if(courier){r(20,135,29,30,P.wood);r(27,144,17,17,P.skinShade);r(23,138,23,8,P.green);r(22,145,27,3,P.green);r(31,151,2,2,P.dark);r(39,151,2,2,P.dark);r(33,157,6,1,P.cream);}else portrait(t,mood);txt(s,61,151,10);}
  function gloveShape(x:number,y:number){
    // Four stepped fingertips and a separate thumb identify an empty gauntlet.
    p([[x,y],[x+22,y],[x+24,y-3],[x+43,y-3],[x+47,y+1],[x+47,y+5],[x+50,y+7],[x+50,y+12],[x+47,y+14],[x+47,y+19],[x+42,y+23],[x+26,y+23],[x+23,y+32],[x+16,y+35],[x+9,y+31],[x+7,y+24],[x,y+24]],P.dark);
    p([[x+3,y+3],[x+23,y+3],[x+25,y],[x+42,y],[x+44,y+3],[x+44,y+7],[x+47,y+9],[x+47,y+11],[x+44,y+12],[x+44,y+18],[x+41,y+20],[x+24,y+20],[x+20,y+29],[x+15,y+31],[x+12,y+28],[x+10,y+21],[x+3,y+21]],P.blueLight);
    r(x+2,y+2,7,21,P.gold);r(x+3,y+4,4,16,P.dark);r(x+4,y+6,2,12,P.blue);
    for(let i=0;i<3;i++)r(x+29,y+5+i*5,14,2,P.blue);
  }
  function grip(x:number,y:number,bare:boolean,side=1,pinch=true,sleeve=true){
    g.save();g.translate(Math.round(x),Math.round(y));g.scale(side,1);
    // A closed palm silhouette keeps the thumb opposed to four folded fingers.
    const skin=bare?P.skin:P.blueLight,shade=bare?P.skinShade:P.blue;
    p([[-7,0],[-2,-5],[4,-5],[8,-1],[13,1],[17,7],[21,16],[19,25],[12,30],[3,28],[-5,22],[-10,13],[-11,5]],P.dark);
    p([[-5,2],[-1,-2],[3,-2],[6,2],[11,4],[14,9],[18,17],[16,23],[11,27],[4,25],[-2,20],[-7,12],[-8,6]],skin);
    line(g,[[-5,3],[1,5]],shade,2);line(g,[[-7,9],[-1,11]],shade,2);line(g,[[-4,15],[2,17]],shade,2);
    p([[9,20],[20,17],[34,34],[23,44],[12,31]],P.dark);
    p([[12,22],[19,21],[29,34],[24,39],[15,29]],skin);
    if(pinch){p([[-7,12],[-3,7],[3,5],[7,8],[6,12],[1,12],[-2,17]],shade);p([[-5,12],[-2,9],[3,8],[4,10],[0,10],[-2,14]],skin);r(-2,8,3,2,bare?P.cream:P.gold);}
    if(sleeve){p([[25,32],[37,23],[185,190],[171,204],[21,42]],P.dark);p([[28,33],[37,28],[181,190],[172,199],[26,41]],P.blue);
    line(g,[[27,35],[38,27]],P.gold,4);}
    g.restore();
  }
  function tabletop(){r(0,0,320,180,P.wood);for(let y=9;y<180;y+=26){r(0,y,320,2,P.dark);rough(0,y+4,320,18,P.woodLight);}}
  function topBox(opened=0){
    r(98,43,150,99,P.dark);r(101,46,144,92,P.woodLight);r(107,51,132,81,P.dark);
    // Contents remain inside the cavity; the two flaps rotate about the outer hinges.
    if(opened>0){r(164,78,17,28,P.blueLight);r(162,89,21,21,P.blue);r(166,97,13,10,P.red);r(166,74,13,5,P.gold);r(165,90,3,14,P.cream);}
    const left=172-102*opened,right=172+103*opened;
    p([[101,46],[left,46-10*opened],[left,137-10*opened],[101,137]],P.paper);
    p([[right,46-10*opened],[244,46],[244,137],[right,137-10*opened]],P.woodLight);
    line(g,[[left,46-10*opened],[left,137-10*opened]],P.dark,2);
    line(g,[[right,46-10*opened],[right,137-10*opened]],P.dark,2);
  }
  function closeHands(t:number){
    tabletop();const s=sealMotion(t);topBox(t>=60?s.opening:0);
    if(t<44){r(168,45,8,92,P.red);r(170,46,1,90,P.gold);const slip=(seg(t,38.4,39.2)-seg(t,40,41))*14;
      grip(172-slip,137+slip,false,-1);grip(242,91,true,1,false);return;}
    // The removed left glove remains on the same part of the table.
    gloveShape(21,15);
    if(t<60){
      if(s.remaining>0){r(168,45,8,s.remaining,P.red);r(170,45,1,s.remaining,P.gold);}
      if(s.peeled>0){line(g,s.points.map(p=>[p.x,p.y]),P.dark,9);line(g,s.points.map(p=>[p.x,p.y]),P.red,7);line(g,s.points.map(p=>[p.x-1,p.y]),P.gold,1);}
      // One palm braces the side while bare thumb and forefinger follow the tape end.
      grip(242,91,true,1,false);grip(s.tip.x,s.tip.y,true,-1);
    }else{
      const tape=sealMotion(59.6);line(g,tape.points.map(p=>[p.x,p.y]),P.red,7);
      const reach=seg(t,60,60.5),q=s.opening;
      grip(tape.tip.x+(166-tape.tip.x)*reach-102*q,tape.tip.y+(104-tape.tip.y)*reach-10*q,true,-1);
      grip(242+(179-242)*reach+103*q,91+(104-91)*reach-10*q,true);
    }
  }
  function gloveClose(t:number){
    cabin();r(0,145,320,35,P.wood);r(0,143,320,4,P.woodLight);rough(0,150,320,30,P.woodLight);
    // Keep shoulders, elbows and face in shot so the gauntlet belongs to a person.
    r(72,59,12,22,P.skin);r(72,69,12,7,P.skinShade);
    p([[45,75],[77,68],[105,79],[118,143],[31,143]],P.dark);
    p([[49,78],[76,72],[101,83],[111,143],[38,143]],P.blue);
    p([[49,78],[76,72],[100,83],[97,100],[47,96]],P.blueLight);
    r(40,132,70,9,P.woodLight);r(68,132,10,9,P.gold);
    g.save();g.translate(57,34);g.scale(2,2);face(0,0,t<49?1:2,false);g.restore();
    parcel(265,138,1.8);
    const motion=gloveMotion(t),relax=seg(t,50,52);
    const cuff=motion.x,gy=motion.y;
    r(190,144,36,1,P.dark);
    // Forearms are connected to the torso, and the left skin is hidden until extraction.
    p([[49,91],[40,103],[76,132],[108,109],[112,88],[100,83],[78,111],[59,91]],P.dark);
    p([[49,96],[45,104],[77,125],[105,106],[108,91],[101,88],[79,117],[57,96]],P.blue);
    line(g,[[101,88],[108,103]],P.gold,5);
    g.save();g.beginPath();g.rect(0,0,cuff+2,143);g.clip();
    p([[108,88],[125,84],[150,84],[155,87],[155,91],[159,94],[159,99],[154,102],[144,103],[140,115],[134,119],[127,116],[123,108],[107,105]],P.dark);
    p([[110,91],[126,87],[149,87],[152,89],[150,92],[155,95],[155,98],[151,100],[141,100],[137,112],[133,115],[129,113],[126,105],[110,102]],P.skin);
    r(140,88,11,2,P.cream);r(140,94,12,2,P.skinShade);g.restore();
    gloveShape(cuff,gy);
    const hx=t<49?cuff+5:189-75*relax,hy=t<49?82:82+10*relax;
    // The right wrist stays connected to the bent elbow through release and recoil.
    g.save();g.lineJoin='round';g.lineCap='round';
    const elbowX=137+relax*5,elbowY=128;
    line(g,[[102,94],[elbowX,elbowY],[hx+18,hy+27]],P.dark,18);
    line(g,[[104,95],[elbowX,elbowY],[hx+18,hy+27]],P.blue,11);
    line(g,[[hx+17,hy+24],[hx+24,hy+28]],P.gold,4);g.restore();
    grip(hx,hy,true,1,t<49,false);
  }
  const quantCache=new Map<number,number[]>(), palette=Object.values(P).map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
  function quantize(){const im=g.getImageData(0,0,320,180),d=im.data;for(let i=0;i<d.length;i+=4){const k=(d[i]<<16)|(d[i+1]<<8)|d[i+2];let col=quantCache.get(k);if(!col){let dist=Infinity;col=palette[0];for(const p of palette){const dd=(p[0]-d[i])**2+(p[1]-d[i+1])**2+(p[2]-d[i+2])**2;if(dd<dist){dist=dd;col=p;}}quantCache.set(k,col);}d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}g.putImageData(im,0,0);}
  return(t:number)=>{g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
    if(t<5){r(0,0,320,180,P.night);for(let i=0;i<45;i++)r(i*73%320,i*29%110,1,1,P.blueLight);p([[0,133],[56,103],[116,128],[190,95],[256,132],[320,108],[320,180],[0,180]],P.shadow);r(0,153,320,27,P.wood);actor(109,148,t,'sword');const vanish=seg(t,1.8,2.8);g.globalAlpha=1-vanish;p([[211,147],[206,123],[195,110],[219,113],[232,99],[245,114],[265,111],[251,132],[250,148]],P.red);r(223,115,4,3,P.gold);r(238,115,4,3,P.gold);g.globalAlpha=1;txt('Lv.99',20,25,12);txt('战斗结束',222,45,12,P.gold);if(t>2){for(let i=0;i<12;i++)r(230+Math.cos(i)*vanish*40,130+Math.sin(i)*vanish*30,2,2,P.gold);}}
    else if(t>=36&&t<44||t>=53&&t<64){closeHands(t);}
    else if(t>=44&&t<53){gloveClose(t);}
    else {cabin();table();const lift=t>=15&&t<26?seg(t,16,18)*(1-seg(t,21,22.5))*9:0;const bare=t>=49.5;const mode=t<15?'reach':t<26?'strain':t<34?'sword':t<36?'look':t<49.5?'look':t<61.3?'open':'happy';
      parcel(176,107-lift,1,t>=60?Math.max(.01,seg(t,60,61.2)):0);actor(155,124,t,mode,bare,lift);if(bare){r(149,103,9,5,P.blueLight);r(147,105,11,3,P.blue);}
      if(t>=5&&t<15){message(t,'拆开包裹。');}
      else if(t<26){if(t>=18&&t<22)message(t,'……',1);}
      else if(t<36&&t>=28){r(12,128,296,44,P.dark);r(14,130,292,40,P.paper);txt('箱上贴着：请勿划伤内件。',24,154,12,P.dark);}
      else if(t<53){if(t<49.5){const a=seg(t,45,49);r(160-a*10,96+a*8,8,7,P.blueLight);r(151-a*7,96,9,5,P.skin);}}
      else if(t>=64){const boxX=340-seg(t,64,65.2)*64;parcel(boxX,125,1.4);if(t<66.3){const retreat=seg(t,65.2,66.3)*70;r(boxX+20+retreat,99,48,7,P.green);r(boxX+14+retreat,98,9,9,P.skinShade);}message(t,'还有这一箱。拜托啦！',0,true);}
    }
    quantize();main.imageSmoothingEnabled=false;main.drawImage(canvas,0,0,1920,1080);
  };
}
