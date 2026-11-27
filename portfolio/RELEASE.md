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

Obtain any required environment approval at cutover. For the existing Worker, reuse its deployment identity and retain the previous version.

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

The legacy source is the root of gh-pages. For cutover, allow main in the existing github-pages deployment branch policy, switch the repository Pages source to GitHub Actions, retain the gh-pages branch, and dispatch **GitHub Pages compatibility** on main with the full reviewed revision. The workflow uses the existing github-pages environment and GitHub's short-lived Pages credentials. It verifies the public homepage and legacy PDF against the build. To revert the compatibility cutover, restore the Pages source to the retained gh-pages branch root and verify both URLs. GitHub Pages settings are separate from the Cloudflare Worker.

## Legacy inventory

The previous Compose and Helm configurations referenced the same legacy image. Public code search found references only in this repository. This does not establish the state of private hosts. The source and automatic image and timestamp release workflow were retired. Existing images, tags, releases, and deployment resources remain available. The last legacy source is the main tree at 94f5e6ffe0eb8c91b1bfec47710feeed3501ed16, including the legacy template notices.

The approved red Awesome-CV PDF is the canonical file at `portfolio/resume/JoshuaYorko-Resume.pdf`. Both public builds check its approved SHA-256. The red PDF preserves the wording and 15 links from T, which came from artifact 15145118815. [Résumé source and verification](resume/README.md#red-awesome-cv-review).

- The SQL workspace, vendor SQL.js and its license remain at `/archive/sql-workspace/`. The browser suite tests the archived workspace and Parcel Relay. Historical work stays available in the [Machine Room archive](https://github.com/joshyorko/yorko-resume/tree/a535909574cb94b169040e05b54ae198fe77673a), [previous portfolio](https://github.com/joshyorko/yorko-resume/tree/18c2e2f8954b508108fd784eb56b06d57b92675e) and [PR #53](https://github.com/joshyorko/yorko-resume/pull/53). The [README](README.md) records the Wasm and model provenance.
