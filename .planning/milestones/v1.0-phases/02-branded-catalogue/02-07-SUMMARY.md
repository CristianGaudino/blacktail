---
phase: 02-branded-catalogue
plan: 07
subsystem: layout-shell
tags: [footer, social-icons, newsletter-mock, error-screen, tracer]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "SHOP config and COPY.footer/socials (Plan 03), Button/ButtonLink and logo import (Plan 06), ROUTES"
provides:
  - "Footer (server) on every page: logo, socials, Explore, Find us (email, Vinted, eBay), Newsletter mock, legal line"
  - "SocialIcons: config-driven glyphs, a link only when a URL exists"
  - "StatusScreen and the error page in the Blacktail look, with a render test"
affects: [02-08, 02-10]

actuals:
  tokens: 9000
  tasks: 2
  commits: 2
plan_head_before: ebde4efed19881486e4c5d10c2b0f43c9fa78b6e
plan_head_after: 3e0971729f22a8471e7b7c1357255ed1f5a80ecb

tech-stack:
  added: []
  patterns:
    - "Newsletter mock is a plain div with disabled input and button, linked to its note by aria-describedby: no form, no handler, no network call (D-06)"
    - "Inline brand SVG glyphs (lucide has none), links only for configured URLs (D-07)"

key-files:
  created:
    - src/components/layout/Footer.tsx
    - src/components/ui/SocialIcons.tsx
    - src/components/ui/StatusScreen.test.ts
  modified:
    - src/app/layout.tsx
    - src/components/ui/StatusScreen.tsx
    - src/app/error.tsx

key-decisions:
  - "Subscribe button carries its name as aria-label (icon only), matching COPY.footer.subscribe"
  - "Footer legal year read at render with new Date().getFullYear(); the layout is already dynamic because of the header"

requirements-completed: [SHELL-03]
duration: ~30min (interrupted by a rate limit)
completed: 2026-10-26
---

# Phase 2 Plan 07: Footer and error screen Summary

Every page now has the Ivory footer with a Forest top rule (contact, Vinted and eBay from config, Instagram link, mock newsletter), and the error screen uses the Blacktail tokens with a Forest Try again button and a Go home link.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 Tracer: footer | 5fd394e | Built and served on ports 4011/3001: Instagram link, rel noopener noreferrer, newsletter note, aria-describedby, mailto, vinted.ie and ebay.ie all in the rendered /shop; no TikTok link while its URL is null; no form element inside the footer; 112 tests, lint, typecheck pass |
| 2 Error screen (TDD) | 3e09717 | RED run failed (4 of 5), GREEN after restyle; 117 tests, lint, typecheck pass |

## Deviations from Plan

None in scope. One test-regex slip fixed before the Task 2 commit (the anchor's class precedes href in the markup).

## Deferred Issues

- **Button text size lost (Plan 06 code, not touched here):** `cn()` runs tailwind-merge, which does not know the custom `text-label` size and drops it when `text-ivory` or `text-forest` follows. Rendered Button and ButtonLink classes have no `text-label`, so button text falls back to the base size. Fix by registering the custom font sizes in tailwind-merge (`extendTailwindMerge`) in `src/lib/utils.ts`. Outside this plan's files, so not changed.

## Known Stubs

None in this plan's files. The email and the Vinted and eBay URLs rendered by the footer are PENDING-OWNER placeholders in `src/shop/config.ts` (D-05); the newsletter box is an intentional, labelled mock (D-06).

## Threat Flags

None. T-02-12 (newsletter) and T-02-13 (tabnabbing) mitigated as planned: no form, handler or fetch in Footer.tsx; every `target="_blank"` anchor carries `rel="noopener noreferrer"`.

## Not checked

The human checks (1280px and 375px layout against the mockup, screen reader reading of the note, the `next dev` outage screen with Tab focus) were not run. Social glyph paths are hand-drawn approximations, worth a visual look.

## Self-Check: PASSED

Files Footer.tsx, SocialIcons.tsx, StatusScreen.test.ts exist; commits 5fd394e and 3e09717 are on the branch; no servers left running.
