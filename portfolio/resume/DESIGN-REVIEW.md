# Résumé design review

Review A, B and C at actual size in the PDFs. The contact sheet includes color and grayscale. Grayscale is a raster proof, with physical printer behavior left unverified. The approved Canva thumbnail and existing public PDF supplied the visual baseline.

| Candidate | Composition | Body / leading | Links | Bottom text margin |
| --- | --- | --- | --- | --- |
| A | Chronological, mixed serif and sans. Current work grouped into QA and integration, then healthcare systems. | 11.2 / 13 pt | 9.8 pt | 0.48 in |
| B | Asymmetric editorial grid, indented introduction and current-role prose, serif masthead and margin section markers. | 10.8 / 12.4 pt | 9.8 pt | 0.38 in |
| C | Evidence-first. Hive and Bluefin precede Experience, and the other three projects follow it. | 10.8 / 12.03 pt | 9.8 pt | 0.50 in |

## Design judgment

- **A** has the clearest chronological reading path. It surfaces the distributed QA platform and related testing work immediately. Hive adoption and Bluefin still fall into the lower half of the page.
- **B** has the most deliberate typographic character. The prose creates long stretches of similar visual weight, and its lower edge is the tightest. It takes more effort to recall the central engineering accomplishment on a quick scan.
- **C** puts the adopted Hive RFCs, 58 merged Bluefin PRs, and Gainwell platform high enough to scan together. Giving the two lead projects their own heading lines creates a visible pause between claim and evidence. The smaller projects remain adjacent to their own proof links. Underlining supports link discovery in monochrome. C still has a dense Gainwell run, and readers expecting chronology will encounter two projects first.

The first visual review found that C delayed the paid work with five uninterrupted project entries. The revision moved three below Experience. A was revised to group the seven bullets by subject. B traded a symmetrical ruled template for an offset reading grid and retained the original statement order. The alternatives keep the wording and employment dates. A groups related statements without implying a new timeline. C changes emphasis by moving two projects and placing the QA platform first within the existing role. The prior Gainwell and Lambent dates overlap in the approved material. Confirm them with the owner before release.

The layouts use restrained emphasis, typographic hierarchy, and link underlines rather than icons. The full-width measure keeps one-page layouts feasible with all approved copy. Longer lines and smaller supporting text remain a tradeoff. [Butterick’s résumé guidance](https://practicaltypography.com/resumes.html) · [Practical Typography key rules](https://practicaltypography.com/summary-of-key-rules.html).

## Independent render critique

The blind review rated the revised compositions C 8/10, A 7/10 and B 6/10. C led on evidence discovery. A's grouping made the work history easiest to navigate, but its overall silhouette remained conventional. B's prose made it the hardest to skim. The final visual recheck recommended C for owner review after the summary, Gainwell lead and skills adjustments. The short rule beside the lead is slightly detached from its bottom line, and the approved baseline remains stronger on aligned date placement.

## Final hybrid

H combines C’s evidence-first typography with A’s two current-role groups. A single open-source section places the two strongest projects first, with each evidence row directly below the claim it supports. All five projects precede Experience, so employment starts lower than in C. The current role leads with distributed QA, followed by healthcare systems. Each employer, job title and right-aligned date shares one row. The lead rule is gone.

The hybrid uses 10.8 pt body type, 12.8 pt leading and 9.8 pt evidence links. The bottom text margin is 0.43 in. The A/C/H contact sheet includes color and grayscale. A, B and C retain their earlier PDF bytes.

The hybrid’s PDF content stream reads in order in Poppler raw mode, and the visible rows read in order in pypdf layout mode and row-configured pdfminer. Default geometric extraction can detach the right-aligned dates. The document is untagged.

## Owner-requested content revision

R keeps the hybrid’s layout and groups the two original tools at the top, followed by the RCC and Actions continuations and the existing upstream evidence. The project names are the clickable labels. The summary distinguishes building and maintaining tools from upstream code, test and architecture contributions. Body and links retain H’s point sizes. R fits on one Letter page with a measured 0.52 in bottom text margin. It carries 26 unique link targets.

## Experience-first revision

S gives employment and skills the first page and open-source engineering the second. It keeps the approved work history and builder/maintainer/contributor summary. Original tools and maintained continuations appear before upstream work. Proof links sit inside the sentences they support. R is retained byte-for-byte as historical evidence, including its former abbreviation.

S preserves the 26 previous targets and adds five public destinations: Codex MemoryD, Agent Plugins & Skills, the RCC plugin, Review and Devsy Harvester attribution. The second page avoids compressing the expanded project selection into the employment history. The independent first-render review preferred this structure to R and identified the Linux descriptions, attribution and skills wrapping as the remaining polish items.
