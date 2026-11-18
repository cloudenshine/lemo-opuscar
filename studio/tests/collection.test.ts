import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../research/style-atlas/catalog.ts';
import { films } from '../research/collection/catalog.ts';
import { phaseAt, point } from '../research/collection/phase.ts';

test('collection counts only distinct indexed styles with authored films',async()=>{
  const known=new Set((await catalog()).map(s=>s.slug));
  const selected=films.filter(f=>f.style!==null);
  assert.equal(known.size,99);
  assert.equal(new Set(selected.map(f=>f.style)).size,selected.length);
  assert.equal(new Set(films.map(f=>f.folder)).size,films.length);
  for(const f of selected)assert.ok(f.style&&known.has(f.style));
  assert.equal(films.find(f=>f.folder==='solar-rain')?.style,null);
});

test('phase comparison changes the geometric trace, not only its starting point',()=>{
  // X reaches its maximum twice per common period. Compare both Y coordinates.
  const extremes=(phase:number)=>[Math.PI/4,5*Math.PI/4].map(phi=>point(phi,phase));
  const before=extremes(phaseAt(13)),after=extremes(phaseAt(20));
  assert.ok([...before,...after].every(([x])=>Math.abs(x-1)<1e-12));
  assert.ok(before[0][1]>.7&&before[1][1]<-.7);
  assert.ok(after.every(([,y])=>Math.abs(y)<1e-12));
});
