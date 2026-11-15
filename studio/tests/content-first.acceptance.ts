import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright-core';
import { createStudio } from '../src/server.ts';
import { ROOT } from '../src/projects.ts';
import { film, cues } from '../research/creative-reset/first-film/motion.ts';

const server = createStudio(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
const browser = await chromium.launch({ headless: true });
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/films/${film.id}/index.html`); await page.waitForFunction(() => window.READY);
  assert.equal(await page.evaluate(() => window.DUR), film.duration);
  assert.deepEqual(await page.evaluate(() => window.EV), cues.map(c => ({ t: c.t, type: c.kind })));
  for (const t of [4.5, 7.3, 8.5, 10.2, 11.6, 14.7, 17.5, 21]) {
    await page.evaluate(t => window.render(t), t); const frame = await page.locator('canvas').screenshot();
    await page.evaluate(t => { window.render(21); window.render(0); window.render(t); }, t);
    assert.deepEqual(await page.locator('canvas').screenshot(), frame);
  }
  const blanks = await page.evaluate(() => {
    const bad: number[] = [], canvas = document.querySelector('canvas')!, ctx = canvas.getContext('2d')!;
    for (let f = 0; f < 675; f++) {
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
  await page.goto(`${base}/films/space-for-two-review/index.html`);
  await page.locator('video').evaluate(async (v: HTMLVideoElement) => { v.muted = true; await v.play(); });
  await page.waitForFunction(() => { const v = document.querySelector('video')!; return v.currentTime > .5 && v.duration === 22.5 && v.videoWidth === 1920; });
  await page.locator('video').evaluate((v: HTMLVideoElement) => { v.pause(); v.currentTime = 21; });
  await page.waitForFunction(() => document.querySelector('video')!.readyState >= 2);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('details').nth(2).locator('summary').click();
  for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate((i: HTMLImageElement) => i.decode()); }
  await page.goto(`${base}/films/content-style-atlas/index.html`);
  assert.equal(await page.locator('article:visible').count(), 99);
  await page.getByLabel('按内容或风格搜索').fill('证据');
  assert.ok(await page.locator('article:visible').count() > 0); assert.ok(await page.locator('article:visible').count() < 99);
  await page.getByLabel('按内容或风格搜索').fill(''); await page.getByRole('checkbox').check();
  assert.equal(await page.locator('article:visible').count(), 6);
  await page.getByLabel('类别', { exact: true }).selectOption({ label: '传统工艺' });
  assert.equal(await page.locator('article:visible').count(), 3);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const reference = await page.request.get(`${base}/styles/paper-lantern/STYLE.md`); assert.equal(reference.status(), 200);
  assert.deepEqual(errors, []);
  console.log('PASS 675 nonblank frames, deterministic seeking, cue agreement, audio duration, playback/seeking, review images, mobile layout, 99-style search/category/candidate filters and source link. Audience/artistic evaluation remains pending.');
} finally { await browser.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
