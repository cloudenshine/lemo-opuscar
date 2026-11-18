import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { FILMS } from '../src/projects.ts';
import { films } from '../research/collection/catalog.ts';

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1360,height:820}});
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(FILMS,'style-collection/index.html')).href);
  const video=page.locator('video');
  const rows=page.locator('li[data-category]:visible');
  assert.equal(await rows.count(),99);
  await page.locator('#ready').check();
  assert.equal(await rows.count(),films.filter(f=>f.style).length);
  await page.locator('#search').fill('示波器');
  assert.equal(await rows.count(),1);
  await page.locator('#search').clear();
  for(const f of films){
    await page.locator(`nav button[data-film="${f.folder}"]`).click();
    await page.waitForFunction(expected=>{
      const player=document.querySelector('video')!;
      return player.readyState>=2&&Math.abs(player.duration-expected)<.06;
    },f.duration);
    assert.equal(await page.locator('#title').textContent(),f.title);
  }
  await page.locator('nav button[data-film="phase-flowers"]').click();
  await video.evaluate(async element=>{const v=element as HTMLVideoElement;v.muted=true;await v.play();});
  await page.waitForFunction(()=>document.querySelector('video')!.currentTime>.5);
  await video.evaluate(element=>{const v=element as HTMLVideoElement;v.pause();v.currentTime=24;});
  await page.waitForFunction(()=>{const v=document.querySelector('video')!;return !v.seeking&&v.currentTime===24;});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log(`99 style entries, ${films.length} playable films, filters, playback, seek and mobile layout verified`);
}finally{await browser.close();}
