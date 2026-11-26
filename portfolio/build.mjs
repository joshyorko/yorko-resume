import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { projects, systems } from './data/work.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = join(root, 'dist');
const read = path => readFile(join(root, path), 'utf8');
const write = async (path, content) => {
  const target = join(output, path);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content);
};
const catalog = JSON.parse(await read('data/catalog.json'));
const source = 'https://github.com/joshyorko/plugins';
const pinned = `${source}/blob/${catalog.revision}/`;
const rollback = 'a535909574cb94b169040e05b54ae198fe77673a';
const archive = `https://github.com/joshyorko/yorko-resume/tree/${rollback}/machine-room`;
const pluginInfo = {
  '37signals': ['37signals', 'Community-maintained, 37signals-inspired guidance for Rails, Hotwire, and product work. Independent of 37signals and Basecamp.', 'Codex, Claude Code, Hermes'],
  fizzy: ['Fizzy', 'Work with boards and cards through the Fizzy CLI or MCP connector. The connector needs your own account and authorization.', 'Codex, Claude Code, Hermes'],
  rcc: ['RCC', 'Guidance for reproducible automation, environment artifacts, Robot Framework, and Actions. The Actions/Robot Bootstrapper MCP is opt-in.', 'Codex, Claude Code, Hermes'],
  'luna-factory': ['Luna Factory', 'A published orchestration skill, local Rust MCP control plane, and MCP Apps workbench. v0.2.1 is a corrective package release. Live native execution and ChatGPT host acceptance are separate operator qualification gates.', 'Native runtime for Codex'],
};
const routes = [
  ['plugins/', 'Plugins &amp; Skills'],
  ['projects/', 'Projects'],
  ['systems/', 'Systems'],
  ['lab/', 'Agent Lab'],
  ['notes/', 'Field Notes'],
  ['resume/', 'Résumé'],
];
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const link = (label, url) => `<a href="${esc(url)}">${esc(label)}</a>`;
const links = entries => `<p class="links">${entries.map(([label, url]) => link(label, url)).join(' ')}</p>`;
const css = await read('site.css');
const hash = value => createHash('sha256').update(value).digest('base64');

function page({ title, description, route = '', content, script = '', showNav = route !== '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="description" content="${esc(description)}">
<title>${esc(title)}${title === 'Josh Yorko' ? '' : ' · Josh Yorko'}</title>
<link rel="stylesheet" href="/site.css">
${script ? `<script type="module" src="${script}"></script>` : ''}
</head>
<body${route === '' ? ' class="home-page"' : ' class="interior"'}>
<a class="skip" href="#main">Skip to content</a>
${showNav ? `<header class="shell site-header"><nav aria-label="Main">
<a class="identity" href="/" ${route === '' ? 'aria-current="page"' : ''}>${route === '' ? 'Home' : 'Josh Yorko'}</a>
${routes.map(([path, name]) => `<a href="/${path}"${route === path ? ' aria-current="page"' : route === 'skills/' && path === 'plugins/' ? ' aria-current="location"' : ''}>${name}</a>`).join('\n')}
</nav></header>` : ''}
<main id="main" class="${route === '' ? 'home-shell' : 'shell'}" tabindex="-1">${content}</main>
<footer class="shell site-footer"><a href="https://github.com/joshyorko">GitHub</a></footer>
</body>
</html>
`;
}

const entry = (name, description, evidence, id = '') => `<li${id ? ` id="${id}"` : ''}><h2>${esc(name)}</h2><p class="description">${esc(description)}</p>${links(evidence)}</li>`;
const title = (name, intro) => `<h1>${esc(name)}</h1><p class="intro">${esc(intro)}</p>`;
const home = `<div class="orbit">
<div class="orbit-intro">
<h1>Josh Yorko</h1>
<p class="orbit-summary">Software engineer building reproducible environments, portable workspaces, and coding-agent tools.</p>
<p class="orbit-links"><a href="/skills/">Search skills <span aria-hidden="true">→</span></a><a href="/lab/#actions-check">Run a local proof <span aria-hidden="true">→</span></a></p>
</div>
<picture class="orbital-art">
<img src="/media/orbit-small.webp" srcset="/media/orbit-small.webp 568w, /media/orbit.webp 1120w"
sizes="(min-width: 53rem) 54vw, calc(100vw - 2.75rem)" width="1120" height="747" alt="" fetchpriority="high">
</picture>
<nav class="home-nav" aria-label="Main">
<ul>
${routes.map(([path, label]) => `<li><a href="/${path}">${label}</a></li>`).join('\n')}
</ul>
</nav>
</div>
<section class="selected" aria-labelledby="selected">
<h2 id="selected">Selected software</h2>
<ul>
<li><a href="/projects/#rcc">RCC</a><p>Reproducible environments for automation.</p></li>
<li><a href="/projects/#josh-room">Josh Room</a><p>Save and restore encrypted workspaces.</p></li>
<li><a href="/projects/#memoryd">MemoryD</a><p>Durable local recall for coding agents.</p></li>
</ul>
</section>`;

const roles = [
  ['Gainwell Technologies', 'Advisor Application Developer', 'Jun 2023–present', 'Backend, data, and platform engineering.'],
  ['Gainwell Technologies', 'Senior Data Engineer / Software Engineer', 'Jun 2022–Mar 2023', 'Data engineering and software development.'],
  ['Lambent Spaces', 'Implementations Specialist', 'Mar 2021–Oct 2022', 'SQL and Python automation for implementations.'],
  ['CVS Health', 'Data Analyst (Desktop Support)', 'May 2019–Mar 2021', 'Deployment reporting and Dash/Plotly reports.'],
  ['Spencer Technologies', 'Client Onboarding Specialist', 'Jan 2017–Apr 2019', 'Client onboarding.'],
];

const pages = [
  ['', 'Josh Yorko', 'Software engineer working on automation, reproducible environments, and developer tools.', home],
  ['projects/', 'Projects', 'Open-source software I maintain, build, and contribute to.',
    `<ul class="entries section">${projects.map(([id, name, description, sources]) => entry(name, description, sources, id)).join('\n')}</ul>`],
  ['systems/', 'Systems', 'Workstation images, devcontainers, distributed packages, and deployment tools.',
    `<ul class="entries section">${systems.map(item => entry(...item)).join('\n')}</ul>`],
  ['plugins/', 'Plugins & Skills', 'My public marketplace packages reusable instructions and tools for coding agents.',
    `${links([['Browse and search skills', '/skills/'], ['Marketplace source', source], ['Read installation instructions', pinned + 'docs/codex-bootstrap.md']])}
<ul class="entries section">${catalog.plugins.map(({name, version, skills}) => {
  const [label, info, clients] = pluginInfo[name];
  return `<li id="${name}"><h2>${label} <span class="tag">v${version}</span></h2>
<p class="description">${esc(info)}</p><p class="small">${esc(clients)}</p>
${links([[`Browse ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`, `/skills/#${name}`], ['Manifest', pinned + `plugins/${name}/plugin.json`],
  ...(name === 'luna-factory' ? [['v0.2.1 release', source + '/releases/tag/v0.2.1']] : [])])}</li>`;
}).join('\n')}</ul>
<section class="section" aria-labelledby="portable"><h2 id="portable">Portable Agent Plugins</h2>
<p>Portable Agent Plugins 1.0.0 describes the package manifest. Skills live in <code>SKILL.md</code> files. Packages can declare MCP integrations. This repository generates client marketplaces and compatibility shims for Codex, Claude Code, and Hermes, and checks them in CI. Each client’s runtime support varies by plugin.</p>
${links([['Catalog manifest', pinned + 'marketplaces/catalog.json'], ['Repository guide', pinned + 'README.md'], ['Validation workflows', source + '/actions']])}</section>`],
  ['skills/', 'Skill catalog', 'Browse the published skill metadata by plugin. Each entry links to its pinned public source.',
    `<div class="section" id="skill-controls" hidden>
<label for="skill-search">Search skills</label>
<input type="search" id="skill-search" placeholder="Try Hotwire or environment artifacts" maxlength="160">
<p class="small" id="skill-count" role="status"></p></div>
${catalog.plugins.map(({name, version, skills}) => `<section class="section skill-group" id="${name}" aria-labelledby="${name}-title">
<h2 id="${name}-title">${pluginInfo[name][0]} <span class="tag">v${version}</span></h2>
<p class="small">${pluginInfo[name][2]}</p>
<ul class="entries">${skills.map(skill => `<li class="skill" id="skill-${esc(skill.name)}">
<h3>${link(skill.name, pinned + skill.source)}</h3>
<p class="description">${esc(skill.description)}</p></li>`).join('\n')}</ul></section>`).join('\n')}
<p class="section small">Snapshot from ${link(catalog.revision.slice(0, 12), source + '/commit/' + catalog.revision)}. ${link('Installation documentation', pinned + 'docs/codex-bootstrap.md')}.</p>`,
    '/search.mjs'],
  ['notes/', 'Field Notes', 'Source links and small reproducible checks for selected public work.',
    `<ul class="entries section">
${entry('Nov 17, 2026 · Hauler', 'The upstream project merged a fix to honor the selected Docker context for local image imports.', [['Merged change #928', 'https://github.com/hauler-dev/hauler/pull/928']])}
${entry('Oct 9, 2026 · Luna Factory 0.2.1', 'The corrective release packages the local control plane and MCP Apps workbench. Live host acceptance is tracked separately.', [['Release evidence', source + '/releases/tag/v0.2.1']])}
${entry('Sep 13, 2026 · Bluefin Review', 'Bluefin merged an explicit admission check for OMP queue implementation.', [['Merged change #489', 'https://github.com/projectbluefin/contribute/pull/489']])}
${entry('Inspect a public fixture', 'Check manifest counts with a small WASM kernel or verify the integrity of a synthetic native MemoryD export. Both checks run on your device.', [['Open Agent Lab', '/lab/']])}
${entry('Review a specific revision', 'Bluefin’s public changes show how revision-bound plans and review deltas feed the mutation admission check.', [['Review evidence', '/projects/#review']])}
${entry('Trace the Harvester handoff', 'The upstream provider documents authorship, supported builds, and the transfer to Devsy.', [['Provider and upstream attribution', '/systems/']])}
${entry('Earlier portfolio experiments', 'The archived Machine Room candidate contains the original synthetic SQLite/WASM, artifact, and browser test evidence at the rollback revision.', [['Archive and harness', archive], ['Archived checks', archive.replace('/tree/', '/blob/') + '/proof/checks.json']])}
</ul>`],
  ['resume/', 'Résumé', 'Josh Yorko · Software engineer working on automation and developer tools.',
    `<section class="section"><h2>Experience</h2><ul class="entries">
${roles.map(([company, role, dates, description]) => `<li><h3>${esc(role)}</h3><p>${esc(company)} <span class="description">· ${esc(dates)}</span></p><p class="description">${esc(description)}</p></li>`).join('\n')}
</ul></section>
<section class="section"><h2>Education</h2><p>B.A. in English · Indiana State University</p></section>
<section class="section"><h2>Technical skills</h2><p>Go, Python, SQL, Kubernetes, MCP and HTTP, test infrastructure, and developer environments.</p>
${links([['Public projects', '/projects/'], ['GitHub profile', 'https://github.com/joshyorko']])}</section>`],
];

for (const [route, name, intro, body, script] of pages) {
  await write(route + 'index.html', page({
    title: name, description: intro, route, script, content: route === '' ? body : title(name, intro) + body,
  }));
}
await write('site.css', css);
for (const image of ['orbit.webp', 'orbit-small.webp']) {
  await write(`media/${image}`, await readFile(join(root, 'media', image)));
}
await write('404.html', page({
  title: 'Page unavailable', description: 'The requested page was not found.', route: '404.html',
  content: title('Page unavailable', 'The requested page was not found.') + '<p class="section"><a href="/">Return to the homepage</a></p>',
}));
await write('search.mjs', await read('search.mjs'));

const lab = await read('lab/content.html');
const labBody = lab.replace('<!--offline-->', '<p class="section"><a href="/lab/offline.html" download="josh-yorko-agent-lab-v1.html">Download Agent Lab v1 for offline use</a> · <a href="/lab/SHA256SUMS">SHA-256 checksum</a></p>');
const labIntro = 'Inspect a manifest or verify a synthetic MemoryD bundle on your own device.';
await write('lab/index.html', page({
  title: 'Agent Lab', route: 'lab/', description: labIntro, content: title('Agent Lab', labIntro) + labBody,
  script: '/lab/ui.mjs',
}));
for (const file of ['ui', 'demo', 'core', 'assets']) await write(`lab/${file}.mjs`, await read(`lab/${file}.mjs`));

// Package the same lab logic in one file for explicit save-and-open offline use.
const offlineModules = await Promise.all(['assets', 'core', 'demo', 'ui'].map(file => read(`lab/${file}.mjs`)));
const offlineScript = offlineModules.map((code) => code
  .replace(/^import .*\n/gm, '').replace(/^export /gm, '')
  .replace(/import\('\.\/demo\.mjs'\)/g, 'Promise.resolve({createDemo, downloadChronology})')).join('\n');
const offline = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash(offlineScript)}' 'wasm-unsafe-eval'; style-src 'sha256-${hash(css)}'; form-action 'none'; base-uri 'none'">
<title>Agent Lab v1 · Josh Yorko</title>
<style>${css}</style>
</head><body><main class="shell">${title('Agent Lab v1', labIntro)}${lab.replace('<!--offline-->', '')}
<script>${offlineScript}</script></main></body></html>
`;
await write('lab/offline.html', offline);
await write('lab/SHA256SUMS', createHash('sha256').update(offline).digest('hex') + '  josh-yorko-agent-lab-v1.html\n');
await write('_headers', `/*
  Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'self' 'sha256-${hash(css)}'; script-src 'self' 'sha256-${hash(offlineScript)}' 'wasm-unsafe-eval'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
/site.css
  Cache-Control: public, max-age=300
/media/*
  Cache-Control: public, max-age=3600
`);
