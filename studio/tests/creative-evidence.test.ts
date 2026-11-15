import assert from 'node:assert/strict';
import test from 'node:test';
import { evidence, study, type Reply } from '../research/creative-reset/proof/model.ts';

test('missing replies remain unknown and cannot acquire response cues', () => {
  const facts = evidence(study.replies);
  assert.equal(facts.population, 12); assert.equal(facts.answered.length, 4); assert.equal(facts.unknown.length, 8);
  const soundReplies = study.cues.filter(c => c.kind === 'reply').map(c => c.reply);
  assert.deepEqual(soundReplies, facts.answered.map(r => r.id));
  assert.ok(facts.unknown.every(r => !soundReplies.includes(r.id)));
  const partial = evidence(study.replies.map(r => r.id === 'R01' ? { ...r, status: 'unknown' } : r));
  assert.equal(partial.answered.length, 3); assert.equal(partial.unknown.length, 9); assert.equal(partial.population, 12);
  assert.throws(() => evidence([...study.replies, study.replies[0]]), /Repeated/);
  assert.throws(() => evidence([{ id: 'x', status: 'disagree' } as unknown as Reply]), /Unsupported/);
});
