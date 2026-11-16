import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cases, validateCandidates } from '../research/style-cases/catalog.ts';
import { researchQueue } from '../research/style-cases/research.ts';
import { revisedCases, validateV2, STORAGE_KEY } from '../research/style-cases/v2.ts';

test('revised proposals independently cover 99 styles with resolved evidence and explicit sample limits', async () => {
  const data = await revisedCases(), old = await cases();
  assert.deepEqual(data.rows.map(r => r.slug), old.map(r => r.slug));
  assert.equal(data.rows.flatMap(r => r.options).length, 297);
  assert.notEqual(STORAGE_KEY, 'lemo-style-case-candidates-v1');
  for (const [i, row] of data.rows.entries()) {
    assert.equal(row.reviewLevel, 'six-frame-visual-sample-not-complete-audiovisual');
    assert.ok(row.observation.trim() && row.implication.trim(), row.slug);
    assert.ok(!('selected' in row));
    for (const [j, option] of row.options.entries()) {
      assert.notEqual(option.story, old[i].options[j].story);
      assert.ok(option.evidence.every(id => data.sources.some(s => s.id === id && s.boundary && s.checked)));
    }
  }
});

test('revised validation rejects absent styles, unmapped sources and duplicate alternatives', async () => {
  const data = await revisedCases(), rows = data.rows.flatMap(r => r.options);
  const slugs = data.rows.map(r => r.slug), ids = data.sources.map(s => s.id);
  assert.throws(() => validateV2(rows.slice(1), slugs, ids), /three proposals/);
  const missing = structuredClone(rows); missing[0].slug = 'unknown-style';
  assert.throws(() => validateV2(missing, slugs, ids), /Missing or duplicate/);
  const source = structuredClone(rows); source[0].evidence = ['unverified-placeholder'];
  assert.throws(() => validateV2(source, slugs, ids), /Unresolved evidence/);
  const duplicate = structuredClone(rows); duplicate[1].key = 'A';
  assert.throws(() => validateV2(duplicate, slugs, ids), /Missing or duplicate/);
  const incomplete = structuredClone(rows); incomplete[0].gate = '';
  assert.throws(() => validateV2(incomplete, slugs, ids), /Incomplete proposal/);
});

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
