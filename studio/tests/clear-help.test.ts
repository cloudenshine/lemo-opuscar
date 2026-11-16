import { test } from 'node:test';
import assert from 'node:assert/strict';
import { film, state, distance, joint } from '../research/creative-reset/first-film-v3/motion.ts';
import { state as previous } from '../research/creative-reset/first-film-v2/motion.ts';

test('preserve the understood seat-sharing scene before the new ending', () => {
  for (let f = 0; f <= 16.5 * 30; f++) {
    const now = state(f / 30), old = previous(f / 30);
    assert.ok(distance(now.bag, old.bag) < 1e-8 && Math.abs(now.bag.angle - old.bag.angle) < 1e-8);
    for (const actor of ['a', 'b'] as const) {
      assert.deepEqual(now[actor].hip, old[actor].hip);
      assert.deepEqual(now[actor].hand, old[actor].hand);
      assert.deepEqual(now[actor].shoulder, old[actor].shoulder);
    }
  }
});
test('offer is visibly separate from touching; acceptance precedes moving closer', () => {
  for (let t = 19.8; t < 21.3; t += 1 / 30) {
    const s = state(t);
    assert.equal(s.offer, 1); assert.equal(s.reach, 0); assert.equal(s.share, 0); assert.equal(s.scoot, 0);
    assert.ok(s.b.hand.x - 20 - (s.bag.x + 78) > 60);
  }
  assert.ok(state(20.85).a.headAngle - state(20.4).a.headAngle > .15);
  assert.equal(state(21.3).accept, 1);
  assert.equal(state(23.5).share, 0);
  assert.equal(distance(state(23.5).b.hand, state(23.5).rightSupport), 0);
});
test('support remains present through release; the burden and subsequent relief have visible displacement', () => {
  assert.ok(state(17.2).bag.y - state(16.5).bag.y > 7);
  assert.ok(state(17.2).bag.angle > .1);
  for (let t = 23.5; t < 32; t += 1 / 30) {
    const s = state(t); assert.ok(distance(s.a.other, s.support) < .001); assert.ok(distance(s.b.hand, s.rightSupport) < .001);
  }
  assert.equal(distance(state(25.1).a.hand, state(25.1).handle), 0);
  assert.ok(distance(state(27).a.hand, state(27).handle) > 100);
  assert.ok(state(19).a.shoulder.x - state(27).a.shoulder.x > 23);
  assert.equal(state(27).b.hip.x, 1130);
});
test('all arms remain reachable and key acting points stay framed through the cuts', () => {
  let before = state(0);
  for (let f = 0; f < film.duration * film.fps; f++) {
    const s = state(f / film.fps);
    for (const [start, end] of [
      [{ x: s.a.shoulder.x + 19, y: s.a.shoulder.y + 17 }, s.a.hand],
      [{ x: s.a.shoulder.x - 12, y: s.a.shoulder.y + 15 }, s.a.other],
      [{ x: s.b.shoulder.x - 17, y: s.b.shoulder.y + 15 }, s.b.hand],
    ]) {
      assert.ok(distance(start, end) > 5 && distance(start, end) < 205, `arm at ${f}`);
      const elbow = joint(start, end, 100, 105, 1);
      assert.ok(Math.abs(distance(elbow, end) - 105) < .001);
    }
    for (const p of [s.a.hand, s.a.other, s.b.hand, s.a.shoulder, s.b.shoulder]) {
      const x = 960 + (p.x - s.camera.x) * s.camera.scale, y = 630 + (p.y - s.camera.y) * s.camera.scale;
      assert.ok(x > 50 && x < 1870 && y > 150 && y < 1030, `framing at ${f}`);
    }
    assert.ok(distance(s.bag, before.bag) < 8); assert.ok(distance(s.a.hand, before.a.hand) < 13); assert.ok(distance(s.b.hand, before.b.hand) < 13);
    before = s;
  }
});
