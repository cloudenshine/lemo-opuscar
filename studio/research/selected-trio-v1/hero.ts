import {seg} from './timeline.ts';
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
  function actor(x:number,y:number,t:number,mode:string,bare=false,lift=0){g.save();g.translate(Math.round(x),Math.round(y));const bend=mode==='reach'?3:mode==='strain'?5:mode==='look'?2:0, squat=mode==='strain'?2:0, breath=Math.floor(t*2)%3===0?1:0;
    // Each silhouette is redrawn; there are no rotated limb cutouts.
    p([[-8,-29],[-15,-20],[-17,-5],[-9,-2],[1,-8],[0,-28]],P.red);p([[-12,-25],[-15,-9],[-9,-7],[-5,-28]],'#8f4855');
    p([[-6,-12],[-6,-2],[-9,0],[-9,3],[-1,3],[1,-9],[5,-8],[6,2],[14,2],[14,-1],[10,-3],[9,-12]],P.dark);r(-6,-10,6,8,P.blue);r(5,-10,5,9,P.blue);r(-8,0,8,2,P.woodLight);r(7,0,8,2,P.woodLight);
    p([[-9,-29+squat],[-4+bend,-33+squat],[8+bend,-29+squat],[12,-15], [6,-9],[-7,-11]],P.dark);p([[-7,-27+squat],[-2+bend,-31+squat],[7+bend,-27+squat],[9,-16],[5,-12],[-6,-14]],P.blue);p([[-5,-27+squat],[-1+bend,-30+squat],[7+bend,-26+squat],[6,-21],[-5,-22]],P.blueLight);r(-6,-15,16,3,P.woodLight);r(1,-15,3,3,P.gold);
    face(-5+bend,-46+squat+breath,mode==='look'?1:mode==='happy'?2:0,Math.floor(t*4)%37===0);
    const hands=bare?P.skin:P.blueLight;
    if(mode==='reach'||mode==='strain'||mode==='look') {const slip=mode==='reach'?(seg(t,8.1,8.8)-seg(t,9.1,10)+seg(t,11.5,12.3)-seg(t,12.7,14))*4:0;const hx=27-slip,hy=-38-lift+slip;p([[6+bend,-28],[12,-29],[20,-25-lift*.5],[hx,hy],[hx+7,hy+5],[21,-18-lift*.5],[10,-20]],P.dark);p([[8+bend,-26],[13,-27],[20,-22-lift*.5],[hx,hy+3],[hx+4,hy+5],[21,-21-lift*.5],[10,-23]],P.blue);r(hx,hy,7,6,hands);r(hx+2,hy,4,2,bare?P.cream:'#d4ddce');p([[-6,-26],[-11,-24],[-10,-13],[5,-8],[8,-12],[-4,-17],[-4,-23]],P.dark);p([[-7,-24],[-8,-15],[4,-10],[6,-12],[-5,-17],[-4,-23]],P.blue);r(4,-13,5,5,hands);}
    else if(mode==='sword'){p([[7,-28],[13,-25],[17,-37],[22,-35],[20,-20],[10,-18]],P.dark);p([[9,-26],[12,-23],[16,-35],[19,-34],[18,-22],[11,-20]],P.blue);r(16,-40,7,6,hands);r(19,-64,3,26,P.cream);r(18,-39,8,2,P.gold);r(20,-36,2,7,P.woodLight);r(-10,-25,6,15,P.blue);r(-10,-11,5,5,hands);}
    else {p([[-8,-28],[-12,-26],[-12,-11],[-7,-8],[-5,-12],[-7,-23]],P.dark);r(-10,-24,4,12,P.blue);r(-10,-12,5,5,hands);p([[8,-28],[13,-25],[14,-10],[10,-8],[7,-13],[9,-23]],P.dark);r(10,-24,3,12,P.blueLight);r(10,-12,5,5,hands);}
    g.restore();}
  function portrait(t:number,mood=0){r(18,133,33,34,P.dark);r(20,135,29,30,P.wood);g.save();g.translate(21,137);g.scale(1.7,1.7);face(0,0,mood,Math.floor(t*4)%29===0);g.restore();}
  function message(t:number,s:string,mood=0){r(12,128,296,44,P.dark);r(14,130,292,40,P.cream);r(16,132,288,36,P.night);portrait(t,mood);txt(s,61,151,10);}
  function closeHands(t:number){r(0,0,320,180,P.night);r(0,105,320,75,P.wood);rough(0,106,320,74,P.woodLight);p([[74,72],[113,45],[261,45],[222,72]],P.paper);r(74,72,149,70,P.woodLight);p([[223,72],[261,45],[261,117],[223,142]],'#8c624b');r(153,46,16,98,P.red);r(155,47,2,97,'#e0946b');
    const success=t>=53, reveal=seg(t,54,59), reach=seg(t,36,38), slip=success?0:seg(t,39,40)*12;
    if(!success){p([[153,46],[169,46],[169,69],[160,63],[153,69]],'#edba83');r(160,60,7,4,P.red);p([[53,31],[90,33],[130+reach*13,53],[152+reach*8-slip,56],[158-slip,67],[143-slip,75],[120,64],[80,52],[53,52]],P.dark);p([[53,34],[88,36],[131,57],[148-slip,60],[153-slip,66],[142-slip,70],[120,61],[80,48],[53,48]],P.blueLight);r(145-slip,60,7,4,P.cream);txt('观察',19,24,10,P.gold);}
    else {const px=160-reveal*75,py=65-reveal*38;p([[153,46],[169,46],[169,65+reveal*79],[153,65+reveal*79]],P.paper);line(g,[[161,65+reveal*79],[px+4,py+4],[px,py]],P.red,6);line(g,[[159,65+reveal*79],[px+2,py+4]],P.gold,1);p([[45,30],[78,32],[px-16,py-8],[px+5,py-5],[px+11,py],[px+5,py+7],[px-2,py+4],[px-16,py+7],[76,49],[45,50]],P.dark);p([[45,34],[77,36],[px-15,py-4],[px+3,py-2],[px+6,py+1],[px+3,py+4],[px-3,py+1],[px-16,py+3],[76,45],[45,46]],P.skin);r(px+1,py-1,3,2,P.cream);txt('慢一点。',20,24,10,P.gold);}
  }
  function swordProp(){p([[250,105],[252,72],[255,67],[258,72],[255,106]],P.blueLight);r(247,104,12,2,P.gold);r(251,106,4,10,P.woodLight);}
  function gloveClose(t:number){r(0,0,320,180,P.night);r(0,133,320,47,P.wood);rough(0,134,320,44,P.woodLight);const pull=seg(t,45,49),drop=seg(t,49,50.2),x=104+pull*70,y=64+drop*54;
    p([[0,62],[91,62],[109,54],[142,54],[150,59],[149,66],[137,68],[137,72],[146,73],[145,81],[111,85],[91,78],[0,78]],P.dark);p([[0,65],[92,65],[110,57],[140,57],[146,61],[145,64],[133,65],[132,74],[142,76],[141,78],[112,81],[92,75],[0,75]],P.skin);r(130,59,12,2,P.cream);
    p([[x-9,y-15],[x+30,y-15],[x+43,y-8],[x+44,y+9],[x+22,y+16],[x-9,y+14]],P.dark);p([[x-6,y-12],[x+28,y-12],[x+39,y-6],[x+40,y+6],[x+21,y+12],[x-6,y+11]],P.blue);r(x-3,y-10,6,19,P.gold);r(x+6,y-10,24,5,P.blueLight);r(x+24,y+2,13,5,P.blueLight);
    if(t<49){p([[320,36],[244,36],[x+32,y-24],[x+5,y-21],[x-1,y-14],[x+4,y-6],[x+13,y-7],[x+19,y-13],[244,52],[320,52]],P.dark);p([[320,39],[244,39],[x+31,y-21],[x+6,y-18],[x+3,y-14],[x+6,y-10],[x+11,y-10],[x+17,y-16],[244,48],[320,48]],P.blueLight);}
  }
  const quantCache=new Map<number,number[]>(), palette=Object.values(P).map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
  function quantize(){const im=g.getImageData(0,0,320,180),d=im.data;for(let i=0;i<d.length;i+=4){const k=(d[i]<<16)|(d[i+1]<<8)|d[i+2];let col=quantCache.get(k);if(!col){let dist=Infinity;col=palette[0];for(const p of palette){const dd=(p[0]-d[i])**2+(p[1]-d[i+1])**2+(p[2]-d[i+2])**2;if(dd<dist){dist=dd;col=p;}}quantCache.set(k,col);}d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}g.putImageData(im,0,0);}
  return(t:number)=>{g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
    if(t<5){r(0,0,320,180,P.night);for(let i=0;i<45;i++)r(i*73%320,i*29%110,1,1,P.blueLight);p([[0,133],[56,103],[116,128],[190,95],[256,132],[320,108],[320,180],[0,180]],P.shadow);r(0,153,320,27,P.wood);actor(109,148,t,'sword');const vanish=seg(t,1.8,2.8);g.globalAlpha=1-vanish;p([[211,147],[206,123],[195,110],[219,113],[232,99],[245,114],[265,111],[251,132],[250,148]],P.red);r(223,115,4,3,P.gold);r(238,115,4,3,P.gold);g.globalAlpha=1;txt('Lv.99',20,25,12);txt('战斗结束',222,45,12,P.gold);if(t>2){for(let i=0;i<12;i++)r(230+Math.cos(i)*vanish*40,130+Math.sin(i)*vanish*30,2,2,P.gold);}}
    else if(t>=36&&t<44||t>=53&&t<60){closeHands(t);}
    else if(t>=44&&t<53){gloveClose(t);}
    else {cabin();table();const lift=t>=15&&t<26?seg(t,16,18)*(1-seg(t,21,22.5))*9:0;const bare=t>=49.5;const mode=t<15?'reach':t<26?'strain':t<31?'sword':t<36?'look':t<49.5?'look':t<62?'happy':'idle';
      parcel(176,107-lift,1,t>=60?Math.max(.01,seg(t,60,61.2)):0);actor(145,124,t,mode,bare,lift);if(t>=34)swordProp();if(bare){r(149,103,9,5,P.blueLight);r(147,105,11,3,P.blue);}
      if(t>=5&&t<15){message(t,'拆开包裹。');}
      else if(t<26){if(t>=18&&t<22)message(t,'……',1);}
      else if(t<36){message(t,'请勿划伤内件。',1);}
      else if(t<53){if(t<49.5){const a=seg(t,45,49);r(160-a*10,96+a*8,8,7,P.blueLight);r(151-a*7,96,9,5,P.skin);}}
      else if(t>=62){parcel(276,125,1.4);message(t,'外面那箱，也麻烦你了。',2);if(t>=67){r(140,102+seg(t,67,68)*3,8,6,P.blueLight);}}
    }
    quantize();main.imageSmoothingEnabled=false;main.drawImage(canvas,0,0,1920,1080);
  };
}
