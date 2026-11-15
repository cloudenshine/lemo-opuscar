import type { Study } from './model.ts';
const spec: Study = await fetch('./content.json').then(r => { if (!r.ok) throw new Error('Missing study'); return r.json(); });
const canvas = document.querySelector('canvas')!;
canvas.width = 1920; canvas.height = 1080;
const ctx = canvas.getContext('2d')!;
await document.fonts.ready;
const paper = '#eeeae1', ink = '#1d2424', red = '#ac352b', muted = '#6c716d';
const smooth = (n: number) => { const x = Math.max(0, Math.min(1, n)); return x * x * (3 - 2 * x); };
const mix = (a: number, b: number, n: number) => a + (b - a) * n;
type Box = { id: string; text: string; x0: number; y0: number; x1: number; y1: number };
let boxes: Box[] = [];
function word(id: string, text: string, x: number, y: number, size: number, color = ink, weight = 700, report = true) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`;
  ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y);
  const width = ctx.measureText(text).width;
  if (report) boxes.push({ id, text, x0: x, y0: y - size, x1: x + width, y1: y + size * .2 });
}
function rule(x: number, y: number, width: number, color: string, height = 2) { ctx.fillStyle = color; ctx.fillRect(x, y, width, height); }
function render(seconds: number) {
  const t = Math.max(0, Math.min(spec.duration, seconds)), spread = smooth((t - 3) / 3);
  boxes = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 1920, 1080);
  word('series', '未定 / 观察练习 01', 128, 82, 28);
  word('disclosure', '虚构数据 · 动态研究', 1490, 82, 24, muted, 400);
  rule(128, 118, 1664, '#c6c6bc');
  if (t < 6) {
    ctx.save(); ctx.globalAlpha = 1 - spread;
    word('draft', '初稿 · 待核对', 138, 205, 28, red, 500, t < 3);
    word('claim', '全部', 128 - spread * 160, 520 - spread * 600, 340, ink, 900, t < 3);
    word('claim-verb', '赞成', 998 + spread * 260, 775 - spread * 380, 240, ink, 900, t < 3);
    ctx.restore();
  }
  if (t >= 6 && t < 9.5) {
    word('question', '全部？', 128, 283, 148);
    if (t >= 9) rule(128, 225, 445 * smooth((t - 9) / .25), red, 9);
  }
  if (t >= 9.5) word('finding', '四人赞成。八人未答。', 128, 270, 112);
  if (t >= 6) {
    word('answered', '04  /  已回复', 128, 357, 32, red);
    word('missing', '08  /  未回复', 800, 357, 32, muted);
  }
  const known = spec.replies.filter(r => r.status === 'agree'), unknown = spec.replies.filter(r => r.status === 'unknown');
  known.forEach((reply, i) => {
    const event = spec.cues.find(c => c.kind === 'reply' && c.reply === reply.id)!;
    const arrive = smooth((t - event.frame / spec.fps) / .125);
    if (!arrive) return;
    const x = mix(150 + i * 155, 128, spread), y = mix(870, 450 + i * 132, spread);
    rule(x, y + 25 * spread, mix(96, 480, spread) * arrive, red, mix(12, 5, spread));
    if (spread > 0) {
      ctx.globalAlpha = spread;
      word(`reply-${reply.id}`, '赞成', x, y, 60 * spread, red, 700, t >= 6);
      word(`identity-${reply.id}`, reply.id, x + 400, y - 10, 24, muted, 400, t >= 6);
      ctx.globalAlpha = 1;
    }
  });
  const reveal = smooth((t - 4) / 3);
  if (reveal > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(730, 380, 1080 * reveal, 550); ctx.clip();
    unknown.forEach((reply, i) => {
      const x = 800 + Math.floor(i / 4) * 576, y = 450 + (i % 4) * 132;
      rule(x, y + 25, 400, '#a6aaa1');
      word(`identity-${reply.id}`, reply.id, x, y - 7, 24, muted, 400, t >= 7);
      word(`unknown-${reply.id}`, '—', x + 176, y, 46, '#92988f', 400, false);
    });
    ctx.restore();
  }
  if (t < 3) word('sample', '四份回复', 150, 961, 30, muted, 400);
  if (t >= 9.5) word('boundary', '未回复 ≠ 反对，也不等于赞成', 128, 1013, 32, muted, 400);
}
window.DUR = spec.duration;
window.EV = spec.cues.map(c => ({ t: c.frame / spec.fps, type: c.kind }));
window.SHOTS = [{ start: 0, end: 3, framing: 'provisional claim', move: 'held typographic close view' }, { start: 3, end: 7, framing: 'evidence expands', move: 'reframe the same replies' }, { start: 7, end: 9.5, framing: 'absence', move: 'held pause and edit' }, { start: 9.5, end: 16, framing: 'bounded conclusion', move: 'locked reading' }];
window.render = render;
window.TEXTS = t => { render(t); return boxes; };
(window as Window & { STUDY?: Study }).STUDY = spec;
render(0); window.READY = true;
export {};
