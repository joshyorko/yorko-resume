import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { artifactName, buildRelay } from './relay/build.mjs';
import { resumeBody } from './resume/resume.mjs';
import { jumpDialog, jumpTrigger } from './jump-markup.mjs';
import { projects, systems } from './data/work.mjs';
import { draft, install, links as site, notes, path, questions, relations, upstream, work } from './data/site.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = join(root, 'dist');
const read = path => readFile(join(root, path), 'utf8');
const write = async (path, content) => {
  const target = join(output, path);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content);
};
const copy = async (from, to = from) => {
  await mkdir(join(output, to, '..'), { recursive: true });
  await copyFile(join(root, from), join(output, to));
};
await rm(output, { recursive: true, force: true });

const relayPath = '/computer/' + artifactName;
const resumePath = '/resume/JoshuaYorko-Resume.pdf';
const relay = await buildRelay();
const relayKB = Math.ceil(Buffer.byteLength(relay.html) / 1024);
const catalog = JSON.parse(await read('data/catalog.json'));
const source = 'https://github.com/joshyorko/plugins';
const pinned = `${source}/blob/${catalog.revision}/`;
const rollback = 'a535909574cb94b169040e05b54ae198fe77673a';
const archive = `https://github.com/joshyorko/yorko-resume/tree/${rollback}/machine-room`;
const skillCount = catalog.plugins.reduce((total, plugin) => total + plugin.skills.length, 0);
const pluginInfo = {
  '37signals': ['37signals', 'Community-maintained, 37signals-inspired guidance for Rails, Hotwire, and product work. Independent of 37signals and Basecamp.', 'Codex, Claude Code, Hermes'],
  fizzy: ['Fizzy', 'Work with boards and cards through the Fizzy CLI or MCP connector. The connector needs your own account and authorization.', 'Codex, Claude Code, Hermes'],
  rcc: ['RCC', 'Guidance for reproducible automation, environment artifacts, Robot Framework, and Actions. The Actions/Robot Bootstrapper MCP is opt-in.', 'Codex, Claude Code, Hermes'],
  'luna-factory': ['Luna Factory', 'A published orchestration skill, local Rust MCP control plane, and MCP Apps workbench. v0.2.1 is a corrective package release. Live native execution and ChatGPT host acceptance are separate operator qualification gates.', 'Native runtime for Codex'],
};
const routes = [
  ['computer/', 'Computer'],
  ['projects/', 'Projects'],
  ['systems/', 'Systems'],
  ['plugins/', 'Plugins &amp; Skills'],
  ['notes/', 'Notes'],
  ['resume/', 'Résumé'],
];
const routeWords = {
  '/': 'start homepage about',
  '/computer/': 'agents simulation parcel relay repair incident offline wasm',
  '/plugins/': 'extensions marketplace installation automation Codex Claude Hermes',
  '/projects/': 'software source contributions open source',
  '/systems/': 'Linux workstation bootc images devcontainers',
  '/notes/': 'notes log changes releases merged',
  '/resume/': 'resume CV experience work career',
  '/skills/': 'skill catalog search index',
};
const sections = [
  ['How I got here', '/#story', 'story career path CNA CVS Gainwell'],
  ['Work in healthcare', '/#work', 'Gainwell APIs pipelines agents'],
  ['Open source', '/#open-source', 'upstream maintained built Bluefin Hauler'],
  ['Open questions', '/#questions', 'investigations research experiments'],
];
const jumpEntries = [
  ...[...routes, ['skills/', 'Skill catalog'], ['', 'Home']].map(([path, label]) =>
    [label.replace('&amp;', '&'), '/' + path, 'Pages', routeWords['/' + path], path !== 'skills/' && path !== 'systems/']),
  ['Open Parcel Relay', relayPath, 'Pages', 'offline agent demo simulation', false],
  ...sections.map(([label, href, words]) => [label, href, 'On the homepage', words, false]),
  ...projects.map(([id, name, description]) =>
    [name, '/projects/#' + id, 'Projects', description, ['rcc', 'josh-room', 'memoryd'].includes(id)]),
  ...catalog.plugins.flatMap(({name, skills}) => skills.map(skill =>
    [skill.name, '/skills/#skill-' + skill.name, 'Skills', name + ' ' + skill.description, false])),
];
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const link = (label, url) => `<a href="${esc(url)}">${esc(label)}</a>`;
const links = entries => `<p class="links">${entries.map(([label, url]) => link(label, url)).join(' ')}</p>`;
const draftText = (text, tag = 'p', cls = '') => `<${tag} class="draft${cls ? ' ' + cls : ''}">${esc(text)}</${tag}>`;
const date = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const css = await read('site.css') + '\n' + await read('jump.css') + '\n' + await read('resume/resume.css');
const draftLegend = '<p class="draft-legend"><span class="draft-key">Draft</span> marks first-person copy that Josh has not approved yet.</p>';

function page({ title, description, route = '', content, script = '' }) {
  const home = route === '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="description" content="${esc(description)}">
<title>${esc(title)}${title === 'Josh Yorko' ? '' : ' · Josh Yorko'}</title>
<link rel="stylesheet" href="/site.css">
${script ? `<script type="module" src="${script}"></script>` : ''}
</head>
<body class="${home ? 'home-page' : 'interior'}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
<a class="identity" href="/"${home ? ' aria-current="page"' : ''}>Josh Yorko</a>
<nav aria-label="Main">
${routes.map(([path, name]) => `<a href="/${path}"${route === path ? ' aria-current="page"' : route === 'skills/' && path === 'plugins/' ? ' aria-current="location"' : ''}>${name}</a>`).join('\n')}
</nav>
${jumpTrigger}
</header>
<main id="main" class="${home ? 'home' : 'shell'}" tabindex="-1">${content}</main>
<footer class="site-footer"><p>${link('GitHub', site.github)} ${link('Résumé', '/resume/')} ${link('Computer', '/computer/')}</p>${draftLegend}</footer>
${jumpDialog}
</body>
</html>
`;
}

const entry = (name, description, evidence, id = '') => `<li${id ? ` id="${id}"` : ''}><h2>${esc(name)}</h2><p class="description">${esc(description)}</p>${links(evidence)}</li>`;
const title = (name, intro) => `<h1>${esc(name)}</h1><p class="intro">${esc(intro)}</p>`;
const project = id => projects.find(item => item[0] === id);
const system = name => systems.find(item => item[0] === name);
const pr = (repo, number) => `<a href="https://github.com/${repo}/pull/${number}">#${number}</a>`;
const chapter = (id, number, heading, body, note = '') => `<section class="chapter" id="${id}" aria-labelledby="${id}-title">
<h2 id="${id}-title"><span aria-hidden="true">${number}</span> ${heading}</h2>
<div class="chapter-body">${body}</div>
${note ? `<div class="margin-note">${note}</div>` : '<span></span>'}
</section>`;
const builtEntry = (name, description, href, label) => `<li><h4>${esc(name)}</h4><p>${esc(description)} ${link(label, href)}</p></li>`;

const homeContent = `<div class="split">
<section class="person" aria-labelledby="who">
<p class="label">The person</p>
<h1 id="who">Josh Yorko</h1>
${draftText(draft.role, 'p', 'role')}
<ol class="path" aria-label="Career path">
${path.map(([years, what, where]) => `<li><span class="years">${esc(years)}</span><span class="what">${esc(what)}${where ? `<span class="where">${esc(where)}</span>` : ''}</span></li>`).join('\n')}
</ol>
<p class="actions"><a class="button" href="${resumePath}" download>Download Résumé</a> <a class="button quiet" href="/resume/">Read Résumé</a> <a class="button quiet" href="${esc(site.github)}">GitHub</a> <a class="button quiet" href="#story">How I got here <span aria-hidden="true">↓</span></a></p>
</section>
<section class="machine" aria-labelledby="machine-title">
<p class="label">The computer</p>
<h2 id="machine-title">Get the parcel there once.</h2>
<p class="machine-intro">Replay a broken delivery. A local agent proposes a repair and a verifier tests it before any change sticks.</p>
<div class="slots">
<a class="slot primary" href="${relayPath}"><b>Open Parcel Relay</b><span>Pick a dispatch incident and watch the repair.</span></a>
<a class="slot" href="${relayPath}" download><b>Download offline computer</b><span>One HTML file with the model and runtime · ${relayKB} KiB</span></a>
</div>
<ul class="works" aria-label="Parcel Relay features">
<li>CPU inference in WebAssembly</li>
<li>Save the running simulation as HTML</li>
</ul>
</section>
</div>
${chapter('story', '01', 'How I got here', draft.story.map(text => draftText(text)).join('\n'),
  '<p>A draft in Josh’s voice, from his own account, waiting for his edit.</p>')}
${chapter('work', '02', 'Work in healthcare', `<p>At Gainwell Technologies since 2022, first in data engineering and now on backend, platform, automation and AI-agent work.</p>
<dl class="work">${work.map(([term, text]) => `<dt>${esc(term)}</dt><dd>${esc(text)}</dd>`).join('')}</dl>`,
  '<p>Described in public terms only. No internal names, data, or numbers.</p>')}
${chapter('open-source', '03', 'Open source', `<p>Three kinds of work, kept apart so it’s clear whose project is whose.</p>
<h3>Merged into other projects</h3>
<ul class="upstream">${upstream.map(([name, theme, repo, prs]) => `<li><b>${esc(name)}</b>, ${esc(theme)}: ${prs.map(([number]) => pr(repo, number)).join(' ')}</li>`).join('\n')}</ul>
<h3>Maintained</h3>
<ul class="built">
${builtEntry('RCC', 'Rebuilds the same automation environment from a description, on any machine. Robocorp created RCC; this is its independently maintained continuation.', project('rcc')[3][1][1], 'v18.19.11 release')}
${builtEntry('Actions runtime', 'Exposes Python actions over HTTP or MCP. A maintained fork of tonnitommi/actions-sema4ai.', project('actions')[3][2][1], 'Runtime 1.1.1')}
</ul>
<h3>Built</h3>
<ul class="built">
${builtEntry('Josh Room and JAT', 'Save and restore encrypted workspace snapshots, and pack a workspace with its tools into one portable capsule.', 'https://github.com/joshyorko/josh-room', 'Josh Room')}
${builtEntry('MemoryD', 'Local-first recall for coding agents, with exportable records.', project('memoryd')[3][1][1], 'v0.1.0 release')}
${builtEntry('Dudley OS and Omarchy Bootc', 'Desktops built as bootable container images.', system('Dudley OS')[2][1][1], 'Dudley OS')}
${builtEntry('Devsy Harvester provider', 'Devcontainers on Harvester VMs. I created it; Devsy maintains it now.', system('Devsy Harvester provider')[2][0][1], 'Upstream')}
</ul>
${links([['All projects', '/projects/'], ['Systems and images', '/systems/']])}`)}
${chapter('plugins', '04', 'Plugins &amp; Skills', `<p>${catalog.plugins.length} plugins and ${skillCount} skills for coding agents: RCC and Robot Framework, Actions, Fizzy, 37signals-style product and Rails judgment, and Luna Factory.</p>
<div class="install"><code id="install-command">${esc(install)}</code><button type="button" class="copy" data-copy="install-command" hidden>Copy</button></div>
<p class="small">Codex bootstrap for macOS and Linux. ${link('Read the script', site.installScript)} before you run it.</p>
<ul class="plugin-list">${catalog.plugins.map(({name, version, skills}) => `<li><a href="/plugins/#${name}">${pluginInfo[name][0]}</a> <span>v${version} · ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}</span></li>`).join('')}</ul>
${links([['Browse and search skills', '/skills/'], ['Marketplace source', source]])}`,
  `<p>Catalog pinned at ${link(catalog.revision.slice(0, 7), source + '/commit/' + catalog.revision)}.</p>`)}
${chapter('questions', '05', 'Open questions', `<p>What I’m working on, each linked to the thing that answers it, or marked plainly when nothing does yet.</p>
<ol class="questions">${questions.map(([question, status, text, evidence]) => `<li>
<h3>${esc(question)}</h3>
<p class="status" data-status="${esc(status.split(' ')[0])}">${esc(status)}</p>
<p>${esc(text)}</p>
${evidence.length ? links(evidence) : ''}
</li>`).join('\n')}</ol>`)}
${chapter('recent', '06', 'Recently', `<ol class="log">${notes.slice(0, 7).map(([iso, kind, text, ref, url]) => `<li><time datetime="${iso}">${date(iso)}</time><span class="kind">${esc(kind)}</span><span class="what">${esc(text)} ${link(ref, url)}</span></li>`).join('\n')}</ol>
${links([['All notes', '/notes/']])}`,
  '<p>Dated from GitHub releases, merges and repository creation.</p>')}`;

const pages = [
  ['', 'Josh Yorko', 'Josh Yorko builds backend, data and AI systems for healthcare, and open-source tools for portable, reproducible computing.', homeContent, '/home.mjs'],
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
  ['notes/', 'Notes', 'Dated changes from GitHub: releases, merged pull requests, and new repositories.',
    `<ol class="entries section log-page">
${notes.map(([iso, kind, text, ref, url]) => `<li><p class="small"><time datetime="${iso}">${date(iso)}</time> · ${esc(kind)}</p><h2>${esc(text)}</h2>${links([[ref, url]])}</li>`).join('\n')}
</ol>
<section class="section" aria-labelledby="earlier"><h2 id="earlier">Earlier portfolio experiments</h2>
<p>The archived Machine Room candidate contains the original synthetic SQLite/WASM, artifact, and browser test evidence at the rollback revision.</p>
${links([['Archive and harness', archive], ['Archived checks', archive.replace('/tree/', '/blob/') + '/proof/checks.json']])}</section>`],
  ['computer/', 'Computer', 'An offline agent simulation you can run and keep as one HTML file.',
    `<section class="section" aria-labelledby="relay-title">
<h2 id="relay-title">Parcel Relay</h2>
<p>A parcel arrived twice, got stuck in dispatch, or went missing. Replay the incident, watch a local model select a proposed repair, and see what an independent verifier finds.</p>
<p class="actions"><a class="button" href="${relayPath}">Open Parcel Relay</a> <a class="button quiet" href="${relayPath}" download>Download offline HTML · ${relayKB} KiB</a></p>
<p class="small">The download opens directly from disk. Its CPU model, tools and simulation are embedded. Save a run to carry its state with you.</p>
</section>
<section class="section"><h2>Earlier experiments</h2>${links([['Archived SQL workspace', '/archive/sql-workspace/'], ['Machine Room archive', archive]])}</section>`],
  ['resume/', 'Résumé', 'Joshua Yorko · Software Engineer | Distributed Systems & Agentic AI', resumeBody],

];

for (const [route, name, intro, body, script] of pages) {
  await write(route + 'index.html', page({
    title: name, description: intro, route, script, content: route === '' || route === 'resume/' ? body : title(name, intro) + body,
  }));
}
await write('404.html', page({
  title: 'Page unavailable', description: 'The requested page was not found.', route: '404.html',
  content: title('Page unavailable', 'The requested page was not found.') + '<p class="section"><a href="/">Return to the homepage</a></p>',
}));
await write('site.css', css);
await write(relayPath.slice(1), relay.html);
await copy(resumePath.slice(1));
for (const file of ['search.mjs', 'jump.mjs', 'home.mjs']) await write(file, await read(file));
await write('jump-index.mjs', 'export default ' + JSON.stringify(jumpEntries) + ';\n');
for (const font of ['literata-normal', 'schibsted-normal', 'jetbrains-normal']) await copy(`fonts/${font}.woff2`);
for (const license of ['Literata', 'SchibstedGrotesk', 'JetBrainsMono']) await copy(`fonts/OFL-${license}.txt`);
for (const file of ['sql-wasm.js', 'sql-wasm.wasm', 'LICENSE']) await copy(`vendor/sql.js/${file}`);

// The computer's sample tables come from the same public facts as the pages.
const csv = rows => rows.map(row => row.map(value => /[",\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : value).join(',')).join('\n') + '\n';
const sample = {
  'projects.csv': csv([['name', 'kind', 'relation', 'what', 'url'],
    ...projects.map(([id, name, description, sources]) => [name, 'project', relations[id], description, sources[0][1]]),
    ...systems.map(([name, description, sources]) => [name, 'system', relations[name], description, sources[0][1]])]),
  'notes.csv': csv([['date', 'kind', 'title', 'ref', 'url'], ...notes]),
  'skills.csv': csv([['plugin', 'version', 'skill', 'description'],
    ...catalog.plugins.flatMap(({name, version, skills}) => skills.map(skill => [name, version, skill.name, skill.description]))]),
};
await write('archive/sql-workspace/sample.mjs', 'export default ' + JSON.stringify(sample) + ';\n');
await write('archive/sql-workspace/index.html', (await read('computer/index.html'))
  .replaceAll('{{github}}', esc(site.github)).replaceAll('/computer/', '/archive/sql-workspace/'));
for (const file of ['app.mjs', 'computer.css']) await copy(`computer/${file}`, `archive/sql-workspace/${file}`);

await write('_headers', `/*
  Content-Security-Policy: default-src 'none'; img-src 'self'; font-src 'self'; style-src 'self' 'sha256-${relay.styleHash}'; script-src 'self' 'sha256-${relay.scriptHash}' 'wasm-unsafe-eval'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
/site.css
  Cache-Control: public, max-age=300
/fonts/*
  Cache-Control: public, max-age=86400
/vendor/*
  Cache-Control: public, max-age=86400
`);
