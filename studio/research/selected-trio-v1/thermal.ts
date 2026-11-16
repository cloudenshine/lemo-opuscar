import {seg} from './timeline.ts';
import {rect,line,text,circle,poly,arrow,amber,ink,muted} from './draw.ts';
export function thermal(g:CanvasRenderingContext2D) {
  function person(x:number,y:number,raise:number,color:string){circle(g,x,y,20,color);line(g,[[x,y+24],[x,y+100]],color,22);line(g,[[x,y+45],[x-38,y+62],[x-56,y+85]],color,12);line(g,[[x,y+45],[x+36,y+36-raise*35],[x+51,y+60-raise*100]],color,12);line(g,[[x,y+95],[x-25,y+148]],color,14);line(g,[[x,y+95],[x+25,y+148]],color,14);}
  function windowPanel(x:number,t:number,isIR:boolean){const y=240,w=760,h=530,open=.5*seg(t,25,30)*(1-seg(t,55,60));rect(g,x,y,w,h,'#23353e');
    const tree=(tx:number,ty:number)=>{rect(g,tx,ty,15,180,isIR?'#968672':'#6b7a68');poly(g,[[tx-65,ty+80],[tx+7,ty-70],[tx+85,ty+80]],isIR?'#a89070':'#77917c');};
    if(!isIR){rect(g,x+18,y+18,w-36,h-36,'#abc2c2');tree(x+180,y+210);tree(x+490,y+250);rect(g,x+18,y+450,w-36,60,'#668779');}
    else {g.save();g.beginPath();g.rect(x+20,y+20,(w-40)*open,h-40);g.clip();rect(g,x+20,y+20,w-40,h-40,'#54475c');tree(x+180,y+210);tree(x+490,y+250);g.restore();
      g.save();g.beginPath();g.rect(x+20+(w-40)*open,y+20,(w-40)*(1-open),h-40);g.clip();const raise=seg(t,13,15)*(1-seg(t,18,20));person(x+535,y+210,raise,'#dbad7c');g.restore();}
    for(const dx of [0,w-12])rect(g,x+dx,y,12,h,'#d5ddd6');rect(g,x,y,w,12,'#d5ddd6');rect(g,x,y+h-12,w,12,'#d5ddd6');rect(g,x+20+(w-40)*open,y,10,h,'#d5ddd6');
    text(g,isIR?'长波红外 · 预期现象示意':'可见光 · 场景示意',x,y-32,30);if(isIR)text(g,'不含实测温度或传感器数据',x,y+h+43,25,amber);else text(g,'同一窗框 / 同一观察位置',x,y+h+43,25,muted);
    rect(g,x+w/2,y,8,h,'#99adb2');if(open>.45){text(g,'敞开区',x+185,y+h-30,27,ink,'center');text(g,'玻璃覆盖区',x+550,y+h-30,27,ink,'center');}if(t>=25&&t<30)arrow(g,x+100,850,x+290,850,amber);if(t>=55&&t<60)arrow(g,x+290,850,x+100,850,amber);
  }
  return(t:number)=>{rect(g,0,0,1920,1080,'#101c25');rect(g,0,0,1920,83,'#503e2c');text(g,'实验分镜 · 非实测',70,55,32,'#f2c88b');text(g,'待真实机位与连续素材验证',1850,55,25,'#f2c88b','right');
    if(t<38||t>=54){windowPanel(110,t,false);windowPanel(1050,t,true);person(840,730,seg(t,13,15)*(1-seg(t,18,20)),'#e4d7c2');text(g,t>=13&&t<20?'举手 → 反射同步':'窗前观察者',750,920,28,amber);if(t>=24&&t<38)text(g,'只开半扇：同时比较两侧',960,180,38,ink,'center');if(t>=54&&t<64)text(g,'关窗后，差异能否重现？',960,180,38,ink,'center');if(t>=64)text(g,'透明，对哪一种光？',960,175,48,amber,'center');}
    else {text(g,'同一材料，不同波段',110,175,48);rect(g,870,290,90,500,'#577b87');line(g,[[885,300],[885,780]],'#a8ccd3',4);text(g,'普通窗玻璃',915,850,32,ink,'center');
      text(g,'室外',200,270,32,muted);text(g,'室内：人眼 / 热像仪',1370,270,32,muted,'center');
      text(g,'可见光',170,350,40);arrow(g,180,430,865,430,'#c8e0dc',5);arrow(g,967,430,1640,430,'#c8e0dc',5);text(g,'透过 → 人眼',1420,390,30,ink);
      if(t>=44){text(g,'窗前人体的长波红外',1240,560,32,amber);arrow(g,1670,595,965,665,amber,5);arrow(g,965,665,1620,780,amber,5);text(g,'反射 → 热像仪',1370,845,30,amber);}
      if(t>=48){arrow(g,965,730,1230,760,muted,3);text(g,'玻璃自身也有辐射',170,710,31,muted);}
      text(g,'光路关系示意 · 非测量结果',110,930,27,muted);}
  };
}
