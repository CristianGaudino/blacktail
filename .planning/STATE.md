---
gsd_state_version: "1.0"
current_phase: 02
current_phase_name: Branded Catalogue
status: verifying
stopped_at: Completed 02-10-PLAN.md
last_updated: "2026-10-27T00:13:51.309Z"
last_activity: 2026-10-26
last_activity_desc: Phase 02 execution started
state_head: 36e3826211b2e501f23016884c748ab586e3546f
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 14
  completed_plans: 14
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-26)

**Core value:** Shoppers see the shop's current in-stock pieces, always up to date with How many, in a storefront that looks like the Blacktail Archive mockups.
**Current focus:** Phase 02 — Branded Catalogue

## Current Position

Phase: 02 (Branded Catalogue) — EXECUTING
Plan: 10 of 10
Status: Phase complete — ready for verification
Last activity: 2026-10-26 — Phase 02 execution started

Progress: [███░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 12 min | 3 tasks | 17 files |
| Phase 01 P02 | 3 min | 3 tasks | 15 files |
| Phase 01 P03 | n/a | 2 tasks | 5 files |
| Phase 01 P04 | 30min | 2 tasks | 2 files |
| Phase 02 P01 | 12min | 2 tasks | 12 files |
| Phase 02 P02 | 10min | 2 tasks | 14 files |
| Phase 02 P03 | 5min | 2 tasks | 7 files |
| Phase 02 P04 | 5min | 2 tasks | 6 files |
| Phase 02 P05 | 25min | 3 tasks | 11 files |
| Phase 02 P06 | 20min | 2 tasks | 13 files |
| Phase 02 P07 | 30min | 2 tasks | 6 files |
| Phase 02 P08 | 15min | 2 tasks | 9 files |
| Phase 02 P09 | 25min | 3 tasks | 12 files |
| Phase 02 P10 | 20 min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Freshness round trip (R2 + D1 tag cache + DO queue, signed webhook) is proven on a deployed Worker in Phase 1, before any styled UI
- [Roadmap]: No `cacheComponents` / `'use cache'`; guard test lands in Phase 1
- [Roadmap]: Shop seam (`src/shop/`) and the shop-strings guard test land in Phase 2 with the design system
- [Phase 01]: Plan 01-01: webhook refusals log one reason word only; body, headers and secret are never logged
- [Phase 01]: Plan 01-01: kept Vintage's @node-minify/core glob override (npm audit flagged 4 high advisories via @opennextjs/cloudflare)
- [Phase 01]: server-only mocked in vitest setupFiles, not aliased (empty.js is not an exported path)
- [Phase 01]: Guard regex for one-argument revalidateTag tolerates nested parens so revalidateTag(storeTag(), opts) passes
- [Phase 01]: D1 tag cache used plain (not wrapped) so populateCache creates the revalidations table; missing-env CI check polls the Worker log up to 15s
- [Phase 01]: Deploy smoke check is a noindex header grep plus an unsigned webhook POST expecting 401, after a curl retry wait for the certificate
- [Phase 02]: A price or measurement bound equal to its own /filters bound is dropped after the min/max swap, so it never mints a second cache key
- [Phase 02]: Search q is capped at 40 code points (was 80; lowered in quick 261027-aab) with Array.from so the cap never splits a character
- [Phase 02]: Bodoni woff2 and OFL licence taken from the @fontsource/bodoni-moda 5.3.0 tarball in an isolated scratch dir; not a dependency
- [Phase 02]: Plan 02-03: owner-pending email/Vinted/eBay use .ie placeholders marked PENDING-OWNER; COPY groups.type is 'Category'; mock colour 'Ochre' left out of COLOURS to keep swatch fallback provable
- [Phase 02]: 02-04: formatMoney picks 0 or 2 fraction digits per amount for both min and max (avoids 119.5)
- [Phase 02]: 02-05: past-the-end redirect is a 307 only before loading.tsx; with the skeleton it is a meta refresh inside a 200 (accepted, owner to see in PR)
- [Phase 02]: 02-06: Header keeps the logo as a static svg import (src/shop/logo.svg); hover-open for dropdowns is mouse-only from 1024px, touch uses click
- [Phase 02]: 02-07: newsletter mock is a div with disabled input and button, no form or handler (D-06)
- [Phase 02]: Plan 08: results anchor id=results moved from the grid to the toolbar; page-level robots (noindex, follow for filtered/sorted) is the SEO-04 surface while the site-wide noindex header stays until Phase 4
- [Phase 02]: 02-09: FilterChips exports LABEL_MAPS, shared with the filter panel
- [Phase 02]: 02-09: Range group skipped when floor/ceil bounds are equal; no-JS GET form carries q and non-default sort as hidden inputs
- [Phase 02]: 02-10: Worker job also pins en-IE money formatting (euro sign + 12.50) on /shop under workerd

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Freshness round trip on a deployed Worker is unproven (research flag, highest). Settle `{ expire: 0 }` vs `'max'` and `force-cache` after `await searchParams`
- [Phase 1]: OpenNext cannot build on Windows. Build and deploy from Linux CI or WSL only
- [Phase 3]: Ralph Lauren spelling (`ralph-lauren` vs `polo-ralph-lauren`) and `arc-teryx.svg` rename to `arcteryx.svg` need confirming
- [Phase 4]: Sold-before brand tier has no data source (BRAND-02 ships with it empty; BRAND-05 is v2)
- [Phase 4]: Default brand order and lifestyle photos (hero, 2 banners, 4 category tiles, story band) still to come from the owner

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-27T00:13:51.202Z
Stopped at: Completed 02-10-PLAN.md
Resume file: None
