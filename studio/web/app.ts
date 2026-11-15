type Project = { id: string; style: string; version: string; title: string; inscription: string; seal: string; url: string; video: string | null };
type Style = { slug: string; cn: string; en: string; category_cn?: string; personal: boolean; creatable: boolean; guide: string; line_cn?: string; uses?: string[]; defaults?: { title: string; inscription: string; seal: string }; chapters?: string[]; sound?: string };
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let current: Project | null = null, projects: Project[] = [], styles: Style[] = [], category = '全部';
let playing = false, seconds = 0, last = 0, rendering = false;
const frame = el<HTMLIFrameElement>('preview');
frame.onload = () => { if (current) preview(20); };
type FilmWindow = Window & { READY?: boolean; render?: (t: number) => void };
const message = (text: string) => { el('notice').textContent = text; };
async function api(url: string, body?: unknown) {
  const response = await fetch(url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const value = await response.json(); if (!response.ok) throw new Error(value.error || '操作失败'); return value;
}
function field(id: string) { return el<HTMLInputElement>(id).value; }
function formContent() { return { title: field('title'), inscription: field('inscription'), seal: field('seal') }; }
function styleDetails(resetContent = false) {
  const style = styles.find(s => s.slug === field('style-picker'));
  if (!style) return;
  el('active-style-name').textContent = style.cn; el('active-style-en').textContent = ` / ${style.en}${current ? ' · v' + current.version : ''}`;
  el('style-note').textContent = `${current ? '项目已保存的画面与配乐' : style.sound || ''} · 24 秒`;
  el('chapters').replaceChildren(...(style.chapters || []).map((name, i) => { const span = document.createElement('span'); span.textContent = `0${i+1} ${name}`; return span; }));
  if (resetContent && style.defaults) for (const id of ['title', 'inscription', 'seal'] as const) el<HTMLInputElement>(id).value = style.defaults[id];
}
el('style-picker').onchange = () => { if (!current) styleDetails(true); };
function preview(t: number) {
  seconds = t;
  const win = frame.contentWindow as FilmWindow | null;
  if (win?.READY) win.render?.(seconds);
  el<HTMLInputElement>('scrub').value = String(seconds);
  el('time').textContent = `00:${String(Math.floor(seconds)).padStart(2, '0')}`;
}
function setPlaying(value: boolean) { playing = value; el('play').textContent = value ? 'Ⅱ' : '▶'; last = performance.now(); }
function animate(now: number) {
  if (playing) { preview((seconds + (now - last) / 1000) % 24); }
  last = now; requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
el('play').onclick = () => { if (current) setPlaying(!playing); };
el<HTMLInputElement>('scrub').oninput = () => { setPlaying(false); preview(Number(field('scrub'))); };
function select(project: Project) {
  if (rendering) { message('请等待当前渲染完成。'); return; }
  current = project; setPlaying(false); seconds = 0;
  el<HTMLSelectElement>('style-picker').value = project.style || 'cloud-ink'; el<HTMLSelectElement>('style-picker').disabled = true; styleDetails();
  el('empty-preview').style.display = 'none'; frame.src = project.url + `?v=${Date.now()}`;
  for (const id of ['title', 'inscription', 'seal'] as const) el<HTMLInputElement>(id).value = project[id];
  el<HTMLInputElement>('project-id').value = project.id; el<HTMLInputElement>('project-id').disabled = true;
  el('editor-heading').textContent = '作品题记'; el('save').textContent = '保存题记'; el<HTMLButtonElement>('export').disabled = false;
  el('job').textContent = ''; const download = el<HTMLAnchorElement>('download'); download.hidden = !project.video; if (project.video) download.href = project.video;
  renderProjects();
}
function renderProjects() {
  const target = el('project-list'); target.replaceChildren(); el('project-count').textContent = String(projects.length);
  if (!projects.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = '还没有作品。从一页空白开始。'; target.append(p); }
  for (const p of projects) {
    const button = document.createElement('button'); button.className = `project ${current?.id === p.id ? 'selected' : ''}`; button.dataset.project = p.id;
    const tile = document.createElement('span'); tile.className = 'tile'; tile.textContent = p.title[0];
    const text = document.createElement('span'), title = document.createElement('strong'), detail = document.createElement('small');
    title.textContent = p.title; detail.textContent = `${styles.find(s => s.slug === p.style)?.cn || '云山墨序'} v${p.version} · ${p.video ? '已导出' : '待导出'}`; text.append(title, detail); button.append(tile, text); button.onclick = () => select(p); target.append(button);
  }
}
el('new-project').onclick = () => {
  if (rendering) return message('请等待当前渲染完成。');
  current = null; setPlaying(false); frame.src = 'about:blank'; el('empty-preview').style.display = 'grid';
  el<HTMLSelectElement>('style-picker').disabled = false; styleDetails(true);
  el<HTMLInputElement>('project-id').disabled = false; el<HTMLInputElement>('project-id').value = `ink-${String(Date.now()).slice(-6)}`;
  el('editor-heading').textContent = '新建作品'; el('save').textContent = '创建作品'; el<HTMLButtonElement>('export').disabled = true; el('download').hidden = true; el('job').textContent = '';
  renderProjects(); el('project-id').focus();
};
el('open-new').onclick = () => el('new-project').click();
el<HTMLFormElement>('project-form').onsubmit = async event => {
  event.preventDefault(); const save = el<HTMLButtonElement>('save'); save.disabled = true; message('');
  try {
    if (current) {
      const data = await api(`/api/projects/${current.id}/content`, formContent());
      Object.assign(current, data); select(current); message('题记已保存，预览已更新。');
    } else {
      const p = await api('/api/projects', { id: field('project-id'), style: field('style-picker'), content: formContent() }); projects.push(p); select(p); message('作品已创建。');
    }
  } catch (e) { message((e as Error).message); } finally { save.disabled = false; }
};
el('export').onclick = async () => {
  if (!current || rendering) return;
  const id = current.id; setPlaying(false); message('');
  try {
    await api(`/api/projects/${id}/content`, formContent());
    const job = await api(`/api/projects/${id}/render`, {});
    rendering = true; el<HTMLButtonElement>('export').disabled = true; el<HTMLButtonElement>('save').disabled = true;
    const poll = async () => {
      try {
        const state = await api(`/api/jobs/${job.id}`); el('job').textContent = state.stage;
        if (state.state === 'running') { setTimeout(poll, 1800); return; }
        if (state.state === 'failed') throw new Error(state.error || '渲染失败，请重试。');
        projects = await api('/api/projects'); rendering = false; select(projects.find(p => p.id === id)!); el('job').textContent = '导出完成 · 含风格配乐与音效';
      } catch (e) { message((e as Error).message); rendering = false; }
      if (!rendering) { el<HTMLButtonElement>('export').disabled = !current; el<HTMLButtonElement>('save').disabled = false; }
    };
    void poll();
  } catch (e) { message((e as Error).message); }
};
function renderStyles() {
  const search = field('search').toLowerCase(); const filtered = styles.filter(s => (category === '全部' || (s.personal ? '我的风格' : s.category_cn) === category) && JSON.stringify(s).toLowerCase().includes(search));
  el('style-count').textContent = `${filtered.length} / ${styles.length}`;
  const target = el('style-list'); target.replaceChildren();
  for (const [i, s] of filtered.entries()) {
    const link = document.createElement('div'); link.className = 'style-card';
    const n = document.createElement('div'); n.className = 'number'; n.textContent = `${String(i + 1).padStart(2, '0')} / ${s.personal ? '我的风格' : s.category_cn}`;
    const name = document.createElement('h3'); name.textContent = s.cn;
    const en = document.createElement('p'); en.textContent = s.en;
    const arrow = document.createElement('a'); arrow.className = 'arrow'; arrow.textContent = '阅读规范 ↗'; arrow.href = s.guide; arrow.target = '_blank'; arrow.rel = 'noopener'; link.append(n, name, en, arrow);
    if (s.creatable) { const create = document.createElement('button'); create.className = 'text-button'; create.textContent = '用此风格创建 ＋'; create.onclick = () => { if (rendering) return message('请等待当前渲染完成。'); el('new-project').click(); el<HTMLSelectElement>('style-picker').value = s.slug; styleDetails(true); el('workbench').scrollIntoView(); }; link.append(create); }
    target.append(link);
  }
  if (!filtered.length) { target.textContent = '没有找到相符的风格，试试“水墨”或“传统工艺”。'; }
}
el('search').oninput = renderStyles;
async function init() {
  try {
    await api('/api/health'); el('health').textContent = '本地服务已连接';
    [projects, styles] = await Promise.all([api('/api/projects'), api('/api/styles')]);
    renderProjects(); if (projects.length) select(projects[0]); else styleDetails(true);
    const categories = ['全部', '我的风格', ...new Set(styles.map(s => s.category_cn).filter(Boolean))];
    for (const c of categories) {
      const b = document.createElement('button'); b.textContent = c!; b.className = c === category ? 'selected' : '';
      b.onclick = () => { category = c!; el('categories').querySelectorAll('button').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); renderStyles(); }; el('categories').append(b);
    }
    renderStyles();
  } catch (e) { el('health').textContent = '连接失败'; message((e as Error).message); }
}
void init();
export {};
