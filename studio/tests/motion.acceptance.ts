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

    const performance = await page.evaluate(() => {
      const at = (t: number) => window.PERFORMANCE(t);
      return { samples: Array.from({length: 577}, (_,i) => at(i/24)), drag: [6,7,8].map(at), contact: [4.25,5,10,19].map(at) };
    });
    for (let i=1;i<performance.samples.length;i++) {
      for(const a of performance.samples[i-1].actors.filter(actor=>actor.id!=='pointer')) {
        const b=performance.samples[i].actors.find(actor=>actor.id===a.id);
        assert.ok(b,`${style} protagonist identity`);
        assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<85,`${style} ${a.id} teleport at frame ${i}`);
      }
    }
    if(style==='cloud-ink') {
      for(const p of performance.contact) {const [bird,branch]=p.actors;assert.equal(bird.footY,branch.y);assert.equal(bird.footX,branch.x);assert.equal(bird.land,true);}
      for(const sample of performance.samples) {const b=sample.actors[0];
        assert.ok(Math.abs(Math.hypot(Number(b.hx)-Number(b.kx),Number(b.hy)-Number(b.ky))-19)<1e-6,'upper leg length');
        assert.ok(Math.abs(Math.hypot(Number(b.fx)-Number(b.kx),Number(b.fy)-Number(b.ky))-19)<1e-6,'lower leg length');
      }
      assert.equal(performance.samples[168].actors[0].land,false,'hop releases contact');
      assert.ok(performance.samples[168].actors[0].y<performance.samples[156].actors[0].y-30,'hop clears the branch');
      assert.equal(performance.samples[180].actors[0].land,true,'hop lands');
      assert.ok(Number(performance.samples[408].actors[0].head)<Number(performance.samples[336].actors[0].head),'gaze follows falling leaf down');
      assert.ok(performance.samples[552].actors[0].y<performance.samples[492].actors[0].y-200,'bird departs upward');
    } else if(style==='dark-product') {
      for(const sample of performance.samples) for(const card of sample.actors.filter(a=>a.id.startsWith('cloud-'))) {
        assert.ok(card.y-Number(card.h)/2>=260 && card.y+Number(card.h)/2<=940,'projected cards must not cover the headline or footer');
      }
      for(const sample of performance.samples) assert.equal(new Set(sample.actors.filter(a=>a.id!=='pointer').map(a=>a.id)).size,108,'108 persistent unique objects');
      for(const p of performance.drag) {const [card,cursor]=p.actors;assert.equal(cursor.held,true);assert.equal(cursor.x-card.x,30);assert.equal(cursor.y-card.y,-20);}
      assert.equal(performance.samples[204].actors[1].held,false,'release at the drop cue');
    } else {
      assert.ok(Math.abs(Number(performance.samples[450].actors[1].angle))>1.5,'poster quarter-turn');
      const typeSizes=await page.evaluate(()=>[0,5].map(t=>window.TEXTS(t).find(b=>b.id==='opening-word')!));
      const finalType=await page.evaluate(()=>window.TEXTS(20));
      assert.ok(finalType.find(b=>b.id==='poster-word')!.y1<finalType.find(b=>b.id==='claim')!.y0,'poster word leaves space for the conclusion');
      assert.ok((typeSizes[0].x1-typeSizes[0].x0)/(typeSizes[1].x1-typeSizes[1].x0)>7,'typography scale range');
      assert.ok(Number(performance.samples[336].actors[1].w)>1000,'chosen paper expands');
      assert.ok(Number(performance.samples[336].actors[0].w)<200,'unselected material retreats');
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
