---
phase: 01-live-stock-skeleton
verified: 2026-10-26T17:40:00Z
status: passed
score: 4/6 success checks verified; 2 owner-waived
covered_files:
  - .planning/phases/01-live-stock-skeleton/01-01-PLAN.md
  - .planning/phases/01-live-stock-skeleton/01-02-PLAN.md
  - .planning/phases/01-live-stock-skeleton/01-03-PLAN.md
  - .planning/phases/01-live-stock-skeleton/01-04-PLAN.md
  - .planning/phases/01-live-stock-skeleton/01-01-SUMMARY.md
  - .planning/phases/01-live-stock-skeleton/01-02-SUMMARY.md
  - .planning/phases/01-live-stock-skeleton/01-03-SUMMARY.md
  - .planning/phases/01-live-stock-skeleton/01-04-SUMMARY.md
  - .github/workflows/deploy-workers.yml
  - src/app/api/webhooks/howmany/route.ts
  - src/app/page.tsx
  - src/lib/howmany/client.ts
covered_digest: "v3:sha256:1879487cd71b3e9fb9ea9f8695790d03e61d9ca7e05b3f14f2af169f6ea15275"
behavior_unverified: 0
---

# Phase 1: Live Stock Skeleton Verification Report

**Phase Goal:** Shoppers see the shop's current in-stock pieces on the live site, refreshed within seconds of any stock change.
**Verified:** 2026-10-26T17:40:00Z
**Status:** passed (owner accepted; two live checks waived)

## What was verified

| Check | Evidence |
|---|---|
| A push to main deploys the Worker | `deploy-workers.yml` run on 32e9c56 succeeded, including its smoke step |
| Live site lists real stock from the API | Owner confirmed the live page shows How many stock; site returns 200 |
| Site stays out of search engines | Live `x-robots-tag: noindex, nofollow` |
| Unsigned webhooks are refused | Live unsigned `POST /api/webhooks/howmany` returns 401 |
| Freshness round trip on the Worker runtime | CI `worker` job (run 40347666139 and every later PR run): `PASS round-trip`, `PASS outage`, zero API calls at build |
| Code quality | 43 unit tests, lint, typecheck green; code review WR-01..05 fixed (01-REVIEW-FIX.md); audit findings fixed (5708a01) |

## Owner-waived checks

The owner declined these on 2026-10-26 ("it works, ready for phase 2"). They are proven on workerd in CI but not on the deployed Worker:

1. `scripts/prove-freshness.mjs` against https://www.blacktailarchive.cgaudino.com with the real webhook secret.
2. Real How many webhook round trip (take an item off the store, it disappears within seconds) and the 10-minute fallback with the webhook cleared.

If a sold piece is ever seen lingering on the live site, start with check 2.
