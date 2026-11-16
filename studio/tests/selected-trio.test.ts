import test from 'node:test';
import assert from 'node:assert/strict';
import {films,lockState} from '../research/selected-trio-v1/timeline.ts';
import {editTime,pictureTime,gloveMotion} from '../research/selected-trio-v1/edit.ts';
test('lock cannot rise or discharge a ship with the wrong gate open',()=>{
  for(let t=24;t<=50;t+=1/30){const s=lockState(t);assert.ok(s.fill>=0&&s.fill<=1);if(s.fill>0&&s.fill<1){assert.equal(s.gateLeft,1);assert.equal(s.gateRight,1);}if(s.gateRight<1)assert.equal(s.fill,1);if(s.x-105<622&&s.x+110>598)assert.equal(s.gateLeft,0);if(s.x-105<1172&&s.x+110>1148)assert.equal(s.gateRight,0);assert.ok(Math.abs(s.y-(760-s.fill*250))<1e-8);}
});
test('narrative captions cannot overlap, truncate or leave film duration',()=>{for(const f of films){let end=0;for(const c of f.cues){assert.ok(c.start>=end);assert.ok(c.end>c.start&&c.end<=f.duration);assert.ok([...c.text].length/(c.end-c.start)<=5.5);end=c.end;}for(const e of f.sounds)assert.ok(e.t>=0&&e.t+e.dur<=f.duration);}});
test('thermal remains a previsualization rather than declared experimental evidence',()=>{const f=films.find(f=>f.id==='thermal')!;assert.match(f.status,/非实测/);assert.match(f.slug,/previs/);assert.ok(f.cues.some(c=>/实测应比较/.test(c.text)));assert.ok(f.cues.some(c=>/检查/.test(c.text)));});
test('revised picture clock preserves causal order and reversible sound event positions',()=>{
  for(const f of films){let previous=-1;for(let t=0;t<=f.duration;t+=1/30){const source=pictureTime(f.id,t);assert.ok(source>=previous);assert.ok(Math.abs(editTime(f.id,source)-t)<1e-7);previous=source;}}
  for(let t=18;t<42;t+=1/30){const s=lockState(pictureTime('canal',t));if(s.fill>0&&s.fill<1){assert.equal(s.gateLeft,1);assert.equal(s.gateRight,1);}}
});
test('revised cue intervals fit measured original speech without speeding or clipping it',()=>{
  const durations={canal:[3.864,4.032,3.072,2.928,3.624,4.008,3.408,3.816,4.008,4.224,4.056,4.56,3.384,4.032],thermal:[3.504,3.768,4.512,4.416,4.104,4.104,4.368,4.248,3.984]};
  for(const id of ['canal','thermal'] as const){const f=films.find(f=>f.id===id)!;f.cues.forEach((c,i)=>assert.ok(c.end-c.start>=durations[id][i]+.12,`${id}/${c.id} cuts speech`));}
});
test('released glove accelerates to the table and the impact sound lands on contact',()=>{
  assert.equal(gloveMotion(49).y,64);assert.equal(gloveMotion(49).withdraw,0);
  assert.ok(gloveMotion(49.6).y-gloveMotion(49.4).y>gloveMotion(49.4).y-gloveMotion(49.2).y);
  assert.ok(Math.abs(gloveMotion(49.8).y+18-133)<1e-8);
  const hero=films.find(f=>f.id==='hero')!;assert.ok(hero.sounds.some(s=>s.kind==='hit'&&Math.abs(s.t-editTime('hero',49.8))<1e-8));
});
