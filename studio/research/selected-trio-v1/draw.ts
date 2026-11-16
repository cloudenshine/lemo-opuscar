export type TextBox = {id:string;text:string;x0:number;y0:number;x1:number;y1:number};
export const visible: TextBox[] = [];
export const ink = '#edf0e8', muted = '#99adb2', amber = '#efbb71';
export function rect(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string) { g.fillStyle=color;g.fillRect(x,y,w,h); }
export function poly(g:CanvasRenderingContext2D,p:number[][],color:string) { g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill(); }
export function line(g:CanvasRenderingContext2D,p:number[][],color:string,width=2,dash:number[] = []) { g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.setLineDash(dash);g.stroke();g.setLineDash([]); }
export function text(g:CanvasRenderingContext2D,s:string,x:number,y:number,size=28,color=ink,align:CanvasTextAlign='left',register=true) {
  g.font=`${size}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;g.textAlign=align;g.textBaseline='alphabetic';g.fillStyle=color;g.fillText(s,x,y);
  if(register) {const w=g.measureText(s).width, x0=align==='center'?x-w/2:align==='right'?x-w:x, m=g.getTransform(), ratio=1920/g.canvas.width;
    const a=m.transformPoint({x:x0,y:y-size}),b=m.transformPoint({x:x0+w,y:y+size*.25});visible.push({id:s,text:s,x0:a.x*ratio,y0:a.y*ratio,x1:b.x*ratio,y1:b.y*ratio});}
}
export function circle(g:CanvasRenderingContext2D,x:number,y:number,r:number,color:string) {g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=color;g.fill();}
export function arrow(g:CanvasRenderingContext2D,x:number,y:number,x2:number,y2:number,color:string,width=3) {line(g,[[x,y],[x2,y2]],color,width);const a=Math.atan2(y2-y,x2-x),l=14;poly(g,[[x2,y2],[x2-l*Math.cos(a-.45),y2-l*Math.sin(a-.45)],[x2-l*Math.cos(a+.45),y2-l*Math.sin(a+.45)]],color);}
export function background(g:CanvasRenderingContext2D,t:number) {rect(g,0,0,1920,1080,'#0d191f');g.globalAlpha=.17;for(let x=0;x<1920;x+=80)line(g,[[x,0],[x,1080]],'#4c6c75',1);for(let y=0;y<1080;y+=80)line(g,[[0,y],[1920,y]],'#4c6c75',1);g.globalAlpha=1;}
export function ship(g:CanvasRenderingContext2D,x:number,y:number,s=1) {g.save();g.translate(x,y);g.scale(s,s);poly(g,[[-105,-30],[110,-30],[87,0],[-85,0]],'#d8ded9');rect(g,-72,-57,125,26,'#627a80');for(let i=0;i<5;i++)rect(g,-69+i*25,-53,21,18,i%2?'#be9866':'#8b9d97');rect(g,-87,-78,27,48,'#e6e5d5');rect(g,-83,-72,18,9,'#28454e');line(g,[[-110,1],[113,1]],amber,3);g.restore();}
