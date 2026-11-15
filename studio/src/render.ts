import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT, projectPath, within, compileProject, personalStyle } from './projects.ts';
import { masterVideo } from './master.ts';

export type Job = { id: string; project: string; state: 'running' | 'done' | 'failed'; stage: string; error?: string; video?: string };
export function run(command: string, args: string[], log: (text: string) => void = () => {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let tail = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
      const text = chunk.toString(); tail = (tail + text).slice(-3000); log(text);
    });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} failed (${code}): ${tail}`)));
  });
}
export async function renderProject(id: string, stage: (s: string) => void = () => {}) {
  const dir = await projectPath(id);
  const metadata = JSON.parse(await fs.readFile(await within(dir, 'project.json'), 'utf8'));
  const style = personalStyle(metadata.style);
  await compileProject(id);
  await fs.mkdir(path.join(dir, 'out'), { recursive: true });
  const out = await within(dir, 'out');
  const logFile = path.join(out, 'render.log');
  await fs.writeFile(logFile, '');
  const log = (s: string) => { process.stdout.write(s); };
  const execute = async (cmd: string, args: string[]) => {
    let transcript = '';
    try { await run(cmd, args, s => { transcript = (transcript + s).slice(-100_000); log(s); }); }
    finally { await fs.appendFile(logFile, transcript); }
  };
  stage('检查文字可读性');
  await execute(process.execPath, ['core/render/events.mjs', dir, '--out', path.join(out, 'events.json')]);
  const events = JSON.parse(await fs.readFile(path.join(out, 'events.json'), 'utf8'));
  if (events.dur !== 24) throw new Error('此版工作台只支持 24 秒模板；请同步调整时间轴、音频与封装后再导出。');
  await execute(process.execPath, ['core/render/readcheck.mjs', dir, '--step', '0.2']);
  stage('绘制 576 帧画面');
  await execute(process.execPath, ['core/render/video.mjs', dir, '--fps', '24', '--workers', '3', '--out', path.join(out, 'video.mp4')]);
  stage('合成风格配乐与音效');
  const python = path.join(ROOT, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const score = await within(dir, 'score.py').catch(() => path.join(ROOT, 'studio/audio/score.py'));
  await execute(python, [score, path.join(out, 'mix.wav'), style, path.join(out, 'events.json')]);
  stage('混音与封装');
  const relative = (name: string) => path.relative(ROOT, path.join(out, name)).split(path.sep).join('/');
  if (metadata.mastering === 'verified-v2') {
    await masterVideo(path.join(out, 'video.mp4'), path.join(out, 'mix.wav'), path.join(out, 'film.pending.mp4'), log);
  } else {
    await execute('sh', ['core/render/mux.sh', relative('video.mp4'), relative('mix.wav'), relative('film.pending.mp4'), '24', '0']);
  }
  await fs.rename(path.join(out, 'film.pending.mp4'), path.join(out, 'film.mp4'));
  stage('生成封面');
  await execute(process.execPath, ['core/render/still.mjs', dir, '20', '--out', path.join(out, 'stills')]);
  return `/films/${id}/out/film.mp4`;
}
