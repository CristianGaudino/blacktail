---
phase: 06-sold-before-brands-spotlight-and-docs
plan: 01
subsystem: home
tags: [spotlight, carousel, home, how-many-api]
requires: []
provides:
  - spotlightFirst ordering for the home Just Dropped carousel (HOME-05)
affects: [home page, mock API, prove-freshness]
tech-stack:
  added: []
  patterns: [Promise.allSettled with a failed read counting as empty]
key-files:
  created:
    - src/components/home/JustDropped.test.ts
  modified:
    - src/lib/homeSections.ts
    - src/lib/homeSections.test.ts
    - src/lib/config.ts
    - src/components/home/JustDropped.tsx
    - scripts/mock-howmany.mjs
    - scripts/prove-freshness.mjs
decisions:
  - "Spotlight pieces are marked by order only: no schema field, no badge, no new copy (D-01)"
status: complete
commits: 2
plan_head_before: 2adfc26
plan_head_after: f5de5f80ed1343c3bcf51b4595654f106226334c
actuals:
  tokens: 9000
  tasks: 2
  commits: 2
requirements-completed: [HOME-05]
---

# Phase 6 Plan 01: Spotlight first in the home carousel Summary

The home Just Dropped carousel now opens with the seller's spotlight pieces (API order), then fills with the newest, no piece twice, capped at 10; /just-dropped is untouched and stays newest first.

## What was built

- `spotlightFirst(spotlight, newest, size)` in `src/lib/homeSections.ts`: first occurrence of each code wins, cut to size. Five unit cases.
- `JustDropped` reads `getItemsPage('spotlight=true', HOME.carouselItems)` and `getItemsPage('')` with `Promise.allSettled`. A rejected read counts as empty and logs its own warning; the section hides only when both give nothing.
- Mock API: boolean `spotlight` on every item (MOCK-0003, MOCK-0015), `?spotlight=true` filter, 400 for any other value.
- `prove-freshness` `home-spotlight` check (mock only): carousel order MOCK-0003, MOCK-0015, MOCK-0001; MOCK-0003 linked once; MOCK-0009 in, MOCK-0010 out; /just-dropped newest first.
- `JustDropped.test.ts` (5 tests): call arguments, spotlight-first order, empty spotlight, failed spotlight (no throw, one warn), both failed hides.
- `itemSchema` is unchanged, so the `spotlight` flag stays stripped (privacy whitelist).

## Verification

- Harness (next build, zero API calls during build, next start, prove-freshness --mock --outage): all checks PASS including `home-spotlight`, `item-sold` and `outage`. Run on ports 3310/4311 because port 3000 was held by another process.
- `npm test` 323 passed, `npm run lint` clean, `npm run typecheck` clean.

## Deviations from Plan

### Environment

**1. [Rule 3 - Blocking] Worktree started on main, without the phase 06 planning files**
- The worktree branch was based on `main` (2adfc26), which lacks `.planning/phases/06-*`. A fast-forward to the phase branch was denied by the permission system, so the plan was read read-only from the main checkout and the code work done on the worktree branch. This SUMMARY creates the phase directory on this branch; the orchestrator merging into the phase branch should expect only this new file there.
- `node_modules` was installed with `npm ci` in the worktree (a junction to the shared one made Turbopack fail with "symlink leaves the filesystem root").

Otherwise the plan was executed as written.

## Known Stubs

None.

## Threat Flags

None. No new endpoint or trust boundary; one extra tagged, cached read with a fixed query.

## Known limits

- RESEARCH A1 (unknown whether toggling a spotlight fires the `store.updated` webhook): the 600 s revalidate is the fallback, so a spotlight change can take up to 10 minutes to show. Plan 04 states it in the PR.

## Self-Check: PASSED

All 7 files exist; commits 5033723 and f5de5f8 are on the branch.
