import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../src/projects.ts';
import { revisedCases, parseTable, validateV2, type Proposal, type Source } from './v2.ts';

export const REVISION = 'v3-editorial-av-2026-11-16';
export const STORAGE_KEY = 'lemo-style-case-candidates-v3';
export const researchDir = path.join(ROOT, 'studio/research/style-cases');
export type Decision = 'retain' | 'refine' | 'rewrite';
export type OptionEdit = { key: string; decision: Decision; reason: string; sound: string; changes: Partial<Omit<Proposal, 'slug' | 'key'>> };
export type Editorial = { slug: string; lesson: string; caution: string; options: OptionEdit[] };
export type Beat = { start: number; end: number; visible: string; audible: string; function: string; uncertainty?: string };
export type Observation = { slug: string; hash: string; duration: number; audioDuration: number; audioInputs: number; videoInputs: number;
  method: string; story: string; ending: string; beats: Beat[]; uncertainties: string[]; editorialReviewed: boolean };
export type ReviewedProposal = Proposal & Omit<OptionEdit, 'changes'> & { previousTitle: string };

export function mergeEditorial(base: Proposal[], edits: Editorial[], sources: Source[]): ReviewedProposal[] {
  const slugs = [...new Set(base.map(o => o.slug))];
  if (edits.length !== slugs.length || new Set(edits.map(e => e.slug)).size !== slugs.length || edits.some(e => !slugs.includes(e.slug))) throw new Error('Editorial coverage must match the catalog');
  const rows = slugs.flatMap(slug => {
    const edit = edits.find(e => e.slug === slug)!;
    if (!edit.lesson?.trim() || !edit.caution?.trim() || edit.options.map(o => o.key).join('') !== 'ABC') throw new Error(`Incomplete editorial: ${slug}`);
    return edit.options.map(o => {
      const original = base.find(p => p.slug === slug && p.key === o.key)!;
      if (!['retain', 'refine', 'rewrite'].includes(o.decision) || o.reason.length < 12 || o.sound.length < 12) throw new Error(`Missing substantive audit: ${slug}/${o.key}`);
      if (Object.keys(o.changes).some(k => !['title', 'story', 'value', 'mechanism', 'evidence', 'gate'].includes(k))) throw new Error('Unsafe editorial override');
      if (o.decision === 'rewrite' && (!o.changes.story || o.changes.story === original.story)) throw new Error(`Rewrite did not change story: ${slug}/${o.key}`);
      return { ...original, ...o.changes, slug, key: o.key, decision: o.decision, reason: o.reason, sound: o.sound, previousTitle: original.title };
    });
  });
  validateV2(rows, slugs, sources.map(s => s.id));
  return rows;
}

export function validateObservation(o: Observation) {
  if (!/^[a-f0-9]{64}$/.test(o.hash) || !(o.duration > 0) || !(o.audioDuration > 0) || o.audioInputs < 1 || o.videoInputs < 1 || o.beats.length < 8) throw new Error(`Incomplete observation: ${o.slug}`);
  let end = 0;
  for (const b of o.beats) {
    if (!Number.isFinite(b.start) || !Number.isFinite(b.end) || Math.abs(b.start - end) > 0.3 || b.end <= b.start || !b.visible?.trim() || !b.audible?.trim() || !b.function?.trim()) throw new Error(`Invalid narrative timeline: ${o.slug}`);
    end = b.end;
  }
  if (Math.abs(end - o.duration) > 0.3) throw new Error(`Missing ending: ${o.slug}`);
}

export async function editorialCases() {
  const base = await revisedCases();
  const files = (await fs.readdir(path.join(researchDir, 'editorial-v3'))).filter(f => f.endsWith('.json')).sort();
  const edits: Editorial[] = (await Promise.all(files.map(f => fs.readFile(path.join(researchDir, 'editorial-v3', f), 'utf8').then(JSON.parse)))).flat();
  const extra = parseTable(await fs.readFile(path.join(researchDir, 'sources-v3-additions.tsv'), 'utf8'), 6).map(([id, title, url, role, checked, boundary]) => ({ id, title, url, role, checked, boundary }));
  const sources = [...base.sources, ...extra];
  if (new Set(sources.map(s => s.id)).size !== sources.length || sources.some(s => new URL(s.url).protocol !== 'https:')) throw new Error('Invalid v3 sources');
  const proposals = mergeEditorial(base.rows.flatMap(r => r.options), edits, sources);
  const observations: Observation[] = JSON.parse(await fs.readFile(path.join(researchDir, 'av-observations-v3.json'), 'utf8'));
  if (new Set(observations.map(o => o.slug)).size !== observations.length || observations.some(o => !base.rows.some(r => r.slug === o.slug))) throw new Error('Invalid observation catalog');
  observations.forEach(validateObservation);
  const rows = base.rows.map(row => {
    const edit = edits.find(e => e.slug === row.slug)!;
    const observation = observations.find(o => o.slug === row.slug) ?? null;
    if (observation?.editorialReviewed && /待补|未成功输出|重试中/.test(edit.lesson)) throw new Error(`Premature review status: ${row.slug}`);
    return { ...row, lesson: edit.lesson, caution: edit.caution, original: observation, options: proposals.filter(o => o.slug === row.slug) };
  });
  return { revision: REVISION, status: 'discussion-draft-not-production-approval', sources, rows,
    counts: { styles: rows.length, candidates: proposals.length, modelAudiovisual: observations.length, editorialAudiovisual: observations.filter(o => o.editorialReviewed).length,
      decisions: Object.fromEntries(['retain', 'refine', 'rewrite'].map(d => [d, proposals.filter(o => o.decision === d).length])) } };
}
