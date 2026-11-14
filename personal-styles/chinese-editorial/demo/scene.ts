const canvas = document.querySelector('canvas')!;
canvas.width = 1920; canvas.height = 1080;
const ctx = canvas.getContext('2d')!;
const data = await fetch('./content.json').then(r => { if (!r.ok) throw new Error('Missing content'); return r.json(); });
await document.fonts.ready;
const C = { paper: '#f2eee5', ink: '#20231f', muted: '#77776e', rule: '#cfcec4', accent: '#b6382d' };
const ease = (x: number) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
type Box = { id: string; text: string; x0: number; y0: number; x1: number; y1: number };
let boxes: Box[] = [];
function text(id: string, value: string, x: number, y: number, size: number, color = C.ink, weight = 400) {
  ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`;
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(value, x, y);
  const m = ctx.measureText(value);
  boxes.push({ id, text: value, x0: x, y0: y - size, x1: x + m.width, y1: y + size * .2 });
}
function rect(x: number, y: number, w: number, h: number, color: string) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function rule(y: number, start = 96, end = 1824) { rect(start, y, end - start, 1, C.rule); }
function page(index: number, t: number) {
  const p = ease((t - index * 6) / .5);
  const id = `s${index}-`;
  text(id + 'number', `0${index + 1}`, 96, 805, 390, C.ink, 700);
  const titles = ['先看问题', '让事实归位', '给判断留白', '形成自己的观点'];
  text(id + 'heading', titles[index], 96, 330, 58, C.ink, 600);
  const kicker = ['信息越多，越需要秩序', '事实、来源、结论各就其位', '删去噪声，保留证据', '看见关系，再写结论'];
  text(id + 'kicker', kicker[index], 96, 400, 27, C.muted);
  const x = 860, w = 964;
  if (index === 0) {
    rect(x, 246, w, 590, '#e8e3d8');
    for (let i = 0; i < 7; i++) {
      const slide = (1 - ease((t - .125 * i) / .5)) * 100;
      rect(x + 48 + slide, 300 + i * 66, [650, 820, 480, 740, 560, 800, 340][i], 18, i === 4 ? C.accent : '#b6b5a8');
    }
    text(id + 'note', '从一页杂乱的笔记开始', x + 48, 900, 27, C.muted);
  } else if (index === 1) {
    const labels = ['事实', '来源', '结论'];
    for (let i = 0; i < 3; i++) {
      const cx = x + i * 326;
      rect(cx, 246, 302, 590, '#fbfaf5');
      rect(cx, 246, 302 * p, 8, i === 0 ? C.accent : C.ink);
      text(id + `col${i}`, labels[i], cx + 28, 323, 40, C.ink, 600);
      const notes = [['做了什么', '发生在哪', '何时发生'], ['原始记录', '交叉核验', '注明出处'], ['可确认项', '仍有疑问', '下一步']];
      for (let k = 0; k < 3; k++) {
        text(id + `evidence${i}-${k}`, notes[i][k], cx + 28, 426 + k * 76, 28, C.muted);
        rect(cx + 28, 445 + k * 76, 246 * ease((t - 6 - k * .15) / .5), 1, C.rule);
      }
      text(id + `index${i}`, `0${i + 1}`, cx + 28, 780, 32, C.muted);
    }
    text(id + 'note', '示意内容，不作为新闻或统计', x, 900, 26, C.muted);
  } else if (index === 2) {
    rect(x, 246, w, 590, '#fbfaf5');
    for (let i = 0; i < 6; i++) {
      const keep = i === 1 || i === 4;
      const collapse = keep ? 1 : 1 - ease((t - 12.3 - i * .1) / .6);
      rect(x + 48, 322 + i * 72, [650, 780, 530, 740, 640, 400][i], 14 * collapse, keep ? C.ink : '#cfcec4');
    }
    rect(x + 48, 400, 780 * ease((t - 13) / .5), 5, C.accent);
    text(id + 'note', '每一次删减，都保留判断依据', x, 900, 26, C.muted);
  } else {
    rect(x, 246, w, 590, '#fbfaf5');
    rect(x + 48, 304, 64 * p, 8, C.accent);
    text(id + 'quote1', '信息有层次，', x + 48, 466, 64, C.ink, 600);
    text(id + 'quote2', '观点才有分量。', x + 48, 564, 64, C.ink, 600);
    rule(648, x + 48, x + w - 48);
    text(id + 'author', `${data.seal} / 编辑札记`, x + 48, 742, 28, C.muted);
    text(id + 'note', '版式是一套规则，故事由你书写', x, 900, 26, C.muted);
  }
}
window.DUR = 24;
window.EV = [0, 6, 12, 18].map(t => ({ t, type: 'page' }));
window.EV.push({ t: 13, type: 'knife' }, { t: 17, type: 'silence' }, { t: 18, type: 'stamp' });
for (let i = 0; i < 7; i++) window.EV.push({ t: .5 + i * .125, type: 'print' });
window.render = (time: number) => {
  const t = Math.max(0, Math.min(23.999, time)); boxes = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; rect(0, 0, 1920, 1080, C.paper);
  text('brand', '中文编辑部', 96, 99, 28, C.ink, 600);
  text('title', data.title, 860, 99, 28);
  text('edition', '01 / EDITORIAL NOTES', 1485, 99, 22, C.muted);
  rule(134); page(Math.floor(t / 6), t); rule(962);
  text('inscription', data.inscription, 96, 1024, 27, C.muted);
  text('folio', `${Math.floor(t / 6) + 1} / 4`, 1740, 1024, 24, C.muted);
};
window.TEXTS = t => { window.render(t); return boxes; };
window.render(0); window.READY = true; document.querySelector('#loading')?.remove();
export {};
