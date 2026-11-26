# Josh Yorko’s portfolio preview

Build with Node 22 or newer. The build has zero package dependencies and writes only static files.

```sh
cd portfolio
node build.mjs
python3 -m http.server --bind 127.0.0.1 --directory dist 8000
```

Open http://127.0.0.1:8000/. The server above is for local browsing. The browser test harness serves the generated security headers and cache policy. A future Cloudflare preview can serve `dist/` as static assets. This branch has no deployment configuration or automation.

## Review

| Layout | Phone | Desktop |
|---|---|---|
| Final directory | [390 px](proof/home-390.png) | [1440 px](proof/home-1440.png) |
| Editorial prototype | [390 px](proof/editorial-390.png) | [1440 px](proof/editorial-1440.png) |
| Directory prototype | [390 px](proof/directory-390.png) | [1440 px](proof/directory-1440.png) |

The independent reviewer preferred the directory for first-view access to skills, projects, notes, and the résumé. The final version removes repeated navigation from the landing page and adds direct links to three named projects. [360 px](proof/home-360.png) · [411 px](proof/home-411.png) · [Plugins](proof/plugins-390.png) · [Skill search](proof/skills-390.png) · [Lab](proof/lab-390.png)

Theo’s focused link hierarchy and Ben Davis’s distinct resource pages informed the design. Josh’s 37signals-inspired product design, scope judgment, and Shape Up skills guided the interface-first approach and the choice to keep the lab separate. [Theo](https://t3.gg) · [Ben Davis](https://davis7.sh) · [Josh’s product skills](https://github.com/joshyorko/plugins/tree/e24cd596ef41e9294ad770d2b613bf77b42a8a68/plugins/37signals/skills)

## Verify

```sh
cd portfolio
npm ci
npm run verify
```

Set `CHROME` if desktop Chrome is installed outside `/usr/bin/google-chrome`. The test uses a temporary profile with Chrome’s sandbox enabled. [Browser results](proof/browser.json) · [Public link checks](proof/public-links.txt)

The static skill catalog is pinned to [e24cd596ef41e9294ad770d2b613bf77b42a8a68](https://github.com/joshyorko/plugins/commit/e24cd596ef41e9294ad770d2b613bf77b42a8a68). Update it with `python3 snapshot-catalog.py /path/to/plugins > data/catalog.json`, review the metadata diff, then rebuild. The CLI extracts manifest versions and skill frontmatter. The website loads no skill instruction bodies.

## Lab and archive

Agent Lab retains the 96-byte Actions WASM kernel and pinned native-verified synthetic MemoryD bundle. The separate, versioned offline HTML runs the same code. Save the download and compare its SHA-256 with the checksum linked on the lab page. The lab has fixed assets, unsigned integer inputs, a 16-entry in-memory chronology, and an explicit receipt download. The browser checks are scoped to those assets. The synthetic model comparison, SQLite gallery, and general artifact workbench are outside this candidate.

PR #51’s entire frontend, Worker config, and old test surfaces are preserved at [a535909574cb94b169040e05b54ae198fe77673a](https://github.com/joshyorko/yorko-resume/tree/a535909574cb94b169040e05b54ae198fe77673a/machine-room). The archived deployable ZIP SHA-256 is `247f69aff3f535a8377d86f4673a284e58165c2521d97ea2ccdcc8c748f30234`. Its browser, offline and geometry evidence is [in the archive](https://github.com/joshyorko/yorko-resume/tree/a535909574cb94b169040e05b54ae198fe77673a/machine-room/proof).
