---
phase: 02-branded-catalogue
plan: 09
subsystem: catalogue-filters
tags: [filter-panel, swatches, range-slider, drawer, tracer]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "params.ts (shopHref, clearFilters, rangeBounds), CatalogueShell/useCatalogueNavigate (02-08), Sheet and buttons (02-06), SHOP.colours, formatMoney, label()"
provides:
  - "FilterPanel: draft-state GET form in instant (desktop, 250ms debounce) or apply (phone drawer) mode"
  - "FilterGroup, FacetList, ShowMore, splitFacet: details groups, first 8 values, selected always shown"
  - "ColourSwatches: shop-map hex swatches, neutral Sand swatch plus name for unknown colours"
  - "RangeSlider: two overlaid native range inputs, commit on release"
  - "FilterDrawer: Filter button and left Sheet with Apply and Clear all, focus returns to the result count"
affects: [02-10]

actuals:
  tokens: 26000
  tasks: 3
  commits: 3
plan_head_before: 399aa071a0280545584e27d70c6c6cb850fa22ac
plan_head_after: 13a030b66571867809262366d90db41045ba149e

tech-stack:
  added: []
  patterns:
    - "Panel keeps a draft and re-syncs to the URL with the adjust-state-during-render pattern, so open groups and focus survive navigation"
    - "Groups and Show more are native details elements (group/group and group/more named groups), so they work without JavaScript"
    - "Slider commit is a native change listener on the wrapper (React onChange is the input event)"

key-files:
  created:
    - src/components/catalogue/FilterPanel.tsx
    - src/components/catalogue/FilterGroup.tsx
    - src/components/catalogue/FilterPanel.test.ts
    - src/components/catalogue/ColourSwatches.tsx
    - src/components/catalogue/RangeSlider.tsx
    - src/components/catalogue/FilterDrawer.tsx
  modified:
    - src/app/shop/page.tsx
    - src/lib/config.ts
    - src/lib/copy.ts
    - src/styles/globals.css
    - src/components/catalogue/FilterChips.tsx
    - scripts/mock-howmany.mjs

key-decisions:
  - "FilterChips now exports LABEL_MAPS so the panel and the chips share one type/department/condition label table"
  - "A range group is skipped when its floor/ceil bounds are equal (nothing to choose between)"
  - "The no-JS GET form carries q and a non-default sort as hidden inputs, so Apply filters keeps the search and sort"

requirements-completed: [CAT-02, CAT-03, CAT-08]
duration: ~25min
completed: 2026-10-27
---

# Phase 2 Plan 09: Filter panel, swatches, sliders and drawer Summary

/shop has the mockup's filter sidebar (instant, debounced apply, works without JavaScript through a GET form), colour swatches from the shop colour map, two-handle price/pit-to-pit/length sliders that apply on release, and a phone drawer with Apply and Clear all.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 Tracer: checkbox groups, instant apply, no-JS form | b82a72e | 11 tests; built and served on 3000/4010: Filter aside, Show more, size 34 and Acme checked for `?size=34&brand=Acme`, GET form to /shop; lint and typecheck pass |
| 2 Swatches and sliders | da9d925 | tests grew to 145; served: minPrice and maxPitToPitMm inputs, no minLengthMm (null range), Navy title, Ochre name, ranged GET 200; lint and typecheck pass |
| 3 Phone drawer | 13a030b | served: 2 dialogs (menu and filter), lg:hidden button; prove-freshness incl. --outage all PASS; full npm test, lint, typecheck pass |

Tracer gate (config `human_verify_mode: end-of-phase`, auto mode off): Task 1's automated verify was green and re-run end to end before Task 2; its human-check is deferred to end-of-phase verification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Shared label table**
- **Found during:** Task 1
- **Issue:** The panel needs the same type/department/condition label maps FilterChips already defines; copying them would drift
- **Fix:** Exported `LABEL_MAPS` from FilterChips.tsx (one word) and imported it
- **Files modified:** src/components/catalogue/FilterChips.tsx
- **Commit:** b82a72e

**2. [Rule 2 - Missing critical] No-JS form kept search and sort**
- **Found during:** Task 1
- **Issue:** A plain GET form to /shop would drop `q` and a non-default `sort` on Apply filters
- **Fix:** Hidden inputs for both, taken from the draft
- **Files modified:** src/components/catalogue/FilterPanel.tsx
- **Commit:** b82a72e

**3. [Rule 1 - Bug] Zero-width range**
- **Found during:** Task 2
- **Issue:** When /filters min and max fall on one step, the slider percentage maths divides by zero
- **Fix:** The group is not rendered when its bounds are equal
- **Files modified:** src/components/catalogue/FilterPanel.tsx
- **Commit:** da9d925

## Not verified

- No human-check was run (browser). Not exercised in a browser: the 250ms debounce firing one push, focus staying on the checkbox, the dual-thumb sliders (grab, no crossing, release commit), the ring on selected swatches, the drawer opening, Apply/Clear/X/Esc/backdrop behaviour, focus landing on the result count after Apply (it uses requestAnimationFrame after the dialog closes), the 4-per-row swatch wrap at 224px and 320px, and no horizontal scroll at 320px. Only server-rendered HTML, unit render tests, lint, typecheck and prove-freshness were run.
- Keyboard use of a slider commits on every arrow press (native change fires per step), so each press is one navigation; mouse and touch commit once on release.
- The "pressing Apply with an unchanged draft adds no history entry" and "newer change cancels the pending timer" edges are implemented but have no automated test (FilterPanel needs a client router to exercise them).

## Known Stubs

None.

## Threat Flags

None. T-02-18 holds (every URL from the panel or the GET form is re-cleaned by parseCatalogueQuery server-side; range inputs at their bound are dropped there), T-02-19 holds (one 250ms timer for toggles, sliders on release, one push per settled change).

## Notes

- A Windows Python text-mode edit briefly wrote the euro sign as byte 0x80 in the test file; found by the failing tests and fixed to UTF-8 before the Task 2 commit.

## Self-Check: PASSED

All created files exist; commits b82a72e, da9d925 and 13a030b are on the branch.
