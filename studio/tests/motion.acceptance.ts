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
