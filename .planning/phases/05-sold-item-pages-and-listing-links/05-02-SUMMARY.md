---
phase: 05-sold-item-pages-and-listing-links
plan: 02
subsystem: item-page
tags: [sold, badge, tests, gallery]
requires:
  - phase: 05-sold-item-pages-and-listing-links
    provides: Plan 01 sold page (itemDetailSchema, formatDay, SoldNotice, mock MOCK-0002 and MOCK-0031)
provides:
  - ItemGallery soldLabel corner badge on the cover frame
  - prove-freshness badge assertions (item-sold, item-sold-bare, in-stock views)
  - Unit tests for the sold edge cases
affects: [05-03, 05-04]
tech-stack:
  added: []
  patterns: [plain-string prop into the client gallery, so no item data reaches the RSC payload]
key-files:
  created: []
  modified:
    - src/components/item/ItemGallery.tsx
    - src/app/items/[code]/page.tsx
    - src/app/items/[code]/not-found.tsx
    - scripts/prove-freshness.mjs
    - src/lib/dates.test.ts
    - src/lib/howmany/client.test.ts
    - src/components/item/ItemInfo.test.ts
    - src/components/item/ItemGallery.test.ts
key-decisions:
  - "The badge wrapper is the existing column div made relative; the badge is its first child, so it sits outside the scroll track and the lightbox"
requirements-completed: [SOLD-01, SOLD-02, SOLD-04]
duration: about 25 min
completed: 2026-11-06
status: complete
actuals:
  tokens: 6000
  tasks: 2
  commits: 2
plan_head_before: d50d4add1348194b1e6c0142f403662dd845ba22
plan_head_after: 374e9f5ce22cbbcf10bde2b5dc3d84825ba7c3c0
---

# Phase 5 Plan 02: Sold badge and sold edge-case tests Summary

A small forest "Sold" badge now sits in the top-left corner of the cover photo of a sold page (also on the placeholder of a piece with no photos), and never on an in-stock page; the sold edge cases are pinned by unit tests.

## What was built

- `ItemGallery` takes an optional `soldLabel` string. The column div is `relative`; the badge is an `aria-hidden`, `pointer-events-none`, `absolute left-2 top-2 z-10` span before the carousel region, so it neither scrolls with the track nor shows in the lightbox, and clicks reach the photo. The item page passes `COPY.item.sold` only when `item.status === 'sold'`.
- `not-found.tsx` doc comment now describes hidden, deleted, unknown and badly shaped codes (a sold piece has its own page).
- `prove-freshness.mjs`: `item-sold` asserts no `>Sold</span>` on the warm in-stock views and one on the sold page; `item-sold-bare` asserts it on the photoless placeholder.
- Tests: `formatDay` cases (also run under TZ Pacific/Auckland and America/Los_Angeles), `getItem` malformed `soldAt` ('yesterday', ISO timestamp) and a schema-failure reject, `ItemJsonLd` SoldOut with and without a price (priceCurrency kept), `SoldNotice` links, no new tab, no currency sign, and the badge placement cases in `ItemGallery.test.ts`.

## Verification

- `npm test` 303 passed, `npm run lint` and `npm run typecheck` clean.
- Local harness (ports 3300 and 4310, since 3000 and 4010 may be held by leaked servers): build made zero API calls, MOCK-0001 shows no badge, every prove-freshness check PASS including item-sold, item-sold-bare, round-trip and `--outage`. Both servers were stopped on exit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree base was stale and had no node_modules**
- Fast-forwarded the worktree branch to the phase branch (d50d4ad). A junction to the main checkout's node_modules crashed Turbopack (symlink leaves the filesystem root), so `npm ci` ran inside the worktree instead.

**2. [Environment] Harness ports**
- The plan's harness uses ports 3000 and 4010; the orchestrator asked to avoid held ports, so the same script ran on 3300 and 4310. No behaviour difference.

**3. [Rule 1 - Bug, test only] Type error in a new test**
- `tags[0]` is `string | undefined` under `noUncheckedIndexedAccess`; fixed with a non-null assertion in the test. No implementation file changed.

No implementation file declared in Task 2 (schemas, client, dates, ItemJsonLd, SoldNotice) needed a fix: every new case passed against Plan 01's code.

## Known Stubs

None.

## Threat Flags

None. T-05-12 (badge only for `status === 'sold'`) is pinned by the harness and by the no-label gallery test; T-05-13 holds because `soldLabel` is a plain COPY string.

## Self-Check: PASSED

- FOUND: 573137c, 374e9f5 (both ancestors of HEAD)
- FOUND: all modified files listed above
