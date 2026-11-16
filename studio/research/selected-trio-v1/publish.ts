import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT} from '../../src/projects.ts';
import {films} from './timeline.ts';
const source=path.dirname(fileURLToPath(import.meta.url)),dir=path.join(ROOT,'films/selected-trio-v1-review'),owner='selected-trio-v1-review';
try{await fs.mkdir(dir);}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;if(JSON.parse(await fs.readFile(path.join(dir,'study.json'),'utf8')).owner!==owner)throw new Error('Output belongs to another project');}
await fs.writeFile(path.join(dir,'study.json'),JSON.stringify({owner,artisticApproval:false}));
let html=await fs.readFile(path.join(source,'review.html'),'utf8');
html=html.replaceAll('canal-water-v1/','canal-water-v1-vo/').replaceAll('window-spectrum-previs-v1/','window-spectrum-previs-v1-vo/').replaceAll('canal-water-v1.srt','canal-water-v1-vo.srt').replaceAll('window-spectrum-previs-v1.srt','window-spectrum-previs-v1-vo.srt');
for(const f of films){const project=path.join(ROOT,'films',f.slug);await fs.access(path.join(project,'out/film.mp4'));const audio=JSON.parse(await fs.readFile(path.join(project,'out/audio-status.json'),'utf8'));
  const message=f.id==='hero'?'本片无对白，使用原创合成音乐与动作音效。':audio.spokenNarration?'含中文合成旁白、字幕和原创声效。':'当前为字幕与原创声效版，尚未加入中文旁白。';
  html=html.replace(`src="../${f.slug}/out/film.mp4"></video>`,`src="../${f.slug}/out/film.mp4"></video><p class="audio-status">${message}</p>`);
  for(const name of ['CREDITS',`${f.slug}.srt`]){const data=await fs.readFile(path.join(project,name));html=html.replaceAll(`href="../${f.slug}/${name}"`,`download="${name==='CREDITS'?`${f.slug}-credits.txt`:name}" href="data:text/plain;charset=utf-8;base64,${data.toString('base64')}"`);}
}
for(const name of ['TREATMENT.md','REVIEW.md'])html=html.replace(`href="./${name}"`,`download="selected-trio-${name}" href="data:text/plain;charset=utf-8;base64,${(await fs.readFile(path.join(source,name))).toString('base64')}"`);
await fs.writeFile(path.join(dir,'index.html'),html);await fs.copyFile(path.join(source,'TREATMENT.md'),path.join(dir,'TREATMENT.md'));await fs.copyFile(path.join(source,'REVIEW.md'),path.join(dir,'REVIEW.md'));
console.log('http://127.0.0.1:43821/films/selected-trio-v1-review/index.html');
