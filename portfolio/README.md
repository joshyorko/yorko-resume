# Josh Yorko’s orbital portfolio

```sh
cd portfolio
node build.mjs
python3 -m http.server --bind 127.0.0.1 --directory dist 8000
```

Open http://127.0.0.1:8000/. The dependency-free build needs Node 22 or newer. The simple server is for browsing. The verification server applies the generated headers and 404 page.

## Design review

[360 px](proof/home-360.png) · [390 px](proof/home-390.png) · [411 px](proof/home-411.png) · [1440 px](proof/home-1440.png) · [Plugins](proof/plugins-390.png) · [Skill search](proof/skills-390.png) · [Lab](proof/lab-390.png)

The refinement blends the artwork into a viewport-wide horizon and places the navigation on that same field. The interior pages use the same light and type. [Before on phone](https://github.com/joshyorko/yorko-resume/blob/1495b23d9595d64612565be67079c036f081baf7/portfolio/proof/home-390.png) · [Before on desktop](https://github.com/joshyorko/yorko-resume/blob/1495b23d9595d64612565be67079c036f081baf7/portfolio/proof/home-1440.png)

The homepage pairs two direct tasks with a single orbital illustration. The complete site navigation lives in the document. ImageGen produced the original illustration for this project. The two WebP encodes are the only new visual assets. The page uses system fonts and static art, with no animation, GPU scene, or homepage JavaScript.

The Neon and Opus arena revisions informed the provenance links and dated notes. First-class routes, public catalog sources, offline Actions and MemoryD work, and the earlier design evidence come from [PR #52’s baseline](https://github.com/joshyorko/yorko-resume/tree/631481871d22d7b053c1aae23a84cc7d14d04b09/portfolio).

## Verify

```sh
cd portfolio
npm ci
npm run verify
```

Set `CHROME` if Chrome is outside `/usr/bin/google-chrome`. Set `PROOF_DIR` to an absolute path to save the captures and results outside the checkout. The browser uses a temporary profile with the Chrome sandbox enabled. [Browser results](proof/browser.json)

The catalog is pinned to [e24cd596ef41e9294ad770d2b613bf77b42a8a68](https://github.com/joshyorko/plugins/commit/e24cd596ef41e9294ad770d2b613bf77b42a8a68). Refresh with `python3 snapshot-catalog.py /path/to/plugins > data/catalog.json`. Review the metadata diff before rebuilding.

## Deploy and roll back

Build and serve only `portfolio/dist/`. The build contains no test results, design drafts, secrets, third-party scripts, or analytics. The optional `node preview-pack.mjs FULL_COMMIT` emits a review Worker from those same bytes and labels the responses with the candidate commit. Its route table serves only packaged files.

GitHub Pages and the existing Cloudflare preview are separate surfaces. The production promotion target and normal release path must be identified before moving traffic. A Cloudflare promotion should record the active version ID, upload a candidate version without shifting traffic, and verify the versioned preview. Roll back by restoring the previously recorded version to 100% and checking the live body digests and routes. Neither rollback nor promotion requires a DNS change on an existing verified target.

The earlier Cloudflare Worker must remain available independently of a review Worker. The [Machine Room rollback source](https://github.com/joshyorko/yorko-resume/tree/a535909574cb94b169040e05b54ae198fe77673a/machine-room) includes its deployment archive, geometry evidence and tests. ZIP SHA-256 `247f69aff3f535a8377d86f4673a284e58165c2521d97ea2ccdcc8c748f30234`.

## Jump menu review

The anchored panel won the two-variant spike. It opens from the visible “Jump to…” control and keeps its position when the results shorten. Plugins and Projects retain direct home links. The page links also remain in HTML for navigation without JavaScript.

[Before on phone](https://github.com/joshyorko/yorko-resume/blob/83a33c490c1dc7081408fa6ebfe571f8d0bfb446/portfolio/proof/home-390.png) · [Phone open](proof/jump-390-open.png) · [Phone filtered](proof/jump-390-filter.png) · [Phone empty](proof/jump-390-empty.png) · [Desktop open](proof/jump-1440-open.png) · [Desktop filtered](proof/jump-1440-filter.png) · [Desktop empty](proof/jump-1440-empty.png)

Basecamp made one visible jump affordance work across pages. Omarchy Quattro integrated its launcher and menu into one focused search. This site borrows those interaction principles. [Basecamp navigation](https://basecamp.com/updates/a-clearer-top-navigation) · [Keyboard behavior](https://basecamp.com/keyboard) · [Omarchy launcher](https://github.com/basecamp/omarchy/pull/6231)

Fried’s discussion of simulated texture informed the fine stipple, edge light, and depressed button state. His product-depth essay informed the search index: the one control opens named projects, individual skills, and existing lab proofs. [Interview](https://www.davidsenra.com/episode/jason-fried) · [Surface area vs. Depth in product design](https://world.hey.com/jason/surface-area-vs-depth-in-product-design-eabd0cb4)
