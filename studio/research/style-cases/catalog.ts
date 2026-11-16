import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../src/projects.ts';
import { catalog } from '../style-atlas/catalog.ts';

export type Candidate = { key: 'A' | 'B' | 'C'; title: string; story: string };
export type CandidateRow = { slug: string; options: Candidate[] };
export function validateCandidates(value: unknown, slugs: string[]): asserts value is CandidateRow[] {
  if (!Array.isArray(value) || value.length !== slugs.length) throw new Error('Every style must have a candidate row');
  const seen = new Set<string>(), titles = new Set<string>();
  for (const row of value) {
    if (!row || !slugs.includes(row.slug) || seen.has(row.slug)) throw new Error('Unknown or duplicate style');
    seen.add(row.slug);
    if (!Array.isArray(row.options) || row.options.length !== 3) throw new Error(`Three candidates required: ${row.slug}`);
    for (let i = 0; i < 3; i++) {
      const c = row.options[i];
      if (!c || c.key !== 'ABC'[i] || typeof c.title !== 'string' || c.title.trim().length < 2 || typeof c.story !== 'string' || c.story.trim().length < 35) throw new Error(`Incomplete candidate: ${row.slug}`);
      if (titles.has(c.title)) throw new Error(`Duplicate candidate title: ${c.title}`);
      titles.add(c.title);
    }
  }
}
export async function cases() {
  const styles = await catalog();
  const data: unknown = JSON.parse(await fs.readFile(path.join(ROOT, 'studio/research/style-cases/candidates.json'), 'utf8'));
  validateCandidates(data, styles.map(s => s.slug));
  return styles.map((style, i) => ({ ...style, number: String(i + 1).padStart(2, '0'), options: data.find(r => r.slug === style.slug)!.options }));
}
