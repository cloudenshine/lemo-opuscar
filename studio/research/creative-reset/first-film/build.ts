import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { ROOT } from '../../../src/projects.ts';
import { run } from '../../../src/render.ts';
import { measureAudio, acceptableAudio } from '../../../src/master.ts';
import { film, cues, smooth } from './motion.ts';

const source = path.dirname(fileURLToPath(import.meta.url));
const project = path.join(ROOT, 'films', film.id), out = path.join(project, 'out');
const mode = process.argv[2];
if (mode && mode !== '--stills') throw new Error('Usage: node studio/research/creative-reset/first-film/build.ts [--stills]');
async function owned(dir: string, owner: string) {
  try { await fs.mkdir(dir); } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    if (JSON.parse(await fs.readFile(path.join(dir, 'study.json'), 'utf8')).owner !== owner) throw new Error('Unowned output directory');
  }
  await fs.writeFile(path.join(dir, 'study.json'), JSON.stringify({ owner, status: 'content-study-not-approved' }));
}
await owned(project, 'space-for-two-study'); await fs.mkdir(out, { recursive: true });
const motion = stripTypeScriptTypes(await fs.readFile(path.join(source, 'motion.ts'), 'utf8')).replace(/^export /gm, '');
const scene = await fs.readFile(path.join(source, 'scene.ts'), 'utf8');
await fs.writeFile(path.join(project, 'scene.js'), motion + '\n' + stripTypeScriptTypes(scene.replace(/^import .* from '\.\/motion\.ts';\r?\n/, '')));
await fs.writeFile(path.join(project, 'content.json'), JSON.stringify({ ...film, cues }, null, 2));
await fs.writeFile(path.join(project, 'index.html'), '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>空位 · 内容研究</title><style>html,body{margin:0;background:#18323b}canvas{display:block;width:100vw;height:100vh;object-fit:contain}</style><canvas></canvas><script type="module" src="./scene.js"></script></html>');
await fs.copyFile(path.join(source, 'TREATMENT.zh-CN.md'), path.join(project, 'TREATMENT.md'));
await fs.writeFile(path.join(project, 'CREDITS'), 'Original fictional story, procedural cut-paper artwork and synthesized sound. No upstream film/audio sampled. Inspired by layered paper and nonverbal acting; not a complete paper-lantern style implementation. Code MIT; see repository LICENSE for documentation. Local system font, not redistributed. Content study, not approved series film.\n');
const log = (s: string) => process.stdout.write(s);
await run(process.execPath, ['core/render/still.mjs', project, '4.5', '7.3', '8.5', '10.2', '11.6', '14.7', '17.5', '21', '--out', path.join(out, 'stills')], log);
if (mode !== '--stills') {
  const rate = 48000, count = rate * film.duration, channels = [new Float64Array(count), new Float64Array(count)];
  let seed = 71;
  const noise = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; };
  let low = 0;
  for (let i = 0; i < count; i++) { low = low * .98 + noise() * .02; const t = i / rate, fade = smooth(t / .8) * smooth((film.duration - t) / 1.5); channels[0][i] = channels[1][i] = low * .027 * fade; }
  for (const cue of cues) {
    const length = cue.kind === 'note' ? 2.8 : cue.kind === 'cloth' ? .55 : .18;
    let filtered = 0;
    for (let i = 0; i < length * rate; i++) {
      const at = Math.round(cue.t * rate) + i; if (at >= count) break;
      const t = i / rate; filtered = filtered * .8 + noise() * .2;
      const pitched = cue.pitch ? (Math.sin(2 * Math.PI * cue.pitch * t) + .2 * Math.sin(2 * Math.PI * cue.pitch * 2.003 * t)) * .06 * Math.exp(-t * 2.4) : 0;
      const material = cue.kind === 'note' ? 0 : filtered * Math.exp(-t * (cue.kind === 'cloth' ? 6 : 28)) * (cue.kind === 'seat' ? .13 : .09);
      const v = (pitched + material) * Math.min(1, t / .006);
      channels[0][at] += v * Math.sqrt((1 - cue.pan) / 2); channels[1][at] += v * Math.sqrt((1 + cue.pan) / 2);
    }
  }
  const wav = Buffer.alloc(44 + count * 4);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(count * 4, 40);
  for (let i = 0; i < count; i++) for (let c = 0; c < 2; c++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[c][i])) * 32767), 44 + i * 4 + c * 2);
  await fs.writeFile(path.join(out, 'mix.wav'), wav);
  await run(process.execPath, ['core/render/readcheck.mjs', project, '--step', '.2'], log);
  await run(process.execPath, ['core/render/video.mjs', project, '--fps', String(film.fps), '--workers', '3', '--out', path.join(out, 'video.mp4')], log);
  const filter = 'loudnorm=I=-12:TP=-2:LRA=7,volume=3dB,alimiter=limit=0.70:attack=5:release=100:level=false:latency=true';
  await run('ffmpeg', ['-y', '-v', 'error', '-i', path.join(out, 'video.mp4'), '-i', path.join(out, 'mix.wav'), '-c:v', 'copy', '-af', filter, '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-t', String(film.duration), '-movflags', '+faststart', path.join(out, 'film.pending.mp4')]);
  const measured = await measureAudio(path.join(out, 'film.pending.mp4'));
  await fs.writeFile(path.join(out, 'mastering.json'), JSON.stringify({ filter, measured, method: 'study-specific dynamic normalization and latency-compensated limiter; encoded media verified' }, null, 2));
  if (!acceptableAudio(measured)) throw new Error(`Audio check failed: ${JSON.stringify(measured)}`);
  await fs.rename(path.join(out, 'film.pending.mp4'), path.join(out, 'film.mp4'));
  await fs.writeFile(path.join(out, 'technical.json'), JSON.stringify({ measured, duration: film.duration, fps: film.fps, frames: film.duration * film.fps, artistic: 'unverified-audience-comprehension' }, null, 2));
  await run('ffmpeg', ['-y', '-v', 'error', '-ss', '6.5', '-i', path.join(out, 'film.mp4'), '-vf', 'fps=4,scale=480:-1,tile=4x4', '-frames:v', '1', path.join(out, 'action-strip.jpg')]);
  const review = path.join(ROOT, 'films/space-for-two-review'); await owned(review, 'space-for-two-review');
  await fs.copyFile(path.join(source, 'review.html'), path.join(review, 'index.html'));
  console.log('Content study: http://127.0.0.1:43821/films/space-for-two-review/index.html');
}
