import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { ROOT } from '../src/projects.ts';

// Explicit deployment acceptance: saves and renders the selected local sample.
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1512, height: 1100 } });
  await page.goto('http://127.0.0.1:43821');
  await page.locator('[data-project="editorial-v6"]').click();
  await page.getByRole('button', { name: '导出影片 ↗', exact: true }).click();
  await page.getByText('导出完成 · 含风格配乐与音效', { exact: true }).waitFor({ timeout: 180000 });
  const href = await page.locator('#download').getAttribute('href');
  assert.equal(href, '/films/editorial-v6/out/film.mp4');
  const media = await page.request.get(`http://127.0.0.1:43821${href}`, { headers: { Range: 'bytes=0-1023' } });
  assert.equal(media.status(), 206); assert.equal((await media.body()).length, 1024);
  const frame = page.frames().find(f => f.url().includes('/films/'))!;
  await frame.waitForFunction(() => (window as Window & { READY?: boolean }).READY);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(ROOT, '.studio/deployed-studio.png') });
  const playback = await browser.newPage();
  await playback.goto(`http://127.0.0.1:43821${href}`);
  await playback.locator('video').evaluate(async (v: HTMLVideoElement) => { v.muted = true; await v.play(); });
  await playback.waitForFunction(() => { const v = document.querySelector('video')!; return v.currentTime > .5 && v.videoWidth === 1920 && v.duration === 24; });
  console.log('PASS deployed UI → real render → downloadable MP4 → browser H.264 playback');
} finally { await browser.close(); }
