---
phase: 01-live-stock-skeleton
plan: 04
subsystem: infra
tags: [github-actions, cloudflare-workers, wrangler, opennext, d1, deploy]
requires:
  - phase: 01-live-stock-skeleton
    provides: "Worker config, bindings and CI freshness proof (plan 03), PR A #6"
provides:
  - ".github/workflows/deploy-workers.yml: push to main builds, populates the remote cache, deploys and smoke-checks the Worker"
  - "wrangler.jsonc with the real D1 database_id"
  - "PR B open: https://github.com/CristianGaudino/blacktail/pull/7, checks green"
affects: [04-deploy]
actuals:
  tokens: 1500
  tasks: 2
  commits: 1
plan_head_before: e270ac95e73e2977c4b5eb62d65f042d32d76c18
plan_head_after: 8ef5cc0deca5c3d6ac182be3faa5d36c9901101e
tech-stack:
  added: []
  patterns:
    - "Deploy job runs on push to main only; no Cloudflare token in pull_request runs"
    - "Webhook secret lives only as a Worker secret; CI builds with a labelled placeholder"
key-files:
  created:
    - .github/workflows/deploy-workers.yml
  modified:
    - wrangler.jsonc
key-decisions:
  - "Smoke check is two shell lines (noindex header, unsigned webhook 401) after a curl retry wait for the certificate"
requirements-completed: []  # FOUND-01 and DATA-05 stay open until the owner live checks pass
status: complete
---

# Phase 1 Plan 04: Deploy to Cloudflare Workers Summary

**Deploy workflow (tests, OpenNext build, populateCache remote, wrangler deploy, noindex and webhook-401 smoke) plus the real D1 id, opened as PR B (#7) with green checks; the live round-trip checks wait for the owner to merge A then B.**

## What was done

- **Task 1 (checkpoint:human-action, owner setup):** complete. The owner replied "done" with D1 `database_id` `b1ae8251-3527-4f7f-bedb-15575580c4fe`. Verified read-only by the orchestrator: `gh secret list` shows `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; `wrangler d1 list` shows `blacktail-archive-tags` with that id; `wrangler r2 bucket list` shows `blacktail-archive-opennext-cache`; `wrangler secret list --name blacktail-archive` shows `HOWMANY_WEBHOOK_SECRET`; the store API `/items` returns total = 5.
- **Task 2 (8ef5cc0):** branch `gsd/phase-1-deploy` cut from the phase branch HEAD (`e270ac9`); `wrangler.jsonc` gets the real `database_id` (3-line diff); `deploy-workers.yml` added in Vintage's shape. PR B opened with `--base main`: https://github.com/CristianGaudino/blacktail/pull/7. PR B checks: `check` pass (32s), `worker` pass (1m7s). PR A: https://github.com/CristianGaudino/blacktail/pull/6. Nothing was merged or pushed to main.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Owner's local `wrangler.jsonc` carried wrangler-generated duplicate bindings**
- **Found during:** Task 2, before editing
- **Issue:** The working copy had been rewritten (expanded formatting) and gained two extra `"remote": true` bindings (`blacktail_archive_opennext_cache` R2, `blacktail_archive_tags` D1) that wrangler appended during the owner's setup. They are not in the plan, would add unused bindings to the production Worker, and would have buried the one-line id change in a noisy diff.
- **Fix:** Backed the dirty file up to the session scratchpad, then rewrote `wrangler.jsonc` as the committed version with only the placeholder id replaced and its comment updated.
- **Files modified:** wrangler.jsonc
- **Commit:** 8ef5cc0

**2. [Plan text] Branch name** - the plan says `gsd/phase-1-live-stock-skeleton`; the real phase branch is `gsd/phase-01-live-stock-skeleton`. `gsd/phase-1-deploy` was cut from it as the plan says.

**Total deviations:** 1 auto-fixed (bug), 1 plan-text note. **Impact:** none on scope.

## Pending owner checks (end of phase, after the owner merges PR A then PR B)

Not run by Claude. Merging PR B starts the first production deploy.

1. `gh run list --workflow deploy-workers.yml --limit 1` shows the deploy succeeded (success criterion 1). If it fails, report the log; a fix-up PR is expected (workers.dev subdomain, Workers Paid bundle size, certificate wait).
2. Open https://www.blacktailarchive.cgaudino.com and the workers.dev URL: store name and the shown items with brand, title, price and photo.
3. In Git Bash: `read -s HOWMANY_WEBHOOK_SECRET; export HOWMANY_WEBHOOK_SECRET STORE_SLUG=blacktail-archive; node scripts/prove-freshness.mjs https://www.blacktailarchive.cgaudino.com` prints only PASS lines. Run it twice (re-sending a valid webhook is harmless).
4. In How many, take one shown item off the store: within seconds the next visit no longer lists it.
5. Fallback: clear the webhook URL in How many, change an item, wait 10+ minutes, visit twice: the second visit shows the change. Put the URL back.
6. `curl -sI https://www.blacktailarchive.cgaudino.com/` shows `x-robots-tag: noindex, nofollow`. On `curl -sI https://www.checkhowmany.com/api/v1/stores/blacktail-archive/items`, `cf-cache-status` should be DYNAMIC or absent (research A4); report HIT if seen.

Plan-level must-haves about the deployed Worker (truths 6 to 8) are therefore UNVERIFIED until these run. The automated parts (workflow, id, PR B green) are done.

## Known Stubs

None.

## Threat Flags

None. The deploy token is used only by `deploy-workers.yml` on push to main (T-01-16); the webhook secret is not in the repo or CI (T-01-17); the smoke check asserts an unsigned POST gets 401 (T-01-18).

## Self-Check: PASSED

wrangler.jsonc and .github/workflows/deploy-workers.yml exist; commit 8ef5cc0 is in HEAD; PR #7 is OPEN against main with `check` and `worker` passing.
