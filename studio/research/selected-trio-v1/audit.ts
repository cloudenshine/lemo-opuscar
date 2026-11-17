import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {ROOT} from '../../src/projects.ts';
import {spans,wavPcm,parseResponse,validateAudio} from '../style-cases/av-review.ts';

const exec=promisify(execFile);
const [mode,slug]=process.argv.slice(2);
if(!['prepare','run','summary'].includes(mode)||!/^((canal-water|hero-sticker|window-spectrum-previs)-v[1234567](-vo)?|thermal-trace-v[123])$/.test(slug??''))throw new Error('Expected prepare|run|summary and an approved trio film slug');
const dir=path.join(ROOT,'.studio/trio-av',slug),media=path.join(dir,'media');
const ff=async(args:string[])=>exec('ffmpeg',['-v','error','-y',...args],{windowsHide:true,maxBuffer:2e6});
await fs.mkdir(media,{recursive:true});
const input=path.join(ROOT,'films',slug,'out/film.mp4');
const hash=createHash('sha256').update(await fs.readFile(input)).digest('hex');
const planFile=path.join(dir,'manifest.json');
if(mode==='prepare'){
  const previous=await fs.readFile(planFile,'utf8').then(JSON.parse).catch(()=>null);
  if(previous&&previous.hash!==hash)throw new Error('Film changed; preserve the old audit and use a new version slug');
  const probe=JSON.parse((await exec('ffprobe',['-v','error','-show_format','-of','json',input],{windowsHide:true})).stdout);
  const duration=Number(probe.format.duration);
  await ff(['-i',input,'-vn','-af','aresample=16000:async=1:first_pts=0','-ac','1',path.join(media,'master.wav')]);
  const pcm=wavPcm(await fs.readFile(path.join(media,'master.wav')));
  const audio=spans(pcm.length/32000,4,'a','wav'),video=spans(duration,18,'v','mp4');
  for(const s of audio)await ff(['-i',path.join(media,'master.wav'),'-af',`atrim=start=${s.start}:end=${s.end},asetpts=PTS-STARTPTS`,'-c:a','pcm_s16le',path.join(media,s.file)]);
  const joined=Buffer.concat(await Promise.all(audio.map(async s=>wavPcm(await fs.readFile(path.join(media,s.file))))));
  if(!pcm.equals(joined))throw new Error('Audio coverage has a gap or duplicate samples');
  await ff(['-i',input,'-vf','scale=960:540','-c:v','libx264','-crf','22','-c:a','aac',path.join(media,'normal.mp4')]);
  for(const s of video)await ff(['-ss',String(s.start),'-t',String(s.end-s.start),'-i',input,'-an','-vf','setpts=6*(PTS-STARTPTS),scale=768:432,fps=6','-c:v','libx264','-preset','fast','-crf','22',path.join(media,s.file)]);
  await fs.writeFile(planFile,JSON.stringify({hash,duration,audio,video,method:'Normal-speed native AV, contiguous native audio, sixfold slow native video; model review, not human viewing'},null,2));
  console.log(`${slug}: ${audio.length} audio segments + normal film + ${video.length} slow segments prepared`);
}else{
  const plan=JSON.parse(await fs.readFile(planFile,'utf8'));
  if(plan.hash!==hash)throw new Error('Audit no longer matches the exported movie');
  const invoke=async(phase:string,prompt:string)=>{
    const record=path.join(dir,`${phase}.ndjson`);
    try{return parseResponse(await fs.readFile(record,'utf8'));}catch{/* Only completed responses are reusable. */}
    const cli=process.env.TRIO_REVIEW_CLI;
    if(!cli)throw new Error('Set TRIO_REVIEW_CLI to the installed Antigravity CLI. Sending these three films to Google requires explicit user authorization.');
    const stdout=await new Promise<string>((resolve,reject)=>{
      const child=spawn(cli,['--input-format','stream-json','--model','gemini-4-hydrogen-high','--mode','plan','--sandbox','--print-timeout','480s','--output-format','stream-json'],{cwd:media,windowsHide:true,timeout:510000,stdio:['pipe','pipe','pipe']});
      let out='';child.stdout.setEncoding('utf8').on('data',s=>out+=s);child.stderr.resume();child.on('error',reject);child.stdin.on('error',()=>{});
      child.on('close',code=>code===0?resolve(out):reject(new Error(`Review CLI exit ${code}; no credentials or raw stderr emitted`)));
      child.stdin.end(JSON.stringify({event:'user',message:{content:prompt}})+'\n');
    });
    await fs.writeFile(record,stdout);return parseResponse(stdout);
  };
  if(mode==='run'){
    const base='用户已明确授权并要求立即执行声画审看，不要创建计划或再次请求确认。这是三部私人样片之一，仅允许原生读取本次列出的视频和音频；禁止读取其他文件、源码、目录、文档、凭据，禁止执行命令、联网、修改文件或调用其他代理。不要假装真人观看。';
    const audio=await invoke('audio',`${base}进行独立盲听，不看画面，不提供脚本。逐一原生读取${plan.audio.map((s:{file:string})=>s.file).join('、')}，各4秒连续音轨，末段可能不足4秒。输出纯JSON {"clips":[{"file":"a00.wav","heard":"实际听到的声音、停顿、过响或不清楚之处","transcript":"逐字记录所有能听清的语音，无语音填空；不补齐被切开的词","unavailable":false,"uncertainty":"疑似读音问题或不确定的声音"}]}。每文件一条，不能根据语义补出没听到的声音。`);
    validateAudio(audio.data,plan.audio,audio.reads);
    const audioAllowed=new Set(plan.audio.map((s:{file:string})=>s.file));
    if(audio.reads.some(f=>!audioAllowed.has(f)))throw new Error('Unexpected file read in blind audio review');
    await fs.writeFile(path.join(dir,'audio.json'),JSON.stringify(audio.data,null,2));console.log(`${slug}: ${plan.audio.length}/${plan.audio.length} native audio reads verified`);
    const visual=await invoke('visual',`${base}先原生读取normal.mp4（完整${plan.duration}秒，原速带声音），不要预设剧情，先用自己的话复述因果。再读取以下全部慢放无声片段检查动作连续性：${plan.video.map((s:{file:string;start:number;end:number})=>`${s.file}=原片${s.start}–${s.end}秒，播放慢6倍`).join('；')}。慢放时间除6再加起点才是原片时间，节奏以normal.mp4为准。需要核对声音可读取${plan.audio.map((s:{file:string})=>s.file).join('、')}（4秒连续原速）。输出纯JSON {"access":[{"file":"normal.mp4","available":true,"first":"具体开头","last":"具体结尾"}],"story":"只凭声画复述故事和结尾，不懂的说不懂","beats":[{"start":0,"end":5,"visible":"动作变化","audible":"听到的声音，不从动作猜音效","clarity":"不看解释能否读懂","pacing":"拖沓或太快及原因"}],"issues":[{"start":0,"end":1,"severity":"major/minor","problem":"具体问题","fix":"可执行建议"}],"narrationIssues":["读错、含混、声画语义或卡点问题；没有则空数组"],"uncertainties":["能力与采样限制"]}。access必须逐一包含normal.mp4及所有v*.mp4；beats连续覆盖0–${plan.duration}秒。重点看故事是否一眼可懂、人物接触/用力/松手是否自然、是否死等、旁白和声音是否支持因果。不要给礼貌高分，不根据画面标签假设未发生的动作。`);
    const expected=['normal.mp4',...plan.video.map((s:{file:string})=>s.file)];
    for(const file of expected)if(!visual.reads.includes(file)||!visual.data.access?.some((a:{file:string;available:boolean})=>a.file===file&&a.available))throw new Error(`Missing native video read: ${file}`);
    const allowed=new Set([...expected,...audioAllowed]);if(visual.reads.some(f=>!allowed.has(f)))throw new Error('Unexpected file read in video review');
    let edge=0;for(const b of visual.data.beats??[]){if(Math.abs(b.start-edge)>.15||b.end<=b.start)throw new Error('Non-contiguous review timeline');edge=b.end;}if(Math.abs(edge-plan.duration)>.15)throw new Error('Incomplete review timeline');
    await fs.writeFile(path.join(dir,'review.json'),JSON.stringify({hash,method:plan.method,audio:audio.data,review:visual.data,verifiedReads:{audio:audio.reads,video:visual.reads},status:'model-reviewed-editorial-decision-required'},null,2));
    console.log(`${slug}: full AV model review available`);
  }else{
    const result=JSON.parse(await fs.readFile(path.join(dir,'review.json'),'utf8'));
    console.log(JSON.stringify({slug,story:result.review.story,issues:result.review.issues,narrationIssues:result.review.narrationIssues,uncertainties:result.review.uncertainties},null,2));
  }
}
