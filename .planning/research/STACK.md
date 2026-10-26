# Stack Research

**Domain:** Headless second-hand clothing storefront (template, one deploy per shop) on Next.js 16 + Cloudflare Workers via OpenNext, reading the read-only How many REST API
**Researched:** 2026-10-26
**Confidence:** HIGH for versions and the cache topology (read from the installed `@opennextjs/cloudflare` 1.20.13 source and Next 16.4.1 docs in `C:\Git\vintage\node_modules`); MEDIUM for webhook-to-D1 behaviour end to end (must be proven by a test in the first phase, see "Prove it" below)

## Headline decisions

1. **Mirror `C:\Git\vintage` versions exactly** (Next 16.4.1, React 19.3.0, OpenNext 1.20.13, Wrangler 4.151.3, Vitest 5.0.5, Tailwind 4.3.3, Zod 4.6.7, TypeScript 5.9.x, ESLint 9, Node 24). Drop everything data/auth related (no Clerk, Drizzle, Neon, Blob/R2 SDK, PGlite, Playwright, dnd-kit).
2. **Cache Components is OFF. Do not use `'use cache'` / `cacheTag` / `cacheLife`.** Vintage's own `next.config.ts` says OpenNext on Workers cannot run them yet, and that is still true today: opennextjs-cloudflare issue #1450 (HTTP 500s and worker hangs with Cache Components on Next 16.3.8/16.4.0, still reproducing 26 Oct 2026), PR #1318 (staged-render fix) is open, issue #1464 (`use cache` dedupe hangs on 16.4) is open. Use **`fetch(url, { next: { tags: ['store:<slug>'], revalidate: 600 } })`** and `revalidateTag` instead. This is exactly what the API spec in issue #2 wants anyway.
3. **On-demand tag revalidation needs a tag cache, and Vintage's `open-next.config.ts` does not have one.** Vintage only sets `incrementalCache: r2IncrementalCache`; `defineCloudflareConfig` defaults `tagCache` and `queue` to `"dummy"`, so `revalidateTag` there is a silent no-op. Blacktail must not copy that file as is. Use **R2 incremental cache + D1 tag cache (`d1NextTagCache`) + Durable Object queue (`doQueue`)**, which is OpenNext's documented recipe for a small site.
4. **Images: `images.unoptimized: true`**, keep using `next/image` for `width`/`height`/lazy/priority. The API already supplies `thumbUrl` (grids) and `url` (item page) plus intrinsic size. No Cloudflare Images loader or binding in v1.
5. **Fonts: two committed files** under `src/fonts/` loaded with `next/font/local`: Bodoni Moda 700 (latin, 15 KB, from `@fontsource/bodoni-moda@5.3.0`) and Montserrat variable (copy Vintage's `Montserrat-Variable.woff2`, 38 KB).
6. **Builds cannot run on Windows** (Vintage's deploy workflow says so). `next dev`, `vitest`, `eslint`, `tsc` work locally; `opennextjs-cloudflare build/preview` run in GitHub Actions (ubuntu) or WSL.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Node.js | 24 (`.nvmrc` = `24`, `engines` `>=24 <25`) | Runtime for dev, CI, build | Same as Vintage. Vitest 5 needs `^22.12 \|\| ^24 \|\| >=26`. Keep `@types/node` on the same major (`^24.19.2`) | HIGH |
| Next.js | `16.4.1` (exact pin) | App Router framework | Pinned exactly in Vintage and proven in production on this adapter. OpenNext 1.20.13 peer range is `>=15.5.28 <16 \|\| >=16.4.1`. npm `latest` is 16.4.3: take it later as a deliberate bump once the CI worker smoke test (below) passes on it | HIGH |
| React / react-dom | `19.3.0` (exact pin) | UI | Matches Vintage. npm latest is 19.3.1, same "bump deliberately" rule | HIGH |
| TypeScript | `^5` (resolves 5.9.x) | Types | **Do not take npm `latest` 7.0.2.** `typescript-eslint` 8.71 (pulled in by `eslint-config-next`) declares `typescript >=4.8.4 <6.1.0`, so TS 7 breaks lint | HIGH |
| @opennextjs/cloudflare | `^1.20.13` | Adapter that turns the Next build into a Worker | Current latest (21 Oct 2026). Provides R2/KV/D1/DO cache overrides. Releases roughly every 3 to 5 days, so lock via `package-lock.json` and bump with the worker smoke test | HIGH |
| wrangler | `^4.151.3` | Deploy, local Worker runtime, D1/R2 CLI | Adapter peer is `^4.148.0`; latest is 4.152.0. Needs `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]` and a 2026 `compatibility_date` (Vintage: `2026-10-01`) | HIGH |
| Tailwind CSS | `^4` (4.3.3) + `@tailwindcss/turbopack` `^4` | Styling, design tokens via `@theme` | Same as Vintage. Turbopack needs the `rules: { "*.css": { loaders: ["@tailwindcss/turbopack"] } }` block in `next.config.ts` (copy from Vintage) | HIGH |
| Zod | `^4.6.7` | Env validation (`src/lib/env.ts`), API response parsing | Vintage convention; also use it to parse API responses (ignore unknown fields, per the "fields only ever added" contract) | HIGH |

### Cloudflare cache topology (the question that matters)

What each piece does in OpenNext, and what to bind:

| Layer | Choice | Binding (wrangler) | Why |
|-------|--------|--------------------|-----|
| Incremental cache (stores `fetch` data cache entries and prerendered pages) | **R2** via `@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache` | `r2_buckets`: `NEXT_INC_CACHE_R2_BUCKET` | R2 is strongly consistent, so a value written by one isolate is read by all. Vintage already uses it. **Not KV**: OpenNext's own docs call KV eventually consistent and do not recommend it. **Not static-assets cache**: read-only, no revalidation |
| Tag cache (what `revalidateTag` writes to, and what every cache read checks) | **D1** via `@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache` | `d1_databases`: `NEXT_TAG_CACHE_D1` | This is the piece that makes the webhook work across isolates and colos: `revalidateTag` writes a row `(tag, revalidatedAt, stale, expire)` in D1, and every incremental-cache read compares the entry's `lastModified` with that row (`hasBeenRevalidated` / `isStale`). Source of truth is one database, not per-isolate memory. A shop has a handful of tags (`store:<slug>` plus Next's internal ones), so D1 is far under its limits and cheaper than Durable Objects. OpenNext docs: D1 for small sites, sharded DO for large |
| Queue (time-based ISR revalidation, de-duplicated) | **Durable Object queue** via `.../queue/do-queue` | `durable_objects.bindings`: `NEXT_CACHE_DO_QUEUE` -> `DOQueueHandler`, plus `migrations: [{ "tag": "v1", "new_sqlite_classes": ["DOQueueHandler"] }]` | Without it (default `"dummy"`), a stale statically generated page (home, brands, a `revalidate = 600` page) is never regenerated in the background. This is the "time-based fallback if the webhook is missed" requirement. Memory queue is per isolate and "not fully suitable for production" per OpenNext |
| Self reference | service binding `WORKER_SELF_REFERENCE` with `service` equal to the Worker `name` | `services` | Used by the queue to call the Worker back to re-render. Name must match exactly or revalidation silently fails |

`open-next.config.ts`:

```ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';
import { withFilter, softTagFilter } from '@opennextjs/cloudflare/overrides/tag-cache/tag-cache-filter';

export default defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
    queue: doQueue,
    // We only call revalidateTag, never revalidatePath, so drop Next's internal "_N_T_" soft tags
    // and save a D1 query per cache read (shortcut: add them back if revalidatePath is ever used)
    tagCache: withFilter({ tagCache: d1NextTagCache, filterFn: softTagFilter }),
});
```

`wrangler.jsonc` (per-shop; `name` and resource names change per deploy):

```jsonc
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "blacktail-archive",
    "main": ".open-next/worker.js",              // exports DOQueueHandler; do not wrap it like Vintage's cloudflare-worker.js unless you re-export the DO classes
    "compatibility_date": "2026-10-01",
    "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
    "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
    "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "blacktail-archive" }],
    "r2_buckets": [{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "blacktail-archive-opennext-cache" }],
    "d1_databases": [{ "binding": "NEXT_TAG_CACHE_D1", "database_name": "blacktail-archive-tags", "database_id": "<uuid from wrangler d1 create>" }],
    "durable_objects": { "bindings": [{ "name": "NEXT_CACHE_DO_QUEUE", "class_name": "DOQueueHandler" }] },
    "migrations": [{ "tag": "v1", "new_sqlite_classes": ["DOQueueHandler"] }],
    "vars": { "STORE_SLUG": "blacktail", "HOWMANY_API_URL": "https://www.checkhowmany.com/api/v1" },
    "observability": { "enabled": true }
    // HOWMANY_WEBHOOK_SECRET: `wrangler secret put`, never in this file
}
```

Facts verified in the installed adapter source:
- `opennextjs-cloudflare populateCache` creates the D1 `revalidations` table itself when it sees the D1 tag cache and a `NEXT_TAG_CACHE_D1` binding (no manual SQL). The binding needs a real `database_id`, so create the D1 database and R2 bucket once with `wrangler d1 create` / `wrangler r2 bucket create` and commit the id (an id is not a secret).
- Cache keys and tag rows are prefixed with the build id, so each deploy starts with a clean cache and old R2 objects pile up. Add an R2 lifecycle rule on prefix `incremental-cache/` (expire after about 30 days).
- Next 16 tag objects carry `stale` and `expire`; the D1 override supports both (columns added in adapter v1.19).

**What not to add (and why):**
- `withRegionalCache` (Cache API wrapper over R2): not in v1. It adds a per-colo copy that can serve a prior value for up to 30 minutes in `long-lived` mode, which fights "always current". Revisit only if R2 latency shows up in measurements.
- `bypassTagCacheOnCacheHit`: open issue #1295 "serves stale entries after on-demand revalidateTag". Never enable.
- `doShardedTagCache` (sharded DO tag cache): for large sites; open issue #1103 reports a very large Durable Object request and duration bill. Overkill for one shop.
- KV tag cache (`kv-next-tag-cache`): eventually consistent, so a webhook could take up to a minute to be visible in other colos.
- `cachePurge` and `enableCacheInterception`: need a zone and add moving parts. Not needed.
- Cloudflare Queues / `NEXT_TAG_CACHE_DO_SHARDED_DLQ`: only for the sharded DO option.

### Revalidation contract (what the code must do)

| Piece | Rule |
|-------|------|
| Every API read | `fetch(url, { next: { tags: [\`store:${slug}\`], revalidate: 600 } })`. In Next 16 caching is opt-in, so omitting `next.tags`/`revalidate` means uncached and would hammer the 3000/min shared rate limit. Centralise in one `src/lib/howmany/client.ts` so no page calls `fetch` directly |
| Webhook route | `revalidateTag(\`store:${slug}\`, { expire: 0 })`. The one-argument form is deprecated in Next 16. `'max'` (Next's recommendation) serves stale content to the first visitor after a stock change; `{ expire: 0 }` makes the next request a blocking refetch, which matches the core value "always up to date" and a catalogue this small. Decide once, test it, put it in `config.ts` |
| Do not call | `updateTag` (Server Actions only), `revalidatePath` (pulls in the soft-tag filter exception), `unstable_cache` (Vintage used it as a stopgap for storage figures; there is no need here because `fetch` tags cover everything) |
| Webhook verification | `node:crypto` `createHmac` + `timingSafeEqual` as in issue #2; works under `nodejs_compat`. Read the raw body with `request.text()` before parsing. Return 204 fast |
| Tag length | Tags are case-sensitive and capped at 256 chars; a slug-based tag is far below that |

### Prove it (do this in the first phase, not at the end)

Run a Worker-level test in CI and locally before building any UI: `opennextjs-cloudflare build`, then `opennextjs-cloudflare preview` (local D1/R2 via miniflare, `populateCache local` creates the table), then: request a page that reads the API, change the mocked API payload, POST a correctly signed webhook, request the page again, assert the new payload. Reason: the Vintage CI comment records a bug that only appeared on Cloudflare (module-level file read) and was invisible to `next build`. Also assert 401 on a bad signature and a stale timestamp. Confidence that it works as designed: MEDIUM until this test exists.

Known adapter issue to watch: #1455 "ISR pages prerendered at runtime retain ~1.4 MB per render" (isolate grows until recycled). Mitigation if it bites: keep the item route dynamic (only the `fetch` data cache, no page-level ISR) and keep ISR only for home/brands/about. Not a v1 blocker for a small catalogue.

### Images

| Decision | Detail |
|----------|--------|
| `images: { unoptimized: true }` in `next.config.ts` | Same as Vintage. Next's optimiser on Workers needs either the `IMAGES` binding or a `/cdn-cgi/image` loader, and the sources are on another zone (How many's photo host). Cloudflare Images bills per unique transformation: the free allowance is 5,000 unique transformations per calendar month, then $0.50 per 1,000 (paid plan). Every (photo x width) pair counts, and Next generates several widths per image, so a few hundred items blow through the free tier. The API already ships a `thumbUrl` sized for grids |
| Keep `next/image` (not `<img>`) | Gives `width`/`height` reservation from the API (no layout shift), `loading="lazy"`, `priority` for the hero and first gallery image, and keeps the `@next/next/no-img-element` lint rule happy. With `unoptimized` it emits the original URL and no `srcset` |
| Grid vs detail | Grid cards use `thumbUrl`; item page uses `url`. Always pass the API `width`/`height` and a CSS `aspect-ratio`; never derive sizes |
| `remotePatterns` | Not needed while `unoptimized` is true. If a Content-Security-Policy is added later, put the photo host from API data (or `PHOTO_BASE_URL`-style config) in `img-src` |
| Static brand logos (`public/brands/*.svg`) | Plain `<img>`/`next/image unoptimized`. Cloudflare serves `public/` straight from the assets binding, and **`next.config.ts` `headers()` do not apply to static assets**. Add `public/_headers` (for example `/brands/*` with `Cache-Control: public, max-age=31536000, immutable` only if filenames are content-hashed, otherwise a shorter max-age) |
| Upgrade path if photos prove too heavy | Option A: `IMAGES` binding in wrangler plus keeping `loader` default (adapter implements `/_next/image` on it; `minimumCacheTTL` is ignored; remotePatterns are enforced). Option B: custom loader emitting `/cdn-cgi/image/width=...,quality=...,format=auto/<url>` (requires Transformations enabled on the shop's zone and an allowed-origins list in the dashboard, since the loader does not use `remotePatterns`). Prefer A for the template because it needs no zone setting |

Confidence: HIGH on the mechanics (OpenNext image docs plus Cloudflare pricing page), MEDIUM on "thumbUrl is small enough" (confirm sizes of real `thumbUrl`/`url` files once the API is reachable).

### Fonts (Bodoni Moda + Montserrat, self-hosted)

| File | Source | Size | License |
|------|--------|------|---------|
| `src/fonts/BodoniModa-700.woff2` | `bodoni-moda-latin-700-normal.woff2` from the npm tarball `@fontsource/bodoni-moda@5.3.0` (`files/` folder, verified present) | about 15 KB | OFL-1.1 |
| `src/fonts/Montserrat-Variable.woff2` | Copy `C:\Git\vintage\src\fonts\Montserrat-Variable.woff2` (also copy its `OFL-Montserrat.txt`) | about 38 KB | OFL-1.1 |

Commit the files (do not add `@fontsource/*` as dependencies and do not use `next/font/google`): Vintage records that a failed Google download once broke a CI build, and the build must work offline on the Linux runner.

```ts
// src/components/ui/fonts.ts  (same shape as Vintage)
import localFont from 'next/font/local';

export const bodoni = localFont({
    src: '../../fonts/BodoniModa-700.woff2',
    weight: '700',
    variable: '--font-bodoni',
    adjustFontFallback: 'Times New Roman', // serif fallback metrics; the default 'Arial' is wrong for a serif
});

export const montserrat = localFont({
    src: '../../fonts/Montserrat-Variable.woff2',
    weight: '400 500', // brand uses 400 and 500 only; the file is a full variable font
    variable: '--font-montserrat',
});
```

Wire as `--font-serif` / `--font-sans` in the Tailwind `@theme` block and put both `.variable` classes on `<html>`.

Notes: ship **only** weights the branding PDF names. If the mockups show italic Bodoni, add `bodoni-moda-latin-700-italic.woff2` (verified present); do not add 400. If shop names or product titles need accents beyond Latin (Polish, Czech, Turkish), add the `latin-ext` subset file with a second `src` entry. Each listed file is preloaded on every page, so keep the list short (Vintage's own reasoning). Confidence HIGH.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `server-only` | `^0.0.1` | Marks server modules | Every module that reads env or calls the API (convention). In Vitest add a config alias to `server-only/empty.js` once rather than `vi.mock('server-only')` in each test (Vintage mocks it per file) |
| `lucide-react` | `^1.57.0` | Icons: search, bag, account, wishlist, chevrons | Header and filter UI. Same major as Vintage. Import per icon so unused ones tree-shake |
| `tailwind-merge` | `^3.7.0` | Class merging in `components/ui` | Only inside the shared UI primitives, per the Vintage convention |
| `zod` | `^4.6.7` | Env + API response schemas | `src/lib/env.ts`, `src/lib/howmany/schemas.ts` |

Deliberately not added (ponytail): a carousel library (the Just Dropped carousel is CSS `scroll-snap-type: x mandatory` plus two scroll buttons), `clsx` (tailwind-merge covers it), a data-fetching library (server components + `fetch`), a JSON-LD helper or `schema-dts` (a 15-line typed object, escape `<` as `\u003c` when serialising), `nuqs` (filters are plain `searchParams` and links), `date-fns` (use `Intl`), an image-gallery lib (a thumbnail strip with `useState` is enough), `dotenv`, `tsx`, `nanoid`.

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Vitest | `^5.0.5` | Unit tests, colocated `*.test.ts` | Config as Vintage: `environment: 'node'`, `include: ['src/**/*.test.ts']`, alias `@` -> `./src`. Add alias `server-only` -> `server-only/empty.js`. Worth testing: env schema, HMAC verifier (valid, bad signature, stale timestamp, wrong length), query-string builder for filters, brand-strip ordering (in stock, then sold before, then default), code-to-label maps, money formatter. No jsdom: there is no client logic that needs it in v1 |
| ESLint | `^9` (9.39.x) with `eslint-config-next` `16.4.1` (exact, same as `next`) | Lint | Copy Vintage's `eslint.config.mjs` (flat config: `core-web-vitals` + `typescript`, `ignoreRestSiblings`). **Stay on ESLint 9**: npm latest is 10.13 but Next's plugin set trails it |
| `next typegen` + `tsc --noEmit` | - | `npm run typecheck` | Copy script from Vintage. `strict: true`, `@/*` alias |
| `@types/node` `^24.19.2`, `@types/react` `^19`, `@types/react-dom` `^19` | - | Types | |
| Playwright / axe | not in v1 | E2E, a11y | Vintage uses Playwright against its signed-in app. Here a post-deploy `curl` smoke (home 200, an item 200, `/api/webhook` 401 unsigned) is enough. Add Playwright only if visual regressions against the mockups become a problem |
| Prettier | not added | - | Vintage has none; style (4 spaces, single quotes) is a convention. Add an `.editorconfig` instead (indent 4) |

### scripts (package.json)

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "next typegen && tsc --noEmit",
  "test": "vitest run",
  "cf:build": "opennextjs-cloudflare build",
  "cf:preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview"
}
```

`cf:*` only work on Linux/WSL/CI.

## CI and deploy (copy Vintage, remove the database and e2e parts)

`.github/workflows/ci.yml` (pull requests, skip drafts, `paths-ignore: ['**.md', '.planning/**']`, `concurrency` cancel in progress, `permissions: contents: read`):
- Job `check`: `actions/checkout@v7`, `actions/setup-node@v7` with `node-version-file: .nvmrc` and `cache: npm`, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`.
- Job `worker` (the one that matters on Cloudflare): `npx opennextjs-cloudflare build`, then start `npx wrangler dev --port 8787 --ip 127.0.0.1` with a `.dev.vars` file holding `HOWMANY_WEBHOOK_SECRET`, wait with `curl --retry-connrefused`, then `curl` home (200), an unsigned `POST /api/webhooks/howmany` (401), `robots.txt` (200), and grep the Worker log for `ERROR`. Build-time env uses placeholders, but note Blacktail's build **does fetch the real API** during prerender, so `STORE_SLUG` and `HOWMANY_API_URL` must be real (non-secret) values in the job env.
- Add the revalidation round-trip test from "Prove it" here once it exists.

`.github/workflows/deploy-workers.yml` (push to `main`, `workflow_dispatch`, `concurrency: deploy-workers` with `cancel-in-progress: false`, `timeout-minutes: 25`, `permissions: contents: read`):
1. checkout, setup-node, `npm ci`
2. `npm test` (merge of several PRs is tested here, as in Vintage)
3. `npx opennextjs-cloudflare build`
4. `npx opennextjs-cloudflare populateCache remote` (uploads prerendered pages to R2 and creates the D1 table)
5. `npx wrangler deploy --var APP_COMMIT_SHA:${{ github.sha }}`
6. `curl -fsS --retry 40 --retry-delay 15 --retry-all-errors <site>/` (first deploy waits for the certificate)

Secrets: `CLOUDFLARE_API_TOKEN` (permissions: Workers Scripts Edit, Workers R2 Storage Edit, **D1 Edit**, which Vintage did not need) and `CLOUDFLARE_ACCOUNT_ID`. Env: `NEXT_TELEMETRY_DISABLED=1`, `WRANGLER_SEND_METRICS=false`. The webhook secret is set once with `wrangler secret put HOWMANY_WEBHOOK_SECRET` and survives deploys; plain `vars` in `wrangler.jsonc` replace dashboard plain variables on every deploy (Vintage learned this), so keep non-secret values in the file.

For a second shop: copy the repo/deploy with its own `wrangler.jsonc` (new `name`, matching `WORKER_SELF_REFERENCE.service`, new R2 bucket, new D1 id), its own `STORE_SLUG`, and its own GitHub environment. Never share a D1 or R2 cache between shops (cache keys are not slug-aware).

## Installation

```bash
# Core
npm install next@16.4.1 react@19.3.0 react-dom@19.3.0 zod@^4.6.7 server-only@^0.0.1 lucide-react@^1.57.0 tailwind-merge@^3.7.0

# Dev dependencies
npm install -D @opennextjs/cloudflare@^1.20.13 wrangler@^4.151.3 typescript@^5 @types/node@^24.19.2 @types/react@^19 @types/react-dom@^19 \
  tailwindcss@^4 @tailwindcss/turbopack@^4 \
  vitest@^5.0.5 eslint@^9 eslint-config-next@16.4.1

# One-time Cloudflare resources (per shop)
npx wrangler r2 bucket create blacktail-archive-opennext-cache
npx wrangler d1 create blacktail-archive-tags
npx wrangler secret put HOWMANY_WEBHOOK_SECRET
```

Carry over from Vintage: `package.json` `overrides` for `miniflare.undici` (`^7.30.1`) and `@next/eslint-plugin-next.fast-glob` (`npm:tinyglobby@^0.2.17`); `engines`, `.nvmrc`, `AGENTS.md` (the "this is not the Next.js you know" block, read `node_modules/next/dist/docs/` before framework code). The `@esbuild-kit` and `@node-minify` overrides belonged to drizzle-kit and are not needed.

`next.config.ts` (minimal, Vintage minus Clerk/CSP/server-action limits):

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // No cacheComponents / partialPrefetching: OpenNext on Workers cannot run them yet (opennextjs-cloudflare #1450, PR #1318)
    poweredByHeader: false,
    images: { unoptimized: true },
    outputFileTracingExcludes: { '/*': ['node_modules/sharp/**', 'node_modules/@img/**', 'node_modules/next/dist/compiled/@vercel/og/**'] },
    turbopack: { rules: { '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' } } },
    // Security headers (X-Content-Type-Options, Referrer-Policy, HSTS) via headers(): they apply to Worker responses only, not to public/ assets (see _headers above)
};

export default nextConfig;
```

`instrumentation.ts`: same pattern as Vintage (`if (process.env.NEXT_RUNTIME === 'nodejs') { await import('./lib/env'); parse }`). Env reaches `process.env` on Workers through `nodejs_compat`.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `fetch` + `next.tags` + `revalidateTag` | `'use cache'` + `cacheTag` + `cacheLife` (Cache Components) | When OpenNext closes #1450/#1464 and merges #1318. Re-evaluate at each OpenNext release; the migration is local to `src/lib/howmany/client.ts` if all reads go through it |
| D1 tag cache | KV tag cache | Never for this app: eventual consistency breaks "webhook then fresh page" |
| D1 tag cache | Sharded DO tag cache | Only a large multi-tenant catalogue with heavy read load; open cost issue #1103 |
| R2 incremental cache | `withRegionalCache(R2)` | If measured R2 reads add visible latency and 10 to 30 minute staleness at the edge is acceptable |
| `unoptimized` images | Images binding / `/cdn-cgi/image` loader | If real `url` photos are multi-megabyte on the item page; then use the binding (no zone setting) |
| `next/font/local` with committed files | `next/font/google` | Never here (build-time network dependency) |
| Vitest only | Playwright E2E | If visual/interaction regressions against the mockups appear; reuse Vintage's Playwright workflow shape |
| ESLint 9 + TS 5.9 | ESLint 10 / TS 7 | After `eslint-config-next` and `typescript-eslint` declare support |
| Plain `opennextjs-cloudflare build` on Linux CI | Building on Windows | Not possible; use CI or WSL |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Vintage's `open-next.config.ts` as is | No tag cache and no queue: `revalidateTag` is a no-op, stale pages never regenerate | R2 + D1 tag cache + DO queue (above) |
| Vintage's `cloudflare-worker.js` wrapper as is | It does not re-export `DOQueueHandler`, so the DO binding would fail at deploy | `main: ".open-next/worker.js"` |
| `cacheComponents: true`, `'use cache'`, `cacheTag`, `cacheLife`, PPR | Hangs and 500s on Workers today | `fetch` options |
| `revalidateTag(tag)` with one argument | Deprecated in Next 16 | `revalidateTag(tag, { expire: 0 })` |
| `unstable_cache` | Not needed; adds a second cache path to reason about | `fetch` with tags |
| KV for incremental or tag cache | Eventually consistent | R2 and D1 |
| `bypassTagCacheOnCacheHit`, `enableCacheInterception` | Stale after revalidateTag (#1295) / not needed | Defaults |
| Edge runtime route (`export const runtime = 'edge'`) | OpenNext targets the Node runtime on Workers; edge routes are not supported the same way | Default Node runtime |
| `middleware.ts` / `proxy.ts` | Nothing in v1 needs it (no auth, no i18n); Next 16 renamed it to `proxy.ts` and it adds a separate bundle | Route handlers and redirects in `next.config.ts` |
| Clerk, Drizzle, Neon, `@vercel/blob`, `aws4fetch`, PGlite, dnd-kit, fflate, uqr, nanoid, react-image-crop | Vintage's data, auth and photo-upload stack; Blacktail is read-only over HTTP | Nothing |
| `next/font/google` | Network at build time | Committed woff2 |
| TypeScript 7, ESLint 10 | Unsupported by `typescript-eslint`/Next lint plugins | TS 5.9, ESLint 9 |
| Hard-coded shop values in components | Template requirement | `src/lib/config.ts` + env |

## Stack Patterns by Variant

**If the item route shows memory growth or restarts (issue #1455):**
- Make `/items/[code]` render dynamically (read `await params`, no `generateStaticParams`), relying on the fetch data cache in R2
- Because runtime ISR renders leak about 1.4 MB per render on Next 16.4.1; the data is still cached by tag

**If the webhook is flaky or a shop has no webhook URL yet:**
- Keep `revalidate: 600` on every fetch
- Because the time-based path is the safety net the API spec asks for (the webhook is never retried)

**If a shop gets high traffic:**
- Add `withRegionalCache(r2IncrementalCache, { mode: 'short-lived' })` first (reuses responses for up to a minute)
- Because it cuts R2 reads without moving the tag cache

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@opennextjs/cloudflare@1.20.13` | `next >=15.5.28 <16 \|\| >=16.4.1`, `wrangler ^4.148.0` | Uses `@opennextjs/aws@4.1.12` |
| `next@16.4.1` | `react@19.3.0` | Both exact, as in Vintage |
| `eslint-config-next@16.4.1` | `eslint >=9`, `typescript >=3.3.1`, via `typescript-eslint@8.71` requires `typescript <6.1` | Keep `eslint-config-next` equal to `next` |
| `vitest@5.0.5` | Node `^22.12 \|\| ^24 \|\| >=26` | Node 24 fine |
| `wrangler@4.151.3` | `compatibility_date` 2026-10-01 | Latest 4.152.0, safe to take |
| `tailwindcss@4.3.3` | `@tailwindcss/turbopack@4.3.3` | Keep the two on the same version |

## Open verification items (carry to the phase that owns them)

| Item | Phase | Why open |
|------|-------|----------|
| Round-trip: signed webhook -> D1 write -> next read refetches the API, under `wrangler dev`/`preview` and on the deployed Worker | Foundation / caching | Only inference from adapter source so far (MEDIUM) |
| `{ expire: 0 }` vs `'max'` on the deployed Worker: confirm blocking refetch and no 500 | Foundation / caching | Issue #1458 is `expire: 0` 500s, reported under Cache Components only; verify without it |
| Real `thumbUrl` and `url` byte sizes and formats (WebP/AVIF/JPEG) | Item/grid phase | Decides whether `unoptimized` stays |
| Bodoni italic needed? latin-ext needed? | Design tokens phase | Depends on mockups and shop content |
| Next 16.4.3 / React 19.3.1 bump | After first deploy | Needs the worker smoke test green on the new versions |
| R2 lifecycle rule for old build prefixes | Deploy phase | Operational, dashboard or `wrangler r2 bucket lifecycle` |

## Sources

- `C:\Git\vintage\package.json`, `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`, `cloudflare-worker.js`, `.github/workflows/ci.yml` and `deploy-workers.yml`, `eslint.config.mjs`, `vitest.config.mts`, `src/components/ui/fonts.ts`, `.planning/codebase/STACK.md` (HIGH, the proven reference)
- Installed `@opennextjs/cloudflare@1.20.13` source: `dist/api/config.js` (defaults to `"dummy"` tag cache and queue), `overrides/tag-cache/d1-next-tag-cache.js`, `tag-cache-filter.js`, `overrides/incremental-cache/r2-incremental-cache.js`, `cli/commands/populate-cache.js` (D1 table creation), `cli/templates/worker.js` (DO class exports), peer dependencies (HIGH)
- Installed Next 16.4.1 docs: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`, `fetch.md`, `02-components/font.md` (HIGH)
- https://opennext.js.org/cloudflare/caching (recommended small-site config, bindings, limitations), /get-started, /howtos/image (HIGH, official)
- https://developers.cloudflare.com/images/pricing/ (5,000 free unique transformations per calendar month, $0.50 per 1,000 after) (HIGH)
- GitHub opennextjs/opennextjs-cloudflare issues and PRs #1450, #1318, #1464, #1458, #1455, #1295, #1103, #1281 read via `gh` on 2026-10-26 (HIGH for existence and status; severity is the reporters' own)
- npm registry versions checked 2026-10-26: next 16.4.3, react 19.3.1, wrangler 4.152.0, @opennextjs/cloudflare 1.20.13, vitest 5.0.5, typescript 7.0.2 (latest), eslint 10.13.0, tailwindcss 4.3.3, zod 4.6.7, @fontsource/bodoni-moda 5.3.0 (HIGH)
- `@fontsource/bodoni-moda@5.3.0` tarball inspected: `files/bodoni-moda-latin-700-normal.woff2` (14,988 bytes) and `-700-italic.woff2` present (HIGH)
- `docs/refs/issues.json` issues #1 and #2 (API contract, webhook, caching requirements) (HIGH)
- Context7 / Exa / Brave were not used (not enabled in `.planning/config.json`); primary sources above were used instead

---
*Stack research for: headless second-hand storefront, Next.js 16 on Cloudflare Workers (OpenNext)*
*Researched: 2026-10-26*
