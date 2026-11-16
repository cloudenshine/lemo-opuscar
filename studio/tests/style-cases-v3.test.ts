import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editorialCases, mergeEditorial, validateObservation, STORAGE_KEY, type Editorial } from '../research/style-cases/v3.ts';
import { revisedCases, STORAGE_KEY as OLD_KEY } from '../research/style-cases/v2.ts';

test('editorial dataset covers all candidates without claiming pending originals were reviewed', async () => {
  const d = await editorialCases();
  assert.equal(d.rows.length, 99);
  assert.equal(d.counts.candidates, 297);
  assert.notEqual(STORAGE_KEY, OLD_KEY);
  assert.equal(d.counts.editorialAudiovisual, d.rows.filter(r => r.original?.editorialReviewed).length);
  assert.equal(d.counts.decisions.retain + d.counts.decisions.refine + d.counts.decisions.rewrite, 297);
  for (const row of d.rows) {
    assert.equal(row.options.map(o => o.key).join(''), 'ABC');
    if (!row.original) assert.match(row.lesson, /待补|未成功输出|重试中/);
  }
});

test('overrides cannot silently omit an alternative, change identity or call unchanged text a rewrite', async () => {
  const base = await revisedCases(), r = base.rows[0];
  const edit: Editorial = { slug: r.slug, lesson: 'A concrete source observation', caution: 'An explicit evidence limitation',
    options: r.options.map(o => ({ key: o.key, decision: 'retain', reason: 'A substantive editorial reason for retaining this idea', sound: 'A concrete sound transition serving the subject', changes: {} })) };
  assert.equal(mergeEditorial(r.options, [edit], base.sources).length, 3);
  assert.throws(() => mergeEditorial(r.options, [{ ...edit, options: edit.options.slice(0, 2) }], base.sources), /Incomplete/);
  const changed = structuredClone(edit);
  changed.options[0].decision = 'rewrite';
  assert.throws(() => mergeEditorial(r.options, [changed], base.sources), /did not change/);
  Object.assign(changed.options[0].changes, { slug: 'wrong' });
  assert.throws(() => mergeEditorial(r.options, [changed], base.sources), /Unsafe/);
});

test('a complete native-read record still fails publication if its narrative omits the ending', async () => {
  const d = await editorialCases(), o = structuredClone(d.rows.find(r => r.original)!.original!);
  validateObservation(o);
  o.beats[o.beats.length - 1].end -= 1;
  assert.throws(() => validateObservation(o), /Missing ending|Invalid narrative/);
});
