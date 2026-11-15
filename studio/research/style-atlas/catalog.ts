import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT } from '../../src/projects.ts';

export async function catalog() {
  const index = await fs.readFile(path.join(ROOT, 'styles/README.md'), 'utf8');
  const slugs = [...index.matchAll(/\[`([^`]+)`\]\([^)]*\/STYLE\.md\)/g)].map(m => m[1]);
  const fit = await fs.readFile(path.join(ROOT, 'studio/research/style-atlas/FIT.zh-CN.md'), 'utf8');
  const rows = fit.split('\n').filter(l => /^\| [a-z][a-z0-9-]+ \|/.test(l)).map(l => l.split('|').slice(1, -1).map(s => s.trim())).filter(r => r[0] !== 'slug');
  if (slugs.length !== 99 || new Set(slugs).size !== 99 || rows.length !== 99 || rows.some(r => !slugs.includes(r[0])) || new Set(rows.map(r => r[0])).size !== 99) throw new Error('Style coverage mismatch: review the fixed index and all authored fit rows');
  return Promise.all(slugs.map(async slug => {
    const metadata = JSON.parse(await fs.readFile(path.join(ROOT, 'styles', slug, 'style.json'), 'utf8'));
    const style = await fs.readFile(path.join(ROOT, 'styles', slug, 'STYLE.md'), 'utf8');
    if (metadata.slug !== slug || style.length < 100) throw new Error(`Invalid style ${slug}`);
    const row = rows.find(r => r[0] === slug)!;
    return { slug, name: metadata.cn as string, category: metadata.category_cn as string, needs: (metadata.needs ?? []) as string[], uses: metadata.uses as string[], content: row[2], mechanism: row[3], risk: row[4], sha256: createHash('sha256').update(style).digest('hex') };
  }));
}
