import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../research/style-atlas/catalog.ts';
import { film, state, distance, joint } from '../research/creative-reset/first-film/motion.ts';

test('content atlas covers the full fixed index once, with explicit constraints', async () => {
  const rows = await catalog();
  assert.equal(rows.length, 99); assert.equal(new Set(rows.map(r => r.slug)).size, 99);
  assert.ok(rows.every(r => r.content && r.risk && r.mechanism && /^[a-f0-9]{64}$/.test(r.sha256)));
  assert.ok(!rows.some(r => r.slug === 'my-style'));
  assert.ok(rows.some(r => r.needs.includes('image-generation')));
});
test('seat becomes available through a held bag; response follows the invitation', () => {
  assert.equal(state(6).bag.x, 1080);
  assert.equal(state(10).bag.x, 850);
  assert.ok(state(10.2).bag.x + 78 < 1080 - 80);
  assert.equal(state(10.2).a.invite, 0);
  assert.equal(state(11.5).a.invite, 1);
  assert.equal(state(11.5).b.hip.x, 1360);
  assert.equal(state(16).b.hip.y, 711);
  for (let t = 7.3; t <= 10.5; t += 1 / film.fps) {
    const s = state(t); assert.ok(distance(s.a.hand, s.handle) < 1e-6); assert.ok(distance(s.a.other, s.support) < 1e-6);
  }
  for (let t = 10.5; t < 13.2; t += 1 / film.fps) assert.ok(distance(state(t).a.other, state(t).support) < 1e-6);
});
test('every rendered pose preserves limb lengths, ground bounds and continuous object motion', () => {
  let previous = state(0);
  for (let f = 0; f < film.duration * film.fps; f++) {
    const t = f / film.fps, s = state(t);
    for (const [start, end] of [
      [{ x: s.a.shoulder.x + 19, y: s.a.shoulder.y + 17 }, s.a.hand],
      [{ x: s.a.shoulder.x - 12, y: s.a.shoulder.y + 15 }, s.a.other],
    ]) {
      assert.ok(distance(start, end) < 205, `unreachable arm at ${t}: ${distance(start, end)}`);
      const elbow = joint(start, end, 100, 105, 1);
      assert.ok(Math.abs(distance(start, elbow) - 100) < .001);
      assert.ok(Math.abs(distance(elbow, end) - 105) < .001);
    }
    for (const person of [s.a, s.b]) for (const foot of person.feet) {
      assert.ok(foot.y <= 870 && foot.y >= 838);
      assert.ok(distance(person.hip, { x: foot.x, y: foot.y - 12 }) < 230, `unreachable leg at ${t}`);
    }
    assert.ok(distance(s.bag, previous.bag) < 8, `bag jump at ${t}`);
    assert.ok(distance(s.b.hip, previous.b.hip) < 7, `hip jump at ${t}`);
    previous = s;
  }
});
