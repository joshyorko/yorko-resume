import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import settings from './worker.json' with { type: 'json' };

const [operation, expected, candidate, revision] = process.argv.slice(2);
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
assert.ok(['publish', 'rollback'].includes(operation));
assert.match(expected, uuid);
if (operation === 'publish') assert.match(revision, /^[a-f0-9]{40}$/);
else assert.match(candidate, uuid);
assert.equal(process.env.WORKER_PUBLISH_ENABLED, 'true', 'Operator enablement is required');

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!/^[0-9a-f]{32}$/.test(account || '') || !token) throw new Error('Cloudflare account and token are required');
const base = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${settings.name}`;
async function api(path, body) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body instanceof FormData ? body : body && JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => { throw new Error(`Cloudflare request failed for ${path}. Check deployment state before retrying.`); });
  if (!response.ok) throw new Error(`Cloudflare returned ${response.status} for ${path}. Check state before retrying.`);
  const data = await response.json();
  if (!data.success) throw new Error(`Cloudflare rejected ${path}`);
  return data.result;
}

async function checkActive() {
  const { deployments } = await api('/deployments');
  const versions = deployments[0]?.versions ?? [];
  if (versions.length !== 1 || versions[0].percentage !== 100 || versions[0].version_id !== expected)
    throw new Error('The active Worker version differs from the approved starting version');
}

await checkActive();
let version = candidate;
let message = `Rollback to ${version}`;
if (operation === 'publish') {
  const module = await readFile(candidate);
  const hash = createHash('sha256').update(module).digest('hex');
  message = `Portfolio ${revision}; worker sha256 ${hash}`;
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({
    main_module: 'worker.mjs',
    compatibility_date: settings.compatibilityDate,
    bindings: [],
    annotations: { 'workers/commit_sha': revision, 'workers/message': message },
  })], { type: 'application/json' }), 'metadata.json');
  form.append('worker.mjs', new Blob([module], { type: 'application/javascript+module' }), 'worker.mjs');
  version = (await api('/versions', form)).id;
  assert.match(version, uuid);
  console.log(`Uploaded version ${version} from ${revision}; module sha256 ${hash}`);
  await checkActive();
}

const deployment = await api('/deployments', {
  strategy: 'percentage',
  versions: [{ version_id: version, percentage: 100 }],
  annotations: { 'workers/message': message },
});
console.log(`Deployment ${deployment.id}; version ${version}; previous version ${expected}`);
