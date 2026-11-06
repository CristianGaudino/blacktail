---
phase: 05-sold-item-pages-and-listing-links
plan: 03
subsystem: item-page
tags: [listings, where-to-buy, zod, trust-boundary]
requires:
  - phase: 05-sold-item-pages-and-listing-links
    provides: Plan 01 itemDetailSchema and mock; Plan 02 sold badge
provides:
  - listings on itemDetailSchema (https only, bad entries dropped one by one)
  - COPY.item.buyOn and per-item Buy on buttons in WhereToBuy
  - MOCK-0003 with two listings (ebay then vinted)
affects: [05-04]
tech-stack:
  added: []
  patterns: [per-entry safeParse inside a transform so one bad entry never empties the list]
key-files:
  created: []
  modified:
    - src/lib/howmany/schemas.ts
    - src/lib/copy.ts
    - src/components/item/WhereToBuy.tsx
    - src/app/items/[code]/page.tsx
    - src/components/item/ItemInfo.test.ts
    - src/lib/howmany/client.test.ts
    - scripts/mock-howmany.mjs
key-decisions:
  - "Listing platform name: case-insensitive match on SHOP.platforms, else URL host without www.; the code and URL are never printed as text"
  - "Fallback profile panel keeps 'Visit us on' (D-08 as amended by the owner)"
requirements-completed: [LINK-01, LINK-02]
duration: about 20 min
completed: 2026-11-06
status: complete
actuals:
  tokens: 9000
  tasks: 2
  commits: 2
plan_head_before: d792eeb3cf08021d8f4b8f9c6d3163d8f8311442
plan_head_after: 4b1231af26084e6d4ab919891502b914337decc5
---

# Phase 5 Plan 03: Per-item listing buttons Summary

An in-stock piece with listings now shows "This piece is listed on eBay and Vinted" and one new-tab "Buy on <Platform>" button per listing in the API's order; a piece with none keeps the profile-link panel exactly as before.

## What was built

- `itemDetailSchema.listings`: `z.array(z.unknown()).catch([])` then a transform that keeps only entries passing `{ platform: string, url: z.url({ protocol: /^https$/ }) }`. The list schema is untouched.
- `COPY.item.buyOn`; `visitOn`, `listedOn`, `whereToBuyHelp` unchanged.
- `WhereToBuy({ listings })`: listing mode (de-duplicated intro, no help line, `flex-col flex-wrap` row, `ButtonLink external` per listing keyed by URL) or the old profile panel when `listings` is empty. The item page passes `item.listings` in the in-stock branch only; sold pages still show no panel.
- Mock: every item has `listings: []`, MOCK-0003 has ebay and vinted listings, a sold read has none.

## Verification

- `npm test` 309 passed, `npm run lint` and `npm run typecheck` clean.
- Local harness (ports 3400 and 4410 instead of 3000 and 4010): build made zero API calls; MOCK-0003 shows the intro, Buy on eBay then Buy on Vinted, each a `target=_blank rel="noopener noreferrer"` anchor to its exact URL and no "Visit us on"; MOCK-0001 keeps "Visit us on" and has no "Buy on"; every prove-freshness check PASS including round-trip and `--outage`. Servers stopped on exit.

## Deviations from Plan

**1. [Environment] Harness ports** - ran on 3400 and 4410 as instructed by the orchestrator. Same assertions.

**2. [Process] Commit split** - the Task 1 commit includes the WhereToBuy listing-case tests in `ItemInfo.test.ts` (same file as the fixture change); the Task 2 commit holds the `client.test.ts` schema cases. No implementation fix was needed after the edge-case tests were written: they all passed against Task 1's code.

**3. [Observation] One harness run ended `EXIT 1`** right after printing `PASS outage` (output was tail-cut, cause not captured); two reruns of the identical script were fully green, so it looks like a transient of the first cold run.

## Known Stubs

None.

## Threat Flags

None. T-05-06 (javascript:/http: dropped by the schema) and T-05-09 (URL appears once, as the href) are pinned by tests; T-05-07 holds through `ButtonLink external` and is asserted per anchor.

## Open item

RESEARCH A1: non-empty `listings` are proven against the mock only; Plan 04's UAT should ask the owner to add a listing to one live piece.

## Self-Check: PASSED

- FOUND: e00d49c, 4b1231a (ancestors of HEAD)
- FOUND: all modified files listed above
