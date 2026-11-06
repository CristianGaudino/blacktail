---
phase: 05-sold-item-pages-and-listing-links
plan: 01
subsystem: item-page
tags: [sold, nextjs, howmany-api, json-ld, seo]
requires:
  - phase: 03-item-and-brand-pages
    provides: getItem, item page, ItemJsonLd, WhereToBuy
provides:
  - itemDetailSchema / ItemDetail (nullable price, day-key soldAt)
  - getItem returning sold pieces (null only for a 404 or a bad code)
  - Sold item page (Sold on <date>, SoldNotice, SoldOut JSON-LD, noindex, no More from)
  - soldItemRobots(), formatDay(), neutral COPY.gone
  - mock hidden set, soldAt, MOCK-0031; prove-freshness item-sold, item-hidden, item-sold-bare
affects: [05-02, 05-03, 05-04]
tech-stack:
  added: []
  patterns: [one tagged read for in stock and sold, robots helper beside listingRobots]
key-files:
  created:
    - src/components/item/SoldNotice.tsx
  modified:
    - src/lib/howmany/schemas.ts
    - src/lib/howmany/client.ts
    - src/lib/howmany/client.test.ts
    - src/lib/definitions.ts
    - src/lib/dates.ts
    - src/lib/copy.ts
    - src/lib/seo.ts
    - src/lib/seo.test.ts
    - src/app/items/[code]/page.tsx
    - src/components/item/ItemDetails.tsx
    - src/components/item/ItemJsonLd.tsx
    - src/components/item/ItemInfo.test.ts
    - scripts/mock-howmany.mjs
    - scripts/prove-freshness.mjs
key-decisions:
  - "getItem stays one tagged read of /items/{code}; the page decides Sold from status (D-05)"
  - "soldAt is a day key formatted in UTC with SHOP.locale; a malformed value becomes null, not an error page"
  - "The asking price stays only in the JSON-LD offer; formatMoney is never called for a sold piece (D-02)"
requirements-completed: [SOLD-01, SOLD-02, SOLD-03, SOLD-04]
duration: about 35 min
completed: 2026-11-06
status: complete
actuals:
  tokens: 14000
  tasks: 2
  commits: 2
plan_head_before: 94ea6b4ce0a313dd086d5b4b54063ea0be98857d
plan_head_after: 4cd2fbd1917b5c9872fe9f2153c56b7af103332a
---

# Phase 5 Plan 01: Sold item page Summary

A sold piece now answers 200 as a Sold page ("Sold on 3 November 2026", sold panel, JSON-LD SoldOut, noindex, "Sold." description, no price, no where-to-buy, no More from), while a hidden or unknown piece stays a real 404 with neutral copy.

## What was built

- `itemDetailSchema` extends the strict `itemSchema` with a nullable `priceCents` and a `soldAt` day key (`.nullable().catch(null)`); `getItem` no longer maps sold to null and still returns null only for a 404 or a badly shaped code (429, 500 and parse errors still reach error.tsx).
- Item page: sold branch with `formatDay` (UTC, `SHOP.locale`), `SoldNotice` (Shop all items, See the newest drops), `soldItemRobots()` in `generateMetadata`, description prefixed `Sold.`, no More from read when sold, price paragraph only when `priceCents` is not null.
- `ItemJsonLd`: SoldOut availability for sold, no `price` key when `priceCents` is null.
- `COPY.gone` reworded to neutral wording; new `COPY.item.sold/soldOn/soldMessage/newestDrops` and `COPY.seo.sold`.
- Mock: `soldAt` on every item (`2026-11-03` for a `gone` piece), a `hidden` set that 404s, and `MOCK-0031` (sold, no price, no date, no photos, never in a list).
- prove-freshness: `item-sold` (incl. /shop, /just-dropped, home and the MOCK-0005 More from row dropping MOCK-0002), `item-hidden`, `item-sold-bare`.

## Verification

- `npm test` (294 passed), `npm run lint`, `npm run typecheck` all clean.
- Local harness (build with zero API calls, `next start` against the mock): every prove-freshness check PASS, including item-sold, item-hidden, item-sold-bare and --outage. The in-stock MOCK-0001 pre-checks (InStock, Visit us on, More from Mock Brand, no Sold line, unknown code shows the new gone title) passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree base was stale**
- **Found during:** startup. The worktree was created from `main` (50bcf2a), which does not contain the phase 5 plan files.
- **Fix:** fast-forwarded the worktree branch to the phase branch `gsd/phase-05-sold-item-pages-and-listing-links` (94ea6b4, a descendant of the old base). No commits were lost; the branch had none of its own.

**2. [Task split] MOCK-0031 added in the Task 1 commit**
- The mock's single-read edit was done once, so MOCK-0031 landed in commit 7c70970 with Task 1; Task 2's commit (4cd2fbd) holds the `item-sold-bare` check. No behaviour difference.

**3. [Environment] Leaked local servers**
- Killing a leaked `next start` was refused by the permission classifier, so later proof runs used other ports (3200 mock 4210). Node processes from the proof runs may still be listening on 3000, 3100 and 3200 (and mock 4210). They are harmless but should be stopped before the next harness run.

Otherwise: plan executed as written.

## Known Stubs

None.

## Threat Flags

None. No new endpoints or trust boundaries beyond the plan's threat model.

## Self-Check: PASSED

- FOUND: src/components/item/SoldNotice.tsx
- FOUND commits: 7c70970, 4cd2fbd
