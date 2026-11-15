import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { ROOT } from '../../../src/projects.ts';
import { run } from '../../../src/render.ts';
import { measureAudio, acceptableAudio } from '../../../src/master.ts';
import { study, evidence } from './model.ts';

const source = path.dirname(fileURLToPath(import.meta.url)), project = path.join(ROOT, 'films', study.id);
const out = path.join(project, 'out'), facts = evidence(study.replies);
if (facts.population !== 12 || facts.answered.length !== 4 || facts.unknown.length !== 8) throw new Error('Study evidence changed; review the treatment');
try { await fs.mkdir(project); } catch (e) {
  if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
  if (JSON.parse(await fs.readFile(path.join(project, 'study.json'), 'utf8')).owner !== 'creative-reset-proof-01') throw new Error('Existing project belongs to another work');
}
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(project, 'study.json'), JSON.stringify({ owner: 'creative-reset-proof-01', status: 'animatic-not-approved' }));
await fs.writeFile(path.join(project, 'content.json'), JSON.stringify(study, null, 2));
const scene = await fs.readFile(path.join(source, 'scene.ts'), 'utf8');
await fs.writeFile(path.join(project, 'scene.ts'), scene);
await fs.writeFile(path.join(project, 'scene.js'), stripTypeScriptTypes(scene));
await fs.writeFile(path.join(project, 'TREATMENT.md'), (await fs.readFile(path.join(source, 'TREATMENT.zh-CN.md'), 'utf8')).replace('../DIRECTOR-BRIEF.zh-CN.md', '../../studio/research/creative-reset/DIRECTOR-BRIEF.zh-CN.md'));
await fs.writeFile(path.join(project, 'index.html'), '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>谁的全部 · 动态研究</title><style>html,body{margin:0;background:#eeeae1}canvas{width:100vw;height:100vh;display:block;object-fit:contain}</style><canvas></canvas><script type="module" src="./scene.js"></script></html>');
await fs.writeFile(path.join(project, 'CREDITS'), 'Original experimental story, typography and synthesized sound. Fictional respondent data. Local system fonts, no font files redistributed. Method study of LemoLab lemo-opuscar; no upstream film or audio sampled. Code MIT; documentation follows repository LICENSE. Not a completed personal-series film.\n');

// Picture and sound consume the same respondent events; unknown records have no response cues.
const rate = 48000, frames = rate * study.duration, channels = [new Float64Array(frames), new Float64Array(frames)];
let seed = 71;
const noise = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; };
for (const cue of study.cues) {
  const duration = cue.kind === 'unfold' ? 1.1 : cue.kind === 'edit' ? .2 : 1.2;
  for (let i = 0; i < duration * rate; i++) {
    const t = i / rate, at = Math.round(cue.frame / study.fps * rate) + i;
    if (at >= frames) break;
    const envelope = Math.min(1, t / .004);
    const pitched = cue.pitch ? Math.sin(2 * Math.PI * cue.pitch * t) * Math.exp(-t * 5) * .06 : 0;
    const paper = cue.kind === 'echo' ? 0 : noise() * Math.exp(-t * (cue.kind === 'unfold' ? 3 : 45)) * (cue.kind === 'edit' ? .055 : .035);
    const signal = (pitched + paper) * envelope;
    channels[0][at] += signal * Math.sqrt((1 - cue.pan) / 2); channels[1][at] += signal * Math.sqrt((1 + cue.pan) / 2);
  }
}
for (let i = 0; i < frames; i++) {
  const t = i / rate, [start, end] = study.silence;
  const gain = t >= start && t < end ? 0 : t < start ? Math.min(1, (start - t) / .03) : Math.min(1, (study.duration - t) / .4);
  channels[0][i] *= gain; channels[1][i] *= gain;
}
const wav = Buffer.alloc(44 + frames * 4);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) for (let c = 0; c < 2; c++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[c][i])) * 32767), 44 + i * 4 + c * 2);
await fs.writeFile(path.join(out, 'mix.wav'), wav);
await fs.writeFile(path.join(out, 'cue-table.json'), JSON.stringify(study, null, 2));
const log = (s: string) => process.stdout.write(s);
await run(process.execPath, ['core/render/readcheck.mjs', project, '--step', '.2'], log);
await run(process.execPath, ['core/render/video.mjs', project, '--fps', String(study.fps), '--workers', '3', '--out', path.join(out, 'video.mp4')], log);
await run('ffmpeg', ['-y', '-v', 'error', '-i', path.join(out, 'video.mp4'), '-i', path.join(out, 'mix.wav'), '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-2:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-t', String(study.duration), '-movflags', '+faststart', path.join(out, 'film.pending.mp4')]);
const measured = await measureAudio(path.join(out, 'film.pending.mp4'));
if (!acceptableAudio(measured)) throw new Error(`Prototype mastering failed: ${JSON.stringify(measured)}`);
await fs.rename(path.join(out, 'film.pending.mp4'), path.join(out, 'film.mp4'));
await fs.writeFile(path.join(out, 'technical.json'), JSON.stringify({ measured, duration: study.duration, status: 'technical-only-artistic-evaluation-pending' }, null, 2));
await run(process.execPath, ['core/render/still.mjs', project, '1.5', '7.5', '12', '--out', path.join(out, 'stills')], log);
console.log('Research render only; audience comprehension and artistic approval remain unverified.');
const review = path.join(ROOT, 'films', 'creative-reset-study');
try { await fs.mkdir(review); } catch (e) {
  if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
  if (JSON.parse(await fs.readFile(path.join(review, 'study.json'), 'utf8')).owner !== 'creative-reset-review-01') throw new Error('Existing review belongs to another work');
}
await fs.writeFile(path.join(review, 'study.json'), JSON.stringify({ owner: 'creative-reset-review-01' }));
await fs.copyFile(path.join(source, 'review.html'), path.join(review, 'index.html'));
console.log('Study page: http://127.0.0.1:43821/films/creative-reset-study/index.html');
