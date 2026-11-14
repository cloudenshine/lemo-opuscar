import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { get } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createStudio } from '../src/server.ts';
import { DEFAULT_CONTENT } from '../src/projects.ts';

test('HTTP project flow, static allowlist, origin checks, range requests and render failure recovery', async () => {
  const films = await fs.mkdtemp(path.join(os.tmpdir(), 'cloud-ink-http-'));
  let finish: (() => void) | undefined;
  const server = createStudio({ films, render: async () => { await new Promise<void>(r => { finish = r; }); throw new Error('test encoder failure'); } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (url: string, body: unknown, origin = base) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(base + '/api/health')).status, 200);
    assert.equal((await fetch(base + '/.git/config')).status, 404);
    assert.equal((await fetch(base + '/core/../.git/config')).status, 404);
    assert.equal((await fetch(base + '/%2e%2e%5csecret')).status, 403);
    assert.equal((await fetch(base + '/%', { method: 'GET' })).status, 400);
    const badHost = await new Promise<number | undefined>((resolve, reject) => {
      get(base + '/api/health', { headers: { Host: 'evil.test:80' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(badHost, 403);
    assert.equal((await post('/api/projects', { id: 'one-film', content: DEFAULT_CONTENT }, 'https://evil.test')).status, 403);
    assert.equal((await post('/api/projects', { id: 'one-film', content: DEFAULT_CONTENT })).status, 201);
    assert.equal((await post('/api/projects', { id: 'one-film', content: DEFAULT_CONTENT })).status, 409);
    assert.equal((await post('/api/projects/one-film/content', { ...DEFAULT_CONTENT, title: '听风' })).status, 200);
    const index = await fetch(base + '/films/one-film/index.html'); assert.equal(index.status, 200);
    const range = await fetch(base + '/films/one-film/index.html', { headers: { Range: 'bytes=0-9' } });
    assert.equal(range.status, 206); assert.equal((await range.arrayBuffer()).byteLength, 10);
    assert.equal((await fetch(base + '/films/one-film/index.html', { headers: { Range: 'bytes=999999-' } })).status, 416);
    const job = await (await post('/api/projects/one-film/render', {})).json();
    assert.equal(job.state, 'running');
    assert.equal((await post('/api/projects/one-film/content', DEFAULT_CONTENT)).status, 409);
    assert.equal((await post('/api/projects/one-film/render', {})).status, 409);
    finish!();
    await new Promise(r => setTimeout(r, 20));
    const failed = await (await fetch(base + '/api/jobs/' + job.id)).json(); assert.equal(failed.state, 'failed'); assert.match(failed.error, /encoder/);
    assert.equal((await post('/api/projects/one-film/content', DEFAULT_CONTENT)).status, 200);
  } finally {
    server.closeAllConnections(); await new Promise<void>(r => server.close(() => r()));
    await fs.rm(films, { recursive: true, force: true });
  }
});
