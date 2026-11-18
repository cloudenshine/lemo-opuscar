import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FILMS } from '../../src/projects.ts';
import { editorialCases } from '../style-cases/v3.ts';
import { films } from './catalog.ts';

const {rows}=await editorialCases();
const byStyle=new Map(films.flatMap(f=>f.style?[[f.style,f] as const]:[]));
if(byStyle.size!==films.filter(f=>f.style).length||[...byStyle.keys()].some(slug=>!rows.some(r=>r.slug===slug))){
  throw new Error('Each film must have its own catalog style');
}
const folders=new Set(films.map(f=>f.folder));
if(folders.size!==films.length)throw new Error('Film folders must be distinct');
const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const available=await Promise.all(films.map(async f=>({
  ...f,
  local:await fs.access(path.join(FILMS,f.folder,'out/film.mp4')).then(()=>true,()=>false),
  still:f.poster&&await fs.access(path.join(FILMS,f.folder,'out/stills/t_'+f.poster+'.jpg')).then(()=>true,()=>false),
})));
const view=available.map(f=>({...f,styleName:rows.find(r=>r.slug===f.style)?.name??'独立短片'}));
const first=view.find(f=>f.local);
const seriesCount=byStyle.size;
const groups=[...new Set(rows.map(r=>r.category))];
const list=rows.map(r=>{
  const f=byStyle.get(r.slug);
  const label=r.number+'　'+r.name;
  return '<li data-category="'+escape(r.category)+'" data-ready="'+Boolean(f)+'"><span>'+escape(label)+'</span>'+
    (f?'<button type="button" data-film="'+f.folder+'">'+escape(f.title)+'</button>':
      '<span class="muted">待制作</span>')+'</li>';
}).join('\n');
const buttons=view.map(f=>'<button type="button" data-film="'+f.folder+'" aria-pressed="'+(f.folder===first?.folder)+'">'+escape(f.title)+'</button>').join('\n');
const template=await fs.readFile(new URL('gallery.html',import.meta.url),'utf8');
const html=template
  .replace('@@STATS@@',seriesCount+' / '+rows.length+' 种风格已有样片')
  .replace('@@BUTTONS@@',buttons)
  .replace('@@GROUPS@@',groups.map(g=>'<option>'+escape(g)+'</option>').join(''))
  .replace('@@ROWS@@',list)
  .replace('@@DATA@@',JSON.stringify(view).replaceAll('<','\\u003c'));
const dir=path.join(FILMS,'style-collection');
const owner='style-collection-gallery';
try{
  await fs.mkdir(dir);
  await fs.writeFile(path.join(dir,'study.json'),JSON.stringify({owner}));
}catch(e){
  if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;
  if(JSON.parse(await fs.readFile(path.join(dir,'study.json'),'utf8')).owner!==owner)throw new Error('Foreign gallery directory');
}
await fs.writeFile(path.join(dir,'index.html'),html);
await fs.writeFile(path.join(dir,'content.json'),JSON.stringify({
  total:rows.length,filmsWithStyle:seriesCount,
  films:view,
  styles:rows.map(r=>({number:r.number,slug:r.slug,name:r.name,category:r.category,film:byStyle.get(r.slug)?.folder??null})),
},null,2));
console.log(`${seriesCount}/${rows.length} style entries with a cut, ${view.filter(f=>f.local).length} local films total`);
