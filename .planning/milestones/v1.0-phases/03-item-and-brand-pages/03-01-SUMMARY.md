---
phase: 03-item-and-brand-pages
plan: 01
subsystem: item-page
tags: [nextjs, item-page, 404, json-ld, webhook-freshness]
requires: []
provides:
  - getItem(code) tagged single-item read (null for gone or badly shaped code)
  - /items/[code] page with details, measurements, where to buy, JSON-LD, metadata
  - real 404 pages (gone item with 8 newest drops, generic Page not found)
  - mock API /items/{code} with gone toggle; prove-freshness item-page, item-unknown, code-gate, item-gone
affects: [03-02, 03-03, 03-04]
tech-stack:
  added: []
  patterns: [notFound() from the page body only, connection() before the read, React cache() around the tagged fetch]
key-files:
  created:
    - src/app/items/[code]/page.tsx
    - src/app/items/[code]/not-found.tsx
    - src/app/not-found.tsx
    - src/components/item/ItemDetails.tsx
    - src/components/item/WhereToBuy.tsx
    - src/components/item/ItemJsonLd.tsx
    - src/components/item/ItemInfo.test.ts
  modified:
    - src/lib/howmany/client.ts
    - src/lib/howmany/client.test.ts
    - src/lib/howmany/schemas.ts
    - src/lib/config.ts
    - src/lib/copy.ts
    - src/lib/routes.ts
    - src/lib/money.ts
    - src/lib/money.test.ts
    - src/lib/utils.test.ts
    - src/components/ui/StatusScreen.tsx
    - src/components/ui/StatusScreen.test.ts
    - src/components/ui/buttons.tsx
    - src/components/catalogue/ItemGrid.tsx
    - src/components/catalogue/ItemGrid.test.ts
    - src/components/catalogue/ItemCard.tsx
    - scripts/mock-howmany.mjs
    - scripts/prove-freshness.mjs
key-decisions:
  - "Material is read from a top-level item.material first, then details.material; unconfirmed against live data"
  - "No loading.tsx and no generateStaticParams on /items/[code]; metadata returns {} for a gone item"
status: complete
commits: 2
plan_head_before: d721c15238a4b6167c751168b880363f8d5e894f
plan_head_after: e05b5e1
actuals:
  tokens: 30000
  tasks: 2
  commits: 2
---

# Phase 3 Plan 1: Item page and real 404 Summary

The item page ships end to end: a /shop card opens /items/<code> with brand, title, price, where-to-buy, details and measurements in cm and inches; a sold, hidden or unknown piece is a real HTTP 404 with the newest 8 drops, including right after a signed webhook.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Tracer: open an item from the grid, gone item is a real 404 with newest drops | 3a5299e |
| 2 | Details, measurements, where to buy, JSON-LD, metadata, generic 404 | e05b5e1 |

## Verification

- `npm test` 174 passed (20 files), `npm run lint` and `npm run typecheck` clean.
- Task 1 and Task 2 harness (next build with the mock down, then `next start` plus mock, `prove-freshness --mock --outage`): all checks PASS, including the new item-page, item-unknown, code-gate and item-gone, and every Phase 1 and 2 check. `S=200 G=404 D=8`; the MOCK-0001 HTML carries JSON-LD, UsedCondition, "51 cm / 20 in", "A Excellent", Cotton, the platform buttons, canonical and title.
- Build made zero How many calls (the mock was not running during build).

## Deviations from Plan

**1. [Ordering] Mock `material` move landed in the Task 1 commit.** Task 2 step 3b moves material to a top-level field in `scripts/mock-howmany.mjs`. I edited the mock once for both tasks, so that change is in commit 3a5299e. `itemSchema.material` itself landed in Task 2 (e05b5e1). No behavioural effect.

**2. [Setup] Plan files were not in the worktree.** `.planning/phases/03-item-and-brand-pages/` is untracked in the main checkout, so it was copied into the worktree to read the plan. Only this SUMMARY is committed from that folder.

**3. [Scope] STATE.md and ROADMAP.md not updated.** This run is an isolated worktree for a wave; the orchestrator owns those files, so the state and roadmap commands were not run.

## Known limits / not verified

- Not run on workerd (OpenNext cannot build on Windows); the same prove-freshness checks run on the Worker in Plan 04. Assumption A5 (Worker keeps Next's 404 status) is still open.
- Material is unconfirmed against a live item (no live item carries `material` or `details.material` yet).
- Known limit from the plan: with a missed webhook, a sold piece's cached 200 is served until the next webhook, because Next only stores status 200.
- No visual check in a browser (no screenshots); layout classes follow the UI-SPEC but were not eyeballed at 320 to 1280px.
- The gallery, "More from this brand" and brand link on the item page are Plan 02 and 03; the brand label is plain text for now.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model (T-03-01 to T-03-05 mitigated and tested).

## Self-Check: PASSED

Files created exist, commits 3a5299e and e05b5e1 are on the worktree branch.
