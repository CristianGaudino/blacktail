---
phase: 02-branded-catalogue
plan: 06
subsystem: layout-shell
tags: [header, nav-dropdown, search, mobile-menu, sheet, dialog, next16]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "getFilters (Plan 01), ROUTES, COPY.nav/header/labels and SHOP (Plans 02, 03)"
provides:
  - "Header (server) on every page: logo, Shop and Brands dropdowns from /filters, Just Dropped, About, Contact, no-JS search, decorative icons"
  - "NavDropdown, NavLink, HeaderSearch, MobileMenu"
  - "Sheet (left-sliding dialog shell) and useModalDialog, reused by the filter drawer in Plan 09"
  - "Button, ButtonLink, IconButton primitives; cn and isNavActive"
  - "src/shop/logo.svg tightened (viewBox -2 30 1012 986, Forest fill)"
affects: [02-07, 02-09, 02-10]

actuals:
  tokens: 20000
  tasks: 2
  commits: 2
plan_head_before: 462ce8f02b2a628bf589eee71b65abb95d98feed
plan_head_after: 8dd2d7dcaead0c944e4db34b2892048b2c65beca

tech-stack:
  added: []
  patterns:
    - "Header awaits connection() outside its try, so a build never calls the API and an outage leaves each dropdown with its fixed link"
    - "Disclosure dropdown and details-based GET search: native elements, JS only moves focus and adds hover"
    - "Static svg import through next/image (works under Turbopack, no public/ fallback needed)"

key-files:
  created:
    - src/components/layout/Header.tsx
    - src/components/layout/NavDropdown.tsx
    - src/components/layout/NavLink.tsx
    - src/components/layout/HeaderSearch.tsx
    - src/components/layout/MobileMenu.tsx
    - src/components/ui/buttons.tsx
    - src/components/ui/Sheet.tsx
    - src/hooks/useModalDialog.ts
    - src/lib/utils.ts
    - src/lib/utils.test.ts
    - src/shop/logo.svg
  modified:
    - src/app/layout.tsx
    - src/styles/globals.css

key-decisions:
  - "Logo stays a static import (src/shop/logo.svg); Plan 07's footer reuses the same import form"
  - "Dropdown hover-open only for mouse pointers at 1024px and up; touch uses the click path"

requirements-completed: [SHELL-02, SHELL-04]
duration: 20min
completed: 2026-10-26
---

# Phase 2 Plan 06: Header, dropdowns, search and phone menu Summary

Every page now has the sticky Ivory header with the Blacktail logo, Shop and Brands dropdowns filled from /filters, a search bar that works without JavaScript, honest decorative icons, and on phones a left-sliding menu dialog that locks body scroll.

## Tasks

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Tracer: header with data-driven dropdowns and no-JS search | 435e278 |
| 2 | Phone menu in a left-sliding dialog | 8dd2d7d |

Task 1 was the tracer. Its automated verify (zero build-time API calls, outage on /about, six nav hrefs and search form on /shop, tests, lint, typecheck) was re-run end to end and passed before Task 2 started. The human-check items of both tasks are not covered by an automated run and are deferred to the end-of-phase verification (config `human_verify_mode: end-of-phase`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The logo path carried its own `fill="black"`**
- **Found during:** Task 1 (logo.svg)
- **Issue:** The source svg's single path has `fill="black"`, which would override the Forest fill set on the root, so the logo would render black.
- **Fix:** Changed only that path attribute to `fill="#1F2A1F"` (path data untouched), and also set it on the root as planned.
- **Files modified:** src/shop/logo.svg
- **Commit:** 435e278

**2. [Rule 3 - Blocking] `rm -rf .next/cache/fetch-cache` inside the `bash -c` verify was refused by the safety check**
- **Found during:** Task 1 verify
- **Issue:** The wrapper script could not be checked for dangerous removals. The removal exists so a stale tagged /filters entry cannot hide the outage.
- **Fix:** Ran the same verify from a scratchpad script without the `rm`, and removed `.next/cache/fetch-cache` once as a plain command (a build-output cache dir). Note for future runs: a fetch-cache left by an earlier `/shop` request makes the /about outage check fail until it is cleared (cache entries stay valid for 600 s).
- **Files modified:** none

### Notes

- A zero-call build was asserted by the mock counter: `{"store":0,"items":0}`.
- Added `src/lib/utils.test.ts` (isNavActive, cn): not in the plan, small and cheap.
- Header nav has no `aria-label` (COPY has no main-nav string and `src/lib/copy.ts` is out of this plan's scope).
- The Header's left slot is a `lg:hidden` div wrapping the hamburger, so it drops out of the desktop flex layout.

## Auth gates

None.

## Known Stubs

None. Account, Wishlist and Bag (0) are intentionally decorative (D-08, aria-hidden spans, not focusable, no handlers).

## Threat Flags

None. T-02-11 (Header outage) mitigated by `await connection()` before the try and a caught `getFilters()`; T-02-14 mitigated: `q` only reaches the input as `defaultValue`, no `dangerouslySetInnerHTML`.

## Flagged for the human check

- Logo viewBox was tightened from path coordinates including Bezier control points (8-unit margin). Look at it at 32px and 40px. The tightened box is nearly square (1012 by 986), so at `h-8` the logo is about 33px wide; check it against the mockup.
- Hover-open uses `matchMedia('(min-width: 1024px)')` plus a mouse pointer type; a large touch screen opens on tap.

## Self-Check: PASSED

All created files exist; commits 435e278 and 8dd2d7d are on the branch; tests (112), lint and typecheck pass; ports 3001 and 4011 are free.
