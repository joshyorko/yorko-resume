// Package static build bytes for an isolated connector-uploaded review Worker.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const revision = process.argv[2];
if (!/^[0-9a-f]{40}$/.test(revision ?? '')) throw new Error('Pass the full candidate commit');
const production = process.argv[3] === '--production';
const dist = new URL('./dist/', import.meta.url);
const headerFile = await readFile(new URL('_headers', dist), 'utf8');
const globalHeaders = Object.fromEntries(headerFile.split('\n/site.css')[0]
  .split('\n').slice(1).filter(Boolean).map(line => line.trim().split(/: (.*)/s).slice(0, 2)));
if (production) delete globalHeaders['X-Robots-Tag'];
const mime = {
  '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const files = {};
for (const name of (await readdir(dist, { recursive: true, withFileTypes: true }))
  .filter(item => item.isFile()).map(item => relative(fileURLToPath(dist), join(item.parentPath, item.name))).sort()) {
  if (name === '_headers') continue;
  const bytes = await readFile(new URL(name, dist));
  const type = mime[extname(name)] ?? (name.endsWith('/LICENSE') ? 'text/plain; charset=utf-8' : '');
  if (!type) throw new Error('Unexpected artifact: ' + name);
  files['/' + name] = [type, bytes.toString('base64'),
    '"' + createHash('sha256').update(bytes).digest('hex') + '"'];
}

console.log(`const files = ${JSON.stringify(files)};
const headers = ${JSON.stringify(globalHeaders)};
export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    if (!path.endsWith('/') && !Object.hasOwn(files, path) && Object.hasOwn(files, path + '/index.html')) {
      url.pathname += '/';
      return Response.redirect(url.href, 308);
    }
    const key = path.endsWith('/') ? path + 'index.html' : path;
    const found = Object.hasOwn(files, key);
    const [type, bytes, etag] = files[found ? key : '/404.html'];
    const notModified = found && request.headers.get('if-none-match') === etag;
    const body = request.method === 'HEAD' || notModified ? null : Uint8Array.from(atob(bytes), c => c.charCodeAt(0));
    return new Response(body, {
      status: notModified ? 304 : found ? 200 : 404,
      headers: { ...headers, 'Content-Type': type, ETag: etag,
        'Cache-Control': key.startsWith('/fonts/') || key.startsWith('/vendor/') ? 'public, max-age=86400' :
          type.startsWith('text/css') ? 'public, max-age=300' : 'no-cache',
        'X-Portfolio-Commit': '${revision}' },
    });
  },
};`);
