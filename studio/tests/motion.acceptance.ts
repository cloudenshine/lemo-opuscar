import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright-core';
import { createStudio } from '../src/server.ts';
import { createProject, PERSONAL_STYLES, DEFAULT_CONTENT } from '../src/projects.ts';

const films = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-motion-'));
const server = createStudio({ films }); server.listen(0, '127.0.0.1'); await once(server, 'listening');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:Parameters<HTMLCanvasElement['getContext']>){
      const result=Reflect.apply(original,this,args);
      if(args[0]==='webgl2'&&result instanceof WebGL2RenderingContext)(window as Window & {__testGpu?:WebGL2RenderingContext}).__testGpu=result;
      return result;
    } as HTMLCanvasElement['getContext'];
  });
  for (const style of PERSONAL_STYLES) {
    await createProject(style, DEFAULT_CONTENT, films, style);
    await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/films/${style}/index.html`);
    await page.waitForFunction(() => window.READY);
    const timing = await page.evaluate(() => ({ duration: window.DUR, shots: window.SHOTS, events: window.EV }));
    assert.equal(timing.duration, 24);
    assert.ok(timing.shots.length >= 4);
    assert.equal(timing.shots[0].start, 0); assert.equal(timing.shots.at(-1)!.end, 24);
    for (const [i, shot] of timing.shots.entries()) {
      assert.ok(shot.end > shot.start);
      if (i) assert.equal(shot.start, timing.shots[i - 1].end);
    }
    assert.ok(new Set(timing.shots.map(s => s.move)).size >= 4);
    for (const event of timing.events) { assert.ok(event.t >= 0 && event.t < 24); assert.ok(Math.abs(event.t * 24 - Math.round(event.t * 24)) < 1e-7); }
    assert.equal(timing.events.filter(e => e.type === 'silence').length, 2);
    for (const at of [3, 7.5, 14.5, 20.5]) {
      await page.evaluate(t => window.render(t), at);
      const first = await page.locator('canvas').screenshot();
      await page.evaluate(t => { window.render(23); window.render(1); window.render(t); }, at);
      assert.deepEqual(await page.locator('canvas').screenshot(), first, `${style} ${at}s frame-order independence`);
    }


    // Keep the full trajectory audit in the browser; transfer only its compact findings.
    const findings = await page.evaluate(style => {
      const samples = Array.from({length:577},(_,i)=>window.PERFORMANCE(i/24));
      const errors = new Set<string>();
      const check = (ok: boolean, name: string) => {if(!ok) errors.add(name);};
      for(let i=1;i<samples.length;i++) for(const actor of samples[i-1].actors.filter(a=>a.id!=='pointer')) {
        const next=samples[i].actors.find(a=>a.id===actor.id);
        check(Boolean(next),'persistent identity');
        if(next) check(Math.hypot(next.x-actor.x,next.y-actor.y)<85,'world motion continuity');
      }
      if(style==='cloud-ink') {
        const normal=window.BEHAVIOR!(24),silent=window.BEHAVIOR!(24,{call:false}),absent=window.BEHAVIOR!(24,{late:false}),delayed=window.BEHAVIOR!(24,{lateAt:12.5});
        check(silent.actors.find(a=>a.id==='companion')!.state==='hidden'&&!silent.events.some(e=>e.type==='answer'),'response requires perceived call');
        check(!absent.events.some(e=>e.type==='yield-hop'),'yield requires occupied perch request');
        check(delayed.events.find(e=>e.type==='yield-hop')!.t>normal.events.find(e=>e.type==='yield-hop')!.t,'late arrival shifts causal yield');
        check(JSON.stringify(window.BEHAVIOR!(24))===JSON.stringify(normal),'alternative simulations do not mutate baseline');
        for(const options of [{},{call:false},{late:false},{lateAt:12.5}])for(let f=0;f<=576;f++) {
          const actors=window.BEHAVIOR!(f/24,options).actors.filter(a=>['perched','approach','yield'].includes(a.state));
          check(new Set(actors.map(a=>a.seat)).size===actors.length,'exclusive perch reservations');
        }
        for(const frame of [102,120,240,456]) {const [bird,branch]=samples[frame].actors;check(bird.footY===branch.y&&bird.footX===branch.x&&bird.land===true,'planted contact');}
        for(const sample of samples) {
          const b=sample.actors[0], other=sample.actors.find(a=>a.id==='companion')!;
          check(Math.abs(Math.hypot(Number(b.hx)-Number(b.kx),Number(b.hy)-Number(b.ky))-19)<1e-6,'upper leg length');
          check(Math.abs(Math.hypot(Number(b.fx)-Number(b.kx),Number(b.fy)-Number(b.ky))-19)<1e-6,'lower leg length');
          if(other.visible) {check(Math.hypot(b.x-other.x,b.y-other.y)>55,'body separation');check(Math.abs(Number(other.facing))>=.5,'companion keeps body volume');}
        }
        for(const sample of samples.slice(210,247)) {const other=sample.actors.find(a=>a.id==='companion')!;check(Number(other.screenX)-100*Number(other.screenScale)>480,'arrival clears inscription column');}
        for(const sample of samples) {
          const flock=sample.actors.filter(a=>a.id!=='perch'&&(a.visible===undefined||a.visible));
          for(let i=0;i<flock.length;i++)for(let j=i+1;j<flock.length;j++)check(Math.hypot(flock[i].x-flock[j].x,flock[i].y-flock[j].y)>55,'ensemble body spacing');
        }
        check(samples[288].actors.filter(a=>a.id!=='perch').length===4,'four persistent performers');
        const before=samples[258].actors.find(a=>a.id==='companion')!,after=samples[276].actors.find(a=>a.id==='companion')!;
        check(after.x<before.x-30&&samples[267].actors.find(a=>a.id==='companion')!.land===false,'yield hop responds to late entry');
        check(samples[516].actors.find(a=>a.id==='lookout')!.land===false&&samples[528].actors.find(a=>a.id==='latecomer')!.land===true,'relay departure order');
        const answer=samples[288].actors.find(a=>a.id==='companion')!;
        check(answer.facing===-1&&answer.footY===680,'answer faces caller on separate perch');
        check(samples[510].actors[0].land===false&&samples[504].actors.find(a=>a.id==='companion')!.land===true,'staggered departure');
        check(samples[168].actors[0].land===false&&samples[168].actors[0].y<samples[156].actors[0].y-30&&samples[180].actors[0].land===true,'hop release and landing');
        check(Number(samples[408].actors[0].head)<Number(samples[336].actors[0].head),'gaze follows leaf');
        check(samples[552].actors[0].y<samples[492].actors[0].y-200,'upward departure');
      } else if(style==='dark-product') {
        for(let i=0;i<samples.length;i++) {
          const sample=samples[i],h=sample.actors[0];
          check(new Set(sample.actors.filter(a=>a.id!=='pointer').map(a=>a.id)).size===108,'108 identities');
          check(Number(h.screenX)-Number(h.w)*Number(h.screenScale)/2>=64&&Number(h.screenX)+Number(h.w)*Number(h.screenScale)/2<=1856,'hero stays horizontally framed');
          check(Number(h.screenY)-Number(h.h)*Number(h.screenScale)/2>=260&&Number(h.screenY)+Number(h.h)*Number(h.screenScale)/2<=940,'hero stays vertically framed');
          for(const actor of sample.actors) {
            if(actor.id.startsWith('cloud-')) check(actor.y-Number(actor.h)/2>=260&&actor.y+Number(actor.h)/2<=940,'world stage bounds');
            check(Number(actor.depth)>100&&Number.isFinite(Number(actor.screenScale)),'near plane safety');
            if(i&&actor.id!=='pointer') {const prev=samples[i-1].actors.find(a=>a.id===actor.id)!;check(Math.hypot(Number(actor.screenX)-Number(prev.screenX),Number(actor.screenY)-Number(prev.screenY))<120,'projected continuity');}
          }
        }
        for(const t of [6,7,8]) {const [h,c]=window.PERFORMANCE(t).actors;
          check(c.held===true&&c.x-h.x===30&&c.y-h.y===-20,'world drag contact');
          const mesh=window.SOLIDS!(t).find(m=>m.id==='task-4')!,u=.5+30/Number(h.w),v=.5-20/Number(h.h);
          const [a,b,,d]=mesh.front,weights=[1-u-v,u,v],points=[a,b,d],depth=points.reduce((n,p,i)=>n+p[2]*weights[i],0);
          const x=points.reduce((n,p,i)=>n+p[0]*p[2]*weights[i],0)/depth,y=points.reduce((n,p,i)=>n+p[1]*p[2]*weights[i],0)/depth;
          check(Math.hypot(Number(c.screenX)-x,Number(c.screenY)-y)<1e-6,'projected surface drag contact');
        }
        check(samples[204].actors[1].held===false,'release cue');
        for(let frame=0;frame<=576;frame++) {
          const meshes=window.SOLIDS!(frame/24);check(meshes.length===108,'108 solid meshes');
          for(const mesh of meshes) {
            check(mesh.vertices.length===8&&mesh.faces.length===6,'closed box topology');
            for(let i=0;i<4;i++)check(Math.abs(Math.hypot(...mesh.vertices[i].map((v,k)=>v-mesh.vertices[i+4][k]))-mesh.thickness)<1e-6,'solid thickness');
            check(mesh.front.every(p=>p.every(Number.isFinite)&&p[2]>100),'finite visible geometry');
            if(mesh.id==='task-4')check(mesh.front.every(p=>p[0]>=64&&p[0]<=1856&&p[1]>=260&&p[1]<=940),'projected hero corners stay framed');
          }
        }
        const depths=[0,3,7,10,19.5].map(t=>{const f=window.SOLIDS!(t).find(m=>m.id==='task-4')!.front;return Math.max(...f.map(p=>p[2]))-Math.min(...f.map(p=>p[2]));});
        check(Math.max(...depths)>30,'front has perspective depth across the camera route');
        const reading=window.SOLIDS!(15).find(m=>m.id==='task-4')!.front;check(Math.max(...reading.map(p=>p[2]))-Math.min(...reading.map(p=>p[2]))<1e-6,'reading surface faces camera');
        const rigs=[0,3.5,10.5,14,19.5].map(t=>window.CAMERA!(t));
        check(Math.max(...rigs.map(r=>r.yaw))-Math.min(...rigs.map(r=>r.yaw))>.45,'viewing axis change');
        check(rigs[3].yaw===0&&rigs[3].dolly===0,'locked reading insert');
      } else {
        const chars=[...'天地人山水风雨春ABC'];
        const glyphs=chars.map(ch=>window.GLYPH!(ch));
        check(glyphs.every(g=>!g.missing&&g.paths.length>0&&g.paths.flat(2).every(Number.isFinite)),'unseen glyph extraction');
        check(new Set(glyphs.map(g=>g.maskHash)).size===chars.length,'glyphs preserve distinct font masks');
        check(window.GLYPH!('\uFFFF').missing,'missing glyph is disclosed');
        const a=[[0,0],[100,0]],b=[[0,0],[0,50],[0,100]],mid=window.MORPH_PATH!(a,b,.5);
        check(mid.length===25&&mid.at(-1)![0]===50&&mid.at(-1)![1]===50,'unequal topology paths use arc-length correspondence');
        for(const action of [()=>window.GLYPH!(''),()=>window.GLYPH!(' '),()=>window.MORPH_PATH!([[NaN,0],[1,0]],b,0),()=>window.MORPH_PATH!(a,b,NaN)]){let rejected=false;try{action();}catch{rejected=true;}check(rejected,'malformed glyph and path inputs rejected');}
        const strokes=window.STROKES!(.5);
        check(strokes.length>35&&new Set(strokes.map(s=>s.id)).size===strokes.length,'distinct generated glyph segments');
        check(strokes.filter(s=>s.id.startsWith('opening')).some(s=>s.deformation>.1&&s.progress>0),'strokes actually deform');
        check(window.STROKES!(2).filter(s=>s.id.startsWith('opening')).every(s=>s.progress===1&&s.deformation===0),'opening strokes resolve before reading');
        check(window.STROKES!(21).filter(s=>s.id.startsWith('poster')).every(s=>s.progress===1&&s.deformation===0),'poster strokes fully resolve');
        check(!window.TEXTS(.5).some(b=>b.id==='opening-word')&&!window.TEXTS(20).some(b=>b.id==='poster-word'),'unfinished stroke assemblies are not counted as reading holds');
        const opening=samples[12].actors.filter(a=>a.id.startsWith('opening-'));
        check(opening[0].angle!==opening[1].angle,'independent glyph trajectories');
        const rejected=samples[252].actors.filter(a=>a.id.startsWith('reject-'));
        check(Number(rejected[0].progress)>Number(rejected[5].progress),'ordered character rejection');
        const landed=samples[492].actors.filter(a=>a.id.startsWith('poster-'));
        check(landed[1].x-landed[0].x===260,'final letter order');
        check(Math.abs(Number(samples[450].actors[1].angle))>1.5,'quarter turn');
        const sizes=[2,5].map(t=>window.TEXTS(t).find(b=>b.id==='opening-word')!);
        check((sizes[0].x1-sizes[0].x0)/(sizes[1].x1-sizes[1].x0)>7,'type scale span');
        const final=window.TEXTS(21);
        check(final.find(b=>b.id==='poster-word')!.y1<final.find(b=>b.id==='claim')!.y0,'poster conclusion spacing');
        check(Number(samples[336].actors[1].w)>1000&&Number(samples[336].actors[0].w)<200,'selected sheet expansion');
      }
      return [...errors];
    },style);
    assert.deepEqual(findings,[],`${style} trajectory audit`);
    if(style==='dark-product') {
      await page.evaluate(()=>window.render(0));const header=await page.screenshot({clip:{x:0,y:0,width:1920,height:240}});
      await page.evaluate(()=>window.render(4));
      assert.ok((await page.screenshot({clip:{x:0,y:0,width:1920,height:240}})).equals(header),'camera content cannot paint over title');
    }
    if(style==='dark-product') {
      const probe=await page.evaluate(()=>({a:window.GPU_PROBE!('order'),b:window.GPU_PROBE!('order-reverse'),left:window.GPU_PROBE!('light-left'),right:window.GPU_PROBE!('light-right'),on:window.GPU_PROBE!('shadow-on'),off:window.GPU_PROBE!('shadow-off')}));
      assert.equal(probe.a.hash,probe.b.hash,'depth result is independent of submission order');
      assert.ok(probe.a.samples[0][0]>probe.a.samples[0][2]&&probe.a.samples[1][2]>probe.a.samples[1][0],'intersecting surfaces change frontmost color');
      assert.notEqual(probe.left.hash,probe.right.hash,'light direction changes shading');
      assert.notEqual(probe.on.hash,probe.off.hash,'caster shadows receiver');
      assert.ok(probe.on.samples[1][0]<probe.off.samples[1][0]-20,'receiver pixel darkens under a separate caster');
      assert.deepEqual(probe.on.samples[2],probe.off.samples[2],'unshadowed receiver stays unchanged');
      for(const p of Object.values(probe))assert.equal(p.error,0,'WebGL error');
    }
    const bad = await page.evaluate(() => {
      const failures: string[] = [];
      for (let t = 0; t < 24; t += .25) for (const b of window.TEXTS(t)) {
        if (![b.x0, b.x1, b.y0, b.y1].every(Number.isFinite) || b.x0 < 0 || b.y0 < 0 || b.x1 > 1920 || b.y1 > 1080) failures.push(`${t}: ${b.id}`);
      }
      return failures;
    });
    assert.deepEqual(bad, [], `${style} transformed text boxes`);
    if(style==='dark-product') {
      await page.evaluate(()=>{const gl=(window as Window & {__testGpu?:WebGL2RenderingContext}).__testGpu!,extension=gl.getExtension('WEBGL_lose_context')!;(window as Window & {__testLoss?:WEBGL_lose_context}).__testLoss=extension;extension.loseContext();});
      await page.waitForFunction(()=>!window.READY&&Boolean(document.querySelector('#graphics-error')));
      assert.ok(await page.evaluate(()=>{try{window.render(15);return false;}catch{return true;}}),'lost contexts reject blank-frame rendering');
      await page.evaluate(()=>(window as Window & {__testLoss?:WEBGL_lose_context}).__testLoss!.restoreContext());
      await page.waitForFunction(()=>window.READY&&!document.querySelector('#graphics-error'));
      assert.equal(await page.evaluate(()=>window.GPU_PROBE!('order').error),0,'context restore rebuilds rendering resources');
    }
    console.log(`PASS ${style}: shot continuity, frame cues, two pauses, transformed bounds and shuffled frame determinism`);
  }
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise<void>(r => server.close(() => r()));
  await fs.rm(films, { recursive: true, force: true });
}
