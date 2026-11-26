import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyRelay } from './relay/verify.mjs';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const here = fileURLToPath(new URL('.', import.meta.url));
const proof = process.env.PROOF_DIR ? pathToFileURL(process.env.PROOF_DIR.replace(/\/?$/, '/')) : new URL('proof/', import.meta.url);
const shot = name => fileURLToPath(new URL(name, proof));
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const headers = Object.fromEntries((await readFile(here + 'dist/_headers', 'utf8'))
  .split('\n').filter(line => line.startsWith('  ') && !line.includes('Cache-Control'))
  .map(line => line.trim().split(/: (.*)/s).slice(0, 2)));
const mime = {
  html: 'text/html; charset=utf-8', mjs: 'text/javascript', js: 'text/javascript', css: 'text/css',
  pdf: 'application/pdf', wasm: 'application/wasm', woff2: 'font/woff2', txt: 'text/plain; charset=utf-8',
};
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!/^\/[\w/.-]*$/.test(pathname) || pathname.startsWith('/.')) {
    res.writeHead(404).end();
    return;
  }
  const file = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  try {
    const buffer = await readFile(here + 'dist' + file);
    const etag = '"' + createHash('sha256').update(buffer).digest('hex') + '"';
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', /^\/(site\.css|fonts\/|vendor\/)/.test(file) ? 'public, max-age=300' : 'no-cache');
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304).end();
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Type': mime[file.split('.').pop()] || 'text/plain; charset=utf-8' }).end(buffer);
  } catch {
    res.writeHead(404, { ...headers, 'Content-Type': mime.html }).end(await readFile(here + 'dist/404.html'));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const report = { viewports: [], axeViolations: {}, navigation: [], transfer: {}, search: [], computer: {} };
const errors = [];
const external = [];
function watch(page) {
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  return page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(base + '/') || url.startsWith('blob:')) return route.continue();
    external.push(url);
    return route.abort();
  });
}
async function axe(page, label) {
  await page.evaluate(axeSource);
  const violations = await page.evaluate(async () => (await globalThis.axe.run()).violations.map(({ id, nodes }) => `${id} ${nodes.map(n => n.target).join(' ')}`));
  report.axeViolations[label] = violations;
  assert.deepEqual(violations, [], label);
}
const search = page => page.getByRole('button', { name: /^Search/ });
async function searchTo(page, label) {
  await search(page).click();
  await page.getByRole('option', { name: label, exact: true }).click();
}
const ready = page => page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
async function show(page, panel) {
  const tab = page.getByRole('navigation', { name: 'Workspace panels' }).getByRole('button', { name: panel });
  if (await tab.isVisible()) await tab.click();
}
async function sql(page, text) {
  await show(page, 'Query');
  await page.getByRole('textbox', { name: 'SQL query' }).fill(text);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  return page.locator('#result');
}

let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', chromiumSandbox: true });
  report.browser = browser.version();
  await mkdir(proof, { recursive: true });

  // Without JavaScript: every page, link and the catalog still work; the computer says what it needs.
  const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJS = await plain.newPage();
  for (const [label, path] of [
    ['Computer', '/computer/'], ['Projects', '/projects/'], ['Systems', '/systems/'],
    ['Plugins & Skills', '/plugins/'], ['Notes', '/notes/'], ['Résumé', '/resume/'],
  ]) {
    await noJS.goto(base);
    await noJS.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
    assert.equal(new URL(noJS.url()).pathname, path);
    assert.equal(await noJS.getByRole('heading', { level: 1 }).textContent(), label === 'Résumé' ? 'Joshua Yorko' : label);
    report.navigation.push(label);
  }
  await noJS.goto(base + '/computer/');
  assert(await noJS.getByRole('link', { name: /Download offline HTML/ }).isVisible());
  await noJS.goto(base + '/resume/');
  const [resume] = await Promise.all([
    noJS.waitForEvent('download'), noJS.getByRole('link', { name: 'Download Résumé' }).click(),
  ]);
  const pdf = await readFile(await resume.path());
  assert.equal(createHash('sha256').update(pdf).digest('hex'), '6021e8d0bdd3fd18c5b628dfba981de5c685c7f536404b5fb88f4e00f441f614');
  assert.equal(await noJS.locator('.resume .resume-evidence a').count(), 21);
  await noJS.goto(base + '/plugins/');
  await noJS.getByRole('link', { name: 'Browse and search skills' }).click();
  assert.equal(await noJS.locator('.skill:visible').count(), 22);
  assert.equal(await noJS.locator('#skill-controls').isVisible(), false);
  await noJS.goto(base);
  await noJS.getByRole('link', { name: 'How I got here' }).click();
  assert.equal(new URL(noJS.url()).hash, '#story');
  const missing = await noJS.goto(base + '/unknown/');
  assert.equal(missing.status(), 404);
  await noJS.getByRole('link', { name: 'Return to the homepage' }).click();
  assert.equal(new URL(noJS.url()).pathname, '/');
  await plain.close();

  // Layout at five widths; captures of the homepage and the working computer.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await watch(page);
  const routes = ['/', '/computer/', '/plugins/', '/skills/', '/projects/', '/systems/', '/notes/', '/resume/'];
  for (const [width, height] of [[360, 800], [390, 844], [411, 891], [850, 900], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const route of [...routes, '/archive/sql-workspace/?sample=1']) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200);
      if (route.startsWith('/archive/sql-workspace/')) await ready(page);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), width + ' ' + route);
      if (width === 360 || width === 390 || width === 1440) {
        if (route === '/') {
          await page.screenshot({ path: shot(`home-${width}.png`) });
          await page.screenshot({ path: shot(`home-${width}-full.png`), fullPage: true });
        }
        if (route === '/archive/sql-workspace/?sample=1') await page.screenshot({ path: shot(`computer-sample-${width}.png`) });
        if (route === '/computer/' && width !== 360) await page.screenshot({ path: shot(`computer-entry-${width}.png`) });
      }
    }
    report.viewports.push(width);
  }

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of routes) {
      await page.goto(base + path);

      await axe(page, `${path} @${width}`);
    }
    await page.goto(base + '/archive/sql-workspace/?sample=1');
    await ready(page);
    await axe(page, `/archive/sql-workspace/?sample=1 @${width}`);
    if (width === 390) {
      for (const tab of ['Files', 'Inspect', 'Snapshots']) {
        await page.getByRole('navigation', { name: 'Workspace panels' }).getByRole('button', { name: tab }).click();
        await axe(page, `/archive/sql-workspace/ ${tab} tab @390`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'computer tab ' + tab);
      }
    }
  }

  // Keyboard: skip link, then the search menu across the site.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
  await searchTo(page, 'Plugins & Skills');
  await page.getByRole('link', { name: 'Browse and search skills' }).click();
  const skillSearch = page.getByRole('searchbox', { name: 'Search skills' });
  await skillSearch.fill('product design');
  assert(await page.locator('#skill-37signals-product-design').isVisible());
  assert.equal(await page.locator('#skill-rcc-core').isVisible(), false);
  await skillSearch.fill('zzzzzzzz');
  assert.match(await page.getByRole('status').textContent(), /No matching skills/);
  await skillSearch.fill('');
  assert.equal(await page.locator('.skill:visible').count(), 22);
  await searchTo(page, 'Notes');
  assert.equal(new URL(page.url()).pathname, '/notes/');

  const menu = await browser.newPage({ reducedMotion: 'reduce' });
  await watch(menu);
  for (const [width, height] of [[360, 800], [390, 844], [411, 891], [1440, 900]]) {
    await menu.setViewportSize({ width, height });
    await menu.goto(base);
    const opener = search(menu);
    const query = menu.getByRole('combobox');
    const dialog = menu.getByRole('dialog');
    await opener.waitFor();
    assert((await opener.boundingBox()).height >= 44, 'search target ' + width);
    await opener.click();
    await menu.waitForFunction(() => document.activeElement?.id === 'jump-input');
    assert.equal(await menu.evaluate(() => document.getAnimations().length), 0);
    if (width === 390 || width === 1440) await menu.screenshot({ path: shot(`search-${width}-open.png`) });
    await axe(menu, `search dialog @${width}`);
    await query.fill('zzzzzzzz');
    assert(await menu.getByText('No matches. Try a project or skill name.').isVisible());
    await query.fill('hotwire');
    assert.equal(await menu.getByRole('option', { name: '37signals-hotwire', exact: true }).getAttribute('aria-selected'), 'true');
    await query.press('ArrowDown');
    assert.equal(await query.getAttribute('aria-activedescendant'), 'jump-option-1');
    await query.press('ArrowUp');
    await query.press('Enter');
    await menu.waitForURL('**/skills/**');
    assert.equal(new URL(menu.url()).hash, '#skill-37signals-hotwire');
    await menu.getByRole('searchbox').focus();
    await menu.keyboard.press('Control+k');
    await menu.keyboard.press('/');
    assert(!(await dialog.isVisible()), 'shortcuts are ignored while typing');
    await menu.goBack();
    for (const key of ['Control+k', 'Meta+k', '/']) {
      await menu.keyboard.press(key);
      await menu.waitForFunction(() => document.activeElement?.id === 'jump-input');
      await menu.keyboard.press('Escape');
      await menu.waitForFunction(() => document.activeElement?.id === 'jump-open');
    }
    await menu.keyboard.press('/');
    await menu.waitForFunction(() => document.activeElement?.id === 'jump-input');
    await menu.mouse.click(2, 2);
    await menu.waitForFunction(() => document.activeElement?.id === 'jump-open');
    if (width === 390) {
      await opener.click();
      await menu.setViewportSize({ width, height: 420 });
      await menu.waitForFunction(() => document.querySelector('#jump-dialog').getBoundingClientRect().bottom < 420);
      await query.fill('Open Parcel Relay');
      await query.press('Enter');
      await menu.waitForURL('**/computer/parcel-relay.html');
      await menu.waitForFunction(() => document.documentElement.dataset.wasmMemoryBytes === '65536');
    }
    report.search.push(width);
  }
  await menu.goto(base + '/skills/#skill-37signals-hotwire');
  const catalogFilter = menu.getByRole('searchbox');
  for (const destination of ['rcc-core', 'rcc-core']) {
    await catalogFilter.fill('hotwire');
    await menu.locator('#skill-' + destination).waitFor({ state: 'hidden' });
    await search(menu).click();
    const query = menu.getByRole('combobox');
    await query.fill(destination);
    await query.press('Enter');
    await menu.locator('#skill-' + destination).waitFor({ timeout: 4000 });
    assert.equal(new URL(menu.url()).hash, '#skill-' + destination);
    assert.equal(await catalogFilter.inputValue(), '');
  }
  await menu.context().close();

  // Computer: a real round trip, online and then with the network cut after the page has loaded.
  const csv = Buffer.from('city,visits\nAkron,3\n"Columbus, OH",5\nToledo,\n');
  const json = Buffer.from(JSON.stringify([{ tool: 'rcc', stars: 1 }, { tool: 'sql.js', stars: 2, tags: ['wasm'] }]));
  async function roundTrip(tab, label) {
    await tab.goto(base + '/archive/sql-workspace/');
    await ready(tab);
    if (label === 'offline') await tab.context().setOffline(true);
    await tab.getByRole('button', { name: 'Use the sample workspace' }).click();
    await tab.getByText('sample workspace · 3 files · 3 tables').waitFor();
    await tab.getByRole('group', { name: 'Example queries' }).getByRole('button', { name: 'Skills per plugin' }).click();
    await tab.getByRole('button', { name: 'Run', exact: true }).click();
    await tab.locator('#result').getByText('4 rows').waitFor();
    assert.equal(await tab.locator('#result tbody td.num').evaluateAll(cells => cells.reduce((sum, c) => sum + Number(c.textContent), 0)), 22);
    await tab.locator('#filein').setInputFiles([
      { name: 'visits.csv', mimeType: 'text/csv', buffer: csv },
      { name: 'tools.json', mimeType: 'application/json', buffer: json },
    ]);
    await tab.getByText('your workspace · 5 files · 5 tables').waitFor();
    await sql(tab, 'SELECT city, visits FROM visits ORDER BY city;');
    await tab.locator('#result').getByText('3 rows').waitFor();
    assert.equal(await tab.locator('#result tbody tr').nth(1).locator('td').first().textContent(), 'Columbus, OH');
    assert.equal(await tab.locator('#result tbody tr').nth(2).locator('td').nth(1).textContent(), 'null');
    await sql(tab, 'SELECT SUM(stars) AS stars, MAX(tags) AS tags FROM tools;');
    await tab.locator('#result').getByText('1 row', { exact: false }).waitFor();
    await show(tab, 'Files');
    await tab.getByRole('button', { name: /^visits\.csv/ }).click();
    await show(tab, 'Inspect');
    const digest = createHash('sha256').update(csv).digest('hex');
    await tab.locator('#inspect').getByText(digest).waitFor({ state: 'attached' });
    await sql(tab, 'SELECT nope FROM visits;');
    await tab.getByText("There's no column called nope").waitFor();
    if (label === 'online') await tab.screenshot({ path: shot('computer-error-390.png') });
    const [download] = await Promise.all([tab.waitForEvent('download'), tab.getByRole('button', { name: 'Save workspace' }).click()]);
    assert.match(download.suggestedFilename(), /^workspace-\d{8}-\d{6}\.sqlite$/);
    const saved = await readFile(await download.path());
    assert.equal(saved.subarray(0, 15).toString(), 'SQLite format 3');
    await sql(tab, 'DROP TABLE skills;');
    await sql(tab, 'SELECT COUNT(*) FROM skills;');
    await tab.getByText("There's no table called skills").waitFor();
    await tab.locator('#filein').setInputFiles({ name: download.suggestedFilename(), mimeType: 'application/vnd.sqlite3', buffer: saved });
    await tab.getByText(/Restored the workspace saved \d{4}-\d\d-\d\d \d\d:\d\d UTC/).first().waitFor();
    await sql(tab, 'SELECT COUNT(*) AS n FROM skills;');
    assert.equal(await tab.locator('#result tbody td').first().textContent(), '22');
    await sql(tab, "SELECT COUNT(*) AS n FROM sqlite_master WHERE name LIKE '_workspace_%';");
    assert.equal(await tab.locator('#result tbody td').first().textContent(), '0');
    await show(tab, 'Files');
    assert.equal(await tab.locator('#filelist li').count(), 5);
    await tab.getByRole('button', { name: /^visits\.csv/ }).click();
    await tab.locator('#inspect').getByText(digest).waitFor({ state: 'attached' });
    if (label === 'online') {
      await tab.screenshot({ path: shot('computer-files-390.png') });
      await show(tab, 'Query');
      await tab.screenshot({ path: shot('computer-restored-390.png') });
    }
    report.computer[label] = { sampleSkills: 22, imported: ['visits.csv', 'tools.json'], savedBytes: saved.length, savedSha256: createHash('sha256').update(saved).digest('hex'), restoredSkills: 22, internalTablesHidden: true };
  }
  const online = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await watch(online);
  await roundTrip(online, 'online');
  await online.context().close();
  const offline = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await watch(offline);
  await roundTrip(offline, 'offline');
  await offline.screenshot({ path: shot('computer-offline-1440.png') });
  await offline.context().close();

  report.relay = await verifyRelay({ browser, base, proof, watch, axe });

  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);

  // The homepage stays small: no WebAssembly or workspace code until someone opens the computer.
  for (const [profile, width] of [['mobile', 390], ['desktop', 1440]]) {
    const cold = await browser.newPage({ viewport: { width, height: 900 } });
    report.transfer[profile] = {};
    for (const state of ['cold', 'warm']) {
      if (state === 'cold') await cold.goto(base);
      else await cold.reload();
      await cold.waitForLoadState('networkidle');
      const requests = await cold.evaluate(() =>
        performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource'))
          .map(({ name, transferSize, encodedBodySize }) => ({ path: new URL(name).pathname, transferSize, encodedBodySize })));
      report.transfer[profile][state] = requests;
      assert(!requests.some(({ path }) => /vendor|computer|archive/.test(path)), 'homepage loads computer code');
    }
    const coldBytes = report.transfer[profile].cold.reduce((total, item) => total + item.transferSize, 0);
    report.transfer[profile].coldBytes = coldBytes;
    assert(coldBytes < Number(process.env.HOME_BUDGET_KB || 240) * 1024, profile + ' cold homepage exceeds envelope: ' + coldBytes);
    await cold.context().close();
  }
  await writeFile(new URL('browser.json', proof), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, transfer: Object.fromEntries(Object.entries(report.transfer).map(([k, v]) => [k, v.coldBytes])) }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
