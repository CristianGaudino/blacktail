---
phase: 02-branded-catalogue
plan: 01
subsystem: api
tags: [nextjs, url-params, zod, how-many-api, caching, vitest]

requires:
  - phase: 01-foundation
    provides: tagged cached howmanyFetch client, lenient Zod schemas, prove-freshness proof, mock API
provides:
  - "/shop request-time All Items page; / is a 307 to /shop"
  - "src/lib/params.ts: pure URL query layer (parse, canonical string, hrefs)"
  - "getFilters() and getItemsPage(search) tagged, React-cached readers"
  - "30-item mock How many API with /filters, filtering, sort, paging and GET /__last"
affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07, 02-08, 02-09, 02-10]

actuals:
  tokens: 9100
  tasks: 2
  commits: 2
plan_head_before: 42cd909afdb471961d3677505d8d35b0fff0c7f9
plan_head_after: 3461399679f617e184383e7757d686c81923b6f0

tech-stack:
  added: []
  patterns:
    - "Cleaned URL query is the cache key: keys then values sorted, /filters spelling, defaults omitted"
    - "React cache() keyed on the canonical query string around AbortSignal-fetches"

key-files:
  created:
    - src/app/shop/page.tsx
    - src/lib/params.ts
    - src/lib/params.test.ts
  modified:
    - next.config.ts
    - src/lib/howmany/client.ts
    - src/lib/howmany/client.test.ts
    - src/lib/howmany/schemas.ts
    - src/lib/definitions.ts
    - src/lib/config.ts
    - src/lib/routes.ts
    - src/lib/copy.ts
    - scripts/mock-howmany.mjs
    - scripts/prove-freshness.mjs
  deleted:
    - src/app/page.tsx

key-decisions:
  - "A range value at its own /filters bound is dropped after the swap, so it never mints a second cache key"
  - "q is capped with Array.from (code points) so the 80 char limit never splits an emoji"
  - "clearFilters reuses parseCatalogueQuery against an empty Filters instead of a second hand-built empty query"

patterns-established:
  - "shopHref(query) is the only way to build a non-page link, which enforces the page 1 reset"
  - "params.ts stays client-safe: only config, definitions types and routes are imported"

requirements-completed: [CAT-02, CAT-03, CAT-04, CAT-05, CAT-06]

coverage:
  - id: D1
    description: "/ redirects (307) to /shop and /shop renders the first 24 in-stock items"
    requirement: CAT-06
    verification:
      - kind: integration
        ref: "node scripts/prove-freshness.mjs http://127.0.0.1:3000 --mock http://127.0.0.1:4010 --outage (PASS home-redirect, ready, outage)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every list, range, search, sort and page param is cleaned against /filters into one canonical API query"
    requirement: CAT-02
    verification:
      - kind: unit
        ref: "src/lib/params.test.ts"
        status: pass
      - kind: integration
        ref: "GET /shop with junk-laden query -> mock /__last equals colour=Navy&colour=Ochre&limit=24&minPrice=2000&q=mock+item&sort=price_asc&type=shirt"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-10-26
status: complete
---

# Phase 2 Plan 01: URL query layer and /shop Summary

**`/shop` reads the cleaned URL (lists, price and measurement ranges, search, sort, page) against the cached `/filters`, sends one canonical sorted query to How many, and `/` is a 307 to it.**

## Performance

- **Duration:** about 12 min
- **Tasks:** 2 of 2
- **Files:** 11 modified or created, 1 deleted

## Accomplishments

- Task 1 (tracer): `/` redirect in `next.config.ts`, request-time `/shop` page, `getFilters` and `getItemsPage` (React `cache()`, `force-cache`, tag `store:<slug>`, revalidate 600), brand and page cleaning, 30-item mock with `/filters` and `/__last`, `prove-freshness.mjs` moved to `/shop` with a `home-redirect` check.
- Task 2: all eight list filters, price/pit-to-pit/length ranges (digits only, snapped, clamped, swapped, dropped at bound or when `/filters` has none), `q`, `sort`, `page`, plus `shopHref`, `pageHref`, `hasFilters`, `rangeBounds`, `clearFilters`.
- The all-pages `getItems` reader and `STORE_API.listLimit` are gone; client tests ported to `getItemsPage` and `getFilters`.

## Task Commits

1. Task 1 (tracer): `e69d5e2` feat(02-01)
2. Task 2: `3461399` feat(02-01)

## Verification

- `npm test` 64 passed (was 43), `npm run lint` and `npm run typecheck` clean.
- On `next start` against the mock: `/` gives `307 http://127.0.0.1:3000/shop`; the brand tracer sent exactly `brand=Mock+Brand&limit=24`; the junk-laden full query sent exactly `colour=Navy&colour=Ochre&limit=24&minPrice=2000&q=mock+item&sort=price_asc&type=shirt`; `prove-freshness` printed PASS for ready, home-redirect, noindex, cache-hit, rejects, ignored, round-trip and outage. The build made no API calls (it ran with the mock stopped).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mock list filtering written in Task 1 instead of Task 2**
- **Found during:** Task 1
- **Issue:** The mock file was being rewritten anyway; writing the Task 2 `/items` filtering (every list, `q`, ranges, sort) then avoided editing it twice.
- **Fix:** Task 1's commit already contains the full `/items` filtering; Task 2's commit has no mock change.
- **Files modified:** scripts/mock-howmany.mjs
- **Commit:** e69d5e2

**2. [Rule 1 - Bug] `/__last` returned a JSON-quoted string**
- **Found during:** Task 1 verify
- **Issue:** `send()` passes strings through, so `JSON.stringify(last)` produced `"brand=..."` with quotes, failing the plan's exact-match check.
- **Fix:** Answer with the raw string as `text/plain`.
- **Commit:** e69d5e2

**3. Task 2 test and implementation in one commit**
- The params tests were written and seen failing (16 failed) before the implementation, but both landed in one task commit; the plan is `type: execute`, so no separate RED commit was made.

**Total deviations:** 2 auto-fixed, 1 process note. No scope change.

## Authentication Gates

None.

## Known Stubs

None. `/shop` still renders the Phase 1 `ItemList` by plan design; Plan 05 replaces it with the card grid.

## Threat Flags

None beyond the plan's threat model (T-02-01..04 mitigated: values only go through `URLSearchParams` on the fixed `/items` and `/filters` paths, lists bounded by `/filters`, ranges digits-only, `q` capped at 80 code points, fixed `/` to `/shop` redirect, `filtersSchema` strips unknown keys).

## Issues Encountered

- `outage` proof logs a `HowManyError 500 for /filters` stack trace in the server output. That is the expected outage path (the page must reach error.tsx), not a failure.

## Next Phase Readiness

Plans 02-02 onward can import `parseCatalogueQuery`, `toSearchString`, `shopHref`, `pageHref`, `hasFilters`, `rangeBounds`, `clearFilters`, `getFilters`, `getItemsPage` and `ROUTES.*` as named in the plan. CI workflow files are not in this plan's `files_modified`: the `ci.yml` warm-up curl (line 83) and the `deploy-workers.yml` smoke curl (line 60) still request `/` and now get a 307, which neither treats as a failure (no `-L`, warm-up ends `|| true`). A later plan should point them at `/shop` (RESEARCH Pitfall 6 point 3).

## Self-Check: PASSED

- FOUND: src/app/shop/page.tsx, src/lib/params.ts, src/lib/params.test.ts, scripts/mock-howmany.mjs
- FOUND commits: e69d5e2, 3461399
- src/app/page.tsx removed
