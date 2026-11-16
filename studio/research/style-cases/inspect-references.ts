import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { catalog } from '../style-atlas/catalog.ts';
import { ROOT } from '../../src/projects.ts';

const dir = path.join(ROOT, '.studio/style-reference-review');
await fs.mkdir(dir, { recursive: true });
const styles = await catalog();
const release = spawnSync('gh', ['api', 'repos/lemomo-ai/lemo-opuscar/releases/tags/web'], { windowsHide: true, encoding: 'utf8', maxBuffer: 8e6 });
if (release.status !== 0) throw new Error(release.stderr);
const assets: { name: string; size: number; browser_download_url: string }[] = JSON.parse(release.stdout).assets;
const results: Record<string, unknown>[] = [];
let next = 0;
async function worker() {
  while (next < styles.length) {
    const index = next++, style = styles[index];
    const asset = assets.find(a => a.name === `${style.slug}.mp4`);
    if (!asset) throw new Error(`Missing released reference ${style.slug}`);
    const file = path.join(dir, asset.name);
    try {
      const exists = await fs.stat(file).catch(() => null);
      if (!exists || exists.size !== asset.size) {
        await new Promise<void>((resolve, reject) => {
          const child = spawn('gh', ['release', 'download', 'web', '--repo', 'lemomo-ai/lemo-opuscar', '--pattern', asset.name, '--dir', dir, '--clobber'], { windowsHide: true, stdio: 'ignore', timeout: 600000 });
          child.on('error', reject);
          child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Download exit ${code}`)));
        });
        if ((await fs.stat(file)).size !== asset.size) throw new Error('Release size mismatch');
      }
      const probe = spawnSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], { windowsHide: true, encoding: 'utf8' });
      if (probe.status !== 0) throw new Error(probe.stderr);
      const metadata = JSON.parse(probe.stdout), duration = Number(metadata.format.duration);
      const sheet = path.join(dir, `${style.slug}.jpg`);
      const filter = `select='isnan(prev_selected_t)+gte(t-prev_selected_t,${duration / 24})',scale=400:225,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.7,tile=4x6`;
      const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', filter, '-frames:v', '1', '-update', '1', sheet], { windowsHide: true, encoding: 'utf8' });
      if (ff.status !== 0) throw new Error(ff.stderr.slice(-1000));
      results.push({ number: index + 1, slug: style.slug, url: asset.browser_download_url, bytes: asset.size, sha256: createHash('sha256').update(await fs.readFile(file)).digest('hex'), duration, samples: 24, audioPresent: metadata.streams.some((s: { codec_type: string }) => s.codec_type === 'audio'), status: 'extracted-not-yet-reviewed' });
      console.log(`${index + 1}/99 ${style.slug}: ${duration}s; extracted only`);
    } catch (e) {
      results.push({ number: index + 1, slug: style.slug, url: asset.browser_download_url, error: String(e), status: 'failed' });
      console.log(`FAILED ${style.slug}: ${String(e).slice(0,200)}`);
    }
    await fs.writeFile(path.join(dir, `manifest-${index + 1}.json`), JSON.stringify(results.find(r => r.slug === style.slug), null, 2));
  }
}
await Promise.all(Array.from({ length: 6 }, () => worker()));
await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(results.sort((a, b) => Number(a.number) - Number(b.number)), null, 2));
console.log(`Extracted ${results.filter(r => r.status !== 'failed').length}/99. Extraction does not constitute audiovisual viewing.`);
if (results.some(r => r.status === 'failed')) process.exitCode = 1;
