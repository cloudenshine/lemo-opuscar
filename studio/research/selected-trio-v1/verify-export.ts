import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ROOT} from '../../src/projects.ts';
import {films} from './timeline.ts';
import {thermalEvidence} from './thermal-evidence.ts';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
// Homophones cannot be distinguished by hearing; spelling is checked separately in the subtitle source.
const normalized=(s:string)=>s.replaceAll('2023','二〇二三').replaceAll('他们','它们').replaceAll('在','再').replace(/[^\p{L}\p{N}]/gu,'');
const final=[];
for(const film of films){
  const dir=path.join(ROOT,'films',film.slug),audit=JSON.parse(await fs.readFile(path.join(ROOT,'.studio/trio-av',film.slug,'review.json'),'utf8'));
  const hash=sha(await fs.readFile(path.join(dir,'out/film.mp4')));if(audit.hash!==hash)throw new Error('Final review does not match this export');
  if(film.id==='hero'){
    const silent=JSON.parse(await fs.readFile(path.join(ROOT,'.studio',film.slug.replace('hero-sticker','hero')+'-silent','result.json'),'utf8'));
    if(silent.hash!==hash||!silent.story||!silent.actions?.length)throw new Error('Silent comprehension review is missing or stale');
    await fs.writeFile(path.join(dir,'out/silent-verification.json'),JSON.stringify({hash,story:silent.story,actions:silent.actions,issues:silent.issues,humanViewing:false,artisticApproval:false},null,2));
  }
  const evidence:{source:string;text:string}[]=[];
  for(const version of [1,2,3]){
    const slug=film.slug.replace(/-v[34567]/,`-v${version}`);
    const a=JSON.parse(await fs.readFile(path.join(ROOT,'.studio/trio-av',slug,'audio.json'),'utf8'));
    evidence.push({source:`${slug}/audio.json`,text:a.clips.map((c:{transcript:string})=>c.transcript).join('')});
  }
  if(film.id==='thermal'){
    const recheck=JSON.parse(await fs.readFile(path.join(ROOT,'.studio/trio-voice-recheck/result.json'),'utf8'));
    for(const s of recheck.sentences)evidence.push({source:`trio-voice-recheck/${s.pair}`,text:s.transcript});
  }
  const cues=[];
  for(const cue of film.cues){
    const pcm=await fs.readFile(path.join(dir,'out/voice',`${cue.id}.f32`));
    const original=await fs.readFile(path.join(ROOT,'films',film.slug.replace(/-v[34567]/,'-v1'),'out/voice',`${cue.id}.f32`));
    if(!pcm.equals(original))throw new Error('Voice changed after the independent listening review');
    const match=evidence.find(e=>normalized(e.text).includes(normalized(cue.text)));
    if(!match)throw new Error(`Unresolved blind transcript: ${film.id}/${cue.id}`);
    const duration=pcm.length/4/48000;if(duration>cue.end-cue.start-.12)throw new Error('Final cue truncates speech');
    cues.push({id:cue.id,text:cue.text,evidence:match.source,pcmSha256:sha(pcm),duration,start:cue.start,end:cue.end,status:'matched-in-independent-blind-listening'});
  }
  const audio=JSON.parse(await fs.readFile(path.join(dir,'out/audio-status.json'),'utf8'));
  await fs.writeFile(path.join(dir,'out/audio-status.json'),JSON.stringify({...audio,independentSpeechReview:film.cues.length>0,method:'Native audio blind transcription with boundary rechecks; not human listening',filmSha256:hash},null,2));
  await fs.writeFile(path.join(dir,'out/speech-verification.json'),JSON.stringify({cues,homophones:'在/再、他们/它们 acoustically indistinguishable; subtitles retain original spelling',humanListening:false},null,2));
  final.push({id:film.id,slug:film.slug,hash,duration:film.duration,cues: cues.length,fullAvModelReview:true,humanViewing:false,artisticApproval:false,realThermalEvidence:film.id==='thermal'?false:undefined});
}
const realDir=path.join(ROOT,'films',thermalEvidence.slug),realAudit=JSON.parse(await fs.readFile(path.join(ROOT,'.studio/trio-av',thermalEvidence.slug,'review.json'),'utf8'));
const realHash=sha(await fs.readFile(path.join(realDir,'out/film.mp4')));if(realAudit.hash!==realHash)throw new Error('Thermal evidence review hash mismatch');
final.push({id:'thermal-real',slug:thermalEvidence.slug,hash:realHash,duration:thermalEvidence.duration,cues:0,fullAvModelReview:true,humanViewing:false,artisticApproval:false,realThermalEvidence:true});
await fs.writeFile(path.join(ROOT,'.studio/trio-av/final-verification.json'),JSON.stringify(final,null,2));console.log(JSON.stringify(final,null,2));
