---
phase: 02-branded-catalogue
plan: 08
subsystem: catalogue-state
tags: [filter-chips, sort, seo, robots, canonical, tracer]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "params.ts query layer, ItemGrid/Pager (Plan 05), COPY.catalogue (Plan 03), getStore/getFilters client"
provides:
  - "FilterChips: one removable chip per choice, Clear all filters link, escaped search text"
  - "Toolbar id=results with a polite role=status result count (id=result-count)"
  - "Filtered empty state with a clear link; a 400 from /items becomes that state instead of the error screen"
  - "CatalogueShell, GridBusy and useCatalogueNavigate: one shared transition and busy grid for catalogue controls"
  - "SortSelect: instant sort with a no-JS GET form fallback"
  - "seo.ts: SITE_INDEXABLE, listingRobots, canonicalUrl; generateMetadata on /shop"
affects: [02-09, 02-10]

actuals:
  tokens: 14000
  tasks: 2
  commits: 2
plan_head_before: 88e229b
plan_head_after: 1618a55

tech-stack:
  added: []
  patterns:
    - "Search-param-only navigations run inside one useTransition in CatalogueShell; GridBusy dims the old grid (loading.tsx does not show for them)"
    - "Metadata reads SITE_URL via storeEnv() inside generateMetadata, never from request headers"

key-files:
  created:
    - src/components/catalogue/FilterChips.tsx
    - src/components/catalogue/FilterChips.test.ts
    - src/components/catalogue/CatalogueShell.tsx
    - src/components/catalogue/SortSelect.tsx
    - src/lib/seo.ts
    - src/lib/seo.test.ts
  modified:
    - src/app/shop/page.tsx
    - src/components/catalogue/ItemGrid.tsx
    - src/components/catalogue/ItemGrid.test.ts

key-decisions:
  - "The results anchor (id=results) moved from the grid section to the toolbar so pager links land above the count"
  - "Page-level robots is the SEO-04 surface; the site-wide X-Robots-Tag noindex, nofollow header and the layout robots are untouched until Phase 4"

requirements-completed: [CAT-04, CAT-05, CAT-06, CAT-09, SEO-04]
duration: ~15min
completed: 2026-10-26
---

# Phase 2 Plan 08: Chips, sort and listing SEO Summary

/shop now shows the result count in a polite status region, one removable chip per choice (including a header search), a helpful empty state, an instant sort with a dimmed busy grid, and noindex,follow plus a SITE_URL canonical on filtered, searched or sorted listings.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 Tracer: count, chips, empty state | a08c25f | 7 FilterChips tests; built and served against the mock on 3000/4010: "2 items", role=status, both chip links, "Remove filter: Mock Brand", empty heading for q=zzzz, script search escaped; lint and typecheck pass |
| 2 Sort, busy grid, SEO | 1618a55 | 4 seo tests; served: filtered and sorted /shop have `noindex, follow`, plain /shop `noindex, nofollow`, canonicals on the SITE_URL host, sort select present, next.config.ts header intact; prove-freshness (incl. --outage) all PASS; 128 tests, lint, typecheck pass |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ItemGrid test still expected id="results"**
- **Found during:** Task 2 full `npm test` (Task 1 only ran its own test file)
- **Issue:** Removing id="results" from ItemGrid (planned) broke its existing assertion
- **Fix:** The test now asserts the grid no longer carries the id
- **Files modified:** src/components/catalogue/ItemGrid.test.ts
- **Commit:** 1618a55 (the Task 1 commit a08c25f therefore has one failing test; the next commit restores green)

## Not verified

- The human-check (browser: sort applies without reload, 60% dim while pending, Back returns, no-JS select plus Sort button) was not run; only the server-rendered HTML was checked.

## Known Stubs

None.

## Threat Flags

None. T-02-15 (q escaped, tested), T-02-16 (canonical from SITE_URL, no headers()), T-02-17 (robots defaults untouched) mitigated.

## Self-Check: PASSED

All created files exist; commits a08c25f and 1618a55 are on the branch.
