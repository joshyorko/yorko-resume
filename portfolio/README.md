# Josh Yorko’s site

```sh
cd portfolio
node build.mjs
python3 -m http.server --bind 127.0.0.1 --directory dist 8791
```

Open http://127.0.0.1:8791/ for the local candidate. The build needs Node 22 or newer. Its output is static. The simple server is for browsing. The verifier applies the generated headers and 404 page.

## Portfolio and résumé

The C-hybrid home pairs Josh’s path from nursing assistant to backend and AI engineering with an entry to Parcel Relay. The portfolio has the full story, work, open-source projects, plugin and skill catalog, open questions, and notes.

Text marked **Draft** is first-person copy awaiting Josh’s approval. The career path came from Josh on 2026-11-26. Project facts link to releases, merged pull requests and repositories.

The résumé page uses [structured content](resume/content.json) from the approved Working Résumé design `DAHb9y11dDU`. The approved PDF was reconstructed from Canva’s saved text. The portfolio, GitHub Pages compatibility build, and retained MkDocs site use that one PDF. The [LaTeX candidates](resume/README.md) use the same structured copy and are review artifacts.

The catalog is pinned to [e24cd59](https://github.com/joshyorko/plugins/commit/e24cd596ef41e9294ad770d2b613bf77b42a8a68). Refresh with `python3 snapshot-catalog.py /path/to/plugins > data/catalog.json`.

## Parcel Relay

Open `/computer/` or download `dist/computer/parcel-relay.html` and open it directly from disk. Pick a dispatch incident, then run or step through the repair. The initial replay records what the simulator actually delivered. The repair agent ranks three allowlisted changes with its embedded CPU WASM model. The verifier tests a proposed change against the original incident and four additional fixtures before committing it to the simulation. Missing addresses require a human correction.

The single file includes all code, styles, weights, and license. The app uses no browser storage. **Save runnable HTML** downloads the app with its incident and step count. Opening a saved file recomputes receipts to that step and measures their timing again. A snapshot cannot supply its own commands, patches, or receipts. The simulation models delivery behavior in memory.

The former SQL workspace runs at `/archive/sql-workspace/` with its original import, querying, and SQLite restore tools. The [Machine Room archive](https://github.com/joshyorko/yorko-resume/tree/a535909574cb94b169040e05b54ae198fe77673a/machine-room) retains its own artifacts and checks.

### Model provenance

- The [118-byte WASM kernel](relay/decision.wasm) is byte-identical to Terra’s decision lab, SHA-256 `019618f3b197e49d21a2427e2cd07ed6033f87d558aa1cd819866d13ea2f2921`. The lab’s original rule-gated classifier matched 30 of 35 synthetic cases versus 31 for the rule. This demo reuses the arithmetic kernel and trains new Bernoulli Naive Bayes weights on 18 dispatch notes in [model.mjs](relay/model.mjs). [MIT license](relay/LICENSE).
- Sol’s native Actions/MemoryD portability work informs the bounded tool contract and explicit receipts. Parcel Relay supplies its own synthetic dispatch tools and replay state. The native-schema `inspect_manifest` and pinned MemoryD fixture remain in Sol’s Machine Room portability handoff.
- [Blink](https://github.com/sqliteai/blink) reports 452 KiB of synthetic weights and Apache-2.0 terms. The earlier connector trial could read the notices and binary metadata but could not retrieve the weight binary. [Jev-web](https://github.com/warsang/jev-web) runs several decision model families whose weights have separate terms. Neither supplies the model in this demo.
- The prepared [SmolLM2-135M-Instruct Q4_0](https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/tree/main) is an Apache-2.0 generative option. Its 91,893,088 bytes alone take about 117 MiB in an ordinary base64 HTML embedding, with SHA-256 `bcc3af2849ad6095af57e9b5cd43775256efdc66e306acb529172f92d0c04b03`. The prepared [Julia-1](https://huggingface.co/SupersonicLabs/Julia-1) Q8_0 is a decision model. Its 168,166,400 bytes take about 214 MiB under the same encoding, with SHA-256 `ff6cbbe856f1810a8b171528ea908d3b43b5742e73f0698689467559078f347d`. The existing wllama WASM is 10,838,652 bytes before embedding. The size figures use local files. These models were screened by size and were not browser-qualified here.
- [Stories260K](https://huggingface.co/karpathy/tinyllamas/tree/main/stories260K) is a materially smaller MIT generative option. Its [training notes](https://github.com/karpathy/llama2.c/blob/master/doc/stories260K.md) describe a test checkpoint trained to complete TinyStories, so repair selection and instruction following would need their own evidence. It was not downloaded or run in this pass.

## Verify

```sh
cd portfolio
npm run verify
```

Use `npm ci` to prepare the pinned browser test dependencies in a fresh checkout. Set `CHROME` if Chrome is outside `/usr/bin/google-chrome`. Set `PROOF_DIR` to an absolute scratch path for captures and browser results. Tests cover static routes, the résumé download, five viewport widths, axe-core, keyboard and catalog search, and the archived SQL workspace.

The Parcel Relay browser cases use Chrome DevTools offline mode before opening the file. They cover the three repaired incidents, human handoff, stop, reset, save, fresh reopen, reload, malformed snapshot, and a wrong repair that the verifier rejects. The trace records document requests, initialization time, work per step, JS heap, and WASM linear memory. Step timings exclude the visual pause between steps.

## Release and rollback

See the [release runbook](RELEASE.md) for the Worker and GitHub Pages procedures.
