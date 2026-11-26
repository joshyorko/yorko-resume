# Portfolio release runbook

## Build and verify

From a clean checkout at the full reviewed commit, run the following with Node 22. The browser suite needs Chrome and uses a loopback-only server.

```sh
npm ci --prefix portfolio
PROOF_DIR=/absolute/path/to/scratch/browser npm run verify --prefix portfolio
node portfolio/compat/build.mjs /absolute/path/to/empty/pages
```

The browser suite tests the rendered site, keyboard navigation, catalog search, SQL archive and the standalone Parcel Relay in Chrome offline mode. `portfolio-verify.yml` checks pull requests and main pushes. LaTeX runs separately and uploads review PDFs and PNGs.

## Package a review Worker

```sh
revision=$(git rev-parse HEAD)
node portfolio/build.mjs
node portfolio/preview-pack.mjs "$revision" > /absolute/path/to/scratch/review-worker.mjs
node portfolio/release/check-worker.mjs /absolute/path/to/scratch/review-worker.mjs "$revision" preview
sha256sum /absolute/path/to/scratch/review-worker.mjs portfolio/dist/resume/JoshuaYorko-Resume.pdf
```

The review module defaults to `X-Robots-Tag: noindex, nofollow`. This command tests the module locally. Use a separately authorized isolated Worker if a hosted review URL is needed.

## Worker cutover

The current public service is [the existing workers.dev Worker](https://joshyorko-portfolio-preview.joshua-yorko.workers.dev/). Its release target and compatibility date are in [worker.json](release/worker.json). The Cloudflare API reported deployment `66c06815-b6e4-4526-b59a-c82631b98df8` with version `daa9fe7a-34e2-43af-b00c-fe43bac4e7f9` at 100% and previous version `ab928ad4-920b-43ae-b2bc-6274d3a33919`. The Worker sends `X-Portfolio-Commit: bb7476975a806d0d3207017b02b8bfc40eb66c61`. Its Git portfolio tree matches `origin/main` at `d99fc1500fd93da5b78541d0177ed08b18b760b6` (tree `745d596b9d8c5797467a2f54cf769a8fdb39106d`). A Git commit identifies source. A Cloudflare deployment UUID identifies a traffic update, a version UUID identifies an uploaded Worker, and SHA-256 identifies exact bytes.

Cloudflare reported zero bindings, workers.dev enabled, version preview URLs enabled, and zero matching custom domains or routes across the two visible account zones. The public homepage had no robots meta directive or `X-Robots-Tag`. Workers Builds has automatic builds enabled, with a production trigger scoped to `prototype/machine-room-20261125` and build previews disabled. That trigger’s deploy command targets this same Worker. Treat that old branch as archival and have the owner retire the trigger or explicitly coordinate it before enabling the new release path.

Only the owner can approve these cutover steps.

1. Confirm the current Worker version and routes in Cloudflare. Review the exact main revision, candidate PDF decision and the local module smoke results. Resolve the legacy Build trigger before cutover.
2. Configure the GitHub environment `portfolio-worker-production` with required reviewers and main-only deployment. Set `WORKER_PUBLISH_ENABLED=true` in that environment after approval. Set the two environment secret names `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Scope the token to the target account and the narrowest Worker edit permission available. The script uses only the version and deployment APIs.
3. Dispatch **Release portfolio Worker** on main with the approved source SHA and exact current 100% version UUID. The workflow reruns browser tests, packages production bytes, checks the Worker locally, and asks the environment reviewer before publication. It uploads a version and checks active traffic again before deploying. The publish job refuses an unexpected active version or an outdated source revision.
4. Record the source SHA, module SHA-256, PDF SHA-256, uploaded version, deployment UUID, and prior version. Confirm the live smoke step passes. It compares public route bytes, revision and indexing headers, résumé content type, and redirect, caching and error behavior.

See [Cloudflare versions and deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/) and [multipart upload configuration](https://developers.cloudflare.com/workers/configuration/multipart-upload-metadata/).

### Roll back a Worker

Use the Cloudflare dashboard to roll back to the exact prior version at 100%, or run the command below from an authorized operator environment with the same Cloudflare secret names available and `WORKER_PUBLISH_ENABLED=true`. Supply the version currently receiving 100% and the recorded known-good version, in that order.

```sh
node portfolio/release/deploy-worker.mjs rollback "$CURRENT_VERSION" "$KNOWN_GOOD_VERSION"
```

Confirm the active deployment and public routes after rollback. For a version produced by this pipeline, build its Git revision into `portfolio/dist` and run `node portfolio/release/check-worker.mjs --live "$KNOWN_GOOD_SHA" production`. For the existing API version, check the homepage, routes, PDF hash, offline Relay download, and current version directly. After a timeout or failure, query the live version before retrying any write. [Cloudflare rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

## GitHub Pages compatibility

The verified Pages source is `gh-pages`, root directory. The Pages workflow builds an artifact on pull requests and main pushes. The published content changes only after a main dispatch approved in the `github-pages-compatibility` environment. Before the first dispatch, configure required reviewers and main-only deployment, then set `PAGES_COMPATIBILITY_PUBLISH_ENABLED=true` in that environment.

Record the previous `gh-pages` revision before publishing. Verify that the [legacy homepage](https://joshyorko.github.io/yorko-resume/) offers both destinations and [the existing PDF URL](https://joshyorko.github.io/yorko-resume/assets/JoshYorkoResume.pdf) returns PDF bytes identical to the portfolio download. If the branch advances but Pages does not build, use an owner-authenticated publication and verify the live result. To roll back, republish the recorded known-good tree to `gh-pages` as a new commit and check both URLs again. No Pages source or DNS change is needed.

## Legacy inventory and boundaries

- The Pages workflow now builds two public paths using static files and the approved Worker PDF source. The MkDocs PDF source entry is a symlink to that same file. Existing publications remain independently recoverable.
- Compose and Helm both reference the published `ghcr.io/joshyorko/yorko-resume:main` image. Public code search only found this repository, and it cannot establish whether private or running consumers exist. Retain MkDocs, its content and overrides, Python/Docker, manifests, Dagger, dependency files, and automatic Docker publication pending the owner’s consumer check. Existing image tags and releases are untouched.
- Removed the generated LaTeX auxiliary files, an unreferenced template build PDF, and a historical export ZIP with an older copy of the legacy TeX source. The legacy template source, fonts and license notices remain in Git.
- The SQL workspace, vendor SQL.js and its license remain at `/archive/sql-workspace/`. The browser suite tests the archived workspace and Parcel Relay. Historical work stays available in the [Machine Room archive](https://github.com/joshyorko/yorko-resume/tree/a535909574cb94b169040e05b54ae198fe77673a), [previous portfolio](https://github.com/joshyorko/yorko-resume/tree/18c2e2f8954b508108fd784eb56b06d57b92675e) and [PR #53](https://github.com/joshyorko/yorko-resume/pull/53). The [README](README.md) records the Wasm and model provenance.
