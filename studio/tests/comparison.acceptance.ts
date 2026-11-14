import assert from 'node:assert/strict';
import path from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright-core';
import { createStudio } from '../src/server.ts';
import { ROOT } from '../src/projects.ts';

const server = createStudio(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1512, height: 1150 } });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  await page.goto(base + '/compare');
  await page.locator('#viewer:not([hidden])').waitFor();
  for (const id of ['ink-wash', 'swiss-motion', 'dark-keynote']) {
    await page.locator(`#pairs button[data-id="${id}"]`).click();
    await page.waitForFunction(() => Array.from(document.querySelectorAll('video')).every(v => v.readyState >= 2 && v.duration > 20));
    await page.locator('#position').fill('50'); await page.locator('#position').dispatchEvent('input');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('video')).every(v => !v.seeking && Math.abs(v.currentTime / v.duration - .5) < .01));
    await page.locator('#audio').selectOption('personal');
    assert.deepEqual(await page.locator('video').evaluateAll(videos => videos.map(v => (v as HTMLVideoElement).muted)), [true, false]);
    await page.locator('#audio').selectOption('original');
    assert.deepEqual(await page.locator('video').evaluateAll(videos => videos.map(v => (v as HTMLVideoElement).muted)), [false, true]);
    await page.locator('#audio').selectOption('silent');
    for (const video of ['original', 'personal']) {
      await page.locator(`#${video}`).evaluate(async (v: HTMLVideoElement) => { v.currentTime = 0; await v.play(); });
      await page.waitForFunction(id => (document.getElementById(id) as HTMLVideoElement).currentTime > .4, video);
      await page.locator(`#${video}`).evaluate((v: HTMLVideoElement) => v.pause());
    }
    await page.locator('#position').fill(id === 'ink-wash' ? '62' : '38'); await page.locator('#position').dispatchEvent('input');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('video')).every(v => !v.seeking));
    await page.screenshot({ path: path.join(ROOT, `.studio/comparison/${id}-page.png`) });
  }
  await page.locator('summary').click();
  await page.waitForFunction(() => Array.from(document.querySelectorAll('figure img')).every(i => (i as HTMLImageElement).naturalWidth > 0));
  const range = await page.request.get(base + '/comparison-media/dark-keynote.mp4', { headers: { Range: 'bytes=0-1023' } });
  assert.equal(range.status(), 206); assert.equal((await range.body()).length, 1024);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(ROOT, '.studio/comparison/mobile.png') });
  assert.deepEqual(errors, []);
  console.log('PASS all three pairs: H.264 playback, normalized seeking, separate audio, contact sheets, range download, mobile');
} finally { await browser.close(); server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); }
