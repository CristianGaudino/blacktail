---
phase: 01-live-stock-skeleton
plan: 02
subsystem: testing
tags: [vitest, zod, hmac, webhook, error-boundary, eslint, guard-test]
requires:
  - phase: 01-live-stock-skeleton
    provides: "env.ts, webhook.ts, webhook route, howmany client, ItemList from plan 01"
provides:
  - "Vitest harness with a server-only mock in src/test/setup.ts"
  - "src/instrumentation.ts: storeEnv() at server start, one error listing every bad variable"
  - "Unit tests pinning env, webhook verifier, webhook route and client behaviour"
  - "COPY, ROUTES and the first ui primitive StatusScreen; root error.tsx with retry"
  - "Empty store shows COPY.stock.empty inside the data-as-of section"
  - "copy.test.ts (em dash) and guard.test.ts (Cache Components, unstable_cache, updateTag, revalidatePath, one-argument revalidateTag)"
  - "eslint.config.mjs; npm run lint is now live"
affects: [02-shell, 03-ci-worker, ci]
actuals:
  tokens: 6500
  tasks: 3
  commits: 3
plan_head_before: f684c302ff5f8b93c845ba763a8056534e01fad5
plan_head_after: bc83f048e45d091afa053da89141544362744e3d
tech-stack:
  added: []
  patterns:
    - "server-only mocked once in setupFiles (the package has no importable empty.js)"
    - "Guard tests carry a self-check so they cannot pass vacuously"
    - "All on-screen text from COPY; wording functions are called with sample arguments in the em-dash test"
key-files:
  created:
    - vitest.config.mts
    - src/test/setup.ts
    - src/instrumentation.ts
    - src/lib/env.test.ts
    - src/lib/webhook.test.ts
    - src/app/api/webhooks/howmany/route.test.ts
    - src/lib/howmany/client.test.ts
    - src/lib/copy.ts
    - src/lib/routes.ts
    - src/components/ui/StatusScreen.tsx
    - src/app/error.tsx
    - src/lib/copy.test.ts
    - src/lib/guard.test.ts
    - eslint.config.mjs
  modified:
    - src/components/stock/ItemList.tsx
key-decisions:
  - "server-only is mocked in a vitest setup file, not aliased (CLAUDE.md's alias to empty.js is not an exported path)"
  - "Guard test regex for one-argument revalidateTag allows one level of nested parentheses so storeTag() inside a two-argument call is not flagged"
requirements-completed: [FOUND-03, FOUND-05, FOUND-06, DATA-02, DATA-03, DATA-04]
duration: 3min
completed: 2026-10-26
status: complete
coverage:
  - id: D1
    description: "Bad or missing env stops the app with one list of every problem, including the URL/slug cross-check; instrumentation calls storeEnv() at start"
    requirement: "FOUND-03"
    verification:
      - kind: unit
        ref: "src/lib/env.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Webhook verifier and route return 401 for every invalid signature, timestamp, size or body, 204 without revalidation for another store or event, and 204 with revalidateTag(store:<slug>, { expire: 0 }) for a valid one, idempotently"
    requirement: "DATA-04"
    verification:
      - kind: unit
        ref: "src/lib/webhook.test.ts, src/app/api/webhooks/howmany/route.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Client throws HowManyError on 404/429/500, parses leniently, uses the exact cache options and reads env lazily"
    requirement: "DATA-03"
    verification:
      - kind: unit
        ref: "src/lib/howmany/client.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "API down after a webhook shows the COPY error screen and recovers; empty store shows COPY.stock.empty"
    requirement: "DATA-03"
    verification:
      - kind: integration
        ref: "node scripts/prove-freshness.mjs --outage on next start (PASS outage)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Em dash in COPY and Cache Components or forbidden cache calls in src fail npm test; lint and typecheck are clean"
    requirement: "FOUND-06"
    verification:
      - kind: unit
        ref: "src/lib/copy.test.ts, src/lib/guard.test.ts; npm run lint; npm run typecheck"
        status: pass
    human_judgment: false
---

# Phase 1 Plan 02: Hardening Summary

**Vitest harness with 36 tests pinning env, webhook, client, COPY and the Cache Components guard, plus fail-fast instrumentation, COPY-text error and empty-store screens, and a live ESLint config**

## Performance

- **Duration:** about 3 min
- **Completed:** 2026-10-26
- **Tasks:** 3
- **Files modified:** 15 (14 created, `ItemList.tsx` modified)

## Accomplishments

- `src/instrumentation.ts` calls `storeEnv()` when `NEXT_RUNTIME` is `nodejs`; the thrown message lists every invalid variable, and the HOWMANY_API_URL path check against STORE_SLUG still appears when another variable also fails.
- 36 unit tests across env, webhook verifier, webhook route, client, COPY and the guard. All of them passed on the first run against Plan 01's code, so no production fix was needed.
- `error.tsx` renders `StatusScreen` with COPY text, an optional digest reference, a retry button and a home link; it carries no `data-as-of`, so the freshness proof tells an error from data.
- `ItemList` shows `COPY.stock.empty` inside the same `<section data-as-of>` when `items` is empty.
- `guard.test.ts` blocks `cacheComponents`, `cacheTag`, `cacheLife`, the quoted `use cache` directive, `unstable_cache`, `updateTag`, `revalidatePath` and one-argument `revalidateTag(` in src, `next.config.ts` and `open-next.config.ts`.
- `npm run lint` now runs (Plan 01 had no config) and is clean.

## Task Commits

1. **Task 1: env, webhook and route tests, vitest harness, instrumentation** - `8e1f471` (test)
2. **Task 2: COPY, ROUTES, StatusScreen, error.tsx, empty-store message, client tests** - `ba27165` (feat)
3. **Task 3: copy and guard tests, ESLint config** - `bc83f04` (test)

**Plan metadata:** committed with this SUMMARY (docs: complete plan)

## Decisions Made

- `server-only` is mocked once in `src/test/setup.ts` (per RESEARCH Pitfall 5) instead of aliased.
- The one-argument `revalidateTag(` regex tolerates one level of nested parentheses, so `revalidateTag(storeTag(), { expire: 0 })` passes; a test pins that.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guard regex missed `'use cache: remote'`**
- **Found during:** Task 3 (the guard's own self-check failed)
- **Issue:** the quoted-directive pattern allowed `use cache:suffix` but not the space Next uses in `use cache: remote`
- **Fix:** allow optional whitespace after the colon
- **Files modified:** src/lib/guard.test.ts
- **Verification:** `npm test` 36 passed
- **Commit:** bc83f04 (fixed before the Task 3 commit)

**Total deviations:** 1 auto-fixed (a bug in the new test, caught by its self-check). **Impact:** none.

## Issues Encountered

- The empty-store render is covered by the ItemList change only; the mock API has no empty mode, so no running-app proof of the empty message exists yet (the outage proof passed).
- Windows prints LF to CRLF warnings on commit; no content impact.

## Known Stubs

None. `StatusScreen`, `error.tsx` and the empty message are deliberately unstyled; Phase 2 owns the design system.

## Threat Flags

None. T-01-09 to T-01-12 are mitigated by the tests above; `package.json` and `package-lock.json` are unchanged by this plan.

## Next Phase Readiness

- Plan 03 can add CI running `npm run lint`, `npm run typecheck` and `npm test`, which are all green.
- Open: the empty-store screen has no end-to-end proof (needs a mock empty mode), and the OpenNext D1 round trip is still Plan 03's job.

## Self-Check: PASSED

All 14 created files exist; commits `8e1f471`, `ba27165` and `bc83f04` are ancestors of HEAD; `npm test` (36 passed), `npm run lint` and `npm run typecheck` exit 0; the local proof with `--outage` printed PASS for ready, noindex, cache-hit, rejects, ignored, round-trip and outage.

---
*Phase: 01-live-stock-skeleton*
*Completed: 2026-10-26*
