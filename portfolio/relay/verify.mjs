import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { train, loadModel } from './model.mjs';
import { incidents, createSession } from './world.mjs';

const artifact = new URL('../dist/computer/parcel-relay.html', import.meta.url);
const button = (page, name) => page.getByRole('button', { name, exact: true });
const status = page => page.getByRole('status');
const ready = page => page.waitForFunction(() => document.documentElement.dataset.wasmMemoryBytes === '65536');

export async function verifyRelay({ browser, base, proof, watch, axe }) {
  const html = await readFile(artifact);
  const hosted = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await watch(hosted);
  await hosted.goto(base + '/computer/');
  const [download] = await Promise.all([
    hosted.waitForEvent('download'), hosted.getByRole('link', { name: /Download offline HTML/ }).click(),
  ]);
  assert.deepEqual(await readFile(await download.path()), html);
  await hosted.getByRole('link', { name: 'Open Parcel Relay' }).click();
  await ready(hosted);
  await axe(hosted, 'Hosted Parcel Relay');
  await hosted.context().close();

  const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 900 } });
  const requests = [];
  const unexpected = [];
  async function offlineTab() {
    const tab = await context.newPage();
    tab.on('pageerror', error => unexpected.push(error.message));
    tab.on('console', message => { if (message.type() === 'error') unexpected.push(message.text()); });
    const cdp = await context.newCDPSession(tab);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
    });
    cdp.on('Network.requestWillBeSent', ({ request, type }) => requests.push({ url: request.url, type }));
    return tab;
  }
  await context.route(/^https?:/, route => {
    unexpected.push(route.request().url());
    return route.abort();
  });
  const page = await offlineTab();
  try {
    await page.goto(artifact.href);
    await ready(page);
    assert.equal(await page.evaluate(() => navigator.onLine), false);
    const coldReadyMs = await page.evaluate(() => performance.getEntriesByName('model and page ready')[0].duration);

    for (const [id, proposal, initial] of [
      ['duplicate', 'Enable delivery receipts', '2'],
      ['outage', 'Set a three-attempt budget', '0'],
      ['abandoned', 'Release expired claims', '0'],
    ]) {
      await page.locator('#incident').selectOption(id);
      await button(page, 'Step').click();
      assert.equal(await page.locator('#count').textContent(), initial);
      await button(page, 'Step').click();
      assert(await page.getByText('Proposed: ' + proposal, { exact: true }).isVisible());
      assert.equal(await page.locator('#count').textContent(), initial);
      await button(page, 'Step').click();
      assert.match(await status(page).textContent(), /^Verified/);
      assert.equal(await page.locator('#count').textContent(), '1');
      assert.equal(await page.getByText(/^Pass · /).count(), 5);
    }

    await page.locator('#incident').selectOption('address');
    await button(page, 'Step').click();
    await button(page, 'Step').click();
    assert.match(await status(page).textContent(), /^No applicable repair/);
    assert(await page.getByText('A human needs to correct the missing address.', { exact: true }).isVisible());
    assert.equal(await page.locator('#count').textContent(), '0');

    // Capture a completed desktop run, with the independent checks visible.
    await page.locator('#incident').selectOption('duplicate');
    await button(page, 'Run repair').click();
    await button(page, 'Stop').click();
    const count = await page.locator('.receipt').count();
    await page.waitForTimeout(950);
    assert.equal(await page.locator('.receipt').count(), count);
    assert.match(await status(page).textContent(), /^Paused/);
    await button(page, 'Run repair').click();
    await page.waitForFunction(() => document.querySelector('#status').dataset.state === 'verified');
    const stepMs = await page.locator('.timing').allTextContents();
    await page.screenshot({ path: new URL('relay-1440.png', proof).pathname, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await axe(page, 'Offline Parcel Relay at 390 px');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: new URL('relay-390.png', proof).pathname, fullPage: true });

    // Save mid-run, reopen from disk with a fresh offline tab, then reload and resume.
    await page.locator('#incident').selectOption('outage');
    await button(page, 'Step').click();
    await button(page, 'Step').click();
    const [saved] = await Promise.all([page.waitForEvent('download'), button(page, 'Save runnable HTML').click()]);
    const savedPath = new URL('parcel-relay-saved.html', proof);
    await saved.saveAs(savedPath.pathname);
    const savedBytes = (await readFile(savedPath)).length;
    await page.close();
    const restored = await offlineTab();
    await restored.goto(savedPath.href);
    await ready(restored);
    assert.match(await status(restored).textContent(), /^Saved run restored/);
    assert.equal(await restored.locator('#incident').inputValue(), 'outage');
    assert.equal(await restored.locator('.receipt').count(), 2);
    await restored.reload();
    await ready(restored);
    assert.equal(await restored.locator('.receipt').count(), 2);
    await button(restored, 'Step').click();
    assert.match(await status(restored).textContent(), /Verified/);
    await button(restored, 'Reset').click();
    assert.equal(await restored.locator('.receipt').count(), 0);
    await restored.goto(artifact.href);
    await ready(restored);
    assert.equal(await restored.locator('.receipt').count(), 0);
    const memory = await context.newCDPSession(restored);
    await memory.send('Performance.enable');
    const { metrics } = await memory.send('Performance.getMetrics');
    const jsHeapUsedBytes = metrics.find(({ name }) => name === 'JSHeapUsedSize').value;

    const corrupted = new URL('parcel-relay-corrupt.html', proof);
    const bad = html.toString('utf8').replace('id="snapshot">{}</script>', 'id="snapshot">{broken</script>');
    await writeFile(corrupted, bad);
    await restored.goto(corrupted.href);
    await ready(restored);
    assert.match(await status(restored).textContent(), /^Saved state did not validate/);
    assert.equal(await restored.locator('.receipt').count(), 0);
    assert.deepEqual(unexpected, []);
    assert.equal(requests.length, 5);
    assert(requests.every(request => request.url.startsWith('file:') && request.type === 'Document'));

    // Force a plausible, permitted, wrong repair. The audit must reject it.
    const kernel = await readFile(new URL('decision.wasm', import.meta.url));
    const weights = train();
    const model = await loadModel(kernel, weights);
    assert.equal(model.rank('').choice, null);
    const forced = { rank: () => ({ choice: 'retry' }) };
    const wrong = createSession(incidents[0], forced);
    for (let i = 0; i < 3; i++) wrong.step();
    assert.equal(wrong.outcome, 'rejected');
    assert.equal(wrong.history[2].deliveries.length, 2);
    assert.equal(wrong.history[2].checks.find(check => check.label === 'Lost acknowledgement').pass, false);

    return { bytes: html.length, sha256: createHash('sha256').update(html).digest('hex'),
      coldReadyMs, stepMs, jsHeapUsedBytes, wasmMemoryBytes: 65536, weightBytes: weights.weightBytes,
      requests: requests.map(request => ({ ...request, url: request.url.split('/').at(-1) })),
      savedBytes, verifiedIncidents: 3, humanHandoffs: 1, wrongRepairRejected: true };
  } finally {
    await context.close();
  }
}
