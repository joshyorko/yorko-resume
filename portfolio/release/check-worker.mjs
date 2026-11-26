import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import settings from './worker.json' with { type: 'json' };

const [target, revision, mode] = process.argv.slice(2);
assert.match(revision, /^[a-f0-9]{40}$/);
assert.ok(['preview', 'production'].includes(mode));
const live = target === '--live';
const worker = live ? null : (await import(pathToFileURL(resolve(target)))).default;
const origin = live ? settings.origin : 'https://portfolio.invalid';
const request = (path, options) => live
  ? fetch(origin + path, { ...options, redirect: 'manual', signal: AbortSignal.timeout(15_000) })
  : worker.fetch(new Request(origin + path, options));

const paths = ['/', '/projects/', '/systems/', '/plugins/', '/skills/', '/notes/', '/resume/',
  '/archive/sql-workspace/', '/computer/', '/computer/parcel-relay.html',
  '/resume/JoshuaYorko-Resume.pdf'];
const pdfPath = paths.at(-1);
for (const path of paths) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('x-portfolio-commit'), revision, path);
  assert.equal(response.headers.get('x-robots-tag'), mode === 'preview' ? 'noindex, nofollow' : null, path);
  const bytes = Buffer.from(await response.arrayBuffer());
  const expectedFile = path.endsWith('/') ? path + 'index.html' : path;
  const expected = await readFile(new URL('../dist' + expectedFile, import.meta.url));
  assert.deepEqual(createHash('sha256').update(bytes).digest(), createHash('sha256').update(expected).digest(), path);
}
const head = await request(pdfPath, { method: 'HEAD' });
assert.equal(head.status, 200);
assert.equal(head.headers.get('content-type'), 'application/pdf');
assert.ok(head.headers.get('etag'));
assert.equal((await head.arrayBuffer()).byteLength, 0);
assert.equal((await request(pdfPath, { headers: { 'if-none-match': head.headers.get('etag') } })).status, 304);
assert.equal((await request('/resume')).status, 308);
assert.equal((await request('/does-not-exist/')).status, 404);
assert.equal((await request('/', { method: 'POST' })).status, 405);
console.log(`Worker ${mode} verified (${paths.length} routes and HTTP behavior) at ${revision}`);
