// Explicit public collection. New entries require a reviewed source and role.
const personal = slug => 'https://github.com/joshyorko/' + slug;
export const infrastructure = [
  {
    id: 'devsy-provider-harvester', name: 'Devsy Harvester provider', role: 'Original creator · handed upstream to Devsy',
    purpose: 'Provision a Harvester/KubeVirt virtual machine as the host for a Devsy devcontainer.',
    details: 'The provider discovers ready images and their backing persistent volume claims, configures a new guest with cloud-init, and connects over SSH to run the workspace with Docker. The upstream releases distribute helpers for Linux and macOS on amd64 and arm64, and Windows on amd64.',
    status: 'Devsy maintains the upstream provider. Its README credits Josh Yorko as the original creator. His personal repository is archived after the handoff.',
    evidence: [{label:'Official attribution',url:'https://github.com/devsy-org/devsy-provider-harvester#license-and-attribution'},{label:'Upstream provider guide',url:'https://github.com/devsy-org/devsy-provider-harvester'},{label:'Archived original',url:personal('devsy-provider-harvester')}]
  },
  {
    id:'dudley-os',name:'Dudley OS',role:'Personal distribution',purpose:'Adapt Project Bluefin into a personal bootc workstation image with Dudley defaults and tools.',
    details:'Stable and its NVIDIA variant retain the upstream Bluefin desktop. Dakota is a separate experimental stream. The installer and shared payload have their own repositories.',
    status:'The published stream guide identifies stable as the daily-driver line. Josh’s upstream Bluefin review contributions are documented separately in the Airlock.'
  },
  {
    id:'omarchy-bootc',name:'Omarchy Bootc',role:'Image assembly',purpose:'Assemble the official Omarchy Quattro userspace into an Arch bootc OCI image.',
    details:'Pinned upstream inputs and package-ownership checks establish what goes into the image. The acceptance procedure follows installation to disk, graphical login, a two-image update and rollback.',
    status:'The repository documents those qualification gates. Hardware, update and rollback acceptance remain unverified here.'
  },
  {
    id:'dudley-iso',name:'Dudley ISO',role:'Installer project',purpose:'Build offline installation media for Dudley OS.',
    details:'An installer combines a bootable environment with a Dudley image payload. The project separates ISO assembly from verification of the installed system.',
    status:'Public build recipes and a verification checklist are available. Completed installer qualification remains unverified here.'
  },
  {
    id:'dsb-common',name:'DSB Common',role:'Shared payload development',purpose:'Publish versioned, reusable filesystem content for Dudley-related OCI images.',
    details:'A machine-readable contract maps source files to their final paths and selects adapters for different bases. Consumer projects own operating-system assembly and verification.',
    status:'The source publishes the payload contract and documents its use by Dudley OS.'
  },
  {
    id:'room-of-requirement',name:'Room of Requirement',role:'DevContainer image development',purpose:'Provide a portable Homebrew-first development workflow across Ubuntu, Debian and Wolfi.',
    details:'The image factory builds multiple bases around common developer commands. An opt-in Wolfi-systemd target provides a system manager and user services alongside the standard Wolfi image.',
    status:'The public variant matrix, build recipes and image-specific checks document the supported configurations.'
  },
  {
    id:'webtop-os',name:'Webtop OS',role:'Desktop container integration',purpose:'Stream an Omarchy desktop from an unprivileged container through Wayland.',
    details:'The image combines official Omarchy packages with LinuxServer’s Arch and Selkies base. Its documented runtime uses DRM render nodes for graphics.',
    status:'The source documents the container build and desktop runtime. This project packages the upstream desktop for streaming.'
  },
  {
    id:'homebrew-tools',name:'Homebrew Tools',role:'Package distribution and verification',purpose:'Deliver tools through Homebrew formulae and casks with release-build and verification workflows.',
    details:'For Review, the upstream project publishes the native appliance. The tap consumes its release, updates the formula and checks the packaged installation.',
    status:'The public tap documents the boundary between source release qualification and package verification.'
  }
].map(project => ({...project,evidence:project.evidence ?? [{label:'Project documentation',url:personal(project.id)}]}));

export const infrastructureRelationships = [
  {from:'dudley-iso',to:'dudley-os',kind:'documented',description:'The offline installer consumes the Dudley OS payload.',url:personal('dudley-iso')},
  {from:'dudley-os',to:'dsb-common',kind:'documented',description:'The OS image consumes the shared Dudley filesystem payload.',url:personal('dsb-common')}
];
