---
phase: 02-branded-catalogue
plan: 03
subsystem: ui
tags: [template-seam, copy, labels, vitest, guard]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "SHOP { name, locale, bannerImage }, theme.css palette, COPY phase 1 groups (Plans 01, 02)"
provides:
  - "src/shop/config.ts: full SHOP (contact, platforms, socials, newBadgeDays 7, colours)"
  - "src/shop/colours.ts: COLOURS name to hex swatch map (24 colours)"
  - "src/lib/copy.ts: the whole phase's generic COPY deck plus labels.type / department / condition maps"
  - "src/lib/labels.ts: label(code, map) with capitalised fallback"
  - "src/lib/shop-guard.test.ts: fails when a shop value appears in src outside src/shop"
affects: [02-05, 02-06, 02-07, 02-08, 02-09]

actuals:
  tokens: 3300
  tasks: 2
  commits: 2
plan_head_before: 91f19380567e4466fd177693080688adce783f45
plan_head_after: a526a8178bb4007b0981edeaa83543f08e2f0d63

tech-stack:
  added: []
  patterns:
    - "Guard needles are built from SHOP, COLOURS and theme.css at run time and compared lowercased, so the guard follows the config"
    - "Unknown How many codes render through label(), never a crash"

key-files:
  created:
    - src/shop/colours.ts
    - src/lib/labels.ts
    - src/lib/labels.test.ts
    - src/lib/shop-guard.test.ts
  modified:
    - src/shop/config.ts
    - src/lib/copy.ts
    - src/lib/copy.test.ts

key-decisions:
  - "Owner-pending values (email, Vinted, eBay) use .ie domains with pending-owner placeholders, each line marked PENDING-OWNER"
  - "COPY groups.type is 'Category' (mockup sidebar heading) for the API type param"
  - "The fourth mock colour is deliberately absent from COLOURS so the neutral Sand swatch fallback stays provable locally"

requirements-completed: [TMPL-01, SHELL-03]

duration: 5min
completed: 2026-10-26
---

# Phase 2 Plan 03: Template seam Summary

Every Blacktail Archive value now lives in src/shop/, the full generic copy deck and code-label fallback are in place for Plans 05 to 09, and a run-time-built guard test fails if a shop value leaks into src outside src/shop.

## Tasks

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Tracer: shop folder + shop-string guard | c5aae94 |
| 2 | COPY deck, label() and em-dash coverage of SHOP | a526a81 |

## Deviations from Plan

None - plan executed exactly as written. (TDD note: the tracer test and its config were written in one pass before the first run; the test was green on first run, so there is no separate RED commit. The guard's vacuity test proves each needle is caught.)

## Notes for later plans

- TMPL-01 default brand order and category tiles are Phase 4 work (recorded in the plan); flag in the phase PR.
- The legal line uses the © sign the mockup shows; the UI-SPEC writes "(c)".
- Plan 09 adds two slider wording functions to COPY.

## Known Stubs

Email, Vinted and eBay values in src/shop/config.ts are PENDING-OWNER placeholders (intentional, D-05); the owner replaces those three lines. `SHOP.bannerImage` is null (solid Forest panel) by design.

## Threat Flags

None. src/shop/config.ts holds public values only and reads no env (T-02-05).

## Verification

`npm test` (10 files, 72 tests), `npm run lint` and `npm run typecheck` all pass. No Plan 04 file was touched.

## Self-Check: PASSED

Files src/shop/colours.ts, src/lib/labels.ts, src/lib/labels.test.ts, src/lib/shop-guard.test.ts exist; commits c5aae94 and a526a81 are in the branch.
