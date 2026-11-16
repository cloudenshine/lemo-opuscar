import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodyFrame, limbSurface } from '../research/creative-reset/first-film-v5/body.ts';
import { state, distance } from '../research/creative-reset/first-film-v5/motion.ts';
import { state as baseline } from '../research/creative-reset/first-film-v4/motion.ts';

test('character replacement preserves the entire story, camera and contact timeline', () => {
  for (let f = 0; f < 960; f++) assert.deepEqual(state(f / 30), baseline(f / 30));
});
test('effort changes torso proportions and internal curvature, not only global rotation', () => {
  const loaded = bodyFrame(17.15, 'a'), rested = bodyFrame(28, 'a');
  assert.ok(loaded.chestWidth / loaded.waistWidth > rested.chestWidth / rested.waistWidth * 1.2);
  const bend = (f: ReturnType<typeof bodyFrame>) => {
    const dx = f.shoulder.x - f.pelvis.x, dy = f.shoulder.y - f.pelvis.y;
    return ((f.waist.x - f.pelvis.x) * dy - (f.waist.y - f.pelvis.y) * dx) / Math.hypot(dx, dy);
  };
  assert.ok(Math.abs(bend(loaded) - bend(rested)) > 7);
  assert.ok(bodyFrame(20.62, 'a').head.y - bodyFrame(20.25, 'a').head.y > 5);
});
test('deformed limb surfaces keep exact wrist endpoints and tapered widths throughout the film', () => {
  for (let f = 0; f < 960; f++) {
    const s = state(f / 30);
    const arms = [
      [{ x: s.a.shoulder.x + 19, y: s.a.shoulder.y + 17 }, s.a.hand, 1],
      [{ x: s.a.shoulder.x - 12, y: s.a.shoulder.y + 15 }, s.a.other, 1],
      [{ x: s.b.shoulder.x - 17, y: s.b.shoulder.y + 15 }, s.b.hand, -1],
      [{ x: s.b.shoulder.x + 17, y: s.b.shoulder.y + 15 }, { x: s.b.hip.x + 16, y: s.b.hip.y + 45 - 28 * s.b.sit }, -1],
    ] as const;
    for (const [start, end, side] of arms) {
      assert.ok(distance(start, end) < 205 && distance(start, end) > 5);
      const surface = limbSurface(start, end, 100, 105, side, [21, 16, 8]);
      const wristCenter = { x: (surface.left[2].x + surface.right[2].x) / 2, y: (surface.left[2].y + surface.right[2].y) / 2 };
      assert.ok(distance(wristCenter, end) < 1e-8);
      assert.ok(Math.abs(distance(surface.left[2], surface.right[2]) - 16) < 1e-8);
      assert.ok(Math.abs(distance(surface.left[0], surface.right[0]) - 42) < 1e-8);
      assert.ok(!/NaN|Infinity/.test(surface.d));
      assert.ok(Math.abs(distance(surface.hinge, end) - 105) < .001);
    }
  }
});
test('body landmarks remain finite and continuous under deterministic random seeking', () => {
  for (const who of ['a', 'b'] as const) {
    let previous = bodyFrame(0, who);
    for (let f = 1; f < 960; f++) {
      const current = bodyFrame(f / 30, who);
      for (const key of ['pelvis', 'waist', 'chest', 'shoulder', 'head'] as const) {
        assert.ok(Number.isFinite(current[key].x) && Number.isFinite(current[key].y));
        assert.ok(distance(current[key], previous[key]) < 8, `${who} ${key} ${f}`);
      }
      bodyFrame(0, who); bodyFrame(31, who);
      assert.deepEqual(bodyFrame(f / 30, who), current);
      previous = current;
    }
  }
});
