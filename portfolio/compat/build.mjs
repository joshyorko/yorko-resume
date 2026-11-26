import { strict as assert } from 'node:assert';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const outputPath = process.argv[2];
if (!outputPath) throw new Error('Pass a dedicated Pages artifact directory');
const output = pathToFileURL(resolve(outputPath) + '/');
const assets = new URL('assets/', output);
const sourcePdf = new URL('../resume/JoshuaYorko-Resume.pdf', import.meta.url);
const targetPdf = new URL('JoshYorkoResume.pdf', assets);
const home = new URL('index.html', output);

await mkdir(assets, { recursive: true });
await copyFile(new URL('index.html', import.meta.url), home);
await copyFile(sourcePdf, targetPdf);
await writeFile(new URL('.nojekyll', output), '');

const projectUrl = new URL('https://joshyorko.github.io/yorko-resume/');
const html = await readFile(home, 'utf8');
const download = html.match(/href="([^"]+\.pdf)"/)?.[1];
assert.equal(new URL(download, projectUrl).href, projectUrl.href + 'assets/JoshYorkoResume.pdf');
assert.deepEqual(await readFile(targetPdf), await readFile(sourcePdf));
