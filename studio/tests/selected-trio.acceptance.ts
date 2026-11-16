import {chromium} from 'playwright-core';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT} from '../src/projects.ts';
import {films} from '../research/selected-trio-v1/timeline.ts';
const base='http://127.0.0.1:43821',browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(`${r.status()} ${r.url()}`);});
const report:{id:string;frames:number;deterministic:boolean}[]=[];
try{
  for(const f of films){await page.goto(`${base}/films/${f.slug}/index.html`);await page.waitForFunction(()=>window.READY);const result=await page.evaluate(({duration,id})=>{const hashes:string[]=[];let frames=0;
    for(let t=0;t<duration;t+=.5){window.render(t);const canvas=document.querySelector('canvas')!,g=canvas.getContext('2d')!,sample=g.getImageData(400,300,300,300).data;if(!sample.some((v,i)=>i%4!==3&&v>20))throw new Error(`Blank frame ${t}`);const texts=window.TEXTS(t);if(id==='thermal'&&!texts.some(t=>t.text.includes('非实测')))throw new Error(`Evidence label missing ${t}`);for(const b of texts){if(b.x0<0||b.y0<0||b.x1>1921||b.y1>1081)throw new Error(`Text outside frame: ${b.text}`);}frames++;}
    for(const t of [18,38,18]){window.render(t);hashes.push(document.querySelector('canvas')!.toDataURL());}if(hashes[0]!==hashes[2])throw new Error('Frame depends on render order');return{frames,deterministic:true};},{duration:f.duration,id:f.id});report.push({id:f.id,...result});
    if(f.id==='hero'){const feet=await page.evaluate(()=>{const g=document.querySelector('canvas')!.getContext('2d')!;return[16,18,20].map(t=>{window.render(t);return Array.from(g.getImageData(123*6,123*6,28*6,5*6).data).join(',');});});assert.equal(feet[0],feet[1],'Feet must not float upward with parcel');assert.equal(feet[1],feet[2]);}
  }
  await page.goto(`${base}/films/selected-trio-v1-review/index.html`);await page.waitForFunction(()=>Array.from(document.querySelectorAll('video')).every(v=>v.readyState>=1));assert.equal(await page.locator('video').count(),3);
  for(let i=0;i<films.length;i++){const actual=await page.locator('video').nth(i).evaluate(v=>(v as HTMLVideoElement).duration);assert.ok(Math.abs(actual-films[i].duration)<.2);}
  await page.locator('#hero [data-time="36"]').click();await page.waitForTimeout(600);const time=await page.locator('#hero video').evaluate(v=>(v as HTMLVideoElement).currentTime);assert.ok(time>=36&&time<40);await page.locator('#hero [data-mute]').click();assert.equal(await page.locator('#hero video').evaluate(v=>(v as HTMLVideoElement).muted),true);
  await page.screenshot({path:path.join(ROOT,'.studio/selected-trio-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(ROOT,'.studio/selected-trio-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(ROOT,'.studio/selected-trio-acceptance.json'),JSON.stringify({report,errors,reviewPlayer:true,mobile:true,comprehension:'not-user-reviewed',fullSoundReview:'not-claimed'},null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
