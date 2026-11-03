---
phase: 02-branded-catalogue
verified: 2026-11-02T00:00:00Z
status: passed
score: 5/5 success criteria; browser checks owner-verified
covered_files:
  - .github/workflows/ci.yml
  - .github/workflows/deploy-workers.yml
  - .planning/phases/02-branded-catalogue/02-01-PLAN.md
  - .planning/phases/02-branded-catalogue/02-01-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-02-PLAN.md
  - .planning/phases/02-branded-catalogue/02-02-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-03-PLAN.md
  - .planning/phases/02-branded-catalogue/02-03-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-04-PLAN.md
  - .planning/phases/02-branded-catalogue/02-04-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-05-PLAN.md
  - .planning/phases/02-branded-catalogue/02-05-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-06-PLAN.md
  - .planning/phases/02-branded-catalogue/02-06-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-07-PLAN.md
  - .planning/phases/02-branded-catalogue/02-07-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-08-PLAN.md
  - .planning/phases/02-branded-catalogue/02-08-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-09-PLAN.md
  - .planning/phases/02-branded-catalogue/02-09-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-10-PLAN.md
  - .planning/phases/02-branded-catalogue/02-10-SUMMARY.md
  - .planning/phases/02-branded-catalogue/02-REVIEW.md
  - .planning/phases/02-branded-catalogue/02-SECURITY.md
  - src/app/shop/page.tsx
  - src/lib/howmany/client.ts
  - src/lib/params.ts
covered_digest: "v3:sha256:686cf2b01b7d16e170d5b36b9791df44f431745dd4fba11c57114ce1bb6e82ee"
behavior_unverified: 0
---

# Phase 2: Branded Catalogue Verification Report

**Phase Goal:** A shopper can browse, filter, search, sort and page through the shop's in-stock pieces in the Blacktail Archive look on desktop and phone.
**Verified:** 2026-11-02
**Status:** passed (owner verified the browser checks by hand; the other evidence is automated)

## What was verified

| Success criterion | Evidence |
|---|---|
| Blacktail Archive look on every page; shop values only in `src/shop/` | Plans 02-02, 02-03: palette, fonts, header, footer; `shop-guard.test.ts` fails if a shop value appears outside `src/shop/`. Owner checked the look in a browser |
| All Items card grid with price, New badge, no layout shift | Plans 02-04, 02-05: `ItemGrid.test.ts`, `money.test.ts`, `dates.test.ts`; CI worker job checks `€12.50` on workerd. Owner checked in a browser |
| Combined filters, search, sort, numbered pages of 24, reset to page 1 | Plans 02-08, 02-09: `params.test.ts`, `FilterPanel.test.ts`, `paging.test.ts`; mock API assertions in `prove-freshness.mjs` |
| Shareable URLs, junk dropped, chips and count, empty state, `noindex, follow` listings with `SITE_URL` canonical | `params.test.ts`, `FilterChips.test.ts`, `seo.test.ts`; CI and deploy smoke steps assert the meta robots tag and the `x-robots-tag` header |
| Phone menu, filter drawer with Apply, no sideways scroll | Plans 02-06, 02-09. Owner checked on a phone-width browser |

## Other checks

| Check | Result |
|---|---|
| Unit tests, lint, typecheck | 151 tests pass on `main`; CI `check` and `worker` jobs green on PRs #8, #10, #11 |
| Code review (`02-REVIEW.md`) | 2 critical and 3 warnings: CR-01, CR-02 (code part), WR-01, WR-02 fixed; WR-03 tracked as issue #9. Dispositions in `02-REVIEW-DISPOSITION.md` |
| Security (`02-SECURITY.md`) | 22 of 22 threats closed, `threats_open: 0`, ASVS 1 |
| UI audit (`02-UI-REVIEW.md`) | 17 of 24, code-only; spacing findings fixed in quick task 261027-aab |
| Audit follow-up | PR #11 (opened groups stay open, card alt text, unused code removed) |

## Known gaps carried forward

- Placeholder email, Vinted and eBay links are live: GitHub issue #9.
- The Cloudflare rate-limit rule for `/shop` is a dashboard step for the owner (README Operations). The `workers.dev` address stays unprotected until Phase 4.
- The browser checks were run by the owner, not by an agent. No screenshots are stored.
- The dropdown hover-then-click fix has no automated test (no jsdom in this project).
