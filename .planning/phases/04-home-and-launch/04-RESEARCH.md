# Phase 4: Home and Launch - Research

**Researched:** 2026-11-03
**Domain:** Next 16.4.1 App Router on OpenNext/Cloudflare Workers: a storefront home page, three content pages, metadata/OG, sitemap, robots, an indexing switch, template onboarding
**Confidence:** HIGH (nearly everything is built from code already in this repo; the few unproven items are listed in Assumptions and Open Questions)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Image slots and placeholders (HOME-03)**
- **D-01:** Until real lifestyle photos arrive, the slots (hero, 2 promo banners, 4 category tiles, story band, default Open Graph image) use **committed placeholder image files** under `public/images/`.
- **D-02:** Slots use **fixed filenames** (for example `hero.jpg`, `banner-just-dropped.jpg`, `banner-brands.jpg`, `category-<n>.jpg`, `story.jpg`, `og-default.jpg`). The real photo replaces the placeholder by overwriting the file, so there is no config edit and no file-exists check. The planner picks the exact names and lists them in the onboarding doc.
- **D-03:** All home headings, eyebrows and button labels (TIMELESS CLOTHES. JUST DIFFERENT., PRE-LOVED, SHOP NEW ARRIVALS, and so on) are Blacktail Archive's own words and live in `src/shop/` (the shop-string guard keeps them out of components). Generic labels ("View all", arrows' accessible names) stay in `COPY`. No em dashes.
- **D-04:** CTA targets follow the mockup: hero "Shop new arrivals" and the Just Dropped banner go to `/just-dropped`; "Shop all brands" goes to `/brands`; each category tile goes to `/shop?type=<code>`; the story band "Our story" goes to `/about`. All paths come from `ROUTES`.

**Category tiles (HOME-01, HOME-02, TMPL-01)**
- **D-05:** The tile list is in shop config: up to 4 entries, each with a type code, a label and an image filename. A tile is **hidden when `/filters` shows no in-stock items of that type**, so it never links to an empty page. If no tile remains, the whole section is hidden. (This is the "category tiles" part of TMPL-01 that Phase 2 deferred to here.)

**Brand strip (BRAND-02, HOME-01)**
- **D-06:** The strip is **one row of logos that scrolls horizontally** (scroll-snap) when it does not fit, with a "View all" link to `/brands`. A brand without an SVG shows its name in Bodoni Moda. Logos are matched by the Phase 3 slug rule.
- **D-07:** Order is: brands in stock first, then sold-before brands, then the default order from config. The ordering function takes a `soldBeforeBrands` list that is **empty for now**, so BRAND-05 only needs a data source later; a unit test proves the order with a fake list.
- **D-08:** The default order in `src/shop/` is a placeholder marked PENDING-OWNER: Polo Ralph Lauren, Carhartt, Nike, Adidas, Levi's, Barbour, The North Face, Patagonia, then the rest A to Z. Only that one array changes when the owner decides.

**Just Dropped carousel and page (CAT-11, HOME-01, HOME-02)**
- **D-09:** `/just-dropped` is the **`/shop` catalogue locked to newest** (filters, search, paging and chips, sort fixed to newest and the sort control hidden) with a Just Dropped banner. It reuses the same code path as `/brands/[slug]`.
- **D-10:** The page and the carousel show **all in-stock pieces, newest first** (by `publishedAt`), with no time window, so they are never empty while the shop has stock.
- **D-11:** **The New badge is 14 days across the board** (was 7). Change `SHOP.newBadgeDays` to 14 and update the `isNew` tests, any "7 days" wording and the Phase 2 D-21 references.
- **D-12:** The home carousel shows the **10 newest** pieces: 5 cards visible on desktop as in the mockup, 2 on a phone, scroll-snap with previous and next arrow buttons (no library). With fewer items it shows what exists and hides the arrows; with zero items the whole section is hidden.
- **D-13:** Spotlighted items (a How many feature the owner plans) will later be prioritised in the carousel only, not on `/just-dropped`. Tracked in GitHub issue #19. Not built in this phase.

**About and Contact (PAGE-01, PAGE-02)**
- **D-14:** About and Contact take their text and details from `src/shop/` (a placeholder story marked PENDING-OWNER, with the story-band image slot). Layouts follow the mockups in the branding PDF.
- **D-15:** Contact shows the email, the Vinted and eBay profile links and the socials, with no form. **Every contact detail and platform link is read from the shared source (`SHOP.contact`, `SHOP.platforms`, `SHOP.socials`), the same one the footer and the item page use. Nothing is typed into the page.**

**SEO and indexing (SEO-01, SEO-03)**
- **D-16:** Indexing is controlled by a **new validated env flag, off by default** (for example `ALLOW_INDEXING=true`, set only on the live deploy). When off: `robots.txt` disallows all, and the `noindex` meta and `X-Robots-Tag` header from Phase 1 stay. When on: both go away and the sitemap is served. Preview deploys and `workers.dev` stay safe by default. The planner names the variable and adds it to the env schema, the deploy workflow and the onboarding doc.
- **D-17:** The sitemap lists `/`, `/shop`, `/brands`, `/just-dropped`, `/about`, `/contact`, each `/brands/[slug]` (from `/filters`) and every in-stock `/items/[code]`. It is built through the tagged client so the webhook refreshes it. Filtered, searched and sorted views are excluded. Absolute URLs come from `SITE_URL`.
- **D-18:** Every page gets a title, description and Open Graph tags. Item pages use the item's name and cover photo; every other page uses `public/images/og-default.jpg` (a fixed-filename slot with a placeholder).

**Template onboarding (TMPL-02)**
- **D-19:** The onboarding doc is `docs/ONBOARDING.md`. It covers env vars (including the indexing flag), the Cloudflare R2, D1 and Worker setup, the `src/shop/` folder swap, the `public/brands/` logos and the `public/images/` slots with their filenames. A reader can deploy another shop without editing a component.

**Cleanup**
- **D-20:** Delete the `BUILT_PAGES` stopgap and `isBuilt` in `src/lib/routes.ts` once the last page ships, and replace the `/` redirect with the home page.

### Claude's Discretion
- Visual treatment of the home sections, the mobile layout and the About and Contact pages, following the mockups in the branding PDF and the Vintage UI conventions.
- The exact placeholder look of the committed images, as long as they are neutral and use the palette.
- Exact fixed filenames, the shape of `SHOP.home` and `SHOP.about`, and the name of the indexing env variable.
- Metadata copy for each page (descriptions), without em dashes.

### Deferred Ideas (OUT OF SCOPE)
- **Spotlighted items in the carousel**: needs How many to expose a spotlight flag; GitHub issue #19.
- **Sold-before brand tier data (BRAND-05)**: needs How many; the seam exists but stays empty.
- Real lifestyle photos, the default brand order, and real contact, Vinted and eBay values: owner supplies later (issue #9); each is a file overwrite or one config line.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Home matches the Just Dropped mockup (hero, brand strip, carousel, 2 banners, category tiles, story band, footer) | Home page = `connection()` + three independently guarded data sections + static sections (Architecture, Patterns 1-4); UI-SPEC is the visual contract |
| HOME-02 | Sections with nothing to show are hidden | Per-section try/catch that returns `null`; pure `visibleTiles` and `stripBrands` return `[]` (Patterns 2-3) |
| HOME-03 | Lifestyle images from `public/images/` slots with placeholders | Fixed filenames, sharp-generated placeholders, a test that every configured filename exists in `public/images/` (Image slots, Pitfall 9) |
| BRAND-02 | Strip order: in stock, sold-before, default | Pure `stripBrands()` with slug comparison and a `soldBeforeBrands` parameter (Pattern 3) |
| CAT-11 | Just Dropped page of newest items | `CataloguePage` gets `lockedSort`; `sort` is forced to the API default so no `sort` param is ever sent (Pattern 5) |
| PAGE-01 | About page | Static server page reading `SHOP.about` (Architecture) |
| PAGE-02 | Contact page, no form | Static server page reading `SHOP.contact/platforms/socials` (Architecture) |
| SEO-01 | Title, description, OG on every page; item pages use name and cover | One `pageMetadata()` helper because Next merges metadata shallowly and `openGraph` from the layout is replaced, not inherited (Pattern 6, Pitfall 2) |
| SEO-03 | Sitemap refreshed with the store tag; robots blocks indexing outside production | Dynamic `robots.ts` and `sitemap.ts` (`await connection()`), env flag, build-time header (Patterns 7-9, Pitfalls 1, 3, 4) |
| TMPL-01 | Default brand order and category tiles in the shop folder (remaining part) | `SHOP.home.categories`, `SHOP.defaultBrandOrder` in `src/shop/config.ts` |
| TMPL-02 | Onboarding doc | `docs/ONBOARDING.md` content map (Pattern 10), sourced from the Phase 1 owner setup steps and the live `wrangler.jsonc` |
</phase_requirements>

## Summary

This phase is almost entirely assembly of code that already exists. The reads are all there: `getFilters()` (React `cache()`, shared with the Header), and `getItemsPage('')` whose cache key (`/items?limit=24`) is the same one `/shop` page 1 uses, so the home carousel (first 10 of page 1, API order is newest first) and `/just-dropped` cost no extra API calls. `/just-dropped` is `CataloguePage` plus a `lockedSort` flag, exactly as `/brands/[slug]` is `CataloguePage` plus `brand`. The visual contract is already approved (`04-UI-SPEC.md`), so research here is about the four places where the contract meets the platform and could silently go wrong: the indexing switch (a header baked at build time against a flag read at run time), metadata merging (a page that sets `openGraph` loses the layout's images), the sitemap (Next does not XML-escape `<loc>`, and a route handler is cached unless it touches a request-time API), and the onboarding/deploy files that still hard-code the Blacktail host.

Three findings change what the UI-SPEC literally says. (1) Next 16 deprecated `priority` on `next/image`; the hero must use `loading="eager"` plus `fetchPriority="high"` (the same pattern `ItemCard` already uses). (2) The `/` redirect is in `next.config.ts` `redirects()`, not a `src/app/page.tsx`, so D-20 means deleting that block and adding the page. (3) The `X-Robots-Tag` header is produced by `next.config.ts` `headers()` which runs at build, so the "indexing on" state needs the flag in the **build** env (deploy workflow) and in the **run-time** env (`wrangler.jsonc` vars) at once; the recommended way to keep that to one switch is a single GitHub repository variable feeding both `env:` and `wrangler deploy --var`.

**Primary recommendation:** Build in four waves: (1) indexing/SEO foundation plus cleanups (env flag, `pageMetadata`, `robots.ts`, `sitemap.ts`, `newBadgeDays` 14, delete `BUILT_PAGES`, remove the redirect), (2) shop config and pure functions plus UI primitives plus placeholder images, (3) the home components/page, `/just-dropped`, `/about`, `/contact`, (4) CI/deploy changes and `docs/ONBOARDING.md`. Ship with `ALLOW_INDEXING` off; the owner flips one variable at launch.

## Project Constraints (from CLAUDE.md)

Source: `.claude/CLAUDE.md` (read this session).
- **Data access:** only the How many public API through `src/lib/howmany/client.ts`; no page calls `fetch` directly.
- **Caching:** every read `fetch` with tag `store:<slug>` and `revalidate: 600`; webhook `revalidateTag(tag, { expire: 0 })`. Do not use `updateTag`, `revalidatePath`, `unstable_cache`, `cacheComponents`, `'use cache'`, `cacheTag`, `cacheLife` (a guard test fails on them, comments included).
- **No `middleware.ts` / `proxy.ts`** and no edge runtime routes. This is why the `X-Robots-Tag` header cannot be made request-time (Pitfall 1).
- **Template:** no shop-specific values in components; everything per shop from env or `src/shop/`. A guard test fails if shop values appear outside `src/shop/`.
- **Images:** `images.unoptimized: true`; keep `next/image`; static brand logos plain files in `public/`.
- **Conventions:** match `C:\Git\vintage`; 4-space indent, single quotes, named exports, colocated `*.test.ts`, `import 'server-only'` on API modules. All on-screen text in `COPY`; no em dashes (tested for `COPY` and `SHOP`).
- **Privacy:** show only what the API returns.
- **Git:** never commit to `main`, never merge; work on `gsd/phase-04-home-and-launch`, open a PR, tell the owner. Windows cannot build OpenNext: only CI (Linux) builds the Worker.
- **Config:** `workflow.nyquist_validation` is `false`, so the Validation Architecture section is omitted; `security_enforcement` is on, so Security Domain is included.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Home page data sections (strip, carousel, tiles) | Frontend Server (RSC, per request) | Database/Storage (R2 fetch cache) | Pages call `connection()` and render over the tagged fetch cache; nothing is read at build (CI asserts 0 API calls during build) |
| Hero, promo banners, story band, About, Contact | Frontend Server (RSC) | CDN/Static (`public/images/*`) | Static markup from `SHOP`/`COPY`; images are plain assets served from the assets binding |
| Carousel arrows and scroll state | Browser/Client | — | Only interactive island on the home page; receives server-rendered cards as children |
| Brand strip scroll | Browser (CSS scroll-snap, no JS) | — | Native overflow scrolling; no script needed |
| Category-tile and strip-brand filtering/ordering | Frontend Server (pure functions) | — | Pure, unit-tested functions fed by `/filters` |
| `/just-dropped` filtering/sorting | API/Backend (How many `/items` query) | Frontend Server | Same as `/shop`: Blacktail only forwards the cleaned query |
| Page metadata / OG | Frontend Server (`generateMetadata`) | — | Needs `SITE_URL` env at request time |
| `robots.txt`, `sitemap.xml` | Frontend Server (dynamic route handlers) | Database/Storage (tagged fetch cache) | Must read env and the API at request time, never at build |
| `X-Robots-Tag` header | Build (`next.config.ts headers()`) | Frontend Server (meta robots) | No middleware is allowed, so the header can only vary per build |
| Indexing switch | Config (env, build + run time) | — | One flag, parsed by one pure function used by env schema and `next.config.ts` |
| Onboarding | Docs | — | `docs/ONBOARDING.md` |

## Standard Stack

No new packages. Everything is already in `package.json` (read this session): `next 16.4.1`, `react 19.3.0`, `lucide-react 1.57.0`, `tailwind-merge 3.7.0`, `zod ^4.6.7`, `server-only`, dev: `vitest ^5.0.5`, `@opennextjs/cloudflare ^1.20.13`, `wrangler ^4.151.3`. [VERIFIED: package.json]

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.1 (exact) | App Router, `generateMetadata`, `robots.ts`, `sitemap.ts`, `next/image` | Project pin |
| lucide-react | 1.57.0 | `ChevronLeft`, `ChevronRight`, `ArrowRight`, `ExternalLink` | Per-icon imports, already used |
| zod | ^4.6.7 | `ALLOW_INDEXING` in `storeEnv()` | Existing env convention |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | 0.35.5 (transitive, installed as Next's optional dependency) | One-off generation of the committed placeholder JPEGs | Only at authoring time on a dev machine; not a declared dependency, not run in CI. [VERIFIED: ran `require('sharp')` in this repo; `node_modules/next/package.json` lists it under optionalDependencies] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled carousel | Embla/Swiper | Locked out by D-12 ("no library") and CLAUDE.md |
| `lockedSort` prop | A separate catalogue component | Duplicates 90 lines; the Phase 3 precedent is a prop on `CataloguePage` |

**Installation:** none.

**Version verification:** no package is added, so no `npm view` was needed. The seam command `package-legitimacy check` was therefore not run.

## Package Legitimacy Audit

No external packages are installed by this phase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Shopper request
   |
   v
Cloudflare Worker (OpenNext) ---> next.config headers (X-Robots-Tag only if build flag off)
   |
   +--> RootLayout.generateMetadata (robots from ALLOW_INDEXING, title template)
   +--> Header (await connection(); getFilters  --cache()--+)
   |                                                         |
   +--> GET /  (home) await connection()                     |
   |      +-- HeroBanner, PromoBanners, StoryBand (static, SHOP/COPY, public/images/*)
   |      +-- BrandStrip   <- try{ getFilters() } -> stripBrands(inStock, soldBefore=[], defaultOrder) -> [] hides
   |      +-- Carousel     <- try{ getItemsPage('') } -> items.slice(0,10) -> [] hides
   |      +-- CategoryTiles<- try{ getFilters() } -> visibleTiles(SHOP.home.categories, filters.type) -> [] hides
   |
   +--> GET /just-dropped -> CataloguePage(lockedSort, basePath=/just-dropped) -> getFilters + getItemsPage(sort forced newest)
   +--> GET /about, /contact -> static, no API read
   +--> GET /robots.txt   -> await connection(); ALLOW_INDEXING ? allow + Sitemap : disallow all
   +--> GET /sitemap.xml  -> await connection(); ALLOW_INDEXING ? [static pages + brands(/filters) + items(/items limit 100, all pages)] : []
   |
   v
getFilters / getItemsPage -> howmanyFetch (force-cache, tag store:<slug>, revalidate 600) -> R2 data cache <-- webhook revalidateTag('store:<slug>', {expire:0}) via D1 tag cache
```

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                  # home (new; delete the redirect in next.config.ts)
│   ├── just-dropped/page.tsx     # CataloguePage lockedSort
│   ├── about/page.tsx            # static
│   ├── contact/page.tsx          # static
│   ├── robots.ts                 # dynamic
│   ├── sitemap.ts                # dynamic
│   └── layout.tsx                # static `metadata` -> generateMetadata (robots from env)
├── components/
│   ├── home/                     # HeroBanner, BrandStrip, PromoBanners, CategoryTiles, StoryBand, JustDroppedCarousel ('use client')
│   └── pages/                    # AboutBanner, ContactPanel
├── lib/
│   ├── indexing.ts               # isIndexingOn(raw) pure; used by env.ts AND next.config.ts
│   ├── securityHeaders.ts        # pure: securityHeaders(indexingOn) -> header list (testable; next.config imports it)
│   ├── homeSections.ts           # pure: stripBrands(), visibleTiles(), carouselEdges()
│   ├── sitemap.ts                # pure: sitemapEntries({ siteUrl, brands, items })
│   └── seo.ts                    # + pageMetadata(); listingRobots gets an `indexable` argument
└── shop/config.ts                # + home, about, seo, defaultBrandOrder, contact.intro; newBadgeDays 14
public/images/                    # hero.jpg banner-just-dropped.jpg banner-brands.jpg category-1..4.jpg story.jpg og-default.jpg
docs/ONBOARDING.md
```

### Pattern 1: Home page = `connection()` first, then independent guarded sections
**What:** `await connection()` once at the top, outside any try/catch (the Header documents why: a try/catch around the dynamic-usage signal makes the build call the API, "Pitfall 2"). Each data section is its own async server component that does its read inside try/catch and returns `null` on failure or emptiness. Static sections render regardless.
**Why per-section:** `getFilters` is React-`cache()`d, so the strip and tiles share one read with the Header; the carousel is the only `/items` read. A failed read hides only its section (HOME-02, DATA-03).
**Example:**
```tsx
// src/app/page.tsx  (sketch)
export default async function HomePage() {
    await connection();            // outside any try/catch
    return (
        <main>
            <HeroBanner />
            <BrandStrip />          // async RSC, own try/catch, returns null when empty
            <JustDropped />         // async RSC: getItemsPage('') -> slice(0, 10) -> <JustDroppedCarousel>{cards}</...>
            <PromoBanners />
            <CategoryTiles />       // async RSC
            <StoryBand />
        </main>
    );
}
// Inside a section:
let items: Item[] = [];
try { items = (await getItemsPage('')).page.items.slice(0, HOME.carouselItems); }
catch (error) { console.warn('Home: carousel read failed', error); }
if (items.length === 0) return null;
```
`getItemsPage('')` builds the key `/items?limit=24`, identical to `/shop` page 1 (`howmanyFetch` sorts params), so it adds no API call. [VERIFIED: src/lib/howmany/client.ts:72-77, `params.set('limit', String(CATALOGUE.pageSize))`]. Do NOT re-sort by `publishedAt`; the API default sort is `newest` [CITED: docs/refs/issues.json #2: "`sort`: `newest` (default, by when it was added to the store)"]. Use `const now = Date.now()` once with the same `// eslint-disable-next-line react-hooks/purity` comment `CataloguePage` uses.

### Pattern 2: Category-tile visibility (pure)
```ts
// src/lib/homeSections.ts
export type CategoryTile = { type: string; label: string; image: string };
export function visibleTiles(tiles: readonly CategoryTile[], types: Filters['type']): CategoryTile[] {
    const inStock = new Set(types.filter(f => f.count > 0).map(f => f.value.toLowerCase()));
    return tiles.filter(t => inStock.has(t.type.toLowerCase())).slice(0, 4);
}
```
Link: `` `${ROUTES.shop}?${new URLSearchParams({ type: tile.type })}` `` (the Header's `typeHref` does the same; `parseCatalogueQuery` matches case-insensitively against `/filters` values, so `jacket` resolves). Tiles are plain `<a>`-style `Link` with `prefetch={false}` (house rule).

### Pattern 3: Brand strip order (pure, BRAND-02 / D-07)
Sort key is `[tier, defaultOrderIndex, name A-Z]`; compare **slugs** (`brandSlug`), never raw strings, because "Levi's" and "Polo Ralph Lauren" are spelled differently in /filters than in a config list.
```ts
export function stripBrands(inStock: string[], soldBefore: string[], defaultOrder: readonly string[], cap = 16): { name: string; slug: string }[] {
    const rank = new Map(defaultOrder.map((n, i) => [brandSlug(n), i]));
    const tier = (slug: string) => (inStockSlugs.has(slug) ? 0 : 1);
    // brandIndex() already dedupes by slug and drops empty slugs, A to Z
    ...
}
```
Behaviour to pin in tests: in-stock brands first, then sold-before (fake list in the test), default-order rank within a tier, unknown brands A to Z after ranked ones, a default-order brand with no stock is **not** added (UI-SPEC "unresolved" row: the planner assumes this and records it), cap 16, empty input gives `[]` (band hidden).
Feed it `brandIndex(filters.brand.map(f => f.value))` so Phase 3's collision rule applies. Reuse the logo test `BRAND_LOGOS.includes(slug)` as `BrandGrid` does [VERIFIED: src/components/brands/BrandGrid.tsx: `BRAND_LOGOS.includes(slug) ? <Image src={`/brands/${slug}.svg`} ...`].

### Pattern 4: Carousel client island
Server renders `<ItemCard>` list and passes it as `children` to `'use client'` `JustDroppedCarousel` (the ItemGallery precedent). Card width is set from the `<ul>` with child variants because `ItemCard` renders a bare `<li>` and must not change:
```tsx
<ul ref={track} className="flex gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
   [&>li]:shrink-0 [&>li]:snap-start [&>li]:basis-[calc((100%_-_16px)/2)] sm:[&>li]:basis-[calc((100%_-_48px)/3)] lg:[&>li]:basis-[calc((100%_-_96px)/5)]">
```
(underscores inside `calc()` are Tailwind's spaces; the scrollbar-hiding classes are copied from `ItemGallery`.) [VERIFIED: ItemGallery.tsx track classes]
State: a pure, unit-testable edge function plus a `ResizeObserver` and a scroll listener that call `setState` **inside callbacks** (an effect that calls `setState` synchronously trips the `react-hooks` lint rules in `eslint-config-next 16`):
```ts
export const carouselEdges = (scrollLeft: number, clientWidth: number, scrollWidth: number) => ({
    overflows: scrollWidth - clientWidth > 1,
    atStart:   scrollLeft <= 1,
    atEnd:     scrollLeft + clientWidth >= scrollWidth - 1,   // 1px tolerance for fractional widths (125%/150% Windows scale)
});
```
Arrows: `scrollBy({ left: ±track.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' })` using the same `matchMedia('(prefers-reduced-motion: reduce)')` check as `ItemGallery.scrollToPhoto`. Render arrows only when `overflows` (initial `false`, so no-JS shows a swipeable track without dead buttons). `IconButton` currently has no disabled styling [VERIFIED: buttons.tsx IconButton className is `'inline-flex size-11 shrink-0 items-center justify-center text-forest'`]; add `disabled:opacity-50 disabled:cursor-not-allowed` as UI-SPEC says. `role="region" aria-roledescription="carousel" aria-labelledby=<heading id>`; use `useId()` for the id.

### Pattern 5: `/just-dropped` = `CataloguePage` + `lockedSort`
Changes in `CataloguePage`: new optional `lockedSort?: boolean`; after `parseCatalogueQuery`, `const query = lockedSort ? { ...parsed, sort: DEFAULT_SORT } : parsed;` and `{!lockedSort && <SortSelect .../>}`. `DEFAULT_SORT` is `'newest'` and `toSearchString` omits it [VERIFIED: config.ts `export const DEFAULT_SORT = 'newest';`, params.ts `if (query.sort !== DEFAULT_SORT) entries.push(...)`], so the API call carries no `sort` param, the pager/chip/clear links carry none, and `?sort=price_asc` is silently ignored. `SortSelect` is the only sort UI [VERIFIED: grep]; `FilterPanel` only writes a hidden sort input when `draft.sort !== DEFAULT_SORT`, which is never true when locked.
`generateMetadata` for the page must apply the same override before `listingRobots`/`canonicalUrl`, otherwise `/just-dropped?sort=price_asc` would be `noindex` with a query in its canonical. Page body: `await connection()`; `<CataloguePage raw={await searchParams} basePath={ROUTES.justDropped} title={COPY.nav.justDropped} lockedSort />`. No `loading.tsx` (a skeleton would turn the past-the-end 307 into a meta refresh; Phase 2 decision 02-05). Note `/just-dropped` and `/shop` (default sort) show the same items in the same order; both get self-referencing canonicals and both are in the sitemap per D-17. Accepted duplication.

### Pattern 6: `pageMetadata()` because metadata merges shallowly
Next merges segment metadata **shallowly**: a page that sets `openGraph` replaces the layout's whole `openGraph` (images included) [CITED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md, "Merging": "All `openGraph` fields from `app/layout.js` are **replaced**"]. So every page must emit its own OG block; one helper does it:
```ts
// src/lib/seo.ts
export function pageMetadata({ siteUrl, path, title, description, image }: {
    siteUrl: string; path: string; title: Metadata['title']; description: string;
    image?: { url: string; width?: number; height?: number };   // default: new URL('/images/og-default.jpg', siteUrl)
}): Metadata {
    const url = new URL(path, siteUrl).toString();
    const img = image ?? { url: new URL(OG_DEFAULT, siteUrl).toString(), width: 1200, height: 630 };
    return {
        title, description,
        alternates: { canonical: url },
        openGraph: { type: 'website', url, title: <resolved string>, description, siteName: SHOP.name, locale: SHOP.locale.replace('-', '_'), images: [img] },
        twitter: { card: 'summary_large_image', title: <resolved string>, description, images: [img.url] },
    };
}
```
`openGraph.title` is a plain string, so the layout's `title.template` is **not** applied to it; pass the already-built string (`${page} | ${SHOP.name}`). Listing pages spread the result and add `robots: listingRobots(query, indexable)` and their own canonical (`canonicalUrl(...)`, which already handles query strings). Use `new URL(path, siteUrl)` rather than `metadataBase` to match the existing "SITE_URL read per call, never at module scope, never from Host" pattern in `/shop` and the item page. [VERIFIED: src/app/shop/page.tsx, src/app/items/[code]/page.tsx]
Titles: home `title: { absolute: SHOP.seo.homeTitle }`; others `title: 'About'` etc. and the layout template `'%s | Blacktail Archive'` supplies the suffix [VERIFIED: layout.tsx `title: { default: SHOP.name, template: `%s | ${SHOP.name}` }`; CITED generate-metadata.md "template" / "absolute"]. Item page: `title: nameOf(item)`, description built from brand/title/size/condition label (generic wording in `COPY.seo`, no shop name), image `item.photos[0]` `url`/`width`/`height`, fallback to the default OG image when `photos` is empty (the mock has `MOCK-0029` with no photos).

### Pattern 7: Root layout robots from env
`export const metadata = { robots: { index: false, follow: false } }` becomes `export async function generateMetadata()` returning `{ title: {...}, robots: storeEnv().ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false } }`. Every page that does not set `robots` inherits it; pages that do (listings) must use the same flag: change `listingRobots(query)` to `listingRobots(query, indexable)` and delete the `SITE_INDEXABLE` constant [VERIFIED: seo.ts `const SITE_INDEXABLE = false;`]; update `seo.test.ts` (its first test is titled "while the site is not indexable").

### Pattern 8: Indexing flag, one parser, two readers
```ts
// src/lib/indexing.ts  (pure, no imports so next.config.ts can import it)
export const isIndexingOn = (raw: string | undefined): boolean => raw === 'true';
```
- `env.ts`: `ALLOW_INDEXING: z.enum(['true', 'false'], msg('must be true or false')).optional().transform(isIndexingOn)` (loud on a typo, consistent with FOUND-03; absent = off). Add it to the `storeSchema` object; `StoreEnv['ALLOW_INDEXING']` becomes `boolean`. Add a case to `env.test.ts`; note that test's `setEnv` clears only the keys of `valid`, so clear/stub `ALLOW_INDEXING` explicitly to avoid leakage between tests.
- `next.config.ts`: `securityHeaders(isIndexingOn(process.env.ALLOW_INDEXING))` omits `X-Robots-Tag` when on. Fail-closed: anything but the exact string `true` keeps the header.
- `.env.example`, `wrangler.jsonc` `vars`, `deploy-workers.yml` env, `docs/ONBOARDING.md`.

### Pattern 9: `robots.ts` and `sitemap.ts` must be dynamic
Both are "special Route Handler[s] cached by default unless [they use] a Request-time API" [CITED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md and sitemap.md]. A static one would be evaluated at build with the **build** env and, for the sitemap, would call the API at build (CI fails the job if the build makes any call: `calls during the build ... want {"store":0,"items":0}` [VERIFIED: .github/workflows/ci.yml]). So start both with `await connection()` [CITED: connection.md: "indicate rendering should wait for an incoming user request"]; CI on workerd proves it.
```ts
// robots.ts
export default async function robots(): Promise<MetadataRoute.Robots> {
    await connection();
    const { ALLOW_INDEXING, SITE_URL } = storeEnv();
    return ALLOW_INDEXING
        ? { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: new URL('/sitemap.xml', SITE_URL).toString() }
        : { rules: { userAgent: '*', disallow: '/' } };
}
```
Do **not** disallow `/shop?...` patterns: filtered listings are `noindex, follow` (SEO-04) and a crawler can only see that tag if it may fetch the page.
```ts
// sitemap.ts: off -> []; on -> entries from a pure builder
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    await connection();
    const { ALLOW_INDEXING, SITE_URL } = storeEnv();
    if (!ALLOW_INDEXING) return [];
    const filters = await getFilters();
    const first = await getItemsPage('', CATALOGUE.sitemapPageSize);                       // 100 = API max
    const rest = await Promise.all(range(2, lastPage(first.page.total, 100)).map(p => getItemsPage(`page=${p}`, 100)));
    return sitemapEntries({ siteUrl: SITE_URL, brands: brandIndex(filters.brand.map(f => f.value)), items: [first, ...rest].flatMap(r => r.page.items) });
}
```
This needs `getItemsPage(search, limit = CATALOGUE.pageSize)`: today the client always overrides `limit` with 24 [VERIFIED: client.ts:72-77]; the API accepts `limit` 1 to 100 [CITED: issues.json #2 "`limit`: 1 to 100, default 24"]. Using 100 keeps a 300-piece shop to 3 subrequests instead of 13 (Workers cap subrequests per invocation; exact number depends on the plan, see A2). Extend `client.test.ts` for the new argument. Entries: static pages without `lastModified`; brands from `/filters`; items with `lastModified: new Date(publishedAt)` only if valid; **no** `changeFrequency`/`priority` (ignored by Google, extra bytes). Hard cap the list at 50,000 (sitemap protocol) with a constant, and cap pages at `CATALOGUE.maxPage`.

### Pattern 10: Onboarding doc content map (`docs/ONBOARDING.md`)
Sourced from the real, working setup (Phase 1 owner checklist and the files in the repo). Outline: (1) prerequisites (Node 24, Cloudflare account on Workers Paid, GitHub repo); (2) fork/copy and swap `src/shop/` (`config.ts`, `colours.ts`, `theme.css`, `fonts.ts` + `fonts/`, `logo.svg`, `brand-logos.ts`), `public/brands/*.svg`, `public/images/*` (the table of 9 slot filenames and sizes); (3) How many: store address, webhook URL `https://<host>/api/webhooks/howmany`, copy secret; (4) Cloudflare one-time: `npx wrangler login`, `npx wrangler d1 create <name>-tags` (copy `database_id`), `npx wrangler r2 bucket create <name>-opennext-cache`, optional `npx wrangler r2 bucket lifecycle add <bucket>` (flags `--expire-days`, prefix `incremental-cache/`), API token + `gh secret set CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`, `npx wrangler secret put HOWMANY_WEBHOOK_SECRET`; (5) edit `wrangler.jsonc` (`name`, `WORKER_SELF_REFERENCE.service` which must equal `name`, bucket name, D1 name/id, `vars`, `routes`); (6) the deploy workflow; (7) env var table (`STORE_SLUG`, `HOWMANY_API_URL`, `HOWMANY_WEBHOOK_SECRET`, `SITE_URL`, `ALLOW_INDEXING`); (8) launch checklist (real photos, contact, default brand order, flip `ALLOW_INDEXING`, rate-limit rule from README); (9) PENDING-OWNER grep (`grep -rn PENDING-OWNER src`). [VERIFIED: wrangler `r2 bucket lifecycle add --help` and `d1 create --help` run this session]

### Anti-Patterns to Avoid
- **try/catch around `connection()`** (swallows the dynamic-usage signal, build then calls the API).
- **Setting `openGraph` on a page without images** (drops the default OG image).
- **A static `robots.ts`/`sitemap.ts`** (bakes build env, calls API at build).
- **`priority` on `next/image`** (deprecated in Next 16; see Pitfall 5).
- **Hard-coded hostnames in workflows** (`www.blacktailarchive.cgaudino.com` is typed 7 times in `deploy-workers.yml`): replace with `$SITE_URL`.
- **Re-sorting carousel items client-side** (API order is the truth).
- **Disallowing query URLs in robots.txt** (hides their `noindex`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Carousel | a library or custom physics | CSS `scroll-snap` + `scrollBy` | D-12; native touch/keyboard behaviour for free |
| Brand strip scrolling | JS scroller | `overflow-x-auto snap-x` | No JS needed, no arrows (D-06) |
| robots.txt / sitemap.xml serialisation | string templates | `app/robots.ts`, `app/sitemap.ts` returning `MetadataRoute.*` | Next serialises; just keep URLs XML-safe (Pitfall 3) |
| Page metadata merge | per-page ad-hoc objects | one `pageMetadata()` | Shallow merge drops OG fields |
| Paging/filter/sort handling on Just Dropped | a new catalogue | `CataloguePage` + `lockedSort` | Same code path as `/shop` and `/brands/[slug]` |
| Brand slug / dedupe | new regex | `brandSlug`, `brandIndex` from `src/lib/brands.ts` | Phase 3 rule; collisions already handled |
| Money, labels, dates | new helpers | `formatMoney`, `label`, `isNew` | Already tested |
| Placeholder images | hand-made art | one sharp script, committed output | Deterministic, palette-only |

**Key insight:** every new thing in this phase is a thin composition of existing seams. The risk is not complexity; it is the four platform interactions in Common Pitfalls.

## Common Pitfalls

### Pitfall 1: The `X-Robots-Tag` header is build-time, the flag is run-time
**What goes wrong:** `next.config.ts` `headers()` is evaluated during `next build`; OpenNext bakes it into the Worker. If `ALLOW_INDEXING=true` is only in `wrangler.jsonc` vars, meta robots and `robots.txt` go indexable but the wire header still says `noindex, nofollow` (a crawler obeys the stricter), so the launch silently fails. [ASSUMED: A3, supported by the Phase 1 note that config headers are baked; CI/deploy smoke below proves it]
**How to avoid:** set the flag in **both** places from one source. Recommended: a GitHub repository variable `ALLOW_INDEXING`; in `deploy-workers.yml` `env: ALLOW_INDEXING: ${{ vars.ALLOW_INDEXING || 'false' }}` (build) and `npx wrangler deploy --var ALLOW_INDEXING:${{ vars.ALLOW_INDEXING || 'false' }}` (run time; `--var` exists [VERIFIED: `wrangler deploy --help`], precedence over `vars` assumed, A1). Do not also put `ALLOW_INDEXING` in `wrangler.jsonc` vars if using `--var`, or document precedence. Put the pure header builder in `src/lib/securityHeaders.ts` so it is unit-testable.
**Warning signs:** after launch `curl -sI https://host/shop | grep -i x-robots-tag` still prints a line. Add that as a deploy smoke assertion when the variable is `true`.

### Pitfall 2: Metadata shallow merge drops Open Graph images
See Pattern 6. Warning sign: a page's HTML has `og:title` but no `og:image`. Test `pageMetadata` output and grep rendered HTML in CI.

### Pitfall 3: Next does not escape `<loc>`
`resolveSitemap` writes `` `<loc>${item.url}</loc>` `` raw [VERIFIED: node_modules/next/dist/build/webpack/loaders/metadata/resolve-route-data.js:112]. Item codes and brand slugs come from the API. Build every URL with `new URL(ROUTES.item(code), siteUrl).toString()` (`ROUTES.item` uses `encodeURIComponent`, which encodes `&`, `<`, `>` and space) and never put a query string in the sitemap. Unit-test an item code like `A&B<1>`.

### Pitfall 4: Dynamic-but-cached route handlers
Without `await connection()`, `sitemap.ts` is evaluated at build: API calls during build (CI fails: "the build called the API") and a baked-in empty/stale list. Same for `robots.ts` with the build env. CI should fetch `/sitemap.xml` and `/robots.txt` on the Worker with the mock.

### Pitfall 5: `priority` is deprecated
Next 16: "the `priority` property has been deprecated in favor of the `preload` property"; the docs say in most cases use `loading="eager"` or `fetchPriority="high"` [CITED: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md, "priority"]. The UI-SPEC says `priority`/`fetchPriority="high"`; implement as `loading="eager" fetchPriority="high"` (as `ItemCard` does for `eager`). Not `preload` (would emit a `<link>` for an unoptimized image; unnecessary).

### Pitfall 6: Swallowed errors and cached rejections
`getFilters` and `getItemsPage` are React `cache()`d; a rejection is cached for the request, so the strip and the tiles fail together. That is fine, but write each section's `catch` to log one `console.warn` line (like `Header`/`MoreFromBrand`) so CI's "no ERROR in the Worker log" check still passes in the outage proof, which hits `/shop`.

### Pitfall 7: Sold-before brands link to a 404
`/brands/[slug]` returns 404 unless the slug exists in `/filters` [VERIFIED: src/app/brands/[slug]/page.tsx `if (!name) notFound();`]. When BRAND-05 provides sold-before names, the strip must either skip names without stock or the brand page must tolerate them. Phase 4 ships the list empty; leave a comment at the seam and an Open Question. Resolved by CONTEXT D-21: the brand page tolerates them (empty catalogue, not a 404).

### Pitfall 8: Shop-guard collisions
`shop-guard.test.ts` lowercases and substring-matches needles [VERIFIED: file read]. If you extend it with `SHOP.home` strings as needles (recommended for D-03 enforcement), do not add short phrases that also appear in `COPY` ("Just dropped" = `COPY.nav.justDropped` case-insensitively, "Pre-loved", "Our story"); add only the long sentences (promo body, story body, About copy) and the image filenames. Also `SHOP` is scanned for em dashes already (`copy.test.ts`), so the new `home/about/seo` strings are covered.

### Pitfall 9: Placeholder files vs config drift
Fixed filenames mean a typo is a silent 404 image. Add a test (like `brands.test.ts` for logos) that every filename referenced by `SHOP.home` exists in `public/images/`, and that the nine required slots exist.

### Pitfall 10: `workers_dev` still true
`wrangler.jsonc` has `"workers_dev": true` with a comment "Phase 4 turns it off" and the README says the rate-limit rule does not cover workers.dev until Phase 4 [VERIFIED: wrangler.jsonc, README.md]. With one shared flag, `*.workers.dev` would also become indexable (it serves the same Worker). Set `"workers_dev": false` in this phase, update the README sentence. (The canonical URL is `SITE_URL` either way.)

### Pitfall 11: Windows-only authoring traps
OpenNext cannot build on Windows (CI is the only place the Worker is built). `convert` on this PATH is Windows' disk-conversion tool, not ImageMagick; use the sharp script. Tailwind arbitrary `calc()` needs underscores for spaces.

### Pitfall 12: Footer, header and menu stop filtering
`isBuilt` is called in `Footer.tsx`, `MobileMenu.tsx`, `NavLink.tsx` and tested in `utils.test.ts` [VERIFIED: grep]. Removing it means: Footer renders all five `EXPLORE` items, `MobileMenu.link()` loses the `isBuilt(href) &&`, `NavLink` loses its early `return null`, delete the `describe('isBuilt')` block, remove the `BUILT_PAGES` export and the stale comment in `routes.ts`, and the `import { BUILT_PAGES }` in `utils.ts`.

## Code Examples

### Security headers (pure, testable)
```ts
// src/lib/securityHeaders.ts  (no imports)
export function securityHeaders(indexingOn: boolean): { key: string; value: string }[] {
    return [
        ...(indexingOn ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ];
}
```
Values are quoted verbatim from the current `next.config.ts` [VERIFIED: next.config.ts SECURITY_HEADERS]. In `next.config.ts` delete the whole `redirects()` block (the `/` to `/shop` 307) and use `headers: securityHeaders(isIndexingOn(process.env.ALLOW_INDEXING))`.

### Placeholder generation (authoring-time only)
```js
// scratch script (not committed or run in CI): node make-placeholders.mjs
import sharp from 'sharp';
const svg = (w, h, a, b, deg) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" gradientTransform="rotate(${deg} .5 .5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
await sharp(svg(2400, 1000, '#1F2A1F', '#4A5A46', 20)).jpeg({ quality: 70, mozjpeg: true }).toFile('public/images/hero.jpg');
```
Palette values are quoted verbatim from `theme.css` [VERIFIED: `--color-forest: #1F2A1F; --color-olive: #4A5A46; --color-stone: #A69D8F; --color-sand: #CBB89E; --color-ivory: #E8E5DD;`]. `og-default.jpg`: Forest fill, composite `src/shop/logo.svg` with its `fill="#1F2A1F"` replaced by Ivory `#E8E5DD`, 1200x630 [VERIFIED: logo.svg root has `fill="#1F2A1F"`]. Sizes per UI-SPEC: hero at most 200 KB, others at most 120 KB. Smooth gradients compress to a few KB; verify with `ls -l`.

### Item metadata
```ts
export async function generateMetadata({ params }: PageProps<'/items/[code]'>): Promise<Metadata> {
    const item = await getItem((await params).code);
    if (!item) return {};                       // 404 from metadata would answer 200 (existing comment)
    const cover = item.photos[0];
    return pageMetadata({
        siteUrl: storeEnv().SITE_URL, path: ROUTES.item(item.code), title: nameOf(item),
        description: COPY.seo.item(nameOf(item), item.size, label(item.condition, COPY.labels.condition)),
        image: cover && { url: cover.url, width: cover.width, height: cover.height },
    });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/image priority` | `loading="eager"` + `fetchPriority="high"` (or `preload`) | Next 16.0 | Do not use `priority` for the hero |
| Static `export const metadata` | `generateMetadata()` when values depend on env | n/a | Layout robots must read `SITE_URL`/flag at request time |
| `revalidateTag(tag)` | `revalidateTag(tag, { expire: 0 })` | Next 16 | Already done in Phase 1 |

**Deprecated/outdated:** `next/image` `priority` prop [CITED: image.md]; the config-level `/` redirect (Phase 1 stopgap, removed here).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `wrangler deploy --var KEY:VALUE` overrides a same-named `vars` entry in `wrangler.jsonc` | Pitfall 1 | Run-time flag not applied; mitigate by not duplicating the key in `wrangler.jsonc`, and by the deploy smoke check (`robots.txt` has `Sitemap:`). The flag itself exists [VERIFIED: help text] but the precedence is not tested here |
| A2 | Workers limit subrequests per invocation (a 13-page sitemap fan-out at limit 24 might be near a plan limit on the free plan; the account is on Workers Paid per Phase 1 setup) | Pattern 9 | If wrong, nothing breaks; limit 100 is simply cheaper. R2/D1 binding calls may or may not count |
| A3 | `next.config.ts headers()` values are fixed at build time on OpenNext | Pitfall 1 | If headers were request-time, the single run-time var would suffice; the two-place setup is harmless but redundant. The deploy smoke proves the real behaviour |
| A4 | `await connection()` inside a metadata route handler (`robots.ts`/`sitemap.ts`) makes it dynamic under OpenNext | Pattern 9 | If not, they are built statically: CI "build made no calls" fails, which is the safety net. Fallback: `export const dynamic = 'force-dynamic'` [CITED: caching-without-cache-components.md `dynamic`] |
| A5 | Fourth default category tile is `shirt` (mockup's "Accessories" has no type code) | Open Questions | Owner picks another; one config entry |
| A6 | Shipping with the flag off is the intended launch posture (placeholders are still in the repo) | Summary | If the owner wants indexing on at merge, set the repo variable to `true` |
| A7 | The cover `url` is acceptable as `og:image` size-wise (real photo byte sizes unknown, STACK open item) | Pattern 6 | Heavy images may be dropped by some scrapers; switch to `thumbUrl` for the OG image |

## Open Questions (RESOLVED)

1. **Does the sold-before brand tier include brands with no stock?**
   - Known: D-07 orders in stock, sold-before, then default; the UI-SPEC shows only `/filters` brands and flags this as unresolved.
   - Unclear: whether a future sold-before brand should appear even though `/brands/[slug]` 404s for it (Pitfall 7).
   - **RESOLVED (owner, CONTEXT D-21):** sold-before brands are shown even with no stock; a default-order brand with no stock and no sold history is omitted. `/brands/[slug]` renders the empty brand catalogue for a sold-before slug and still 404s for any other unknown slug (Plan 03, with a unit test). The list ships empty until How many provides it (BRAND-05).
2. **Should the repo ship with indexing on?**
   - **RESOLVED:** off. `ALLOW_INDEXING` unset means false; contact values, photos and the brand order are still PENDING-OWNER, so the owner sets the repository variable at launch (documented in the onboarding doc and PR, Plan 05).
3. **Fourth category tile.**
   - **RESOLVED:** `shirt` (Shirts), marked PENDING-OWNER in `src/shop/config.ts` (Plan 03); the owner can swap it with one config entry.
4. **OG image weight.**
   - **RESOLVED:** item pages use the cover `url` as `og:image` (Plan 01); switch to `thumbUrl` if real photos prove heavy. Verified in the end-of-phase UAT link-preview check (Plan 05).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | v24.22.1 (`.nvmrc` = 24) | — |
| npm / vitest | tests | ✓ | `vitest ^5.0.5` in package.json | — |
| wrangler | onboarding commands, `--var` | ✓ | `^4.151.3` (ran `wrangler ... --help`) | — |
| sharp (transitive) | placeholder JPEG generation | ✓ | 0.35.5 | PowerShell `System.Drawing` (not verified) |
| ImageMagick | n/a | ✗ (`convert` is the Windows disk tool) | — | use sharp |
| OpenNext build on Windows | Worker build | ✗ (unsupported) | — | CI (Linux) builds and runs the Worker |
| GitHub CLI `gh` | repository variable, PR | ✓ (on PATH) | — | GitHub UI |

**Missing dependencies with no fallback:** none. **Missing with fallback:** local Worker builds (use CI).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | no accounts, no forms |
| V3 Session Management | no | no sessions |
| V4 Access Control | no | public read-only site |
| V5 Input Validation | yes | `ALLOW_INDEXING` through zod enum; URL query already cleaned by `parseCatalogueQuery`; sitemap URLs built with `new URL` + `encodeURIComponent` |
| V6 Cryptography | no | webhook HMAC unchanged |
| V14 Configuration | yes | fail-closed indexing default; `X-Robots-Tag` header; `workers_dev: false` so non-production hosts are not reachable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XML injection through API-supplied item codes in `<loc>` | Tampering | Next does not escape; build URLs with `encodeURIComponent` via `ROUTES.item`, no queries in the sitemap, unit test |
| Preview/duplicate host indexed, leaking placeholders | Information disclosure | Flag off by default, `workers_dev: false`, canonicals from `SITE_URL` never from Host |
| Reverse tabnabbing on external links (platforms, socials) | Spoofing | `target="_blank" rel="noopener noreferrer"` (existing `ButtonLink external`, `SocialIcons`) |
| Contact values typed into pages drift or inject | Tampering | Read only from `SHOP.contact/platforms/socials` (D-15); `mailto:` built from config |
| Showing cost/internal fields | Information disclosure | Cards read named fields only (existing); sitemap/OG use only code, brand, title, size, condition, photo URL |
| Rate limit exhaustion via sitemap fan-out | DoS | `limit=100` pages, cap on page count, same cache keys as other pages, tagged fetch cache |

## Test notes for the planner (validation section omitted: `nyquist_validation` is false)

Existing harness: Vitest `environment: 'node'`, `include: ['src/**/*.test.ts']`, `server-only` mocked in setup; component tests render with `renderToStaticMarkup(createElement(...))` (see `BrandGrid.test.ts`). Quick run: `npx vitest run <file>`; full: `npm test`. [VERIFIED: vitest.config.mts, BrandGrid.test.ts]
New tests worth writing: `stripBrands` (tiers with a fake sold-before list, slug matching, cap, empty), `visibleTiles` (case-insensitive, count 0, cap 4), `carouselEdges`, `isIndexingOn`/env (absent, `true`, `false`, `yes` rejected), `securityHeaders(true/false)`, `listingRobots` with the flag, `pageMetadata` (OG image present, title strings, absolute URLs), `sitemapEntries` (static six pages, brand and item URLs, `A&B<1>` code encoded, off gives `[]`), `robots` rules both ways, image-slot existence, `SHOP.newBadgeDays === 14`, copy/em dash coverage for the new `SHOP.home/about/seo` strings (already automatic through `withEmDash(SHOP)`), `client.test.ts` for the `limit` argument, static markup of `ContactPanel` (every href comes from `SHOP`) and `JustDroppedCarousel` initial state (no arrow buttons).
CI worker job additions (mock API): warm up on `/` instead of `/shop`; `/` 200 with `<h1>`, carousel items `href="/items/MOCK-0001"`, tile `type=jacket` present and `type=jeans` absent (mock types are shirt, knit, jacket), `/just-dropped` 200 without a sort control and `?sort=price_asc` giving canonical `/just-dropped` (no `noindex`), `/about` and `/contact` 200 with `mailto:`, `/robots.txt` disallow-all while off, then a second Worker start with `ALLOW_INDEXING=true` in `.dev.vars` asserting `Sitemap:` in robots, `MOCK-0001` in `/sitemap.xml`, and `content="index` in the page robots meta (the header cannot flip in CI because it is baked at the single build; cover it with the unit test). Deploy workflow smoke: `/` expects 200 (was 307), replace literal hosts with `$SITE_URL`, assert `x-robots-tag` absent and `robots.txt` has `Sitemap:` only when the variable is true. Also update the stale comments that say "/ is a redirect" in `ci.yml`, `prove-freshness.mjs` and `deploy-workers.yml`.

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `04-CONTEXT.md`, `04-UI-SPEC.md`, `REQUIREMENTS.md`, `STATE.md`, `.claude/CLAUDE.md`, `package.json`, `next.config.ts`, `wrangler.jsonc`, `open-next.config.ts`, `.env.example`, `README.md`, `.github/workflows/ci.yml`, `deploy-workers.yml`, `src/lib/{routes,env,config,seo,brands,utils,labels,copy,dates,params,definitions}.ts`, `src/lib/howmany/{client,schemas}.ts`, `src/shop/{config,theme.css,brand-logos,fonts}`, `src/app/{layout,brands/page,brands/[slug]/page,shop/page,items/[code]/page,not-found,error}.tsx`, `src/components/{catalogue,brands,layout,ui,item}/*`, `scripts/mock-howmany.mjs`, `vitest.config.mts`, existing tests.
- Installed Next 16.4.1 docs: `generate-metadata.md` (merging, template/absolute, metadataBase), `robots.md`, `sitemap.md`, `image.md` (priority/preload), `connection.md`, `caching-without-cache-components.md`; `node_modules/next/dist/build/webpack/loaders/metadata/resolve-route-data.js:112` (unescaped `<loc>`).
- `docs/refs/issues.json` issue #2 (API: `limit` 1 to 100, default sort, caching, rate limit).
- CLI output this session: `wrangler r2 bucket lifecycle add --help`, `wrangler d1 create --help`, `wrangler deploy --help` (`--var`), `require('sharp')` works (0.35.5).

### Secondary (MEDIUM confidence)
- Phase 1 research/plan notes (headers apply on the Worker; owner setup checklist).

### Tertiary (LOW confidence)
- Workers subrequest limits per plan (A2) were not re-checked online.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, no new packages.
- Architecture: HIGH, composed of proven repo patterns; the dynamic metadata routes and the build-time header are the two items CI/deploy must prove (A3, A4).
- Pitfalls: HIGH for 2, 3, 5, 9, 10, 12 (read in source/docs); MEDIUM for 1 and 4 (platform behaviour inferred, with a proof step).

**Research date:** 2026-11-03
**Valid until:** 2026-11-17 (OpenNext and Next release every few days; re-check if either is bumped before planning)
