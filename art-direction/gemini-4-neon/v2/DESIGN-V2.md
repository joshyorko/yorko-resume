# Revised art direction (v2): personal engineering home

Goal: revise the initial proposal (`223d0bd`, preserved untouched at `art-direction/gemini-4-neon/`) to serve Josh Yorko's deeper purpose: an authentic, useful engineering home centered on software systems, reproducible environments, portable agent tools, public evidence, and ongoing technical development rather than a hiring portfolio or invented design brand.

## Audit of v1 (`223d0bd`) against the supplemental brief

### Preserved from v1
- **Color tokens (`6` core + `1` state):** Matte carbon-graphite (`#101114`), elevated pewter (`#17191E`), warm alabaster (`#F2EFE9`), graphite stone (`#989790`), muted champagne-brass (`#D4B475`), quiet hairline (`#252830`), and `Copied` feedback (`#78BFA0`). High legibility on OLED mobile and desktop with zero olive cast, zero acid-green underlines, and zero loud orange buttons.
- **Typography:** `Bricolage Grotesque` for headings, `IBM Plex Sans` for body copy, and `IBM Plex Mono` strictly for commands, skill slugs, provenance cues, versions, and commit hashes.
- **First-class Plugins & Skills interior (`plugins.html`):** All 22 real skills pinned to `joshyorko/plugins@e24cd596ef41`, instant search, plugin filter chips, multi-client install tabs, compact `Copy $` trigger buttons, and honest boundary framing for `37signals`, `RCC`, `Fizzy`, and `Luna Factory`.

### Specific changes made in v2
1. **Removed invented branding and hiring-hero chrome.** Dropped the `Field Instrument` brand name, the boxed `JY` monogram SVG, the decorative corner registration ticks, and the bordered `Read résumé` hero CTA button. Plain `Josh Yorko` typography anchors the header.
2. **Centered the opening statement on software systems and deterministic agents.** Replaced generic portfolio wording with Josh's actual technical focus: assembling, distributing, executing, and operating software, and introducing coding agents without losing determinism, portability, provenance, or human control.
3. **De-overloaded the homepage.** Cut homepage length roughly in half by moving full career history, chronological project notes, and technology/upstream credits to `notes.html` while keeping a direct 1-click path to `Résumé` in the top navigation and closing bar.
4. **Distinguished fork, authorship, and upstream contributions explicitly.** Every entry in Selected Software now states its relationship to upstream (`maintained fork`, `authored`, `upstream PRs`, `authored, upstreamed`) with direct links to public tags, PRs, and attribution notices.
5. **Added return-visit destinations (`notes.html`).** Added a chronological, filterable **Field Notes** log built strictly from verified public releases, PRs, and experiments (plus one clearly labeled `[Draft outline]` slot), an **Influences & Credits** section properly crediting upstream authors and technologies without ghostwritten essays, and a clean **Résumé** section for recruiters.

## Information architecture (v2)

- **`v2/index.html` (Home):** Systems thesis, interactive Portable Agent Plugins bench (`joshyorko/plugins`), Selected Software (6 key projects with explicit provenance) + compact Systems index, return-visit pointers (`Field Notes`, `Influences`, optional `Agent Lab`), and a short recruiter shortcut to `Résumé`.
- **`v2/plugins.html` (Plugins & Skills):** Full 22-skill searchable catalog, 4-client install switcher (`Unix`, `PowerShell`, `Hermes`, `Fizzy CLI`), explicit upstream/opt-in/qualification boundaries, and Portable Agent Plugins 1.0.0 spec references.
- **`v2/notes.html` (Field Notes, Influences & Résumé):** Filterable public technical log (`All`, `Releases`, `Upstream`, `Experiments`, `Drafts`), factual upstream credits and technology index with clearly marked owner-editable draft outlines, and a concise public-safe résumé timeline.

## What is verified vs. what is not validated

- **Verified (`measured`):** Rendered `v2/index.html`, `v2/plugins.html`, and `v2/notes.html` in Chromium across `390x844`, `360x800`, and `1440x900` with zero console errors, zero horizontal overflow, loaded web fonts, working plugin tab switching, working skill search, and working Field Notes tag filtering. Hygiene scan confirmed zero personal email, phone numbers, private employer project names, or em dashes.
- **Not validated / awaiting owner review:**
  - Owner approval of visual direction (v1 vs. v2 vs. rival arena candidate) before any production implementation.
  - Owner-authored prose for the `[Draft outline]` entries in Field Notes and Influences (intentionally left as transparent outlines rather than ghostwritten personal essays or unverified dates).
  - Exact calendar dates for historical project entries if the owner wants a year-grouped timeline like `rhys.dev/projects`.
  - Whether `Systems`, `Agent Lab`, `Influences`, and `Résumé` should each become separate top-level routes in the production build or remain grouped as shown here.

## Disposable prototype status

All files under `art-direction/gemini-4-neon/v2/` are throwaway static review artifacts with no backend, remote inference, build scaffold, or production deployment changes. Initial v1 commit `223d0bd` and its screenshots remain intact in `art-direction/gemini-4-neon/`.
