import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const here = fileURLToPath(new URL('.', import.meta.url));
const proof = new URL('proof/', import.meta.url);
const headers = Object.fromEntries((await readFile(here + 'dist/_headers', 'utf8'))
  .split('\n').filter(line => line.startsWith('  ') && !line.includes('Cache-Control'))
  .map(line => line.trim().split(/: (.*)/s).slice(0, 2)));
const mime = { html: 'text/html; charset=utf-8', mjs: 'text/javascript', css: 'text/css' };
const server = createServer(async (req, res) => {
  const compared = ['/comparison/', '/comparison.css', '/editorial/'].includes(req.url);
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!/^\/[\w/.-]*$/.test(pathname) || pathname.startsWith('/.')) {
    res.writeHead(404).end();
    return;
  }
  const file = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  try {
    const buffer = await readFile(here + (compared ? 'dist-compare' : 'dist') + file);
    const etag = '"' + createHash('sha256').update(buffer).digest('hex') + '"';
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', file === '/site.css' ? 'public, max-age=300' : 'no-cache');
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304).end();
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Type': mime[file.split('.').pop()] || 'text/plain' }).end(buffer);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const report = { viewports: [], axeViolations: {}, navigation: [], transfer: {} };
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', chromiumSandbox: true });
  report.browser = browser.version();
  await mkdir(proof, { recursive: true });
  const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJS = await plain.newPage();
  for (const [label, path] of [
    ['Plugins & Skills', '/plugins/'], ['Projects', '/projects/'], ['Systems', '/systems/'],
    ['Notes & Proof', '/notes/'], ['Résumé', '/resume/'],
  ]) {
    await noJS.goto(base);
    await noJS.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
    assert.equal(new URL(noJS.url()).pathname, path);
    assert.equal(await noJS.getByRole('heading', { level: 1 }).textContent(), label);
    report.navigation.push(label);
  }
  await noJS.goto(base);
  await noJS.getByRole('link', { name: 'Search the skill catalog' }).click();
  assert.equal(await noJS.locator('.skill:visible').count(), 22);
  assert.equal(await noJS.locator('#skill-controls').isVisible(), false);
  await noJS.getByRole('link', { name: '37signals-product-design', exact: true }).waitFor();
  await noJS.goto(base);
  await noJS.getByRole('link', { name: 'RCC', exact: true }).click();
  assert.equal(new URL(noJS.url()).hash, '#rcc');
  await plain.close();

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.setDefaultTimeout(6000);
  const external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.route('**/*', route => {
    if (route.request().url().startsWith(base + '/')) return route.continue();
    external.push(route.request().url());
    return route.abort();
  });
  const routes = ['/', '/plugins/', '/skills/', '/projects/', '/systems/', '/notes/', '/resume/', '/lab/'];
  for (const [width, height] of [[360, 800], [390, 844], [411, 891], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), width + ' ' + route);
      if (route === '/') {
        await page.screenshot({ path: fileURLToPath(new URL(`home-${width}.png`, proof)) });
        if (width === 390 || width === 1440) {
          await page.goto(base + '/editorial/');
          await page.screenshot({ path: fileURLToPath(new URL(`editorial-${width}.png`, proof)) });
          await page.goto(base + '/comparison/');
          await page.screenshot({ path: fileURLToPath(new URL(`directory-${width}.png`, proof)) });
        }
      }
    }
    report.viewports.push(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of routes) {
    await page.goto(base + path);
    await page.evaluate(await readFile(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const violations = await page.evaluate(async () => (await globalThis.axe.run()).violations.map(({id}) => id));
    report.axeViolations[path] = violations;
    assert.deepEqual(violations, [], path);
  }

  await page.goto(base);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
  await page.getByRole('navigation').getByRole('link', { name: 'Plugins & Skills' }).click();
  await page.screenshot({ path: fileURLToPath(new URL('plugins-390.png', proof)) });
  await page.getByRole('link', { name: 'Browse and search skills' }).click();
  const search = page.getByRole('searchbox', { name: 'Search skills' });
  await search.fill('product design');
  assert(await page.locator('#skill-37signals-product-design').isVisible());
  assert.equal(await page.locator('#skill-rcc-core').isVisible(), false);
  await page.screenshot({ path: fileURLToPath(new URL('skills-390.png', proof)) });
  await search.fill('zzzzzzzz');
  assert.match(await page.getByRole('status').textContent(), /No matching skills/);
  await search.fill('');
  assert.equal(await page.locator('.skill:visible').count(), 22);
  await page.getByRole('navigation').getByRole('link', { name: 'Notes & Proof' }).click();
  await page.getByRole('link', { name: 'Open Agent Lab' }).click();

  async function checkLab(tab) {
    await tab.getByRole('button', { name: 'Check manifest' }).click();
    await tab.getByText('Manifest accepted.', { exact: true }).waitFor();
    await tab.getByRole('spinbutton').fill('5001');
    await tab.getByRole('button', { name: 'Check manifest' }).click();
    await tab.getByText('Manifest rejected.', { exact: true }).waitFor();
    await tab.getByRole('button', { name: 'Inspect sample bundle' }).click();
    await tab.getByText(/Integrity verified. Synthetic record/).waitFor();
    const [download] = await Promise.all([
      tab.waitForEvent('download'), tab.getByRole('button', { name: 'Download session receipt' }).click(),
    ]);
    const receipt = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(receipt.activity.length, 3);
    assert.equal(receipt.activity[2].receipt.provenance.integrity_status, 'verified');
    assert.equal(receipt.activity[2].receipt.provenance.authenticity, 'unverified');
    assert(!JSON.stringify(receipt).includes('Synthetic record'));
  }
  await checkLab(page);
  await page.screenshot({ path: fileURLToPath(new URL('lab-390.png', proof)) });

  const artifactDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download Agent Lab v1 for offline use' }).click();
  const artifact = await artifactDownload;
  const path = await artifact.path();
  const checksum = (await readFile(here + 'dist/lab/SHA256SUMS', 'utf8')).split(' ')[0];
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), checksum);
  const localFile = path + '.html';
  const { copyFile, unlink } = await import('node:fs/promises');
  await copyFile(path, localFile);
  try {
    const offline = await browser.newContext({ offline: true });
    const tab = await offline.newPage();
    tab.on('request', req => { if (!req.url().startsWith('file:')) external.push(req.url()); });
    tab.on('pageerror', error => errors.push(error.message));
    tab.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await tab.goto(pathToFileURL(localFile).href);
    await checkLab(tab);
    await tab.reload();
    assert(await tab.getByRole('button', { name: 'Download session receipt' }).isDisabled());
    await checkLab(tab);
    report.offline = { runs: 2, reloadClearedReceipts: true, sha256: checksum };
    await offline.close();
  } finally {
    await unlink(localFile);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);

  const coldPage = await browser.newPage();
  for (const state of ['cold', 'warm']) {
    if (state === 'cold') await coldPage.goto(base);
    else await coldPage.reload();
    report.transfer[state] = await coldPage.evaluate(() =>
      performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource'))
        .map(({ name, transferSize, encodedBodySize }) => ({
          path: new URL(name).pathname, transferSize, encodedBodySize,
        })));
    assert.equal(report.transfer[state].length, 2);
  }
  await writeFile(new URL('browser.json', proof), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
