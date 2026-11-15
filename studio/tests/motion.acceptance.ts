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
        for(const frame of [102,120,240,456]) {const [bird,branch]=samples[frame].actors;check(bird.footY===branch.y&&bird.footX===branch.x&&bird.land===true,'planted contact');}
        for(const sample of samples) {
          const b=sample.actors[0], other=sample.actors.find(a=>a.id==='companion')!;
          check(Math.abs(Math.hypot(Number(b.hx)-Number(b.kx),Number(b.hy)-Number(b.ky))-19)<1e-6,'upper leg length');
          check(Math.abs(Math.hypot(Number(b.fx)-Number(b.kx),Number(b.fy)-Number(b.ky))-19)<1e-6,'lower leg length');
          if(other.visible) {check(Math.hypot(b.x-other.x,b.y-other.y)>55,'body separation');check(Math.abs(Number(other.facing))>=.5,'companion keeps body volume');}
        }
        for(const sample of samples.slice(210,247)) {const other=sample.actors.find(a=>a.id==='companion')!;check(Number(other.screenX)-100*Number(other.screenScale)>480,'arrival clears inscription column');}
        const answer=samples[258].actors.find(a=>a.id==='companion')!;
        check(answer.facing===-1&&answer.footY===550,'answer faces caller on separate perch');
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
          check(Math.abs((Number(c.screenX)-Number(h.screenX))/Number(h.screenScale)-30)<1e-7,'projected drag contact');
        }
        check(samples[204].actors[1].held===false,'release cue');
        const rigs=[0,3.5,10.5,14,19.5].map(t=>window.CAMERA!(t));
        check(Math.max(...rigs.map(r=>r.yaw))-Math.min(...rigs.map(r=>r.yaw))>.45,'viewing axis change');
        check(rigs[3].yaw===0&&rigs[3].dolly===0,'locked reading insert');
      } else {
        const opening=samples[12].actors.filter(a=>a.id.startsWith('opening-'));
        check(opening[0].angle!==opening[1].angle,'independent glyph trajectories');
        const rejected=samples[252].actors.filter(a=>a.id.startsWith('reject-'));
        check(Number(rejected[0].progress)>Number(rejected[5].progress),'ordered character rejection');
        const landed=samples[492].actors.filter(a=>a.id.startsWith('poster-'));
        check(landed[1].x-landed[0].x===260,'final letter order');
        check(Math.abs(Number(samples[450].actors[1].angle))>1.5,'quarter turn');
        const sizes=[0,5].map(t=>window.TEXTS(t).find(b=>b.id==='opening-word')!);
        check((sizes[0].x1-sizes[0].x0)/(sizes[1].x1-sizes[1].x0)>7,'type scale span');
        const final=window.TEXTS(20);
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
    const bad = await page.evaluate(() => {
      const failures: string[] = [];
      for (let t = 0; t < 24; t += .25) for (const b of window.TEXTS(t)) {
        if (![b.x0, b.x1, b.y0, b.y1].every(Number.isFinite) || b.x0 < 0 || b.y0 < 0 || b.x1 > 1920 || b.y1 > 1080) failures.push(`${t}: ${b.id}`);
      }
      return failures;
    });
    assert.deepEqual(bad, [], `${style} transformed text boxes`);
    console.log(`PASS ${style}: shot continuity, frame cues, two pauses, transformed bounds and shuffled frame determinism`);
  }
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise<void>(r => server.close(() => r()));
  await fs.rm(films, { recursive: true, force: true });
}
