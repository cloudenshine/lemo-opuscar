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
  boxes.push({ id, text: value, x0: x, y0: y - size, x1: x + m.width, y1: y + size * .2 });
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
  const show = ease((t - 6) / .75);
  const x = 720, y = 245, w = 1104, h = 610;
  panel(x, y, w, h, 22, '#111722'); line(x + 28, y + 68, w - 56, '#2c3548', 1);
  text('app-name', `${data.seal} / 工作空间`, x + 35, y + 45, 24, C.muted);
  text('tab1', '收集', x + 40, y + 126, 28); text('tab2', '整理', x + 40, y + 194, 28, C.muted); text('tab3', '交付', x + 40, y + 262, 28, C.muted);
  const target = t < 12 ? show : 1;
  for (let i = 0; i < 9; i++) {
    const gx = x + 240 + (i % 3) * 265, gy = y + 112 + Math.floor(i / 3) * 145;
    const ox = 620 + ((i * 271) % 1030), oy = 190 + ((i * 159) % 650);
    card(ox + (gx - ox) * target, oy + (gy - oy) * target, 238, 114, i, false);
    if (t >= 6.75) {
      ctx.fillStyle = i % 2 ? '#161d2b' : '#1b2333'; ctx.fillRect(gx + 16, gy + 16, 205, 66);
      text(`item${i}`, ['灵感', '访谈', '草稿', '图片', '任务', '参考', '计划', '复盘', '交付'][i], gx + 22, gy + 49, 28);
      line(gx + 22, gy + 72, 110, '#384256', 4);
    }
  }
  if (t >= 12) {
    const sweep = ease((t - 12) / 1.1), sx = x + w * sweep;
    const light = ctx.createLinearGradient(sx - 230, 0, sx + 60, 0); light.addColorStop(0, '#b7c8ff00'); light.addColorStop(.72, '#b7c8ff19'); light.addColorStop(1, '#b7c8ff00');
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.clip(); ctx.fillStyle = light; ctx.fillRect(sx - 230, y, 290, h); ctx.restore();
    const approach = ease((t - 12) / 1.2);
    const px = 1770 + (1378 - 1770) * approach, py = 860 + (548 - 860) * approach;
    if (t >= 13.5) {
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(1225, 502, 238, 114, 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1425, 522); ctx.lineTo(1432, 529); ctx.lineTo(1445, 515); ctx.stroke();
      const click = clamp((t - 13.5) / .4);
      ctx.globalAlpha = 1 - click; ctx.beginPath(); ctx.arc(px, py, 10 + click * 25, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (t >= 14) {
      panel(x + 660, y + 524, 400, 58, 29, '#29324a');
      text('confirmation', '已归档，随时可找到', x + 690, y + 563, 26, C.accent);
    }
    ctx.save(); ctx.translate(px, py); ctx.fillStyle = '#f4f6ff'; ctx.strokeStyle = '#111722'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 37); ctx.lineTo(21, 34); ctx.lineTo(15, 21); ctx.lineTo(28, 21); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
window.DUR = 24;
window.EV = [{ t: 0, type: 'pulse' }, { t: 5, type: 'silence' }, { t: 6.75, type: 'snap' }, { t: 11.75, type: 'sweep' }, { t: 13.5, type: 'click' }, { t: 14, type: 'archive' }, { t: 18, type: 'collapse' }, { t: 19, type: 'lock' }];
for (let i = 0; i < 18; i++) window.EV.push({ t: .25 + i * .125, type: 'tile' });
window.render = (time: number) => {
  const t = Math.max(0, Math.min(23.999, time)); boxes = []; stage();
  text('brand', data.title, 96, 104, 30, C.ink, 600); text('fiction', '原创概念界面 / 非真实产品演示', 1380, 104, 23, C.muted);
  if (t < 6) {
    text('hook', '每个想法，', 96, 430, 74, C.ink, 600); text('hook2', '都有它的位置。', 96, 540, 74, C.ink, 600);
    text('hook-note', '从分散的记录，回到清晰的工作', 96, 650, 28, C.muted);
    for (let i = 0; i < 18; i++) {
      const p = ease((Math.min(t, 5) - i * .125) / .25);
      if (p <= 0) continue;
      const x = 920 + (i % 3) * 270 + Math.sin(i * 12.3) * 40;
      const y = 215 + Math.floor(i / 3) * 110;
      ctx.save(); ctx.translate(x + 110, y + 45); ctx.rotate(Math.sin(i * 7.8) * .08); card(-110, -45 + (1 - p) * 40, 238, 92, i); ctx.restore();
    }
  } else if (t < 18) {
    text('workflow', t < 12 ? '有序归位。' : '清晰可见。', 96, 442, 72, C.ink, 600);
    text('workflow-note', t < 12 ? '把记录整理成可行动的线索' : '需要的内容，都在视线之内', 96, 532, 28, C.muted);
    device(t);
  } else {
    const p = ease((t - 18) / .65), scale = 1.06 - p * .06;
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
