import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { slug, content, within, createProject, listProjects, saveContent, compileProject, DEFAULT_CONTENT } from '../src/projects.ts';

test('reject traversal, device names and excessive input; keep Chinese text literal', () => {
  for (const id of ['../escape', 'CON', 'con', 'nul', 'com1', 'a/b', 'a\\b', '-abc', 'x', 'a'.repeat(49)]) assert.throws(() => slug(id));
  assert.equal(slug('morning-leaf'), 'morning-leaf');
  for (const title of ['', '<script>', '一'.repeat(9), '一\n二', 'a\u202eb']) assert.throws(() => content({ ...DEFAULT_CONTENT, title }));
  assert.deepEqual(content(DEFAULT_CONTENT), DEFAULT_CONTENT);
});
test('create, list and save a project; duplicate creation never overwrites source', async () => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'cloud-ink-test-'));
  try {
    await createProject('morning-leaf', DEFAULT_CONTENT, base);
    const source = await fs.readFile(path.join(base, 'morning-leaf/scene.js'), 'utf8');
    assert.match(source, /window.render/);
    await assert.rejects(createProject('morning-leaf', DEFAULT_CONTENT, base), /已存在/);
    await saveContent('morning-leaf', { ...DEFAULT_CONTENT, title: '听雨' }, base);
    assert.equal((await listProjects(base))[0].title, '听雨');
    assert.equal(await fs.readFile(path.join(base, 'morning-leaf/scene.js'), 'utf8'), source);
    await fs.appendFile(path.join(base, 'morning-leaf/scene.ts'), '\nconst userRevision: string = "kept";\n');
    await compileProject('morning-leaf', base);
    assert.match(await fs.readFile(path.join(base, 'morning-leaf/scene.js'), 'utf8'), /userRevision\s*= "kept"/);
    await assert.rejects(within(base, '../missing'));
    await fs.mkdir(path.join(base, 'inside'));
    await fs.symlink(os.tmpdir(), path.join(base, 'inside/link'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(within(base, 'inside/link'), /越界/);
  } finally { await fs.rm(base, { recursive: true, force: true }); }
});

test('personal styles create distinct snapshots and reject unsupported templates', async () => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'cloud-ink-styles-'));
  try {
    for (const style of ['cloud-ink', 'chinese-editorial', 'dark-product']) {
      const result = await createProject(style, DEFAULT_CONTENT, base, style);
      assert.equal(result.style, style);
      const meta = JSON.parse(await fs.readFile(path.join(base, style, 'project.json'), 'utf8'));
      assert.equal(meta.style, style);
      assert.match(await fs.readFile(path.join(base, style, 'score.py'), 'utf8'), /silence_start/);
    }
    assert.equal((await listProjects(base)).length, 3);
    const ink = await fs.readFile(path.join(base, 'cloud-ink/scene.ts'), 'utf8');
    const editorial = await fs.readFile(path.join(base, 'chinese-editorial/scene.ts'), 'utf8');
    assert.notEqual(ink, editorial);
    await assert.rejects(createProject('unsafe-style', DEFAULT_CONTENT, base, '../dark-keynote'));
    await assert.rejects(createProject('unsupported', DEFAULT_CONTENT, base, 'dark-keynote'));
    assert.equal((await listProjects(base)).length, 3);
  } finally { await fs.rm(base, { recursive: true, force: true }); }
});
