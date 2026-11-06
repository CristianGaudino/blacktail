---
phase: 04-home-and-launch
verified: 2026-11-03T00:00:00Z
status: passed
score: owner-verified; unit tests, local harness and CI covered the rest
covered_files:
  - .github/workflows/ci.yml
  - .github/workflows/deploy-workers.yml
  - .planning/phases/04-home-and-launch/04-01-PLAN.md
  - .planning/phases/04-home-and-launch/04-01-SUMMARY.md
  - .planning/phases/04-home-and-launch/04-02-PLAN.md
  - .planning/phases/04-home-and-launch/04-02-SUMMARY.md
  - .planning/phases/04-home-and-launch/04-03-PLAN.md
  - .planning/phases/04-home-and-launch/04-03-SUMMARY.md
  - .planning/phases/04-home-and-launch/04-04-PLAN.md
  - .planning/phases/04-home-and-launch/04-04-SUMMARY.md
  - .planning/phases/04-home-and-launch/04-05-PLAN.md
  - .planning/phases/04-home-and-launch/04-05-SUMMARY.md
covered_digest: "v3:sha256:5c1ca320a63a1b97dcd22cb79ddf3fc834222cb9f4dc0de2da90d74abddaf922"
---

# Phase 4 Verification

| Area | Evidence |
|---|---|
| Home page: hero, brand strip, Just Dropped carousel, promo banners, category tiles, story band | Unit tests, local harness against the mock, owner check |
| /just-dropped, /about, /contact and the nav links | Unit tests, local harness, owner check |
| Page titles, descriptions, canonical and Open Graph tags | Unit tests, local harness, CI on workerd |
| robots.txt, sitemap and the ALLOW_INDEXING switch | Unit tests, local harness, CI on workerd (flag off and on) |
| Second-shop onboarding (docs/ONBOARDING.md) | onboarding.test.ts |

The owner reviewed the phase after PR #20 was merged and reported it verified. Not proven before launch: `wrangler deploy --var ALLOW_INDEXING` (RESEARCH A1), which only the launch redeploy with the variable set to true proves.
