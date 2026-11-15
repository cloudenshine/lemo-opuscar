const canvas = document.querySelector('canvas')!;
canvas.width = 1920; canvas.height = 1080;
let ctx = canvas.getContext('2d')!;
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
  const q = 0, depth = Math.floor(i/27);
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
  return {x:lerp(lerp(x,960,open),960,close),y:lerp(lerp(y,555,open),570,close),w:lerp(lerp(start.w,360,p),1120,open)*(1-.45*close),h:lerp(lerp(start.h,230,p),570,open)*(1-.45*close),z:lerp(start.z,650,p)};
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

function cameraRig(t: number) {
  if(t<6) {
    const p=smooth(t/3.5), focus=smooth((t-2)/1.5);
    return {yaw:-.28+.5*p,pitch:.14-.2*p,truck:-60+120*p,crane:-25+60*p,dolly:90-130*p,focus:1500-800*focus};
  }
  if(t<9) {
    const p=smooth((t-6)/3), arc=Math.sin(Math.PI*p);
    return {yaw:.22*(1-p)+.08*arc,pitch:-.06*(1-p)+.1*arc,truck:60*(1-p)+100*arc,crane:35*(1-p)-35*arc,dolly:-40*(1-p)-60*arc,focus:700};
  }
  if(t<12) {const arc=Math.sin(Math.PI*smooth((t-9)/3));return {yaw:-.12*arc,pitch:.16*arc,truck:80*arc,crane:-55*arc,dolly:-45*arc,focus:650};}
  if(t<12.75) {const arc=Math.sin(Math.PI*smooth((t-12)/.75));return {yaw:.03*arc,pitch:0,truck:0,crane:0,dolly:-30*arc,focus:650};}
  if(t>=18&&t<21) {const arc=Math.sin(Math.PI*smooth((t-18)/3));return {yaw:.2*arc,pitch:-.1*arc,truck:160*arc,crane:-45*arc,dolly:-70*arc,focus:650};}
  return {yaw:0,pitch:0,truck:0,crane:0,dolly:0,focus:650};
}
function projectPose(t: number, p: Pose) {
  const rig=cameraRig(t), wx=(p.x-960)*p.z/700-rig.truck,wy=(p.y-590)*p.z/700-rig.crane,wz=p.z-800;
  const rx=Math.cos(rig.yaw)*wx-Math.sin(rig.yaw)*wz,rz=Math.sin(rig.yaw)*wx+Math.cos(rig.yaw)*wz;
  const ry=Math.cos(rig.pitch)*wy-Math.sin(rig.pitch)*rz;
  const depth=Math.sin(rig.pitch)*wy+Math.cos(rig.pitch)*rz+800+rig.dolly;
  const scale=p.z/depth;
  return {x:960+rx*700/depth,y:590+ry*700/depth,w:p.w*scale,h:p.h*scale,z:depth,scale};
}
type Point3 = [number,number,number];
function objectAngles(t: number, id: number) {
  const inspect=smooth((t-11.5)/1.25), resolve=smooth((t-18)/3);
  return id===4?{yaw:.32*Math.sin(Math.PI*smooth(t/12))+.24*Math.sin(Math.PI*resolve),pitch:.12*Math.sin(Math.PI*smooth(t/12))}:
    {yaw:(id%7-3)*.16*(1-inspect)+.16*(id%2?1:-1)*resolve,pitch:(id%3-1)*.12*(1-inspect)};
}
function surfacePoint(t: number,p: Pose,id: number,u: number,v: number,back=0) {
  const a=objectAngles(t,id), rig=cameraRig(t),x=(u-.5)*p.w*p.z/700,y=(v-.5)*p.h*p.z/700;
  const rx=Math.cos(a.yaw)*x+Math.sin(a.yaw)*back,rz=-Math.sin(a.yaw)*x+Math.cos(a.yaw)*back;
  const ry=Math.cos(a.pitch)*y-Math.sin(a.pitch)*rz,zz=Math.sin(a.pitch)*y+Math.cos(a.pitch)*rz;
  const world: Point3=[(p.x-960)*p.z/700+rx,(p.y-590)*p.z/700+ry,p.z+zz];
  const wx=world[0]-rig.truck,wy=world[1]-rig.crane,wz=world[2]-800;
  const cx=Math.cos(rig.yaw)*wx-Math.sin(rig.yaw)*wz,cz=Math.sin(rig.yaw)*wx+Math.cos(rig.yaw)*wz;
  const cy=Math.cos(rig.pitch)*wy-Math.sin(rig.pitch)*cz,depth=Math.sin(rig.pitch)*wy+Math.cos(rig.pitch)*cz+800+rig.dolly;
  return {world,screen:[960+cx*700/depth,590+cy*700/depth,depth] as Point3};
}
const faceIndices=[[0,1,2,3],[7,6,5,4],[1,5,6,2],[4,0,3,7],[4,5,1,0],[3,2,6,7]];
function solid(t: number,p: Pose,id: number) {
  const thickness=id===4?26:id===999?55:18;
  const points=[0,thickness].flatMap(z=>[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>surfacePoint(t,p,id,u,v,z)));
  return {id:id===4?'task-4':id===999?'library':`cloud-${id}`,vertices:points.map(p=>p.world),front:points.slice(0,4).map(p=>p.screen),
    screens:points.map(p=>p.screen),faces:faceIndices,depth:points.reduce((a,p)=>a+p.screen[2],0)/8,thickness};
}
function screenPointer(t: number) {
  const p=pointer(t),h=hero(t),projected=surfacePoint(t,h,4,.5+(p.x-h.x)/h.w,.5+(p.y-h.y)/h.h).screen;
  return {...p,x:projected[0],y:projected[1],scale:700/projected[2]};
}
window.SOLIDS=t=>Array.from({length:CARD_COUNT},(_,i)=>solid(t,i===4?hero(t):recordPose(t,i),i));
const heroTexture=document.createElement('canvas');heroTexture.width=1120;heroTexture.height=570;
const libraryTexture=document.createElement('canvas');libraryTexture.width=470;libraryTexture.height=530;
function texture(t: number,p: Pose,id: number) {
  const target=id===4?heroTexture:libraryTexture, main=ctx,first=boxes.length;
  ctx=target.getContext('2d')!;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,target.width,target.height);
  if(id===999) {text('library','资料库',40,60,32,C.accent);}
  else {
    ctx.fillStyle='#1d2840';ctx.fillRect(0,0,1120,570);ctx.strokeStyle=C.accent;ctx.lineWidth=3;ctx.strokeRect(6,6,1108,558);
    if(t>=12.75) {
      text('task-name','研究札记',42,65,40,C.accent,600);text('task-title','把灵感整理成提案',42,155,54,C.ink,600);
      text('task-source','来源：自己的阅读与观察',42,230,40,C.muted);line(42,275,1036,'#36435e',1);
      if(t>=14){text('result','已定位 · 来源完整',42,365,40,C.accent);line(42,397,430*ease((t-14)/.7),C.accent,3);}
      panel(850,415,220,98,12,t>=13.5?'#344665':'#263751');text('search','检索',905,478,40);
    } else {line(70,110,220,C.accent,15);line(70,220,750,'#384256',12);line(70,320,480,'#384256',12);}
  }
  const local=boxes.splice(first);ctx=main;
  for(const b of local) {
    const corners=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]].map(([x,y])=>surfacePoint(t,p,id,x/target.width,y/target.height).screen);
    boxes.push({...b,x0:Math.min(...corners.map(p=>p[0])),y0:Math.min(...corners.map(p=>p[1])),x1:Math.max(...corners.map(p=>p[0])),y1:Math.max(...corners.map(p=>p[1]))});
  }
  return target;
}
const gpu=document.createElement('canvas');gpu.width=1920;gpu.height=1080;
const gl=gpu.getContext('webgl2',{alpha:true,antialias:false,preserveDrawingBuffer:true});
if(!gl)throw new Error('WebGL2 is required for depth-tested lighting');
const G=gl;
gpu.addEventListener('webglcontextlost',event=>{
 event.preventDefault();window.READY=false;
 let notice=document.querySelector<HTMLElement>('#graphics-error');
 if(!notice){notice=document.createElement('div');notice.id='graphics-error';notice.setAttribute('role','alert');notice.style.cssText='position:fixed;inset:0;display:grid;place-items:center;background:#111827;color:white;font:20px sans-serif';document.body.append(notice);}
 notice.textContent='图形渲染暂时中断，正在恢复；若未恢复，请刷新预览。';
});
gpu.addEventListener('webglcontextrestored',()=>location.reload());
const vertexSource=`#version 300 es
precision highp float;
in vec3 aWorld;in vec4 aClip;in vec3 aNormal;in vec2 aUV;
uniform mat4 uLightMatrix;uniform bool uShadowPass;
out vec3 vWorld;out vec3 vNormal;out vec2 vUV;out vec4 vLight;
void main(){vWorld=aWorld;vNormal=aNormal;vUV=aUV;vLight=uLightMatrix*vec4(aWorld,1.);gl_Position=uShadowPass?vLight:aClip;}`;
const fragmentSource=`#version 300 es
precision highp float;
in vec3 vWorld;in vec3 vNormal;in vec2 vUV;in vec4 vLight;
uniform sampler2D uImage;uniform sampler2D uDepth;
uniform bool uShadowPass;uniform bool uTextured;uniform bool uLines;uniform bool uShadows;
uniform vec3 uBase;uniform vec3 uLight;uniform float uEmission;
out vec4 color;
void main(){
 vec4 tex=uTextured?texture(uImage,vUV):vec4(uBase,1.);if(tex.a<.02)discard;
 if(uShadowPass){color=vec4(0.);return;}
 vec3 n=normalize(vNormal),l=normalize(uLight);float diffuse=max(dot(n,l),0.);
 vec3 q=vLight.xyz/vLight.w*.5+.5;float visibility=1.;
 if(uShadows&&all(greaterThan(q,vec3(0.)))&&all(lessThan(q,vec3(1.)))){
  float sum=0.;float bias=.002+.003*(1.-diffuse);
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){float d=texture(uDepth,q.xy+vec2(x,y)/1024.).r;sum+=q.z-bias<=d?1.:0.;}visibility=sum/9.;
 }
 vec3 base=tex.rgb;
 if(uLines){
  bool label=vUV.x>.1&&vUV.x<.3&&abs(vUV.y-.24)<.018;
  bool row=vUV.x>.1&&((vUV.x<.78&&abs(vUV.y-.48)<.014)||(vUV.x<.53&&abs(vUV.y-.72)<.014));
  if(label)base=vec3(.4,.46,.58);else if(row)base=vec3(.2,.25,.34);
 }
 float edge=min(min(vUV.x,1.-vUV.x),min(vUV.y,1.-vUV.y));if(!uTextured&&edge<.012)base+=vec3(.055,.065,.085);
 vec3 view=normalize(vec3(0.,0.,-600.)-vWorld),halfway=normalize(l+view);
 float spec=pow(max(dot(n,halfway),0.),28.)*.11*visibility;
 float fill=.12*max(dot(n,normalize(vec3(.7,.2,-.4))),0.);
 vec3 lit=base*(.32+fill+.73*diffuse*visibility)+vec3(.55,.64,1.)*spec;
 color=vec4(mix(lit,base,uEmission),tex.a);
}`;
function shader(type:number,source:string){const sh=G.createShader(type)!;G.shaderSource(sh,source);G.compileShader(sh);if(!G.getShaderParameter(sh,G.COMPILE_STATUS))throw new Error(G.getShaderInfoLog(sh)||'Shader compilation failed');return sh;}
const program=G.createProgram()!;G.attachShader(program,shader(G.VERTEX_SHADER,vertexSource));G.attachShader(program,shader(G.FRAGMENT_SHADER,fragmentSource));G.linkProgram(program);
if(!G.getProgramParameter(program,G.LINK_STATUS))throw new Error(G.getProgramInfoLog(program)||'Shader linking failed');
const uniform=(name:string)=>G.getUniformLocation(program,name);
const locations=['aWorld','aClip','aNormal','aUV'].map(n=>G.getAttribLocation(program,n));
const depthTexture=G.createTexture()!;G.bindTexture(G.TEXTURE_2D,depthTexture);G.texImage2D(G.TEXTURE_2D,0,G.DEPTH_COMPONENT24,1024,1024,0,G.DEPTH_COMPONENT,G.UNSIGNED_INT,null);
G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.NEAREST);G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MAG_FILTER,G.NEAREST);G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_S,G.CLAMP_TO_EDGE);G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_T,G.CLAMP_TO_EDGE);
const shadowBuffer=G.createFramebuffer()!;G.bindFramebuffer(G.FRAMEBUFFER,shadowBuffer);G.framebufferTexture2D(G.FRAMEBUFFER,G.DEPTH_ATTACHMENT,G.TEXTURE_2D,depthTexture,0);G.drawBuffers([G.NONE]);G.readBuffer(G.NONE);
if(G.checkFramebufferStatus(G.FRAMEBUFFER)!==G.FRAMEBUFFER_COMPLETE)throw new Error('Shadow framebuffer incomplete');G.bindFramebuffer(G.FRAMEBUFFER,null);
const whiteTexture=G.createTexture()!;G.bindTexture(G.TEXTURE_2D,whiteTexture);G.texImage2D(G.TEXTURE_2D,0,G.RGBA,1,1,0,G.RGBA,G.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.LINEAR);G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MAG_FILTER,G.LINEAR);
const imageTextures=new Map<HTMLCanvasElement,WebGLTexture>(),buffers:WebGLBuffer[]=[];
type Batch={values:number[];base:number[];emission:number;lines:boolean;image:HTMLCanvasElement|null};
const unit=(a:number[])=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
const cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a:number[],b:number[])=>a.reduce((sum,v,i)=>sum+v*b[i],0);
function lightMatrix(light:number[]) {
 const z=unit(light),x=unit(cross([0,-1,0],z)),y=cross(z,x),target=[0,0,1000];
 return new Float32Array([x[0]/2200,y[0]/1800,-z[0]/3000,0,x[1]/2200,y[1]/1800,-z[1]/3000,0,x[2]/2200,y[2]/1800,-z[2]/3000,0,-dot(x,target)/2200,-dot(y,target)/1800,dot(z,target)/3000,1]);
}
function appendFace(batch:Batch,world:number[][],screen:number[][]) {
 const a=world[1].map((v,i)=>v-world[0][i]),b=world[2].map((v,i)=>v-world[0][i]),normal=unit(cross(a,b)).map(v=>-v),uv=[[0,0],[1,0],[1,1],[0,1]];
 for(const i of [0,1,2,0,2,3]){const [x,y,z]=screen[i];batch.values.push(...world[i],(x/960-1)*z,(1-y/540)*z,4100/3900*z-800000/3900,z,...normal,...uv[i]);}
}
function renderGPU(batches:Batch[],light:number[],reverse=false,shadows=true) {
 if(G.isContextLost())throw new Error('Graphics context lost; reload preview before rendering');
 G.useProgram(program);G.enable(G.DEPTH_TEST);G.depthFunc(G.LESS);G.disable(G.BLEND);G.disable(G.CULL_FACE);G.depthMask(true);
 G.uniformMatrix4fv(uniform('uLightMatrix'),false,lightMatrix(light));G.uniform3fv(uniform('uLight'),light);G.uniform1i(uniform('uImage'),0);G.uniform1i(uniform('uDepth'),1);G.uniform1i(uniform('uShadows'),shadows?1:0);
 const textures=batches.map((batch,i)=>{
  buffers[i]??=G.createBuffer()!;G.bindBuffer(G.ARRAY_BUFFER,buffers[i]);G.bufferData(G.ARRAY_BUFFER,new Float32Array(batch.values),G.DYNAMIC_DRAW);
  if(!batch.image)return whiteTexture;
  let texture=imageTextures.get(batch.image);if(!texture){texture=G.createTexture()!;imageTextures.set(batch.image,texture);}
  G.activeTexture(G.TEXTURE0);G.bindTexture(G.TEXTURE_2D,texture);G.texImage2D(G.TEXTURE_2D,0,G.RGBA,G.RGBA,G.UNSIGNED_BYTE,batch.image);
  G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MIN_FILTER,G.LINEAR);G.texParameteri(G.TEXTURE_2D,G.TEXTURE_MAG_FILTER,G.LINEAR);G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_S,G.CLAMP_TO_EDGE);G.texParameteri(G.TEXTURE_2D,G.TEXTURE_WRAP_T,G.CLAMP_TO_EDGE);return texture;
 });
 const indices=batches.map((_,i)=>i);if(reverse)indices.reverse();
 for(const shadow of [true,false]) {
  G.activeTexture(G.TEXTURE1);G.bindTexture(G.TEXTURE_2D,shadow?null:depthTexture);
  G.bindFramebuffer(G.FRAMEBUFFER,shadow?shadowBuffer:null);G.viewport(0,0,shadow?1024:1920,shadow?1024:1080);G.clearColor(0,0,0,0);G.clear(G.DEPTH_BUFFER_BIT|(shadow?0:G.COLOR_BUFFER_BIT));G.uniform1i(uniform('uShadowPass'),shadow?1:0);
  for(const i of indices){const batch=batches[i];G.bindBuffer(G.ARRAY_BUFFER,buffers[i]);
   let offset=0;[3,4,3,2].forEach((size,k)=>{G.enableVertexAttribArray(locations[k]);G.vertexAttribPointer(locations[k],size,G.FLOAT,false,48,offset*4);offset+=size;});
   G.uniform3fv(uniform('uBase'),batch.base);G.uniform1f(uniform('uEmission'),batch.emission);G.uniform1i(uniform('uLines'),batch.lines?1:0);G.uniform1i(uniform('uTextured'),batch.image?1:0);
   G.activeTexture(G.TEXTURE0);G.bindTexture(G.TEXTURE_2D,textures[i]);G.drawArrays(G.TRIANGLES,0,batch.values.length/12);
  }
 }
}
function paintWorld(t:number) {
 const groups=new Map<string,Batch>();
 const objects=Array.from({length:CARD_COUNT},(_,id)=>({id,pose:id===4?hero(t):recordPose(t,id)}));
 if(t>=6&&t<12)objects.push({id:999,pose:{x:1510,y:575,w:470,h:530,z:780}});
 for(const {id,pose} of objects){const mesh=solid(t,pose,id),image=id===4||id===999?texture(t,pose,id):null;
  mesh.faces.forEach((indices,face)=>{
   const key=`${id===4?'hero':id===999?'library':'background'}-${face===0?'front':'side'}`;
   let batch=groups.get(key);if(!batch){batch={values:[],base:face===0?[.10,.14,.22]:[.07,.10,.16],emission:id===4&&face===0?.72:.04,lines:id!==4&&id!==999&&face===0,image:face===0?image:null};groups.set(key,batch);}
   appendFace(batch,indices.map(i=>mesh.vertices[i]),indices.map(i=>mesh.screens[i]));
  });
 }
 const light=[-.45+.15*smooth(t/6),-.65,-.8];renderGPU([...groups.values()],light);ctx.drawImage(gpu,0,0);
}
window.GPU_PROBE=mode=>{
 const shadowTest=mode.startsWith('shadow'),batches:Batch[]=[];
 const add=(q:number[][],base:number[])=>{const batch:Batch={values:[],base,emission:mode.startsWith('order')?.85:0,lines:false,image:null};
  appendFace(batch,q.map(([x,y,z])=>[(x-960)*z/700,(y-590)*z/700,z]),q);batches.push(batch);};
 if(shadowTest){add([[400,340,1000],[1500,340,1000],[1500,900,1000],[400,900,1000]],[.5,.5,.5]);add([[700,420,600],[950,420,600],[950,600,600],[700,600,600]],[.1,.3,.9]);}
 else {add([[400,340,600],[1520,340,900],[1520,860,900],[400,860,600]],[.9,.1,.1]);add([[400,340,900],[1520,340,600],[1520,860,600],[400,860,900]],[.1,.1,.9]);}
 renderGPU(batches,mode==='light-right'?[.7,.3,-.5]:[-.45,-.65,-.8],mode==='order-reverse',mode!=='shadow-off');
 const pixels=new Uint8Array(1920*1080*4);G.readPixels(0,0,1920,1080,G.RGBA,G.UNSIGNED_BYTE,pixels);let hash=2166136261;
 for(const v of pixels)hash=Math.imul(hash^v,16777619)>>>0;
 const samples=(shadowTest?[[800,500],[1050,800],[1400,800]]:[[700,600],[1250,600]]).map(([x,y])=>Array.from(pixels.slice(((1079-y)*1920+x)*4,((1079-y)*1920+x)*4+4)));
 return {hash,samples,error:G.getError()};
};
window.CAMERA=cameraRig;
window.PERFORMANCE=t=>{
  const actors=[{id:'task-4',...hero(t)},{id:'pointer',...pointer(t),w:0,h:0,z:hero(t).z},...Array.from({length:CARD_COUNT},(_,i)=>i).filter(i=>i!==4).map(i=>({id:`cloud-${i}`,...recordPose(t,i)}))];
  const cursor=screenPointer(t);
  return {phase:t<6?'orbit through solids':t<9?'tracking':t<12?'crane across library':t<18?'locked insert':'return arc',actors:actors.map(a=>{
    const p=projectPose(t,a);
    return {...a,screenX:a.id==='pointer'?cursor.x:p.x,screenY:a.id==='pointer'?cursor.y:p.y,screenScale:p.scale,depth:p.z};
  })};
};
window.DUR=24;
window.SHOTS=[{start:0,end:6,framing:'depth cloud',move:'camera orbit through solid layers'},{start:6,end:9,framing:'drag',move:'lateral tracking'},{start:9,end:12,framing:'library',move:'crane and side pass'},{start:12,end:18,framing:'source detail',move:'dolly then locked reading'},{start:18,end:24,framing:'workspace',move:'return arc and settle'}];
window.EV=[{t:0,type:'pulse'},{t:2.5,type:'hover'},{t:4.5,type:'grab'},{t:5,type:'silence'},{t:6,type:'sweep'},{t:6.5,type:'route'},{t:7,type:'route'},{t:7.5,type:'route'},{t:8.5,type:'drop'},{t:9,type:'camera-pass'},{t:3.5,type:'depth-turn'},{t:10,type:'depth-turn'},{t:11.75,type:'sweep'},{t:18,type:'camera-return'},{t:13.5,type:'click'},{t:14,type:'search'},{t:17.25,type:'silence'},{t:18,type:'collapse'},{t:19.5,type:'lock'}];
window.render=seconds=>{
  const t=Math.max(0,Math.min(24,seconds));boxes=[];ctx.setTransform(1,0,0,1,0,0);stage();
  text('brand',data.seal,96,94,30,C.accent,600);text('title',data.title,550,94,30);
  text('disclosure','原创概念演示',1530,94,24,C.muted);
  const phase=Math.min(3,Math.floor(t/6));
  text(`heading-${phase}`,['想法很多，线索在哪？','选中它，放回资料库','找到内容，也找到来源','每个想法，都有来处。'][phase],96,210,56,C.ink,600);
  ctx.save();ctx.beginPath();ctx.rect(64,260,1792,680);ctx.clip();
  paintWorld(t);
  const h=projectPose(t,hero(t));
  if(t>=18){
    const q=smooth((t-18)/1.5);ctx.strokeStyle='#a4b2ff88';ctx.lineWidth=2;
    for(const side of [-1,1]){ctx.beginPath();const end=projectPose(t,{x:960+side*700,y:790,w:0,h:0,z:650});ctx.moveTo(h.x+side*h.w/2,h.y);ctx.bezierCurveTo(h.x+side*610*h.scale,h.y,end.x-side*90,end.y,end.x,end.y);ctx.stroke();ctx.beginPath();ctx.arc(end.x,end.y,8*q,0,Math.PI*2);ctx.stroke();}
  }
  if(t>=2&&t<18){const p=screenPointer(t);ctx.save();ctx.translate(p.x,p.y);const press=1-.18*Math.sin(Math.PI*clamp((t-13.5)/.25));ctx.scale(press,press);ctx.fillStyle=p.held?C.accent:'#ffffff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1,34);ctx.lineTo(11,26);ctx.lineTo(20,42);ctx.lineTo(28,37);ctx.lineTo(19,21);ctx.lineTo(32,18);ctx.closePath();ctx.fill();ctx.restore();
    if(t>=4.5&&t<4.9||t>=8.5&&t<8.9||t>=13.5&&t<13.9){const a=t>=13.5?t-13.5:t>=8.5?t-8.5:t-4.5;ctx.strokeStyle=C.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,12+a*75,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();
  text('inscription',data.inscription,96,1015,27,C.muted);
};
window.TEXTS=t=>{window.render(t);return boxes;};window.render(0);window.READY=true;document.querySelector('#loading')?.remove();
export {};
