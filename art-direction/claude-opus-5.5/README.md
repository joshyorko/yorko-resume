# Trigger index: an art direction for joshyorko's site

> **Revision 2** (owner's supplemental direction) is in [`v2/`](v2/). It reframes the site as an engineering home, not a portfolio. Round 1 below is kept unchanged as evidence at commit `e23d33f`, with its files in `prototype/` and `screens/`.

Candidate from claude-opus-5.5 in the PStack Arena, dated 2026-11-25. This is a throwaway design prototype for the operator to judge. It is not production code and has no visual approval.

## The idea

Every one of Josh's published skills opens with the job it's for: "Use when…". A coding agent reads that line to decide when to load the skill. This direction makes that grammar the site's identity. The homepage opens with a plain statement of what Josh builds, then an index that starts with "I need to…". Each row names a real job, such as "reproduce an automation environment", and points to the tool that does it, with its pinned version (`rcc v18.19.11`).

The voice (the job) is set in a serif italic. The machine (the tool name and version) is set in mono. Every entry on the site uses that pairing. It is the one thing a visitor should remember.

## Why the two rejected designs failed

The premise both designs shared was that the identity lives in a wrapper around the work. One wrapper was a 3D place and the other was a neutral section index, and in both the work is only a link destination. I checked that premise against both 390 px screenshots:

- Warehouse: six tool names, each with an invented metaphor ("Foundry", "Airlock") in place of a description. No skills. Two orange calls to action pull attention toward the 3D view.
- Directory: five section names, three tool names, and zero skills. Every link is underlined green and every block is ruled off, so nothing stands out and nothing says who Josh is.

This direction drops the wrapper. At 390 px the first screen gives his role, the résumé, and four real tools with versions. At 1440 px it also shows the first plugin with its skill names. Changing the palette would not have fixed either design.

## Tokens

| Name | Hex | Role |
|---|---|---|
| Ink | `#14121a` | Page. A violet-tinted near-black rather than olive or neutral grey |
| Slate | `#1e1b27` | The one raised surface, the plugin shelf, plus the inputs |
| Bone | `#eee8de` | Primary text and the primary button |
| Haze | `#9a92a8` | Secondary text, version pins, quiet "Use when" on the interior |
| Iris | `#aeb5ff` | The voice: "I need to…", the thesis phrase, the `$` sigil, focus rings |
| Line | `#2c2837` | Outline buttons and chips only. Lists use no rules |

Iris is a soft periwinkle. It stays clear of the acid green from the directory, the orange from the warehouse, and the cream-and-terracotta look common in generated designs.

## Type

- **Familjen Grotesk** (display and body, 19 KB variable). A warm Swedish grotesk with a distinctive `j`, `g` and `y`. It gives the name and thesis personality at 46 px and stays compact at 16 px. Bricolage Grotesque lost in a side-by-side render (`?type=bricolage`). It came out wider and blander at body size, it weighs 77 KB, and it has become a stock choice.
- **Newsreader Italic** (the voice). Each "job" phrase reads like handwriting next to the code. The opsz axis keeps it crisp at 19–28 px on a dark page. It's 147 KB as a variable file, so production should ship a static subset.
- **Spline Sans Mono** (identifiers and pins). Rounder and friendlier than JetBrains Mono or IBM Plex Mono, which helps it sit next to the italic.

Scale (mobile → desktop): thesis 31→46/1.1, need rows 21→23, section 25→30, plugin name 20, body 16.5→17, mono 12.5–14. Spacing steps are 4, 8, 12, 16, 24, 32, 48, 72 and 112.

## Hierarchy

1. A wordmark: an iris italic `jy` monogram next to the name. It's a small personal mark that a single `jy` favicon could reuse.
2. A one-sentence thesis built from real work (RCC, Josh Room, MemoryD and the bootc images are all about reproducibility), then role, employer and maintainer status. **Read the résumé** is the only filled button.
3. **I need to…**, the signature index. It holds eight jobs with their tools, ending in "see who built all this → résumé".
4. **Agent plugins and skills**, the one raised slate shelf. It has a real copyable install command and four plugins. Each plugin has a "Use when…" line, an honest note (for example "Community-made… Not official" and "Opt-in, and nothing on this site runs on it"), and its skills as inline `$skill` words.
5. Selected work, Systems, then three plain doors: Agent Lab, Engineering notes and Résumé.

The interior page, Plugins and skills, keeps the same system. The search label asks "What are you working on?". Results filter live with highlights, and on desktop the plugin chips and install command sit in a sticky side column. Each `$name` links to its SKILL.md at the pinned commit. "Use when" drops to Haze there, so 22 rows don't repeat the accent.

## Refinement pass (from my own screenshots)

| Flaw seen in pass 1 | Change |
|---|---|
| A hairline rule between every skill and plugin, repeating the rejected directory | Removed. Spacing and the mono name carry each row |
| "SKILL.md ↗" repeated on all 22 rows | The `$name` itself is the link |
| Skill chips wrapped one per line on mobile, like a pile of pills | Inline mono words with a `$` sigil |
| On desktop, need rows wrapped to two lines and left a dead area under the hero | Rebalanced columns (0.85 / 1.15) and 23 px rows. Each row is one line and the shelf peeks above the fold |
| The italic thesis phrase split across lines at 1440 | The phrase never wraps, so "the same way twice," gets its own line |
| On the interior, the install box was invisible and the first skill sat at about 770 px on mobile | Install moves below the list on mobile, and the box uses the slate surface |
| Plugin chips were clipped on desktop | They wrap |
| 22 iris "Use when" labels on the interior | Haze on the interior. Iris stays the homepage voice |

## Alternatives considered and rejected

- **Shelf first** (`?v=shelf`): plugins directly under the thesis. Even then, no skill name made the first 390 px screen, and the page lost the personal "I need to…" voice. Rejected.
- **Terminal or brew-tap aesthetic**: a near-black page with green mono. That is the default dev look and repeats the directory's palette.
- **Strata or OCI layers**: a bootc-inspired stack of bands. It's another metaphor wrapped around the work, the same premise that sank the warehouse.
- **Bricolage display**: covered under Type.

## What the operator should decide

- The direction as a whole, before any production code.
- Whether to name the employer on the homepage. The text comes from the public résumé source, but Josh may prefer to keep it to the résumé.
- The thesis line "runs the same way twice". It is my wording, drawn from RCC, Josh Room and the bootc images, and it is not a quote.

## Not in scope

Agent Lab and Engineering notes link to `#lab` and `#notes` and are not built. The résumé links to the public PDF at commit `6314818`. There are no metrics, adoption claims, private work details, endpoints or emails.

## Files

- `prototype/index.html`: homepage. Variant query strings `?v=shelf` and `?type=bricolage`
- `prototype/skills.html`: Plugins and skills interior, generated from `catalog.json` by `render.sh`
- `prototype/skills.tmpl.html`, `prototype/site.css`, `prototype/catalog.json` (the public catalog, pinned to plugins@e24cd59)
- `prototype/render.sh`: rebuilds `skills.html` and captures every screenshot with headless Chrome, sandbox on
- `prototype/fonts/`: OFL 1.1 fonts with `OFL.txt`
- `screens/`: `home-390`, `home-360`, `home-1440`, `skills-390`, `skills-390-search`, `skills-1440`, the two variants, full-length mobile captures, and `compare-390.png` (both rejected designs beside this one)

To reproduce, run `cd prototype && ./render.sh`. Then open `prototype/index.html` straight from disk. No server, network or build step is needed.

## Sources read

PStack 0.15.48 (`poteto-mode` and its `worker.md`, `arena`, `principle-experience-first`, `principle-exhaust-the-design-space`, `principle-attack-the-premise`, `playbooks/prototype.md`). Anthropic's public `frontend-design` SKILL.md, read as guidance; no text is reproduced. Josh's `37signals-product-design` and `37signals-scope-judgment`. t3.gg and davis7.sh, both live and from source. Both rejected designs at 390 and 1440. `portfolio/data/catalog.json` and `work.mjs` at `6314818`, and the joshyorko/plugins README and Luna Factory README.

The reference sites suggested three things: lead with resources, keep one personal mark, and add almost no chrome. Nothing from their branding, layout or assets is used.

---

## Revision 2: provenance, field notes, influences

### Evaluation of round 1 against the new goal
Kept, because it already serves "useful engineering destination":
- **The "I need to…" index.** It starts from the visitor's job and ends at real software. That is the subject, systems, not frontend.
- **The plugin shelf and the searchable skills interior.** Skills stay first-class.
- **The calm native-dark tokens** and the three-face type system. No change to palette or fonts.

Wrong for the new goal:
- **The thesis was invented flourish.** "Runs the same way twice" was my line, not Josh's.
- **The framing was a hiring portfolio.** An employer line, a filled résumé button, and a "see who built all this" row.
- **Nothing said whose each thing was.** For someone whose work is provenance, that is the main gap.
- **Nothing dated.** Engineers had no reason to come back.
- **The homepage carried everything.** Work, Systems and Elsewhere were all on it.

### What changed
1. **Provenance is now the signature.** Each row reads *job → tool ← relation*. The relations are *continues robocorp/rcc*, *fork of actions-sema4ai*, *built on Project Bluefin*, *wraps basecamp/fizzy-cli*, *community-made* and *mine*. The site practises what the work is about: you can see where each thing came from.
2. **A stricter type grammar.**
   - Italic serif is a human job or relation.
   - Mono is an artifact you can fetch.
   - Sans is for names and prose.
3. **A smaller, plain statement.** It is built from the owner's own words, with no employer and no hero CTA. The résumé is a plain link and stays in the nav, so the recruiter path is still one tap.
4. **A slimmer homepage.** It holds the statement, the index, the skills shelf, three latest field notes, and one "Everything else" list. Work and Systems move off the homepage into Software and Systems pages.
5. **Field Notes (new interior).** It is a chronological log built only from public GitHub releases, merges and repo-creation dates, fetched 2026-11-25.
   - Each entry has a kind (*release*, *merged*, *upstream*, *new repo*) and an evidence link.
   - Kind filters show counts.
   - Year markers are set in the italic voice.
   - One entry is a clearly labelled **"Outline for Josh to write · draft · not published"**. Nothing is ghostwritten.
6. **Influences (new interior).**
   - **People** come from Josh's own list. Each gets a factual one-liner and, only where a public repo shows it, *shows up in* links.
   - **Built on** credits the upstream projects (Robocorp RCC, Robot Framework, Bluefin, bootc, Omarchy, fizzy-cli, Hauler, Devsy).
   - A draft box says the "why" for each person is Josh's to write.

### How a visitor benefits
- **Recruiter:** reads what Josh works on in one sentence, then taps Résumé (nav or the first link).
- **Engineer:** finds a tool by job, sees at a glance whether it is Josh's, a fork or a continuation, and copies the install command. They come back to Field Notes for what shipped.
- **Upstream maintainers:** get visible credit instead of a lineage buried in READMEs.

### Not validated
- **The statement wording** is a draft from Josh's brief, marked in the HTML source. He must confirm it.
- **"Juha"** has no surname here because I could not verify one.
- **The Hemingway, ThePrimeagen and Fireship descriptors** paraphrase the owner's brief. They have no "shows up in" link because no public repo shows one.
- **Field Notes dates** are GitHub event dates. "New repo" is not a project start date, and the page says so.
- **Not built:** the Software, Systems and Agent Lab pages, the 2024 notes year, and any real write-up. Index links to those pages are placeholders.
- **Not tested:** real devices, screen readers, and contrast measurement. All captures come from headless Chrome.

### Files (revision 2)
- `v2/prototype/`
  - `index.html`: home
  - `notes.html`: Field Notes
  - `influences.html`
  - `skills.tmpl.html` → `skills.html`
  - `site.css`
  - `render.sh`
  - Fonts load from `../../prototype/fonts/`.
- `v2/screens/`
  - `home-390`, `home-360`, `home-1440`, `home-390-full`
  - `notes-390`, `notes-1440`, `notes-390-upstream` (filter on), `notes-390-full`
  - `influences-390`, `influences-390-full`
  - `skills-390`
- Refinement pass, from my own captures:
  - The italic phrase made the thesis line spacing uneven.
  - The thesis was still hero-sized on desktop.
  - The "New repo" note collided with the 2026 year marker.
  - The plugin provenance lines wrapped badly.
  - Section headings on the Influences page sat too tight against the first entry.
