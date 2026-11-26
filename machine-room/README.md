# Machine Room

Static design candidate for Josh Yorko. Six project installations share one Three.js hall. The public résumé, source evidence and project pages are HTML. The preview includes noindex metadata and an X-Robots-Tag header for compatible hosts.

## Run and verify

Use Node 22+ and the project-local dependencies. From this directory run:

```sh
npm ci --ignore-scripts
npm run build
python3 -m http.server 4175 --bind 127.0.0.1 --directory dist
```

In another shell, from the same directory, run `npm run verify`. Set CHROME_PATH for a different Chrome executable. PREVIEW_URL can point the checks at another build. The verifier writes 1440×900 and 390×844 screenshots and exercises geometry, keyboard focus, touch, four policy refusals, SQLite evidence lookup, cache reuse, persisted crash recovery, versioned files, digest mismatch, JavaScript-disabled pages, WebGL failure and WASM download failure. Run `node capture.mjs` for the camera recording, renderer sample and static fallback photographs, then rebuild to include updated photographs.

## Extend

Edit profile.mjs for the role, claim, evidence, scenario, receipt and relationships. build.mjs generates station pages, résumé, directory and portable JSON from it. Add a bay and geometry in src/scene.mjs and a scoped experiment in src/experiments.mjs. policy.mjs emits the small WebAssembly decision function. The host owns navigation. Each inspector owns its input and receipt. Retained local state is limited to the synthetic Actions job. No real deployments, credentials, agent inference or live production data are involved in the experiments.

## Qualification

Proof files contain captured browser results and screenshots. Browser runs use Chrome with ANGLE SwiftShader. Frame samples cover a single recorded transition, including recorder and scheduling cost. Browser touch emulation and reduced motion were exercised. Physical phone GPU, human screen-reader review were not qualified. The static build loads WebGL when the visitor chooses Explore in 3D and loads SQLite on query. The renderer stops scheduling frames after the transition. Offline preparation uses a scoped service worker. WebGPU is unused.

The first geometry study looked like models under uniform beige lighting. Independent visual review prompted directional architectural shadows, a lower central aisle view and matching bay signs. Atlas remains faster to scan for project connections. The room devotes more space to six systems the visitor can exercise. At phone width the first view deliberately crops the distant bays; all six are in the index.

PStack 0.15.48: poteto-mode/worker.md, poteto-mode/SKILL.md, prototype playbook, architect, experience-first, exhaust-the-design-space, model-the-domain, build-the-lever and prove-it-works. The T3 preview and local Chrome mapped the control-UI requirement. Astra implemented the prototype and an independent Codex reviewer examined the initial rendered frame.

## Isolated static preview contract

Publish only the contents of dist/ as the root of a fresh static-only preview. No Functions, bindings, analytics, custom domains, DNS, or production routing. Preserve relative asset paths, serve WebAssembly as application/wasm, honor _headers and robots.txt. Never replace an existing Worker or Pages project. Verify external page, header, WASM and geometry after upload. The résumé repository's existing main and site stay separate from this candidate.

## Offline qualification and preview transfer

Use Prepare offline on the home page while connected. The scoped service worker downloads the build manifest, verifies each SHA-256 digest, and caches only that version. External source links need a connection. If a replacement is waiting, close all preview tabs and reopen. Clearing this origin's site data removes the registration and the copy. After an update, clear site data and reconnect to switch immediately. The runtime inspector reports Resource Timing entries, controller identity and recent execution receipts. Transfer sizes are browser-reported and can be zero for cached resources.

With the loopback server running, set PREVIEW_URL to its root URL including the trailing slash and run `node verify-offline.mjs`. See proof/offline.json. The explicit renderer and WASM actions are covered by the browser checks. decision.mjs implements the deterministic exact-ID backend for decision.d.ts. No model inference is wired.

The checkout includes a self-contained deployment archive at machine-room/preview/machine-room-static.zip. Extract it into an empty directory; it contains wrangler.jsonc and dist/. Use an already authorized Workers deployment client. Check that the configured preview name is unused before first publication. Deploy as Workers Static Assets with no main module, bindings, custom domains or routes. With an authorized Wrangler CLI in the extracted directory, use `wrangler deploy --config wrangler.jsonc`. Verify the returned workers.dev URL externally, the crawlable robots.txt, noindex headers and offline reload before sharing it as a phone preview.

## Mobile instrument revision

Explore uses a render of the actual hall until the visitor starts WebGL. Test the Airlock opens the workbench directly. Use the station selector to change experiments and Evidence to search all public projects. The portal keeps the public JSON, HTML project records and résumé available without JavaScript.

Actions exposes the Actions Core-generated schema and runs the bounded manifest checker in WASM. MemoryD inspects one synthetic archive and exports the tab's chronological receipts as JSON. Both also retain their previous local experiments. Native references and limits are linked in each workbench. Routing remains deterministic.

Browser captures in proof/before and proof/after cover 360, 390, 411, 1440 and landscape widths. Independent review prompted a dedicated Airlock camera for phones, station access above offline setup, and a selection cue when WebGL starts. proof/checks.json includes input-to-focus timings from automation. proof/frame-sample.json samples a single software-rendered desktop transition with recording overhead. proof/offline.json covers disconnected WASM, SQLite, fixture inspection and session export.
