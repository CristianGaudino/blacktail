# Pitfalls Research

**Domain:** Headless Next.js 16 storefront template on Cloudflare Workers (OpenNext) that caches a third-party read-only API by tag and revalidates from a signed webhook. One-off (single-stock) pre-loved items, no checkout.
**Researched:** 2026-10-26
**Confidence:** MEDIUM-HIGH. Next 16 behaviour is HIGH (read from the installed docs in `C:\Git\vintage\node_modules\next\dist\docs\`, Next 16.4.1). OpenNext behaviour is MEDIUM (official OpenNext docs plus the installed `@opennextjs/cloudflare` 1.20.13 and `@opennextjs/aws` 4.1.12 source). Items marked [LOW] are inference and must be proven by a test in the phase named.

Confidence tags used below: [HIGH] Next docs / vintage repo, [MEDIUM] OpenNext docs or source, [LOW] inference, test before trusting.

---

## Critical Pitfalls

### Pitfall 1: The webhook returns 204 but nothing is ever invalidated (no tag cache)

**What goes wrong:**
`revalidateTag('store:<slug>', ...)` runs, the route answers 204, and shoppers keep seeing old stock until the time-based fallback (or forever). Nothing errors. The `open-next.config.ts` copied from How many is `defineCloudflareConfig({ incrementalCache: r2IncrementalCache })` with no `tagCache`, and `defineCloudflareConfig` defaults `tagCache`, `queue` and `cdnInvalidation` to `"dummy"`. The dummy tag cache's `writeTags` is an empty function and `isStale` always returns `false` [MEDIUM, read in `@opennextjs/aws/dist/overrides/tagCache/dummy.js`].

**Why it happens:**
Vintage never needed tags (its `next.config.ts` says the app only used `'use cache'` for admin figures, and it does not call `revalidateTag`). "Reuse that setup" copies a config that cannot do the one thing Blacktail exists for. On Workers there is no shared process memory: every isolate is separate, so even Next's in-memory tag state cannot reach the isolate that serves the next shopper. Tag state must live in shared storage.

**How to avoid:**
- Add a real tag cache to `open-next.config.ts`. For a small catalogue per shop, use the D1 tag cache (`d1NextTagCache`, binding `NEXT_TAG_CACHE_D1`, a `revalidations` table, plus the `WORKER_SELF_REFERENCE` service binding) [MEDIUM, OpenNext caching docs]. The sharded Durable Object tag cache (`doShardedTagCache`) is the "large site" option. Do not use the KV tag cache (KV is eventually consistent, and OpenNext itself advises against KV for this).
- Keep R2 as the incremental cache (already proven in vintage). Skip the regional cache at first. If added later, leave `bypassTagCacheOnCacheHit` at `false` (true skips the tag check and needs cache purge to be correct).
- Create the D1 database and its table as part of the deploy runbook, per shop.
- Prove it end to end, not by reading config: change a price in How many, fire the webhook (a signed `curl`), reload the page on a different network or after a cold start, and see the new price within seconds. Run `NEXT_PRIVATE_DEBUG_CACHE=1` once to see the tag writes.

**Warning signs:**
- Webhook logs show 204, pages never change before the time fallback.
- `wrangler.jsonc` has an R2 bucket but no `NEXT_TAG_CACHE_D1` or `NEXT_TAG_CACHE_DO_SHARDED` binding.
- It works in `next dev` (dev never caches) and in a single `wrangler dev` session, and fails in production.

**Phase to address:** Foundation / deploy skeleton (infra bindings), verified again in the API cache + webhook phase.

---

### Pitfall 2: Enabling `cacheComponents` / `'use cache'` because Next 16 recommends it

**What goes wrong:**
New Next 16 projects are scaffolded with `cacheComponents: true`, and the docs present `'use cache'` as the model. On OpenNext for Cloudflare this is not production-ready: vintage's `next.config.ts` states "No cacheComponents / partialPrefetching: OpenNext on Cloudflare Workers can't run them yet (opennextjs-cloudflare#1450)". That issue (HTTP 500s and hung workers with Cache Components, Next 16.4.0, adapter 1.20.10) was still open on 2026-10-26 with a maintainer fix PR (#1318) not yet merged [MEDIUM]. Separately, the Next docs say the default `'use cache'` handler is in-memory, and in serverless "cache entries typically don't persist across requests (each request can be a different instance)" [HIGH]. On Workers that means `cacheTag()` + `revalidateTag()` inside `'use cache'` only affects the isolate that ran it unless a custom `cacheHandlers` entry is configured, and the OpenNext Cloudflare docs list none for `'use cache'`.

**Why it happens:**
The Next 16 docs lead with Cache Components. `unstable_cache` is marked "replaced by use cache", which looks like a deprecation, so people migrate away from the thing that works on this platform.

**How to avoid:**
- v1 uses the previous caching model: `fetch(url, { cache: 'force-cache', next: { revalidate: <n>, tags: ['store:<slug>'] } })` inside one server-only API client. This path is stored in the OpenNext incremental cache (R2) and invalidated by the tag cache from Pitfall 1.
- Do not set `cacheComponents`, `partialPrefetching`, or add `'use cache'`, `cacheTag` or `cacheLife` anywhere. Add an ESLint rule or a test that greps for them so a copy-paste does not slip in.
- Keep a comment in `next.config.ts` pointing at issue #1450. Revisit when OpenNext ships the fix and lists `use cache` handler support.
- Do not call `updateTag` (Server Actions only; not usable from a webhook route handler) [HIGH].

**Warning signs:** Build prints Cache Components warnings; random 500s or timeouts under concurrent requests on the deployed Worker; `'use cache'` appears in a PR.

**Phase to address:** Foundation (config decision recorded), API cache phase.

---

### Pitfall 3: Wrong `revalidateTag` call (one argument, or `'max'`) in the webhook

**What goes wrong:**
Next 16 changed the signature to `revalidateTag(tag, profile)`. The one-argument form is deprecated ("works if TypeScript errors are suppressed, may be removed") and the docs' recommended `'max'` profile means stale-while-revalidate: the first visitor after the webhook still gets the old stock while the refresh runs [HIGH]. The sample verifier in issue #2 calls `revalidateTag(\`store:${...}\`)` with one argument, so copying it verbatim hits the deprecated form. For a one-off item that has just sold, serving it as available to the next visitor is the exact failure the product is meant to avoid.

**How to avoid:**
- In the webhook route use `revalidateTag(tag, { expire: 0 })`. The Next docs name this case explicitly: "When the invalidation comes from outside a Server Action, for example a webhook... pass `{ expire: 0 }`" [HIGH].
- The OpenNext D1 tag cache honours `{ tag, stale, expire }` objects [MEDIUM, `d1-next-tag-cache.js`]; confirm in the end-to-end test that the first request after the webhook is fresh.
- Build the tag in one place (`storeTag(slug)` in `src/lib/`), from `STORE_SLUG` config, never from the request body (see Pitfall 7). Tags are case-sensitive, max 256 chars.
- Typecheck with `next typegen && tsc --noEmit` in CI so a one-argument call fails the build.

**Warning signs:** TypeScript deprecation hint on `revalidateTag`; first load after an edit shows old data, second load shows new.

**Phase to address:** Webhook phase.

---

### Pitfall 4: The "time-based fallback" silently doesn't exist

**What goes wrong:**
The fallback (about 10 minutes) exists because the webhook is never retried. It fails quietly in four ways:
1. **Not set on the data.** With no `revalidate`, a fetch prerendered at build is cached forever ("`false`... equivalent to `revalidate: Infinity`") [HIGH]. A missed webhook then means stale until the next deploy.
2. **Segment config can't read your config.** `export const revalidate = FALLBACK_SECONDS` is invalid: "the revalidate value needs to be statically analyzable. `revalidate = 600` is valid, but `revalidate = 60 * 10` is not" [HIGH]. A template that wants the interval in `config.ts` cannot use the segment export. Put the number on each `fetch` (`next: { revalidate }`), where a variable is allowed.
3. **Page-level ISR needs a queue.** OpenNext's docs: the queue is "required for time-based revalidation". The default queue is `"dummy"` and `send()` throws `FatalError("Dummy queue is not implemented")`; the stale-page path catches and only logs `Failed to revalidate stale page` [MEDIUM, read in `core/routing/util.js` and `queue/dummy.js`]. Prerendered pages then stay stale and nobody sees an error.
4. **Lowest value wins.** One fetch with a short `revalidate` makes the whole route revalidate at that rate (and re-hit the API); one with a long value does not slow others [HIGH].

**How to avoid:**
- Prefer fetch-level caching with dynamic page renders (see Pitfall 6) so the TTL lives on the data entry and no page-level queue is needed. If any route stays a prerendered ISR page (home, static pages with data), add the Durable Object queue (`doQueue`, `NEXT_CACHE_DO_QUEUE`, with the `new_sqlite_classes` migration) [MEDIUM].
- One constant `FALLBACK_REVALIDATE_SECONDS` in `config.ts`, used only inside the API client.
- Test: stop sending webhooks, edit stock, wait past the TTL, confirm the page updates on the deployed Worker (`wrangler preview` is not enough for queues and DOs, which "will not work in local development" [MEDIUM]).

**Warning signs:** `Failed to revalidate stale page` in Worker logs; a page that is still old an hour after a missed webhook.

**Phase to address:** API cache + webhook phase.

---

### Pitfall 5: Fetches are not actually cached on dynamic routes, so every visit hits the shared rate limit

**What goes wrong:**
By default Next 16 does not cache `fetch` ("`auto no cache`"). In dev nothing is cached either. The All Items page awaits `searchParams` (a request-time API) before it fetches, and the docs say that without an explicit cache option, requests "discovered after a Request-time API run on every request" [HIGH]. So `/items`, `/items?brand=...` and search can hit How many on every page view, bots included, against the 3000 requests per minute per IP budget shared with everything else. A 429 then turns into empty or broken pages.

**How to avoid:**
- Give every API call an explicit `cache: 'force-cache'` and `next: { revalidate, tags }`. Never rely on defaults. Do it in one wrapper so it cannot be forgotten.
- Whether an explicit option is honoured after `await searchParams` is described ambiguously in the segment-config docs ("auto: not cache fetch requests after Request-time APIs") [LOW on the exact semantics]. Prove it: request the same filtered URL twice on the deployed Worker with `NEXT_PRIVATE_DEBUG_CACHE=1` and check the second is a HIT with zero outgoing calls to How many. If not, use `export const fetchCache = 'default-cache'` on those routes.
- Normalise the cache key: build the API URL from an allow-listed, sorted, validated param set (`URLSearchParams` in fixed key order, values trimmed and lowercased where the API is case-insensitive, `limit` fixed at 24, `page` clamped). Otherwise `?a=1&b=2` and `?b=2&a=1` are two cache entries and two API calls.
- Handle non-OK deliberately: 429 reads `Retry-After` and throws (never returns `[]`); 400 means the visitor's filter combination is invalid, so redirect to the unfiltered list or show a calm empty state; 404 on `/` of the store means misconfigured slug or switched-off store (fail loudly in the log, show a maintenance page).
- Do not swallow errors into "no items". See Pitfall 6 for why a cached empty page is worse than a failed render.

**Warning signs:** Request counts to How many scale with traffic; any 429 in logs; the API call count in a load test does not stay flat after warm-up.

**Phase to address:** API client + cache phase; re-check in the All Items phase.

---

### Pitfall 6: Build-time prerender hits the API (rate limit, outages, baked-in data, wrong shop)

**What goes wrong:**
- `next build` prerenders any page whose fetches are reachable before a request-time API: "a `fetch` that sets no `cache` option is fetched once during `next build`" [HIGH]. Home, Brands and Just Dropped data get baked into the output and uploaded to R2 by `populateCache` at deploy.
- `generateStaticParams` over all item codes makes the build call the API once per item (plus Next's concurrent prerender workers and retries). On a bigger shop that burns the shared 3000/min budget and 429s fail the build; a How many outage blocks every deploy.
- **A deploy resets the cache to the build-time snapshot.** Cache keys include the build ID ("Neither caching directive carries over to a new deploy" [HIGH] for `use cache`; OpenNext keys the R2 cache by build ID as well [MEDIUM]). Anything sold between "build started" and "deploy finished" shows as available until the next webhook or TTL, and a webhook that arrived mid-build is lost.
- `STORE_SLUG` and `HOWMANY_API_URL` are needed at build time for prerender. If CI uses a placeholder (vintage's pattern for DB URLs), the baked pages belong to the wrong or no shop.
- A page that swallows an API error into an empty list can be prerendered or ISR-cached as "no items".

**How to avoid:**
- Item pages: `generateStaticParams` returns `[]` (or a tiny fixed list) with `dynamicParams` left true, so item pages render on first request and live in the fetch cache with the tag. No per-item calls at build.
- Make data pages request-time (rendered per request on top of the cached fetch) rather than build-time. Cheap and honest: they are only compute plus a cache read, and they remove the build snapshot problem. If a page must prerender, make the build tolerant (see below) and cap it to a handful of calls.
- Build env for Blacktail must be real (`STORE_SLUG`, `HOWMANY_API_URL`), unlike vintage's placeholders. Add a build assertion that fails loudly on placeholder values.
- Errors throw. A failed revalidation then keeps the previous good entry; a swallowed error caches a lie.
- After `wrangler deploy`, have CI send one signed webhook to the new deployment (or call the same revalidation function) to wipe the build-time snapshot.
- Add a build-time call budget test: count outgoing API calls during `next build` (a counter in the wrapper logged at the end) and fail above, say, 20.

**Warning signs:** Build takes longer as stock grows; `next build` log shows hundreds of fetches; 429 during CI; "sold item shows for ten minutes after every deploy".

**Phase to address:** Foundation (build/deploy pipeline), then catalogue pages phase for `generateStaticParams`/`dynamicParams`.

---

### Pitfall 7: Webhook verification bugs (the sample verifier has a trap)

**What goes wrong:**
The issue #2 sample is close to correct but has failure modes:
- `sig.length !== expected.length` compares **string** lengths, then `Buffer.from(sig)` is UTF-8. A 64-character signature containing multi-byte characters passes the length check, produces a longer buffer, and `timingSafeEqual` **throws** a RangeError, giving a 500 instead of a 401 (an unauthenticated crash path).
- `Number(ts)` of garbage is `NaN`; `Math.abs(NaN) < 300` is false so it rejects (fine), but a missing header and a body-parse error ordering mistake lets `JSON.parse` run on unauthenticated input.
- `JSON.parse(body).store` feeds the tag. An attacker with a replayed valid signature for another store (same secret reused across shops) or a buggy sender would revalidate `store:other`. Harmless to data but wrong.
- `process.env.HOWMANY_WEBHOOK_SECRET!` unvalidated: an empty or unset secret makes HMAC forgeable or throws.
- Reading the body twice (`request.json()` then `text()`) fails; HMAC must be over the **raw** body.
- Slow work in the handler: How many waits 5 seconds and never retries; a cold isolate plus a slow tag write must still answer in time.

`node:crypto` itself is fine on Workers: with `nodejs_compat` all `node:crypto` APIs are supported, and `createHmac` and `timingSafeEqual` are not on the exception list (compat dates before 2026-08-04 need the flag in `wrangler.jsonc`; vintage already sets `nodejs_compat`) [MEDIUM].

**How to avoid:**
- Prefer WebCrypto: import the key with `crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])` and call `crypto.subtle.verify('HMAC', key, sigBytes, data)`. `verify` is constant time by contract and needs no `Buffer`. If keeping `node:crypto`, first check `/^[0-9a-f]{64}$/i.test(sig)`, decode with `Buffer.from(sig, 'hex')`, check byte length, then `timingSafeEqual`.
- Order: read `await request.text()` once, check timestamp header is an integer within 300 s, verify signature, only then parse JSON in a try/catch, ignore (204) if `payload.store !== STORE_SLUG`, then revalidate the configured tag.
- Zod: `HOWMANY_WEBHOOK_SECRET: z.string().min(16)`.
- Return 401 for any auth failure with an empty body, never echo details; do not log the signature, secret or raw body.
- Unit test with a fixed vector: valid, wrong signature, non-hex signature, multi-byte same-length signature, stale and future timestamps, missing headers, bad JSON after valid signature, wrong store.
- Route handler is `POST`, never statically optimised; no `export const dynamic` needed, but do not add `GET` that revalidates.

**Warning signs:** 500s from the webhook route in logs; a test with a unicode signature crashes; tag comes from `body.store`.

**Phase to address:** Webhook phase (security-critical, test-first).

---

### Pitfall 8: Items that disappear between refreshes (404s, soft 404s, stale links, sitemap, JSON-LD)

**What goes wrong:**
One-off pieces sell. For up to the cache window (or forever if Pitfall 1 bites) these remain visible in a cached grid, carousel, sitemap and `Product` JSON-LD with `InStock`. Then:
- A shopper clicks a sold item. The API returns 404 for it (confirmed in issue #2: "an item the store doesn't show" is 404). If the page throws or renders an error instead of calling `notFound()`, they see a 500.
- `generateMetadata` and the page both fetch the item. If only the page calls `notFound()`, `generateMetadata` crashes first on `undefined`.
- **Soft 404 for SEO.** With a `loading.tsx` or a Suspense boundary above the item, streaming has started before `notFound()`, so the response keeps **status 200** with a `noindex` tag [HIGH, `not-found.md`: "Calling notFound() after streaming has started"]. Google keeps sold items as soft 404s.
- Cached 404: whether a `notFound()` result for an unknown param is cached for the revalidate window is not documented clearly [LOW]. A piece that is re-listed (same code) could keep returning 404 until revalidation.
- `sitemap.ts` built once at build time lists sold items and misses new ones until the next deploy.
- Photo files for removed items may be cleaned up by How many's nightly photo job [LOW], so a stale cached grid can show broken thumbnails.

**How to avoid:**
- One `getItem(code)` wrapper that maps 404 to `null`; both `generateMetadata` and the page call `notFound()` on `null`. Memoisation dedupes the two calls only when fetch options are identical, so use the same wrapper.
- Do not put `loading.tsx` or a Suspense boundary above the item fetch on `/items/[code]`. Fetch the item in the page before any streaming boundary.
- A designed "this piece has found a new home" `not-found.tsx` for the item route, with links to Just Dropped and All Items. Same tag on every read so the webhook clears them all.
- Sitemap and any list of items: fetch with the same tag and explicit `revalidate` so it refreshes (test it; metadata routes are prerendered by default). Page through at `limit=100`.
- Cards in a stale grid are fine for seconds-to-minutes; the item page is the source of truth.
- Test: sell an item in How many, fire webhook, check grid, item URL (expect HTTP 404), sitemap, and JSON-LD.

**Warning signs:** `curl -I` on a sold item returns 200; Search Console "soft 404"; sitemap count differs from the API `total`.

**Phase to address:** Catalogue pages phase (item page), SEO phase (sitemap, status codes).

---

### Pitfall 9: Images, layout shift and `next/image` on Workers

**What goes wrong:**
- **Optimiser not wired.** `next/image` on Workers has no default optimiser. Options are the Cloudflare Images binding (`IMAGES` in `wrangler.jsonc`, billed separately, `minimumCacheTTL` unsupported) or a custom `/cdn-cgi/image/` loader (needs Images transformations enabled on the zone; the simple loader does not enforce `remotePatterns`) [MEDIUM]. Teams hit 404/500 on `/_next/image` after deploy because nothing is bound.
- **`unoptimized: true` (vintage's choice) is fine for API photos but hurts here.** Vintage resizes photos on upload; Blacktail's hero, two banners, four category tiles and story band are large lifestyle photos (not yet supplied). Without an optimiser, a 4000 px JPEG ships to a phone and becomes the LCP.
- **Layout shift.** The API gives `width`/`height` of the **full-size** photo, not of `thumbUrl`. Passing them to `<Image width height>` is fine for aspect ratio only if the thumb has the same ratio (unverified [LOW]); and CSS `height:auto` without a width constraint can still shift. Grids with fixed `aspect-[3/4]` boxes and `object-cover` are robust; item galleries should use the photo's own ratio.
- **`remotePatterns` is build-time config.** `next.config.ts` cannot read per-shop values at runtime. A template needs the photo host from env at build, or must stay `unoptimized`.
- **Next 16 image changes:** `priority` is deprecated in favour of `preload`; `minimumCacheTTL` default is 4 hours; `qualities` and `imageSizes` defaults changed; local images with query strings need `localPatterns` [HIGH].
- SVG brand logos: `next/image` treats SVG as unoptimised; 30 `<img>` tags on the home strip is a lot of requests without `loading="lazy"` and fixed height.
- `@vercel/og` / `ImageResponse` for per-item OG images adds large wasm to the Worker bundle (vintage explicitly excludes it).

**How to avoid:**
- Decide once, in the Foundation phase: for v1 keep `images.unoptimized: true` for API photos (the API already gives `thumbUrl` and `url`), and **pre-size local lifestyle assets** to a few widths in WebP/AVIF (a build script or manual export) so that unoptimised delivery is already small. Revisit the Images binding only if cost is acceptable (check Cloudflare Images pricing at that time).
- Reserve space everywhere: grid cell fixed aspect; item gallery container `aspect-ratio` from `photos[0].width/height`; carousel items fixed width and aspect; brand logos in a fixed-height box with `object-contain`.
- Only the above-the-fold hero / first gallery image gets `preload` / `fetchPriority="high"`; everything else lazy. Add `<link rel="preconnect">` to the photo host from config.
- Use `thumbUrl` in grids, carousel and gallery strips; `url` only for the main gallery image. After the first real data, check thumb size against displayed size on a 2x phone and adjust.
- Use `openGraph.images` pointing at the API `url` (absolute) rather than generating images on the Worker.
- Measure CLS and LCP in the Lighthouse run on the deployed Worker, not locally.

**Warning signs:** CLS > 0.1 in Lighthouse; hero image over 300 KB; `/_next/image` requests in the network panel; images that jump when they load.

**Phase to address:** Foundation (image decision), Home page and Catalogue phases (reserved space), final polish phase (Lighthouse gate).

---

### Pitfall 10: Build-time env vs deploy-time env on Workers

**What goes wrong:**
- Module-scope `const env = envSchema.parse(process.env)` runs in the build, in the worker's global scope before bindings are populated, or on the wrong values. Vintage avoids this by calling `serverEnv()` lazily and "read fresh each call" [HIGH, `src/lib/env.ts`]. Keep that.
- `NEXT_PUBLIC_*` and anything baked into prerendered HTML is frozen at build; Workers Builds needs "Build variables and secrets" for those, separate from runtime variables [MEDIUM].
- `wrangler deploy` replaces dashboard **plain** variables with those in `wrangler.jsonc` (only secrets survive) [HIGH, vintage comment]. A shop's `STORE_SLUG` set in the dashboard disappears at the next deploy; `--keep-vars` changes this.
- `HOWMANY_WEBHOOK_SECRET` must be a Worker **secret**; if it is committed in `vars` it leaks; if it is only a build variable the Worker never sees it.
- `STORE_SLUG`/`HOWMANY_API_URL` differ between the build and the runtime (placeholders in CI) and pages bake the wrong shop (Pitfall 6).
- **The env list in PROJECT.md is missing a public site origin** (canonical URL, sitemap, JSON-LD `url`, OG, `metadataBase`). Deriving it from request headers makes pages dynamic and trusts `Host`. Add `SITE_URL` (build and runtime, same value).
- **OpenNext does not support building on Windows** (comment in vintage's `deploy-workers.yml`). The developer machine is Windows 11: `next dev` works, but `opennextjs-cloudflare build` and `populateCache` must run in CI (ubuntu) or WSL.
- `WORKER_SELF_REFERENCE` must name the Worker exactly; with per-shop worker names (or wrangler `env` blocks, whose bindings are **not** inherited) a stale name breaks cache calls and queue/tag operations [MEDIUM].
- `populateCache` is a deploy step (vintage runs `populateCache remote` between build and deploy). Forgetting it deploys an empty cache.
- `instrumentation.ts` `register()` fail-fast validation also makes every request 500 on a misconfigured Worker. That is intended, but make the message list every missing variable (vintage's `serverEnv` already does).

**How to avoid:**
- Split env into two Zod schemas in `src/lib/env.ts`: `buildEnv` (needed to prerender: `STORE_SLUG`, `HOWMANY_API_URL`, `SITE_URL`) and `runtimeEnv` (adds `HOWMANY_WEBHOOK_SECRET`). Both read lazily.
- Put plain per-shop values in that shop's `wrangler.jsonc` `vars`, secrets via `wrangler secret put` in the runbook, and document both in `.env.example` and a `docs/` deploy checklist.
- CI step that fails the build if `STORE_SLUG` looks like a placeholder.
- Smoke test after deploy: `/api/health`-style check is not needed; a plain request to `/` plus a signed webhook `curl` covers both env and cache bindings.

**Warning signs:** works in `wrangler preview`, 500 in production with "missing"; dashboard variable gone after a deploy; wrong shop name in HTML.

**Phase to address:** Foundation (config, env, CI deploy), re-verified in the final Template hardening phase with a second shop.

---

### Pitfall 11: Shop-specific values leak into the template

**What goes wrong:**
The first deploy is Blacktail Archive and the mockups are the target, so "Blacktail" and the palette end up in components, metadata, alt texts, JSON-LD (`brand`, `seller`, `publisher`), `<title>` templates, `package.json`, `wrangler.jsonc` (`name`, routes), the default brand order, Vinted/eBay copy, social handles, the brandmark SVG paths, and `public/brands/*.svg` (30 logos belonging to this shop). Tailwind v4 `@theme` tokens compile at build time into CSS, so "theme in config" does not work unless config feeds the CSS build. The vintage convention (`COPY` in `src/lib/copy.ts` for all on-screen text) mixes generic UI strings with shop copy.

**How to avoid:**
- Two files, two owners: `src/lib/copy.ts` for generic template UI strings (labels such as "Filters", "Sort by", status text), and `src/config/site.ts` (shop-owned: name, tagline, about/contact content, platforms, nav labels, default brand order, logo paths, social links, locale/currency formatting).
- Theme: shop palette as CSS variables in one `theme.css` per shop, imported by `globals.css`; components use semantic token names (`bg-primary`, `text-ink`), never `forest-900`. Map tokens in `@theme inline` (needed so `next/font` variables resolve).
- A guard test (Vitest) that reads `src/**` (excluding `config/` and tests) and fails on the shop name, the five hex colours, "Vinted", "eBay" and "blacktail". Cheap, and it enforces the constraint.
- Per-shop assets live under `public/shop/` (or `public/brands/`) and `src/config/`, listed in one README section "What to change for a new shop".
- No em dashes in copy (vintage rule) also applies to config copy.
- Prove it: stand up a throwaway second config (different name, palette, slug) in CI and build it.

**Warning signs:** `rg -i blacktail src/` returns hits outside config; changing the shop name needs edits in more than one folder.

**Phase to address:** Foundation (structure), enforced in every phase via the guard test, validated in the final phase.

---

### Pitfall 12: JSON-LD `Product` that is wrong for a one-off, unbuyable-here item

**What goes wrong:**
- `price` emitted as `2500` (cents) instead of `"25.00"`; currency not ISO; zero-decimal currencies mis-scaled.
- `itemCondition` omitted or set to `NewCondition`; every piece here is pre-loved, so it should be `https://schema.org/UsedCondition`. How many's grades `A`, `AB`, `B` all map to Used.
- `availability` `InStock` baked into cache for an item that has since sold (Pitfall 8).
- Relative image or URL values; only the thumb used as `image`.
- Fabricated `aggregateRating`/`review`, or `seller: Vinted`, or invented `shippingDetails` to silence validator warnings.
- `JSON.stringify` into a `<script>` without escaping `<` (Next's own guide: replace `<` with `\u003c`) [HIGH]; titles with `</script>` break the page.
- Google requires Product data to describe what the page offers. The page says "available on Vinted / eBay", not purchasable here; markup claiming a direct purchase offer may be treated as mismatched [LOW]. Keep the Offer `url` the item page and price/availability identical to the visible text.
- `generateMetadata` titles/descriptions built from a brand or title with trailing spaces, empty size, or missing era produce "undefined" or double separators.

**How to avoid:**
- One pure function `buildProductJsonLd(item, site)` in `src/lib/`, unit-tested: price string via integer maths (`(cents / 100).toFixed(2)`, with a currency-digits check), absolute URLs from `SITE_URL`, `sku` = `code`, `brand: { '@type': 'Brand', name }`, `image` array of full `url`s, `itemCondition` UsedCondition, `availability` InStock, `offers.url` canonical item URL, optional fields only when the API supplies them.
- A single `<JsonLd>` component that escapes `<` as `\u003c`.
- Validate three real items in the Rich Results Test and Schema Markup Validator before launch.
- Metadata: omit empty parts, set `alternates.canonical`, `metadataBase` from `SITE_URL`.

**Warning signs:** Rich Results Test warnings about price or missing image; JSON-LD source shows `"price": 2500`.

**Phase to address:** SEO / metadata phase.

---

### Pitfall 13: Font loading causes layout shift or the wrong weights

**What goes wrong:**
- Bodoni Moda is a variable font (weight and an optical-size axis); loading it as a single static 700 from the wrong file, or requesting extra weights, ships large files. Montserrat only needs 400/500. Using `font-medium` or `font-semibold` on a Bodoni heading makes the browser synthesise or substitute because only 700 exists.
- `next/font/google` fetches fonts **at build time** (fails offline or in a locked-down CI) while the brief says "self-hosted". `next/font/local` with `.woff2` files in the repo is deterministic.
- Fallback metrics: `adjustFontFallback` for `next/font/local` takes a fallback family name such as `'Times New Roman'` for a serif; default is the generic fallback and the swap shifts the hero heading [HIGH, `font.md`].
- Tailwind v4: defining `--font-serif: var(--font-bodoni)` inside plain `@theme` resolves in the wrong scope; it needs `@theme inline`.
- On Workers, `_next/static/*` is served with `max-age=0, must-revalidate` unless `public/_headers` sets `Cache-Control: public,max-age=31536000,immutable` for `/_next/static/*` [MEDIUM]; fonts and JS are revalidated on every visit.
- Preloading every weight (including ones used only in the footer) delays LCP.

**How to avoid:**
- `next/font/local` for both families, `.woff2` committed under `src/assets/fonts/`, `display: 'swap'`, `adjustFontFallback: 'Times New Roman'` for Bodoni and `'Arial'` for Montserrat, `variable` CSS names, latin (plus latin-ext only if brand names need it).
- Restrict the design to Bodoni 700 and Montserrat 400/500 in tokens; add a lint/guard test for other `font-*` weights on headings.
- Add `public/_headers` for immutable static assets.
- Check CLS with the real fonts on a throttled connection.

**Warning signs:** Heading visibly jumps on load; faux-bold in the style guide page; DevTools shows 3+ font files for two families.

**Phase to address:** Brand system / design tokens phase.

---

### Pitfall 14: Search and filter URLs become an unbounded cache and a crawl trap

**What goes wrong:**
Every combination of brand, size, colour, era, condition, department, price range, sort, page and free-text `q` is a distinct URL, a distinct R2 cache entry and a distinct API call. Crawlers and bots walk them, filling R2 and burning the 3000/min budget on cache misses (and misses happen right after every webhook, since the whole tag is invalidated). Indexing thousands of near-duplicate filtered pages dilutes SEO.

**How to avoid:**
- Validate and normalise params at the edge of the page (Zod): known keys only, bounded lengths, `q` max about 60 chars, numeric ranges coerced, `page` clamped to `ceil(total/limit)` after the first fetch, unknown params dropped (and not forwarded to the API).
- `robots`: `noindex, follow` and a canonical to the base list for any filtered, searched or sorted URL; keep clean category/brand landing URLs if wanted. `robots.txt` should disallow `?q=` patterns.
- Cache searches with a shorter TTL or not at all (`q` is high-cardinality); keep `/filters` and unfiltered lists on the long TTL.
- `useSearchParams` in a Client Component needs a Suspense boundary or it fails the build in Next 16; prefer reading `searchParams` on the server and passing plain props [HIGH].
- Use `<Link prefetch={false}>` on dense grids so 24 cards do not cause 24 Worker invocations per page view.
- Count API calls per page view in a load test and set an alert for 429.

**Warning signs:** R2 object count rising fast; API call rate not tied to real shopper traffic; Search Console showing thousands of `?brand=` URLs.

**Phase to address:** All Items page phase; SEO phase for robots/canonical.

---

### Pitfall 15: Worker limits, plan and bundle size

**What goes wrong:**
Next SSR on Workers exceeds the free plan's CPU-time and compressed-size limits (about 3 MiB free, 10 MiB paid; Workers Paid is effectively required) [MEDIUM, general OpenNext experience, not re-verified in the docs fetched]. Large dependencies (`@vercel/og`, `sharp`, big icon packs) push the bundle over. Vintage uses `outputFileTracingExcludes` for `sharp` and `@vercel/og` and `unoptimized` images for this reason.

**How to avoid:**
- Budget the bundle in CI (`wrangler deploy --dry-run --outdir` and fail above a threshold). Reuse vintage's `outputFileTracingExcludes`. Import icons individually.
- Use Workers Paid for the production account; keep the `observability` setting from vintage.
- Keep client JS small: the carousel and filter UI are the only client components; avoid a client state library.

**Warning signs:** Deploy fails with "script too large"; error 1102 (CPU limit) on item pages.

**Phase to address:** Foundation (deploy), checked again in the final phase.

---

### Pitfall 16: Shared R2 bucket and build IDs across shops, and unbounded cache growth

**What goes wrong:**
OpenNext stores incremental-cache entries in R2 under `NEXT_INC_CACHE_R2_PREFIX` (default `incremental-cache`) plus the build ID. If two shop deployments share one bucket and prefix, and the build ID is deterministic (for example `generateBuildId` returns the git SHA, a common choice), page keys such as `/` collide: shop A's home page can be served for shop B [LOW, reasoned from the key layout; verify before sharing]. Separately, every deploy writes a new build-ID prefix and old prefixes are never deleted, so R2 grows forever.

**How to avoid:**
- One R2 bucket (or at minimum one prefix) and one D1 database per shop deployment, created by the new-shop runbook. Do not set a deterministic `generateBuildId` unless the shop slug is part of it.
- Add an R2 lifecycle rule (delete objects older than about 7 days) on the cache bucket.

**Warning signs:** Wrong shop name on a page after deploying a second shop; R2 storage graph only goes up.

**Phase to address:** Foundation (infra), Template hardening phase (second-shop dry run).

---

### Pitfall 17: Brand logo strip: filesystem at runtime, slug mismatches, tiers with no data

**What goes wrong:**
- The strip falls back to text when `public/brands/<slug>.svg` is missing. Checking with `fs.existsSync('public/brands/...')` works in `next dev` and during build, but **Workers has no filesystem**; `public/` is served from the ASSETS binding. At runtime the check fails and every brand falls back to text, or throws.
- Slug rule mismatch: the repo has `arc-teryx.svg` but the rule yields `arcteryx` (the API brand is `Arc’teryx` with a curly apostrophe; a straight `'` and `’` must both be dropped); both `ralph-lauren.svg` and `polo-ralph-lauren.svg` exist. Windows is case-insensitive, Linux CI and the Workers assets are case-sensitive, so a name that works locally 404s in production.
- The second tier ("sold before") has no data source (open item in PROJECT.md); building UI that depends on it blocks the phase.
- Brands with logos not in stock should not be shown (the strip is stock-driven); an unknown brand must not render a broken `<img>`.

**How to avoid:**
- Generate a logo manifest at build time (a prebuild script that lists `public/brands/*.svg` into `src/config/brand-logos.generated.ts`, plus a unit test that every file name equals `slugify(name)` of itself). Matching is then an in-memory lookup that works on Workers.
- One `brandSlug()` function with tests for accents, both apostrophes, `&`, `.` and multiple spaces. Rename `arc-teryx.svg` to `arcteryx.svg` and resolve the Ralph Lauren spelling with the owner before the phase (or keep an explicit alias map in config).
- Strip order: in stock (from `/filters` brand counts), then config default order; the sold-before tier is skipped until How many provides it, behind a clearly named function so it can be added without touching components.
- Fixed-height logo boxes with `object-contain` and lazy loading.

**Warning signs:** All brands show as text in production but not locally; logo 404s in the network tab.

**Phase to address:** Home page / Brands page phase.

---

### Pitfall 18: Next 16 breaking changes that bite a fresh build

**What goes wrong (all [HIGH], from `upgrading/version-16.md`):**
- `params` and `searchParams` are Promises; synchronous access is removed. Page props must be `await`ed. `generateSitemaps` ids also arrive as a Promise.
- `middleware` is now `proxy` (Node runtime only); `next lint` is removed (use ESLint flat config); Turbopack is the default bundler (custom webpack config breaks `next build`); `revalidateTag` needs a second argument (Pitfall 3); `priority` on `Image` is deprecated; AMP and `runtimeConfig` are removed; Node 20.9+ and React 19.2.
- OpenNext Cloudflare support for Node-runtime `proxy.ts` is unconfirmed [LOW]. The template does not need a proxy at all: avoid it. If wanted later (redirects), use `next.config.ts` `redirects()` like vintage.
- Agent rule in `AGENTS.md`: read `node_modules/next/dist/docs/` before writing framework code.

**How to avoid:** `next typegen` global `PageProps<'/items/[code]'>` helpers; `export const dynamicParams`; keep a short "Next 16 notes" section in the repo conventions; no `proxy.ts` in v1.

**Phase to address:** Foundation (conventions), enforced by typecheck in CI.

---

## Moderate Pitfalls

### Pitfall 19: Cached responses poisoned by a failed fetch
**What goes wrong:** A wrapper that catches errors and returns `{ items: [], total: 0 }` makes an outage look like "no stock", and a prerendered or ISR-cached page keeps it. Next only stores `200` fetch responses [HIGH], but the rendered page is cached separately.
**Prevention:** Throw typed errors (`ApiRateLimited`, `ApiUnavailable`) and let `error.tsx` render a retry state; never cache the error page; log the status and `Retry-After`.

### Pitfall 20: First request after a webhook stampedes the API
**What goes wrong:** The tag covers the whole store, so after `{ expire: 0 }` every distinct URL (home, lists, filters, each item) refetches on its next visit, and concurrent first visitors in different isolates each refetch the same key (no cross-isolate single-flight). Bounded by traffic plus bots, but with Pitfall 14 it can approach the shared limit.
**Prevention:** Keep the set of cacheable URLs small (normalised params), fetch `/filters` once per render, avoid per-card fetches, and consider `'max'` for list pages and `{ expire: 0 }` only where freshness matters most (decide per use after measuring).

### Pitfall 21: Upstream HTTP caching returning stale data on revalidation
**What goes wrong:** How many sends `s-maxage=60, stale-while-revalidate=600`. If any shared cache sits between Worker and the API (a CDN, or Cloudflare's own cache for same-network subrequests), the refetch triggered by a webhook can be served from that cache and re-store old data in Blacktail's cache for another TTL [LOW; issue #2 says "don't count on a CDN" so likely not in play].
**Prevention:** End-to-end freshness test in the webhook phase (edit, webhook, read, compare). If it fails, send `Cache-Control: no-cache` on the server fetch (part of the cache key, so apply it uniformly).

### Pitfall 22: Unknown codes and fields break labels and money
**What goes wrong:** The API "only gains fields" and new category/type/condition codes can appear. A `Record<Type, string>` lookup with no fallback renders `undefined` or throws. Money formatted with `/100` and a hard-coded `€` breaks for another currency or a zero-decimal one.
**Prevention:** `label(code)` falls back to a humanised code; Zod schema `.passthrough()`/ignore unknown keys (strip before passing to client components, which also protects privacy); `formatMoney(cents, currency, locale)` through `Intl.NumberFormat` with the currency from the item, locale from config.

### Pitfall 23: Carousel and client boundaries bloat the RSC payload
**What goes wrong:** Passing full item objects into a client carousel serialises every field, and a client component for a static strip adds JS.
**Prevention:** Map to a minimal view model (code, title, brand, price string, photo URL, width, height) on the server; use CSS scroll-snap before reaching for a carousel library.

### Pitfall 24: Non-production deploys get indexed
**What goes wrong:** `*.workers.dev` or preview deploys are crawlable and duplicate the real shop.
**Prevention:** Follow vintage's `APP_ENV` gate: `robots.ts` returns `disallow: /` unless `APP_ENV === 'production'`, and set `workers_dev: false` like vintage.

### Pitfall 25: Privacy leak through logging or spreading API objects
**What goes wrong:** API responses are already whitelisted, but spreading `...item` into props, logging full payloads, or adding an "internal id" field from a future API version shows up on screen or in JSON-LD.
**Prevention:** Explicit mapping functions for UI and JSON-LD; never display unknown fields; do not log request/response bodies.

### Pitfall 26: Design drift when real photos arrive
**What goes wrong:** Placeholders under `public/images/` have different dimensions or crops than the final lifestyle photos, shifting the hero, banners and tiles.
**Prevention:** Fix the aspect ratio in the component (CSS), name placeholders by slot (`hero`, `banner-1`...), and record required dimensions in a short asset spec so the final files drop in.

---

## Minor Pitfalls

- `Intl` and `Date` formatting differ between server (UTC) and browser: format `publishedAt` on the server only or avoid showing it.
- `trailingSlash` and canonical URLs: pick one and keep sitemap, canonical and JSON-LD consistent.
- Item codes like `RL-0142` come from the URL: validate the route param (for example `/^[A-Za-z0-9-]{1,32}$/`) and `encodeURIComponent` it when building the API path.
- 4-space indent, named exports and `import 'server-only'` conventions apply to the API client and env modules; add the import so a client component cannot pull the webhook secret.
- Em dashes in copy are banned by the vintage convention; check config copy as well as `COPY`.
- Put a Windows note in the README/runbook: use `next dev` locally and CI (ubuntu) for `opennextjs-cloudflare build`.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy vintage's R2-only `open-next.config.ts` | Zero setup | Webhook is a no-op (Pitfall 1) | Never |
| Enable `cacheComponents` / `'use cache'` | Matches Next 16 defaults | 500s and per-isolate caches on OpenNext (Pitfall 2) | Never in v1; revisit after OpenNext fixes #1450 |
| Call API with no cache options | Fewer moving parts | Rate limit, slow pages (Pitfall 5) | Never |
| `generateStaticParams` over all items | Fast first hit | Build burns API budget, baked snapshot (Pitfall 6) | Never; use `[]` + `dynamicParams` |
| `unoptimized` images with big local photos | No image binding cost | Heavy LCP (Pitfall 9) | Only if assets are pre-sized |
| Hard-code "Blacktail Archive" in layout | Faster to match the mockup | Template needs a rewrite for shop two (Pitfall 11) | Never; use `site.ts` from day one |
| `fs.existsSync` for brand logos | Simple | Fails on Workers (Pitfall 17) | Never; build-time manifest |
| Single shared R2 bucket for all shops | One less resource | Cross-shop cache bleed risk (Pitfall 16) | Never until verified |
| Skip the end-to-end freshness test | Saves an hour | Silent staleness in production | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| How many API `/items` | Forward raw query string; build different key orders | Allow-list, normalise, fixed `limit`; `force-cache` + `next.tags` + `revalidate` |
| How many API errors | Treat 400/404/429 as empty | 400 -> redirect/empty filter state; 404 item -> `notFound()`; 404 store -> misconfig page; 429 -> throw with `Retry-After` |
| How many webhook | Verify string lengths, trust `body.store`, `'max'` profile | WebCrypto `verify`, check slug equals config, `revalidateTag(tag, { expire: 0 })`, reply 2xx quickly |
| OpenNext caching | Only configure the incremental cache | R2 incremental + D1 tag cache (+ DO queue if any ISR page) + `WORKER_SELF_REFERENCE` |
| Cloudflare deploy | Build on Windows; forget `populateCache`; plain vars set in dashboard | Build in CI (ubuntu), run `populateCache`, plain vars in `wrangler.jsonc`, secrets via `wrangler secret put` |
| Photos host | Assume `next/image` will optimise them | `unoptimized` plus reserved space from API width/height, preconnect to host |
| Search engines | Emit `Product` data from stale cache | Same tag on every read; sold items return real 404 (before streaming) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Uncached fetch after `await searchParams` | API call count tracks traffic | Explicit cache options, verify HIT | First bot crawl |
| Unnormalised filter URLs | R2 growth, many misses | Allow-list + sort params | Any crawler |
| Prefetching every card link | Worker request spike on list pages | `prefetch={false}` on grids | Pages with 24+ cards |
| Large unoptimised local photos | LCP > 4 s on mobile | Pre-size assets, `preload` only the hero | Day one on mobile |
| 30 logo `<img>` requests | Slow home page | Lazy, fixed height, show 10-12 | Home page load |
| Paging sitemap at `limit=100` sequentially | Slow sitemap, many calls | Cache with tag, cap concurrency | Catalogues beyond a few hundred items |
| Old R2 build prefixes | Storage creep | Lifecycle rule | After weeks of deploys |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Non-constant-time or throwing signature compare | Timing leak; unauthenticated 500s | WebCrypto `verify`, or hex-validate then `timingSafeEqual` |
| Secret in `vars` or in client bundle | Forged webhooks | Worker secret; `import 'server-only'` in env/webhook modules |
| Tag taken from request body | Unintended invalidation, confusion across shops | Use configured `STORE_SLUG` tag only |
| Echoing verification detail | Oracle for attackers | Empty 401 body, no logging of signature |
| JSON-LD `JSON.stringify` unescaped | XSS through item titles | Replace `<` with `\u003c` |
| Showing unknown API fields | Future privacy leak | Explicit field mapping |
| Indexing preview deploys | Duplicate content, leaked staging | `APP_ENV` gate in `robots.ts`, `workers_dev: false` |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sold item shows a generic 404 | Dead end | Branded "found a new home" page with next steps |
| Empty filter result with no way back | Frustration | Show active filters as removable chips and a "clear all" |
| Decorative bag/account/wishlist icons look clickable | Confusion | `aria-hidden`, no hover affordance, or title text "Coming soon" decided with the owner |
| "Available on Vinted / eBay" with no link | Shoppers cannot act | Clear wording, platform names from config; track the missing per-item link as a How many follow-up |
| Layout jumps on image load | Poor feel, CLS score | Reserved aspect ratios everywhere |
| Price shown without currency context | Wrong expectations | Format with the item's currency and shop locale |

## "Looks Done But Isn't" Checklist

- [ ] **Webhook:** returns 204 locally -- verify on the deployed Worker that a stock change appears within seconds (Pitfalls 1, 3).
- [ ] **Time fallback:** disable the webhook for a test and confirm data refreshes after the TTL (Pitfall 4).
- [ ] **Tag cache:** `open-next.config.ts` has a non-dummy `tagCache`, wrangler has the D1/DO binding and the table exists (Pitfall 1).
- [ ] **No `use cache`:** grep finds no `'use cache'`, `cacheTag`, `cacheLife`, `cacheComponents` (Pitfall 2).
- [ ] **Fetch cache:** second request to a filtered URL makes zero outgoing API calls (Pitfall 5).
- [ ] **Build budget:** `next build` makes fewer than about 20 API calls (Pitfall 6).
- [ ] **Sold item:** URL returns HTTP 404, appears in neither sitemap nor grid after a webhook (Pitfall 8).
- [ ] **Images:** Lighthouse CLS under 0.1 and hero under 200 KB on mobile (Pitfall 9).
- [ ] **Env:** works with `--keep-vars` off after a fresh deploy; secret present; `SITE_URL` set (Pitfall 10).
- [ ] **Template:** guard test finds no shop strings or hex colours outside config; second-shop dry run builds (Pitfalls 11, 16).
- [ ] **JSON-LD:** three real items pass the Rich Results Test; price is `"25.00"`, condition Used (Pitfall 12).
- [ ] **Fonts:** only Bodoni 700 and Montserrat 400/500 requested; no faux bold; CLS fine (Pitfall 13).
- [ ] **Logos:** manifest-based, `arcteryx` renamed, text fallback works in production (Pitfall 17).
- [ ] **Robots:** non-production disallowed; filtered URLs noindex (Pitfalls 14, 24).
- [ ] **Windows:** deploy runs from CI, not from the dev machine (Pitfall 10).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Webhook no-op in production (1) | LOW | Add D1 tag cache binding and table, redeploy, send a signed webhook |
| Stale data after deploy (6) | LOW | Fire a signed webhook (or add the post-deploy CI step) |
| Wrong shop baked into pages (6, 16) | MEDIUM | Fix build env, rebuild, redeploy; use a fresh R2 bucket/prefix if bled |
| Soft 404s indexed (8) | MEDIUM | Move item fetch above the streaming boundary, redeploy, request recrawl; sitemap clean |
| Cache full of filter permutations (14) | LOW | Add normalisation + noindex; purge by deploying a new build ID; add R2 lifecycle |
| Rate limit exhausted (5, 20) | LOW | Raise TTL, normalise keys; the 429 recovers after `Retry-After` |
| Template leakage found late (11) | HIGH | Move values into `site.ts` and theme, add the guard test, re-run second-shop build |
| `cacheComponents` enabled and 500s (2) | MEDIUM | Remove flag and directives, revert to fetch-level caching, redeploy |

## Pitfall-to-Phase Mapping

Phase names are suggested and should be mapped onto the roadmap's real phases.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 No tag cache | Foundation / deploy skeleton; Webhook phase | End-to-end: edit, signed webhook, fresh page on the deployed Worker |
| 2 cacheComponents / `use cache` | Foundation | Grep guard; build config review |
| 3 `revalidateTag` signature/profile | Webhook phase | Typecheck; first request after webhook is fresh |
| 4 Missing time fallback | API cache phase | Disable webhook, wait for TTL, data refreshes; no "Failed to revalidate" logs |
| 5 Uncached fetch / rate limit | API client phase; All Items phase | Debug cache HIT; call counter in load test |
| 6 Build-time prerender | Foundation (CI); Catalogue phase | Build call budget; real build env assertion; post-deploy revalidation |
| 7 Webhook verification | Webhook phase | Unit vectors incl. unicode and non-hex signatures |
| 8 Removed items | Catalogue (item page); SEO | `curl -I` on sold item is 404; sitemap/JSON-LD updated after webhook |
| 9 Images and CLS | Foundation decision; Home; Catalogue; Polish | Lighthouse CLS/LCP on deployed Worker |
| 10 Build vs deploy env | Foundation | Fresh deploy smoke test; second environment |
| 11 Template leakage | Foundation, every phase | Guard test; second-shop build |
| 12 JSON-LD | SEO phase | Rich Results Test on real items; unit tests |
| 13 Fonts | Brand system phase | CLS; network panel; no faux bold |
| 14 Filter/search cardinality | All Items phase; SEO | Param normalisation tests; noindex check |
| 15 Worker limits | Foundation; Polish | Bundle size gate in CI |
| 16 R2 / build ID bleed | Foundation; Template hardening | Second-shop dry run |
| 17 Brand logos | Home / Brands phase | Production check with manifest; slug tests |
| 18 Next 16 breaking changes | Foundation | `typegen` + typecheck in CI |

## Research Flags for Roadmap

- **Needs deeper phase research:** the caching and webhook phase (exact OpenNext D1 tag cache setup: table schema, migration command, `WORKER_SELF_REFERENCE` naming; whether explicit fetch cache options are honoured after `await searchParams`; behaviour of cached `notFound()` results). Suggest a short spike with a deployed throwaway Worker before planning the phase.
- **Needs a decision from the owner:** the second brand-strip tier (sold-before brands), `arcteryx.svg` rename, Ralph Lauren naming, `SITE_URL`, whether to pay for Cloudflare Images.
- **Standard patterns:** static pages (About, Contact), fonts and tokens, brand page, JSON-LD builder, robots/sitemap structure.

## Sources

- Next.js 16.4.1 docs, read locally from `C:\Git\vintage\node_modules\next\dist\docs\01-app\`: `03-api-reference/04-functions/revalidateTag.md`, `updateTag.md`, `unstable_cache.md`, `fetch.md`, `02-guides/caching-without-cache-components.md`, `02-guides/incremental-static-regeneration.md`, `02-guides/upgrading/version-16.md`, `02-guides/json-ld.md`, `01-getting-started/08-caching.md`, `03-api-reference/01-directives/use-cache.md` and `use-cache-remote.md`, `03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `03-api-reference/04-functions/not-found.md`, `03-api-reference/02-components/font.md` and `image.md` [HIGH]
- OpenNext for Cloudflare: https://opennext.js.org/cloudflare/caching, /howtos/image, /howtos/env-vars, /get-started, /known-issues [MEDIUM]
- Installed source: `C:\Git\vintage\node_modules\@opennextjs\cloudflare` 1.20.13 (`dist/api/config.js`, `overrides/tag-cache/d1-next-tag-cache.js`, `do-sharded-tag-cache.js`) and `@opennextjs/aws` 4.1.12 (`overrides/tagCache/dummy.js`, `queue/dummy.js`, `core/routing/util.js`, `cacheInterceptor.js`) [MEDIUM]
- https://github.com/opennextjs/opennextjs-cloudflare/issues/1450 (Cache Components 500s on Workers, open as of 2026-10-26) [MEDIUM]
- Cloudflare Workers Node.js crypto compatibility: https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/ [MEDIUM]
- Vintage repo: `wrangler.jsonc`, `open-next.config.ts`, `next.config.ts`, `src/lib/env.ts`, `src/instrumentation.ts`, `.github/workflows/deploy-workers.yml` (Windows build note, `populateCache`, `vars` vs dashboard behaviour) [HIGH]
- How many API description: `C:\Git\blacktail\docs\refs\issues.json` (issues #1 to #3) [HIGH]
- [LOW] items are inference: cross-shop R2 key collision, cached `notFound()` lifetime, thumb aspect ratio, upstream CDN staleness, Google's treatment of Product markup on non-purchase pages, Workers plan limits.

---
*Pitfalls research for: headless Next.js 16 storefront on Cloudflare Workers (OpenNext) with tag-cached third-party API*
*Researched: 2026-10-26*
