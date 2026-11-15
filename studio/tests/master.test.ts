import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptableAudio } from '../src/master.ts';

test('never publish unmeasurable, quiet, overly loud or clipping encoded audio', () => {
  for (const value of [{ integrated: -16.1, peak: -4.3, range: 3.4 }, { integrated: -14, peak: 1.8, range: 3 }, { integrated: -12.9, peak: -2, range: 3 }, { integrated: -Infinity, peak: -Infinity, range: 0 }, { integrated: -14, peak: -2, range: NaN }]) assert.equal(acceptableAudio(value), false);
  assert.equal(acceptableAudio({ integrated: -14.6, peak: -1.4, range: 5.3 }), true);
});
