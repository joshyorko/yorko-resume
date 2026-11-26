const form = document.querySelector('#manifest');
const roots = document.querySelector('#roots');
const manifestResult = document.querySelector('#manifest-result');
const fixtureResult = document.querySelector('#fixture-result');
const inspect = document.querySelector('#inspect');
const receipt = document.querySelector('#export');
const availability = document.querySelector('#lab-error');
let session;

function labSession() {
  session ??= import('./demo.mjs').then(async module => ({
    demo: await module.createDemo(),
    download: module.downloadChronology,
  })).catch(error => {
    session = undefined;
    throw error;
  });
  return session;
}

async function run(button, output, task) {
  button.disabled = true;
  output.textContent = 'Checking…';
  try {
    const { demo } = await labSession();
    const result = await task(demo);
    output.replaceChildren(result);
    receipt.disabled = false;
  } catch {
    output.textContent = 'The local check could not complete. Try reloading the lab in a browser with WebAssembly and Web Crypto.';
  } finally {
    button.disabled = false;
  }
}

if (typeof WebAssembly !== 'undefined' && globalThis.crypto?.subtle) {
  form.hidden = false;
  document.querySelector('#fixture-controls').hidden = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const count = roots.valueAsNumber;
    run(form.querySelector('button'), manifestResult, demo => {
      const { output } = demo.runManifest({
        format_version: 1, descriptor_count: 5, root_memories: count, dependency_objects: 0,
      });
      return output ? 'Manifest accepted.' : 'Manifest rejected.';
    });
  });
  inspect.addEventListener('click', () => run(inspect, fixtureResult, async demo => {
    const result = await demo.inspectFixture();
    const evidence = document.createElement('pre');
    evidence.textContent = JSON.stringify(result.activity.receipt.provenance, null, 2);
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Verified bundle digests';
    details.append(summary, evidence);
    const message = document.createElement('div');
    message.textContent = 'Integrity verified. Synthetic record: ' + result.content;
    message.append(details);
    return message;
  }));
  receipt.addEventListener('click', async () => {
    const { demo, download } = await labSession();
    download(demo);
  });
} else {
  availability.textContent = 'This browser context lacks WebAssembly or Web Crypto. The source links below explain the checks.';
}
