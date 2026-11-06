# Phase 4: Home and Launch - Pattern Map

**Mapped:** 2026-11-03
**Files analyzed:** 28 (new and modified)
**Analogs found:** 27 / 28 (all analogs are git-tracked source under `src/`, `next.config.ts`)

Line numbers refer to the files as read on branch `gsd/phase-04-home-and-launch`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `src/app/page.tsx` (new, home) | page | request-response (3 guarded reads) | `src/app/brands/page.tsx` + `Header.tsx` try/catch | role-match |
| `src/app/just-dropped/page.tsx` | page | request-response | `src/app/brands/[slug]/page.tsx` | exact |
| `src/app/about/page.tsx`, `src/app/contact/page.tsx` | page | static | `src/app/brands/page.tsx` (metadata + `<main>`), `Footer.tsx` (contact reads) | role-match |
| `src/app/robots.ts`, `src/app/sitemap.ts` | route (metadata) | request-response | `src/app/brands/page.tsx` (`await connection()` first) | partial |
| `src/app/layout.tsx` (mod) | layout | config | itself, lines 8-12 | exact |
| `src/components/catalogue/CataloguePage.tsx` (mod, `lockedSort`) | component | request-response | itself, `brand` prop (lines 23-34) | exact |
| `src/components/home/BrandStrip.tsx` | component | transform | `src/components/brands/BrandGrid.tsx` | exact |
| `src/components/home/JustDroppedCarousel.tsx` ('use client') | component | event-driven | `src/components/item/ItemGallery.tsx` | role-match |
| `src/components/home/JustDropped.tsx` (async RSC section) | component | request-response | `src/components/item/MoreFromBrand.tsx` | role-match |
| `src/components/home/{HeroBanner,PromoBanners,CategoryTiles,StoryBand}.tsx` | component | static | `BrandGrid.tsx` (Link + Image), `Footer.tsx` (SHOP reads, ButtonLink) | role-match |
| `src/components/pages/{AboutBanner,ContactPanel}.tsx` | component | static | `Footer.tsx` lines 43-58 | role-match |
| `src/components/ui/buttons.tsx` (mod, IconButton disabled) | component | n/a | itself, line 57 | exact |
| `src/components/layout/{Footer,MobileMenu,NavLink}.tsx` (mod, drop `isBuilt`) | component | n/a | `Footer.tsx` line 37 | exact |
| `src/lib/homeSections.ts` (+ test) | utility | transform | `src/lib/brands.ts` | exact |
| `src/lib/indexing.ts` (+ test) | utility | transform | `src/lib/brands.ts` (pure, client-safe header comment) | role-match |
| `src/lib/securityHeaders.ts` (+ test) | utility | transform | `next.config.ts` lines 4-13 | exact |
| `src/lib/sitemap.ts` (+ test) | utility | transform | `src/lib/brands.ts` + `ROUTES` | role-match |
| `src/lib/seo.ts` (mod: `pageMetadata`, `listingRobots(query, indexable)`) + `seo.test.ts` | utility | transform | itself | exact |
| `src/lib/env.ts` (mod, `ALLOW_INDEXING`) + `env.test.ts` | config | validation | itself | exact |
| `src/lib/howmany/client.ts` (mod, `getItemsPage(search, limit)`) + `client.test.ts` | service | request-response | itself, lines 72-77 | exact |
| `src/lib/routes.ts` (mod, delete `BUILT_PAGES`), `utils.ts`, `utils.test.ts` | config | n/a | itself | exact |
| `src/shop/config.ts` (mod: `home`, `about`, `seo`, `defaultBrandOrder`, `newBadgeDays` 14) | config | n/a | itself | exact |
| `next.config.ts` (mod: delete `redirects()`, use `securityHeaders`) | config | n/a | itself | exact |
| `src/app/items/[code]/page.tsx` (mod `generateMetadata` to `pageMetadata`) | page | request-response | itself | exact |
| `src/lib/copy.ts` (mod: `COPY.seo`, carousel arrow labels) | config | n/a | itself | exact |
| `public/images/*.jpg` (9 placeholders), image-slot test | asset/test | n/a | `src/lib/brands.test.ts` (logo manifest vs `public/brands`) | role-match |
| `docs/ONBOARDING.md`, `.env.example`, `wrangler.jsonc`, workflows | docs/config | n/a | none in src | no analog (see end) |

## Pattern Assignments

### `src/app/just-dropped/page.tsx` (page, request-response)

**Analog:** `src/app/brands/[slug]/page.tsx`

**Imports** (lines 1-11):
```typescript
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { CataloguePage } from '@/components/catalogue/CataloguePage';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { getFilters } from '@/lib/howmany/client';
import { parseCatalogueQuery } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { canonicalUrl, listingRobots } from '@/lib/seo';
```

**Core pattern** (lines 21-48): `generateMetadata` parses the query with `getFilters()`, builds `robots` and `canonical`; the body does `await connection()` first, then renders `CataloguePage`.
```typescript
export async function generateMetadata({ params, searchParams }: PageProps<'/brands/[slug]'>): Promise<Metadata> {
    ...
    const query = parseCatalogueQuery(await searchParams, { ...filters, brand: [] });
    return {
        title:      name,
        robots:     listingRobots(query),
        alternates: { canonical: canonicalUrl(storeEnv().SITE_URL, query, ROUTES.brand(slug)) },
    };
}

export default async function BrandPage({ params, searchParams }: PageProps<'/brands/[slug]'>) {
    await connection();
    ...
    return (
        <CataloguePage raw={await searchParams} basePath={ROUTES.brand(slug)} brand={name} title={name} back={{ href: ROUTES.brands, label: COPY.nav.allBrands }} />
    );
}
```
For Just Dropped: no `params`, `PageProps<'/just-dropped'>`, apply `{ ...parsed, sort: DEFAULT_SORT }` before `listingRobots`/`canonicalUrl` (so `?sort=price_asc` is not noindex), pass `lockedSort`, `basePath={ROUTES.justDropped}`, `title={COPY.nav.justDropped}`. Use `pageMetadata` for title/OG. No `loading.tsx` (decision 02-05; note `src/app/shop/loading.tsx` exists only for /shop).

### `src/components/catalogue/CataloguePage.tsx` (mod: `lockedSort`)

**Analog:** itself. Mirror how `brand` is threaded.

Signature and brand lock (lines 23-34):
```typescript
export async function CataloguePage({ raw, basePath, title, back, brand }: {
    raw: RawParams; basePath: string; title: string; back?: {...}; brand?: string;
}) {
    const [fullFilters, store] = await Promise.all([getFilters(), getStore()]);
    const filters = brand ? { ...fullFilters, brand: [] } : fullFilters;
    const query = parseCatalogueQuery(raw, filters);
    const apiQuery = brand ? { ...query, lists: { ...query.lists, brand: [brand] } } : query;
```
Change: add `lockedSort?: boolean`; `const query = lockedSort ? { ...parsed, sort: DEFAULT_SORT } : parsed;` (import `DEFAULT_SORT` from `@/lib/config`); at line 76 render `{!lockedSort && <SortSelect query={query} basePath={basePath} />}`. `toSearchString` omits default sort, so no `sort` param is sent. Update the doc comment (lines 18-22).

---

### `src/components/home/BrandStrip.tsx` (component, transform)

**Analog:** `src/components/brands/BrandGrid.tsx`

**Imports and logo/fallback pattern** (lines 1-5, 12-26):
```typescript
import Image from 'next/image';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';
import { BRAND_LOGOS } from '@/shop/brand-logos';
...
<Link href={ROUTES.brand(slug)} prefetch={false} className="relative flex aspect-3/2 items-center justify-center border border-stone bg-ivory ... focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
    {BRAND_LOGOS.includes(slug) ? (
        <Image src={`/brands/${slug}.svg`} alt={name} fill loading="lazy" className="object-contain p-6 mix-blend-multiply" />
    ) : (
        <span className="line-clamp-2 break-words px-4 text-center font-heading text-heading">{name}</span>
    )}
</Link>
```
Strip: same logo test (`src` only from a manifest entry), wrapped in a `<ul>` with `flex overflow-x-auto snap-x` and the scrollbar-hide classes from ItemGallery line 97 (`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`). "View all" link copies `MoreFromBrand.tsx` lines 16-24 (`min-h-11 ... text-label uppercase underline underline-offset-4`, `prefetch={false}`).

**Data section guard** (copy from `src/components/layout/Header.tsx` lines 26-38): `await connection()` is called once in `page.tsx`, outside any try/catch; each section:
```typescript
try {
    const filters = await getFilters();
    ...
} catch (error) {
    console.warn('Header: /filters failed', error);
}
```
then `if (x.length === 0) return null;` (as `MoreFromBrand.tsx` line 11).

**Test pattern:** `src/components/brands/BrandGrid.test.ts` (render with `renderToStaticMarkup(createElement(...))`, `BRAND_LOGOS[0]` as the known-logo slug, assert `src=`, `alt=`, `font-heading`, no `<img` for no logo).

---

### `src/components/home/JustDroppedCarousel.tsx` ('use client') (event-driven)

**Analog:** `src/components/item/ItemGallery.tsx`

**Header and imports** (lines 1-7): `'use client';` then `import { useEffect, useRef, useState } from 'react'; import { COPY } from '@/lib/copy'; import { cn } from '@/lib/utils';`.

**Track classes and reduced-motion scroll** (line 97, lines 54-56):
```typescript
className="relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
...
const calm = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
root.scrollTo({ left: slide.offsetLeft, behavior: smooth && calm ? 'smooth' : 'instant' });
```
**A11y region** (lines 89-94): `role="region" aria-roledescription="carousel" aria-label=...` (use `aria-labelledby` + `useId()` for the carousel per RESEARCH Pattern 4). Observers are created in `useEffect` with cleanup `return () => observer.disconnect();` (lines 29-46); for the carousel call `setState` only inside `ResizeObserver`/scroll callbacks (lint). Server renders `<ItemCard>`s as `children` (ItemGallery gets data only via props). The pure `carouselEdges(scrollLeft, clientWidth, scrollWidth)` goes in `src/lib/homeSections.ts` with a unit test. Card width classes: RESEARCH Pattern 4 (`[&>li]:basis-[calc(...)]`), since `ItemCard` renders a bare `<li>` and must not change.

Arrows use `IconButton` (`src/components/ui/buttons.tsx` lines 51-63) with `ChevronLeft`/`ChevronRight`; add `disabled:opacity-50 disabled:cursor-not-allowed` to its className on line 57, same classes as `buttonClassName` line 34.

---

### `src/components/home/JustDropped.tsx` (async RSC section) 

**Analog:** `src/components/item/MoreFromBrand.tsx` (header with heading + "View all", `ItemGrid`/cards, `return null` when empty, lines 9-30) combined with the Header try/catch above.

Read: `(await getItemsPage('')).page.items.slice(0, HOME.carouselItems)` (same cache key as /shop page 1, `src/lib/howmany/client.ts` lines 72-77). Do not re-sort. One clock: `// eslint-disable-next-line react-hooks/purity` then `const now = Date.now();` as `CataloguePage.tsx` lines 45-46. Render cards with `ItemCard` from `src/components/catalogue/ItemCard.tsx` (read it before planning; not extracted here).

---

### `src/components/home/{HeroBanner,PromoBanners,CategoryTiles,StoryBand}.tsx` and `src/components/pages/*`

**Analogs:** `Footer.tsx` and `BrandGrid.tsx`.

**Shop-value reads and external links** (`Footer.tsx` lines 43-58) -- contact page must copy this, never type values (D-15):
```typescript
<a href={`mailto:${SHOP.contact.email}`} className={link}>{SHOP.contact.email}</a>
{SHOP.platforms.map(platform => (
    <li key={platform.name}>
        <a href={platform.url} target="_blank" rel="noopener noreferrer" className={link}>
            {platform.name}
            <span className="sr-only"> {COPY.common.opensInNewTab}</span>
        </a>
    </li>
))}
```
Socials: `<SocialIcons links={SHOP.socials} />` (`Footer.tsx` line 30). CTAs: `ButtonLink` (`buttons.tsx` lines 45-49; `external` for off-site). Paths via `ROUTES`; tile href `` `${ROUTES.shop}?${new URLSearchParams({ type })}` `` as `Header.tsx` line 20 `typeHref`. Hero image: `next/image` with `loading="eager" fetchPriority="high"` (NOT `priority`, deprecated in Next 16), copy ItemGallery line 121:
```typescript
{...(i === 0 ? { loading: 'eager' as const, fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
```
Lifestyle images are `/images/<fixed name>` plain src (images are `unoptimized`). Brand text strings come from `SHOP.home` / `SHOP.about`, generic labels from `COPY`.

---

### `src/app/about/page.tsx`, `src/app/contact/page.tsx`

**Analog:** `src/app/brands/page.tsx` (lines 1-23). Static metadata plus layout skeleton:
```typescript
export const metadata: Metadata = { title: COPY.nav.brands };
export default async function BrandsPage() {
    ...
    return (
        <main>
            <CatalogueBanner title={COPY.nav.brands} />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-12">
```
These pages read no API, so no `connection()` needed. Switch metadata to `pageMetadata(...)` because `openGraph` is replaced, not merged (see Shared Patterns). `CatalogueBanner` (`src/components/catalogue/CatalogueBanner.tsx`) can be reused for the title band.

---

### `src/lib/homeSections.ts` (utility, transform) + `homeSections.test.ts`

**Analog:** `src/lib/brands.ts` (lines 1-22)

```typescript
// Pure and client-safe: no env, no fetch.
import { SHOP } from '@/shop/config';
export const brandSlug = (name: string): string => ...
export function brandIndex(names: string[]): { name: string; slug: string }[] {
    const collator = new Intl.Collator(SHOP.locale, { sensitivity: 'base' });
    const seen = new Set<string>();
    return names.map(name => ({ name, slug: brandSlug(name) }))
        .filter(({ slug }) => slug !== '' && !seen.has(slug) && !!seen.add(slug))
        .sort((a, b) => collator.compare(a.name, b.name));
}
```
`stripBrands` should take `brandIndex(...)` output and compare slugs via `brandSlug`; `visibleTiles` and `carouselEdges` per RESEARCH Patterns 2-4. Named exports, no `server-only`. Tests colocated (`brands.test.ts` style).

---

### `src/lib/securityHeaders.ts` (utility) and `next.config.ts` (mod)

**Analog:** `next.config.ts` lines 4-13 (verbatim header values to move; make `X-Robots-Tag` conditional) and lines 2, 19-25 (remove `ROUTES` import and the `redirects()` block). New file must have no imports (next.config cannot resolve `@/` aliases; it imports relatively, see line 2 `./src/lib/routes`). Use `import { isIndexingOn } from './src/lib/indexing'` and `import { securityHeaders } from './src/lib/securityHeaders'` with relative paths.

---

### `src/lib/seo.ts` (mod) and `seo.test.ts`

**Analog:** itself (lines 1-22). Delete `SITE_INDEXABLE` (line 7); change signature to `listingRobots(query, indexable: boolean)`:
```typescript
if (hasFilters(query) || query.sort !== DEFAULT_SORT) return { index: false, follow: true };
return { index: indexable, follow: indexable };
```
Add `pageMetadata({ siteUrl, path, title, description, image })` next to `canonicalUrl` (RESEARCH Pattern 6). Update callers: `src/app/shop/page.tsx`, `src/app/brands/[slug]/page.tsx` line 28. In `seo.test.ts` the first test (lines 13-17) becomes a table with `indexable` true/false; keep the `query()` factory (lines 6-10) for new tests.

---

### `src/lib/env.ts` (mod) and `env.test.ts`

**Analog:** itself. Add to `storeSchema` (after line 16), following the `msg()` helper (line 9):
```typescript
ALLOW_INDEXING: z.enum(['true', 'false'], msg('must be true or false')).optional().transform(isIndexingOn),
```
`msg()` yields "missing" for undefined input; because `.optional()` is used absent is allowed. In `env.test.ts`, `setEnv` (lines 11-16) only clears keys in `valid`; add `ALLOW_INDEXING` to the cleared set explicitly (e.g. clear in `setEnv`) so it does not leak between tests. Error list format at lines 28-31 is already shared.

---

### `src/lib/howmany/client.ts` (mod: `getItemsPage(search, limit = CATALOGUE.pageSize)`)

**Analog:** itself lines 68-77. Note the `cache()` key is argument identity: passing `limit` as a second primitive argument keeps the key stable. Replace `String(CATALOGUE.pageSize)` with `String(limit)`. Add `CATALOGUE.sitemapPageSize = 100` in `src/lib/config.ts`. Extend `client.test.ts`.

---

### `src/app/robots.ts`, `src/app/sitemap.ts`

**Analog:** `src/app/brands/page.tsx` line 13 (`await connection();` with the comment "Reads the API, so it renders per request and never at build"). Both start with `await connection();` outside any try/catch, then read `storeEnv()`. Full bodies in RESEARCH Pattern 9. The URL builder (`src/lib/sitemap.ts`) uses `new URL(ROUTES.item(code), siteUrl).toString()` (`ROUTES.item` encodes with `encodeURIComponent`, `src/lib/routes.ts` line 6) and `ROUTES.brand(slug)`; unit test an item code `A&B<1>`.

---

### `src/app/layout.tsx` (mod)

**Analog:** itself lines 8-12. Replace the static `metadata` export with `export async function generateMetadata(): Promise<Metadata>` returning `title: { default: SHOP.name, template: `%s | ${SHOP.name}` }` and `robots: storeEnv().ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false }`. Remove the "SEO-03 (Phase 4)" comment. The layout currently never calls `storeEnv()`; the Header already calls `connection()`, so reading env at request time is consistent.

---

### `src/shop/config.ts` (mod)

**Analog:** itself. Keep the `SHOP` literal style: trailing `// PENDING-OWNER (D-05): ...` comments (lines 14-18), `as` casts for nullable types (lines 12, 26), JSDoc per field. Change line 28 `newBadgeDays: 7` to 14 and update the doc comment ("within this many days", D-21 -> D-11). Add `home` (hero/banner/story strings, `categories: [{ type, label, image }]`, up to 4), `about`, `seo` (`homeTitle`), `defaultBrandOrder: [...]` marked PENDING-OWNER. No em dashes (`copy.test.ts` scans `SHOP`). Fixed image filenames live here as `'/images/hero.jpg'`-style or bare names, and a test verifies each exists in `public/images/` (analog: `src/lib/brands.test.ts`; read it for the file-system assertion shape).

---

### `src/lib/routes.ts` cleanup (D-20)

Delete lines 14-15 (`BUILT_PAGES`). Then `isBuilt` in `src/lib/utils.ts` and its `describe('isBuilt')` in `src/lib/utils.test.ts`; `Footer.tsx` line 7 import and line 37 `.filter(item => isBuilt(item.href))`; `MobileMenu.tsx` `link()` (`isBuilt(href) &&`); `NavLink.tsx` early `return null`. Delete the `redirects()` block from `next.config.ts`.

## Shared Patterns

### Dynamic rendering for anything that reads env or API
**Source:** `src/app/brands/page.tsx` line 13, `src/components/layout/Header.tsx` lines 26-27
```typescript
// Outside the try: the dynamic-usage signal must not be swallowed, or the build would call the API (Pitfall 2)
await connection();
```
**Apply to:** home page, `/just-dropped`, `robots.ts`, `sitemap.ts`. Never inside a try/catch. CI asserts zero API calls at build.

### Guarded read that hides its section
**Source:** `Header.tsx` lines 29-38 plus `MoreFromBrand.tsx` line 11 (`if (others.length === 0) return null;`)
**Apply to:** BrandStrip, JustDropped carousel, CategoryTiles. One `console.warn` per catch (keeps the CI "no ERROR" log check green).

### Metadata (shallow merge)
**Source:** `src/lib/seo.ts` `canonicalUrl` (lines 19-22); new `pageMetadata` sits beside it.
`SITE_URL` is read per call via `storeEnv().SITE_URL`, never at module scope (see `brands/[slug]/page.tsx` line 29).
**Apply to:** home, `/shop`, `/brands`, `/brands/[slug]`, `/just-dropped`, `/about`, `/contact`, `/items/[code]`. Any page that sets `openGraph` must go through `pageMetadata` or the layout's OG image is dropped.

### Shop strings and generic copy
**Source:** `Footer.tsx` lines 1-9 (imports: `COPY` from `@/lib/copy`, `SHOP` from `@/shop/config`, `ROUTES`)
Generic labels in `COPY`, Blacktail's own words in `SHOP.*`; `src/lib/shop-guard.test.ts` fails if a SHOP value appears elsewhere in `src` (add only long sentences and filenames as needles, not short phrases that equal `COPY` text). No em dashes.

### External links
**Source:** `Footer.tsx` lines 49-56 and `buttons.tsx` line 47: `target="_blank" rel="noopener noreferrer"` plus `COPY.common.opensInNewTab` sr-only text.

### Style conventions
4-space indent, single quotes, named exports, colocated `*.test.ts`, `prefetch={false}` on `Link`, Tailwind tokens (`text-label uppercase`, `font-heading text-heading`, `border-stone`, `bg-ivory`, `text-olive`), `cn` from `@/lib/utils` for class merging.

### Component test shape
**Source:** `src/components/brands/BrandGrid.test.ts` lines 1-8: `renderToStaticMarkup(createElement(Component, props))`, vitest, `server-only` mocked in `src/test/setup.ts`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `public/images/*.jpg` | asset | n/a | Binary; generate with a scratch sharp script per RESEARCH "Placeholder generation" (not committed) |
| `docs/ONBOARDING.md` | docs | n/a | No existing doc of this kind; follow RESEARCH Pattern 10 outline and `README.md` / `wrangler.jsonc` as sources |
| `.env.example`, `wrangler.jsonc` (`workers_dev: false`), `.github/workflows/{ci,deploy-workers}.yml`, `scripts/mock-howmany.mjs` | config | n/a | Edit in place per RESEARCH "Test notes" and Pitfalls 1 and 10; not read here (outside `src/`), planner should open them before writing tasks |

## Metadata

**Analog search scope:** all of `src/` (git ls-files, 100+ files), `next.config.ts`
**Files read in full:** CONTEXT, RESEARCH, `brands/[slug]/page.tsx`, `brands/page.tsx`, `layout.tsx`, `CataloguePage.tsx`, `seo.ts`, `seo.test.ts`, `BrandGrid.tsx` and test, `ItemGallery.tsx`, `MoreFromBrand.tsx`, `Footer.tsx`, `buttons.tsx`, `brands.ts`, `env.ts`, `routes.ts`, `shop/config.ts`, `next.config.ts`; partial: `env.test.ts`, `client.ts`, `Header.tsx`
**Not read (planner should open before tasks):** `ItemCard.tsx`, `ItemGrid.tsx`, `CatalogueBanner.tsx`, `MobileMenu.tsx`, `NavLink.tsx`, `utils.ts`, `shop/page.tsx`, `items/[code]/page.tsx`, `copy.ts`, `shop-guard.test.ts`, `brands.test.ts`
**Pattern extraction date:** 2026-11-03
