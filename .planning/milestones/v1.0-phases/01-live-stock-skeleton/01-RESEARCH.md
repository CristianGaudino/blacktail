# Phase 1: Live Stock Skeleton - Research

**Researched:** 2026-10-26
**Domain:** Next 16 on Cloudflare Workers (OpenNext 1.20.13): tag-cached read of a third-party JSON API, signed-webhook revalidation, fail-fast env, CI and deploy
**Confidence:** MEDIUM-HIGH. The code paths (Next fetch cache, OpenNext D1 tag cache, `{ expire: 0 }`) were read in source this session and trace end to end. Nothing could be executed on a Worker from this Windows machine, so the deployed round trip is still a plan, not a result.

## User Constraints (no CONTEXT.md exists; no discuss-phase was run)

Treated as locked, copied from `.planning/PROJECT.md` Key Decisions, `.planning/REQUIREMENTS.md` (Out of Scope) and `.claude/CLAUDE.md`:

- Data access only through the How many public API. Cloudflare Workers via OpenNext. Match `C:\Git\vintage` structure and coding principles.
- Cache by tag `store:<slug>`, refreshed by the webhook, with a time-based fallback (about 10 minutes). The webhook is never retried; the rate limit (3000/min per IP) is shared.
- OpenNext: R2 incremental cache + D1 tag cache + Durable Object queue. **No** `cacheComponents`, `'use cache'`, `cacheTag`, `cacheLife` (opennextjs-cloudflare #1450).
- Revalidation contract: every API read is `fetch` with `next.tags` and `next.revalidate: 600`; webhook calls `revalidateTag(tag, { expire: 0 })`; never `updateTag`, `revalidatePath`, `unstable_cache`.
- Pins: Node 24, Next `16.4.1`, React `19.3.0`, `@opennextjs/cloudflare ^1.20.13`, `wrangler ^4.151.3`, Zod `^4.6.7`, Vitest `^5.0.5`, ESLint 9, TypeScript 5.9 (not 7).
- Git rules: never commit to `main`, branch `gsd/phase-1-<slug>`, PR via `gh`, never merge. (Planner: the deploy workflow only runs after the owner merges; see Pitfall 9.)
- Claude's discretion (no CONTEXT.md): everything not listed above, including rendering mode of `/`, file layout inside `src/lib`, test list.
- Deferred (out of scope for this phase): styled UI, header and footer, filters, item page, brands, `src/shop/` seam (Phase 2), robots/sitemap/SEO (Phase 4), custom-domain polish.

## Project Constraints (from .claude/CLAUDE.md)

- Template rule: no shop-specific values in components; per-shop values from env, `wrangler.jsonc` or config. Phase 1 must not hard-code "Blacktail": the page heading comes from `GET /` (`name`).
- Conventions (from Vintage): named exports only, 4-space indent, single quotes, semicolons, `import 'server-only'` first line of server modules, `@/*` alias, `COPY` for all on-screen text (no em dash, enforced by test), `config.ts`, `routes.ts`, `definitions.ts`, colocated `*.test.ts`, money as `...Cents`.
- Build only in CI/Linux (OpenNext cannot build on Windows). `next dev`, `vitest`, `eslint`, `tsc` work locally.
- Read `node_modules/next/dist/docs/` before writing framework code (Next 16 breaking changes: async `params`/`searchParams`, no `middleware`, `revalidateTag` second argument).
- Privacy: show only what the API returns; never log bodies, signatures or the secret.
- CLAUDE.md says "alias `server-only` to `server-only/empty.js`". **That does not work** (see Pitfall 5); use the setup-file mock instead.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Builds with Next 16, deploys to Workers via OpenNext from CI on push to main | Config skeletons below; deploy workflow copied from Vintage; Pitfall 9 (first deploy ordering) |
| FOUND-02 | R2 incremental cache + D1 tag cache + DO queue | `open-next.config.ts` and `wrangler.jsonc` skeletons; **do not wrap the D1 cache in `withFilter`** (Pitfall 1) |
| FOUND-03 | Zod-validated env, clear list of problems | Vintage `env.ts` pattern; `HOWMANY_API_URL` meaning decision (Open Question 2) |
| FOUND-04 | CI runs lint, typecheck, tests, OpenNext worker build | `ci.yml` shape from Vintage plus local D1/R2 round trip against a mock API |
| FOUND-05 | Vintage conventions (`COPY`, `config.ts`, `routes.ts`, `definitions.ts`, feature folders, `ui/`, colocated tests) | Structure below; copy-test pattern from `copy.test.ts` |
| FOUND-06 | Guard test for `cacheComponents`, `'use cache'`, `cacheTag`, `cacheLife` | Guard-test skeleton; comments must not contain the literal tokens |
| DATA-01 | One server-only client, tag `store:<slug>`, 10-minute fallback | Client skeleton; fetch-cache logic verified in `patch-fetch.js` |
| DATA-02 | Lenient Zod schemas | `PublicItem` shape read from Vintage `definitions.ts:840-857`; schema rules below |
| DATA-03 | Errors never cached; last good data kept | Next stores only `res.status === 200` (`patch-fetch.js:707`); client throws on non-2xx |
| DATA-04 | Webhook: HMAC, 5-minute window, constant time, 401 never 500 | WebCrypto `verify` verifier and unit vectors |
| DATA-05 | Valid webhook revalidates `store:<slug>` from env | `{ expire: 0 }` traced through Next and OpenNext to a D1 row; tag write happens after the 204 |
| DATA-06 | No fan-out at build; item pages on demand | Dynamic `/` via `connection()`; mock-API call counter in CI proves zero build calls |
</phase_requirements>

## Summary

The architecture in the project research holds, and the source I read supports the key mechanisms: an explicit `next.revalidate` + `next.tags` fetch stays cached even after `await searchParams`/`connection()` in Next 16.4.1; `revalidateTag(tag, { expire: 0 })` becomes `{ tag, stale: now, expire: now }` in OpenNext, which the D1 tag cache stores as one row per tag and which makes every later cache read for that tag a miss; Next stores only HTTP 200 fetch responses, so an API error can never become the cached value. Rendering `/` on request (not prerendered) on top of that fetch cache removes the build-time snapshot, the runtime-ISR memory leak (#1455) and the need for the queue in the happy path.

Five things in the existing project research are wrong or incomplete and change the plan (details in Pitfalls): (1) wrapping the D1 tag cache in `withFilter` silently skips creating the `revalidations` table, which would make the webhook a silent no-op; (2) the `server-only/empty.js` alias is not importable; (3) `HOWMANY_API_URL` is ambiguous (the address How many shows to the owner includes the slug); (4) the live API returns 404 for `blacktail` today, so there is no store to show yet; (5) the tag write runs after the 204 in `waitUntil`, and the time-based fallback is stale-while-revalidate, so tests must poll and the "10 minutes" wording is "refreshed by the first visit after 10 minutes".

**Primary recommendation:** Build `/` as a request-time render (`await connection()`) over one tagged `fetch` seam; configure R2 + plain `d1NextTagCache` + DO queue; verify the freshness round trip with a deterministic marker (the API response's `Date` header, preserved in the cached fetch) using one Node script run both in CI against a mock API under `wrangler dev` and by hand against the deployed Worker.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Read stock from How many | Frontend Server (Worker, Server Component) | Database/Storage (R2 fetch cache) | Browsers must never call the API (shared 3000/min IP limit, bypasses tag cache) |
| Tag invalidation state | Database/Storage (D1 `revalidations`) | Frontend Server (route handler writes) | Per-isolate memory cannot cross isolates; D1 is the single source |
| Cached API payloads | Database/Storage (R2) | Frontend Server | R2 is strongly consistent across isolates; KV is not |
| Webhook verification | API/Backend (route handler `POST`) | none | HMAC secret is server-only; must answer within 5 s |
| Env validation | Frontend Server (`instrumentation.ts` + first-use) | CI (env tests) | Fail fast with a readable list |
| noindex | Frontend Server (layout metadata + `next.config.ts headers()`) | none | Headers apply to prerendered and dynamic responses (verified on a live OpenNext Worker, see Sources) |
| Build, deploy | CI (ubuntu runner) | Cloudflare (wrangler) | OpenNext cannot build on Windows |

## Standard Stack

Versions were verified with `npm view` on 2026-10-26 and match what runs in `C:\Git\vintage\node_modules` (next 16.4.1, @opennextjs/cloudflare 1.20.13, @opennextjs/aws 4.1.12, wrangler 4.151.3). [VERIFIED: npm registry + C:\Git\vintage\node_modules]

### Core
| Library | Version (pin) | Purpose | Why |
|---------|---------------|---------|-----|
| next | `16.4.1` exact | App Router | Production-proven in Vintage on this adapter; 16.4.3 exists (bug-fix backport, no relevant advisory), take later |
| react / react-dom | `19.3.0` exact | UI | Matches Vintage; 19.3.1 exists, bump later |
| @opennextjs/cloudflare | `^1.20.13` | Adapter | Latest on npm; peer `next >=15.5.28 <16 \|\| >=16.4.1`, `wrangler ^4.148.0` |
| wrangler | `^4.151.3` | Deploy, `dev`, D1/R2 CLI | 4.152.0 is latest; safe |
| zod | `^4.6.7` | Env + API schemas | Vintage convention |
| server-only | `^0.0.1` | Server module marker | Vintage convention |

### Dev
| Library | Version | Purpose |
|---------|---------|---------|
| typescript | `^5` (5.9.3) | Not 7 (typescript-eslint breaks) |
| vitest | `^5.0.5` | Unit tests, `environment: 'node'` |
| eslint | `^9` (9.39.5) + `eslint-config-next` `16.4.1` exact | Copy Vintage `eslint.config.mjs` |
| @types/node `^24.19.2`, @types/react `^19`, @types/react-dom `^19` | | |

**Deliberately not installed in Phase 1** (plain unstyled list): `tailwindcss`, `@tailwindcss/turbopack`, `lucide-react`, `tailwind-merge` (Phase 2 design system), Playwright, Prettier, `@fontsource/*`. Skipping them avoids the `next.config.ts` turbopack CSS rule and `globals.css` until there is something to style.

**Installation:**
```bash
npm i next@16.4.1 react@19.3.0 react-dom@19.3.0 zod@^4.6.7 server-only@^0.0.1
npm i -D @opennextjs/cloudflare@^1.20.13 wrangler@^4.151.3 typescript@^5 vitest@^5.0.5 eslint@^9 eslint-config-next@16.4.1 @types/node@^24.19.2 @types/react@^19 @types/react-dom@^19
```
Copy Vintage's `overrides` block (`miniflare.undici`, `@next/eslint-plugin-next.fast-glob`, plus the glob/esbuild ones if `npm audit` flags them). [ASSUMED: overrides still needed for a fresh lockfile; check `npm audit` after install]

## Package Legitimacy Audit

Run: `gsd-tools query package-legitimacy check --ecosystem npm ...` on 2026-10-26.

| Package | Registry | Weekly downloads | Source repo | Seam verdict | Disposition |
|---------|----------|------------------|-------------|--------------|-------------|
| next | npm | 44.6M | vercel/next.js | SUS (`too-new`: latest dist-tag published 2026-10-23) | Approved: pinned `16.4.1` is the version installed in Vintage |
| react, react-dom | npm | 123M / 116M | react repo | SUS (`too-new`, 2026-10-14) | Approved: pin `19.3.0` is Vintage's |
| @opennextjs/cloudflare | npm | 1.14M | opennextjs/opennextjs-cloudflare | SUS (`too-new`, 2026-10-21) | Approved: `1.20.13` installed in Vintage |
| wrangler | npm | 19.1M | cloudflare/workers-sdk | SUS (`too-new`, 2026-10-22) | Approved: `4.151.3` installed in Vintage |
| zod, vitest, eslint, eslint-config-next, @types/node | npm | 25M to 296M | official repos | SUS (`too-new` only) | Approved: same majors as Vintage |
| server-only | npm | 12.4M | none listed (React-team marker package, 2022) | SUS (`no-repository`) | Approved: used in Vintage |
| typescript, @types/react, @types/react-dom | npm | 97M to 196M | official | OK | Approved |

All SUS reasons are `too-new` (the registry's *latest* release is days old) or `no-repository` for a 2022 React marker package. None has a postinstall flag. Every package is already installed and running in `C:\Git\vintage`. **Planner: add one `checkpoint:human-verify` after `npm ci` ("dependency versions equal Vintage's pins, lockfile committed"), not one per package.**
**Packages removed due to SLOP:** none. **Packages flagged SUS:** listed above, covered by the single checkpoint.

## Architecture Patterns

### System Architecture Diagram

```
Owner edits stock in How many
        |
        v   POST store.updated, headers X-Howmany-Timestamp / X-Howmany-Signature
+--------------------------------------------------------------+
| Worker (OpenNext)                                            |
|  /api/webhooks/howmany  POST                                 |
|    text() -> verifyWebhook (hex, window, WebCrypto verify)   |
|      fail -> 401 empty body                                  |
|      ok   -> parse JSON (fail -> 401) -> store/event match?  |
|               revalidateTag("store:<slug from env>", {expire:0})
|               204   ----(after response, waitUntil)---+      |
|                                                        v      |
|                          D1 NEXT_TAG_CACHE_D1: row (tag, revalidatedAt, stale, expire=now)
|                                                               |
|  GET /  (await connection(): request-time render)             |
|    getStore() + getItems()  -> howmanyFetch                   |
|      fetch(url, {cache:'force-cache', next:{tags, revalidate:600}})
|        R2 NEXT_INC_CACHE_R2_BUCKET get ---- D1 hasBeenRevalidated?
|          hit & fresh -> serve cached body (incl. API Date header)
|          miss / revalidated / stale -> GET How many API -> store only if 200
+--------------------------------------------------------------+
        ^                                   |
        | HTTPS (shared 3000/min IP)        v
   How many public API              HTML (noindex meta + X-Robots-Tag)
```

### Recommended Project Structure (Phase 1 only)
```
.github/workflows/ci.yml            # check job + worker job (local D1/R2 + mock API)
.github/workflows/deploy-workers.yml
public/_headers                     # /_next/static/* immutable (OpenNext migrate writes the same rule)
scripts/mock-howmany.mjs            # CI-only mock API with request counter and mutate endpoint
scripts/prove-freshness.mjs         # signed webhook round trip, used in CI and by hand on the deployed Worker
src/app/layout.tsx                  # <html>, metadata.robots noindex
src/app/page.tsx                    # request-time list (connection())
src/app/error.tsx  global-error.tsx  not-found.tsx
src/app/api/webhooks/howmany/route.ts
src/instrumentation.ts
src/lib/{config,copy,definitions,env,routes,webhook}.ts  (+ *.test.ts)
src/lib/howmany/{client,schemas}.ts (+ tests)
src/lib/data/{store,items}.ts       # get* functions returning definitions.ts types
src/components/stock/ItemList.tsx   # feature folder
src/components/ui/StatusScreen.tsx  # first ui/ primitive (error / empty)
src/test/setup.ts                   # vi.mock('server-only')
src/lib/guard.test.ts               # FOUND-06
open-next.config.ts  wrangler.jsonc  next.config.ts  vitest.config.mts  eslint.config.mjs  tsconfig.json  .nvmrc  .env.example
```
Resolve the path conflict between the older research files: use `src/lib/howmany/` (client, schemas) and `src/lib/data/` (get* functions).

### Pattern 1: Request-time page over a cached fetch (decision)
**What:** `src/app/page.tsx` calls `await connection()` first, then `getStore()` and `getItems()`. No `generateStaticParams`, no `dynamic = 'force-dynamic'`, no `revalidate` segment export. Item routes later: `await params`, no `generateStaticParams` (or `[]`).
**Why (all read in Next 16.4.1 source this session):**
- An explicit `next.revalidate` makes `hasNoExplicitCacheConfig` false, so `autoNoCache` stays false for GET fetches without `authorization`/`cookie` headers, and the fetch is cacheable after request-time APIs (`patch-fetch.js:448`, `:454`). **Do not send those headers.**
- `dynamic = 'force-dynamic'` only sets `workStore.forceDynamic` (`create-component-tree.js:156-157`) and only zeroes fetches with *no* cache config; it is unnecessary here.
- Nothing is fetched at build, so DATA-06 holds by construction, and there is no build-time snapshot to go stale after deploy.
- Avoids runtime ISR renders (leak of about 1.4 MB per render, opennextjs-cloudflare #1455, open as of 2026-10-24). [CITED: github.com/opennextjs/opennextjs-cloudflare/issues/1455]
**Consequence:** the DO queue is configured (FOUND-02) but not exercised by v1 pages; it only matters if a prerendered page with tagged fetches is added later. [ASSUMED: owner is fine with a configured-but-idle queue]

### Pattern 2: One tagged fetch seam
```ts
// src/lib/howmany/client.ts (sketch)
import 'server-only';
import type { z } from 'zod';
import { CACHE } from '../config';
import { storeEnv } from '../env';

export const storeTag = () => `store:${storeEnv().STORE_SLUG}`;

export async function howmanyFetch<S extends z.ZodType>(path: string, schema: S, query = ''): Promise<{ data: z.output<S>; asOf: string | null }> {
    const { HOWMANY_API_URL } = storeEnv();
    const res = await fetch(`${HOWMANY_API_URL}${path}${query && `?${query}`}`, {
        cache: 'force-cache',
        next:  { tags: [storeTag()], revalidate: CACHE.revalidateSeconds },
        signal: AbortSignal.timeout(CACHE.fetchTimeoutMs),
    });
    if (res.status === 404) throw new HowManyNotFound(path);
    if (!res.ok) throw new HowManyError(res.status, path, res.headers.get('retry-after'));
    return { data: schema.parse(await res.json()), asOf: res.headers.get('date') };
}
```
- Send **no custom headers** (headers are part of the fetch cache key; `authorization`/`cookie` disable auto-caching). [VERIFIED: next/dist/docs fetch.md "A request matches on its URL, method, headers, and body"]
- Throw on every non-2xx; never return `[]` for an error. Next stores only `res.status === 200` (`patch-fetch.js:707`), so no error body is ever cached; a failed refresh leaves the old R2 entry untouched.
- Sort query keys before building the string (fixed order) so equal queries share one cache entry.
- `asOf` is the **`Date` header of the API response**. It is stored with the cached body (`createCachedDynamicResponse` stores `headers: Object.fromEntries(cloned1.headers.entries())`, `patch-fetch.js:214`), so it only changes when a real refetch happened. This is the freshness marker used by tests: render it as `<ul data-as-of="...">`.

### Pattern 3: Webhook verifier (WebCrypto, never throws on bad input)
```ts
// src/lib/webhook.ts (sketch, pure and unit-tested)
const HEX64 = /^[0-9a-f]{64}$/i;
const SECONDS = /^\d{1,12}$/;
const enc = new TextEncoder();
const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g)!, byte => parseInt(byte, 16));

export async function verifyWebhook(p: { secret: string; timestamp: string; signature: string; body: string; nowMs?: number }): Promise<boolean> {
    if (!SECONDS.test(p.timestamp) || !HEX64.test(p.signature)) return false;
    if (!(Math.abs((p.nowMs ?? Date.now()) / 1000 - Number(p.timestamp)) < STORE_API.webhookToleranceSeconds)) return false;
    const key = await crypto.subtle.importKey('raw', enc.encode(p.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, fromHex(p.signature), enc.encode(`${p.timestamp}.${p.body}`));
}
```
- Why not the issue #2 sample: `sig.length !== expected.length` compares string lengths, then `Buffer.from(sig)` is UTF-8, so a 64-character signature containing multi-byte characters passes the length check and makes `timingSafeEqual` throw a RangeError (500). The hex guard above removes that class. [CITED: .planning/research/PITFALLS.md Pitfall 7; sample in docs/refs/issues.json issue 2]
- Window rule matches the sample: accept when `|now - ts| < 300`. Test 299 s (accept) and 301 s (reject).
- Route order: `await request.text()` once, verify, **then** `JSON.parse` inside try/catch. Bad signature, bad timestamp, malformed body, non-object body: `new Response(null, { status: 401 })`. Valid signature but `store !== STORE_SLUG` or `event !== 'store.updated'`: 204 without revalidating (log a warning with no body). Tag is always `storeTag()` from env.
- Export only `POST`. A `GET` then gets Next's automatic 405.
- Optional hardening: reject `content-length > 4096` with 401 before reading. [ASSUMED]

### Pattern 4: OpenNext and Wrangler config (the part that must be exact)
```ts
// open-next.config.ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

// Plain d1NextTagCache: NOT wrapped in withFilter (the wrapper renames the cache, so populateCache skips creating the D1 table)
export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache, queue: doQueue, tagCache: d1NextTagCache });
```
```jsonc
// wrangler.jsonc (per-shop file; names below are placeholders to confirm, see Assumptions A1)
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "blacktail-archive",
	"main": ".open-next/worker.js",
	"compatibility_date": "2026-10-01",
	"compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
	"assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
	"services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "blacktail-archive" }],
	"r2_buckets": [{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "blacktail-archive-opennext-cache" }],
	"d1_databases": [{ "binding": "NEXT_TAG_CACHE_D1", "database_name": "blacktail-archive-tags", "database_id": "<from wrangler d1 create>" }],
	"durable_objects": { "bindings": [{ "name": "NEXT_CACHE_DO_QUEUE", "class_name": "DOQueueHandler" }] },
	"migrations": [{ "tag": "v1", "new_sqlite_classes": ["DOQueueHandler"] }],
	"vars": { "STORE_SLUG": "...", "HOWMANY_API_URL": "...", "SITE_URL": "..." },
	"observability": { "enabled": true }
}
```
`HOWMANY_WEBHOOK_SECRET` is a Worker **secret** (`wrangler secret put`), never in `vars`. Plain `vars` live in the file because `wrangler deploy` overwrites dashboard plain variables (Vintage `wrangler.jsonc` comment).

### Anti-Patterns to Avoid
- `withFilter(...)` around the D1 cache, `withRegionalCache`, `bypassTagCacheOnCacheHit`, KV caches (see Pitfalls and CLAUDE.md).
- `dynamic = 'force-dynamic'` or `fetchCache = 'force-no-store'` on any page that reads How many data (turns off the fetch cache).
- Reading `process.env` at module scope (build and cold-start order); call `storeEnv()` lazily.
- Putting any "Blacktail" string in `src/` (heading comes from the API).
- `JSON.parse(body)` before verification; tag taken from the body.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-isolate invalidation | A KV/memory tag registry | OpenNext D1 tag cache (`d1NextTagCache`) | Already writes `{tag, stale, expire}` and checks every cache read |
| Fetch caching | A hand-made R2/KV cache around `fetch` | Next `fetch` options `tags` + `revalidate` | Stale-while-revalidate, locking, 200-only storing already built in |
| HMAC compare | `===` or Buffer-length tricks | `crypto.subtle.verify('HMAC', ...)` after a hex regex | Constant time by contract; no throw path |
| D1 table | Manual SQL in a README | `opennextjs-cloudflare populateCache remote` (creates `revalidations`) | Schema includes `stale`, `expire`, `UNIQUE(tag) ON CONFLICT REPLACE` |
| Env validation | Ad hoc checks | Vintage `env.ts` (`msg()` helper, list of issues, `.env.example` pointer) | Same wording and test pattern |
| Time-based refresh | A cron or a queue consumer | `next.revalidate: 600` on the fetch | The data entry carries its own TTL |

## Runtime State Inventory

Not a rename/refactor/migration phase. Skipped.

## Common Pitfalls

### Pitfall 1: `withFilter` silently disables D1 table creation (new finding)
**What goes wrong:** `ARCHITECTURE.md` recommends `withFilter({ tagCache: d1NextTagCache, filterFn: softTagFilter })`. `withFilter` returns `name: \`filtered-${tagCache.name}\`` (`tag-cache-filter.js:7`). `populateCache` only creates the table in `case D1_TAG_NAME:` (`populate-cache.js:77`), where `D1_TAG_NAME` is `"d1-next-mode-tag-cache"` (`d1-next-tag-cache.js:4`). The filtered name falls to `default` ("Tag cache does not need populating"), so no `revalidations` table exists. Every D1 method wraps its query in `try { ... } catch (e) { error(e); return false }`, so reads return "not revalidated", and `writeTags` has no catch around `db.batch`, so the webhook's deferred write fails in `waitUntil` while the route already returned 204. Result: webhook is a silent no-op.
**How to avoid:** use plain `d1NextTagCache`. The filter is only a read optimisation; the per-request item cache already dedupes D1 reads. If the filter is ever wanted, create the table yourself with the exact `CREATE TABLE` from `populate-cache.js:504`.
**Warning signs:** `Tag cache does not need populating` in the deploy log; `no such table: revalidations` in Worker logs.

### Pitfall 2: Tag write happens after the 204; tests race
`revalidateTag` queues `pendingRevalidatedTags`; the route module turns them into `context.renderOpts.pendingWaitUntil` (`app-route/module.js:226-233`), and OpenNext's `writeTags` writes to D1 in that deferred promise. The 204 can leave before the D1 row exists. A visitor in the next few milliseconds can still get the old cache. **Tests poll** (every 500 ms for up to 10 s) instead of asserting on the first GET after the POST. The user-facing promise stays "within seconds".

### Pitfall 3: The time-based fallback is stale-while-revalidate
After 600 s an entry is stale: the first visit is served the stale body and a background refetch is started (`patch-fetch.js:813-826`, runs in `pendingRevalidates`); the **next** visit sees fresh data. So "a change shows within about 10 minutes" really means "the first visit after 10 minutes triggers the refresh". Low-traffic shops will occasionally show 10 to 20 minute old data once. Acceptable for the stated requirement; do not promise stricter. Manual verification only (waiting 10+ minutes); unit-test that the client passes `revalidate: CACHE.revalidateSeconds`.

### Pitfall 4: `{ expire: 0 }` means a blocking refetch and an error page if the API is down
With `{ expire: 0 }` the D1 `hasBeenRevalidated` returns true (`expire <= now && expire > lastModified`), `getFetchCache` returns `null`, the fetch is a miss, and a failing API produces `error.tsx` instead of stale data. This matches DATA-03 ("last good data or the error page") and the core value ("never chase a sold piece"). The old R2 entry is not replaced by the error. Keep `{ expire: 0 }`; record it once in `config.ts` (`CACHE.webhookRevalidate = { expire: 0 }`). `'max'` would serve stale once after every stock change. [VERIFIED: next docs revalidateTag.md; OpenNext `adapters/cache.js:318-334`]

### Pitfall 5: `server-only/empty.js` cannot be imported
`server-only`'s `package.json` `exports` has only `"."` (`"react-server": "./empty.js"`, `"default": "./index.js"`). `node -e "import('server-only/empty.js')"` in Vintage returns `ERR_PACKAGE_PATH_NOT_EXPORTED`, and the default entry throws. CLAUDE.md's "alias to `server-only/empty.js`" would fail the same way (Vite's resolver was not run to confirm, but it applies `exports`). **Use** `test.setupFiles: ['./src/test/setup.ts']` containing `vi.mock('server-only', () => ({}));` (works for every test file), or alias to an absolute file path.

### Pitfall 6: `HOWMANY_API_URL` is ambiguous
Vintage's Online store panel shows the owner `value={\`${SITE_URL}${ROUTES.api.store(store.slug)}\`}` (`StorePanel.tsx:58`), i.e. `https://www.checkhowmany.com/api/v1/stores/<slug>`. The older architecture notes assumed the env is `.../api/v1` and add `/stores/<slug>`. If the owner pastes the panel value into an env that expects the shorter form, every call 404s. **Recommendation:** define `HOWMANY_API_URL` as exactly what the panel shows (full store base, trailing slash stripped), build URLs as `${HOWMANY_API_URL}/items`, and add a cross-field check in `env.ts`: its path must end with `/stores/${STORE_SLUG}`. That also catches a slug typo, which is the real misconfiguration risk. [ASSUMED: owner intent; confirm in Open Question 2]

### Pitfall 7: Windows cannot build, WSL is not installed
`wsl` exists but listing distros printed only usage text (no distro). All `opennextjs-cloudflare` commands run in CI (ubuntu). Locally: `next dev`, `npm test`, `npm run lint`, `npm run typecheck`. `wrangler login`, `wrangler d1 create` and `wrangler r2 bucket create` run fine on Windows. [VERIFIED: probed this session]

### Pitfall 8: `populateCache` does not create the R2 bucket for an all-dynamic app
`populateR2IncrementalCache` returns early on "No cache assets to populate" (`populate-cache.js:451-453`) before `ensureR2Bucket`. The bucket and D1 database must be created by hand before the first `wrangler deploy`, and `database_id` committed. Use `wrangler d1 create` / `wrangler r2 bucket create` (STACK.md). The D1 table is still created by `populateCache` (separate block, not gated on assets).

### Pitfall 9: The deploy workflow cannot be exercised before it is on `main`
`push` to `main` only fires after the owner merges. [ASSUMED: `workflow_dispatch` also requires the file on the default branch.] Order the work: PR A (scaffold, CI, config, webhook, client; CI worker job proves the round trip locally), then PR B (deploy workflow + Cloudflare resources + secrets). Expect the first deploy run to need a fix-up PR. Human prerequisites before PR B can pass: Cloudflare resources created, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` GitHub secrets (none exist: `gh secret list` returned nothing), `wrangler secret put HOWMANY_WEBHOOK_SECRET`.

### Pitfall 10: Live API returns 404 for the store today
`GET https://www.checkhowmany.com/api/v1/stores/blacktail` and `/items` returned 404 `{"error":"Not found"}` on 2026-10-26 (unknown store, switched off, or different slug). Success criterion 1 needs a real store with at least one item "Show in store" and a webhook URL set. This is an owner action, not code (Open Question 1). Automated tests must use the mock API.

### Pitfall 11: Guard test trips on its own words and on comments
Vintage's `next.config.ts` has a comment containing `cacheComponents`. A grep guard would fail on it. Write "Cache Components" (with a space) in comments, exclude the guard test file itself, and strip `//` and `/* */` comments before matching or simply forbid the tokens everywhere else.

### Pitfall 12: Cloudflare may cache How many's JSON in front of the refetch (LOW)
The API sends `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` on 200s. If Cloudflare's CDN caches that JSON, a webhook-triggered refetch could receive up to 60 s stale data and re-store it. JSON without a file extension is not cached by default [ASSUMED]. First live 200 response: check `cf-cache-status` (expect `DYNAMIC`). If it says `HIT`, the `Date` marker test will expose it (marker advances but content stays old); mitigation is a fixed cache-busting request header (headers are in the cache key, so keep it constant).

## Code Examples

### Env (copy Vintage's `msg()` pattern; lazy)
```ts
// src/lib/env.ts (sketch). Vintage env.ts:9 defines: const msg = (invalid: string) => ({ error: (issue: { input?: unknown }) => (issue.input === undefined ? 'missing' : invalid) });
const serverSchema = z.object({
    STORE_SLUG:             z.string(msg('must be the store address, lowercase letters, digits and hyphens')).regex(/^[a-z0-9-]+$/, 'must be lowercase letters, digits and hyphens'),
    HOWMANY_API_URL:        z.url({ protocol: /^https?$/, ...msg('must be the API address from More > Online store') }),
    HOWMANY_WEBHOOK_SECRET: z.string(msg('must be the webhook secret')).min(16, 'must be at least 16 characters'),
    SITE_URL:               z.url({ protocol: /^https$/, ...msg('must be an https:// URL') }),
}).superRefine(/* HOWMANY_API_URL path must end with /stores/<STORE_SLUG>; strip trailing slash */);
export function storeEnv() { /* safeParse(process.env); throw new Error(`Invalid environment variables:\n  • ...\nSee .env.example.`) */ }
```
`instrumentation.ts` (Vintage): `if (process.env.NEXT_RUNTIME === 'nodejs') { const { storeEnv } = await import('./lib/env'); storeEnv(); }`. OpenNext bundles `process.env.NEXT_RUNTIME` as `"nodejs"` for the server (`bundle-server.js:155`) and copies Worker `env` strings into `process.env` before the handler runs (`init.js populateProcessEnv`), so `register()` sees the vars. `storeEnv()` is also called on first use, so a missing var fails even if `register()` does not fire. Whether `register()` fires on the deployed Worker is proven only by Vintage's behaviour (assumed); add the negative CI check below.

### Lenient item schema (DATA-02)
`PublicItem` as served (Vintage `src/lib/definitions.ts:840-857`, quoted): `code: string; title: string; brand: string; category: CategoryId; type: ItemType | null; size: string; condition: Condition; colour: string; era: string; department: Department | null; measurements: { pitToPitMm: number | null; lengthMm: number | null }; details: ItemDetails; priceCents: number; currency: Currency; photos: { url: string; thumbUrl: string; width: number; height: number }[]; publishedAt: string`.
Schema rules: `z.object({...})` strips unknown keys by default (also enforces the privacy whitelist); `category`, `type`, `condition`, `department`, `currency` are `z.string()` (nullable where above), never `z.enum`; `details: z.record(z.string(), z.unknown())`; `measurements` fields `z.number().nullable()`; list envelope `{ items, page, limit, total }`; store `{ slug, name, currency }`. Do not reject a payload for an extra or new code value.

### Guard test (FOUND-06)
Scan `src/**/*.{ts,tsx}` and `next.config.ts` with `fs.readdirSync(dir, { recursive: true })` (Node 24), skip the guard file, and assert no match for `/\bcacheComponents\b|\bcacheTag\b|\bcacheLife\b|['"]use cache(:[^'"]*)?['"]/`. Optional extras from CLAUDE.md "Do not call": `unstable_cache`, `updateTag`, `revalidatePath`, one-argument `revalidateTag(` (regex `revalidateTag\(\s*[^,()]+\)`).

### Em-dash test
Copy `allText()` from Vintage `src/lib/copy.test.ts` (walks strings, calls wording functions with `'2'`), assert no `—` in `COPY`.

### Vitest config
Vintage `vitest.config.mts` with `@` alias and `include: ['src/**/*.test.ts']`; drop the `.open-next/worker.js` alias; add `setupFiles`.

### CI `worker` job (shape, from Vintage `ci.yml`, plus a mock API)
1. `npm ci`; start `node scripts/mock-howmany.mjs &` on a fixed port (counts requests per path, `POST /__set` mutates the first item's title, `GET /__count` returns counters).
2. `npx opennextjs-cloudflare build` with `HOWMANY_API_URL` pointing at the mock; then `curl /__count`: **must be 0 requests** (DATA-06 build proof).
3. `npx opennextjs-cloudflare populateCache local` (creates the local `revalidations` table; the same step `preview` runs, `preview.js`), then `npx wrangler dev --port 8787 --ip 127.0.0.1` with a `.dev.vars` file (`STORE_SLUG`, `HOWMANY_API_URL`, `HOWMANY_WEBHOOK_SECRET`, `SITE_URL`); wait with `curl --retry-connrefused`.
4. `node scripts/prove-freshness.mjs http://127.0.0.1:8787`: (a) GET `/` twice, equal `data-as-of` and mock item count 1 (cache hit); (b) bad signature, stale timestamp, non-hex 64-char unicode signature, malformed body with valid signature: all 401, never 500; (c) mutate mock, signed POST: 204; poll until `data-as-of` advances and the new title shows; (d) `X-Robots-Tag` and `<meta name="robots">` present on `/`.
5. grep the wrangler log for `ERROR`, and a second run with a missing variable asserting a 500 whose log lists `Invalid environment variables`.
Risk: `global_fetch_strictly_public` may block `127.0.0.1` fetches in local workerd [ASSUMED unknown]. Fallback: keep the flag but run the mock on `0.0.0.0` and use the runner's non-loopback IP, or drop the flag in a CI-only `wrangler.ci.jsonc`. Settle in the first CI run.

### Deploy workflow (copy `deploy-workers.yml`, remove DB/Clerk/e2e)
Steps: checkout, setup-node (`node-version-file: .nvmrc`, cache npm), `npm ci`, `npm test`, `npx opennextjs-cloudflare build`, `npx opennextjs-cloudflare populateCache remote`, `npx wrangler deploy`, wait with `curl -fsS --retry 40 --retry-delay 15 --retry-all-errors`, then unauthenticated smoke: `/` returns 200 with `X-Robots-Tag`, unsigned `POST /api/webhooks/howmany` returns 401. Env: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEXT_TELEMETRY_DISABLED: 1`, `WRANGLER_SEND_METRICS: false`. Do not put the webhook secret in CI; the signed round trip against the deployed Worker is a human-verify step run with the owner's secret.

### noindex (success criterion 6)
Root `layout.tsx`: `export const metadata = { robots: { index: false, follow: false } }`. `next.config.ts`: `async headers() { return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, ...] }]; }`. Add a comment pointing to SEO-03 (Phase 4 makes this environment-dependent). Headers from `next.config.ts` apply on the deployed OpenNext Worker for dynamic and prerendered responses (live check below).

## State of the Art

| Old approach | Current approach | Impact |
|--------------|------------------|--------|
| `revalidateTag(tag)` | `revalidateTag(tag, profile)`; `{ expire: 0 }` from webhooks | One-argument form deprecated; `'max'` is stale-while-revalidate |
| `middleware.ts` | `proxy.ts` (none needed here) | Do not add |
| Sync `params`/`searchParams` | Promises, `await` | Typecheck enforces via `next typegen` |
| `'use cache'` / Cache Components | Not usable on OpenNext today | Guard test; revisit when #1450 and #1464 close |

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Worker `blacktail-archive`, D1 `blacktail-archive-tags`, R2 `blacktail-archive-opennext-cache`, store slug `blacktail` | wrangler skeleton, `.env.example` | Rename only; `WORKER_SELF_REFERENCE.service` must equal the Worker `name` |
| A2 | Owner pastes the panel's full store URL into `HOWMANY_API_URL` | Pitfall 6 | If the shorter form is wanted, change one line in the client and the env check |
| A3 | Account is on Workers Paid (Next bundles exceed the free compressed size limit) and the owner can create a scoped API token (Workers Scripts, D1, R2 edit) | Environment | Deploy fails; human step |
| A4 | Cloudflare does not CDN-cache How many's JSON (`cf-cache-status: DYNAMIC`) | Pitfall 12 | Webhook refetch could return up to 60 s stale data; mitigation named |
| A5 | Local workerd allows `127.0.0.1` fetches under `global_fetch_strictly_public` | CI worker job | CI mock approach needs the fallback |
| A6 | `workflow_dispatch` needs the workflow on the default branch | Pitfall 9 | First deploy can be tested earlier than assumed |
| A7 | `register()` fires on the deployed Worker (Vintage relies on it) | Env | First-use `storeEnv()` still fails fast; criterion 4 stays met |
| A8 | Valid-signature body with a different `store` or other `event` should be 204 no-op, only unparseable bodies 401 | Pattern 3 | Stricter 401 is a one-line change |
| A9 | Configured-but-idle DO queue is acceptable (FOUND-02 is config) | Pattern 1 | If the owner wants the queue exercised, add one prerendered tagged page and a time-based test |
| A10 | Phase 1 can deploy with both `workers_dev: true` and a custom-domain route; owner's workers.dev subdomain exists | Open Question 3 | First deploy fails non-interactively without a registered subdomain |
| A11 | Overrides from Vintage's `package.json` are still needed | Stack | Harmless if kept |

## Open Questions

1. **Is the How many store set up?** The live API 404s for `blacktail`. Owner must create the store (More > Online store), pick the slug, switch it on, mark at least one priced item with a visible photo "Show in store", set the webhook URL to `https://<host>/api/webhooks/howmany` (https only; How many posts with `redirect: 'manual'`, so the URL must not redirect), and copy the secret. Recommendation: make this an explicit human-verify task at the end of the phase; build and test against the mock until then.
2. **`HOWMANY_API_URL` form** (Pitfall 6). Recommendation: full store base as shown in the panel plus an env cross-check with `STORE_SLUG`.
3. **Which URL is "the deployed Worker URL"?** workers.dev (needs the account's workers.dev subdomain registered) or `www.blacktailarchive.cgaudino.com` (custom-domain route; Vintage's comment says Cloudflare creates DNS and certificate, a first deploy waits minutes). Recommendation: both on in Phase 1, `workers_dev: false` in Phase 4; webhook URL uses the custom domain so it never changes.
4. **Where does the `register()`-time failure get seen?** Recommendation: the CI negative check in the worker job.
5. **Time-based fallback strictness.** SWR semantics (Pitfall 3). Confirm "first visit after 10 minutes" is acceptable; a stricter guarantee needs a scheduled Worker, out of scope.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | yes | v24.22.1 | none needed |
| npm | install | yes | 11.19.1 | none |
| gh CLI, authenticated | PRs, secrets, run logs | yes | 2.100.0, account CristianGaudino | none |
| wrangler | D1/R2 creation, secrets | not installed globally | `npx wrangler` resolves from devDependency | none needed |
| WSL / Linux | local OpenNext build | no distro | n/a | CI only |
| GitHub secrets | deploy | none set | n/a | human sets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| Cloudflare login/account access | resource creation | not probed | n/a | human `npx wrangler login` |
| How many store `blacktail` | success criterion 1 and 2 on real data | **no (404)** | n/a | mock API in CI; human setup (Open Question 1) |

**Missing with no fallback:** Cloudflare resources and secrets (human), a live How many store with an item (human).
**Missing with fallback:** local OpenNext build (CI), real API in CI (mock).

## Verification approach

`workflow.nyquist_validation` is `false` in `.planning/config.json`, so the formal Validation Architecture section is omitted. Planner should still schedule:
- Unit (Vitest, `npm test`): `env.test.ts` (every issue listed, `missing` wording, API path/slug cross-check), `webhook.test.ts` (valid; wrong secret; non-hex; 64-char multi-byte signature; empty; stale 301 s; future 301 s; 299 s accepted; tampered body), `howmany.test.ts` with stubbed `fetch` (200, 404, 429 + `Retry-After`, 500, unknown keys, unknown `condition`, passes `tags` and `revalidate: 600`, throws not returns on error), route test (401 never 500, 204 calls `revalidateTag` with `store:<slug>` and `{ expire: 0 }` using `vi.mock('next/cache')`), `copy.test.ts`, `guard.test.ts`.
- CI worker job: steps above (zero build calls, cache hit, 401 matrix, round trip, noindex, env negative).
- Human-verify at end of phase (config `human_verify_mode: end-of-phase`): `node scripts/prove-freshness.mjs <deployed URL>` with the secret from the owner; wait 10+ minutes without a webhook and confirm the `data-as-of` advances on the second visit; real stock change then webhook; check `curl -I` shows `X-Robots-Tag`.

## Security Domain

`security_enforcement: true`, ASVS level 1, block on high.

| ASVS category | Applies | Control |
|---------------|---------|---------|
| V2 Authentication | no user auth | Webhook uses shared-secret HMAC |
| V3 Session | no | none |
| V4 Access Control | minimal | Only `POST /api/webhooks/howmany` is writable; no other mutation surface |
| V5 Input validation | yes | Zod for env and API responses; hex/integer regex on webhook headers; JSON parse after auth |
| V6 Cryptography | yes | WebCrypto `subtle.verify` (never hand-rolled compare); secret min length 16 (How many generates 64 hex chars: `randomBytes(32).toString('hex')`, Vintage `actions/store.ts:33`) |
| V7 Error handling and logging | yes | Empty 401 body; do not log signature, secret or body |
| V13 API | yes | Outbound only to the configured HTTPS API; timeout; no secrets in URLs |
| V14 Configuration | yes | Secret via `wrangler secret put`, `server-only` on env/webhook modules, security headers from `next.config.ts` |

| Threat | STRIDE | Mitigation |
|--------|--------|------------|
| Forged webhook | Spoofing | HMAC over `{ts}.{raw body}`, constant-time verify |
| Replay inside the window | Replay | 300 s window; effect is only an extra revalidation (idempotent, bounded cost) |
| Unicode/length signature crashing the handler | DoS | Hex-64 regex before any crypto |
| Tag chosen by attacker | Tampering | Tag from `STORE_SLUG`, never from the body |
| Unauthenticated flood of the route | DoS | Cheap rejection before any D1 call; Cloudflare platform limits |
| Cache poisoning via API error | Tampering | 200-only cache; throw on non-2xx |
| Secret in logs or client bundle | Info disclosure | `server-only`, no logging of request data |
| Known advisories | n/a | `next 16.4.1`: the `use cache` RCE (<= 16.4.0) and `next/og` (< 16.3.6) advisories do not apply and neither feature is used |

## Sources

### Primary (HIGH)
- Installed Next 16.4.1 source and docs in `C:\Git\vintage\node_modules\next\dist`: `server/lib/patch-fetch.js` (cache decision lines 395-640, stale path 790-830, 200-only store 707, headers stored 214), `server/web/spec-extension/revalidate.js`, `server/revalidation-utils.js`, `server/route-modules/app-route/module.js:226-233`, `server/app-render/create-component-tree.js:156`, docs `revalidateTag.md`, `fetch.md`, `caching-without-cache-components.md`, `connection.md`.
- Installed `@opennextjs/cloudflare@1.20.13` and `@opennextjs/aws@4.1.12`: `overrides/tag-cache/d1-next-tag-cache.js` (NAME line 4, BINDING_NAME line 5), `tag-cache-filter.js:7`, `overrides/incremental-cache/r2-incremental-cache.js:6`, `overrides/queue/do-queue.js:6`, `durable-objects/queue.js:25-28`, `cli/commands/populate-cache.js` (lines 77, 451, 504), `cli/commands/preview.js`, `cli/commands/migrate.js` (public/_headers), `cli/templates/worker.js:10`, `cli/templates/init.js`; aws `adapters/cache.js:318-334`, `utils/cache.js`.
- Vintage repo: `package.json`, `wrangler.jsonc` (lines 8-20), `open-next.config.ts`, `next.config.ts`, `.github/workflows/ci.yml`, `deploy-workers.yml`, `src/lib/env.ts`, `env.test.ts`, `instrumentation.ts`, `copy.test.ts`, `storeWebhook.ts`, `definitions.ts:840-857`, `components/settings/StorePanel.tsx:58`, `vitest.config.mts`, `eslint.config.mjs`.
- `docs/refs/issues.json` issues 1 and 2 (API contract, webhook headers `X-Howmany-Timestamp`, `X-Howmany-Signature`, payload `{ "store", "event": "store.updated", "at" }`).
- Live probes 2026-10-26: `curl` of `https://www.checkhowmany.com/api/v1/stores/blacktail` (404); `curl -I https://www.checkhowmany.com/welcome` (prerendered, `x-nextjs-cache: HIT`, with `x-frame-options: DENY` and `x-content-type-options: nosniff` from `next.config.ts headers()`).
- `npm view` for versions; `gsd-tools query package-legitimacy check`.

### Secondary (MEDIUM)
- https://opennext.js.org/cloudflare/caching (bindings `NEXT_INC_CACHE_R2_BUCKET`, `NEXT_TAG_CACHE_D1`, `NEXT_CACHE_DO_QUEUE`/`DOQueueHandler`, migration tag `v1` with `new_sqlite_classes`, `WORKER_SELF_REFERENCE`; KV not recommended).
- opennextjs-cloudflare issues #1455, #1458, #1295, #1450, #1281 read via `gh` 2026-10-26; `vercel/next.js` releases v16.4.2 and v16.4.3 and security advisories.

### Tertiary (LOW)
- Assumptions A3 to A11 above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (versions and pins verified, identical to a running production app)
- Architecture and cache mechanics: MEDIUM-HIGH (traced in source; not executed on a Worker)
- Pitfalls: HIGH for 1, 2, 4, 5, 8 (read directly in source or run), MEDIUM for 3, 6, 9, 11, LOW for 12
- Deploy and Cloudflare account steps: MEDIUM (not probed)

**Research date:** 2026-10-26
**Valid until:** 2026-11-02 (OpenNext releases every few days; re-check `npm view @opennextjs/cloudflare version` and the tag-cache files before planning if later)
