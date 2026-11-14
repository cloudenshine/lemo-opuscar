import http from 'node:http';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { ROOT, FILMS, InputError, createProject, listProjects, listStyles, saveContent, within, slug, content } from './projects.ts';
import { renderProject, type Job } from './render.ts';

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.wav': 'audio/wav' };
export function createStudio(options: { films?: string; render?: typeof renderProject } = {}) {
  const films = options.films || FILMS;
  let active: Job | undefined;
  const jobs = new Map<string, Job>();
  const server = http.createServer(async (req, res) => {
    const send = (status: number, value: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    try {
      const host = req.headers.host || '';
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new InputError('无效 Host。', 403);
      const route = decodeURIComponent((req.url || '/').split('?')[0]);
      if (route.includes('..') || route.includes('\\') || route.includes('\0') || route.includes(':')) throw new InputError('禁止越界访问。', 403);
      const method = req.method || 'GET';
      let body: Record<string, unknown> = {};
      if (!['GET', 'HEAD'].includes(method)) {
        if (req.headers.origin !== `http://${host}` || !req.headers['content-type']?.startsWith('application/json')) throw new InputError('请从本地工作台提交 JSON 请求。', 403);
        const parts: Buffer[] = []; let length = 0;
        for await (const chunk of req) {
          length += chunk.length; if (length > 16384) throw new InputError('请求过大。', 413);
          parts.push(chunk);
        }
        body = JSON.parse(Buffer.concat(parts).toString() || '{}');
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('请求必须为 JSON 对象。');
      }
      if (route === '/api/health' && method === 'GET') return send(200, { ok: true, app: 'cloud-ink-studio', version: '1.1.0', active: active?.id || null });
      if (route === '/api/comparison' && method === 'GET') return send(200, JSON.parse(await fs.readFile(await within(path.join(ROOT, '.studio/comparison'), 'analysis.json'), 'utf8')));
      if (route === '/api/styles' && method === 'GET') return send(200, await listStyles());
      if (route === '/api/projects' && method === 'GET') return send(200, await listProjects(films));
      if (route === '/api/projects' && method === 'POST') return send(201, await createProject(slug(body.id), content(body.content), films, body.style));
      const match = route.match(/^\/api\/projects\/([a-z0-9-]+)\/(content|render)$/);
      if (match && method === 'POST') {
        const id = slug(match[1]);
        if (active?.project === id) throw new InputError('项目渲染中，完成后再编辑。', 409);
        if (match[2] === 'content') return send(200, await saveContent(id, body, films));
        if (active) throw new InputError('已有渲染任务，请等待完成。', 409);
        await within(films, id);
        const job: Job = { id: crypto.randomUUID(), project: id, state: 'running', stage: '准备渲染' };
        active = job; jobs.set(job.id, job);
        if (jobs.size > 30) jobs.delete(jobs.keys().next().value!);
        void (options.render || renderProject)(id, s => { job.stage = s; }).then(video => {
          job.state = 'done'; job.stage = '导出完成'; job.video = video;
        }).catch(e => { job.state = 'failed'; job.stage = '导出失败'; job.error = String(e.message).slice(-1500); }).finally(() => { active = undefined; });
        return send(202, job);
      }
      if (route.startsWith('/api/jobs/') && method === 'GET') {
        const job = jobs.get(route.slice('/api/jobs/'.length));
        return job ? send(200, job) : send(404, { error: '任务不存在（重启后临时任务记录会清空）。' });
      }
      if (!['GET', 'HEAD'].includes(method)) return send(405, { error: '不支持的方法。' });
      if (route === '/app.js' || route === '/comparison.js') {
        const source = stripTypeScriptTypes(await fs.readFile(path.join(ROOT, 'studio/web', route === '/app.js' ? 'app.ts' : 'comparison.ts'), 'utf8'));
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        return res.end(method === 'HEAD' ? '' : source);
      }
      let file: string;
      if (route === '/' || ['/app.js', '/style.css'].includes(route)) file = await within(path.join(ROOT, 'studio/web'), route === '/' ? 'index.html' : route.slice(1));
      else if (route === '/compare' || route === '/comparison.css') file = await within(path.join(ROOT, 'studio/web'), route === '/compare' ? 'comparison.html' : 'comparison.css');
      else if (route === '/comparison-report') file = await within(ROOT, 'studio/comparison/REVIEW.zh-CN.md');
      else if (/^\/comparison-media\/(ink-wash|swiss-motion|dark-keynote)\.mp4$/.test(route)) file = await within(path.join(ROOT, '.studio/comparison/source'), path.basename(route));
      else if (/^\/comparison-sheets\/(ink-wash|swiss-motion|dark-keynote)-(original|personal|previous)\.jpg$/.test(route)) file = await within(path.join(ROOT, '.studio/comparison'), path.basename(route));
      else if (/^\/films\/[a-z0-9-]+\/(index\.html|scene\.js|content\.json|out\/(film\.mp4|mix\.wav|stills\/t_[\d.]+\.jpg))$/.test(route)) file = await within(films, route.slice(7));
      else if (/^\/(styles|personal-styles)\/[a-z0-9-]+\/STYLE\.md$/.test(route) || route === '/core/lib.js' || /^\/styles\/ink-wash\/demo\/(ink|comp|land)\.js$/.test(route)) file = await within(ROOT, route.slice(1));
      else throw new InputError('资源不存在。', 404);
      const stat = await fs.stat(file);
      if (!stat.isFile()) throw new InputError('资源不存在。', 404);
      const headers: Record<string, string | number> = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes', 'Content-Length': stat.size };
      let start = 0, end = stat.size - 1, status = 200;
      if (req.headers.range) {
        const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (!range || Number(range[1]) >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); return res.end(); }
        start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), end) : end;
        if (end < start) { res.writeHead(416); return res.end(); }
        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`; headers['Content-Length'] = end - start + 1; status = 206;
      }
      res.writeHead(status, headers);
      if (method === 'HEAD' || stat.size === 0) return res.end();
      const stream = createReadStream(file, { start, end }); stream.on('error', () => res.destroy()); stream.pipe(res);
    } catch (error) {
      const e = error as NodeJS.ErrnoException;
      const status = e instanceof InputError ? e.status : e instanceof SyntaxError || e instanceof URIError ? 400 : e.code === 'ENOENT' ? 404 : 500;
      if (status === 500) console.error(error);
      if (!res.headersSent) send(status, { error: status === 500 ? '操作失败，详见本地服务日志。' : e.message }); else res.destroy();
    }
  });
  server.requestTimeout = 15000;
  return server;
}
