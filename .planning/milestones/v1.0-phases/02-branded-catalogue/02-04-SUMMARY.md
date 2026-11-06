---
phase: 02-branded-catalogue
plan: 04
subsystem: lib
tags: [money, dates, paging, vitest, pure-functions]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "SHOP.locale (Plan 02), CATALOGUE.pageSize (Plan 01)"
provides:
  - "src/lib/money.ts: formatMoney(cents, currency), the one price formatter"
  - "src/lib/dates.ts: isNew(publishedAt, now, days)"
  - "src/lib/paging.ts: pageCountOf, resolvePage, pageLinks"
affects: [02-05, 02-08, 02-09]

actuals:
  tokens: 1500
  tasks: 2
  commits: 2
plan_head_before: 33bb5c4d926bd9a85ebe23c6de997a9084916d66
plan_head_after: ec79176189e370d1a5388f1d790e79704f036b15

tech-stack:
  added: []
  patterns:
    - "Pure rules with injected inputs (now is an argument), tested first, kept apart from the UI"
    - "Intl.NumberFormat cached per currency and digit count"

key-files:
  created:
    - src/lib/money.ts
    - src/lib/money.test.ts
    - src/lib/dates.ts
    - src/lib/dates.test.ts
    - src/lib/paging.ts
    - src/lib/paging.test.ts
  modified: []

key-decisions:
  - "Fraction digits chosen per amount (0 for whole, 2 otherwise) for both min and max, so 11950 prints €119.50 not €119.5"
  - "pageLinks puts a gap between any two shown numbers that are not adjacent, including a single skipped page"

requirements-completed: [SHELL-05, CAT-10, CAT-07]
duration: 5min
completed: 2026-10-26
---

# Phase 2 Plan 04: Pure catalogue rules Summary

One tested money formatter (en-IE, integer cents, item currency), one New-badge rule with an injected clock, and tested paging helpers (count, past-the-end resolution, pager window) ready for Plan 05's tracer.

## Tasks

1. Money formatter and New-badge rule (7012ffb), RED seen (module not found), then GREEN.
2. Page count, resolvePage and pageLinks (ec79176), RED seen, then GREEN.

Full run: 13 test files, 94 tests pass; lint and typecheck clean.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Issues Encountered

None. Money output was checked on Node 24 only; workerd ICU is covered by the Plan 10 CI worker job (flagged assumption in the plan).

## Self-Check: PASSED

All six files exist and both commits (7012ffb, ec79176) are ancestors of HEAD. No file owned by Plan 03 was touched.
