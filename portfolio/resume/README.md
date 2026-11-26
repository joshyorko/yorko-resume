# LaTeX résumé review

[content.json](content.json) supplies the approved text and links to the HTML page and LaTeX candidates. The HTML renderer produces identical markup to PR #53. The current approved public PDF stays at [JoshuaYorko-Resume.pdf](JoshuaYorko-Resume.pdf). Approval of a candidate is a separate publication decision.

## Review choices

Review the final hybrid in H.pdf. A, B and C remain available as earlier design evidence. See [the design comparison](DESIGN-REVIEW.md) for typography, fit and tradeoffs.

All three use a single US Letter page, clickable descriptive evidence links, and the same approved text. TeX Gyre fonts come from the pinned bundle and are distributed under the GUST Font License. [TeX Gyre font project](https://www.gust.org.pl/projects/e-foundry/tex-gyre).

The implementation uses a small custom LaTeX template. Awesome-CV provides a current LuaLaTeX and latexmk reference, with additional class and font dependencies. sb2nov is a useful example of compact résumé hierarchy. Milanovic-Resume and lucidcv demonstrate tagged PDF and extraction tests. This Tectonic/XeLaTeX build provides a selectable text layer and tested reading order. The candidates are untagged and PDF/UA compliance is unverified. [Awesome-CV](https://github.com/posquit0/Awesome-CV) · [sb2nov](https://github.com/sb2nov/resume) · [Milanovic-Resume](https://github.com/milanm/Milanovic-Resume) · [lucidcv](https://github.com/xGoldy/lucidcv).

## Build and verify

Use the checksum-verified Linux x86-64 Tectonic 0.17.0 binary from [the candidate workflow](../../.github/workflows/resume-candidates.yml), Node 22, Poppler, and a scratch Python environment with `pypdf==6.4.2`, `pdfminer.six==20250506`, and `Pillow==12.2.0`. Tectonic uses bundle v33 and may fetch resources on its first run. It uses a fixed source date.

```sh
out=/absolute/path/to/resume-review
TECTONIC=/absolute/path/to/tectonic node portfolio/resume/candidates.mjs "$out"
python portfolio/resume/verify-candidates.py "$out"
python portfolio/resume/render-review.py "$out"
```

CI uploads the final PDF and three earlier candidates, 150 dpi color and grayscale PNGs, side-by-side sheet, critique, render log and verification report as `resume-review-only`. Checks cover US Letter size, one page, metadata, Unicode font embedding, ordered text blocks in Poppler and pdfminer, all 21 OSS and three existing contact URIs, and text and annotation bounds. Extractor checks establish text-layer behavior in those tools. PDF SHA-256 values are part of the report. If hashes differ across environments, rerun the semantic verifications and inspect the page render before approving a candidate.

After owner approval, verify the selected build, update the single approved PDF source in a reviewed commit, and rebuild both public targets from that commit. The legacy Pages path uses a copy made at build time. The retained MkDocs path resolves to the same source.

## Review-stage content

R applies the summary and named projects in [review-content.json](review-content.json) to the approved [content.json](content.json). A through H and the public HTML use the approved base. After owner approval, incorporate the staged summary and entries into the shared content and adapt the HTML renderer to the new named entries. Regenerate and verify the selected PDF before replacing the single public source. Promotion is a separate change.

S is the current review-only candidate. Its project wording is in `clean-projects.json` and its additional destinations are in `clean-links.json`. Approving S requires a separate promotion of the review copy into the shared public content and a verified PDF replacement.

The current application candidate is T.pdf. See [hiring and evidence notes](HIRING-REVIEW.md).

## Approved public copy

The canonical download is the exact T.pdf from artifact 15145118815. The build checks its approved digest. The website uses platform-review.json for the headline, summary and project text, alongside the existing employment and contact data. Keep the approved bytes from the artifact for publication. Candidate regeneration is for review; the earlier A through S renders remain historical.
