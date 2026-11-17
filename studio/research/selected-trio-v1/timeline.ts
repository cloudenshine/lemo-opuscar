import {editTime,revisedCueTimes,pictureEdits} from './edit.ts';
export type FilmId = 'canal' | 'hero' | 'thermal';
export type Cue = { id: string; start: number; end: number; text: string };
export type Sound = { t: number; dur: number; kind: 'note' | 'water' | 'hit' | 'paper' | 'metal' | 'step'; hz?: number; gain: number; pan?: number };
export type Film = { id: FilmId; slug: string; title: string; duration: number; fps: number; status: string; cues: Cue[]; sounds: Sound[]; stills: number[] };
const c = (id: string, start: number, end: number, text: string): Cue => ({id, start, end, text});
const drafts: Film[] = [
  { id: 'canal', slug: 'canal-water-v1-vo', title: '两边都是海，船为什么会因为缺水排队', duration: 90, fps: 30, status: '样片 · 待审看',
    cues: [c('c01',.6,5.5,'这些船，正在海上等待通过运河。'),c('c02',6,11.5,'限制它们通行的原因之一，却是缺水。'),c('c03',12.5,18,'这条航道连接两片海。'),c('c04',18.5,24,'船还要先升到高处的湖面。'),c('c05',25,30.5,'船闸就像一部用水工作的升降机。'),c('c06',32,37,'闸门关闭，来自高处的水流入闸室。'),c('c07',38,43.5,'水位升高，船就跟着浮起来。'),c('c08',44,49.5,'两边水位齐平后，闸门才能打开。'),c('c09',51,56.5,'供水来自湖泊，湖水依赖降雨补给。'),c('c10',58,65,'海面上的水，并不会自动流到高处的湖里。'),c('c11',66,72,'二〇二三年，干旱让湖泊水位下降。'),c('c12',72.5,78,'运河限制通行，等待的船只因此增加。'),c('c13',79,83.5,'再看这些船：脚下是海。'),c('c14',84,89.5,'通行却依赖陆地上，由降雨补给的湖水。')],
    sounds:[{t:0,dur:2,kind:'note',hz:110,gain:.08},{t:6,dur:1,kind:'note',hz:164.81,gain:.05},{t:18,dur:2,kind:'note',hz:220,gain:.04},{t:31,dur:.5,kind:'metal',gain:.1},{t:33,dur:10,kind:'water',gain:.09},{t:45,dur:1,kind:'metal',gain:.06},{t:51,dur:7,kind:'water',gain:.025},{t:66,dur:2,kind:'note',hz:146.83,gain:.05},{t:79,dur:5,kind:'note',hz:220,gain:.04}],stills:[3,20,29,35,41,48,55,70,86]},
  { id:'hero',slug:'hero-sticker-v1',title:'满级勇者，撕不开一张贴纸',duration:70,fps:30,status:'表演样片 · 待审看',cues:[],sounds:[
    ...[261.63,329.63,392,523.25].map((hz,i)=>({t:.8+i*.22,dur:.8,kind:'note' as const,hz,gain:.07})),
    {t:2,dur:.5,kind:'hit',gain:.14},{t:8.8,dur:.35,kind:'paper',gain:.07},{t:12.3,dur:.35,kind:'paper',gain:.07},{t:22.5,dur:.3,kind:'hit',gain:.12},{t:27,dur:1,kind:'metal',gain:.08},{t:34,dur:.4,kind:'metal',gain:.045},{t:39,dur:.15,kind:'note',hz:659.25,gain:.035},{t:49.5,dur:.4,kind:'metal',gain:.07},{t:54,dur:5,kind:'paper',gain:.075},
    ...[261.63,329.63,392,523.25,659.25].map((hz,i)=>({t:60+i*.22,dur:1,kind:'note' as const,hz,gain:.055})),{t:62,dur:.5,kind:'paper',gain:.05},{t:68,dur:.4,kind:'metal',gain:.06}],stills:[2,7,18,28,38,48,56,61,67]},
  {id:'thermal',slug:'window-spectrum-previs-v1-vo',title:'窗户这么透明，为什么热像看不到外面',duration:72,fps:30,status:'实验分镜 · 非实测',cues:[c('t01',.7,6,'同一扇窗，两种观察方式。'),c('t02',6.5,12,'右边的人影，可能来自窗前的反射。'),c('t03',13,20,'先让窗前的人举手，检查影子是否同步。'),c('t04',24,30,'再固定机位，只改变一件事：打开窗。'),c('t05',31,37,'实测应比较敞开区域与玻璃覆盖区域。'),c('t06',39,45,'眼睛和这类热像仪，接收的光不同。'),c('t07',46,53,'普通窗玻璃，对常见长波红外并不透明。'),c('t08',55,62,'再关上窗，检查这种差异是否重现。'),c('t09',64,71,'透明，需要再问一句：对哪一种光？')],sounds:[{t:0,dur:3,kind:'note',hz:293.66,gain:.025},{t:25,dur:.4,kind:'metal',gain:.035},{t:56,dur:.4,kind:'metal',gain:.035},{t:65,dur:4,kind:'note',hz:440,gain:.025}],stills:[3,17,29,35,42,50,58,68]}
];
export const films:Film[]=drafts.map(f=>({...f,slug:f.slug.replace('-v1',f.id==='hero'?'-v7':'-v3'),duration:pictureEdits[f.id].at(-1)![0],
  status:f.id==='thermal'?'实验预演 · 非实测 · 不作为成片交付':'修订样片 · 待观众审看',
  cues:f.cues.map((c,i)=>({...c,start:revisedCueTimes[f.id][i][0],end:revisedCueTimes[f.id][i][1]})),
  sounds:f.sounds.filter(s=>!(f.id==='hero'&&s.t===68)).map(s=>({...s,t:editTime(f.id,f.id==='hero'&&s.t===49.5?49.8:f.id==='hero'&&s.t===62?65.2:f.id==='hero'&&s.kind==='note'&&s.t>=60? s.t+2.5:s.t),dur:editTime(f.id,s.t+s.dur)-editTime(f.id,s.t),
    kind:f.id==='hero'&&(s.t===49.5||s.t===62)?'hit':s.kind})),
  stills:f.stills.map(t=>Math.round(editTime(f.id,t)*10)/10),
}));
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => { const q=clamp(x); return q*q*(3-2*q); };
export const seg = (t:number,a:number,b:number) => ease((t-a)/(b-a));
export function lockState(t:number) {
  const enter=seg(t,24,30), fill=seg(t,33,43), leave=seg(t,46.5,50);
  return { x: 440+enter*400+leave*540, y:760-fill*250, fill, gateLeft:seg(t,30,32), gateRight:1-seg(t,44.5,46.5), phase:t<30?'enter':t<33?'close':t<43?'fill':t<44.5?'equalize':t<46.5?'open':'leave' };
}
