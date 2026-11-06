---
phase: 01-live-stock-skeleton
plan: 03
subsystem: infra
tags: [opennext, cloudflare, wrangler, r2, d1, durable-objects, github-actions, ci]
requires:
  - phase: 01-live-stock-skeleton
    provides: "webhook route, howmany client, env validation, mock-howmany.mjs, prove-freshness.mjs, lint/typecheck/test scripts (plans 01 and 02)"
provides:
  - "open-next.config.ts: R2 incremental cache, plain D1 tag cache, DO queue"
  - "wrangler.jsonc: bindings (ASSETS, WORKER_SELF_REFERENCE, NEXT_INC_CACHE_R2_BUCKET, NEXT_TAG_CACHE_D1, NEXT_CACHE_DO_QUEUE), vars, custom domain route"
  - ".nvmrc 24 and .env.example"
  - "CI: check job (lint, typecheck, tests) and worker job (OpenNext build, wrangler dev, freshness proof, outage proof, missing-env stop)"
  - "PR A open: https://github.com/CristianGaudino/blacktail/pull/6, both jobs green"
affects: [01-04, 04-deploy]
actuals:
  tokens: 9000
  tasks: 2
  commits: 3
plan_head_before: a4f5264b200c4a50f1602f4573337f6a2abd5254
plan_head_after: e9894ef69c6fa07346f8229f5fcfc5c48360a649
tech-stack:
  added: []
  patterns:
    - "Freshness proof runs on workerd (local R2, D1, DO) in CI on every non-draft PR"
    - "Mock How many API on 127.0.0.1 started before the build so any build-time call is counted"
key-files:
  created:
    - open-next.config.ts
    - wrangler.jsonc
    - .nvmrc
    - .env.example
    - .github/workflows/ci.yml
  modified: []
key-decisions:
  - "D1 tag cache used plain (not wrapped) so populateCache creates the revalidations table"
  - "Missing-env check polls the Worker log for up to 15s: the console line lands in the file after the 500 response"
requirements-completed: [FOUND-02, FOUND-04, FOUND-03, DATA-05, DATA-06]
status: complete
---

# Phase 1 Plan 03: Worker config and CI freshness proof Summary

OpenNext on Cloudflare with R2 incremental cache, plain D1 tag cache and DO queue, plus a CI worker job that proves the signed-webhook round trip, the outage path and the missing-secret stop on workerd; PR A is open with both jobs green.

## What was done

- **Task 1 (bf6e394):** `open-next.config.ts`, `wrangler.jsonc`, `.nvmrc`, `.env.example` as specified. Names: Worker `blacktail-archive`, D1 `blacktail-archive-tags` (placeholder id until the owner runs `wrangler d1 create`), R2 `blacktail-archive-opennext-cache`.
- **Task 2 (2738e2c, e9894ef):** `.github/workflows/ci.yml` (`check` and `worker` jobs), branch pushed, PR #6 opened (base main). The CI run on the final commit (run 40347666139) is green:
  - build made zero How many calls (`{"store":0,"items":0}`);
  - `PASS round-trip` in the freshness proof, and `PASS round-trip` + `PASS outage` in the `--outage` run;
  - no `ERROR` line in the Worker log during the non-outage proof;
  - Worker without `HOWMANY_WEBHOOK_SECRET` answers 500 and logs `Invalid environment variables`.

## Research assumption A5

Workerd under `global_fetch_strictly_public` fetched `http://127.0.0.1:4010` without any workaround. The `0.0.0.0` / runner-IP fallback and the CI-only wrangler config were not needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing-env log assertion raced the log flush**
- **Found during:** Task 2, first CI run (40343303224)
- **Issue:** `GET /` returned 500 as wanted, but the immediate `grep "Invalid environment variables" wrangler-bad.log` ran before wrangler wrote the Worker's console output to the file, so the step failed. Everything before it (including both freshness proofs) passed.
- **Fix:** poll the log for up to 15 seconds before failing.
- **Files modified:** `.github/workflows/ci.yml`
- **Commit:** e9894ef

**2. [Plan text] Branch name** - the plan says `gsd/phase-1-live-stock-skeleton`; the real branch is `gsd/phase-01-live-stock-skeleton`. PR #6 uses the real one.

**3. [External] GitHub billing block** - the first run never started until the owner made the repository public. No code change.

## Notes

- `wrangler.log` ends with an esbuild goroutine dump when CI kills the first wrangler (`pkill`) before the missing-env step. It comes after the ERROR check and is harmless.
- The `robots.txt` smoke check stays deferred to Phase 4 (SEO-03), as the plan states.
- The deployed round trip (real Cloudflare) is checked by hand in Plan 04.

## Known Stubs

None.

## Threat Flags

None. CI uses `pull_request` with `contents: read` and a placeholder secret (T-01-13, T-01-14); the round trip fails if the webhook becomes a no-op (T-01-15).

## Self-Check: PASSED

Files open-next.config.ts, wrangler.jsonc, .nvmrc, .env.example and .github/workflows/ci.yml exist; commits bf6e394, 2738e2c, e9894ef are in HEAD; PR #6 checks `check` and `worker` both pass.
