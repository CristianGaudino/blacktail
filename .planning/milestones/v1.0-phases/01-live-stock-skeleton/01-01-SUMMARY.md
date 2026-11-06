---
phase: 01-live-stock-skeleton
plan: 01
subsystem: api
tags: [nextjs-16, zod, hmac, webcrypto, revalidatetag, fetch-cache, how-many]
requires: []
provides:
  - "Next 16.4.1 app scaffold with exact Vintage pins and a committed lockfile"
  - "src/lib/howmany/client.ts: the one tagged, cached fetch seam (getStore, getItems, storeTag, HowManyError)"
  - "GET / request-time item list with a data-as-of freshness attribute"
  - "POST /api/webhooks/howmany: WebCrypto HMAC verification, revalidateTag(store:<slug>, { expire: 0 })"
  - "scripts/mock-howmany.mjs and scripts/prove-freshness.mjs for local, CI and deployed proofs"
affects: [02-shell, 03-ci-worker, 04-deploy, ci, cloudflare]
actuals:
  tokens: 6535
  tasks: 3
  commits: 2
plan_head_before: de1aa2c224cf2ff3faf6a0f652048ea9f76b87b9
plan_head_after: 683f4a7f9f1e16baac99cc9c90a7ab7016004a98
tech-stack:
  added: [next@16.4.1, react@19.3.0, react-dom@19.3.0, zod, server-only, "@opennextjs/cloudflare", wrangler, typescript, vitest, eslint, eslint-config-next@16.4.1]
  patterns:
    - "All API reads via one fetch with cache force-cache, next.tags [store:<slug>], next.revalidate 600 and no custom headers"
    - "Page calls await connection() first, so the build makes zero API calls"
    - "Env read lazily through storeEnv(), never at module scope"
    - "Webhook shape guards (hex-64, 1-12 digit timestamp) run before crypto; every refusal is an empty 401"
key-files:
  created:
    - package.json
    - package-lock.json
    - tsconfig.json
    - next.config.ts
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/components/stock/ItemList.tsx
    - src/lib/config.ts
    - src/lib/env.ts
    - src/lib/definitions.ts
    - src/lib/howmany/schemas.ts
    - src/lib/howmany/client.ts
    - src/lib/webhook.ts
    - src/app/api/webhooks/howmany/route.ts
    - scripts/mock-howmany.mjs
    - scripts/prove-freshness.mjs
  modified:
    - .gitignore
key-decisions:
  - "Package legitimacy (Task 1) approved by the owner before any npm install"
  - "Kept Vintage's @node-minify/core glob override because npm audit flagged 4 high advisories through @opennextjs/cloudflare; audit is now clean"
  - "Webhook refusals log one reason word (size, signature, body) and never the body, headers or secret"
requirements-completed: [DATA-01, DATA-02, DATA-04, DATA-05, DATA-06, FOUND-01, FOUND-03]
coverage:
  - id: D1
    description: "GET / lists the store name and items (brand, title, price, thumbnail with API width/height) from one tagged cached fetch"
    requirement: "DATA-01"
    verification:
      - kind: integration
        ref: "Task 2 automated command (next build with the API unreachable, then next start against the mock): data-as-of equal across views, title present, /items counter 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Build makes zero How many calls and repeat or parallel views are cache hits"
    requirement: "DATA-06"
    verification:
      - kind: integration
        ref: "node scripts/prove-freshness.mjs (PASS cache-hit) plus next build with the mock stopped"
        status: pass
    human_judgment: false
  - id: D3
    description: "A signed store.updated webhook refreshes the list within 10 s; other store or event is a 204 no-op"
    requirement: "DATA-05"
    verification:
      - kind: integration
        ref: "node scripts/prove-freshness.mjs (PASS round-trip, PASS ignored)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Bad signature, old or future timestamp, multi-byte signature, empty, unparseable or malformed body gets an empty 401, GET gets 405, never 500"
    requirement: "DATA-04"
    verification:
      - kind: integration
        ref: "node scripts/prove-freshness.mjs (PASS rejects)"
        status: pass
    human_judgment: false
  - id: D5
    description: "With the API down after a webhook the page shows an error, never stale stock or a cached error, and recovers when the API does"
    requirement: "DATA-05"
    verification:
      - kind: integration
        ref: "node scripts/prove-freshness.mjs --outage (PASS outage)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every response carries X-Robots-Tag noindex and the HTML has a robots noindex meta tag"
    verification:
      - kind: integration
        ref: "node scripts/prove-freshness.mjs (PASS noindex)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Env validation lists every problem, including the HOWMANY_API_URL path and STORE_SLUG cross-check (D-02)"
    requirement: "FOUND-03"
    verification:
      - kind: other
        ref: "Ad hoc run of storeEnv() with empty, valid and three-way-invalid env (no unit test yet; Plan 02 owns env.test.ts)"
        status: pass
    human_judgment: false
duration: 12min
completed: 2026-10-26
status: complete
---

# Phase 1 Plan 01: Live Stock Skeleton Summary

**Next 16 request-time item list over one tagged How many fetch, refreshed by an HMAC-verified `store.updated` webhook (WebCrypto, `revalidateTag(store:<slug>, { expire: 0 })`), proven end to end on `next start` against a mock API**

## Performance

- **Duration:** about 12 min (execution after the Task 1 approval)
- **Started:** 2026-10-26T14:30:00Z (approximate; the start time was not recorded)
- **Completed:** 2026-10-26T14:41:37Z
- **Tasks:** 3 (Task 1 checkpoint approved by the owner, Tasks 2 and 3 committed)
- **Files modified:** 17 (16 created, `.gitignore` modified)

## Accomplishments

- Empty repo became a Next 16.4.1 app with the exact pins from Vintage (next 16.4.1, react and react-dom 19.3.0, eslint-config-next 16.4.1), a committed lockfile and `npm audit` clean.
- One fetch seam (`src/lib/howmany/client.ts`): `force-cache`, tag `store:<STORE_SLUG>`, `revalidate: 600`, no headers, throws `HowManyError` on any non-2xx so an error is never data and never cached.
- `GET /` renders on request (`await connection()` first), so `next build` succeeded with the API unreachable (zero build calls). Repeat and 10 parallel views leave the mock `/items` counter at 1.
- Webhook route: shape guards, WebCrypto `verify`, then body parse; empty-body 401 for every invalid case, 204 for valid-but-other-store/event, tag always from env.
- `prove-freshness.mjs` passes ready, noindex, cache-hit, rejects, ignored, round-trip and outage. It is the script Plans 03 (workerd in CI) and 04 (deployed Worker) reuse.

## Task Commits

1. **Task 1: Package legitimacy check** - no commit (checkpoint:human-verify, `gate="blocking-human"`, approved by owner; 14-package table matched Vintage's installed versions)
2. **Task 2: Tracer, GET / lists live items through the one tagged fetch** - `549e149` (feat)
3. **Task 3: Signed webhook refreshes the list, invalid gets 401** - `683f4a7` (feat)

Tracer feedback gate (Task 2): `human_verify_mode` is `end-of-phase` and the verify is automated-only, so the verify was re-run (passed) and expansion continued.

**Plan metadata:** committed with this SUMMARY (docs: complete plan)

## Files Created/Modified

- `package.json`, `package-lock.json` - exact pins, scripts, engines, overrides (`miniflare.undici`, `@next/eslint-plugin-next.fast-glob`, `@node-minify/core.glob`)
- `tsconfig.json` - copied from Vintage
- `.gitignore` - `.env*` with `!.env.example`, `/.open-next/`, `/.wrangler/`, `.dev.vars*`
- `next.config.ts` - noindex and security headers, unoptimized images
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/stock/ItemList.tsx` - unstyled request-time list with `data-as-of`
- `src/lib/config.ts`, `env.ts`, `definitions.ts` - `CACHE`/`STORE_API`, lazy Zod env, schema-derived types
- `src/lib/howmany/schemas.ts`, `client.ts` - lenient Zod schemas and the fetch seam
- `src/lib/webhook.ts`, `src/app/api/webhooks/howmany/route.ts` - verifier, parser, POST handler
- `scripts/mock-howmany.mjs`, `scripts/prove-freshness.mjs` - mock API and freshness proof

## Decisions Made

- Webhook refusals log one reason word only; body, headers and secret are never logged (threat T-01-06).
- Added Vintage's `@node-minify/core` glob override: `npm audit` flagged four high advisories (glob via `@opennextjs/aws`), the plan allowed adding it in that case. The esbuild override was not needed.
- The mock returns `limit: 100` regardless of the request; the real API echoes the request. Harmless to the proofs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added the glob override from Vintage**
- **Found during:** Task 2 (npm install)
- **Issue:** `npm audit` reported 4 high severity vulnerabilities through `@node-minify/core` -> `glob`
- **Fix:** added `overrides["@node-minify/core"].glob = "^10.5.0"` as the plan anticipated ("add the glob/esbuild ones only if npm audit flags them")
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm audit` reports 0 vulnerabilities
- **Committed in:** 549e149

---

**Total deviations:** 1 auto-fixed (1 blocking, anticipated by the plan)
**Impact on plan:** none; this is the conditional step the plan described.

## Issues Encountered

- No `eslint.config.mjs` exists yet, so `npm run lint` was not run (not part of this plan's verification; Plan 02 copies Vintage's config). `npm run typecheck` passes.
- npm prints an `install-scripts` warning for esbuild, unrs-resolver and workerd postinstalls; nothing was approved or changed.
- Git prints LF to CRLF warnings on Windows for new files; no content impact.

## Known Stubs

None. The empty-stock message and error screens (D-08) are not in this plan (no `COPY`, `error.tsx` yet), so with zero items the list renders an empty `<ul>`. Plan 02 owns them.

## Threat Flags

None beyond the plan's threat model. The new network surface (`POST /api/webhooks/howmany`) is T-01-01 to T-01-03 and T-01-08, each mitigated as planned.

## User Setup Required

None for this plan. Cloudflare, GitHub secrets and the How many webhook URL are owner steps in the deploy plan (D-04).

## Next Phase Readiness

- Plan 02 can add `COPY`, `error.tsx`, env/webhook/client unit tests, `.env.example`, `instrumentation.ts`, eslint and vitest config on top of this seam.
- Plan 03 can run `prove-freshness.mjs` under workerd; Plan 04 against the deployed Worker (without `--mock`).
- Open risk (unchanged from research): the proof ran on `next start`, not on D1/R2 tag cache; the OpenNext round trip is still unproven until Plan 03.

## Self-Check: PASSED

All 16 created files exist on disk; commits `549e149` and `683f4a7` are ancestors of HEAD; Task 2 and Task 3 automated commands exit 0 and all acceptance greps pass.

---
*Phase: 01-live-stock-skeleton*
*Completed: 2026-10-26*
