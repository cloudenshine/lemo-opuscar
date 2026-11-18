import { promises as fs } from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { ROOT, FILMS } from '../../src/projects.ts';
import { run } from '../../src/render.ts';
import { measureAudio } from '../../src/master.ts';
import * as power from './power.ts';
import * as phase from './phase.ts';
import * as mending from './mending.ts';

const command=promisify(execFile);
const cases={power,phase,mending};
const name=process.argv[2];
if(name!=='power'&&name!=='phase'&&name!=='mending') throw new Error('Specify power, phase or mending');
const film=cases[name],fps=24,rate=48000;
const dir=path.join(FILMS,film.folder),out=path.join(dir,'out');
const owner='style-collection-'+name;
try{
  await fs.mkdir(dir);
  await fs.writeFile(path.join(dir,'study.json'),JSON.stringify({owner}));
}catch(e){
  if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;
  const meta=JSON.parse(await fs.readFile(path.join(dir,'study.json'),'utf8'));
  if(meta.owner!==owner)throw new Error('Folder belongs to another project');
}
await fs.mkdir(path.join(out,'stills'),{recursive:true});
const source=await fs.readFile(new URL(name+'.ts',import.meta.url),'utf8');
const compiled=stripTypeScriptTypes(source).replace(/^export /gm,'');
const html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>'+film.title+
  '</title><style>html,body{margin:0;background:black}canvas{display:block;width:100vw;height:100vh;object-fit:contain}</style>'+
  '<canvas width="1920" height="1080"></canvas><script src="scene.js" defer></script></html>';
await fs.writeFile(path.join(dir,'scene.js'),compiled+
  '\nconst context=document.querySelector("canvas").getContext("2d");window.DUR=length;'+
  'window.render=t=>picture(context,t);Promise.all([document.fonts.load(\'700 48px "Microsoft YaHei"\'),document.fonts.load(\'36px SimSun\'),document.fonts.load(\'36px KaiTi\')])'+
  '.then(()=>{window.render(0);window.READY=true;});\n');
await fs.writeFile(path.join(dir,'index.html'),html);

const samples=film.length*rate;
const wav=Buffer.alloc(44+samples*4);
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);
wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*4,40);
for(let n=0;n<samples;n++){
  const stereo=film.signal(n/rate);
  for(let c=0;c<2;c++)wav.writeInt16LE(Math.round(32767*Math.max(-1,Math.min(1,stereo[c]))),44+n*4+c*2);
}
await fs.writeFile(path.join(out,'mix.wav'),wav);
await run(process.execPath,['core/render/video.mjs',dir,'--fps',String(fps),'--workers','3','--out',path.join(out,'video.mp4')],s=>process.stdout.write(s));
const pending=path.join(out,'film.pending.mp4');
let target=-14, ceiling=-2;
const attempts=[];
for(let i=0;i<3;i++){
  await command('ffmpeg',['-v','error','-y','-i',path.join(out,'video.mp4'),'-i',path.join(out,'mix.wav'),'-map','0:v','-map','1:a',
    '-c:v','copy','-af',`loudnorm=I=${target}:TP=${ceiling}:LRA=8`,'-ar','48000','-c:a','aac','-b:a','224k','-movflags','+faststart',pending],{windowsHide:true});
  const levels=await measureAudio(pending);
  attempts.push({target,ceiling,levels});
  if(levels.peak<=-1&&levels.integrated>=-15&&levels.integrated<=-13)break;
  target=Math.max(-17,Math.min(-11,target-14-levels.integrated));
  if(levels.peak> -1)ceiling-=levels.peak+1.3;
}
const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',pending],{encoding:'utf8',windowsHide:true}));
const v=streams.streams[0],a=streams.streams[1];
if(v.codec_type!=='video'||v.nb_frames!==String(film.length*fps)||a.codec_type!=='audio'||Math.abs(Number(streams.format.duration)-film.length)>.05)throw new Error('Invalid final timeline');
const levels=attempts.at(-1)!.levels;
if(levels.peak> -1||levels.integrated< -15||levels.integrated> -13)throw new Error('Encoded sound outside mastering target: '+JSON.stringify(attempts));
await fs.rename(pending,path.join(out,'film.mp4'));
await fs.writeFile(path.join(out,'probe.json'),JSON.stringify({streams,levels,attempts},null,2));
const still={phase:'24',power:'11',mending:'27'}[name];
await command('ffmpeg',['-v','error','-y','-ss',still,'-i',path.join(out,'film.mp4'),'-frames:v','1','-q:v','2',path.join(out,'stills','t_'+still+'.jpg')],{windowsHide:true});
await fs.writeFile(path.join(dir,'content.json'),JSON.stringify({title:film.title,duration:film.length,owner}));
console.log(JSON.stringify({finished:path.relative(ROOT,dir),frames:v.nb_frames,levels}));
