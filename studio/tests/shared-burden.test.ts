import { test } from 'node:test';
import assert from 'node:assert/strict';
import { film, state, distance, joint, cues } from '../research/creative-reset/first-film-v2/motion.ts';

test('the newcomer touches the bag before it moves; the first person releases only with both supports present', () => {
  assert.equal(state(19).share, 0);
  assert.equal(state(20.5).share, 0);
  assert.equal(distance(state(20.5).b.hand, state(20.5).rightSupport), 0);
  for (let f = 615; f < 855; f++) {
    const s = state(f / 30);
    assert.ok(distance(s.b.hand, s.rightSupport) < .0001);
    assert.ok(distance(s.a.other, s.support) < .0001);
  }
  assert.equal(distance(state(21.5).a.hand, state(21.5).handle), 0);
  assert.ok(distance(state(22.5).a.hand, state(22.5).handle) > 100);
  assert.equal(state(22.5).bag.x, 930);
});
test('all three visible arms keep their lengths and world contacts across cuts and the handoff', () => {
  let previous = state(0);
  for (let f = 0; f < film.duration * film.fps; f++) {
    const s = state(f / film.fps);
    for (const [start, end] of [
      [{ x: s.a.shoulder.x + 19, y: s.a.shoulder.y + 17 }, s.a.hand],
      [{ x: s.a.shoulder.x - 12, y: s.a.shoulder.y + 15 }, s.a.other],
      [{ x: s.b.shoulder.x - 17, y: s.b.shoulder.y + 15 }, s.b.hand],
    ]) {
      assert.ok(distance(start, end) > 5 && distance(start, end) < 205, `arm range at ${f}`);
      const elbow = joint(start, end, 100, 105, 1);
      assert.ok(Math.abs(distance(start, elbow) - 100) < .001);
      assert.ok(Math.abs(distance(elbow, end) - 105) < .001);
    }
    assert.ok(distance(s.bag, previous.bag) < 8);
    assert.ok(distance(s.a.hand, previous.a.hand) < 13);
    assert.ok(distance(s.b.hand, previous.b.hand) < 13);
    previous = s;
  }
});
test('footstep cues occur on the computed landing frames, not an independent rhythm track', () => {
  for (const cue of cues.filter(c => c.kind === 'step')) {
    assert.ok(state(cue.t).b.feet.some(p => p.y > 869.8));
    assert.ok(state(cue.t - 1 / film.fps).b.feet.some(p => p.y < 869.8));
  }
});
