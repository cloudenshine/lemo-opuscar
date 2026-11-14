type Metrics = { duration: number; width: number; height: number; fps: string; integratedLufs: number; truePeakDbtp: number; loudnessRangeLu: number; motionDelta: number; sheet: string };
type Pair = { id: string; name: string; project: string; original: string; finding: string; originalMetrics: Metrics; personalMetrics: Metrics };
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const original = el<HTMLVideoElement>('original'), personal = el<HTMLVideoElement>('personal');
const status = el('status'), slider = el<HTMLInputElement>('position');
function sound() { const mode = el<HTMLSelectElement>('audio').value; original.muted = mode !== 'original'; personal.muted = mode !== 'personal'; }
el('audio').addEventListener('change', sound);
slider.addEventListener('input', () => {
  el('percent').textContent = slider.value + '%';
  for (const video of [original, personal]) { video.pause(); if (Number.isFinite(video.duration)) video.currentTime = Math.min(video.duration - .05, video.duration * Number(slider.value) / 100); }
});
for (const video of [original, personal]) video.addEventListener('error', () => { status.textContent = '样片读取失败。请运行本地对照准备命令，或从官方来源查看原作。'; });
function select(pair: Pair) {
  for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>('#pairs button'))) button.setAttribute('aria-pressed', String(button.dataset.id === pair.id));
  for (const video of [original, personal]) video.pause();
  original.src = `/comparison-media/${pair.id}.mp4`; personal.src = `/films/${pair.project}/out/film.mp4`;
  el<HTMLAnchorElement>('original-link').href = pair.original; el<HTMLAnchorElement>('personal-link').href = personal.src;
  el('finding').textContent = pair.finding; slider.value = '0'; el('percent').textContent = '0%'; sound();
  const meta = (m: Metrics) => `${m.width} × ${m.height} · ${m.duration.toFixed(2)} 秒 · ${m.fps} fps`;
  el('original-meta').textContent = meta(pair.originalMetrics); el('personal-meta').textContent = meta(pair.personalMetrics);
  const rows: [string, (m: Metrics) => string][] = [['综合响度', m => `${m.integratedLufs} LUFS`], ['真峰值', m => `${m.truePeakDbtp} dBTP`], ['响度范围', m => `${m.loudnessRangeLu} LU`], ['相邻抽帧平均差异¹', m => `${m.motionDelta}%`]];
  el('metrics').replaceChildren(...rows.map(([label, value]) => { const tr = document.createElement('tr'); for (const text of [label, value(pair.originalMetrics), value(pair.personalMetrics)]) { const td = document.createElement('td'); td.textContent = text; tr.append(td); } return tr; }));
  el<HTMLImageElement>('original-sheet').src = pair.originalMetrics.sheet; el<HTMLImageElement>('personal-sheet').src = pair.personalMetrics.sheet;
  status.textContent = '¹ 以 6 fps、160×90 灰度抽帧计算，反映画面变化量，不评价动效优劣。';
}
try {
  const response = await fetch('/api/comparison'); if (!response.ok) throw new Error('对照资料尚未生成。请按照 studio/comparison/REVIEW.zh-CN.md 准备样片并运行 analyze.ts。');
  const data = await response.json() as { pairs: Pair[]; previousInk: unknown };
  el('previous-ink').hidden = !data.previousInk;
  el('pairs').replaceChildren(...data.pairs.map(pair => { const button = document.createElement('button'); button.textContent = pair.name; button.dataset.id = pair.id; button.addEventListener('click', () => select(pair)); return button; }));
  el('viewer').hidden = false; select(data.pairs[0]);
} catch (error) { status.textContent = (error as Error).message; }
export {};
