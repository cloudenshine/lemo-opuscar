import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../../src/projects.ts';
import { catalog } from '../style-atlas/catalog.ts';

const dir = path.join(ROOT, '.studio/style-reference-review');
const styles = await catalog();
const groups: string[][] = [];
for (const [i, style] of styles.entries()) {
  const file = path.join(dir, `${style.slug}.mp4`);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { windowsHide: true, encoding: 'utf8' });
  if (probe.status !== 0) throw new Error(`Cannot read ${style.slug}: ${probe.stderr}`);
  const output = path.join(dir, `six-${style.slug}.jpg`);
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `select='isnan(prev_selected_t)+gte(t-prev_selected_t,${Number(probe.stdout) / 6})',scale=384:216,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.8,tile=3x2,pad=1152:456:0:24:color=white,drawtext=text='${i + 1} ${style.slug} — SIX FRAME SAMPLE':x=8:y=2:fontsize=18:fontcolor=black`, '-frames:v', '1', '-update', '1', output], { windowsHide: true, encoding: 'utf8' });
  if (ff.status !== 0) throw new Error(ff.stderr);
  const group = Math.floor(i / 4); (groups[group] ??= []).push(output);
}
for (const [i, files] of groups.entries()) {
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', files.length > 1 ? `vstack=inputs=${files.length}` : 'null', '-frames:v', '1', '-update', '1', path.join(dir, `overview-${String(i + 1).padStart(2, '0')}.jpg`)], { windowsHide: true, encoding: 'utf8' });
  if (ff.status !== 0) throw new Error(ff.stderr);
}
console.log(`Built ${groups.length} contact sheets. Sampling is not complete audiovisual viewing.`);
