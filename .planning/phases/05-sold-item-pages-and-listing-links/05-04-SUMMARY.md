---
phase: 05-sold-item-pages-and-listing-links
plan: 04
subsystem: ci
tags: [ci, workerd, sold-pages, listings, sitemap, pr]
requires:
  - phase: 05-sold-item-pages-and-listing-links
    provides: Plans 01 to 03 (Sold page, hidden 404, listing buttons, prove-freshness checks, mock)
provides:
  - CI worker assertions for listing buttons and the profile fallback on workerd
  - Indexing-on run that sells MOCK-0002, signs its own webhook and asserts the sitemap, /shop, /just-dropped and home leave it out
  - Phase PR #27 (Closes #13), green, with the "Phase 5 UAT" comment
affects: []
tech-stack:
  added: []
  patterns: [signed webhook from shell with openssl before reading cached output]
key-files:
  created: []
  modified:
    - .github/workflows/ci.yml
key-decisions:
  - "Sitemap exclusion is checked after the step's own signed webhook and a 10 s poll, so earlier cached runs cannot make it pass or fail"
requirements-completed: [SOLD-01, SOLD-02, SOLD-03, SOLD-04, LINK-01, LINK-02]
duration: about 15 min
completed: 2026-11-06
status: complete
actuals:
  tokens: 2500
  tasks: 2
  commits: 1
plan_head_before: 8057d80c4c49578b83efa15750c145547c817d76
plan_head_after: 5c29351301129f19344b9cd352378d24f93f0716
---

# Phase 5 Plan 04: Prove the phase on workerd and hand it over Summary

CI now proves on Cloudflare's runtime that MOCK-0003 shows new-tab "Buy on eBay" and "Buy on Vinted" anchors to the exact listings (no profile panel), MOCK-0001 keeps "Visit us on", and a sold MOCK-0002 leaves the sitemap, /shop, /just-dropped and the home page; PR #27 is open against main and green.

## What was built

- `.github/workflows/ci.yml` (worker job only): listing and fallback assertions in "Item and brand pages on the Worker"; step comment rewritten to name the prove-freshness item-sold, item-sold-bare and item-hidden checks; the indexing-on step resets the mock with `{"status":200,"gone":["MOCK-0002"],"hidden":[]}`, posts an HMAC-signed `store.updated` webhook (204 required), polls the sitemap up to 10 s for MOCK-0002 to vanish, then checks `/shop`, `/just-dropped` and `/` list MOCK-0001 and not MOCK-0002. No existing check was removed or loosened.
- PR #27: https://github.com/CristianGaudino/blacktail/pull/27 (base main, not draft, body has `Closes #13`, "Decisions to check", "Known limits", D-08 "amended by the owner").
- PR comment "Phase 5 UAT": https://github.com/CristianGaudino/blacktail/pull/27#issuecomment-6693722988

## Verification

- Local: `npm test` 309 passed, `npm run lint` and `npm run typecheck` clean.
- CI on the first push: `check` pass (35 s), `worker` pass (1m27s), CodeQL pass. The worker steps "Prove the freshness round trip on the Worker", "Item and brand pages on the Worker", "Prove the outage path on the Worker" and "Indexing on ..." all concluded success, so workerd prints "Sold on 3 November 2026" as node does (the plan's flagged ICU assumption held; `formatDay` needed no change).

## UAT list (also on the PR)

Before merge: owner adds a listing URL to one live piece and marks another sold, then replies with the two codes; check with `curl -s https://www.checkhowmany.com/api/v1/stores/blacktail-archive/items/<code>` against `listings` (`{platform, url}`, https), `soldAt` (YYYY-MM-DD or null), `priceCents` (number or null), sold piece 200 with `status` "sold". A mismatch is fixed in `src/lib/howmany/schemas.ts` first.

After merge: (1) sold page and badge, (2) gone from lists, (3) hidden piece 404, (4) Buy on buttons vs Visit us on fallback, (5) responsive wrap with no sideways scroll, (6) Rich Results SoldOut with noindex and "Sold." description, (7) no-photo sold placeholder with badge.

## Deviations from Plan

**1. [Environment] Phase branch pushed from the agent branch** - the phase branch did not exist on origin, so `git push -u origin HEAD:gsd/phase-05-sold-item-pages-and-listing-links` created it, as the orchestrator instructed. This SUMMARY is committed after the PR was opened (the PR is needed to watch CI); `.md` changes do not trigger CI.

**2. [Observation] `git rev-list` ledger file** - the ledger file under the git dir was not written (the sandbox refused a compound git command); `plan_head_before` is the HEAD recorded at start, 8057d80.

Otherwise: plan executed as written. CI was green first time, so no fix commits.

## Known Stubs

None.

## Threat Flags

None. The new CI steps read no secret beyond the placeholder webhook secret already in the job env and only curl the local Worker (T-05-10, T-05-11 held: nothing weakened).

## Self-Check: PASSED

- FOUND: .github/workflows/ci.yml with the listing, `"gone":["MOCK-0002"]`, `still lists the sold MOCK-0002` and `openssl dgst -sha256 -hmac` checks
- FOUND: 5c29351 (ancestor of HEAD)
