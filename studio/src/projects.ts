import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const FILMS = path.join(ROOT, 'films');
export const TEMPLATE = path.join(ROOT, 'personal-styles/cloud-ink/demo');
export const PERSONAL_STYLES = ['cloud-ink', 'chinese-editorial', 'dark-product'] as const;
export type PersonalStyle = typeof PERSONAL_STYLES[number];
export function personalStyle(value: unknown = 'cloud-ink'): PersonalStyle {
  if (!PERSONAL_STYLES.includes(value as PersonalStyle)) throw new InputError('该风格没有可创建的本地模板。');
  return value as PersonalStyle;
}
export type Content = { title: string; inscription: string; seal: string };
export const DEFAULT_CONTENT: Content = { title: '一叶渡晨', inscription: '山静听风，叶落知秋', seal: '云山' };
export class InputError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export function slug(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{1,47}$/.test(value) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(value)) {
    throw new InputError('项目名须为 2–48 位小写英文字母、数字或短横线，且以字母开头。');
  }
  return value;
}
export function content(value: unknown): Content {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('内容必须为 JSON 对象。');
  const v = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const [key, max] of [['title', 8], ['inscription', 24], ['seal', 2]] as const) {
    if (typeof v[key] !== 'string' || !v[key].trim() || [...v[key]].length > max || /[\p{Cc}\p{Cf}<>]/u.test(v[key])) {
      throw new InputError(`${key} 需为 1–${max} 字的单行文字，不含控制字符或标签。`);
    }
    result[key] = v[key].trim();
  }
  return result as Content;
}
export async function within(base: string, relative: string): Promise<string> {
  if (relative.includes('\0') || relative.includes('\\') || relative.includes(':')) throw new InputError('无效路径。', 403);
  const root = await fs.realpath(base);
  const target = await fs.realpath(path.resolve(root, relative));
  const rel = path.relative(root, target);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new InputError('禁止越界访问。', 403);
  return target;
}
export async function projectPath(id: string, base = FILMS) {
  return within(base, slug(id));
}
export async function compileProject(id: string, base = FILMS) {
  const dir = await projectPath(id, base);
  const source = await within(dir, 'scene.ts');
  const destination = await within(dir, 'scene.js');
  await fs.writeFile(destination, stripTypeScriptTypes(await fs.readFile(source, 'utf8')));
}
export async function createProject(id: string, data: Content, base = FILMS, styleId: unknown = 'cloud-ink') {
  slug(id); data = content(data);
  const style = personalStyle(styleId), template = path.join(ROOT, 'personal-styles', style, 'demo');
  const metadata = JSON.parse(await fs.readFile(path.join(template, '../style.json'), 'utf8'));
  await fs.mkdir(base, { recursive: true });
  const dir = path.join(await fs.realpath(base), id);
  try { await fs.mkdir(dir); } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new InputError('同名项目已存在，不会覆盖。', 409);
    throw e;
  }
  try {
    for (const file of ['index.html', 'CREDITS']) await fs.copyFile(path.join(template, file), path.join(dir, file));
    for (const file of ['build.ps1', 'build.sh']) await fs.copyFile(path.join(TEMPLATE, file), path.join(dir, file));
    await fs.copyFile(path.join(ROOT, 'studio/audio/score-v7.py'), path.join(dir, 'score.py'));
    const scene = await fs.readFile(path.join(template, 'scene.ts'), 'utf8');
    await fs.writeFile(path.join(dir, 'scene.ts'), scene);
    await fs.writeFile(path.join(dir, 'scene.js'), stripTypeScriptTypes(scene));
    await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify(data, null, 2) + '\n');
    await fs.writeFile(path.join(dir, 'project.json'), JSON.stringify({ style, version: metadata.version, mastering: 'verified-v2', created: new Date().toISOString() }, null, 2) + '\n');
    await fs.copyFile(path.join(template, 'treatment.txt'), path.join(dir, 'TREATMENT.md'));
  } catch (error) {
    // The directory was created exclusively by this invocation; never remove an existing project.
    await fs.rm(dir, { recursive: true, force: true });
    throw error;
  }
  return { id, style, version: metadata.version, ...data, url: `/films/${id}/index.html`, video: null as string | null };
}
export async function listProjects(base = FILMS) {
  await fs.mkdir(base, { recursive: true });
  const projects = [];
  for (const e of await fs.readdir(base, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    try {
      const dir = await projectPath(e.name, base);
      const data = content(JSON.parse(await fs.readFile(path.join(dir, 'content.json'), 'utf8')));
      const meta = JSON.parse(await fs.readFile(path.join(dir, 'project.json'), 'utf8'));
      personalStyle(meta.style);
      const video = await fs.stat(path.join(dir, 'out/film.mp4')).then(() => `/films/${e.name}/out/film.mp4`).catch(() => null);
      projects.push({ id: e.name, style: meta.style as PersonalStyle, version: meta.version, ...data, url: `/films/${e.name}/index.html`, video });
    } catch { /* Unrelated user films are not studio projects. */ }
  }
  return projects.sort((a, b) => a.id.localeCompare(b.id));
}
export async function saveContent(id: string, data: unknown, base = FILMS) {
  const checked = content(data), dir = await projectPath(id, base);
  const destination = await within(dir, 'content.json');
  const temp = path.join(dir, `.content-${crypto.randomUUID()}.json`);
  await fs.writeFile(temp, JSON.stringify(checked, null, 2) + '\n', { flag: 'wx' });
  await fs.rename(temp, destination);
  return checked;
}
export async function listStyles() {
  const rows: Array<Record<string, unknown>> = [];
  for (const base of ['personal-styles', 'styles']) {
    for (const e of await fs.readdir(path.join(ROOT, base), { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      try {
        const meta = JSON.parse(await fs.readFile(path.join(ROOT, base, e.name, 'style.json'), 'utf8'));
        rows.push({ ...meta, personal: base === 'personal-styles', creatable: base === 'personal-styles' && PERSONAL_STYLES.includes(e.name as PersonalStyle), guide: `/${base}/${e.name}/STYLE.md` });
      } catch { /* Index files and incomplete upstream entries have no style metadata. */ }
    }
  }
  return rows;
}
