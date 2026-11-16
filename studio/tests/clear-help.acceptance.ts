import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright-core';
import { createStudio } from '../src/server.ts';
import { ROOT } from '../src/projects.ts';
import { film, cues } from '../research/creative-reset/first-film-v3/motion.ts';

const server = createStudio(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
const browser = await chromium.launch({ headless: true });
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/films/${film.id}/index.html`); await page.waitForFunction(() => window.READY);
  assert.equal(await page.evaluate(() => window.DUR), film.duration);
  assert.deepEqual(await page.evaluate(() => window.EV), cues.map(c => ({ t: c.t, type: c.kind })));
  for (const t of [4.5, 10.2, 17.2, 19.9, 20.85, 22.8, 23.5, 25.8, 27.5, 30]) {
    await page.evaluate(t => window.render(t), t); const frame = await page.locator('canvas').screenshot();
    await page.evaluate(t => { window.render(21); window.render(0); window.render(t); }, t);
    assert.deepEqual(await page.locator('canvas').screenshot(), frame);
  }
  const baseline = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await baseline.goto(`${base}/films/space-for-two-v2/index.html`); await baseline.waitForFunction(() => window.READY);
  for (const t of [1, 8, 15, 16.3]) {
    await page.evaluate(t => window.render(t), t); await baseline.evaluate(t => window.render(t), t);
    assert.deepEqual(await page.locator('canvas').screenshot(), await baseline.locator('canvas').screenshot());
  }
  await baseline.close();
  const blanks = await page.evaluate(() => {
    const bad: number[] = [], canvas = document.querySelector('canvas')!, ctx = canvas.getContext('2d')!;
    for (let f = 0; f < 960; f++) {
      window.render(f / 30);
      const d = ctx.getImageData(780, 490, 380, 220).data;
      let lo = 255, hi = 0;
      for (let i = 0; i < d.length; i += 100) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); }
      if (hi - lo < 50) bad.push(f);
    }
    return bad;
  });
  assert.deepEqual(blanks, []);
  const wav = await fs.readFile(path.join(ROOT, 'films', film.id, 'out/mix.wav'));
  assert.equal(wav.readUInt32LE(24), 48000); assert.equal(wav.length, 44 + film.duration * 48000 * 4);
  await page.goto(`${base}/films/space-for-two-v3-review/index.html`);
  await page.locator('video').first().evaluate(async (v: HTMLVideoElement) => { v.muted = true; await v.play(); });
  await page.waitForFunction(() => { const v = document.querySelector('video')!; return v.currentTime > .5 && v.duration === 32 && v.videoWidth === 1920; });
  await page.locator('video').first().evaluate((v: HTMLVideoElement) => { v.pause(); v.currentTime = 30; v.muted = false; });
  await page.waitForFunction(() => document.querySelector('video')!.readyState >= 2);
  await page.getByRole('button', { name: '从修改段落开始看' }).click();
  await page.waitForFunction(() => { const v = document.querySelector('video')!; return !v.paused && v.currentTime >= 16.7 && v.currentTime < 18; });
  await page.getByRole('button', { name: '静音复看' }).click();
  assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#current').evaluate((v: HTMLVideoElement) => v.muted), true);
  await page.getByRole('button', { name: '恢复声音' }).click();
  assert.equal(await page.locator('#current').evaluate((v: HTMLVideoElement) => v.muted), false);
  await page.locator('#current').evaluate((v: HTMLVideoElement) => v.pause());
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('details').nth(2).locator('summary').click();
  for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate((i: HTMLImageElement) => i.decode()); }
  assert.equal(await page.locator('video').count(), 3);
  const oldVideo = await page.request.get(`${base}/films/space-for-two-proof/out/film.mp4`, { headers: { Range: 'bytes=0-1023' } });
  assert.equal(oldVideo.status(), 206);
  assert.deepEqual(errors, []);
  console.log('PASS 960 nonblank frames, deterministic seeking, cue agreement, audio duration, playback/seeking, review images, mobile layout, three-version comparison, replay/mute controls and byte-range playback. Audience/artistic evaluation remains pending.');
} finally { await browser.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
