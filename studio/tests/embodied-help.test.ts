import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state, acting, joint, distance, film } from '../research/creative-reset/first-film-v4/motion.ts';
import { state as previous } from '../research/creative-reset/first-film-v3/motion.ts';

test('preserve the understood first scene before the acting revision', () => {
  for (let f = 0; f <= 495; f++) {
    const a = state(f / 30), b = previous(f / 30);
    assert.ok(distance(a.bag, b.bag) < 1e-8 && Math.abs(a.bag.angle - b.bag.angle) < 1e-8);
    for (const actor of ['a', 'b'] as const) {
      assert.deepEqual(a[actor].hand, b[actor].hand);
      assert.deepEqual(a[actor].shoulder, b[actor].shoulder);
    }
  }
});
test('grip opens before the wrist leaves; the body and neck recover later', () => {
  assert.ok(acting(25.3).fingers > .8); assert.equal(acting(25.3).release, 0);
  assert.ok(acting(25.8).release > .2); assert.equal(acting(25.8).torsoRest, 0);
  assert.ok(acting(26.3).torsoRest > 0); assert.equal(acting(26.3).neckRest, 0);
  assert.ok(state(25.3).bag.handleY > state(24.8).bag.handleY + 8);
  for (let t = 23.35; t < 32; t += 1 / 30) {
    const s = state(t);
    assert.ok(distance(s.b.hand, s.rightSupport) < .0001);
    assert.ok(distance(s.a.other, s.support) < .0001);
    if (t < 25.42) assert.ok(distance(s.a.hand, s.handle) < .0001);
  }
});
test('attention precedes acknowledgement and the nod has a quicker dip than recovery', () => {
  assert.ok(acting(19.6).gazeA > .8); assert.equal(acting(19.6).headFollow, 0);
  assert.ok(acting(20.38).nod < 0); assert.ok(acting(20.62).nod > .2);
  const downSpeed = (acting(20.57).nod - acting(20.47).nod) / .1;
  const backSpeed = Math.abs((acting(21.0).nod - acting(20.9).nod) / .1);
  assert.ok(downSpeed > backSpeed * 1.5);
  assert.equal(state(20.72).scoot, 0); assert.equal(state(23.35).share, 0);
  assert.ok(state(19.9).b.hand.x - 20 - state(19.9).bag.x - 78 > 60);
});
test('the release arc keeps the elbow down instead of folding the arm across the chest', () => {
  for (let t = 25.42; t < 26.45; t += 1 / 60) {
    const s = state(t), root = { x: s.a.shoulder.x + 19, y: s.a.shoulder.y + 17 };
    const elbow = joint(root, s.a.hand, 100, 105, 1);
    assert.ok(elbow.y - root.y > 60, `raised elbow at ${t}`);
  }
});
test('all frames keep reachable arms, continuous contacts and finite drawing coordinates', () => {
  let before = state(0);
  for (let f = 0; f < film.fps * film.duration; f++) {
    const s = state(f / film.fps);
    for (const [root, hand] of [
      [{ x: s.a.shoulder.x + 19, y: s.a.shoulder.y + 17 }, s.a.hand],
      [{ x: s.a.shoulder.x - 12, y: s.a.shoulder.y + 15 }, s.a.other],
      [{ x: s.b.shoulder.x - 17, y: s.b.shoulder.y + 15 }, s.b.hand],
    ]) {
      assert.ok(distance(root, hand) > 5 && distance(root, hand) < 205, `arm ${f}`);
      const elbow = joint(root, hand, 100, 105, 1);
      assert.ok(Math.abs(distance(elbow, hand) - 105) < .001);
    }
    assert.ok(distance(before.bag, s.bag) < 8);
    assert.ok(distance(before.a.hand, s.a.hand) < 13);
    assert.ok(distance(before.b.hand, s.b.hand) < 13);
    assert.ok(Number.isFinite(s.bag.handleY));
    before = s;
  }
});
