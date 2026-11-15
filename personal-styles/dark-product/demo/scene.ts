const canvas = document.querySelector('canvas')!;
canvas.width = 1920; canvas.height = 1080;
const ctx = canvas.getContext('2d')!;
const data = await fetch('./content.json').then(r => { if (!r.ok) throw new Error('Missing content'); return r.json(); });
await document.fonts.ready;
const C = { ink: '#e9edf5', muted: '#8e99b0', accent: '#a4b2ff', stage: '#090c13', surface: '#151b28' };
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
let boxes: Array<{ id: string; text: string; x0: number; y0: number; x1: number; y1: number }> = [];
function text(id: string, value: string, x: number, y: number, size: number, color = C.ink, weight = 400) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`; ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y); const m = ctx.measureText(value);
  const matrix = ctx.getTransform();
  const points = [[x, y - size], [x + m.width, y - size], [x, y + size * .2], [x + m.width, y + size * .2]].map(([px, py]) => matrix.transformPoint({ x: px, y: py }));
  boxes.push({ id, text: value, x0: Math.min(...points.map(p => p.x)), y0: Math.min(...points.map(p => p.y)), x1: Math.max(...points.map(p => p.x)), y1: Math.max(...points.map(p => p.y)) });
}
function panel(x: number, y: number, w: number, h: number, r = 16, color = C.surface) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = '#30394c'; ctx.lineWidth = 1; ctx.stroke();
}
function line(x: number, y: number, w: number, color = '#384256', h = 6) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function stage() {
  ctx.fillStyle = C.stage; ctx.fillRect(0, 0, 1920, 1080);
  const glow = ctx.createRadialGradient(1110, 300, 20, 1110, 300, 980); glow.addColorStop(0, '#1b2440'); glow.addColorStop(1, '#090c13'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1920, 1080);
  ctx.strokeStyle = '#ffffff07'; ctx.lineWidth = 1;
  for (let x = 0; x <= 1920; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke(); }
  for (let y = 0; y <= 1080; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke(); }
}
function card(x: number, y: number, w: number, h: number, i: number, accent = false) {
  panel(x, y, w, h, 12, i % 2 ? '#161d2b' : '#1b2333');
  line(x + 20, y + 24, 24, accent ? C.accent : '#74819b', 5);
  line(x + 20, y + 47, w * .67); line(x + 20, y + 64, w * .43, '#2d3648', 5);
}
function device(t: number) {
  const face = ease((t - 6) / 3.5);
  ctx.save(); ctx.translate(1272, 550); ctx.transform(.9 + .1 * face, -.045 * (1 - face), .06 * (1 - face), .92 + .08 * face, 0, 0); ctx.translate(-1272, -550);
  const x = 720, y = 245, w = 1104, h = 610;
  panel(x, y, w, h, 22, '#111722'); line(x + 28, y + 68, w - 56, '#2c3548', 1);
  text('app-name', `${data.seal} / 工作空间`, x + 35, y + 45, 24, C.muted);
  text('tab1', '收集', x + 40, y + 126, 28); text('tab2', '整理', x + 40, y + 194, 28, C.muted); text('tab3', '交付', x + 40, y + 262, 28, C.muted);
  for (let i = 0; i < 9; i++) {
    const target = ease((t - 6 - i * .125) / .5);
    const gx = x + 240 + (i % 3) * 265, gy = y + 112 + Math.floor(i / 3) * 145;
    const ox = 620 + ((i * 271) % 1030), oy = 190 + ((i * 159) % 650);
    const px = ox + (gx - ox) * target, py = oy + (gy - oy) * target;
    card(px, py, 238, 114, i, false);
    if (t >= 7.5) {
      ctx.fillStyle = i % 2 ? '#161d2b' : '#1b2333'; ctx.fillRect(gx + 16, gy + 16, 205, 66);
      text(`item${i}`, ['灵感', '访谈', '草稿', '图片', '任务', '参考', '计划', '复盘', '交付'][i], gx + 22, gy + 49, 28);
      line(gx + 22, gy + 72, 110, '#384256', 4);
    }
  }
  ctx.restore();
}
function operation(t: number) {
  const settle = ease((t - 12) / .75);
  ctx.save(); ctx.translate(1310, 550); ctx.scale(1.08 - .08 * settle, 1.08 - .08 * settle); ctx.translate(-1310, -550);
  panel(790, 245, 1034, 610, 24, '#161e2d');
  text('detail-type', '任务 / 研究札记', 846, 324, 28, C.muted);
  text('detail-title', '把灵感整理成提案', 846, 420, 54, C.ink, 600);
  line(846, 465, 922, '#384256', 1);
  for (let i = 0; i < 3; i++) {
    const y = 534 + i * 78;
    panel(846, y - 23, 27, 27, 5, '#29324a');
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(852, y - 11); ctx.lineTo(859, y - 3); ctx.lineTo(869, y - 18); ctx.stroke();
    text(`detail-check${i}`, ['核对事实', '补齐出处', '准备交付'][i], 895, y, 32);
  }
  const click = t >= 13.5;
  panel(1440, 685, 320, 100, 16, click ? '#4d5b8a' : '#293653');
  text('action', '归档', 1540, 750, 36, C.ink, 600);
  const p = ease((t - 12.25) / 1.25);
  const px = 1775 - p * 170, py = 500 + p * 230 - Math.sin(p * Math.PI) * 70;
  ctx.save(); ctx.translate(px, py); ctx.fillStyle = '#f4f6ff'; ctx.strokeStyle = '#111722'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 37); ctx.lineTo(21, 34); ctx.lineTo(15, 21); ctx.lineTo(28, 21); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (click) { const q = clamp((t - 13.5) / .4); ctx.globalAlpha = 1 - q; ctx.strokeStyle = C.accent; ctx.beginPath(); ctx.arc(0, 0, 10 + q * 45, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  if (t >= 14) {
    const slide = (1 - ease((t - 14) / .5)) * 25;
    panel(1370, 525 + slide, 390, 80, 16, '#29324a');
    text('confirmation', '已归档 · 可检索', 1410, 578 + slide, 30, C.accent);
  }
  ctx.restore();
}
window.DUR = 24;
window.SHOTS = [{ start: 0, end: 3, framing: 'layered notes', move: 'depth dolly' }, { start: 3, end: 6, framing: 'dense records', move: 'lateral drift and freeze' }, { start: 6, end: 12, framing: 'workspace', move: 'oblique to frontal pull' }, { start: 12, end: 18, framing: 'task insert', move: 'close reveal' }, { start: 18, end: 24, framing: 'one workspace', move: 'radial collapse and hold' }];
window.EV = [{ t: 0, type: 'pulse' }, { t: 5, type: 'silence' }, { t: 11.75, type: 'sweep' }, { t: 13.5, type: 'click' }, { t: 14, type: 'archive' }, { t: 17.25, type: 'silence' }, { t: 18, type: 'collapse' }, { t: 19.5, type: 'lock' }];
for (let i = 0; i < 27; i++) window.EV.push({ t: .25 + i * .125, type: 'tile' });
for (let i = 0; i < 9; i++) window.EV.push({ t: 6.5 + i * .125, type: 'snap' });
window.render = (time: number) => {
  const t = Math.max(0, Math.min(23.999, time)); boxes = []; stage();
  text('brand', data.title, 96, 104, 30, C.ink, 600); text('fiction', '原创概念界面 / 非真实产品演示', 1380, 104, 23, C.muted);
  if (t < 6) {
    text('hook', '每个想法，', 96, 430, 74, C.ink, 600); text('hook2', '都有它的位置。', 96, 540, 74, C.ink, 600);
    text('hook-note', '从分散的记录，回到清晰的工作', 96, 650, 28, C.muted);
    ctx.save(); ctx.beginPath(); ctx.rect(820, 175, 1020, 735); ctx.clip();
    for (let i = 26; i >= 0; i--) {
      const clock = Math.min(t, 5), p = ease((clock - i * .125) / .25);
      if (p <= 0) continue;
      const depth = Math.floor(i / 9), z = 500 + depth * 300 - 150 * ease(clock / 5);
      const perspective = 720 / z, wx = ((i % 3) - 1) * 250 + Math.sin(i * 12.3) * 40 - 55 * ease((clock - 2) / 3);
      const wy = (Math.floor(i / 3) % 3 - 1) * 175 + (depth - 1) * 65;
      ctx.save(); ctx.translate(1330 + wx * perspective, 540 + wy * perspective); ctx.scale(perspective, perspective); ctx.rotate(Math.sin(i * 7.8) * .09 * (1 - .5 * ease(clock / 5))); card(-110, -45 + (1 - p) * 90, 238, 110, i); ctx.restore();
    }
    ctx.restore();
  } else if (t < 18) {
    text('workflow', t < 12 ? '有序归位。' : '清晰可见。', 96, 442, 72, C.ink, 600);
    text('workflow-note', t < 12 ? '把记录整理成可行动的线索' : '需要的内容，都在视线之内', 96, 532, 28, C.muted);
    if (t < 12) device(t); else operation(t);
  } else {
    const p = ease((t - 18) / 1.5), scale = .55 + p * .45;
    for (let i = 0; i < 9; i++) {
      const angle = i / 9 * Math.PI * 2 + p * .4, radius = 520 * (1 - p);
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.translate(1000 + Math.cos(angle) * radius, 500 + Math.sin(angle) * radius * .6); ctx.scale(.7 - .5 * p, .7 - .5 * p); ctx.rotate(angle * .08); card(-119, -57, 238, 114, i); ctx.restore();
    }
    ctx.save(); ctx.translate(1040, 515); ctx.scale(scale, scale);
    ctx.font = '600 420px "Microsoft YaHei", sans-serif'; ctx.fillStyle = C.accent; ctx.fillText('1', -170, 150); ctx.restore();
    boxes.push({ id: 'one', text: '1', x0: 800, y0: 200, x1: 1250, y1: 740 });
    text('final', '一个空间，安放所有想法', 500, 828, 55, C.ink, 600);
    text('meaning', '1 指一个工作空间，不是性能测试数字', 665, 900, 25, C.muted);
    line(820, 744, 270 * p, C.accent, 3);
  }
  text('inscription', data.inscription, 96, 1015, 27, C.muted);
};
window.TEXTS = t => { window.render(t); return boxes; };
window.render(0); window.READY = true; document.querySelector('#loading')?.remove();
export {};
