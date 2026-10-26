# Project Research Summary

**Project:** Blacktail
**Domain:** Headless, read-only pre-loved menswear storefront over the How many API. Next 16 on Cloudflare Workers (OpenNext), one deploy per shop, no checkout.
**Researched:** 2026-10-26
**Confidence:** MEDIUM-HIGH overall. Stack and architecture are HIGH. The OpenNext cache and webhook path is MEDIUM until Phase 2 proves it.

## Executive Summary

- The site is a read-only, server-rendered storefront. Server components read through one HTTP client, cached by the fetch tag `store:<slug>`. A signed webhook calls `revalidateTag(tag, { expire: 0 })`, and `revalidate: 600` on every fetch covers a missed webhook. The structure is Vintage's, minus writes and the database.
- The stack mirrors `C:\Git\vintage`: Next 16.4.1, React 19.3.0, OpenNext 1.20.13, Wrangler 4.151.3, Tailwind 4, Zod 4, Vitest 5, ESLint 9, Node 24.
  - **One required difference:** Vintage's `open-next.config.ts` has only an R2 incremental cache. Its tag cache and queue are dummies, so `revalidateTag` silently does nothing.
  - **Blacktail needs:** R2, a D1 tag cache and a DO queue.
  - **Stays off:** Cache Components and `'use cache'` (opennextjs-cloudflare #1450 is still open).
- **Main risks:**
  - The webhook returns 204 but nothing is invalidated.
  - Uncached or unnormalised calls use up the shared 3000/min API budget. Build-time prerendering counts too.
  - Sold items show as soft 404s or stale JSON-LD.
  - The webhook verifier crashes, or it trusts the request body for the tag.

## Key Findings

### Recommended Stack

- **Pins:**
  - Node 24, Next 16.4.1, React 19.3.0, `@opennextjs/cloudflare` 1.20.13.
  - Wrangler 4.151.3, with `nodejs_compat` and `global_fetch_strictly_public`.
  - Tailwind 4.3.3 with `@tailwindcss/turbopack`, Zod 4.6.7, ESLint 9 with `eslint-config-next` 16.4.1.
  - TypeScript 5.9, not 7, because typescript-eslint breaks on 7.
- **Bindings:**
  - R2 `NEXT_INC_CACHE_R2_BUCKET`.
  - D1 `NEXT_TAG_CACHE_D1`.
  - DO `NEXT_CACHE_DO_QUEUE`, with `DOQueueHandler` and migration v1.
  - Service `WORKER_SELF_REFERENCE`, which must equal the Worker name.
  - Not KV, not the regional cache, not the sharded DO in v1.
- **Images:** `images.unoptimized: true`. Pre-size local photos.
- **Fonts:** commit the woff2 files and load them with `next/font/local` (Bodoni 700, Montserrat 400/500).
- **Build and deploy:** Linux CI or WSL only.
- **Do not add:** a carousel library, clsx, a data-fetching library, nuqs, date-fns, sharp, `@vercel/og`, Playwright (for now) or Prettier.

### Expected Features

**API constraints:**
- `/filters` counts are store-wide, so show them only when no filter is active.
- There is no sold state. A 404 means the item is gone.
- Unknown category, type, condition or department values return 400, so validate params first.
- `q` matches title, brand and colour only.
- Sizes need their own ladder sort.
- Measurements are `pitToPitMm` and `lengthMm`, shown in cm, measured laid flat.
- There is no per-item link and no flaw notes.
- Money is in cents.

**Must have (table stakes):**
- **Filtering and browsing:**
  - URL-driven filters, sort, search and page.
  - Multi-select facets that hide groups with fewer than 2 options.
  - Labels that fall back to the raw code.
  - Price range filter and sort (newest, price up, price down).
  - Filter chips with a count.
  - Numbered pagination at 24 per page.
  - Mobile drawer: a native `dialog` with a GET form and an Apply button.
  - Cards that use `thumbUrl`.
- **Item page:** gallery with lightbox, measurements, condition key, attributes, price, item code, a Vinted/eBay line with profile buttons, a "how buying works" note, and alt text.
- **Missing and empty states:**
  - A real 404 with a branded page for gone items.
  - Last-good-data fallback that never caches errors.
  - Empty states.
- **Search and SEO:**
  - Metadata, OG tags, and JSON-LD `Product` with `InStock`, `UsedCondition`, the price as a decimal string, and `<` escaped.
  - A tagged sitemap with `lastmod` from `publishedAt`, and robots rules.
  - `noindex,follow` on filtered, sorted or searched listings.
- Decorative bag, account and wishlist icons.

**Should have (v1.x differentiators):**
- A "New" badge, without `Date.now` in cached pages.
- "More from this brand" and similar items.
- Measurement range filters, and a "how we measure" guide.
- Second photo on hover, and sharing.
- `/brands/[slug]` landing pages, and brand search inside the facet.

**Defer (v2+):** per-item buy link, sold-brand tier, checkout with reservation, a working wishlist, generated OG images, contextual facet counts, RSS.

**Anti-features:** stock counters and timers, sold badges and fake sold pages, infinite scroll, instant filters on mobile, client-side filtering, reviews or `aggregateRating`, a currency switcher, an enquiry form, a newsletter, and any cost, notes or margins.

### Architecture Approach

Only `src/lib/howmany/` calls the network. Only `src/shop/`, `public/brands/`, `public/images/` and the deploy config differ per shop.

**Major components:**
1. **`env.ts` and `instrumentation.ts`:** validate `STORE_SLUG`, `HOWMANY_API_URL`, `HOWMANY_WEBHOOK_SECRET` and the proposed `SITE_URL`.
2. **`lib/howmany/`:**
   - `howmanyFetch` with `cache: 'force-cache'`, `next.tags` and `revalidate: 600`.
   - A 404 becomes `null` in `getItem`. 400, 429 and 5xx become typed errors.
   - Lenient Zod schemas.
3. **`lib/data/*`:** `getStore`, `getItems`, `getItem`, `getFilters`, `getBrands`, `getNewest` and `getAllItemCodes`, all returning types from `definitions.ts`.
4. **`lib/params.ts`:** an allow-list, a sorted canonical query, and `itemsHref`.
5. **`lib/webhook.ts`:** HMAC over `ts.rawBody`, a 300 s window, a constant-time compare and a hex guard.
6. **Webhook route:**
   - Reads the raw body once and answers 401 with an empty body on failure.
   - Ignores other stores and takes the tag from env.
   - Returns 204 fast.
7. **`app/(shop)/**`:** async server pages.
8. **`components/*`:** feature folders plus `ui/`.
9. **`src/shop/*` (the per-shop seam):** `shop.ts`, `content.ts`, `theme.css`, `fonts.ts`, and the `brandLogos.ts` manifest.
10. **`lib/config.ts`, `copy.ts` (generic strings only), `routes.ts` and `definitions.ts`.**

**Routes:**
- Pages: `/`, `/items`, `/items/[code]`, `/just-dropped`, `/brands`, `/about`, `/contact`.
- Metadata and errors: `robots.ts`, `sitemap.ts`, not-found, error and global-error.
- The only handler: `/api/webhooks/howmany`.

**OpenNext:**
- `open-next.config.ts` is `defineCloudflareConfig({ incrementalCache: r2IncrementalCache, queue: doQueue, tagCache: withFilter({ tagCache: d1NextTagCache, filterFn: softTagFilter }) })`.
- Wrangler `main` is `.open-next/worker.js`.
- R2 lifecycle of about 30 days. One set of D1 and R2 per shop.

**Patterns:**
- One tagged fetch seam, with the URL as filter state and the canonical query as the cache key.
- Shape data at the edge and apply labels in the view.
- A generated brand-logo manifest, because Workers have no filesystem over `public/`.
- `generateStaticParams` returns `[]`, with `dynamicParams` on.

### Critical Pitfalls

1. **No tag cache makes revalidation a silent no-op.**
   - *Prevent:* D1 tag cache and DO queue bindings, plus the table.
   - *Verify:* send a signed webhook and see the new value on the deployed Worker within seconds.
2. **`cacheComponents` and `'use cache'` cause 500s or hangs on Workers.**
   - *Prevent:* keep the flag off, with a grep test for `'use cache'`, `cacheTag`, `cacheLife` and `cacheComponents`.
3. **Wrong `revalidateTag` call.** The one-argument form is deprecated, and `'max'` is stale-while-revalidate.
   - *Prevent:* use `{ expire: 0 }` with the tag built from env, and typecheck in CI.
   - Not `updateTag`, `revalidatePath` or `unstable_cache`.
4. **Uncached fetches and the rate limit.** Build-time prerendering of Home and Brands bakes in data and uses up the budget.
   - *Prevent:* explicit cache options in one wrapper, normalised keys, `generateStaticParams` returning `[]`, a build budget of about 20 calls, and a signed webhook after each deploy.
   - *Verify:* a second filtered request makes zero outgoing calls.
5. **Webhook verifier faults.** `timingSafeEqual` throws on a multi-byte signature of equal string length, giving 500 instead of 401. JSON is parsed before auth, and the tag comes from the body.
   - *Prevent:* read the raw text once, check a hex regex and the byte length before `timingSafeEqual` (or use WebCrypto verify), parse after verifying, and ignore other stores.
   - Unit vectors for these cases go in Phase 2.
6. **Sold items.** A streaming boundary above the item gives a soft 404 (status 200), and a cached page can outlive the sale.
   - *Prevent:* fetch before any Suspense. When `getItem` returns `null`, call `notFound()` in both `generateMetadata` and the page. Use the same tag everywhere.
   - *Verify:* `curl -I` returns 404 after the webhook.
7. **Env and deploy.** Plain dashboard vars are overwritten by `wrangler deploy`, a placeholder build env bakes in the wrong shop, and Windows cannot build OpenNext.
   - *Prevent:* vars in `wrangler.jsonc`, secrets through `wrangler secret put`, a real build env, and `populateCache remote` before deploy. Build in CI or WSL only.

**Also watch for:**
- Shop strings leaking into generic code (guard test).
- Font weights outside Bodoni 700 and Montserrat 400/500.
- `fs.existsSync` used for logos. Use the manifest, and watch `arc-teryx` case sensitivity.
- Next 16 breaking changes: async params, `proxy.ts`, and `preload` instead of `priority`.

## Implications for Roadmap

### Phase 1: Foundation and deploy skeleton
**Scope:**
- Scaffold, conventions, env, and skeletons for routes, definitions, config and copy.
- `open-next.config.ts` with R2, D1 and DO, plus the Wrangler bindings.
- `ci.yml` with a worker job, and `deploy-workers.yml` with `populateCache remote`.
- A grep guard for `use cache`, and guard tests for shop strings and em dashes.

**Avoids:** 1, 2, 7, 10, 11, 16, 18.
**Research flag:** verify D1 table creation, the binding names, `WORKER_SELF_REFERENCE` and the R2 lifecycle.

### Phase 2: API client, webhook and freshness proof
**Scope:**
- The `lib/howmany` client with lenient schemas.
- The webhook verifier with unit vectors, and the route using `{ expire: 0 }`.
- A round-trip test: build, preview or deploy, change the mock payload, send a signed POST, re-read and assert.
- 401 checks, and a cache-hit test for filtered URLs.

**Avoids:** 1, 3, 4, 5, 7, 19–21.
**Research flag (highest):**
- Run a spike on a throwaway deployed Worker.
- Settle whether `force-cache` holds after `await searchParams`, whether to use `{ expire: 0 }` or `'max'`, and whether `register()` fires on Workers.
- Plan this phase with `/gsd-plan-phase --research-phase 2`.

### Phase 3: Data layer, params and pure libs
**Scope:**
- `lib/data` and `params` (allow-list, canonical query).
- `money` (Intl), label maps and the size ladder.
- `brands.ts` (`brandSlug`, `orderBrands`), `jsonLd` and metadata.
- Fixtures from Vintage, and schema-drift tests.

**Avoids:** 5, 14, 22, 25. Standard patterns.

### Phase 4: Shop seam, design system and shell
**Scope:**
- `src/shop/*`, tokens with `@theme inline`, fonts, and `public/_headers` marked immutable.
- `ui/` primitives, header, footer and mobile nav, and the `(shop)` layout.
- Placeholders named by slot.

**Avoids:** 9, 11, 13, 17, 26. Standard patterns.

### Phase 5: All Items
**Scope:**
- `items/page` with a Suspense sidebar.
- `ItemCard` and `ItemGrid` (reused later).
- `FilterSidebar`, `SortSelect`, chips and `Pager`.
- Header search and the mobile `dialog` drawer.
- `prefetch={false}` on grids, and `noindex` on filtered listings.

**Avoids:** 5, 14, 23. Moderate: test the no-JS path and the focus trap.

### Phase 6: Item page and not-found
**Scope:**
- `getItem` with `notFound`, and `generateStaticParams` returning `[]`.
- Gallery island, measurements, condition key, attributes, availability note and item code copy.
- `generateMetadata`, JSON-LD with escaping, and a branded not-found page.

**Avoids:** 8, 9, 12, 22.
**Needs:** grade meanings from the owner. Validate 3 items in the Rich Results Test.

### Phase 7: Brands and Home (with Just Dropped)
**Scope:**
- The logo manifest script and its test.
- `BrandLogo` and `BrandGrid` with the text fallback, and `orderBrands` with a sold-before stub.
- `/brands` and `/just-dropped`.
- Home sections: hero, brand strip, Just Dropped (scroll-snap), promo banners, category tiles and story band. Hide empty sections.

**Avoids:** 6, 9, 17.
**Blocked:** the sold-before tier has no data source, so stub it.

### Phase 8: About, Contact, sitemap, robots, error pages and SEO polish
**Scope:**
- Static pages from `SHOP` and `content` only.
- A paged, tagged sitemap.
- Robots: disallow unless `APP_ENV` is production.
- Canonical URLs and `metadataBase` from `SITE_URL`, and `workers_dev: false`.

**Avoids:** 8, 14, 24. Standard patterns.

### Phase 9: Hardening and second-shop dry run
**Scope:**
- Responsive pass and an onboarding doc.
- A throwaway second `SHOP` built in CI.
- A bundle-size gate, and Lighthouse CLS/LCP on the Worker.
- A post-deploy smoke test and an API call counter.
- Optional v1.x items.

**Avoids:** 9, 11, 15, 16, 26.

### Phase Ordering Rationale

- Phases 1 and 2 retire the risks that would break the architecture first.
- Phase 3 is pure logic and unblocks everything else. Phase 4 can run alongside it.
- Phase 5 comes before 6 and 7, which reuse `ItemCard`, links and labels.
- Phase 7 isolates the blocked sold-before tier.
- Phases 8 and 9 touch every route, so they come last.

### Research Flags

- **Needs deeper research:**
  - Phase 2 (freshness round-trip, highest priority).
  - Phase 1 (bindings and D1 table).
- **Standard patterns:** Phases 3, 4 and 8.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Cache wiring stays MEDIUM until Phase 2 proves it |
| Features | MEDIUM | Google's docs are HIGH. Competitor notes are LOW-MEDIUM |
| Architecture | HIGH / MEDIUM | Structure is HIGH. Cache wiring is MEDIUM |
| Pitfalls | MEDIUM-HIGH | LOW items are inferences, and each has a named test |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

**Caching and runtime:**
- **Freshness round-trip on a deployed Worker:** unproven. It is the Phase 2 exit gate.
- **`{ expire: 0 }` vs `'max'`:**
  - Recommend `{ expire: 0 }`.
  - Issue #1458 reports 500s, but only under Cache Components.
  - Verify it, and record the choice in `config.ts`.
- **`cache: 'force-cache'` after `await searchParams`:** is it honoured? Verify with a zero-call test. The fallback is `fetchCache = 'default-cache'` on list routes.
- **Cached `notFound()` lifetime:** test that a re-listed item shows after the webhook.

**Config and assets:**
- **Photo origin for the CSP:** Vintage used `photos.checkhowmany.com`. Decide in Phase 1.
- **`SITE_URL`:** PROJECT.md lists 3 env vars. Recommend adding `SITE_URL` (owner decision).
- **Real photo sizes:**
  - These decide whether `unoptimized` holds. The `IMAGES` binding is the fallback.
  - `thumbUrl` may not have the same aspect ratio as `width`/`height`, so use fixed aspect boxes.

**Owner input on content:**
- **Grade meanings (A, AB, B):** needed before launch copy.
- **Catalogue details:**
  - The size ladder and whether there are numeric sizes.
  - How many items have measurements.
  - Whether the item code goes in Vinted/eBay listings (a business decision).
- **Brands:**
  - The default brand order.
  - A source for sold-before brands (stubbed until then).
  - The Ralph Lauren spelling.
  - Rename `arc-teryx.svg` to `arcteryx.svg`, or add an alias map.
- **Fonts:** Bodoni italic and latin-ext only if the mockups or content need them.

**Housekeeping:**
- **Path conflicts:** the files disagree on paths.
  - STACK.md says `src/lib/howmany/client.ts`.
  - ARCHITECTURE.md says `src/lib/howmany.ts`.
  - PITFALLS.md says `src/config/site.ts`.
  - Resolve in Phase 1 by following ARCHITECTURE: `src/lib/howmany/` and `src/shop/`.
- **Dependency bumps (Next 16.4.3, React 19.3.1):** make them deliberately, after the smoke test.

## Sources

### Primary (HIGH confidence)
- Vintage repo files, the installed Next 16.4.1 docs, and the Next `revalidate-tag-single-arg` doc.
- Google Search Central docs on merchant listings and HTTP status codes.
- `C:\Git\blacktail\docs\refs\issues.json` and PROJECT.md.
- `@fontsource/bodoni-moda` 5.3.0.
- Cloudflare Images pricing.

### Secondary (MEDIUM confidence)
- `@opennextjs/cloudflare` 1.20.13 and `@opennextjs/aws` 4.1.12 source.
- opennext.js.org pages on caching, images, getting started and known issues.
- Cloudflare Workers Node crypto docs.
- opennextjs-cloudflare issues and PRs #1450, #1318, #1464, #1458, #1455, #1295, #1103 and #1281 (read 2026-10-26).
- Vintage Fashion Guild and grading guides.

### Tertiary (LOW confidence)
- Competitor notes (LOW-MEDIUM).

---
*Research completed: 2026-10-26*
*Ready for roadmap: yes*
