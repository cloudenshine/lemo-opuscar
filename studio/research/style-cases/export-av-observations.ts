import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT } from '../../src/projects.ts';
import { parseResponse, validateAudio, type Span } from './av-review.ts';
import { researchDir, validateObservation, type Editorial, type Observation } from './v3.ts';

const edits: Editorial[] = (await Promise.all((await fs.readdir(path.join(researchDir, 'editorial-v3'))).filter(f => f.endsWith('.json')).map(f => fs.readFile(path.join(researchDir, 'editorial-v3', f), 'utf8').then(JSON.parse)))).flat();
const observations: Observation[] = [];
for (const edit of edits) {
  const dir = path.join(ROOT, '.studio/av-review-v3-verified', edit.slug);
  const file = path.join(dir, 'review.json');
  const exists = await fs.stat(file).catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
  if (!exists) continue;
  const raw = JSON.parse(await fs.readFile(file, 'utf8'));
  const hash = createHash('sha256').update(await fs.readFile(path.join(ROOT, '.studio/style-reference-review', edit.slug + '.mp4'))).digest('hex');
  if (raw.hash !== hash) throw new Error(`Source changed: ${edit.slug}`);
  const audio = parseResponse(await fs.readFile(path.join(dir, 'audio.ndjson'), 'utf8'));
  validateAudio(audio.data, raw.audioPlan, audio.reads);
  if (raw.recovery?.startsWith('Native video read in bounded')) {
    for (const p of raw.videoPlan as Span[]) {
      const segment = parseResponse(await fs.readFile(path.join(dir, `segment-${p.file.slice(0, -4)}.ndjson`), 'utf8'));
      if (!segment.reads.includes(p.file) || segment.data.access?.available !== true) throw new Error(`Missing native segment: ${edit.slug}/${p.file}`);
    }
  } else {
    const visual = parseResponse(await fs.readFile(path.join(dir, 'visual.ndjson'), 'utf8'));
    if (raw.videoPlan.some((p: Span) => !visual.reads.includes(p.file) || !visual.data.access?.some((a: { file: string; available: boolean }) => a.file === p.file && a.available))) throw new Error(`Missing native video: ${edit.slug}`);
  }
  const observation: Observation = { slug: edit.slug, hash, duration: raw.duration, audioDuration: raw.audioDuration,
    audioInputs: raw.audioPlan.length, videoInputs: raw.videoPlan.length, method: raw.method,
    story: raw.review.story, ending: raw.review.ending, beats: raw.review.beats, uncertainties: raw.review.uncertainties ?? [],
    editorialReviewed: !/待补|未成功输出|重试中/.test(edit.lesson) };
  validateObservation(observation);
  observations.push(observation);
}
await fs.writeFile(path.join(researchDir, 'av-observations-v3.json'), JSON.stringify(observations, null, 2) + '\n');
console.log(`Exported ${observations.length} public-media observations without local paths, credentials or raw model logs.`);
