import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spans, parseResponse, responseJson, validateAudio, wavPcm } from '../research/style-cases/av-review.ts';

test('duplicate complete responses recover without accepting conflicting or truncated revisions', () => {
  assert.deepEqual(responseJson('```json\n{"story":"brace } in string"}\n```\nRepeated:\n{"story":"brace } in string"}'), { story: 'brace } in string' });
  assert.throws(() => responseJson('{"a":1}\n{"a":2}'), /ambiguous/);
  assert.throws(() => responseJson('{"a":1}\n{"a":'), /Incomplete/);
  assert.throws(() => responseJson(''), /Incomplete/);
});

test('audio coverage includes the short tail without gaps or overlaps', () => {
  const plan = spans(54.122667, 4, 'a', 'wav');
  assert.equal(plan.length, 14);
  assert.equal(plan[0].start, 0);
  assert.equal(plan.at(-1)!.end, 54.122667);
  for (let i = 1; i < plan.length; i++) assert.equal(plan[i].start, plan[i-1].end);
  assert.throws(() => spans(NaN, 4, 'a', 'wav'));
});

test('model self-report cannot replace a recorded media read or missing tail', () => {
  const plan = spans(5, 4, 'a', 'wav');
  const data = { clips: plan.map(p => ({ file: p.file, heard: '静音', unavailable: false })) };
  validateAudio(data, plan, plan.map(p => p.file));
  assert.throws(() => validateAudio(data, plan, ['a00.wav']), /Unverified/);
  assert.throws(() => validateAudio({ clips: data.clips.slice(0, 1) }, plan, ['a00.wav']), /Incomplete/);
  assert.throws(() => validateAudio({ clips: [data.clips[0], data.clips[0]] }, plan, plan.map(p=>p.file)), /Unverified/);
});

test('truncated or unsuccessful CLI streams never become successful analyses', () => {
  assert.throws(() => parseResponse('{"event":"init"}'), /unsuccessful/);
  assert.throws(() => parseResponse('{"event":"result","result":{"status":"ERROR"}}'), /unsuccessful/);
  assert.throws(() => parseResponse('{"event":"result"'));
});

test('a completed tool event without a file path cannot certify an audio read', () => {
  const data = { clips: [{ file: 'a00.wav', heard: 'A sustained note' }] };
  const events = [
    { step_update: { step_type: 'tool', state: 'ACTIVE', tool_info: { name: 'read_file', parameters: { Path: 'a00.wav' } } } },
    { step_update: { step_type: 'tool', state: 'DONE', tool_info: { name: 'read_file' } } },
    { event: 'result', result: { status: 'SUCCESS', response: JSON.stringify(data) } },
  ];
  const result = parseResponse(events.map(e => JSON.stringify(e)).join('\n'));
  assert.deepEqual(result.reads, []);
  assert.throws(() => validateAudio(result.data, spans(4, 4, 'a', 'wav'), result.reads), /Unverified/);
});

test('PCM comparison handles WAV metadata rather than assuming a 44-byte header', () => {
  const b = Buffer.alloc(38);
  b.write('RIFF'); b.writeUInt32LE(30, 4); b.write('WAVE', 8);
  b.write('JUNK', 12); b.writeUInt32LE(3, 16); b.write('abc', 20);
  b.write('data', 24); b.writeUInt32LE(6, 28); b.write('123456', 32);
  assert.equal(wavPcm(b).toString(), '123456');
  assert.throws(() => wavPcm(b.subarray(0, 36)), /Truncated/);
});
