---
phase: 06-sold-before-brands-spotlight-and-docs
verified: 2026-11-06T22:30:00Z
status: human_needed
score: 4/4 must-haves verified
covered_files:
  - .claude/CLAUDE.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-01-PLAN.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-01-SUMMARY.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-02-PLAN.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-02-SUMMARY.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-03-PLAN.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-03-SUMMARY.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-04-PLAN.md
  - .planning/phases/06-sold-before-brands-spotlight-and-docs/06-04-SUMMARY.md
  - README.md
  - scripts/mock-howmany.mjs
  - scripts/prove-freshness.mjs
  - src/app/brands/[slug]/page.tsx
  - src/components/home/BrandStrip.tsx
  - src/components/home/JustDropped.tsx
  - src/lib/brands.ts
  - src/lib/homeSections.ts
  - src/lib/howmany/client.ts
  - src/lib/howmany/schemas.ts
covered_digest: "v3:sha256:3558427b80106baf1c9a6e54d499da273ce7db303033f86c77f7cdfeb70f3db2"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "After merge, open the live home page with the seller's real data (a spotlight piece and a sold-before brand set in How many)"
    expected: "Spotlight pieces open the Just Dropped carousel, then the newest, no piece twice; the sold-before brand shows after the in-stock brands (logo or name) and its page shows the empty-catalogue screen"
    why_human: "Live `soldBrands` element shape is unobserved (empty list on 2026-11-06) and no live spotlight piece exists yet; the carousel and strip look is a visual judgement. Everything is proven against the mock on workerd only."
  - test: "Toggle a spotlight piece in How many and watch the home carousel"
    expected: "The carousel updates, by webhook or within 10 minutes (revalidate 600 fallback)"
    why_human: "Whether a spotlight toggle fires the `store.updated` webhook is unknown (RESEARCH A1)."
  - test: "Open /brands/<sold-before brand> on the live site"
    expected: "200 with the empty-catalogue screen, not an error (assumes live /items?brand=<sold brand> answers 200 with zero items; a 400 is already mapped to empty by CataloguePage)"
    why_human: "Live API behaviour for a brand with no stock (RESEARCH A4) was only exercised against the mock."
---

# Phase 6: Sold-Before Brands, Spotlight and Docs Verification Report

**Phase Goal:** The home page follows the seller's own data (sold-before brands, spotlight pieces) and docs and comments state the real rate limit.
**Verified:** 2026-11-06T22:30:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|-----------------------------------|--------|----------|
| 1 | Brand strip lists in-stock brands, then sold-before brands (from `/filters` `soldBrands`), then default order; a brand with no logo shows as its name | VERIFIED | `BrandStrip.tsx` calls `stripBrands(filters.brand.map(...), filters.soldBrands, SHOP.defaultBrandOrder)`; `stripBrands` dedupes against in-stock and ranks each tier by default order; `BrandRow` renders the name `<span>` when the slug is not in `BRAND_LOGOS`. `SOLD_BEFORE_BRANDS` placeholder removed (`git diff` shows deletion; no remaining reference). `filtersSchema.soldBrands` parses plain strings and `{value}` objects, drops bad entries singly, `.catch([])` on non-array. CI run 42303664122: 2x `PASS home-sold-brands` on workerd (order Acme, Mock Brand, Northwind, Barbour logo, Old Mill name; both brand pages 200). |
| 2 | Home carousel shows spotlight pieces first, then fills with newest up to carousel size, no piece twice | VERIFIED | `JustDropped.tsx` reads `getItemsPage('spotlight=true', HOME.carouselItems)` and `getItemsPage('')` via the tagged `client.ts`; `spotlightFirst` dedupes by code and slices to size (10). `/just-dropped` untouched (D-02). `JustDropped.test.ts` (5 tests) and 5 `spotlightFirst` unit cases pass. CI: 2x `PASS home-spotlight` (order MOCK-0003, MOCK-0015, MOCK-0001; MOCK-0003 once; /just-dropped newest first). |
| 3 | No spotlight pieces or no sold brands: home as in v1.0, no gap, no error | VERIFIED | `Promise.allSettled`: rejected or empty spotlight counts as `[]`, warns once, newest list used; section hides only when both empty. `soldBrands` missing/non-array gives `[]`, and `stripBrands` then equals the v1.0 in-stock-plus-default-order strip. Unit tests: empty spotlight, failed spotlight (no throw), both failed hides, string/null/object `soldBrands`, default-empty expectation. |
| 4 | Docs, code comments, scripts say "600 uncached requests a minute per IP" and no mention of 3000 | VERIFIED | Phrase present in `README.md:9`, `.claude/CLAUDE.md:66`, `src/lib/howmany/client.ts:49` (and research notes). `git grep` for 3000 outside milestones/quick/issues.json: only port numbers in old plan files and price test values in `params.test.ts`; no rate-limit mention. Historical files (`.planning/milestones`, `.planning/quick`, `docs/refs/issues.json`) intentionally untouched per D-06 and RESEARCH A2. |

**Score:** 4/4 truths verified (0 behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/lib/homeSections.ts` (`spotlightFirst`, `stripBrands`) | pure ordering | VERIFIED | substantive, imported by JustDropped and BrandStrip |
| `src/components/home/JustDropped.tsx` | spotlight-first carousel | VERIFIED | wired to `getItemsPage` and `spotlightFirst` |
| `src/lib/howmany/schemas.ts` `soldBrands` | lenient parse | VERIFIED | flows to BrandStrip and brands/[slug] |
| `src/components/home/BrandStrip.tsx`, `src/app/brands/[slug]/page.tsx` | read `filters.soldBrands` | VERIFIED | same React-cached `/filters`, no extra call |
| `scripts/mock-howmany.mjs`, `scripts/prove-freshness.mjs` | `home-spotlight`, `home-sold-brands` checks | VERIFIED | checks ran PASS in CI |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| JustDropped | `/items?spotlight=true` | `getItemsPage` (store tag, revalidate 600) | WIRED |
| BrandStrip / brand page | `/filters` `soldBrands` | `getFilters` | WIRED |
| `itemSchema` | spotlight flag | not parsed (privacy whitelist kept) | OK |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
| -------- | ---- | ------ | --------- | ------ |
| JustDropped | `items` | `/items` spotlight + newest reads | Yes (mock on workerd; live spotlight not yet populated) | FLOWING |
| BrandStrip | `brands` | `/filters` brand + soldBrands | Yes (mock; live `soldBrands` empty today) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Unit suite | `npx vitest run` | 33 files, 326 tests passed | PASS |
| Workerd proof | `gh run view 42303664122 --log` | 2x PASS home-spotlight, 2x PASS home-sold-brands, no FAIL | PASS |
| PR checks (head abc75aa, docs-only commit after the run) | `gh pr checks 31` | check, CodeQL, Analyze pass; worker pending at verification time (src/scripts/.github unchanged since green run c8c2a6c) | PASS (worker re-run pending) |

### Probe Execution

No `probe-*.sh` scripts declared; the equivalent is `prove-freshness`, run in CI (above).

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
| ----------- | ----------- | ------ | -------- |
| BRAND-05 | 06-03 | SATISFIED (mock-proven; live shape pending) | Truth 1, 3 |
| HOME-05 | 06-01 | SATISFIED (mock-proven; live data pending) | Truth 2, 3 |
| DOC-01 | 06-02 | SATISFIED | Truth 4 |

No orphaned requirements for Phase 6.

### Anti-Patterns Found

None. No TBD/FIXME/XXX/TODO/HACK added in the phase diff; no stubs.

### Human Verification Required

1. **Live home page with real data.** Test: after merge, with a spotlight piece and a sold-before brand set in How many, open the home page. Expected: spotlight pieces first in the carousel, no duplicates; sold-before brand after in-stock brands, logo or name. Why human: live `soldBrands` shape unobserved, visual check.
2. **Spotlight toggle freshness.** Test: toggle a spotlight piece. Expected: carousel updates by webhook or within 10 minutes. Why human: unknown whether the webhook fires.
3. **Sold-before brand page live.** Test: open `/brands/<sold brand>`. Expected: 200 with empty-catalogue screen. Why human: live `/items?brand=` behaviour for zero stock was assumed.

### Gaps Summary

No gaps. All four ROADMAP success criteria are verified in code, unit tests and workerd CI against the mock API. The only open items are live-site checks that cannot be done before merge (the live `soldBrands` element shape, spotlight webhook behaviour, and the carousel and strip look), so the status is human_needed.

---

_Verified: 2026-11-06T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
