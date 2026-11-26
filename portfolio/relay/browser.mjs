import { loadModel, minimumMargin } from './model.mjs';
import { createSession, incidents, tools } from './world.mjs';

const byId = id => document.getElementById(id);
const buttons = Object.fromEntries(['run', 'step', 'stop', 'reset', 'save'].map(key => [key, byId(key)]));
const picker = byId('incident');
const activity = byId('activity');
const statuses = {
  replay: 'Ready to replay the incident.',
  repair: 'Replay complete. The repair agent can propose a change.',
  audit: 'Repair proposed. The verifier will test it before applying it.',
  verified: 'Verified. The parcel arrives exactly once.',
  rejected: 'Verification failed. The original configuration is still active.',
  handoff: 'No applicable repair. The parcel needs a human decision.',
};
const names = { replay: 'Replay · Dispatch', repair: 'Repair agent · WASM model', audit: 'Verifier · Delivery contract' };

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function list(items) {
  const node = document.createElement('ul');
  node.append(...items.map(text => element('li', text)));
  return node;
}

function receipt(entry) {
  const item = element('li', '');
  item.className = 'receipt';
  item.append(element('h3', names[entry.phase]));
  const timing = element('p', `${entry.ms.toFixed(2)} ms`);
  timing.className = 'timing';
  item.append(timing);

  if (entry.deliveries) {
    const trace = list(entry.events.map(({ station, text }) => `${station} · ${text}`));
    if (entry.checks) {
      item.append(list(entry.checks.map(({ label, pass }) => `${pass ? 'Pass' : 'Fail'} · ${label}`)));
      const details = element('details', '');
      details.append(element('summary', 'Replay trace'), trace);
      item.append(details);
    } else {
      item.append(trace);
    }
  }

  if (entry.decision) {
    item.append(element('p', entry.patch
      ? 'Proposed: ' + tools[entry.patch].name
      : entry.reason));
    const details = element('details', '');
    details.append(element('summary', 'Model scores'), list(entry.decision.scores.map(({ key, score }) =>
      `${tools[key].name}: ${score.toFixed(2)}`)),
    element('p', `Top-two margin: ${entry.decision.margin.toFixed(2)} · Minimum margin: ${minimumMargin.toFixed(2)}`),
    element('p', 'Evidence words: ' + (entry.decision.evidence.join(', ') || 'none')));
    item.append(details);
  }
  return item;
}

async function boot() {
  // Capture the pristine application, including its inline runtime and model.
  const pristine = document.documentElement.cloneNode(true);
  const model = await loadModel(Uint8Array.from(atob(embedded.wasm), char => char.charCodeAt(0)), embedded.model);
  let incident = incidents[0];
  let session = createSession(incident, model);
  let timer = null;
  let paused = false;
  let restored = false;
  let snapshotError = false;

  let snapshot;
  try {
    snapshot = JSON.parse(byId('snapshot').textContent);
  } catch {
    snapshotError = true;
  }
  if (!snapshotError && (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot))) {
    snapshotError = true;
  }
  if (!snapshotError && Object.keys(snapshot).length) {
    const selected = incidents.find(({ id }) => id === snapshot.incident);
    if (snapshot.version === 1 && selected && Number.isInteger(snapshot.steps) && snapshot.steps >= 0 && snapshot.steps <= 3) {
      const resumed = createSession(selected, model);
      for (let i = 0; i < snapshot.steps; i++) resumed.step();
      if (resumed.history.length === snapshot.steps) {
        incident = selected;
        session = resumed;
        restored = true;
      } else {
        snapshotError = true;
      }
    } else {
      snapshotError = true;
    }
  }

  function render() {
    byId('parcel').textContent = incident.parcel;
    byId('destination').textContent = incident.destination || 'Missing address';
    byId('clue').textContent = incident.clue;
    const latestReplay = session.history.findLast(entry => entry.deliveries);
    byId('count').textContent = latestReplay ? latestReplay.deliveries.length : '—';
    const state = session.outcome ?? session.phase;
    const status = byId('status');
    status.dataset.state = state;
    status.textContent = (snapshotError ? 'Saved state did not validate. ' : restored ? 'Saved run restored. ' : '') +
      (paused ? 'Paused. ' : '') + statuses[state];
    buttons.run.disabled = buttons.step.disabled = timer !== null || Boolean(session.outcome);
    buttons.stop.disabled = timer === null;
    buttons.reset.disabled = session.history.length === 0 && timer === null;
    buttons.save.disabled = session.history.length === 0;
    picker.disabled = timer !== null;
    byId('empty').hidden = session.history.length > 0;
    // Keep expanded receipts and focus intact when later receipts arrive.
    while (activity.children.length < session.history.length) {
      activity.append(receipt(session.history[activity.children.length]));
    }
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
  }

  function reset() {
    stop();
    incident = incidents.find(({ id }) => id === picker.value);
    session = createSession(incident, model);
    activity.replaceChildren();
    paused = restored = snapshotError = false;
    render();
  }

  function advance() {
    session.step();
    if (session.outcome) stop();
    else timer = setTimeout(advance, 850);
    render();
  }

  for (const { id, label } of incidents) picker.add(new Option(label, id));
  picker.value = incident.id;
  picker.addEventListener('change', reset);
  buttons.reset.addEventListener('click', reset);
  buttons.run.addEventListener('click', () => {
    paused = false;
    advance();
  });
  buttons.step.addEventListener('click', () => {
    paused = false;
    session.step();
    render();
  });
  buttons.stop.addEventListener('click', () => {
    stop();
    paused = true;
    render();
  });
  buttons.save.addEventListener('click', () => {
    pristine.querySelector('#snapshot').textContent = JSON.stringify({
      version: 1, incident: incident.id, steps: session.history.length,
    });
    const file = new Blob(['<!doctype html>\n', pristine.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(file);
    const download = element('a', '');
    download.href = url;
    download.download = 'parcel-relay-saved.html';
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  render();
  performance.measure('model and page ready');
  document.documentElement.dataset.wasmMemoryBytes = model.memoryBytes;
}

boot().catch(() => {
  byId('status').textContent = 'The local application could not start. Open a fresh copy in a browser with WebAssembly enabled.';
});
