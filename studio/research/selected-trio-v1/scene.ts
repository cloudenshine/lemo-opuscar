import {films} from './timeline.ts';
import {pictureTime} from './edit.ts';
import {visible,rect,text} from './draw.ts';
import {canal} from './canal.ts';
import {hero} from './hero.ts';
import {thermal} from './thermal.ts';
const filmWindow=window as unknown as {READY:boolean;DUR:number;render:(t:number)=>void;TEXTS:(t:number)=>unknown[];EV:unknown[]};
const film=films.find(f=>f.slug===location.pathname.split('/').filter(Boolean).at(-2)) ?? films.find(f=>f.id===new URLSearchParams(location.search).get('film'));
if(!film)throw new Error('Unknown film');
const cv=document.querySelector('canvas')!;cv.width=1920;cv.height=1080;const g=cv.getContext('2d')!;
const paint=film.id==='canal'?await canal(g):film.id==='hero'?hero(g):thermal(g);
filmWindow.DUR=film.duration;filmWindow.EV=film.sounds;
filmWindow.render=(time:number)=>{const t=Math.max(0,Math.min(film.duration-.001,time));visible.length=0;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;paint(pictureTime(film.id,t));
  const cue=film.cues.find(c=>t>=c.start&&t<c.end);if(cue){rect(g,70,978,1780,75,'#0c1827');rect(g,70,985,3,49,'#d7ded9');text(g,cue.text,96,1028,34,'#edf0e8','left',false);}
};
filmWindow.TEXTS=(t:number)=>{filmWindow.render(t);return [...visible];};filmWindow.render(0);filmWindow.READY=true;
