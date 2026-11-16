import test from 'node:test';
import assert from 'node:assert/strict';
import {films,lockState} from '../research/selected-trio-v1/timeline.ts';
test('lock cannot rise or discharge a ship with the wrong gate open',()=>{
  for(let t=24;t<=50;t+=1/30){const s=lockState(t);assert.ok(s.fill>=0&&s.fill<=1);if(s.fill>0&&s.fill<1){assert.equal(s.gateLeft,1);assert.equal(s.gateRight,1);}if(s.gateRight<1)assert.equal(s.fill,1);if(s.x-105<622&&s.x+110>598)assert.equal(s.gateLeft,0);if(s.x-105<1172&&s.x+110>1148)assert.equal(s.gateRight,0);assert.ok(Math.abs(s.y-(760-s.fill*250))<1e-8);}
});
test('narrative captions cannot overlap, truncate or leave film duration',()=>{for(const f of films){let end=0;for(const c of f.cues){assert.ok(c.start>=end);assert.ok(c.end>c.start&&c.end<=f.duration);assert.ok([...c.text].length/(c.end-c.start)<=5.5);end=c.end;}for(const e of f.sounds)assert.ok(e.t>=0&&e.t+e.dur<=f.duration);}});
test('thermal remains a previsualization rather than declared experimental evidence',()=>{const f=films.find(f=>f.id==='thermal')!;assert.match(f.status,/非实测/);assert.match(f.slug,/previs/);assert.ok(f.cues.some(c=>/实测应比较/.test(c.text)));assert.ok(f.cues.some(c=>/检查/.test(c.text)));});
