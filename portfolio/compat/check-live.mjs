import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const base = 'https://joshyorko.github.io/yorko-resume/';
const dir = process.argv[2];
if (!dir) throw new Error('Pass the verified Pages artifact directory');
const files = [
  ['', 'index.html', 'text/html'],
  ['assets/JoshYorkoResume.pdf', 'assets/JoshYorkoResume.pdf', 'application/pdf'],
];
const expected = await Promise.all(files.map(async ([url, path, type]) =>
  [url, await readFile(join(dir, path)), type]));

async function matches([path, bytes, type]) {
  try {
    const response = await fetch(base + path, {
      headers: { 'Cache-Control': 'no-cache' },
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok && response.headers.get('content-type')?.startsWith(type)
      && bytes.equals(Buffer.from(await response.arrayBuffer()));
  } catch {
    return false;
  }
}

for (let attempt = 0; attempt < 12; attempt++) {
  if ((await Promise.all(expected.map(matches))).every(Boolean)) {
    console.log('Both public Pages responses match the reviewed artifact');
    process.exit(0);
  }
  if (attempt < 11) await setTimeout(10_000);
}
throw new Error('The public Pages homepage or résumé has not reached the reviewed artifact');
