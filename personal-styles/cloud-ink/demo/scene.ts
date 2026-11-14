// @ts-expect-error The upstream browser engine is JavaScript with an absolute web import.
import { mk, draw, drawSeq, TONE } from '/styles/ink-wash/demo/ink.js';
// @ts-expect-error The upstream compositor is served unchanged.
import { makeComp, layerSet } from '/styles/ink-wash/demo/comp.js';
// @ts-expect-error The upstream landscape library is served unchanged.
import { mountainLayer, ridgeFn } from '/styles/ink-wash/demo/land.js';

declare global {
  interface Window {
    READY: boolean; DUR: number; render: (t: number) => void;
    TEXTS: (t: number) => Array<{ id: string; text: string; x0: number; y0: number; x1: number; y1: number }>;
    EV: Array<{ t: number; type: string }>;
  }
}
const W = 1920, H = 1080;
const canvas = document.querySelector('canvas')!;
canvas.width = W; canvas.height = H;
const layer = layerSet(W, H), composite = makeComp(canvas);
const data: { title: string; inscription: string; seal: string } = await fetch('./content.json').then(r => {
  if (!r.ok) throw new Error('content.json could not be loaded'); return r.json();
});
await document.fonts.ready;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
const far = mountainLayer({ W: W + 240, H, ridge: ridgeFn([[300, 160, 210], [630, 205, 190], [930, 150, 210], [1530, 250, 250]], 510, 13, 25), depth: 260, tone: .17, mist: .7, seed: 27 });
const near = mountainLayer({ W: W + 240, H, ridge: ridgeFn([[1160, 190, 140], [1430, 300, 130], [1680, 170, 170]], 660, 7, 38), depth: 340, tone: .30, mist: .6, seed: 9, xmask: (x: number) => smooth((x - 800) / 500) });
const stems: unknown[] = [], leaves: unknown[] = [];
for (let j = 0; j < 3; j++) {
  const bx = 1280 + j * 145, height = 570 - j * 95;
  for (let i = 0; i < 5; i++) {
    const y = 900 - height * i / 5, next = y - height / 5;
    stems.push(mk([[bx - i * 14, y], [bx - i * 14 - 5, (y + next) / 2], [bx - (i + 1) * 14, next + 6]], { w: 15 - j * 2, tone: TONE.nong, dry: .25, wet: .7, side: .85, prof: 'even', seed: 100 + j * 20 + i }));
    if (i > 1) {
      for (let k = 0; k < 4; k++) {
        const dx = (k + i) % 2 ? -1 : 1, x = bx - i * 14, ly = y + k * 5;
        const reach = 55 + (i * 29 + j * 17 + k * 31) % 77;
        const drop = [-52, 20, -14, 61][(k + j) % 4];
        leaves.push(mk([[x, ly], [x + dx * reach * .5, ly + drop * .4 - 9], [x + dx * reach, ly + drop]], { w: 10 + k * 2, tone: TONE.zhong, dry: .3, wet: .6, side: .8, prof: 'tip', seed: 230 + j * 40 + i * 4 + k }));
      }
    }
  }
}
const fallenLeaf = mk([[-60, 4], [-10, -8], [65, -2]], { w: 30, tone: TONE.nong, dry: .22, wet: .6, prof: 'lens', seed: 913, side: .7 });
function typography(t: number) {
  const c: CanvasRenderingContext2D = layer.cd;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#171b18'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '64px KaiTi, STKaiti, SimSun, serif';
  [...data.title].forEach((ch, i) => c.fillText(ch, 325, 235 + i * 72));
  c.font = '30px SimSun, Songti SC, serif'; c.fillText(data.inscription, 960, 972);
  const seal: CanvasRenderingContext2D = layer.cc;
  seal.setTransform(1, 0, 0, 1, 0, 0); seal.fillStyle = '#a63b32';
  seal.fillRect(395, 220, 49, 69); seal.clearRect(399, 224, 2, 59);
  seal.fillStyle = '#f3ede0'; seal.font = '23px SimSun, serif'; seal.textAlign = 'center'; seal.textBaseline = 'middle';
  [...data.seal].forEach((ch, i) => seal.fillText(ch, 420, 241 + i * 27));
  void t;
}
window.DUR = 24;
window.EV = [{ t: 0, type: 'mist' }, { t: 4, type: 'brush' }, { t: 8, type: 'leaves' }, { t: 12, type: 'silence' }, { t: 14, type: 'fall' }, { t: 17, type: 'water' }, { t: 20, type: 'harmonic' }];
window.TEXTS = () => [
  { id: 'title', text: data.title, x0: 285, y0: 195, x1: 365, y1: 270 + ([...data.title].length - 1) * 72 },
  { id: 'inscription', text: data.inscription, x0: 540, y0: 947, x1: 1380, y1: 999 },
  { id: 'seal', text: data.seal, x0: 395, y0: 220, x1: 444, y1: 289 },
];
window.render = (seconds: number) => {
  const t = Math.max(0, Math.min(24, seconds));
  layer.clear();
  const push = smooth(t / 8) * .06 - smooth((t - 17) / 7) * .04;
  const pan = smooth((t - 8) / 8) * -70;
  layer.xf(1 + push, -960 * push + pan, -540 * push);
  layer.cw.globalAlpha = .72 + .28 * smooth(t / 4); layer.cw.drawImage(far, -pan * .5, 0);
  layer.cw.globalAlpha = smooth((t - 1) / 5); layer.cw.drawImage(near, 0, 0); layer.cw.globalAlpha = 1;
  drawSeq(layer.ink, stems, smooth((t - 3) / 5), .88);
  drawSeq(layer.ink, leaves, smooth((t - 6) / 5), .85);
  const fall = smooth((t - 14) / 3), travel = smooth((t - 17) / 7);
  if (t >= 14) {
    for (const c of [layer.cw, layer.cd]) { c.save(); c.translate(1230 - fall * 180 - travel * 310, 525 + fall * 286); c.rotate(-.3 + Math.sin(fall * 6) * .5 + travel * .1); }
    draw(layer.ink, fallenLeaf, 1, smooth((t - 14) * 4));
    for (const c of [layer.cw, layer.cd]) c.restore();
  }
  for (const onset of [17, 18.6, 20.4]) {
    const age = t - onset;
    if (age <= 0 || age >= 5) continue;
    const radius = 24 + 90 * Math.pow(age, .6), points: number[][] = [];
    for (let i = 0; i <= 44; i++) {
      const a = i / 44 * Math.PI * 1.85;
      points.push([1020 + Math.cos(a) * radius, 820 + Math.sin(a) * radius * .16]);
    }
    draw(layer.ink, mk(points, { w: 1.5, tone: .24, dry: .6, wet: .3, seed: 600 + onset * 10 }), 1, (1 - age / 5) * smooth(age * 3));
  }
  typography(t);
  composite(layer, null, { paperCol: [.954, .938, .895], bleed: 4.4, rim: .9, vig: .12, warm: .1, paper: [0, 0, 1] });
};
window.render(0); window.READY = true;
document.querySelector('#loading')?.remove();
