// Homepage facts and draft copy.
// Career history came from Josh on 2026-11-26. Project facts come from GitHub releases, merged pull requests
// and repository creation dates. The older résumé PDF is not linked: its education line is wrong.
// Everything in `draft` is first-person copy waiting for Josh's approval. The build labels it on the page.
const gh = path => 'https://github.com/' + path;

export const links = {
  github: gh('joshyorko'),
  plugins: gh('joshyorko/plugins'),
  pluginInstall: gh('joshyorko/plugins#codex-bootstrap'),
  installScript: gh('joshyorko/plugins/blob/main/install.sh'),
};

export const install = 'curl -fsSL https://raw.githubusercontent.com/joshyorko/plugins/main/install.sh | bash';

export const draft = {
  role: 'I build backend, data and AI systems for healthcare, and open-source tools that make computing more portable and reproducible.',
  story: [
    'I spent seven years working as a certified nursing assistant after high school.',
    'When I was preparing to become a father, I wanted to build a different future, so I moved into customer service at Spencer Technologies. I worked my way into client onboarding, then into data and automation at CVS Health.',
    'From there came software implementations, data engineering, and eventually building production backend and AI systems at Gainwell.',
    'Outside work, I maintain and contribute to open-source software, and I experiment with making computing more portable, reproducible and useful.',
    'I like finding out what computers can do, even when the experiment has no obvious practical reason.',
  ],
};

export const path = [
  ['7 years', 'Certified nursing assistant', 'After high school'],
  ['2017–19', 'Customer service, then client onboarding', 'Spencer Technologies'],
  ['2019–21', 'Desktop deployment reporting and Python automation', 'CVS Health'],
  ['2021–22', 'Software implementations with Python and SQL', 'Lambent Spaces / Armored Things'],
  ['2022–23', 'Data engineering', 'Gainwell Technologies'],
  ['2023–', 'Backend, platform, distributed automation and AI agents', 'Gainwell Technologies'],
];

// Described in public terms only: no internal system names, data, metrics, or rollout details.
export const work = [
  ['Production APIs', 'Backend services that healthcare operations depend on, built and run in production.'],
  ['Data pipelines', 'Python and SQL pipelines that move healthcare data between the systems that use it.'],
  ['Distributed automation', 'Worker pools that spread automated jobs across machines and are designed to keep running reliably.'],
  ['AI agents', 'Agents grounded in source material, with evaluations that check their behavior and keep execution predictable.'],
  ['Cloud infrastructure', 'The infrastructure these services, pipelines and workers run on.'],
];

export const upstream = [
  ['Project Bluefin', 'review controls', 'projectbluefin/contribute', [
    [191, 'Make every GitHub mutation use one exact-head ActionPlan'],
    [350, 'Present exact-head re-review deltas'],
  ]],
  ['Project Bluefin', 'Hive queue controls', 'projectbluefin/contribute', [
    [248, 'Queue auto-merge through Hive'],
    [432, 'Read-only Hive status companion'],
    [487, 'Suppress intentional queue cancellation'],
    [489, 'Gate queue issue implementation on fresh explicit admission'],
  ]],
  ['Hauler', 'Docker context fix', 'hauler-dev/hauler', [
    [928, 'Use the selected Docker context for local image imports'],
  ]],
];

// relation labels used on the homepage and in the computer's sample table.
export const relations = {
  rcc: 'maintained continuation', actions: 'maintained fork', 'josh-room': 'own', memoryd: 'own', cas: 'own',
  review: 'merged upstream', 'mcp-tunnel-kit': 'own', hauler: 'merged upstream',
  'Dudley OS': 'own', 'Omarchy Bootc': 'own', 'Devsy Harvester provider': 'created, now maintained by Devsy',
  'Room of Requirement': 'own', 'Homebrew Tools': 'own', 'Webtop OS': 'own', 'DSB Common': 'own', 'Dudley ISO': 'own',
};

// Honest statuses only. Evidence links point at things that exist.
export const questions = [
  ['Can a working session be saved and reopened as one file?', 'works here',
    'The computer on this site saves imported files, tables and query history into a single SQLite file you can open again later.',
    [['Open the computer', '/computer/']]],
  ['Can a development workspace be snapshotted, encrypted and rolled back?', 'built',
    'Josh Room does this from the command line and a VS Code picker. Josh All The Things packs a workspace and its tools into one portable capsule.',
    [['Josh Room', gh('joshyorko/josh-room')], ['JAT #43', gh('joshyorko/josh-all-the-things/pull/43')]]],
  ['Can an environment be rebuilt the same way next year?', 'maintained',
    'RCC builds environments from a description and caches them by content. Four patch releases went out in early November.',
    [['RCC releases', gh('joshyorko/rcc/releases')]]],
  ['Can an automated reviewer act only on the exact commit it read?', 'merged upstream',
    'Bluefin’s review tooling now plans every GitHub mutation against one exact head.',
    [['contribute #191', gh('projectbluefin/contribute/pull/191')], ['#350', gh('projectbluefin/contribute/pull/350')]]],
  ['Should a desktop be a container image?', 'building',
    'Two public attempts: Dudley OS on Bluefin, and Omarchy rebuilt as a bootc image.',
    [['Dudley OS', gh('joshyorko/dudley-os')], ['Omarchy Bootc', gh('joshyorko/omarchy-bootc')]]],
  ['Could a real Linux desktop or browser run usefully inside this tab?', 'research interest',
    'Not tried on this site. It stays on the list until there is something real to show.',
    []],
];

// Dated from GitHub: releases, merges and repository creation.
export const notes = [
  ['2026-11-24', 'merged', 'RCC plugin rejects unsupported bootstrapper requests', 'plugins #112', gh('joshyorko/plugins/pull/112')],
  ['2026-11-23', 'merged', 'Preserve OCI capture identity and verify live digest pull references', 'josh-all-the-things #43', gh('joshyorko/josh-all-the-things/pull/43')],
  ['2026-11-17', 'upstream', 'Use the selected Docker context for local image imports', 'hauler #928', gh('hauler-dev/hauler/pull/928')],
  ['2026-11-13', 'release', 'Actions Runtime 1.1.1', 'joshyorko/actions', gh('joshyorko/actions/releases/tag/actions-runtime-1.1.1')],
  ['2026-11-10', 'release', 'RCC v18.19.11, the fourth patch release in six days', 'joshyorko/rcc', gh('joshyorko/rcc/releases/tag/v18.19.11')],
  ['2026-11-05', 'merged', 'Repair native plugin reads and qualify the full Codex 0.166 surface', 'codex-action-server #30', gh('joshyorko/codex-action-server/pull/30')],
  ['2026-11-02', 'handed over', 'The Harvester provider now lives under Devsy', 'devsy-provider-harvester', gh('devsy-org/devsy-provider-harvester')],
  ['2026-10-09', 'release', 'Luna Factory v0.2.1, a corrective package release', 'plugins v0.2.1', gh('joshyorko/plugins/releases/tag/v0.2.1')],
  ['2026-09-29', 'release', 'MemoryD v0.1.0, first release', 'codex-memoryd', gh('joshyorko/codex-memoryd/releases/tag/v0.1.0')],
  ['2026-09-13', 'upstream', 'Gate queue issue implementation on fresh explicit admission', 'contribute #489', gh('projectbluefin/contribute/pull/489')],
  ['2026-08-27', 'upstream', 'Present exact-head re-review deltas', 'contribute #350', gh('projectbluefin/contribute/pull/350')],
  ['2026-08-24', 'new repo', 'Josh Room: encrypted development-workspace snapshots', 'joshyorko/josh-room', gh('joshyorko/josh-room')],
  ['2026-08-11', 'upstream', 'Make every GitHub mutation use one exact-head ActionPlan', 'contribute #191', gh('projectbluefin/contribute/pull/191')],
  ['2026-03-23', 'new repo', 'Dudley OS: a bootc desktop image built on Project Bluefin', 'joshyorko/dudley-os', gh('joshyorko/dudley-os')],
  ['2025-09-05', 'new repo', 'RCC, continued: Robocorp created RCC; this repository maintains it', 'joshyorko/rcc', gh('joshyorko/rcc')],
];
