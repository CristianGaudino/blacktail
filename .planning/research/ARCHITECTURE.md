# Architecture Patterns

**Domain:** Headless, read-only storefront template (Next.js 16 App Router) over the How many public API, one deploy per shop on Cloudflare Workers (OpenNext). No database, no auth, no mutations.
**Researched:** 2026-10-26
**Overall confidence:** HIGH for structure and conventions (read straight from `C:\Git\vintage`), MEDIUM for the Cloudflare cache/webhook wiring (docs read, not yet proven in this repo; see "Platform risk").

## Recommended Architecture

Vintage is "Server Components read through a data layer, Server Actions write, route handlers only for side channels". Blacktail keeps the first third and the third, and drops the middle: there is nothing to write. The "data layer" is an HTTP client instead of Drizzle. Everything else (layers, folders, naming, copy/config/routes/definitions split, env + instrumentation, `ui/` primitives, tokens in `globals.css`) carries over unchanged.

```text
How many (checkhowmany.com)                        Owner edits stock
  GET /api/v1/stores/{slug}[/items|/items/{code}|/filters]        |
          ^                                                       v
          | HTTPS, Zod-validated, fetch(next:{tags:['store:<slug>'], revalidate:600})
          |                                          POST /api/webhooks/howmany  (HMAC + 5 min window)
┌─────────┴───────────────────────────────────────────────┐        |
│ src/lib/howmany.ts   (server-only HTTP client)          │        |
│   one fetch wrapper: URL, tag, revalidate, Zod parse    │        |
│ src/lib/data/*.ts    (server-only reads, get* names)    │<-------+ revalidateTag(tag, {expire:0})
│   getStore / getItems / getItem / getFilters / getBrands│   (route handler, outside the render path)
│   return definitions.ts types, never raw API objects    │
└─────────┬───────────────────────────────────────────────┘
          │ async calls from Server Components only
          v
┌─────────────────────────────────────────────────────────┐
│ src/app/(shop)/**/page.tsx   (async Server Components)  │
│   parse searchParams (lib/params.ts) -> call data/*     │
│   generateMetadata, JSON-LD, notFound()                 │
└─────────┬───────────────────────────────────────────────┘
          │ props (plain data)
          v
┌─────────────────────────────────────────────────────────┐
│ src/components/<area>/*  view components (server by     │
│   default); small 'use client' islands only for         │
│   gallery, filter drawer, mobile nav, sort/filter forms │
│ src/components/ui/*  shared primitives                  │
└─────────────────────────────────────────────────────────┘
          ^ reads text/theme/identity from (never from the API, never hard-coded)
┌─────────────────────────────────────────────────────────┐
│ src/lib/copy.ts + config.ts + routes.ts   TEMPLATE      │
│ src/shop/*  +  public/{brands,images}/  +  env/wrangler │
│                                      <- PER-SHOP SEAM   │
└─────────────────────────────────────────────────────────┘
```

Two rules make the design hold together:

1. **Only `src/lib/howmany.ts` talks to the network.** No component, page or hook calls `fetch` for How many data. Browsers never call the API (rate limit is 3000/min per IP, shared by the server, and CORS/secret-less public API would still bypass the cache).
2. **Only `src/shop/`, `public/` and deploy config differ between shops.** Anything a second shop would need to change must already be reachable from there.

### Vintage pattern -> Blacktail mapping

| Vintage | Blacktail | Note |
|---------|-----------|------|
| `src/lib/db/data/<area>.ts` (reads, `get*`, `server-only`) | `src/lib/data/<area>.ts` | Same `index.ts` barrel, same "returns `definitions.ts` types, not raw rows" rule |
| `src/lib/db/data/shape.ts` (row -> DTO) | `src/lib/data/shape.ts` | API item -> `StoreItem` (adds nothing private; just derived fields such as `coverPhoto`, `labels`) |
| `src/lib/db/index.ts` (Neon client) | `src/lib/howmany.ts` (fetch wrapper) | The single infrastructure module |
| `src/lib/validation.ts` (Zod input contracts) | `src/lib/validation.ts` (Zod **response** schemas + query schemas) | Types derived with `z.infer` and re-exported through `definitions.ts` |
| `src/lib/params.ts` (searchParams -> query) | `src/lib/params.ts` | `parseItemsQuery`, `parsePage`, `itemsHref(query)` |
| `src/lib/db/actions/*` (`'use server'`) | **none** | No writes. Do not add a server-action layer |
| `src/lib/auth.ts`, `proxy.ts`, `(auth)` group | **none** | No auth, no proxy/middleware |
| `src/lib/env.ts` + `src/instrumentation.ts` | same, three variables | See "Env" |
| `src/app/api/webhooks/clerk/route.ts` | `src/app/api/webhooks/howmany/route.ts` | The only route handler |
| `src/lib/storeWebhook.ts` (vintage **sends** it) | test fixture | Reuse `signWebhook` shape in Blacktail's webhook test so sender and receiver cannot drift |
| `src/lib/storeApi.ts` + `src/app/api/v1/stores/**` (vintage **serves** the API) | reference for Zod schemas | Mirror the items/filters shape in `validation.ts`; copy its sample JSON into test fixtures |
| `src/components/ui/{buttons,display,Pager,Sheet,SearchField,ThumbImage}` | same names | Copy the primitives that fit; restyle through tokens |
| `src/lib/config.ts` `STORE_API` (page size, sorts) | `src/lib/config.ts` `STORE_API` | Keep the **same constant names** (`pageSize 24`, `maxPageSize 100`, `sorts`) so both repos read alike |
| `src/content/legal.ts` (long-form copy) | `src/shop/content.ts` | Precedent for "text too long for `COPY`" |
| `next.config.ts` headers + CSP, `images.unoptimized` | same, `img-src` = self + API photo origin | |
| `wrangler.jsonc`, `open-next.config.ts`, `deploy-workers.yml` | same, **plus a tag cache** | See "Platform risk" |
| `AGENTS.md` (Next 16 note) | copy verbatim | Read `node_modules/next/dist/docs/` before framework code |

## Component Boundaries

| Component | Responsibility | Communicates With | Server/Client |
|-----------|---------------|-------------------|---------------|
| `lib/env.ts`, `instrumentation.ts` | Zod-validate `STORE_SLUG` (slug regex), `HOWMANY_API_URL` (https URL), `HOWMANY_WEBHOOK_SECRET` (min length) at server start; readable error listing every problem | `howmany.ts`, webhook route | server |
| `lib/howmany.ts` | The only HTTP client. Builds URL `${API}/stores/${slug}${path}?${query}`, calls `fetch` with `next: { tags: [storeTag()], revalidate: CACHE.revalidateSeconds }`, maps status to errors (`404` -> `HowManyNotFound`, `400/429/5xx` -> `HowManyError` with `Retry-After`), Zod-parses the body | `env.ts`, `validation.ts`, `config.ts` | server-only |
| `lib/validation.ts` | Zod schemas for `/`, `/items`, `/items/{code}`, `/filters` responses (lenient on unknown keys and unknown enum values) and for the validated items query | `howmany.ts`, `params.ts`, `data/*` | shared |
| `lib/data/*.ts` | `getStore`, `getItems(query)`, `getItem(code)`, `getFilters`, `getBrands` (in-stock brands from `/filters` ordered by `orderBrands`), `getNewest(n)`, `getAllItemCodes()` for the sitemap. Return `definitions.ts` types | `howmany.ts`, `shape.ts`, pure libs | server-only |
| `lib/brands.ts` (pure) | `brandSlug(name)` (lowercase, drop accents and apostrophes, other chars -> `-`), `orderBrands({ inStock, soldBefore, defaultOrder })`, logo lookup against the generated manifest | `shop/`, `data/brands` | shared, unit-tested |
| `lib/money.ts` (pure) | `formatMoney(cents, currency)`; integer cents in, string out; no float maths | components | shared |
| `lib/labels.ts` or `config.ts` maps | Code -> Blacktail wording for `condition` (`A`/`AB`/`B`), `type`, `department`, `category`; unknown code falls back to the raw code, never throws | components | shared |
| `lib/params.ts` (pure) | `searchParams` -> validated `ItemsQuery` (repeat params -> arrays, clamp page, drop unknown values); `ItemsQuery` -> canonical API query string (keys and multi-values **sorted**, so equal filters share one cache entry); `itemsHref(query)` for links | pages, filter components, `data/items` | shared, unit-tested |
| `lib/metadata.ts`, `lib/jsonLd.ts` | `pageMetadata({title, description, path})`; `productJsonLd(item)` (price = cents/100, currency, `InStock`, condition mapping, image, brand); JSON is `<`-escaped before going into `<script>` | pages | server |
| `lib/webhook.ts` (pure) | `verifyWebhook({ secret, timestamp, signature, body, now })`: HMAC-SHA256 of `{ts}.{body}`, 300 s window, `timingSafeEqual` with equal-length guard | webhook route | server-only, unit-tested |
| `app/api/webhooks/howmany/route.ts` | Read raw body, verify, check `body.store === STORE_SLUG`, `revalidateTag(storeTag(), { expire: 0 })`, answer 204 fast (How many waits 5 s, never retries). 401 on bad signature/stale timestamp | `webhook.ts`, `env.ts` | route handler |
| `app/(shop)/**/page.tsx` | Compose: parse params -> call `data/*` -> pass props to a view. Own `generateMetadata`, `notFound()` | `data/*`, `params.ts`, `components/*` | server |
| `components/layout/*` | `SiteHeader` (nav from `config.NAV_ITEMS`, search, decorative bag/account/wishlist icons), `SiteFooter`, `MobileNav`, `Logo` (from `SHOP`) | `shop/`, `copy.ts` | server + small client |
| `components/home/*` | `Hero`, `BrandStrip`, `JustDropped` (scroll-snap carousel), `PromoBanners`, `CategoryTiles`, `StoryBand` — all text/images from `shop/` | `data/*` (only `BrandStrip`, `JustDropped`) | server |
| `components/items/*` | `ItemsView`, `ItemCard`, `ItemGrid`, `FilterSidebar` (+ mobile drawer on `ui/Sheet`), `SortSelect`, `ActiveFilters`, `Pager` use | props only | server + client islands |
| `components/item/*` | `ItemDetailView`, `Gallery` (client), `MeasurementList`, `AvailabilityNote` (Vinted/eBay line, platforms from `SHOP.platforms`), `ProductJsonLd` | props only | server + client |
| `components/brands/*` | `BrandLogo` (SVG by slug, text fallback), `BrandGrid` — shared by home strip and Brands page | `lib/brands.ts` | server |
| `components/about/*`, `components/contact/*` | Render `SHOP`/`content.ts` blocks | `shop/` | server |
| `components/ui/*` | `buttons.tsx`, `display.tsx`, `Pager.tsx`, `Sheet.tsx`, `SearchField.tsx`, `PhotoImage.tsx` (fixed aspect box from API width/height, placeholder on error), `Price.tsx`, `styles.ts` | tokens only | mixed |
| `src/shop/*` | **Per-shop seam** (below) | read by `layout`, `home`, `about`, `contact`, `lib/brands` | shared |

Dependency direction is one way: `app` -> `components` -> `lib`. `lib/data` never imports `components`; `lib/howmany.ts` imports nothing from `data`. Pure modules (`params`, `brands`, `money`, `webhook`, `jsonLd`) import no React and no `server-only` module except where marked.

## The Per-Shop Seam (keeps the template shop-agnostic)

A new shop is: clone the template, replace `src/shop/` and `public/{brands,images}/`, edit `wrangler.jsonc` vars/name/route, set one secret. No file under `src/app`, `src/components` or `src/lib` changes.

| Per-shop thing | Where it lives | Why there |
|----------------|----------------|-----------|
| `STORE_SLUG`, `HOWMANY_API_URL` | `wrangler.jsonc` `vars` (non-secret; vintage notes a `wrangler deploy` overwrites dashboard plain vars) and `.env.local` in dev | Deploy-time, validated by `env.ts` |
| `HOWMANY_WEBHOOK_SECRET` | Worker secret (dashboard / `wrangler secret put`), `.env.local` in dev | Secret, never in repo |
| Worker name, R2 cache bucket, D1 tag-cache DB, routes/domain | `wrangler.jsonc` (and the `WORKER_SELF_REFERENCE` service name must equal the Worker name) | Infra is per shop |
| Shop identity: `name`, `tagline`, `url` (canonical/OG base), `locale`, `logo` paths, `platforms: [{ id, label, url }]`, `contact` (email, address, hours, socials), `defaultBrandOrder: string[]`, `categoryTiles: [{ label, image, query }]`, `promoBanners`, `nav` overrides | `src/shop/shop.ts` exporting `SHOP` (`satisfies ShopConfig`, type in `definitions.ts`) | Vintage's `config.ts` pattern (`APP`, `OPERATOR`), but isolated so the file is the whole diff between shops |
| Long-form content: hero headline/sub, story band, About/Our story, Contact text, promo copy | `src/shop/content.ts` | Vintage precedent: `src/content/legal.ts`. Still plain data, still covered by the em-dash test |
| Theme tokens: Forest/Olive/Stone/Sand/Ivory, radii, serif/sans families | `src/shop/theme.css` imported by `globals.css` **after** the neutral base tokens | Tailwind v4 `@theme`; components use only semantic utilities (`bg-surface`, `text-fg-muted`, `bg-primary`), exactly as vintage's "never raw palette classes" rule |
| Fonts | `src/shop/fonts.ts` (`next/font/local`, files in `src/shop/fonts/`, OFL texts alongside) | `next/font` needs static literals, so fonts cannot be a runtime option. Same "kept in the repo, no Google download" reasoning as vintage `ui/fonts.ts` |
| Brand logos | `public/brands/<slug>.svg` + generated `src/shop/brandLogos.ts` manifest | Workers cannot `readdir` `public/` at runtime. A tiny `scripts/brand-logos.ts` (tsx, like vintage `scripts/seed.ts`) regenerates it; a Vitest test fails if the manifest and folder disagree |
| Hero/banner/tile/story images | `public/images/**`, referenced from `SHOP`/`content.ts` | Placeholders until real photos arrive |

What stays in the template (`src/lib`): `COPY` holds **generic UI strings** only (Filter, Sort by, Page X of Y, empty states, error messages, "Available on {platform}" built from `SHOP.platforms`), `config.ts` holds template limits (`STORE_API`, `CACHE.revalidateSeconds = 600`, sort options, filter keys and their order, label maps for codes, `NAV_ITEMS` shape, `ICON_SIZE`), `routes.ts` holds paths. No shop name appears in any of them; where wording needs the shop it takes it as a parameter (`COPY.metadata.title(shopName)`).

`copy.test.ts` (no em dash) must walk both `COPY` and `SHOP`/`content.ts`.

## Routes

One route group, since there is no auth/marketing/print split. Keeping a group (as vintage does) leaves room for a later `(print)`-style or checkout area without moving files.

```
src/app/
├── layout.tsx                 # root: fonts (shop/fonts), globals.css, <html lang>
├── error.tsx  global-error.tsx  not-found.tsx
├── robots.ts  sitemap.ts      # sitemap pages through getAllItemCodes() (tagged, so it refreshes with stock)
├── (shop)/
│   ├── layout.tsx             # SiteHeader + SiteFooter
│   ├── page.tsx               # Home (static + ISR)
│   ├── items/page.tsx         # All Items: ?q&sort&page&brand&type&size&colour&era&condition&department&minPrice&maxPrice
│   ├── items/[code]/page.tsx  # Item page: gallery, details, JSON-LD, generateMetadata
│   ├── just-dropped/page.tsx  # newest first, paged
│   ├── brands/page.tsx
│   ├── about/page.tsx
│   └── contact/page.tsx
└── api/webhooks/howmany/route.ts
```

`ROUTES` in `routes.ts`: `home`, `items`, `justDropped`, `brands`, `about`, `contact`, `item: (code) => ...`, `itemsFor: (query) => ...`. Never hard-code a path string (vintage rule). The "Shop" nav entry points at `items`.

## Data Flow

### Read path (the 99 % path)

1. Request reaches the Worker. Home, Brands, About, Contact and `items/[code]` are ISR pages (fetches carry `revalidate: 600` and the tag, so the rendered page entry inherits both). `items` and `just-dropped` depend on `searchParams` so render per request, but every API call underneath is served from the tagged fetch cache.
2. The page parses `searchParams` with `lib/params.ts` into a validated `ItemsQuery` (bad values dropped, never forwarded: stops the API's 400 and stops cache-key spam).
3. The page calls `getItems(query)` / `getFilters()` (in parallel with `Promise.all`, wrapped in `Suspense` + skeleton for the sidebar so the grid is not blocked by `/filters`).
4. `data/*` calls `howmanyFetch(path, schema, query)`. A cache hit costs no API request. A miss/stale costs one request against the shared 3000/min budget.
5. The response is Zod-parsed (unknown fields stripped, which also enforces the privacy whitelist), shaped into `definitions.ts` types, and returned.
6. The page passes props to a view component. Money is formatted by `formatMoney`; codes are labelled through the label maps; photos render with API `width`/`height` (`thumbUrl` in grids, `url` on the item page, first photo as cover and `priority` for the LCP image only).

### Invalidation path

1. Owner changes stock in How many -> POST `store.updated` to `/api/webhooks/howmany` with `X-Howmany-Timestamp` and `X-Howmany-Signature`.
2. `verifyWebhook` (raw body text, constant-time compare, 300 s window). Fail -> 401. Body store slug differs from `STORE_SLUG` -> ignore with 204 (never revalidate a tag the body names; always compute the tag from env).
3. `revalidateTag('store:<slug>', { expire: 0 })`. In Next 16 the one-argument form is deprecated; `'max'` gives stale-while-revalidate (shopper may see old stock once), `{ expire: 0 }` makes the next read blocking and fresh. Recommend `{ expire: 0 }` because the point of the webhook is "always up to date" and the catalogue is small. `updateTag` is Server-Action-only, so it does not apply here. (Next docs, HIGH.)
4. Return 204 immediately. A missed webhook (never retried) is covered by `revalidate: 600` on every fetch.

### Error path

- Item 404 -> `notFound()` (also covers sold items whose cached page outlives them: the revalidated fetch returns 404 and the page flips to not-found).
- Store 404 / 400 / unexpected shape -> thrown `HowManyError`, caught by `app/error.tsx` with `COPY.errors.*`; logged with `console.error('How many request failed', status, path)` (no secrets, no full query). 429 is logged with `Retry-After`.
- Unknown enum value in a response (a new `type` code) must **not** fail the Zod parse: schemas use `z.string()` for `type`/`condition`/`department`/`category`, and the label map falls back to the code. The API "only gains fields"; this keeps the storefront alive when it also gains values.
- The fetch wrapper throws on non-OK so a failed response is never stored as a good page; the stale entry (if any) keeps serving.

## Patterns to Follow

### Pattern 1: One tagged, validated fetch seam
**What:** every API read goes through one function that owns URL building, the cache tag, the revalidate window and the Zod parse.
**When:** always.
**Example:**
```typescript
import 'server-only';
import type { z } from 'zod';
import { CACHE } from './config';
import { storeEnv } from './env';

export const storeTag = () => `store:${storeEnv().STORE_SLUG}`;

export async function howmanyFetch<S extends z.ZodType>(path: string, schema: S, query = ''): Promise<z.output<S>> {
    const { HOWMANY_API_URL, STORE_SLUG } = storeEnv();
    const res = await fetch(`${HOWMANY_API_URL}/stores/${STORE_SLUG}${path}${query && `?${query}`}`, {
        next: { tags: [storeTag()], revalidate: CACHE.revalidateSeconds },
    });
    if (res.status === 404) throw new HowManyNotFound(path);
    if (!res.ok) throw new HowManyError(res.status, path, res.headers.get('retry-after'));
    return schema.parse(await res.json());
}
```

### Pattern 2: URL is the filter state
**What:** all list state (filters, `q`, sort, page) lives in `searchParams`; `params.ts` is the single parser/serializer. Filter UI is a GET form / links built by `itemsHref`, so it works without JS; client code only adds the mobile drawer and auto-submit.
**When:** All Items, Just Dropped, header search (`/items?q=`).
**Why:** shareable URLs, back button works, and server render is cacheable per canonical query.

### Pattern 3: Canonical query for cache hits
**What:** sort keys and repeated values, drop defaults (`page=1`, `sort=newest`), lowercase nothing the API treats as exact text.
**Why:** `fetch` cache key is the URL. Without this, `?type=a&type=b` and `?type=b&type=a` cost two API calls.

### Pattern 4: Shape at the edge, labels at the view
**What:** `data/shape.ts` derives UI types once (`coverPhoto`, `href`, numeric price in cents); views apply labels/formatting. Money stays `priceCents`; the `Cents` suffix is kept all the way to `formatMoney`.

### Pattern 5: Server components by default, islands for interaction
**What:** only `Gallery`, `FilterSidebar` drawer/auto-submit, `MobileNav`, optional carousel arrows are `'use client'`. Data is read in pages and passed down as props (vintage: `StockView` receives `result`).

### Pattern 6: Seam-first components
**What:** a component that needs shop-specific text, image, link or colour takes it from `SHOP`/`content.ts`/tokens. A review question for every PR: "would a second shop need to edit this file?"

### Pattern 7: Generated manifests over runtime fs
**What:** facts about `public/` (logo slugs) are baked into a committed, test-checked TS file rather than read at runtime.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-side fetch of the API
**What:** a `useEffect`/SWR hook calling How many from the browser (e.g. live search-as-you-type).
**Why bad:** bypasses the server cache and the tag, exposes call volume to the shared 3000/min per-IP limit (only server calls share an IP, so it also hides the problem until it breaks), second contract to maintain (vintage's own "Client-side fetch for app data" anti-pattern).
**Instead:** submit-based search into `/items?q=`; render on the server.

### Anti-Pattern 2: `revalidatePath`, `unstable_cache`, `'use cache'` / `cacheComponents`
**What:** using anything other than fetch-level `tags` + `revalidate` for this data.
**Why bad:** the tag is the contract with the webhook; vintage's `next.config.ts` explicitly leaves `cacheComponents` off because OpenNext on Workers cannot run it yet (opennextjs-cloudflare#1450 as cited there). Re-check before relying on it.
**Instead:** one tag per store on every fetch.

### Anti-Pattern 3: Hard-coding the shop
**What:** "Blacktail Archive", `#1F2A1F`, `vinted.com/...`, brand order or logo paths in a component or in `COPY`.
**Why bad:** kills the template goal and the second deploy.
**Instead:** `SHOP`, `content.ts`, `theme.css`, tokens.

### Anti-Pattern 4: Spreading or forwarding API objects
**What:** `{ ...item }` into props, or passing unvalidated `searchParams` to the API.
**Why bad:** privacy whitelist is Zod's job here (cost/notes/internal ids are already absent, but a future field must not leak into markup or JSON-LD by accident); bad params yield 400s that become error pages.
**Instead:** explicit schema, explicit shape, validated query.

### Anti-Pattern 5: Trusting the webhook body for the tag
**What:** `revalidateTag(\`store:${JSON.parse(body).store}\`)` as in the issue's sample.
**Why bad:** a valid signature proves the sender, but computing the tag from env removes any chance of revalidating something else; also the sample uses the deprecated one-argument form.
**Instead:** `storeTag()` from env, `{ expire: 0 }`.

### Anti-Pattern 6: Failing the page on unknown values
See Error path: lenient enums plus label fallbacks.

### Anti-Pattern 7: Build depending on the live API for every page
**What:** `generateStaticParams` listing every item.
**Why bad:** a build makes N API calls from the CI IP (shared rate limit) and fails if the API is down.
**Instead:** `generateStaticParams` returns `[]` (or the newest few) and `dynamicParams` stays on; item pages render on first hit and are then cached by tag. Home/Brands will still call the API at build, so CI needs network access and the build should tolerate a failure only if a deliberate decision is made.

### Anti-Pattern 8: Date/time-dependent output in cached pages
No "new" badge computed from `Date.now()` in an ISR page. Derive from `publishedAt` at render with a coarse threshold or omit.

## Cross-Cutting

- **Env (`env.ts`):** `serverSchema = z.object({ STORE_SLUG: z.string().regex(/^[a-z0-9-]+$/), HOWMANY_API_URL: z.url({ protocol: /^https?$/ }) (strip trailing slash), HOWMANY_WEBHOOK_SECRET: z.string().min(16) })`, same `msg()` helper and "Invalid environment variables:" message as vintage, `instrumentation.ts` calls `storeEnv()` under `NEXT_RUNTIME === 'nodejs'`. Vintage already runs this on OpenNext/Workers, so the pattern is proven; still confirm `register()` fires in the deployed Worker, and keep `storeEnv()` as the fail-fast on first use either way.
- **Security headers / CSP:** copy vintage's `next.config.ts` structure. `img-src 'self' data:` plus the API's photo origin; `script-src 'self' 'unsafe-inline'` (Next bootstrap); no third parties at all in v1. The photo host is not in the env list, so either derive it from `HOWMANY_API_URL` (same domain family) or add an optional `HOWMANY_PHOTO_ORIGIN`; decide in phase 1 once real photo URLs are visible.
- **Images:** `images: { unoptimized: true }` as in vintage (OpenNext image optimisation needs extra Cloudflare setup, and the API already supplies `thumbUrl`/`url`). Local hero/banner images must therefore be pre-sized in `public/images/`.
- **Testing (Vitest, colocated):** `params.test.ts`, `brands.test.ts` (slug rule incl. `Arc'teryx` -> `arcteryx`, order tiers, text fallback), `money.test.ts`, `webhook.test.ts` (valid, wrong secret, stale, future, wrong length, tampered body), `jsonLd.test.ts`, `copy.test.ts`, `env.test.ts`, `howmany.test.ts` (stubbed `fetch`: 404, 429 with Retry-After, schema drift with extra fields, unknown enum value), `brandLogos.test.ts` (manifest = folder), `globals.test.ts` (tokens present). No `.int.test.ts` tier is needed because there is no DB.
- **Logging:** `console` only, never the secret, signature or full query string.
- **Conventions carried over verbatim:** named exports, 4-space indent, single quotes, aligned object keys, `import 'server-only'` first line of server modules, `@/*` alias, `Cents` suffix, `as const` + `satisfies`, `// ───` section dividers, `// shortcut:` comments with a reason, no bare `eslint-disable`.

## Platform risk (decide in the first phase, not the last)

Vintage's `open-next.config.ts` configures **only** the R2 incremental cache (`r2IncrementalCache`) and vintage never calls `revalidateTag`. Blacktail's whole freshness story depends on `revalidateTag`. Per OpenNext's Cloudflare caching docs (MEDIUM, read 2026-10-26, not yet exercised here), on-demand revalidation needs a **tag cache** in addition to the incremental cache, plus a queue for ISR:

```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache, queue: doQueue, tagCache: d1NextTagCache });
```

Bindings added to `wrangler.jsonc`: `NEXT_CACHE_DO_QUEUE` (Durable Object `DOQueueHandler`, with its `migrations` entry) and `NEXT_TAG_CACHE_D1` (D1 database with a `revalidations` table). D1 tag cache is the documented choice for small/low-traffic sites, which a single shop's storefront is; the sharded-DO tag cache is the upgrade path. Without a tag cache the docs only say it is "needed for on-demand revalidation", so assume the webhook would silently do nothing and the site would fall back to the 10-minute timer.

**Therefore the first deployable slice must prove: fetch-tagged data + webhook -> `revalidateTag` -> fresh page on a real Worker**, using a signed `curl` against a deployed preview. It also needs to confirm that the Next 16 two-argument `revalidateTag` is honoured by the OpenNext version in use.

## Scalability Considerations

| Concern | One shop (~hundreds of items, ~100 users/day) | ~10K visitors/day | Many shops / traffic spikes |
|---------|-----------------------------------------------|-------------------|-----------------------------|
| API rate (3000/min/IP shared) | Cache keeps it to a handful of calls per 10 min | Still bounded by distinct URLs, not visitors; canonical queries matter | Each deploy has its own Worker; shared-IP risk is across Cloudflare egress, so keep fetch cache hit rate high and honour `Retry-After` by serving stale |
| Filter combinations | Few distinct URLs | Crawlers can enumerate combinations: consider `robots` disallow of filtered `/items?` URLs beyond `page`, canonical to `/items` | Same, plus cap `limit` and ignore unknown params |
| Webhook storms | Owner edits several items -> several webhooks | Each `{ expire: 0 }` causes one blocking refetch per distinct URL on next visit | Could debounce at How many; Blacktail stays idempotent and cheap |
| Tag cache | D1, single tag | D1 still fine | Sharded DO tag cache |
| Catalogue size | `/filters` and sitemap are small | Page `/items` already server-paged | Sitemap paged via `generateSitemaps` if items exceed ~50k URLs (unlikely) |
| Multi-tenant (out of scope) | n/a | n/a | The slug is already a parameter of `howmanyFetch`/`storeTag`; a host -> slug lookup would replace `storeEnv().STORE_SLUG` in one place, but `SHOP`/theme/fonts are build-time, so true multi-tenant also needs runtime shop config |

## Suggested Build Order

Dependencies drive the order; the platform proof comes first because it is the only thing that can invalidate the architecture.

1. **Scaffold + conventions + deploy skeleton.** Next 16 app, `tsconfig` alias, ESLint, Vitest, `AGENTS.md`, `env.ts` + `instrumentation.ts`, `routes.ts`, `definitions.ts`, `config.ts`/`copy.ts` skeletons with the em-dash test, `wrangler.jsonc`, `open-next.config.ts` **with D1 tag cache and DO queue**, `deploy-workers.yml`. Needed by everything.
2. **API client + schemas + cached data layer** (`howmany.ts`, `validation.ts`, `data/*`, `shape.ts`, `params.ts`, `money.ts`, fixtures copied from vintage's API shape) with unit tests. Depends on 1. Unblocks every page.
3. **Webhook route + verifier, and the end-to-end freshness proof on a deployed Worker** (a throwaway page that lists item count/titles). Depends on 1-2. Retires the main platform risk before any UI is built.
4. **Shop seam + design system + shell:** `src/shop/` (config, content, theme.css, fonts), `globals.css` tokens, `ui/` primitives, `layout/` header/footer/mobile nav, `(shop)/layout.tsx`, placeholders in `public/images/`. Can run in parallel with 2-3 if two people work, but must precede all pages that use tokens/copy.
5. **All Items:** `ItemCard`, `ItemGrid`, `FilterSidebar` (+ drawer), `SortSelect`, pager, search, `items/page.tsx`. Depends on 2, 4. `ItemCard` is reused by home and Just Dropped, so build it here.
6. **Item page:** gallery, details, availability note, `generateMetadata`, JSON-LD, `notFound`, `generateStaticParams -> []`. Depends on 2, 4, 5 (card links, labels).
7. **Brands logic + Brands page:** `brands.ts` (slug, tiers, fallback), logo manifest script + test, `BrandLogo`/`BrandGrid`. Depends on 2, 4. Needed by Home's strip.
8. **Home + Just Dropped:** hero, brand strip, carousel, promo banners, category tiles, story band; `just-dropped/page.tsx`. Depends on 5, 7.
9. **About + Contact, sitemap, robots, not-found/error boundaries, metadata polish.** Depends on 4 (and 2 for sitemap).
10. **Mockup-fidelity and responsive pass; per-shop onboarding doc** (what to change for a second shop, listed from the seam table). Last, because it touches every component.

Parallelisable: 4 with 2-3; 7 with 5-6; 9 with 8.

**Research flags for phases:**
- Step 1/3 (OpenNext tag cache, queue, D1 binding, `revalidateTag` two-argument behaviour): needs hands-on verification, highest risk.
- Step 5 (filter UI progressive enhancement, mobile drawer, `/filters` ranges for price slider): moderate; design in the mockups, behaviour is standard.
- Step 7 (sold-before brand tier has no API source): blocked on a How many decision; ship tiers 1 and 3 and leave `soldBefore` as an empty input to `orderBrands`.
- Steps 2, 4, 6, 8, 9: standard patterns, no extra research.

## Open Questions

- Photo origin for CSP: confirm real `url`/`thumbUrl` hosts (vintage uses `PHOTO_BASE_URL`, `photos.checkhowmany.com`) and whether to derive or add an env.
- Sorting of the "in stock" brand tier: by count desc (what `/filters` returns) or alphabetical, versus the mockup.
- Does `register()` run on OpenNext Workers in the deployed build (vintage relies on it)? If not, rely on first-use validation.
- `ralph-lauren.svg` vs `polo-ralph-lauren.svg` and `arc-teryx.svg` -> `arcteryx.svg` rename: affects the manifest test; listed in PROJECT.md open items.

## Sources

- `C:\Git\vintage\.planning\codebase\STRUCTURE.md`, `CONVENTIONS.md`, `ARCHITECTURE.md` (HIGH)
- `C:\Git\vintage\src\lib\config.ts`, `env.ts`, `instrumentation.ts`, `routes.ts`, `storeApi.ts`, `storeWebhook.ts`, `metadata.ts`, `components/ui/`, `styles/globals.css`, `next.config.ts`, `wrangler.jsonc`, `open-next.config.ts` (HIGH, read directly)
- `C:\Git\blacktail\.planning\PROJECT.md` and `docs\refs\issues.json` (issues #1 outline, #2 API contract and webhook sample) (HIGH)
- Next.js, "revalidateTag Single Argument Deprecated": https://nextjs.org/docs/messages/revalidate-tag-single-arg (HIGH, official)
- OpenNext Cloudflare caching: https://opennext.js.org/cloudflare/caching (MEDIUM, official docs, not exercised in this repo; search results showed older pages disagreeing on KV vs R2, current page uses R2)
