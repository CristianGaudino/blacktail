---
phase: 02-branded-catalogue
plan: 05
subsystem: catalogue-ui
tags: [item-card, grid, pager, loading-skeleton, next16, vitest]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "formatMoney, isNew, pageCountOf/resolvePage/pageLinks (Plan 04), COPY and SHOP seams (Plans 02, 03), CatalogueBanner (Plan 01)"
provides:
  - "ItemCard, ItemGrid (id=results, data-as-of), Pager, /shop/loading.tsx"
  - "CATALOGUE.eagerImages = 4"
  - "prove-freshness outage assertion that understands streaming"
affects: [02-06, 02-08, 02-09, 02-10]

actuals:
  tokens: 12000
  tasks: 3
  commits: 3
plan_head_before: c6e531c0b60871dc24d9ef60b801ffa136244b7c
plan_head_after: 30ae844bc3b2fde015cb97cb9b88ad9e43b6c69e

tech-stack:
  added: []
  patterns:
    - "Cards read named item fields only; one request-time clock passed to every card"
    - "Pager and card links use prefetch=false so a grid view never fans out requests"

key-files:
  created:
    - src/components/catalogue/ItemCard.tsx
    - src/components/catalogue/ItemGrid.tsx
    - src/components/catalogue/ItemGrid.test.ts
    - src/components/catalogue/Pager.tsx
    - src/components/catalogue/Pager.test.ts
    - src/app/shop/loading.tsx
  modified:
    - src/lib/config.ts
    - src/app/shop/page.tsx
    - scripts/prove-freshness.mjs
  deleted:
    - src/components/stock/ItemList.tsx
    - src/components/stock/ItemList.test.ts

key-decisions:
  - "The past-the-end redirect stays redirect(pageHref(query, last)); loading.tsx makes it a meta refresh inside a 200 (see Deviations from the UI-SPEC)"
  - "Date.now() is read once in the server page with a purity-rule eslint-disable, then passed down as now"

requirements-completed: [CAT-01, CAT-07, CAT-10, SHELL-05]
duration: 25min
completed: 2026-10-26
---

# Phase 2 Plan 05: Card grid, pager and loading skeleton Summary

/shop now shows 24 branded cards per page (4:5 Sand frame, brand, 2-line title, Colour / Size, en-IE price from cents, NEW badge under 7 days, decorative heart), a numbered pager that keeps filters, a past-the-end redirect, and a skeleton on first navigation, with the outage proof updated for streaming.

## Tasks

1. Tracer: ItemCard, ItemGrid, page wiring, ItemList deleted and its 3 cases ported (8026f09). 14 render tests. Built and served: 24 cards, 4 eager images, MOCK-0001 at EUR 12.50, New badge, 4:5 frame, data-as-of.
2. Pager and redirect (6ebf78f). 4 pager tests. Before loading.tsx: `/shop?page=99` answered `307 http://127.0.0.1:3000/shop?page=2`, page 2 held 6 cards with `aria-current="page"` and nav label Pages.
3. Loading skeleton and outage proof (30ae844). After loading.tsx: page=99 returns 200 with `<meta http-equiv="refresh" content="1;url=/shop?page=2"/>`; `prove-freshness --outage` prints PASS outage (plus cache-hit, rejects, ignored, round-trip).

Full run: 14 test files, 109 tests pass; lint and typecheck clean.

## Deviations from the UI-SPEC

The UI-SPEC State Coverage row for a page past the last page asks for a 307 to the last page. It is a real 307 only while no loading.tsx exists (proved in Task 2). Once loading.tsx streams the shell with HTTP 200 (required by the UI-SPEC Loading row), Next emits the redirect as a meta refresh inside the stream (proved in Task 3). The shopper still lands on the last page; only the status code differs. This is the accepted deviation recorded in the plan and must be listed in the phase PR body (Plan 10). The way back: delete src/app/shop/loading.tsx.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's Task 1 eager-image grep is case-sensitive and wrong**
- **Found during:** Task 1 verification
- **Issue:** React serialises the attribute as `fetchPriority="high"`, so the plan's `grep -o 'fetchpriority="high"'` counts 0, and in tests React also hoists a preload link per high-priority image, so counting the attribute anywhere over-counts.
- **Fix:** Counted `<img ...fetchPriority="high"` tags instead: exactly 4 in the served HTML. The unit test counts img tags only, case-insensitively.
- **Files modified:** none (check only), src/components/catalogue/ItemGrid.test.ts
- **Commit:** 8026f09

**2. [Rule 3 - Blocking] react-hooks/purity rejects Date.now() in the page**
- **Found during:** Task 1 lint
- **Issue:** `Date.now()` in the async server component fails `react-hooks/purity`.
- **Fix:** One `const now = Date.now()` with a targeted eslint-disable and a comment; a server component runs once per request.
- **Files modified:** src/app/shop/page.tsx
- **Commit:** 8026f09

**3. [Rule 3 - Blocking] Pager.test.ts written ahead broke typecheck during Task 1**
- **Issue:** `next build` type-checks all files, and the Pager test existed before Pager.tsx.
- **Fix:** Moved the test out of the tree for Task 1's build and restored it for Task 2. No commit effect.

**4. [Process] First Task 1 commit held only the deletions**
- A failed `git add` (deleted paths already staged) left new files unstaged; amended the unpushed commit to include them. Final commit 8026f09 is complete.

## Known Stubs

None. The heart is intentionally decorative (D-24); wishlist is out of scope.

## Threat Flags

None. T-02-07 (named fields only, leak test), T-02-08 (prefetch false on card and pager links), T-02-09 (outage proof passes with streaming), T-02-10 (redirect target is pageHref of the cleaned query) are implemented as planned.

## Notes for the owner

Human checks not run here (need a browser): 320/375/640/1280px layout and hover zoom, Tab ring around whole cards, skeleton under throttled network, reduced-motion pulse.

## Self-Check: PASSED

Files present: ItemCard.tsx, ItemGrid.tsx, ItemGrid.test.ts, Pager.tsx, Pager.test.ts, loading.tsx; ItemList.tsx absent. Commits 8026f09, 6ebf78f, 30ae844 are ancestors of HEAD.
