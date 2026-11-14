import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../src/projects.ts';

const dir = path.join(ROOT, '.studio/comparison');
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'studio/comparison/sources.json'), 'utf8'));
function command(exe: string, args: string[]) {
  const r = spawnSync(exe, args, { windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${exe}: ${r.error?.message || r.stderr.toString().slice(-1200)}`);
  return r;
}
async function measure(file: string, sheet: string) {
  const probe = JSON.parse(command('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).stdout.toString());
  const video = probe.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
  const audio = probe.streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
  const duration = Number(probe.format.duration);
  const log = command('ffmpeg', ['-hide_banner', '-i', file, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']).stderr.toString();
  const loudness = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));
  const gray = command('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'fps=6,scale=160:90', '-pix_fmt', 'gray', '-f', 'rawvideo', '-']).stdout;
  const frameSize = 160 * 90, count = Math.floor(gray.length / frameSize);
  let delta = 0;
  for (let i = frameSize; i < count * frameSize; i++) delta += Math.abs(gray[i] - gray[i - frameSize]);
  command('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=${12 / duration},scale=480:270,tile=4x3`, '-frames:v', '1', '-update', '1', path.join(dir, sheet)]);
  return {
    sha256: createHash('sha256').update(await fs.readFile(file)).digest('hex'),
    bytes: (await fs.stat(file)).size, duration, width: video.width, height: video.height, fps: video.avg_frame_rate,
    codec: video.codec_name, audioCodec: audio?.codec_name, sampleRate: Number(audio?.sample_rate), channels: audio?.channels,
    integratedLufs: Number(loudness.input_i), truePeakDbtp: Number(loudness.input_tp), loudnessRangeLu: Number(loudness.input_lra),
    motionDelta: Number((delta / ((count - 1) * frameSize) / 255 * 100).toFixed(3)),
    sheet: `/comparison-sheets/${sheet}`,
  };
}
await fs.mkdir(dir, { recursive: true });
const pairs = [];
for (const pair of manifest.pairs) {
  const original = await measure(path.join(dir, 'source', `${pair.id}.mp4`), `${pair.id}-original.jpg`);
  const personal = await measure(path.join(ROOT, 'films', pair.project, 'out/film.mp4'), `${pair.id}-personal.jpg`);
  pairs.push({ ...pair, originalMetrics: original, personalMetrics: personal });
  console.log(`${pair.id}: original ${original.integratedLufs} LUFS / personal ${personal.integratedLufs} LUFS`);
}
const previousFile = path.join(ROOT, 'films/morning-leaf/out/film.mp4');
const previousInk = await fs.access(previousFile).then(() => measure(previousFile, 'ink-wash-previous.jpg')).catch((e: NodeJS.ErrnoException) => { if (e.code !== 'ENOENT') throw e; return null; });
await fs.writeFile(path.join(dir, 'analysis.json'), JSON.stringify({ ...manifest, measuredAt: new Date().toISOString(), method: '6fps 160x90 grayscale mean absolute frame difference; descriptive only, not a quality score. Loudness measured on delivered encoded media.', pairs, previousInk }, null, 2));
console.log('Saved .studio/comparison/analysis.json');
