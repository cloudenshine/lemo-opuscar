import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright-core';
import { createStudio } from '../src/server.ts';
import { ROOT } from '../src/projects.ts';
import { study } from '../research/creative-reset/proof/model.ts';

const server = createStudio(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/films/${study.id}/index.html`);
  await page.waitForFunction(() => window.READY);
  assert.equal(await page.evaluate(() => window.DUR), 16);
  assert.deepEqual(await page.evaluate(() => window.EV), study.cues.map(c => ({ t: c.frame / study.fps, type: c.kind })));
  for (const t of [1.5, 7.5, 12]) {
    await page.evaluate(t => window.render(t), t); const first = await page.locator('canvas').screenshot();
    await page.evaluate(t => { window.render(15); window.render(.1); window.render(t); }, t);
    assert.deepEqual(await page.locator('canvas').screenshot(), first);
  }
  const bounds = await page.evaluate(() => {
    const failures: string[] = [];
    for (let t = 0; t < 16; t += .25) for (const b of window.TEXTS(t)) if (![b.x0, b.x1, b.y0, b.y1].every(Number.isFinite) || b.x0 < 0 || b.x1 > 1920 || b.y0 < 0 || b.y1 > 1080) failures.push(`${t}:${b.id}`);
    return failures;
  });
  assert.deepEqual(bounds, []); assert.deepEqual(errors, []);
  const wav = await fs.readFile(path.join(ROOT, 'films', study.id, 'out/mix.wav'));
  assert.equal(wav.readUInt32LE(24), 48000); assert.equal(wav.length, 44 + 16 * 48000 * 4);
  assert.ok(wav.subarray(44 + 7 * 48000 * 4, 44 + 9 * 48000 * 4).every(v => v === 0));
  await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/films/creative-reset-study/index.html`);
  await page.locator('video').evaluate(async (v: HTMLVideoElement) => { v.muted = true; await v.play(); });
  await page.waitForFunction(() => { const v = document.querySelector('video')!; return v.currentTime > .5 && v.duration === 16 && v.videoWidth === 1920; });
  await page.locator('video').evaluate((v: HTMLVideoElement) => v.pause());
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log('PASS study evidence, cue agreement, deterministic frames, reading bounds and literal silence; artistic hypotheses remain untested');
} finally { await browser.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
