# Art direction proposal: Field Instrument

Goal: establish one distinctive, dark-native visual identity for Josh Yorko's personal engineering site that makes Agent Plugins and Skills first-class, gives recruiters a fast path to selected work and résumé context, and breaks cleanly from both rejected designs.

## Premise attack

Both rejected candidates failed the visual taste bar because they shared one hidden premise: a personal engineering site must pick either theatrical spectacle (a giant 3D warehouse with bright orange buttons hiding the work) or austere bare-HTML restraint (a drab olive directory of uniform acid-green underlined links separated by repetitive horizontal rules).

Inspecting `t3.gg` and `davis7.sh` shows that neither extreme is necessary. Both sites earn trust through spatial composure, crisp typography, and immediate utility. Josh's site has a harder two-audience job than either reference: engineers arrive looking for reusable plugins, skills, and reproducible runtimes, while recruiters need to grasp his background and shipped systems in seconds without decoding jargon.

The chosen direction, **Field Instrument**, replaces both spectacle and austerity with one tactile machined instrument plate on an otherwise quiet matte carbon canvas.

## Alternatives considered and rejected

1. **Monochrome terminal column (`t3.gg`-adjacent).** Pure black canvas with a narrow centered monospace list. Rejected because bare link labels hide what Josh builds from recruiters and flatten a 22-skill plugin catalog into a single link.
2. **Warm editorial broadsheet.** Espresso background, high-contrast display serif, terracotta accent, and hairline section dividers. Rejected because it repeats common AI-generated editorial defaults and drifts too close to the rejected Sol directory's drab literary feel.
3. **GitHub/Linear cool-blue slate.** `#0D1117` with `#58A6FF` accents. Rejected during self-review because it reads like generic developer documentation rather than a personal identity.

## Visual system tokens

### Color palette (6 core tokens)

| Token | Hex | Role |
| --- | --- | --- |
| `--canvas` | `#101114` | Matte carbon-graphite page ground. Neutral-cool dark with zero olive cast. |
| `--plate` | `#17191E` | Machined pewter surface reserved for the focal Plugin Bench, install strip, and recessed inputs. |
| `--ink` | `#F2EFE9` | Warm alabaster for primary headings, body text, and high-contrast actions (~16.4:1 on `--canvas`). |
| `--ink-muted` | `#989790` | Warm graphite stone for descriptions, dates, and secondary links (~6.4:1 on `--canvas`). |
| `--accent` | `#D4B475` | Burnished champagne-brass for active tab edges, subtle focus/hover cues, and the monogram node (~9.8:1 on `--canvas`). Never used for giant filled buttons or underlined link rows. |
| `--line` | `#252830` | Quiet structural border used only on the focal instrument plate and outer chrome, never repeated between list rows. |

One additional semantic feedback token, `--ok` (`#78BFA0`), appears only for transient `Copied` state confirmation.

### Typography and scale

- **Display headings (`Bricolage Grotesque`, weights 500–700):** Humanist grotesque with subtle inktrap geometry and tight tracking (`-0.035em` on H1). Distinct from generic `Inter`, `Geist`, `Roboto`, and default `system-ui` while remaining sharp at 360px–390px mobile widths.
- **Body and UI (`IBM Plex Sans`, weights 400–600):** Engineered readability at `15.2px` (`0.95rem`) with `1.6` line-height and measure capped under 64 characters.
- **Technical artifacts (`IBM Plex Mono`, weights 400–500):** Reserved strictly for CLI commands, skill slugs (`37signals-product-design`), version numbers (`v0.6.1`), and commit hashes (`e24cd596ef41`). Never used as decorative all-caps eyebrows.
- **Type scale:** H1 `clamp(2.2rem, 5.5vw, 3.35rem)`, H2 `clamp(1.28rem, 2.5vw, 1.52rem)`, H3 `1.04rem`, body `0.95rem`, mono artifacts `0.8125rem`.

### Layout, spacing, and hierarchy

- **Measure:** `56rem` (`896px`) max container width with generous outer breathing room on 1440px desktop and `18px–22px` side gutters on 360px–390px mobile.
- **Opening rhythm:** Compact header and 2-line personal summary occupy ~210px on mobile so the signature Plugin Bench sits squarely above the fold and Selected Software begins immediately below it.
- **No card grids or repetitive rules:** Selected Software and Systems sit directly on `--canvas` in open two-column typographic grids on desktop (single column on mobile), separated by negative space rather than boxes or horizontal lines.
- **Dual-audience scan path:** Recruiters get a plain-English summary and direct `Read résumé` action in the opening band plus a scannable Experience timeline. Engineers land directly on the live `joshyorko/plugins` bench with copyable install commands and one-click navigation into the 22-skill interior catalog.

### Signature motif and interaction

1. **Custom `JY` rail-joint monogram:** A 28px architectural SVG hallmark in `#F2EFE9` with one `#D4B475` coupler node.
2. **Portable Plugin Bench:** One elevated machined plate (`--plate`) with subtle 8px corner registration ticks. Visitors switch between `37signals` (10), `RCC` (9), `Fizzy` (1), and `Luna Factory` (2) to inspect real source-grounded scope, jump to specific skills, and copy real bootstrap commands (`install.sh`, `brew install`, `hermes plugins install`).
3. **Plugins & Skills interior (`plugins.html`):** Extends the same token system to an interactive catalog of all 22 real skills pinned to `joshyorko/plugins@e24cd596ef41`, with instant search, plugin filter chips, multi-client install tabs, and one-click `$skill` copy actions.

## Scope and honesty boundaries

- All projects, plugins, skills, and career history come directly from `portfolio/data/catalog.json`, `portfolio/data/work.mjs`, `portfolio/build.mjs` at `6314818`, and public `joshyorko/plugins` documentation.
- `37signals` is clearly marked as community-maintained and independent of 37signals and Basecamp.
- `RCC` notes that the Actions/Robot Bootstrapper MCP is opt-in.
- `Fizzy` notes that the MCP connector requires the operator's own account and authorization.
- `Luna Factory` is presented as an authored Rust MCP control plane and MCP Apps project, not an operational dependency of the website, with live execution and host acceptance noted as separate qualification gates.
- Optional `Agent Lab` local WASM and synthetic MemoryD checks are kept in their own separate link rather than turned into a decorative landing-page telemetry widget.
- No invented metrics, no private employer project details, and no personal email or phone number appear in the prototype.

## Prototype status and refinement log

These files (`index.html`, `plugins.html`) are disposable, static, self-contained design prototypes with no build step, backend, API calls, or production app scaffold.

- **Pass 1 capture and visual audit:** Rendered `index.html` and `plugins.html` in Chromium at `390x844`, `360x800`, and `1440x900` with zero console errors and zero horizontal overflow (`scrollWidth === clientWidth`). Direct pixel review caught seven visual defects:
  1. Long skill names in `plugins.html` wrapped mid-word at `390px` because the `Copy $<slug>` button stole 211px of row width.
  2. Top navigation wrapped `Résumé` onto a lonely second row at `390px` and `360px`.
  3. The mobile Plugin Bench header stacked onto three lines and four tall chips pushed the copyable install bar below the `844px` fold.
  4. The `plugins.html` install tab bar wrapped `Fizzy CLI` onto a second row on mobile, and the search placeholder clipped mid-character.
  5. On `1440px` desktop, the `install.sh` command clipped near the right edge and the solid-white `Read résumé` pill read like a generic dark-mode SaaS button.
  6. Lower software links matched muted body text too closely, and two supplementary lines used spaced em dashes.
  7. The skill count (`22 of 22 skills`) sat orphaned below the filter chips on desktop.
- **Pass 2 refinement:** Compacted the skill trigger button to `Copy $` (with full `aria-label`), tightened mobile nav into one clean horizontal row at `360px` and `390px`, collapsed the mobile bench header to one line so the full Plugin Bench and install command sit cleanly above the `844px` fold, aligned the four install tabs in a single row on mobile, integrated the `22 / 22` counter inside the search bar, restyled `Read résumé` with a machined champagne-brass border tint, widened desktop command visibility to eliminate clipping, elevated secondary link ink (`#CFCAC0`), and removed all em dashes. Re-verified across all viewports and interactive states (`Luna Factory` tab switch and live `Holotree` skill filter).
