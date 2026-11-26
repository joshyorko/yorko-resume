# Josh Yorko’s site

```sh
cd portfolio
node build.mjs
python3 -m http.server --bind 127.0.0.1 --directory dist 8791
```

Open http://127.0.0.1:8791/. The build needs Node 22 or newer and has no runtime dependencies. The simple server is for browsing. The verifier applies the generated headers and 404 page.

## Design

The home page puts the person and the computer side by side. The left half has Josh’s path from nursing assistant to backend and AI engineering. The right half opens the workspace. Below them come the full story, his work, open source, plugins and skills, open questions and recent notes. On a phone the two halves stack.

[1440 px](proof/home-1440.png) · [390 px](proof/home-390.png) · [360 px](proof/home-360.png) · [Full page, 390 px](proof/home-390-full.png) · [Search](proof/search-390-open.png)

Text marked **Draft** is first-person copy in Josh’s voice that he has not yet approved. The career path came from Josh on 2026-11-26. Project facts link to releases, merged pull requests and repositories.

Type is Literata, Schibsted Grotesk and JetBrains Mono, self-hosted under the SIL Open Font License (`fonts/`). The pages need no JavaScript to read or navigate. Two small scripts enable search and the copy button.

## The computer

`/computer/` opens CSV, TSV, SQLite and JSON-array files in the browser tab. It runs SQL with [sql.js 1.12.0](vendor/sql.js/) and computes a SHA-256 digest for each file. It saves the whole session as one `.sqlite` file and restores it later. Nothing is uploaded. Once loaded, it works offline.

[Empty](proof/computer-empty-1440.png) · [Sample](proof/computer-sample-1440.png) · [Phone](proof/computer-sample-390.png) · [Restored](proof/computer-restored-390.png) · [Offline](proof/computer-offline-1440.png) · [Bad file](proof/computer-error-390.png)

The saved file is ordinary SQLite with the `josh-computer-workspace/0` format. User tables keep their names. `_workspace_meta`, `_workspace_files` and `_workspace_queries` hold file names, digests and saved queries.

This release is only the workspace. Guest operating systems, a nested browser, agents and state visualization are research interests, not features.

## Verify

```sh
cd portfolio
npm ci
npm run verify
```

Set `CHROME` if Chrome is outside `/usr/bin/google-chrome`. Set `PROOF_DIR` to an absolute path to keep captures out of the checkout. The verifier covers these checks:

- Pages work without JavaScript, and each heading matches its nav label.
- No horizontal overflow at 360, 390, 411, 850 and 1440 px.
- axe-core finds no violations.
- The search menu works.
- Two real workspace round trips, one online and one offline. Each imports, queries, saves and restores.
- No external requests or console errors.
- The cold home page stays under the `HOME_BUDGET_KB` budget, which defaults to 240 KB.

[Browser results](proof/browser.json)

The catalog is pinned to [e24cd59](https://github.com/joshyorko/plugins/commit/e24cd596ef41e9294ad770d2b613bf77b42a8a68). Refresh with `python3 snapshot-catalog.py /path/to/plugins > data/catalog.json` and review the diff before rebuilding.

## Sources that need correcting

Josh did not complete a degree. These public files still list a B.A. in English and must not be linked or redistributed until he authorizes a correction:

- `docs/assets/JoshYorkoResume.pdf`
- `docs/index.md`
- `templates/awesome-resume/cv-sections/education.tex`
- `templates/developer-resume/main.tex`

This site does not link the PDF. Its résumé page is built from `build.mjs` and has no education section.

## Release and rollback

Build and serve only `portfolio/dist/`. It contains no test results, drafts, secrets, third-party scripts or analytics. `node preview-pack.mjs FULL_COMMIT` emits a review Worker from the same bytes. It labels responses with the commit. The generated `_headers` send `X-Robots-Tag: noindex, nofollow` on every route.

The production target has to be confirmed before any traffic moves. To release:

1. Record the active version ID.
2. Upload the candidate without shifting traffic.
3. Verify the versioned preview.
4. Promote it. Remove the `noindex` header in `build.mjs` only for that release.

To roll back, restore the recorded version to 100% and check the live routes. Neither step needs a DNS change.

Earlier versions stay available as rollback sources:

- [PR #52 preview](https://github.com/joshyorko/yorko-resume/tree/110a3f51216f5d935f135f6140b082e257aac1eb/portfolio).
- [Machine Room](https://github.com/joshyorko/yorko-resume/tree/a535909574cb94b169040e05b54ae198fe77673a/machine-room). Its ZIP SHA-256 is `247f69aff3f535a8377d86f4673a284e58165c2521d97ea2ccdcc8c748f30234`.
