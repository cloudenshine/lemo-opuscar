import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../src/projects.ts';
import { catalog } from '../style-atlas/catalog.ts';
import { revisedCases } from './v2.ts';

export async function researchQueue() {
  const styles = await catalog();
  const text = await fs.readFile(path.join(ROOT, 'studio/research/style-cases/RESEARCH-QUEUE.tsv'), 'utf8');
  const rows = text.trim().split(/\r?\n/).slice(1).map(line => line.split('\t'));
  if (rows.length !== styles.length || new Set(rows.map(r => r[0])).size !== styles.length || rows.some(r => r.length !== 6 || r.some(c => !c.trim())) || rows.some(r => !styles.some(s => s.slug === r[0]))) {
    throw new Error('Research queue must cover each official style exactly once with six populated fields');
  }
  return styles.map((style, i) => {
    const [, question, audienceHypothesis, valueHypothesis, searchEntry, evidenceGap] = rows.find(r => r[0] === style.slug)!;
    return { number: String(i + 1).padStart(2, '0'), slug: style.slug, name: style.name, category: style.category, question, audienceHypothesis, valueHypothesis, searchEntry, evidenceGap, status: 'research-question-not-approved-pitch' as const };
  });
}

export async function buildResearch() {
  const rows = await researchQueue();
  const revised = await revisedCases();
  const report = await fs.readFile(path.join(ROOT, 'studio/research/style-cases/RESEARCH.zh-CN.md'), 'utf8');
  const dir = path.join(ROOT, 'films/style-case-research');
  try { await fs.mkdir(dir); } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    if (JSON.parse(await fs.readFile(path.join(dir, 'study.json'), 'utf8')).owner !== 'style-case-research') throw new Error('Unowned research output directory');
  }
  await fs.writeFile(path.join(dir, 'study.json'), JSON.stringify({ owner: 'style-case-research' }));
  await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify({ schema: 2, status: 'initial-research-archive-revised-draft-available', targetStyles: 99, targetCandidates: 297, revisedCandidates: revised.rows.flatMap(r => r.options).length, sampledOriginals: revised.rows.length, fullVideoReviews: 0, commentContextsRead: 5, revisedPage: '/films/style-case-candidates-v2/index.html', rows }, null, 2));
  const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const inline = (s: string) => esc(s).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>').replaceAll('[99项研究入口](RESEARCH-QUEUE.tsv)', '<a href="#queue">99项研究入口</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Render only the authored subset; escape text before introducing trusted markup.
  const blocks = report.split(/\r?\n\s*\r?\n/).map(block => {
    if (block.startsWith('|')) {
      const lines = block.split(/\r?\n/).filter(l => !/^\|[-| ]+\|$/.test(l));
      return `<div class="table-wrap"><table>${lines.map((line, i) => `<tr>${line.split('|').slice(1, -1).map(c => `<${i ? 'td' : 'th'}>${inline(c.trim())}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table></div>`;
    }
    const heading = block.match(/^(#{1,3}) (.+)$/);
    if (heading) return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    return `<p>${inline(block).replaceAll('\n', '<br>')}</p>`;
  }).join('\n');
  const cards = rows.map(r => `<article data-slug="${r.slug}"><small>${r.number} · ${esc(r.category)}</small><h3>${esc(r.name)}</h3><p><b>研究问题</b> ${esc(r.question)}</p><p><b>相关处境假设</b> ${esc(r.audienceHypothesis)}</p><p><b>价值假设</b> ${esc(r.valueHypothesis)}</p><p><b>检索入口</b> ${esc(r.searchEntry)}</p><p class="gap"><b>待补证据</b> ${esc(r.evidenceGap)}</p><a href="/styles/${r.slug}/STYLE.md">风格规范</a></article>`).join('');
  await fs.writeFile(path.join(dir, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>99种风格 · 内容价值研究</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f4f2ec;color:#25383c;font:17px/1.8 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:32px 22px}h1{font-size:clamp(30px,5vw,49px);line-height:1.3}h2{margin-top:48px}h3{margin:6px 0}a{color:#8b4128;overflow-wrap:anywhere}p{max-width:1000px}nav{display:flex;gap:20px;flex-wrap:wrap}.table-wrap{overflow:auto}table{border-collapse:collapse;min-width:900px}th,td{text-align:left;vertical-align:top;padding:14px;border:1px solid #c4cdc8;font-size:15px}th{background:#e1e7e0}td:first-child{white-space:nowrap}#filter{width:100%;padding:14px;font:inherit;border:1px solid #8caaa1;background:#fff}#queue-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}article{padding:22px;background:#fffdf9;border:1px solid #ccd3cb;border-radius:6px}article[hidden]{display:none}small,.gap{color:#675d4f}article p{font-size:16px}.status{border-left:5px solid #a14a2f;padding:12px 20px;background:#efe1cd}@media(max-width:720px){#queue-cards{grid-template-columns:1fr}main{padding:22px 16px}}</style>
<main><nav><a href="#queue">跳到99项研究入口</a><a href="/films/style-case-candidates/index.html">旧稿档案与历史意见</a></nav><p class="status">本页是第一阶段研究档案。<a href="/films/style-case-candidates-v2/index.html">新版297候选与评论核实记录已在独立审阅页</a>。下方旧阶段的未完成数量保留为历史记录；当前99支原片完成画面抽样，完整影音仍未核完。</p>${blocks}<section id="queue"><h2>99项研究入口</h2><p>每项都待补证；下列内容是研究问题，不是新提案。相关处境允许继续扩展，不构成受众限制，也不把一种风格永久绑定到一个主题。</p><input id="filter" type="search" aria-label="搜索研究入口" placeholder="风格、问题、处境、价值或平台"><p id="count" role="status">显示99 / 99项研究入口</p><div id="queue-cards">${cards}</div></section></main>
<script>const input=document.querySelector('#filter'),cards=[...document.querySelectorAll('article')];input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();let n=0;for(const c of cards){c.hidden=!c.textContent.toLowerCase().includes(q);if(!c.hidden)n++}document.querySelector('#count').textContent='显示'+n+' / 99项研究入口'});</script></html>`);
  console.log('Built initial research archive linked to the revised 297-candidate draft.');
}
