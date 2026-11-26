# LaTeX résumé review

[content.json](content.json) supplies the approved text and links to the HTML page and LaTeX candidates. The HTML renderer produces identical markup to PR #53. The current approved public PDF stays at [JoshuaYorko-Resume.pdf](JoshuaYorko-Resume.pdf). Approval of a candidate is a separate publication decision.

## Review choices

| Candidate | Typography | Review notes |
| --- | --- | --- |
| Editorial | TeX Gyre Pagella with dark green rules | Broad, readable serif letterforms and clear section breaks. |
| Modern | TeX Gyre Heros with blue headings | Familiar sans-serif, clear section spacing and the lightest use of rules. Recommended. |
| Classic | TeX Gyre Termes with charcoal rules | The most traditional treatment, with narrower letterforms and a centered masthead. |

All three use a single US Letter page, clickable descriptive evidence links, and the same approved text. TeX Gyre fonts come from the pinned bundle and are distributed under the GUST Font License. [TeX Gyre font project](https://www.gust.org.pl/projects/e-foundry/tex-gyre).

The implementation uses a small custom LaTeX template. Awesome-CV provides a current LuaLaTeX and latexmk reference, with additional class and font dependencies. sb2nov is a useful example of compact résumé hierarchy. Milanovic-Resume and lucidcv demonstrate tagged PDF and extraction tests. This Tectonic/XeLaTeX build provides a selectable text layer and tested reading order. The candidates are untagged and PDF/UA compliance is unverified. [Awesome-CV](https://github.com/posquit0/Awesome-CV) · [sb2nov](https://github.com/sb2nov/resume) · [Milanovic-Resume](https://github.com/milanm/Milanovic-Resume) · [lucidcv](https://github.com/xGoldy/lucidcv).

## Build and verify

Use the checksum-verified Linux x86-64 Tectonic 0.17.0 binary from [the candidate workflow](../../.github/workflows/resume-candidates.yml), Node 22, Poppler, and a scratch Python environment with `pypdf==6.4.2` and `pdfminer.six==20250506`. Tectonic uses bundle v33 and may fetch resources on its first run. It uses a fixed source date.

```sh
out=/absolute/path/to/resume-review
TECTONIC=/absolute/path/to/tectonic node portfolio/resume/candidates.mjs "$out"
python portfolio/resume/verify-candidates.py "$out"
for variant in editorial modern classic; do
  pdftoppm -singlefile -r 120 -png "$out/$variant.pdf" "$out/$variant"
done
```

CI uploads the three PDFs, corresponding PNGs, render log and verification report as `resume-review-only`. Checks cover US Letter size, one page, metadata, Unicode font embedding, ordered text blocks in Poppler and pdfminer, all 21 OSS and three existing contact URIs, and text and annotation bounds. Extractor checks establish text-layer behavior in those tools. PDF SHA-256 values are part of the report. If hashes differ across environments, rerun the semantic verifications and inspect the page render before approving a candidate.

After owner approval, verify the selected build, update the single approved PDF source in a reviewed commit, and rebuild both public targets from that commit. The legacy Pages path uses a copy made at build time. The retained MkDocs path resolves to the same source.
