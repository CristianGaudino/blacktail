# Phase 3: Item and Brand Pages - Research

**Researched:** 2026-11-03
**Domain:** Next.js 16.4.1 App Router dynamic pages on OpenNext/Cloudflare, over a tagged read-only REST client
**Confidence:** HIGH (the 404 behaviour was reproduced with a throwaway `next build` + `next start` against the live API; the Worker itself was not run, see Open Questions)

<user_constraints>
## User Constraints (from 03-CONTEXT.md)

### Locked Decisions
- **D-01:** On desktop the gallery is one large photo with a column of thumbnails beside it. Clicking a thumbnail swaps the large photo.
- **D-02:** On a phone the gallery is a swipe carousel (scroll-snap, no library) with a position indicator (dots).
- **D-03:** Clicking the large photo opens a lightbox dialog with the full-size photo, previous and next arrows, a close button and keyboard support. Reuse `src/hooks/useModalDialog` and the existing `Sheet` pattern where it fits.
- **D-04:** The cover photo (first, in the seller's order) loads with `priority`; the others lazy-load. Every photo uses the API `url` with its `width` and `height` and a CSS `aspect-ratio`, so nothing shifts (images stay `unoptimized`).
- **D-05:** Details are a label/value list: Size, Colour, Era, Department, Condition (in words: A Excellent, AB Very good, B Good), Material when present. A row with no value is left out. Labels come from the existing code-label maps in `COPY` (unknown codes fall back to the capitalised code).
- **D-06:** Measurements (Pit to pit, Length) show in **both cm and inches** (e.g. 56 cm / 22 in), converted from the API's mm. The block is hidden when the item has neither.
- **D-07:** The "where to buy" block is a line ("This piece is listed on Vinted and eBay") with a link button per platform to the shop's profile. Platform names and URLs come from `SHOP.platforms`, so nothing is hard coded. No buy button and no per-item link.
- **D-08:** "More from this brand" shows the **4 newest in-stock items of the same brand, excluding the current one**, as the normal item cards in one row, with a "View all" link to `/brands/[slug]`. It is hidden when the item has no brand or the brand has no other items.
- **D-09:** A sold, hidden or unknown `/items/[code]` returns a **real 404 status** with a branded page: a clear "sold" message from `COPY` ("this piece has found a new home" style, no em dash), then the **8 newest drops** in the normal grid and a link to All Items. No item details are shown, because the API drops sold items entirely.
- **D-10:** Any other unknown URL gets a simpler on-brand not-found page without the drops grid.
- **D-11:** This must hold on the deployed site right after the webhook for a piece that just sold (success criterion 3), so the item page renders on demand over the tagged fetch cache (`await connection()`, no `generateStaticParams`).
- **D-12:** The Brands page is a responsive grid of tiles, ordered A to Z. Each tile shows the brand's SVG logo, or the brand name in Bodoni Moda when there is no logo, and links to `/brands/[slug]`.
- **D-13:** `/brands/[slug]` **reuses the full `/shop` catalogue with the brand locked**: same grid, filters, sort, search, paging and URL handling, plus a brand heading or logo. One code path, so the two stay consistent.
- **D-14:** The brand slug rule is: lowercase, drop accents and apostrophes, turn other characters into hyphens (Arc'teryx becomes arcteryx). The slug is computed from the brand names in `/filters`. A logo shows only when `public/brands/<slug>.svg` exists. No alias map for now.
- **D-15:** The header Brands dropdown items link to `/brands/[slug]` and the top-level Brands link goes to `/brands`. Add the new routes to `ROUTES` and `BUILT_PAGES`, and remove the `BUILT_PAGES` stopgap for the pages this phase ships.
- **D-16:** Item pages carry JSON-LD `Product` data (name, image, price, currency, `InStock`, `UsedCondition`) and `generateMetadata`. Site-wide titles and Open Graph belong to Phase 4 (SEO-01), and the site stays `noindex` until then.

### Claude's Discretion
- Exact visual treatment of the item page, lightbox and brand tiles, following the item and Brands mockups in the branding PDF and the Vintage UI conventions.
- Copy wording for the sold message, the where-to-buy line and the generic not-found page.
- How an unknown brand slug on `/brands/[slug]` is handled (expected: the same generic not-found).
- Whether the brand-locked catalogue is a shared component or a route param passed into the existing `/shop` page logic.

### Deferred Ideas (OUT OF SCOPE)
- **Sold item pages**: showing the original item (photos, details) marked as sold needs How many to expose sold items through the API. Until then, a gone item shows the sold message and the newest drops.
- Brand alias map (spelling mismatches such as ralph-lauren vs polo-ralph-lauren): add to shop config only if a real mismatch shows up.
- Home page, Just Dropped, About, Contact, site-wide metadata and sitemap: Phase 4.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ITEM-01 | Photo gallery, full-size, cover first | `getItem` read + scroll-snap gallery + `<dialog>` lightbox; use `loading="eager" fetchPriority="high"` not `priority` (deprecated in Next 16) |
| ITEM-02 | Brand, title, price, size, colour, era, department, condition in words | Live API returns `""` (empty string), not null, for colour/era/size: rows must skip empty strings; `label()` + `COPY.labels` already map condition/department |
| ITEM-03 | Measurements when present | `mm / 25.4` rounded for inches next to existing `cm()`; hide block when both null |
| ITEM-04 | Listed on Vinted and eBay, profile links from config | `SHOP.platforms` exists; `ButtonLink` needs an `external` variant |
| ITEM-05 | More from this brand row | Reuse `getItemsPage('brand=<name>')` (same cache key as the brand page), slice 4 after excluding current; failure hides the row |
| ITEM-06 | Real 404 + branded page with newest drops | Verified: `notFound()` in the page body gives 404 + segment `not-found.tsx`; `notFound()` in `generateMetadata` gives **200** |
| SEO-02 | JSON-LD Product | Next docs pattern with `<` escaped; fields listed below |
| BRAND-01 | Logos from `public/brands/<slug>.svg`, text fallback | Slug helper + committed logo manifest checked by a test (do not rely on runtime `fs` on Workers) |
| BRAND-03 | Brands page of in-stock brands | `getFilters().brand`, A-Z by `Intl.Collator`, one slug helper |
| BRAND-04 | `/brands/[slug]` lists that brand's in-stock items | Reuse the `/shop` page body with `filters.brand` emptied (locks the brand with zero changes to filter components) plus a `basePath` prop |
</phase_requirements>

## Summary

Everything the phase needs is already in the repo or in Next 16.4.1; **no new packages**. The work is (1) one new read, `getItem(code)`, through the existing tagged `howmanyFetch`; (2) three new routes (`/items/[code]`, `/brands`, `/brands/[slug]`) plus two `not-found.tsx` files; (3) a client gallery + lightbox; (4) threading a `basePath` through the Phase 2 catalogue components, which currently hard-code `/shop` in about 12 places.

The decisive finding is empirical. I built a throwaway `/items/[code]` route (page awaits `connection()`, reads the live API, calls `notFound()`; segment `not-found.tsx` reads `/items`) and ran `next build` + `next start` against `https://www.checkhowmany.com/api/v1/stores/blacktail-archive`. Result: a missing code returned **HTTP 404** with the segment not-found UI rendered, `<meta name="robots" content="noindex">` added; an unmatched URL returned 404 through the Header layout. A second probe that called `notFound()` only from `generateMetadata` returned **HTTP 200** (the metadata streams after the shell). So: **`notFound()` must be thrown from the page body, never from `generateMetadata`, and neither `/items/[code]` nor `/brands/[slug]` may have a `loading.tsx`** (the UI-SPEC already says this; the probe confirms the first half).

Sold-after-webhook works without extra code: Next only writes a fetch to the data cache when `res.status === 200`, so the API's 404 is never cached, and `revalidateTag(tag, { expire: 0 })` forces the next read of the item URL to hit the API, which now answers 404. The existing mock API (`scripts/mock-howmany.mjs`) does **not** serve `/items/{code}` (it answers any unknown path with the store JSON, so an item read would fail schema parsing) and must be extended before CI can prove criterion 3 on the Worker.

**Primary recommendation:** Add `getItem` (null on API 404, code-shape gate before any network call), render item and brand pages dynamically with all data awaited before output, call `notFound()` only from page bodies, lock the brand on `/brands/[slug]` by passing `{ ...filters, brand: [] }` to the existing query parser and components, and extend the mock + CI worker job so the Worker proves a 404 right after a webhook.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Item / brand data reads, cache tag | API / Backend (server component via `src/lib/howmany/client.ts`) | Database / Storage (OpenNext R2 + D1) | Only the tagged client may call the API (CLAUDE.md revalidation contract) |
| 404 status for gone item / unknown slug | Frontend Server (SSR) | - | Status is fixed when the shell flushes; must be decided in the page body before any Suspense/loading boundary |
| Gallery scrolling, current-photo state, lightbox | Browser / Client | - | Scroll-snap, IntersectionObserver, `<dialog>` are DOM-only; keep the island small (`ItemGallery`, `PhotoLightbox`) |
| Details, measurements, where-to-buy, JSON-LD | Frontend Server (SSR) | - | Pure render from the item; JSON-LD must be in the server HTML for crawlers |
| Brand slug, logo lookup, A-Z order | Frontend Server | Static (`public/brands`, committed manifest) | Computed from `/filters` per request; logo existence from a committed manifest |
| Photos / logos delivery | CDN / Static | - | Photos from `photos.checkhowmany.com` (`unoptimized`), logos from the assets binding |
| Filter / sort / paging on brand page | Browser (URL transitions) + Frontend Server | - | Existing `CatalogueShell` pattern; only the base path changes |

## Standard Stack

### Core
No additions. Everything is already installed. [VERIFIED: package.json read this session]

| Library | Version (installed) | Purpose | Note |
|---------|---------------------|---------|------|
| next | 16.4.1 | App Router, `notFound`, `connection`, `next/image` | `priority` is deprecated in v16 (docs: "Starting with Next.js 16, the `priority` property has been deprecated in favor of the `preload` property"); use `loading="eager" fetchPriority="high"` as `ItemCard` already does |
| react / react-dom | 19.3.0 | `cache()` for per-request dedupe | existing pattern in `client.ts` |
| zod | ^4.6.7 | `itemSchema` already parses a single item | reuse for `/items/{code}` (same shape as an `/items` element, verified against live API) |
| lucide-react | 1.57.0 | `ChevronLeft`, `ChevronRight`, `X`, `ExternalLink`, `ArrowLeft` | per-icon imports |
| tailwind-merge / tailwindcss | 3.7.0 / 4.3.3 | Styling | `mix-blend-multiply`, `snap-x`, `snap-mandatory`, `aspect-*` are core utilities |
| vitest | ^5.0.5 | Unit tests, `renderToStaticMarkup` for server components | `.test.ts` only (no tsx, no jsdom): use `createElement` as `ItemGrid.test.ts` does |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Scroll-snap track + IntersectionObserver | embla / swiper | Locked out by D-02 ("no library") |
| `serialize-javascript` for JSON-LD | `JSON.stringify(...).replace(/</g, '\\u003c')` | Next's own doc pattern; no dependency |
| Runtime `fs.readdirSync('public/brands')` | Committed manifest + test | See Pitfall 5; manifest is deterministic on Workers |

**Installation:** none. **Package Legitimacy Audit:** no external packages are installed or added by this phase, so no `package-legitimacy check` was needed. Packages removed (SLOP): none. Packages flagged (SUS): none.

## Architecture Patterns

### System Architecture Diagram

```
Browser GET /items/LO-0142
   |
   v
Cloudflare Worker (OpenNext) --> Next route /items/[code]  (dynamic: await connection())
   |                                   |
   |                      code-shape gate (regex) --fails--> notFound()
   |                                   |
   |                      getItem(code)  [React cache()]
   |                                   |  howmanyFetch('/items/<code>', itemSchema)
   |                                   |    fetch(force-cache, tag store:<slug>, revalidate 600)
   |                                   |         |-- 200 --> data cache (R2) / tag row (D1)
   |                                   |         |-- 404 --> NOT cached --> HowManyError(404)
   |                                   v
   |                    404 -> catch -> null -> notFound()  ---> items/[code]/not-found.tsx
   |                                   |                          getItemsPage('') -> slice(0,8)
   |                                   |                          (try/catch: grid omitted on failure)
   |                                   |                          status 404 + <meta robots noindex>
   |                     other error -> error.tsx
   |                                   v
   |             render: ItemGallery(client) | brand link | title | price
   |                     WhereToBuy(SHOP.platforms) | Details | Measurements
   |                     MoreFromBrand: getItemsPage('brand=<name>') -> filter code != current -> slice(0,4)
   |                                    (try/catch -> row omitted)
   |                     <script ld+json> (< escaped)
   v
Webhook POST -> revalidateTag('store:<slug>', {expire:0}) -> next read of ANY tagged URL refetches API
```

```
GET /brands/[slug]
   getFilters()  (React cache, shared with Header)
   brandsBySlug(filters.brand) -> name | undefined --undefined--> notFound()   (in page body)
   query = parseCatalogueQuery(raw, { ...filters, brand: [] })   // locked: brand param ignored, no Brand group/chip
   apiQuery = toSearchString({ ...query, lists: { ...query.lists, brand: [name] } })
   getItemsPage(apiQuery) -> same grid/filters/pager as /shop with basePath=/brands/<slug>
```

### Recommended Project Structure
```
src/
├── app/
│   ├── not-found.tsx                 # generic 404 (also unknown brand slug, unmatched URLs)
│   ├── items/[code]/page.tsx         # no loading.tsx
│   ├── items/[code]/not-found.tsx    # gone-item page with 8 newest drops
│   ├── brands/page.tsx
│   └── brands/[slug]/page.tsx        # no loading.tsx
├── components/
│   ├── item/    ItemGallery(client), PhotoLightbox(client), ItemDetails, ItemMeasurements, WhereToBuy, MoreFromBrand, ItemJsonLd
│   ├── brands/  BrandGrid, BrandTile
│   └── catalogue/  (existing; add basePath + columns props)
├── lib/
│   ├── brands.ts (+ .test.ts)        # brandSlug, brandsBySlug (A-Z, first wins), sortBrands
│   ├── money.ts                      # + inches()
│   ├── seo.ts                        # + itemCanonicalUrl, basePath param on canonicalUrl
│   └── howmany/client.ts             # + getItem
└── shop/ brand-logos.ts              # committed list of slugs with a file in public/brands
```

### Pattern 1: `getItem` through the existing client
**What:** one new tagged read; null for a gone item; non-404 errors still throw (reach `error.tsx`).
**Source of the shapes:** `howmanyFetch` and `getFilters` read this session at `src/lib/howmany/client.ts:26-46`:
`const res = await fetch(\`${storeEnv().HOWMANY_API_URL}${path}${query}\`, { cache: 'force-cache', next: { tags: [storeTag()], revalidate: CACHE.revalidateSeconds }, signal: AbortSignal.timeout(CACHE.fetchTimeoutMs) }); if (!res.ok) throw new HowManyError(res.status, path);`
```typescript
// src/lib/howmany/client.ts  (addition)
import { itemSchema } from '@/lib/howmany/schemas';
import type { Item } from '@/lib/definitions';

/** Item codes seen so far are like LO-0142; a shape gate keeps junk URLs off the shared 3000/min API limit */
const CODE_SHAPE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/; // [ASSUMED] real codes fit this

/** null = the API does not show it (sold, hidden, unknown). Anything else that fails still throws. */
export const getItem = cache(async (code: string): Promise<Item | null> => {
    if (!CODE_SHAPE.test(code)) return null;
    try {
        return (await howmanyFetch(`/items/${encodeURIComponent(code)}`, itemSchema)).data;
    } catch (error) {
        if (error instanceof HowManyError && error.status === 404) return null;
        throw error;
    }
});
```
Note the existing AbortSignal makes the fetch non-memoised by Next, so React `cache()` is what dedupes `generateMetadata` + page (same comment in `client.ts:42-45`).

### Pattern 2: page body decides 404; metadata never throws
```typescript
// src/app/items/[code]/page.tsx
export async function generateMetadata({ params }: PageProps<'/items/[code]'>): Promise<Metadata> {
    const item = await getItem((await params).code);
    if (!item) return {};                       // NEVER notFound() here: status would already be 200 (verified)
    return { title: [item.brand, item.title].filter(Boolean).join(' '),
             alternates: { canonical: new URL(ROUTES.item(item.code), storeEnv().SITE_URL).toString() } };
}
export default async function ItemPage({ params }: PageProps<'/items/[code]'>) {
    await connection();
    const item = await getItem((await params).code);
    if (!item) notFound();                       // before any streamed output -> real 404
    ...
}
```

### Pattern 3: brand lock with zero changes to filter components
`parseCatalogueQuery(raw, { ...filters, brand: [] })`: `pickList` (`src/lib/params.ts`) maps over `available`, so an empty `brand` list drops any `brand` URL param; `FilterPanel.listGroup` returns `null` when `values.length === 0` (so the Brand group disappears from sidebar and drawer), and `FilterChips` only builds a brand chip for values in `query.lists.brand` (always empty). Pass the same reduced `filters` to `FilterPanel`, `FilterDrawer`, `FilterChips`. Build the API query with the brand re-added; build every **URL** from the brand-less query.

### Pattern 4: `basePath` threading (the real refactor)
Hard-coded `/shop` today (grep this session): `params.ts` `pageHref` (`ROUTES.shop`) and `shopHref`; `seo.ts` `canonicalUrl`; `FilterPanel` (`<form action={ROUTES.shop}` and `shopHref` x4), `SortSelect` (`<form action={ROUTES.shop}` + `shopHref`), `FilterChips` (`shopHref` x3 + clear-all `href={ROUTES.shop}`), `Pager` (`pageHref`), `shop/page.tsx` (`redirect(pageHref(...))`, empty-state `href={ROUTES.shop}`). Recommended: add a trailing `basePath = ROUTES.shop` parameter to `pageHref`, `shopHref`, `canonicalUrl`, and a `basePath?: string` prop on `FilterPanel`, `FilterDrawer`, `SortSelect`, `FilterChips`, `Pager`. Extract the `/shop` page body into one server component (`CataloguePage` taking `{ raw, basePath, lockedBrand? , banner }`) used by `/shop` and `/brands/[slug]` so there is one code path (D-13). `HeaderSearch` stays global (posts to `/shop`); the brand page has no search box, `q` only arrives via URL/chip. Say so in the PLAN.

### Anti-Patterns to Avoid
- **`notFound()` in `generateMetadata`:** returns 200 (verified).
- **`loading.tsx` on `/items/[code]` or `/brands/[slug]`:** fixes status at 200 (Next docs "Status codes").
- **Wrapping the item body in `<Suspense>` for "More from brand":** the Suspense flush also fixes the status; the page already awaits `notFound()` first, but keep the More-from read awaited (or `Promise.allSettled` after the `notFound` check) rather than streaming it, so there is one rendering path to reason about.
- **Spreading the item into markup or JSON-LD:** `ItemCard` reads named fields only; `details` is an open record, never render it wholesale (privacy rule).
- **`generateStaticParams` on items:** forbidden by D-11/DATA-06 (build must make zero API calls; CI asserts `{"store":0,"items":0}`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus trap, Esc, inert background | custom overlay | `useModalDialog` + native `<dialog>` | already the project pattern (`Sheet`) |
| Scroll-snap carousel | a JS-driven slider | CSS `snap-x snap-mandatory` + one IntersectionObserver | D-02 |
| Query/URL cleaning, canonical | new parsing | `parseCatalogueQuery`, `toSearchString`, `pageHref`, `canonicalUrl` | one canonical string = one cache key |
| Code labels | switch statements | `label(code, COPY.labels.condition)` etc. | unknown codes already fall back |
| Money | `toFixed` in components | `formatMoney` (display only); JSON-LD price is the one place for `(cents/100).toFixed(2)` | SHELL-05 |
| HTML escaping of JSON-LD | custom sanitizer | `JSON.stringify(x).replace(/</g, '\\u003c')` | Next's documented pattern |
| Brand slug | per-component regex | one `brandSlug()` in `src/lib/brands.ts` | used by header, grid, item link, brand page, tests |

**Key insight:** the only genuinely new logic is the gallery's current-index tracking and the slug/logo mapping; everything else is a re-skin of existing helpers.

## Runtime State Inventory
Not a rename/refactor phase. One related note: the `/shop` -> `basePath` change touches no stored data. Stored data: none. Live service config: none. OS-registered state: none. Secrets/env vars: none new. Build artifacts: none.

## Common Pitfalls

### Pitfall 1: `notFound()` from `generateMetadata` gives 200
**What goes wrong:** gone items return 200 with the not-found UI, failing criterion 3 and creating soft 404s. **Why:** Next 16 streams metadata after the shell. **Evidence:** probe route `/probe/gone` (notFound only in `generateMetadata`) returned `HTTP/1.1 200 OK` with the not-found meta; `/items/NOPE-1` (notFound in the page) returned `HTTP/1.1 404 Not Found`. **Avoid:** return `{}` from `generateMetadata` when the item is null. **Warning sign:** a CI `curl -w '%{http_code}'` of a gone code returning 200.

### Pitfall 2: Empty strings, not nulls
**What goes wrong:** the live API returns `"colour": ""`, `"era": ""`, `"size": ""` (and `department: null`). A check like `item.colour !== null` renders empty rows with labels. **Avoid:** one `present(value)` helper: `typeof value === 'string' && value.trim() !== ''`; apply to every details row and to the brand/`More from` guard (`ItemCard` already uses `.filter(Boolean)`). Tests must use `''` fixtures.

### Pitfall 3: Sold item and the rate limit
404s are not cached, so each hit on a gone code costs one API call from the shared server IP (3000/min limit shared with everything). The code-shape gate stops obvious junk but not valid-looking codes; Cloudflare WAF rate limiting on `/items/*` is the real control (operational note for Phase 4 onboarding). A 429 from the API reaches `error.tsx`, not a 404: correct, do not map it to not-found.

### Pitfall 4: `More from brand` / drops fetched with a different `limit`
`getItemsPage` always sets `limit=24` (`client.ts:52-56`). Do **not** add a `limit` argument: `getItemsPage('brand=Lotto')` has the same cache key as page 1 of the brand page, and `getItemsPage('')` the same as `/shop`, so these rows add no API calls. Slice in the component (`items.filter(i => i.code !== current).slice(0, 4)`; `items.slice(0, 8)`). This is a small deviation from the UI-SPEC's "page size set to 8"; the rendered result is identical.

### Pitfall 5: Logo existence on Workers
`fs.readdirSync(public/brands)` works in `next start` but `public/` is served by the assets binding, not bundled into the Worker, so a runtime `fs` check is unreliable on the deployed site [ASSUMED, not run on a Worker]. **Avoid:** commit `src/shop/brand-logos.ts` (`export const BRAND_LOGOS: readonly string[] = ['adidas', 'arcteryx', ...]`) and add a Vitest that reads `public/brands` and asserts the set equals the manifest (both directions), so a new SVG without a manifest entry fails CI. It also keeps the per-shop asset list inside `src/shop/` (TMPL-01).

### Pitfall 6: Slug rules and collisions
Implement D-14 literally: NFD normalise, strip `\p{M}`, lowercase, delete `'` and `’`, `[^a-z0-9]+` to `-`, trim `-`. Check against the 30 shipped files: `Arc'teryx`->`arcteryx`, `Levi's`->`levis`, `Dr. Martens`->`dr-martens`, `Stüssy`->`stussy`, `The North Face`->`the-north-face`. A brand whose slug is empty (all non-Latin) must be skipped from tiles/links, not routed to `/brands/`. Collision: sort names A-Z first, first wins; unit-test the collision so it is visible. `ralph-lauren` vs `polo-ralph-lauren` (PROJECT.md open item) only matters if both brands are in stock under those exact names.

### Pitfall 7: Safari does not focus buttons on click
Native `<dialog>.close()` restores focus to the element focused before `showModal()`; on Safari a clicked `<button>` is not focused, so focus lands on `<body>`. **Avoid:** keep a ref to the trigger and call `.focus()` in the lightbox `onClose`. [ASSUMED: browser behaviour from training knowledge]

### Pitfall 8: Gallery index tracking
IntersectionObserver on slides with `root: track`, `threshold: 0.6` drives the index; `scrollend` is not universal. When a thumbnail is clicked, set the index immediately and ignore observer updates until the scroll settles, or the selected border flickers through intermediate slides. Use `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`. Hidden desktop thumbnails (`hidden lg:block`) with `loading="lazy"` do not download on phones.

### Pitfall 9: Lightbox cost
Mount `<Image>` only while open (`{open && ...}` like `FilterDrawer`), not previous/next. Do not apply `.sheet` (slide-in) to the lightbox dialog (`globals.css` `dialog.sheet[open]` animates); use a fade class instead, off under reduced motion.

### Pitfall 10: Existing tests encode the old state
`ItemGrid.test.ts` asserts `html.includes('href="/items/BT-0001"')` equals `isBuilt(...)`; once `/items` is built and `ItemCard` always links, update it to assert the link unconditionally. `BUILT_PAGES` still needs `/just-dropped`, `/about`, `/contact` absent until Phase 4, so keep `isBuilt` but add `ROUTES.brands` and `'/items'` (prefix match via `isNavActive`).

## Code Examples

### JSON-LD (SEO-02) [CITED: node_modules/next/dist/docs/01-app/02-guides/json-ld.md]
```tsx
// src/components/item/ItemJsonLd.tsx (server component)
export function ItemJsonLd({ item, url }: { item: Item; url: string }) {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.title,
        image: item.photos.map(p => p.url),
        ...(item.brand ? { brand: { '@type': 'Brand', name: item.brand } } : {}),
        offers: {
            '@type': 'Offer',
            price: (item.priceCents / 100).toFixed(2),
            priceCurrency: item.currency,
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/UsedCondition',
            url,
        },
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
```
Named fields only (no `sku`, no `details`, no code). Test: a title of `</script><script>alert(1)</script>` must not contain a raw `<` in the output.

### Slug + inches
```typescript
export const brandSlug = (name: string): string =>
    name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// money.ts, next to cm()
export const inches = (mm: number): string => String(Math.round(mm / 25.4));   // 560 -> "22"
```

### Gone page without nested `<main>`
`StatusScreen` renders its own `<main>` (`StatusScreen.tsx`). The root layout has no `<main>` (pages bring their own), and a segment `not-found.tsx` replaces the page, so the gone page can render `<main><StatusBody/> <section>drops</section></main>`. Split `StatusScreen` into `StatusBody` (no `<main>`) + `StatusScreen` (`<main><StatusBody/></main>`).

### Mock API extension (needed for CI)
`scripts/mock-howmany.mjs` today: `GET <anything else> -> the store`, and `pathname.endsWith('/items')` is the only items route. Add before the store fallback: `const m = pathname.match(/\/items\/([^/]+)$/)`; look up `items().find(x => x.code === decodeURIComponent(m[1]))`; if missing or in a `gone` set return `send(res, 404, { error: 'Not found' }, { 'cache-control': 'no-store' })`; else 200 with the same `cache` header. Add `gone: string[]` to `POST /__set`. Count it under `items` or a new counter, but keep the build-time assertion `{"store":0,"items":0}` valid (a new `item` counter key would change that exact string; either reuse `items` or update the CI grep).
`scripts/prove-freshness.mjs`: new check "item-gone": `GET /items/MOCK-0002` is 200; `setMock({ gone: ['MOCK-0002'] })`; sleep 1.2 s; signed webhook; `poll` until `status === 404` and body contains the gone title (`COPY.gone.title`); plus a final `GET /items/MOCK-9999` = 404 and `<meta name="robots" content="noindex">`. Add CI steps: `/brands` 200, `/brands/mock-brand` 200, `/brands/not-a-brand` 404, and the Worker log still free of `ERROR`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<Image priority>` | `loading="eager" fetchPriority="high"` or `preload` | Next 16.0.0 | UI-SPEC/CONTEXT say `priority`; implement with the new props |
| `revalidateTag(tag)` | `revalidateTag(tag, { expire: 0 })` | Next 16 | already in `CACHE.webhookRevalidate` |
| Metadata blocks first paint | Streaming metadata | Next 15.2+ | status cannot be changed from `generateMetadata` |

**Deprecated/outdated:** `next/image` `priority` (v16); `unstable_cache`, `'use cache'` (banned by guard test).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Real item codes match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` (seen: `LO-0142`, `CO-0062`, `VA-0067`, `NI-0032`, `IC-0085`, `FI-0031`, `RL-0142` in docs) | Pattern 1 | A valid code with other characters would 404 without reaching the API; relax the regex |
| A2 | `details.material` is where Material lives (the mock uses it; the live API returns `details: {}` for all 6 current items; the spec says details are "the category's own fields") | Item details row | Material row never shows; harmless. Confirm key with the owner / API when an item has details |
| A3 | `public/` files are not readable via `fs` on the deployed Worker | Pitfall 5 | If they are, the manifest is merely redundant; the manifest is correct either way |
| A4 | Safari does not focus clicked buttons, so dialog close needs an explicit focus return | Pitfall 7 | Extra `focus()` call is harmless |
| A5 | OpenNext on Workers preserves Next's 404 status for a dynamic page exactly as `next start` does | Summary | Not run on workerd (OpenNext cannot build on Windows). CI worker job must assert it; if it fails, the fix is in the adapter, not the page |
| A6 | A `/brands` page route does not collide with the `public/brands/` directory in the assets binding | Brands page | Smoke test `/brands` and `/brands/nike.svg` on the Worker in CI |

## Open Questions (RESOLVED)

1. **Does the Worker (workerd + OpenNext) return 404 for a gone item right after a webhook?**
   - Known: `next start` does (reproduced); fetch cache never stores non-200 (`patch-fetch.js:707`: `if (res.status === 200 && incrementalCache && cacheKey && ...)`).
   - Unclear: workerd behaviour. Recommendation: CI worker job assertion described above is a phase gate, not optional.
   - **Resolution:** gated by Plan 03-04. The CI worker job runs prove-freshness item-gone (a 404 right after the signed webhook) and the "Item and brand pages on the Worker" step. A 200 keeps the PR red and is reported as blocking.
2. **`details` keys for real items.** Recommendation: render Material only from a string `details.material`; list it in the PR as "unconfirmed against live data".
   - **Resolution:** Plan 03-01 Task 2 reads a top-level `material` first, then `details.material`. Issue #2 filters `material` as a top-level facet; live items checked on 2026-11-03 carry neither field. `itemSchema` gains an optional `material`, the mock moves material to the top level, and the PR lists it as unconfirmed.
3. **Brand name vs logo filename mismatches in production** (`ralph-lauren` vs `polo-ralph-lauren`, `arcteryx`). Deferred by CONTEXT (no alias map); the Brands page falls back to the text tile, which is the designed degradation.
   - **Resolution:** the alias map stays deferred (CONTEXT Deferred Ideas). Both ralph-lauren.svg and polo-ralph-lauren.svg ship and arcteryx.svg is already renamed. Any other mismatch shows the text tile.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build/test | yes | v24.22.1 | - |
| Vitest baseline | tests | yes | 19 files, 152 tests pass | - |
| Live How many API | manual proof | yes | `blacktail-archive` store, 6 items (Converse, Firetrap, Icon, Lotto, Nike, Vans) | `scripts/mock-howmany.mjs` |
| OpenNext / wrangler on Windows | worker proof | no (CI only, per `ci.yml`) | - | GitHub Actions `worker` job |

## Security Domain

### Applicable ASVS Categories (level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication / V3 Session | no | no accounts |
| V4 Access Control | no | public read-only data; privacy via named-field rendering |
| V5 Input Validation | yes | code-shape regex + `encodeURIComponent` on the API path (a `../filters` code is a 404, verified: `%2E%2E%2Ffilters` returned 404 from the app); Zod `itemSchema` strips unknown fields; slug resolved only against `/filters` brands; catalogue params via `parseCatalogueQuery` |
| V6 Cryptography | no | webhook HMAC already done in Phase 1 |
| V10/V14 output encoding | yes | JSON-LD `<` escaping; React escapes all other text; external links `rel="noopener noreferrer"` |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via item title in JSON-LD `<script>` | Tampering | `replace(/</g, '\\u003c')`, tested |
| API path injection via `[code]` | Tampering | regex gate + `encodeURIComponent` |
| Rate-limit exhaustion through random `/items/*` | DoS | 404 not cached, so rely on regex gate + Cloudflare WAF rate rule (operational) |
| Internal data leak via `details` | Information disclosure | never render/serialise `details` wholesale; JSON-LD uses named fields only |
| Reverse tabnabbing on platform links | Spoofing | `rel="noopener noreferrer"` |

## Sources

### Primary (HIGH)
- Reproduction this session: temporary routes built with `next build`, served with `next start` on port 3111 against the live API (status lines quoted above); files removed afterwards, `git status` clean apart from pre-existing `.planning` changes.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md` and `loading.md` ("Status codes", "Calling `notFound()` ... before this point preserves its 404"); `generate-metadata.md` (streaming metadata); `02-components/image.md` (`priority` deprecated, `preload`); `02-guides/json-ld.md`.
- `node_modules/next/dist/server/lib/patch-fetch.js:707` (only status 200 is stored).
- Repo files read this session: `src/lib/howmany/client.ts`, `schemas.ts`, `params.ts`, `seo.ts`, `routes.ts`, `utils.ts`, `labels.ts`, `config.ts`, `copy.ts`, `money.ts`, `shop/config.ts`, `app/shop/page.tsx`, catalogue/layout/ui components, `scripts/mock-howmany.mjs`, `scripts/prove-freshness.mjs`, `.github/workflows/ci.yml`, `docs/refs/issues.json` #2.
- Live API responses (`/`, `/filters`, `/items`, `/items/LO-0142` 200, `/items/lo-0142` 404 case-sensitive, `/items/NOPE-1` 404 with `no-store`).

### Tertiary (LOW)
- Browser-behaviour claims (Safari focus) from training knowledge, tagged ASSUMED.

## Project Constraints (from CLAUDE.md)
- Data only via the How many public API; every read through `src/lib/howmany/client.ts` with tag `store:<slug>` and `revalidate: 600`.
- No `cacheComponents`, `'use cache'`, `cacheTag`, `cacheLife`, `unstable_cache`, `updateTag`, `revalidatePath`; no `middleware`/`proxy`; no edge runtime.
- Images `unoptimized`; width/height from the API; never derive sizes.
- No shop-specific values in components: names/links from `SHOP`, text from `COPY` (no em dashes, no shop names in `COPY`); `shop-guard.test.ts` scans `src` outside `src/shop`.
- Privacy: never show or derive cost, notes or internal ids.
- Match Vintage conventions: named exports, 4-space indent, single quotes, colocated `*.test.ts`, `import 'server-only'` on API modules.
- Git: branch `gsd/phase-03-item-and-brand-pages`, PR only, never merge.
- GSD workflow: edits go through GSD commands.

## Metadata

**Confidence breakdown:**
- 404 status mechanics: HIGH (reproduced), Worker parity MEDIUM (A5)
- Standard stack: HIGH (no additions)
- Architecture / basePath refactor: HIGH (grep of every `/shop` reference)
- Pitfalls: HIGH for 1-4, 6, 10; MEDIUM for 5, 7, 8

**Research date:** 2026-11-03
**Valid until:** 2026-11-17 (OpenNext releases every few days; re-run the worker smoke on any bump)
