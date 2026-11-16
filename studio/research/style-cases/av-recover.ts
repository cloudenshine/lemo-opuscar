import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../src/projects.ts';
import { analyze, parseResponse, validateAudio, type Span } from './av-review.ts';

const args = process.argv.slice(2), arg = (name:string)=>args[args.indexOf(name)+1];
if (!args.includes('--slug') || !args.includes('--cli') || !/^[a-z0-9-]+$/.test(arg('--slug'))) throw new Error('Expected --slug style --cli executable');
const dir = path.join(ROOT,'.studio/av-review-v3-verified',arg('--slug'));
const manifest = JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const audio = parseResponse(await fs.readFile(path.join(dir,'audio.ndjson'),'utf8'));
validateAudio(audio.data,manifest.audioPlan,audio.reads);
const audioNotes = manifest.audioPlan.map((p:Span)=>({...p,...audio.data.clips.find((c:{file:string})=>c.file===p.file)}));
const chunks = [];
for (const p of manifest.videoPlan as Span[]) {
  const phase = `segment-${p.file.slice(0,-4)}`;
  let result;
  try { result = parseResponse(await fs.readFile(path.join(dir,phase+'.ndjson'),'utf8')); } catch { /* Retry incomplete public-media analysis only. */ }
  if (!result) result = await analyze(arg('--cli'),dir,phase,
    `只原生读取视频${p.file}，不要目录枚举、命令或其他文件。该视频对应公开示范片原时间${p.start}至${p.end}秒，去声放慢6倍；视频时间除6加${p.start}才是原时间，不可把慢放当原片节奏。原速音轨已逐段原生读取，相关听音记录：${JSON.stringify(audioNotes.filter((a:Span)=>a.end>p.start&&a.start<p.end))}。结合画面与听音记录分析这一连续区间，不推断前后没看见的剧情。声音时点按4秒窗口，音色不确定则保留不确定。输出纯JSON对象，1000中文字以内：{"access":{"file":"${p.file}","available":true,"first":"第一画面","last":"最后画面"},"story":"本段可见具体事件和因果，推测须标注","beats":[{"start":${p.start},"end":数字,"visible":"动作或信息变化","audible":"本区间实际声音","function":"声画关系","uncertainty":"定位/内容不确定"}],"strength":"一个可见叙事机制","caution":"不确定处"}。beats至少3段，连续覆盖${p.start}至${p.end}。不需要分析其他文件，若无法读取请返回available:false，不尝试运行命令解决。`);
  if (!result.reads.includes(p.file) || result.data.access?.available!==true || !Array.isArray(result.data.beats) || result.data.beats.length<3) throw new Error(`Missing native segment ${p.file}`);
  chunks.push(result.data);
  console.log(`${arg('--slug')}: native segment ${p.file} reviewed`);
}
const synthesis = await analyze(arg('--cli'),dir,'public-segment-synthesis',
  `以下仅为一支公开示范片的完整连续分段观摩结果及原速音轨盲听记录，不含个人作品内容。此步骤仅汇总，不调用任何工具、不读任何文件。不要声称此步骤又看过媒体，不增加分段未确认事实。片长${manifest.duration}秒。画面分段：${JSON.stringify(chunks)}。声音：${JSON.stringify(audioNotes)}。输出纯JSON，1500中文字以内：{"story":"从开场到结尾的完整因果，标明推测","strengths":["3条具体声画或叙事关系"],"weaknesses":["实际限制而非音色猜测"],"grammar":["3条可迁移关系，不把具体剧情当风格法则"],"ending":"最后声音与画面","uncertainties":["未确认处"]}。`);
await fs.writeFile(path.join(dir,'review.json'),JSON.stringify({...manifest,status:'model-analysis-awaiting-editorial-audit',audio:audioNotes,
  review:{...synthesis.data,access:chunks.map(c=>c.access),beats:chunks.flatMap(c=>c.beats)},
  recovery:'Native video read in bounded consecutive segments; complete original-speed audio retained; synthesis uses those observations only.'},null,2));
console.log(`${arg('--slug')}: recovered complete segmented audiovisual analysis`);
