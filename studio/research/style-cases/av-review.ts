import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../../src/projects.ts';

export type Span = { file: string; start: number; end: number };
export function wavPcm(buffer: Buffer): Buffer {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Invalid WAV');
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const size = buffer.readUInt32LE(offset + 4);
    if (offset + 8 + size > buffer.length) throw new Error('Truncated WAV');
    if (buffer.toString('ascii', offset, offset + 4) === 'data') return buffer.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  throw new Error('Missing PCM data');
}
export function spans(duration: number, size: number, prefix: string, extension: string): Span[] {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(size) || size <= 0) throw new Error('Invalid duration');
  return Array.from({ length: Math.ceil(duration / size) }, (_, i) => ({
    file: `${prefix}${String(i).padStart(2, '0')}.${extension}`,
    start: i * size, end: Math.min(duration, (i + 1) * size),
  }));
}

export function responseJson(text: string) {
  try { return JSON.parse(text); } catch { /* Recover only complete, unambiguous object responses. */ }
  const objects: unknown[] = [];
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"' && depth) { quoted = true; continue; }
    if (c === '{') { if (!depth) start = i; depth++; }
    if (c === '}' && depth) {
      depth--;
      if (!depth) {
        const candidate = text.slice(start, i + 1);
        if (/^\{\s*["}]/.test(candidate)) objects.push(JSON.parse(candidate));
      }
    }
  }
  if (depth || !objects.length || objects.some(o => JSON.stringify(o) !== JSON.stringify(objects[0]))) throw new Error('Incomplete or ambiguous response');
  return objects[0];
}

export function parseResponse(stdout: string) {
  const events = stdout.trim().split(/\r?\n/).map(line => JSON.parse(line));
  const result = events.findLast(e => e.event === 'result')?.result;
  if (result?.status !== 'SUCCESS') throw new Error(`Analysis unsuccessful: ${result?.status ?? 'missing result'}`);
  const text = result.response.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const reads = events.filter(e => e.step_update?.step_type === 'tool' && e.step_update.state === 'DONE')
    .map(e => e.step_update.tool_info).filter(t => t?.name === 'read_file' || t?.name === 'view_file')
    .map(t => path.win32.basename(t.parameters.Path ?? t.parameters.AbsolutePath ?? ''));
  return { data: responseJson(text) as Record<string, any>, reads, usage: result.usage, conversation: result.conversation_id };
}

export function validateAudio(data: { clips?: { file: string; heard: string; unavailable?: boolean }[] }, plan: Span[], reads: string[]) {
  if (!Array.isArray(data.clips) || data.clips.length !== plan.length) throw new Error('Incomplete audio coverage');
  for (const item of plan) {
    const matches = data.clips.filter(c => c.file === item.file);
    if (matches.length !== 1 || matches[0].unavailable || !matches[0].heard?.trim() || !reads.includes(item.file)) {
      throw new Error(`Unverified audio input: ${item.file}`);
    }
  }
}

async function run(exe: string, args: string[], cwd: string, timeout = 600000, input?: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(exe, args, { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], timeout });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
    let out = '', err = '';
    child.stdout.setEncoding('utf8').on('data', s => { out += s; });
    child.stderr.setEncoding('utf8').on('data', s => { err = (err + s).slice(-4000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(out) : reject(new Error(`Process exit ${code}: ${err.slice(-1000)}`)));
  });
}

export async function analyze(cli: string, cwd: string, phase: string, prompt: string) {
  if (!/^(audio|visual|segment-v\d+|public-segment-synthesis)$/.test(phase)) throw new Error('Public-media analysis phases only');
  const out = await run(cli, ['--input-format', 'stream-json', '--model', 'gemini-4-hydrogen-high', '--mode', 'plan', '--sandbox',
    '--print-timeout', '480s', '--output-format', 'stream-json'], cwd, 510000,
    JSON.stringify({ event: 'user', message: { content: prompt } }) + '\n');
  await fs.writeFile(path.join(cwd, `${phase}.ndjson`), out);
  return parseResponse(out);
}

async function review(slug: string, cli: string, audioOnly: boolean) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid slug');
  const root = path.join(ROOT, '.studio/av-review-v3-verified'), dir = path.join(root, slug);
  await fs.mkdir(dir, { recursive: true });
  const source = path.join(ROOT, '.studio/style-reference-review', `${slug}.mp4`);
  const hash = createHash('sha256').update(await fs.readFile(source)).digest('hex');
  const existing = await fs.readFile(path.join(dir, 'review.json'), 'utf8').then(JSON.parse).catch(() => null);
  if (!audioOnly && existing?.hash === hash && existing?.status === 'model-analysis-awaiting-editorial-audit') {
    console.log(`${slug}: retained existing complete analysis`); return;
  }
  const metadata = JSON.parse(await run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', source], dir));
  const duration = Number(metadata.format.duration);
  if (!metadata.streams.some((s: { codec_type: string }) => s.codec_type === 'audio')) throw new Error('Audio stream absent');
  const previous = await fs.readFile(path.join(dir, 'manifest.json'), 'utf8').then(JSON.parse).catch(() => null);
  if (previous && previous.hash !== hash) throw new Error('Source changed: use a new review directory');
  // Decode once before trimming: repeated AAC seeking can drop or duplicate priming samples.
  await run('ffmpeg', ['-v', 'error', '-y', '-i', source, '-vn', '-af', 'aresample=16000:async=1:first_pts=0', '-ac', '1', 'master.wav'], dir);
  const decoded = JSON.parse(await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', 'master.wav'], dir));
  const audioDuration = Number(decoded.format.duration);
  if (!Number.isFinite(audioDuration)) throw new Error('Decoded audio duration unknown');
  const audioPlan = spans(audioDuration, 4, 'a', 'wav'), videoPlan = spans(duration, 18, 'v', 'mp4');
  if (videoPlan.length > 1 && videoPlan.at(-1)!.end - videoPlan.at(-1)!.start < 2) {
    const tail = videoPlan.pop()!; videoPlan.at(-1)!.end = tail.end;
  }
  const manifest = { slug, hash, duration, audioDuration, audioPlan, videoPlan, visualSlowdown: 6, audioRate: 16000,
    method: 'native-audio-contiguous-4s-and-native-video-sixfold-retime', status: 'prepared-not-reviewed' };
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  for (const p of audioPlan) {
    if (!(await fs.stat(path.join(dir, p.file)).catch(() => null))) {
      await run('ffmpeg', ['-v', 'error', '-y', '-i', 'master.wav', '-af', `atrim=start=${p.start}:end=${p.end},asetpts=PTS-STARTPTS`,
        '-c:a', 'pcm_s16le', p.file], dir);
    }
  }
  const masterPcm = wavPcm(await fs.readFile(path.join(dir, 'master.wav')));
  const slicedPcm = Buffer.concat(await Promise.all(audioPlan.map(async p => wavPcm(await fs.readFile(path.join(dir, p.file))))));
  if (!masterPcm.equals(slicedPcm)) throw new Error('Decoded audio was lost or duplicated at segment boundaries');
  let audio;
  try { audio = parseResponse(await fs.readFile(path.join(dir, 'audio.ndjson'), 'utf8')); validateAudio(audio.data, audioPlan, audio.reads); }
  catch {
    audio = await analyze(cli, dir, 'audio', `进行盲听，不读取画面、文档、目录、旧分析或任何其他文件，不运行命令，不写文件。必须逐一通过原生音频读取下面全部文件。每段声音保持原速，按4秒连续切分，最后一段可能不足4秒。不要猜全片时长或用想象补齐声音。每段只写实际听到的声音与变化，具体乐器/声源不确定则明说；没有声音必须写静音。禁止用故事常识反推音效。输出纯JSON，结构为{"clips":[{"file":"a00.wav","heard":"60至140字中文，包含从段首到段尾声音如何变化；有语音要转录关键句","unavailable":false,"uncertainty":"不确定的声源或词语"}]}。必须每文件恰好一条，不能省略最后一段。待读取：${audioPlan.map(p => `${p.file}（${(p.end-p.start).toFixed(3)}秒）`).join('、')}。`);
    validateAudio(audio.data, audioPlan, audio.reads);
  }
  await fs.writeFile(path.join(dir, 'audio.json'), JSON.stringify({ ...audio.data, coverage: audioPlan, hash }, null, 2));
  console.log(`${slug}: audio ${audioPlan.length}/${audioPlan.length} inputs read; semantic audit pending`);
  if (audioOnly) return;
  for (const p of videoPlan) {
    if (!(await fs.stat(path.join(dir, p.file)).catch(() => null))) {
      await run('ffmpeg', ['-v', 'error', '-y', '-ss', String(p.start), '-t', String(p.end-p.start), '-i', source, '-an',
        '-vf', 'setpts=6*(PTS-STARTPTS),scale=768:432,fps=6', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', p.file], dir);
    }
  }
  const audioNotes = audioPlan.map(p => ({ start: p.start, end: p.end, ...audio.data.clips.find((c: { file: string }) => c.file === p.file) }));
  const visual = await analyze(cli, dir, 'visual', `对一支原片做完整时间线观摩与声画综合分析，禁止读任何其它文件、源码或文字说明，禁止命令、外部工具和文件编辑。必须原生读取下列所有视频：${videoPlan.map(p=>`${p.file}对应原片${p.start.toFixed(3)}至${p.end.toFixed(3)}秒`).join('；')}。视频全部为原片连续区间放慢6倍且去声，目的是将默认每视频秒1帧提高到每原片秒约6帧；视频时间除6并加区间起点才是原片时间。不可把慢放当原片速度。原音轨已独立盲听、逐段覆盖且保持原速，以下是每4秒实际听音记录：${JSON.stringify(audioNotes)}。声源名称仍有不确定性；视觉里的碰撞不能自动推断为物理拟音。有疑问可原生读取对应a*.wav重新核听，不能只看分析文字编声音。不要称真人实时观看或逐帧验收。输出纯JSON结构：{"access":[{"file":"v00.mp4","available":true,"first":"段首具体画面","last":"段尾具体画面"}],"story":"从开场到结局的具体因果，不少于180字，区分推测","beats":[{"start":0,"end":4,"visible":"具体动作/信息变化","audible":"该区间实际听音记录，不把不确定音色写成确定事实","function":"声音怎样改变此处的期待、理解或情绪","uncertainty":"声音时点仅按4秒区间定位，画面动作有约0.17秒采样误差"}],"strengths":["3条具体机制，不吹捧"],"weaknesses":["实际问题，避免挑片源风格自身特征作缺点"],"grammar":["3条适用于新内容的原则，不能复制原片道具/情节"],"ending":"片尾最后声画变化","uncertainties":["未能确认的内容"]}。beats按叙事切段、连续覆盖0至${duration}秒，至少8段；禁止伪造逐帧卡点。总长度控制在3000中文字符左右，具体而紧凑。`);
  for (const p of videoPlan) {
    if (!visual.reads.includes(p.file) || !visual.data.access?.some((a: { file: string; available: boolean })=>a.file===p.file&&a.available)) throw new Error(`Unverified visual input: ${p.file}`);
  }
  if (!Array.isArray(visual.data.beats) || visual.data.beats.length < 8) throw new Error('Missing narrative timeline');
  await fs.writeFile(path.join(dir, 'review.json'), JSON.stringify({ ...manifest, status: 'model-analysis-awaiting-editorial-audit',
    audio: audioNotes, review: visual.data, usage: { audio: audio.usage, visual: visual.usage } }, null, 2));
  console.log(`${slug}: complete timeline model analysis available; editorial audit pending`);
}

async function main() {
  const args = process.argv.slice(2), arg = (name: string) => args[args.indexOf(name) + 1];
  if (!args.includes('--cli')) throw new Error('Usage: --cli executable (--slug style | --all) [--audio-only]');
  if (args.includes('--slug')) return review(arg('--slug'), arg('--cli'), args.includes('--audio-only'));
  if (!args.includes('--all')) throw new Error('Missing style selection');
  const gate = JSON.parse(await fs.readFile(path.join(ROOT, 'studio/research/style-cases/av-pilot-validation.json'), 'utf8'));
  if (gate.passed !== true || gate.model !== 'gemini-4-hydrogen-high') throw new Error('Pilot not validated');
  const manifest: { slug: string }[] = JSON.parse(await fs.readFile(path.join(ROOT, '.studio/style-reference-review/manifest.json'), 'utf8'));
  let next = 0, failed = 0, stopped = false;
  const concurrency = args.includes('--concurrency') ? Number(arg('--concurrency')) : 3;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('Concurrency must be 1..4');
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (!stopped && next < manifest.length) {
      const i = next++, slug = manifest[i].slug;
      try { await review(slug, arg('--cli'), false); console.log(`READY ${i+1}/99 ${slug}`); }
      catch (error) {
        if (/RESOURCE_EXHAUSTED|quota reached|quota exceeded|Resets in|429/i.test(String(error))) stopped = true;
        failed++; console.log(`FAILED ${i+1}/99 ${slug}: ${String(error).slice(0,400)}`);
        await fs.writeFile(path.join(ROOT, '.studio/av-review-v3-verified', slug, 'failure.json'), JSON.stringify({ slug, error: String(error) }, null, 2));
      }
    }
  }));
  if (failed) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
