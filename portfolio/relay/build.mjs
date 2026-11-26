import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { train } from './model.mjs';

export const artifactName = 'parcel-relay.html';
const read = (name, encoding) => readFile(new URL(name, import.meta.url), encoding);
const digest = (bytes, encoding) => createHash('sha256').update(bytes).digest(encoding);
const inline = source => source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '');

export async function buildRelay() {
  const [template, style, kernel, license, ...sources] = await Promise.all([
    read('relay.html', 'utf8'), read('relay.css', 'utf8'), read('decision.wasm'), read('LICENSE', 'utf8'),
    ...['model.mjs', 'world.mjs', 'browser.mjs'].map(file => read(file, 'utf8')),
  ]);
  if (digest(kernel, 'hex') !== '019618f3b197e49d21a2427e2cd07ed6033f87d558aa1cd819866d13ea2f2921') {
    throw new Error('Unexpected decision WASM digest');
  }
  const model = train();
  const script = 'const embedded = ' + JSON.stringify({ wasm: kernel.toString('base64'), model }) +
    ';\n' + sources.map(inline).join('\n');
  const policy = `default-src 'none'; script-src 'sha256-${digest(script, 'base64')}' 'wasm-unsafe-eval'; style-src 'sha256-${digest(style, 'base64')}'; connect-src 'none'; form-action 'none'; base-uri 'none'`;
  const substitutions = { style, kernelBytes: kernel.length, weightBytes: model.weightBytes, script, policy, license };
  const html = template.replace(/{{(\w+)}}/g, (_, key) => substitutions[key]);
  return { html, scriptHash: digest(script, 'base64'), styleHash: digest(style, 'base64') };
}
