import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../../src/projects.ts';
import {analyze} from '../style-cases/av-review.ts';
const dir=path.join(ROOT,'.studio/trio-voice-recheck');await fs.mkdir(dir,{recursive:true});
const cues=['t05','t06','t07'],files:string[]=[];
for(const [i,id]of cues.entries()){
  const input=path.join(ROOT,'films/window-spectrum-previs-v1-vo/out/voice',`${id}.mp3`);
  for(const [j,start]of [0,2.4].entries()){
    const file=`n${i}${j}.wav`;files.push(file);
    execFileSync('ffmpeg',['-v','error','-y','-i',input,'-af',`atrim=start=${start}:end=${start+2.4},asetpts=PTS-STARTPTS`,'-ar','16000','-ac','1',path.join(dir,file)],{windowsHide:true});
  }
}
if(process.argv.includes('--prepare'))process.exit(0);
const cli=process.env.TRIO_REVIEW_CLI;if(!cli)throw new Error('TRIO_REVIEW_CLI required; user-authorized trio audio only');
const result=await analyze(cli,dir,'audio',`用户已授权这部私人样片的音频审听。仅允许原生读取这六个短音频：${files.join('、')}。禁止读取其他文件、目录、源码、文档，禁止运行命令或写文件。进行盲听逐字转写，不看字幕，不预设句意，不根据语义补漏词。n00/n01、n10/n11、n20/n21各自是连续的一句话前后两段（前段2.4秒，后段不足2.4秒）。只输出JSON {"clips":[{"file":"n00.wav","transcript":"实际听见的每个字","uncertainty":"听不清的字"}],"sentences":[{"pair":"n00/n01","transcript":"两段拼起来实际听到的整句话"}]}。区分音频本身漏词和切段拆开的词。`);
if(files.some(f=>!result.reads.includes(f))||result.reads.some(f=>!files.includes(f)))throw new Error('Audio input scope or coverage mismatch');
await fs.writeFile(path.join(dir,'result.json'),JSON.stringify(result.data,null,2));console.log(JSON.stringify(result.data,null,2));
