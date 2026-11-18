import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { FILMS } from '../../src/projects.ts';
import { promisify } from 'node:util';
import { measureAudio } from '../../src/master.ts';

const cwd = path.join(FILMS,'solar-rain');
const execute = promisify(execFile);
const fps = 30;
const duration = 32;
const closeEnd = 21;
const [a, b, ax, ay, bx, by] = [121, 110, 650, 180, 172, 32];
for (const [file, hash] of [
  ['helios.webm','fefdb99f5004ac6e123754df02f4689aca3b2008edd1a8a590d064554b9b31c1'],
  ['wide.jpg','a6677a606affd7ec385020dc766157339489776ea7349956b6cf238cdf3ef59d'],
]) {
  const data = await readFile(path.join(cwd,'assets',file));
  if (createHash('sha256').update(data).digest('hex') !== hash) throw new Error('Unexpected NASA source: '+file);
}
const run = (command: string, args: string[]) =>
  execute(command, args, { cwd, windowsHide: true, maxBuffer: 2e6 });
const ff = (...args: string[]) => run('ffmpeg', ['-v', 'error', '-y', ...args]);
const save = (name: string, data: string | Buffer) => writeFile(path.join(cwd,name), data);
const timestamp = (s: number) => {
  const cs = Math.round(s * 100);
  return '0:' + String(Math.floor(cs / 6000)).padStart(2, '0') + ':' + ((cs % 6000) / 100).toFixed(2).padStart(5, '0');
};
await mkdir(path.join(cwd,'out/stills'), { recursive: true });

const ass = [
  '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080', 'WrapStyle: 2',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  'Style: Text,Microsoft YaHei,46,&H00F1F0F6,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1',
  '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
];
const cue = (s: number, e: number, tags: string, value: string, layer = 1) =>
  ass.push('Dialogue: '+layer+','+timestamp(s)+','+timestamp(e)+',Text,,0,0,0,,{'+tags+'}'+value);
const font = (x: number, y: number, size: number, extra = '') =>
  '\\pos('+x+','+y+')\\fs'+size+extra;
const line = (s: number, e: number, x: number, y: number, size: number, value: string, extra = '') =>
  cue(s, e, font(x,y,size,'\\fad(300,270)'+extra), value);
const shape = (s: number, e: number, x: number, y: number, color: string, drawing: string, extra = '') =>
  cue(s,e,'\\pos('+x+','+y+')\\p1\\c&H'+color+'&'+extra,drawing);
const serif = '\\fnSimSun';
line(1.05, 5.35, 110, 880, 54, '这场雨，沿着弧线落下。', serif+'\\bord2');
line(6.05, 11.35, 106, 794, 104, '太阳在下雨', serif+'\\bord2');
line(6.38, 11.35, 112, 920, 25, '2012  /  07  /  19     ·     日冕雨', '\\fsp5');
line(11.65, 15.9, 112, 884, 47, '日冕里的等离子体冷却、凝聚。', '\\bord2');
line(16.15, 20.75, 112, 884, 47, '它们沿磁场线，落回太阳。', '\\bord2');
line(24.95, 31.55, 1584, 615, 38, '地球', serif);
line(25.12, 31.55, 1585, 676, 23, '同一比例下的直径', '\\c&HC6B8AE&');
line(25.2, 31.55, 111, 885, 46, '太阳直径约为地球的', serif);
line(25.48, 31.55, 111, 937, 68, '109 倍', '\\fnBahnschrift');
line(23.8, 32, 112, 1005, 23, 'NASA / SDO / AIA   ·   304 Å 极紫外观测   ·   日面定格', '\\c&HBCADA4&');
// The full-disk frame measures approximately 830 px across. Earth is 830 / 109 px.
shape(24.95,31.65,1509,640,'F4CA91','m 8 4 b 8 9 -1 9 -1 4 b -1 -1 8 -1 8 4','\\fad(280,250)');
shape(25.05,31.55,1526,643,'A48C7B','m 0 0 l 45 0 45 1 0 1','\\fad(280,250)');
line(.4, 20.75, 112, 83, 21, 'SDO / AIA     304 Å     延时观测', '\\c&HD7C5B6&\\fsp2\\bord1');
await save('titles.ass', ass.join('\n') + '\n');

const sampleRate = 48000;
const count = sampleRate * duration;
const stereo = Buffer.alloc(44 + count * 4);
stereo.write('RIFF');
stereo.writeUInt32LE(stereo.length - 8, 4);
stereo.write('WAVEfmt ', 8);
stereo.writeUInt32LE(16, 16);
stereo.writeUInt16LE(1, 20);
stereo.writeUInt16LE(2, 22);
stereo.writeUInt32LE(sampleRate, 24);
stereo.writeUInt32LE(sampleRate * 4, 28);
stereo.writeUInt16LE(4, 32);
stereo.writeUInt16LE(16, 34);
stereo.write('data', 36);
stereo.writeUInt32LE(count * 4, 40);
const clamp = (v: number) => Math.max(0,Math.min(1,v));
const ease = (v: number) => { const q = clamp(v); return q*q*(3-2*q); };
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const chord = [38, 45, 50, 53, 57, 64].map(hz);
const strikes = [{ t: 0, f: 45 }, { t: 5.65, f: 38 }, { t: 11.45, f: 44 }, { t: 21, f: 35 }];
const droplets = [[1.5, 72], [3.8, 69], [6.7, 65], [9.15, 69], [12.5, 74], [15.05, 72], [17.9, 65], [24.95, 76], [26.5, 72], [29.3, 69]];
const sin = (f: number, t: number, p = 0) => Math.sin(2 * Math.PI * f * t + p);
let seed = 849015, noiseSlow = 0, noiseFast = 0;
for (let i = 0; i < count; i++) {
  const t = i / sampleRate;
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  const noise = (seed >>> 0) / 2147483648 - 1;
  noiseSlow += .009 * (noise - noiseSlow);
  noiseFast += .11 * (noise - noiseFast);
  const distant = ease((t - 19.8) / 4.4);
  const initial = ease(t / .5);
  const end = 1 - ease((t - 30) / 2);
  const swell = Math.exp(-((t-20.55)**2)/.64);
  let center = initial * ((.062 - distant*.034) * sin(36.7,t,.21*sin(.18,t)) + (.15 + .42*swell) * (noiseSlow + noiseFast*.16));
  let side = 0;
  for (const s of strikes) {
    const age = t-s.t;
    if (age < 0 || age > 4) continue;
    const envelope = Math.min(1, age/.04) * Math.exp(-age*1.7);
    center += envelope * (.20*sin(s.f,age,4*(1-Math.exp(-age*10))) + .18*noiseSlow);
  }
  for (let j = 0; j < chord.length; j++) {
    const f = chord[j];
    const env = ease((t-(21.25+j*.28))/2.3) * (1-.5*ease((t-28)/4));
    center += .028*env*(sin(f,t,.26*sin(.32,t+j))+.17*sin(f*2,t));
    side += .010*env*sin(f*1.002,t,j);
  }
  for (const [at,note] of droplets) {
    const age=t-at;
    if (age<0 || age>4) continue;
    const env=Math.min(1,age/.025)*Math.exp(-age*1.65);
    center += .028*env*(sin(hz(note),age)+.34*sin(hz(note)*2.01,age));
    side += .011*env*sin(hz(note)*1.006,age,.6);
  }
  for (let channel = 0; channel < 2; channel++) {
    const value=(center+side*(channel===0?1:-1))*end*.75;
    stereo.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+i*4+channel*2);
  }
}
await save('out/mix.wav',stereo);

const crop = (w:number,h:number,x:number,y:number) =>
  'crop='+w+':'+h+':'+x+':'+y+',scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p';
const easeOut = '(1-pow(1-min(on/105,1),3))';
const z = '(1+2.35*(1-'+easeOut+'))';
const framing = "scale=3840:2160:flags=lanczos,zoompan=z='"+z+"':x='(960+410*(1-"+easeOut+"))*2-iw/(2*zoom)':y='(540+100*(1-"+easeOut+"))*2-ih/(2*zoom)':d="+((duration-closeEnd)*fps)+':s=1920x1080:fps=30,setsar=1,format=yuv420p';
const graph = [
  '[0:v]fps=30,'+crop(768,432,ax,ay)+',tpad=stop_mode=clone:stop=3,trim=end_frame=170,setpts=N/(30*TB)[a]',
  '[1:v]fps=30,'+crop(1568,882,bx,by)+',tpad=stop_mode=clone:stop=3,trim=end_frame=460,setpts=N/(30*TB)[b]',
  '[2:v]'+framing+'[sun]',
  "[a][b][sun]concat=n=3:v=1:a=0,drawbox=x=0:y=983:w=iw:h=97:color=black:t=fill:enable='gte(t,21)',ass=titles.ass,fade=t=out:st=31.6:d=0.4[v]",
].join(';');
await ff('-ss',String(a),'-t','5.65','-i','assets/helios.webm','-ss',String(b),'-t','15.35','-i','assets/helios.webm','-i','assets/wide.jpg','-i','out/mix.wav',
  '-filter_complex_threads','3','-filter_complex',graph,'-map','[v]','-map','3:a:0','-c:v','libx264','-preset','fast','-crf','18',
  '-af','loudnorm=I=-16:TP=-2:LRA=9','-ar','48000','-c:a','aac','-b:a','224k','-t','32','-metadata','title=太阳在下雨','-movflags','+faststart','out/pending.mp4');
const metadata = JSON.parse((await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json','out/pending.mp4'])).stdout);
if (Math.abs(Number(metadata.format.duration)-duration)>.07 || metadata.streams.length!==2 || metadata.streams[0].width!==1920 || Number(metadata.streams[0].nb_frames)!==duration*fps) {
  throw Error('Unexpected master duration or stream layout');
}
const audio = await measureAudio(path.join(cwd,'out/pending.mp4'));
if (audio.peak > -1 || audio.integrated < -17.2 || audio.integrated > -14.8) throw Error(JSON.stringify(audio));
await rename(path.join(cwd,'out/pending.mp4'),path.join(cwd,'out/film.mp4'));
await save('out/probe.json',JSON.stringify({metadata,audio},null,2));
await ff('-ss','7.6','-i','out/film.mp4','-frames:v','1','-q:v','2','out/stills/t_7.6.jpg');
await ff('-ss','27','-i','out/film.mp4','-frames:v','1','-q:v','2','out/stills/t_27.jpg');
console.log(JSON.stringify({ duration, audio }));
