import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../src/projects.ts';
import { catalog } from '../style-atlas/catalog.ts';

export const REVISION = 'v2-evidence-informed-2026-11-16';
export const STORAGE_KEY = 'lemo-style-case-candidates-v2';
const dir = path.join(ROOT, 'studio/research/style-cases');
export type Source = { id: string; title: string; url: string; role: string; checked: string; boundary: string };
export type Proposal = { slug: string; key: string; title: string; story: string; value: string; mechanism: string; evidence: string[]; gate: string };
export function parseTable(text: string, columns: number): string[][] {
  const lines = text.trim().split(/\r?\n/);
  if (lines[0].split('\t').length !== columns) throw new Error('Invalid header');
  return lines.slice(1).map((line, i) => {
    const cells = line.split('\t');
    if (cells.length !== columns || cells.some(c => !c.trim() || c !== c.trim())) throw new Error(`Invalid TSV row ${i + 2}`);
    return cells;
  });
}
export async function sourcesV2(): Promise<Source[]> {
  const rows = parseTable(await fs.readFile(path.join(dir, 'sources-v2.tsv'), 'utf8'), 6);
  if (new Set(rows.map(r => r[0])).size !== rows.length) throw new Error('Duplicate source');
  return rows.map(([id, title, url, role, checked, boundary]) => {
    if (new URL(url).protocol !== 'https:') throw new Error('Unsafe source URL');
    return { id, title, url, role, checked, boundary };
  });
}
export function validateV2(rows: Proposal[], slugs: string[], ids: string[]) {
  if (rows.length !== slugs.length * 3) throw new Error('Expected three proposals per style');
  const titles = new Set<string>();
  for (const slug of slugs) {
    const options = rows.filter(r => r.slug === slug);
    if (options.map(r => r.key).join('') !== 'ABC') throw new Error(`Missing or duplicate alternatives: ${slug}`);
    for (const r of options) {
      if (r.story.length < 45 || r.title.length < 4 || r.value.length < 6 || r.mechanism.length < 8 || r.gate.length < 8) throw new Error(`Incomplete proposal: ${slug}/${r.key}`);
      if (!r.evidence.length || new Set(r.evidence).size !== r.evidence.length || r.evidence.some(id => !ids.includes(id))) throw new Error(`Unresolved evidence: ${slug}/${r.key}`);
      if (titles.has(r.title)) throw new Error(`Duplicate title: ${r.title}`);
      titles.add(r.title);
    }
  }
}
export async function revisedCases() {
  const [styles, sources, table, observed] = await Promise.all([
    catalog(), sourcesV2(), fs.readFile(path.join(dir, 'revised-candidates.tsv'), 'utf8'),
    fs.readFile(path.join(dir, 'observations-v2.tsv'), 'utf8'),
  ]);
  const proposals = parseTable(table, 8).map(([slug, key, title, story, value, mechanism, evidence, gate]) => ({ slug, key, title, story, value, mechanism, evidence: evidence.split(','), gate }));
  validateV2(proposals, styles.map(s => s.slug), sources.map(s => s.id));
  const observations = parseTable(observed, 3);
  if (observations.length !== styles.length || new Set(observations.map(r => r[0])).size !== styles.length || observations.some(r => !styles.some(s => s.slug === r[0]))) throw new Error('Original-frame observations must cover exactly 99 styles');
  return { revision: REVISION, sources, rows: styles.map((style, i) => {
    const [, observation, implication] = observations.find(r => r[0] === style.slug)!;
    return { ...style, number: String(i + 1).padStart(2, '0'), observation, implication, reviewLevel: 'six-frame-visual-sample-not-complete-audiovisual' as const, options: proposals.filter(r => r.slug === style.slug) };
  }) };
}
