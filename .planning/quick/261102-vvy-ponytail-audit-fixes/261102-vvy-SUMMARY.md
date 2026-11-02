---
quick_id: 261102-vvy
status: complete
commits: 2
plan_head_before: 4495323ed2678ce3af3a5fb8be7946b793929914
plan_head_after: af2fac396fd2b87303354899db69bd1ea3003b1c
actuals:
  tasks: 2
  commits: 2
---

# Quick 261102-vvy: Ponytail audit fixes Summary

Six small audit fixes on branch `gsd/ponytail-audit-fixes`; PR https://github.com/CristianGaudino/blacktail/pull/11 (not merged).

## Commits

- 4eb1c43 fix: keep opened filter groups open, empty card image alt, cap the search box
- af2fac3 refactor: drop unused ButtonLink newTab and Sheet footer, one cm() helper

## Changes

- FilterGroup stays open once opened (`wasOpen` state, set during render).
- ItemCard image `alt=""`; ItemGrid tests now assert empty alt plus brand and title text.
- HeaderSearch input has `maxLength={CATALOGUE.maxQueryChars}`.
- Removed `newTab` (ButtonLink) and `footer` (Sheet); grep showed no callers.
- `cm()` in money.ts (+ test) replaces three `String(x / 10)` copies.
- FilterPanel doc comment corrected for no-JS behaviour.

## Deviations from Plan

None. FilterGroup needed no `'use client'` (only imported by client components). The Sheet iOS comment was reworded to drop "and footer".

## Verification

npm test (19 files, 151 tests), lint and typecheck green before each commit. Browser behaviour not checked.

## Self-Check: PASSED
