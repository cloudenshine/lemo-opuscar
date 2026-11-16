import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cases, validateCandidates } from '../research/style-cases/catalog.ts';
import { researchQueue } from '../research/style-cases/research.ts';

test('research covers all styles without converting hypotheses into approved pitches', async () => {
  const rows = await researchQueue();
  assert.deepEqual(rows.map(r => r.slug), (await cases()).map(r => r.slug));
  assert.equal(new Set(rows.map(r => r.question)).size, 99);
  assert.equal(new Set(rows.map(r => r.audienceHypothesis)).size, 99);
  for (const row of rows) {
    assert.equal(row.status, 'research-question-not-approved-pitch');
    assert.ok(row.evidenceGap.length > 10);
  }
});

test('every fixed-index style has three individually titled content candidates with no default choice', async () => {
  const rows = await cases();
  assert.equal(rows.length, 99);
  assert.equal(new Set(rows.map(r => r.slug)).size, 99);
  assert.equal(rows.flatMap(r => r.options).length, 297);
  assert.equal(new Set(rows.flatMap(r => r.options.map(c => c.title))).size, 297);
  for (const r of rows) {
    assert.deepEqual(r.options.map(c => c.key), ['A', 'B', 'C']);
    assert.ok(r.mechanism && r.risk && r.sha256.length === 64);
    assert.ok(!('selected' in r));
  }
});
test('reject omitted styles, duplicate coverage and incomplete candidate triplets', async () => {
  const rows = await cases(), slugs = rows.map(r => r.slug);
  assert.throws(() => validateCandidates(rows.slice(1), slugs), /Every style/);
  const duplicate = structuredClone(rows); duplicate[1] = duplicate[0];
  assert.throws(() => validateCandidates(duplicate, slugs), /duplicate style/);
  const missing = structuredClone(rows); missing[0].options.pop();
  assert.throws(() => validateCandidates(missing, slugs), /Three candidates/);
  const empty = structuredClone(rows); empty[0].options[0].story = '';
  assert.throws(() => validateCandidates(empty, slugs), /Incomplete/);
});
