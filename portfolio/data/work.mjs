const owner = 'https://github.com/joshyorko/';
const repo = (name, path = name) => [name, owner + path];
const image = (name, repository) => repo(name, repository + '/pkgs/container/' + repository);

export const projects = [
  ['rcc', 'RCC', 'Build reproducible environments for automation projects. I maintain this distribution and its environment artifact tooling.',
    [repo('Source', 'rcc'), repo('v18.19.11 release', 'rcc/releases/tag/v18.19.11')]],
  ['actions', 'Actions Runtime', 'Expose Python actions over HTTP or MCP. My work is in the fork of tonnitommi/actions-sema4ai.',
    [repo('Fork', 'actions'), ['Parent repository', 'https://github.com/tonnitommi/actions-sema4ai'], repo('Runtime 1.1.1', 'actions/releases/tag/actions-runtime-1.1.1')]],
  ['josh-room', 'Josh Room and JAT', 'Save and restore encrypted workspace snapshots. Josh All The Things provides the capture and restore tooling.',
    [repo('Josh Room VSIX release', 'josh-room/releases/tag/v1.0.2-standalone-vsix'), repo('Josh Room source', 'josh-room'), repo('JAT source', 'josh-all-the-things'), repo('Capture identity PR #43', 'josh-all-the-things/pull/43')]],
  ['memoryd', 'MemoryD', 'Durable local recall for coding agents, with exportable records and evidence.',
    [repo('Source', 'codex-memoryd'), repo('v0.1.0 release', 'codex-memoryd/releases/tag/v0.1.0')]],
  ['cas', 'Codex Action Server', 'Connect Codex workflows to the Actions stack. The linked change shows the integration work.',
    [repo('Source', 'codex-action-server'), repo('Integration PR #30', 'codex-action-server/pull/30')]],
  ['review', 'Bluefin Review', 'I contributed revision-bound mutation plans, re-review deltas, and fresh admission checks to Bluefin’s upstream review tooling.',
    [['PR #191', 'https://github.com/projectbluefin/contribute/pull/191'], ['PR #350', 'https://github.com/projectbluefin/contribute/pull/350'], ['PR #489', 'https://github.com/projectbluefin/contribute/pull/489']]],
  ['mcp-tunnel-kit', 'MCP Tunnel Kit', 'Package and operate a self-hosted tunnel control plane for MCP integrations.',
    [repo('Setup guide', 'mcp-tunnel-kit#readme'), repo('Source', 'mcp-tunnel-kit')]],
  ['hauler', 'Hauler', 'I contributed a fix for Docker context selection in the upstream OCI transport tool.',
    [['Upstream PR #928', 'https://github.com/hauler-dev/hauler/pull/928']]],
];

export const systems = [
  ['Dudley OS', 'A personal bootc workstation distribution based on Project Bluefin.', [image('Bootc images and tags', 'dudley-os'), repo('Stream guide', 'dudley-os#readme')]],
  ['Omarchy Bootc', 'An image assembly project that packages the upstream Omarchy userspace as an Arch bootc image.', [image('Bootc images and tags', 'omarchy-bootc'), repo('Build guide', 'omarchy-bootc#readme')]],
  ['Devsy Harvester provider', 'I created the provider that provisions Harvester VMs for devcontainers. Devsy maintains it upstream. My original repository is archived.',
    [['Upstream and attribution', 'https://github.com/devsy-org/devsy-provider-harvester#license-and-attribution'], repo('Archived original', 'devsy-provider-harvester')]],
  ['Room of Requirement', 'Homebrew-first devcontainer images for Ubuntu, Debian, and Wolfi.', [image('Devcontainer images and tags', 'room-of-requirement'), repo('Variant guide', 'room-of-requirement#readme')]],
  ['Homebrew Tools', 'Formulae and casks for developer tools, with package builds and installation checks.', [repo('Install with Homebrew', 'homebrew-tools#readme'), repo('Formulae', 'homebrew-tools/tree/main/Formula'), repo('Casks', 'homebrew-tools/tree/main/Casks')]],
  ['Webtop OS', 'An Omarchy desktop packaged for browser streaming on LinuxServer’s Arch and Selkies base.', [image('Container images and tags', 'webtop-os'), repo('Container source', 'webtop-os')]],
  ['DSB Common', 'A versioned filesystem payload shared by Dudley-related OCI images.', [image('Payload image and tags', 'dsb-common'), repo('Payload contract', 'dsb-common#readme')]],
  ['Dudley ISO', 'Build recipes for offline installation media. The project documents how to check an installed image.', [repo('ISO build instructions', 'dudley-iso#readme')]],
];
