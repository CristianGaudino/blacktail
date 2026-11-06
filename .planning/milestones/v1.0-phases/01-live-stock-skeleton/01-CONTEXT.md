# Phase 1: Live Stock Skeleton - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

A deployed Cloudflare Worker (Next 16 + OpenNext, R2 incremental cache, D1 tag cache, DO queue) that lists the shop's current in-stock items from the How many API as a plain, unstyled page. The page stays fresh through the signed `store.updated` webhook (`revalidateTag`), with a 10-minute time-based fallback. Zod env validation, CI (lint, typecheck, tests, worker build, Cache Components guard, em-dash guard) and `noindex` on every page are included. Styling, filters, item pages and brands belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Store & API URL setup
- **D-01:** Store slug is `blacktail-archive` (`STORE_SLUG=blacktail-archive`). The owner set it up in How many on 2026-10-26. This supersedes the `blacktail` slug in 01-RESEARCH.md (A1, Pitfall 10, Open Question 1).
- **D-02:** `HOWMANY_API_URL` holds the full store URL exactly as How many's Online store panel shows it (`https://www.checkhowmany.com/api/v1/stores/blacktail-archive`, trailing slash stripped). The client builds `${HOWMANY_API_URL}/items` and similar. `env.ts` has a cross-field check: the URL path must end with `/stores/${STORE_SLUG}`, otherwise startup fails with a clear message.
- **D-03:** The live store is up: `GET .../stores/blacktail-archive` returned 200 on 2026-10-26, and `/items` returned `{"items":[],"page":1,"limit":24,"total":0}`, so there are no items marked "Show in store" yet. Before success criterion 1 and 2 are human-verified, a **human checkpoint** has the owner mark at least one priced item with a photo "Show in store" and confirm `/items` returns `total >= 1`. Work that relies on real data waits for that. Automated tests and CI always use a mock API. The CI worker job may use the real slug and URL as non-secret build env.
- **D-04:** The owner does **all** Cloudflare and GitHub setup by hand: `wrangler login`, `wrangler d1 create`, `wrangler r2 bucket create`, a scoped API token, the GitHub secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`, `wrangler secret put HOWMANY_WEBHOOK_SECRET`, and the webhook URL plus secret in How many. The plan gives exact commands and values as a human checkpoint, and the owner returns the D1 `database_id` to commit.

### Skeleton page & webhook edges
- **D-05:** Each list item shows brand, title, price and the `thumbUrl` thumbnail (with API width/height). There is no styling beyond defaults. Price uses integer cents and the store's currency through a minimal formatter (Phase 2 owns the full money formatter, SHELL-05).
- **D-06:** Freshness is observable through a hidden `data-as-of` attribute on the list (the time the cached data was fetched). It is not shown as visible text. The freshness test and `prove-freshness` script read it.
- **D-07:** A webhook with a valid signature, a valid timestamp and a parseable body, but a different `store` or an event other than `store.updated`, gets **204 and is ignored** (no revalidation). Only a bad signature, an old timestamp or an unparseable or malformed body gets 401. Nothing returns 500.
- **D-08:** With zero in-stock items, the page shows a plain message from `COPY`. With the API down and nothing cached, a minimal `error.tsx` shows a `COPY` message. Both are unstyled until Phase 2.

### Claude's Discretion (owner skipped these areas; follow 01-RESEARCH.md recommendations)
- Deploy URL: `workers_dev: true` and the custom domain route `www.blacktailarchive.cgaudino.com` are both on in Phase 1. The How many webhook URL uses the custom domain (`https://www.blacktailarchive.cgaudino.com/api/webhooks/howmany`, no redirects). `workers_dev` is turned off in Phase 4.
- PR order: PR A covers scaffold, CI, config, client, webhook and the worker-job round trip against the mock. PR B covers the deploy workflow and Cloudflare wiring, after the owner's setup (deploy only runs once merged to `main`).
- Resource names (research A1): Worker `blacktail-archive`, D1 `blacktail-archive-tags`, R2 `blacktail-archive-opennext-cache`. `WORKER_SELF_REFERENCE.service` must equal the Worker name.
- Webhook revalidation uses `revalidateTag(tag, { expire: 0 })` (blocking refetch; error page rather than stale data if the API is down), recorded once in `config.ts`.
- The time-based fallback is stale-while-revalidate: the first visit after 10 minutes triggers the refresh. This is accepted.
- The DO queue is configured (FOUND-02) but idle, because the page renders at request time over a cached fetch.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase research and project
- `.planning/phases/01-live-stock-skeleton/01-RESEARCH.md`: patterns, pitfalls (D1 table and `withFilter`, tag write after the 204, `server-only` mocking, no Windows build), wrangler/open-next config, CI worker job shape
- `.planning/PROJECT.md`: constraints, key decisions, `SITE_URL`
- `.planning/REQUIREMENTS.md`: FOUND-01..06, DATA-01..06
- `.planning/ROADMAP.md` (Phase 1): success criteria 1 to 6
- `.claude/CLAUDE.md`: stack versions, cache topology, revalidation contract, git rules

### How many API contract
- `docs/refs/issues.json`: issue #1 (technical split) and issue #2 (API endpoints, webhook signature, timestamp window, rate limit)

### Reference codebase (conventions)
- `C:\Git\vintage\.planning\codebase\CONVENTIONS.md` and `STRUCTURE.md`: structure and coding style
- `C:\Git\vintage\src\lib\env.ts`, `next.config.ts`, `wrangler.jsonc`, `open-next.config.ts`, `.github/workflows/ci.yml`, `deploy-workers.yml`, `eslint.config.mjs`, `vitest.config.mts`: files to copy and adapt (see the CLAUDE.md "What NOT to Use" list for what to change)
- `C:\Git\vintage\src\components\store\StorePanel.tsx:58`: source of the panel URL form (D-02)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None in this repo yet (greenfield: no `src/`, no `package.json`). Reuse comes from `C:\Git\vintage`: env `msg()` pattern, CI/deploy workflows, eslint/vitest/tsconfig, fonts (later phases).

### Established Patterns
- Vintage conventions: `COPY` in `src/lib/copy.ts`, `config.ts`, `routes.ts`, `definitions.ts`, named exports, 4-space indents, single quotes, `import 'server-only'`, colocated `*.test.ts`.

### Integration Points
- How many public API (`/`, `/items`) and its `store.updated` webhook → `src/app/api/webhooks/howmany/route.ts`.
- `public/brands/*.svg` exist but are unused in Phase 1 (an uncommitted rename `arc-teryx.svg` → `arcteryx.svg` is in the working tree).

</code_context>

<specifics>
## Specific Ideas

- The `data-as-of` attribute should survive into Phase 2 styling, so the freshness proof keeps working after the redesign.

</specifics>

<deferred>
## Deferred Ideas

None. Discussion stayed within phase scope.

</deferred>

---

*Phase: 01-live-stock-skeleton*
*Context gathered: 2026-10-26*
