import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const execute = promisify(execFile);
export type Loudness = { integrated: number; peak: number; range: number };
export function acceptableAudio(value: Loudness) {
  return Object.values(value).every(Number.isFinite) && value.integrated >= -15 && value.integrated <= -13 && value.peak <= -1;
}
async function ffmpeg(args: string[]) {
  return execute('ffmpeg', ['-hide_banner', '-nostats', ...args], { windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
}
export async function measureAudio(file: string): Promise<Loudness> {
  const { stderr } = await ffmpeg(['-i', file, '-vn', '-af', 'loudnorm=I=-14:TP=-2:LRA=11:print_format=json', '-f', 'null', '-']);
  const data = JSON.parse(stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1));
  const value = { integrated: Number(data.input_i), peak: Number(data.input_tp), range: Number(data.input_lra) };
  if (!Object.values(value).every(Number.isFinite)) throw new Error('Audio is silent or cannot be measured.');
  return value;
}
export async function masterVideo(video: string, audio: string, output: string, log: (s: string) => void) {
  let target = -14, ceiling = -2;
  const attempts: Array<{ target: number; ceiling: number; measured: Loudness }> = [];
  await measureAudio(audio);
  for (let i = 0; i < 3; i++) {
    await ffmpeg(['-y', '-loglevel', 'error', '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-af', `loudnorm=I=${target}:TP=${ceiling}:LRA=11`, '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-t', '24', '-movflags', '+faststart', output]);
    const measured = await measureAudio(output);
    attempts.push({ target, ceiling, measured });
    log(`Encoded audio: ${measured.integrated} LUFS, ${measured.peak} dBTP\n`);
    if (acceptableAudio(measured)) {
      await fs.writeFile(path.join(path.dirname(output), 'mastering.json'), JSON.stringify({ method: 'dynamic loudnorm, encoded-media verification', attempts }, null, 2));
      return;
    }
    if (measured.peak > -1) ceiling = Math.max(-6, ceiling - (measured.peak + 1.3));
    target = Math.max(-16, Math.min(-12, target + (-14 - measured.integrated)));
  }
  throw new Error('Encoded audio missed the loudness/peak limits; previous film was kept. Inspect the mix before retrying.');
}
