import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, createProject, listStyles, DEFAULT_CONTENT, personalStyle, PERSONAL_STYLES } from './projects.ts';
import { createStudio } from './server.ts';
import { renderProject } from './render.ts';

const [command, arg] = process.argv.slice(2);
try {
  if (command === 'serve') {
    const port = Number(arg || '43821');
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('端口必须为 1024–65535。');
    const server = createStudio();
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Cloud & Ink Studio: http://127.0.0.1:${port}`));
  } else if (command === 'create') {
    const options = process.argv.slice(4), styleIndex = options.indexOf('--style');
    if (styleIndex >= 0 && !options[styleIndex + 1]) throw new Error('--style requires a value');
    const style = personalStyle(styleIndex < 0 ? undefined : options[styleIndex + 1]);
    if (styleIndex >= 0) options.splice(styleIndex, 2);
    if (options.length > 1 || options[0]?.startsWith('--')) throw new Error('usage: create <slug> [content.json] [--style <style>]');
    const meta = JSON.parse(await fs.readFile(path.join(ROOT, 'personal-styles', style, 'style.json'), 'utf8'));
    const data = options[0] ? JSON.parse(await fs.readFile(path.resolve(options[0]), 'utf8')) : meta.defaults || DEFAULT_CONTENT;
    console.log(JSON.stringify(await createProject(arg, data, undefined, style), null, 2));
  } else if (command === 'styles') {
    console.log(JSON.stringify(await listStyles(), null, 2));
  } else if (command === 'render') {
    console.log(await renderProject(arg, console.log));
  } else if (command === 'doctor') {
    const python = path.join(ROOT, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    const checks: Array<[string, string, string[]]> = [
      ['Node 24+', process.execPath, ['-e', 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)']],
      ['FFmpeg', 'ffmpeg', ['-version']], ['FFprobe', 'ffprobe', ['-version']],
      ['Git Bash / sh', 'sh', ['-c', 'command -v awk >/dev/null && command -v sed >/dev/null']],
      ['Python audio', python, ['-c', 'import numpy, scipy, soundfile, soxr, PIL, numba']],
      ['Chromium', process.execPath, ['--input-type=module', '-e', 'import {chromium} from "playwright-core";const b=await chromium.launch({headless:true});await b.close();']],
    ];
    let failed = false;
    for (const [name, cmd, args] of checks) {
      const result = spawnSync(cmd, args, { cwd: ROOT, windowsHide: true, encoding: 'utf8', timeout: 60000 });
      console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${name}`);
      if (result.status !== 0) { failed = true; console.error(result.error?.message || result.stderr.slice(-1000)); }
    }
    process.exitCode = failed ? 1 : 0;
  } else if (command === 'guard') {
    for (const style of PERSONAL_STYLES) {
    for (const file of ['STYLE.md', 'CHANGES.md', 'DEMO.md', 'style.json', 'demo/scene.ts', 'demo/index.html', 'demo/CREDITS']) {
      await fs.access(path.join(ROOT, 'personal-styles', style, file));
    }
    const source = await fs.readFile(path.join(ROOT, 'personal-styles', style, 'demo/scene.ts'), 'utf8');
    if (/Math\.random\(|Date\.now\(/.test(source)) throw new Error('Film rendering must be deterministic.');
    }
    const styles = await listStyles();
    if (styles.length < 100 || new Set(styles.map(s => s.slug)).size !== styles.length) throw new Error('Style catalog is incomplete or contains duplicate slugs.');
    console.log(`PASS ${styles.length} styles, required source files, deterministic scene`);
  } else {
    console.log('Cloud & Ink Studio\n  node studio/src/cli.ts serve [43821]\n  node studio/src/cli.ts doctor\n  node studio/src/cli.ts styles\n  node studio/src/cli.ts create <slug> [content.json] [--style cloud-ink|chinese-editorial|dark-product]\n  node studio/src/cli.ts render <slug>\n  node studio/src/cli.ts guard');
    if (command && command !== 'help' && command !== '--help') process.exitCode = 2;
  }
} catch (error) { console.error((error as Error).message); process.exitCode = 1; }
