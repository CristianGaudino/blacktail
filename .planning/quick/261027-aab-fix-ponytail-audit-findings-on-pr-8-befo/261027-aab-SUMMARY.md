---
phase: quick-261027-aab
plan: 01
status: complete
commits: 3
plan_head_before: a7ae25d
plan_head_after: 6e00acd
completed: 2026-10-27
actuals:
  tasks: 3
  commits: 3
---

# Quick 261027-aab: Fix audit findings on PR #8 Summary

Audit fixes on branch `gsd/phase-02-branded-catalogue`: `cn()` keeps the custom font sizes, search and filter inputs are capped, unbuilt pages are no longer linked, the hover-then-click dropdown bug is fixed, nav landmarks are named, control borders reach 3:1, spacing is back on the scale.

## Commits

- `7fe79d6` Task 1: shared lib fixes (cn, caps, sortEntries, LABEL_MAPS, README Operations)
- `e030bf0` Task 2: nav (isBuilt gate, aria-labels, dropdown, Header warn)
- `6e00acd` Task 3: Olive contrast and spacing. Pushed to `origin/gsd/phase-02-branded-catalogue` (PR #8 updated, nothing merged).

Tests: 150 passing (19 files) before the final commit; lint and typecheck clean at every commit.

## What changed

- **CR-01** `cn()` uses `extendTailwindMerge` with `label`, `heading`, `display` font sizes; `text-label text-ivory` now both survive (tested).
- **CR-02** `CATALOGUE.maxQueryChars` 80 -> 40 and new `maxSelectedPerGroup` 10 (applied in `pickList`, tested with 12 brands). STATE.md's Phase 02 decision "q capped at 80 code points" is now **40**.
- **IN-06** one exported `sortEntries` in `params.ts`, used by `toSearchString` and the API client; `LABEL_MAPS` moved to `src/lib/labels.ts`.
- **Unbuilt links** `BUILT_PAGES` and `isBuilt()` gate ItemCard, NavLink, MobileMenu, Footer and Header brand links. Today only `/` and `/shop` are linked; item cards render as a non-link div. Tests: `isBuilt` cases, ItemGrid asserts the href equals `isBuilt(...)`.
  - The `shortcut:` comment in `src/lib/routes.ts` must be removed in Phase 3 (add `/items`, `/brands`) and Phase 4 (just dropped, about, contact): then delete `BUILT_PAGES` and `isBuilt`.
- **WR-01** `COPY.nav.label = 'Main'` as `aria-label` on both header navs.
- **WR-02** `NavDropdown` `hoverOpened` ref: a hover-opened panel stays open on the following click; a second click closes. Not unit tested (no jsdom).
- **IN-08** Header logs `console.warn('Header: /filters failed', error)`.
- **IN-02 / spacing** Olive (about 5.9:1 on Ivory) for the select border, noscript Sort button, Filter button, swatch rim and slider track; 12px gaps/padding replaced with 8/16; results anchor `scroll-mt-16 lg:scroll-mt-20` equals the header height.

## README Operations note (for the owner)

`README.md` now has "Operations > Rate limit catalogue queries (Cloudflare dashboard)": a rate-limiting rule on `(http.request.uri.path eq "/shop" and http.request.uri.query ne "")`, per IP, 30 requests per minute, Block or Managed Challenge, with fallbacks for plans that only offer 10-second periods or no query-string field. It covers the custom domain only; workers.dev stays reachable until Phase 4 sets `workers_dev` to false. The owner must create this rule in the dashboard.

## Deviations from Plan

- **Stone to Olive deviates from UI-SPEC Color table (line 94)**, which lists Stone for input borders and the swatch rim, in favour of WCAG 1.4.11 (Stone is about 2.1:1 on Ivory). Stone stays on decorative dividers.
- **Trade-off:** the Forest slider fill against the Olive track is about 2.0:1; the Forest thumbs (about 11.9:1) and the text read-out still carry the chosen range.
- **Line endings:** `src/lib/howmany/client.ts` is stored with CRLF in the repo; staged with `core.autocrlf=false` so the diff stays 3 lines instead of the whole file.

Otherwise the plan was executed as written. Excluded as instructed: WR-03 and `src/shop/config.ts` PENDING-OWNER values untouched; `.planning/config.json` untouched.

## Not verified

- Hover-then-click dropdown behaviour in a real browser (no jsdom; covered by lint, typecheck and grep only).
- Visual result of the Olive borders and spacing, and the Cloudflare rule itself (owner action).
- No Worker/CI run locally.

## Known Stubs

None added.

## Self-Check: PASSED

Commits 7fe79d6, e030bf0, 6e00acd exist on the branch; README Operations section, `src/lib/labels.ts` LABEL_MAPS and `BUILT_PAGES` verified present.
