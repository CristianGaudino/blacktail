# Phase 5: Sold Item Pages and Listing Links - Pattern Map

**Mapped:** 2026-11-06
**Files analyzed:** 17 (1 new component, 1 new function, rest modified)
**Analogs found:** 17 / 17 (all are the file itself or a tracked sibling in `src/`; verified tracked via `git ls-files`)

Most work edits files that already exist, so the "analog" is usually the file's own current code plus a sibling for the new bit. Paths are relative to `C:/Git/blacktail`.

## File Classification

| File | Role | Data Flow | Closest Analog | Match |
|------|------|-----------|----------------|-------|
| `src/lib/howmany/schemas.ts` (add `itemDetailSchema`) | model | transform | same file `itemSchema`, `filtersSchema` (lenient `.default`) | exact |
| `src/lib/definitions.ts` (`ItemDetail`) | model | - | line 8 `Item` | exact |
| `src/lib/howmany/client.ts` (`getItem`) | service | request-response | same file `getItem` | exact |
| `src/lib/dates.ts` (`formatDay`) | utility | transform | `src/lib/money.ts` `formatMoney` (SHOP.locale Intl) | role-match |
| `src/lib/copy.ts` | config | - | same file `item`, `seo`, `gone` blocks | exact |
| `src/app/items/[code]/page.tsx` | route (page) | request-response | same file; robots from `src/app/shop/page.tsx:16-19` | exact |
| `src/app/items/[code]/not-found.tsx` | route | request-response | comment-only edit | exact |
| `src/components/item/WhereToBuy.tsx` | component | request-response | same file | exact |
| `src/components/item/SoldNotice.tsx` (new) | component | request-response | `WhereToBuy.tsx` (panel + `ButtonLink`) | exact |
| `src/components/item/ItemJsonLd.tsx` | component | transform | same file | exact |
| `src/components/item/ItemGallery.tsx` (`soldLabel`) | component (client) | event-driven | `src/components/catalogue/ItemCard.tsx:30` New badge | role-match |
| `scripts/mock-howmany.mjs` | utility | request-response | same file (`gone` set, line 26-29, 145, 166) | exact |
| `scripts/prove-freshness.mjs` | test (proof) | request-response | same file `item-gone` check (176-199) | exact |
| `.github/workflows/ci.yml` | config | - | same file "Item and brand pages on the Worker" step | exact |
| `src/lib/howmany/client.test.ts` | test | - | same file lines 123-141 | exact |
| `src/components/item/ItemInfo.test.ts` | test | - | same file (`renderToStaticMarkup(createElement(...))`) | exact |
| `src/lib/dates.test.ts` | test | - | same file (`describe('isNew')`) | exact |

## Pattern Assignments

### `src/lib/howmany/schemas.ts` (model, transform)

**Analog:** same file. Keep `itemSchema` untouched (list reads stay strict). Add after it (RESEARCH Pattern 1, verified against zod 4.6.7):

```ts
const listingSchema = z.object({ platform: z.string(), url: z.url({ protocol: /^https$/ }) });
// One bad entry is dropped, not fatal (D-11); a non-array becomes []
const listings = z.array(z.unknown()).catch([]).transform(list =>
    list.flatMap(entry => { const r = listingSchema.safeParse(entry); return r.success ? [r.data] : []; }));

export const itemDetailSchema = itemSchema.extend({
    priceCents: z.number().int().nullable(),   // null only for a sold piece never priced
    listings,
    soldAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().catch(null),  // day key, not a timestamp
});
```

Existing lenient style to match (lines 54-55): `z.array(...).default([])`, `.nullable().default(null)`, comments explain why.

### `src/lib/definitions.ts`

Line 8 today: `export type Item = z.output<typeof itemSchema>;`. Add `export type ItemDetail = z.output<typeof itemDetailSchema>;` and extend the schemas import.

### `src/lib/howmany/client.ts` (service, request-response)

**Imports** (line 7): add `itemDetailSchema` to `import { filtersSchema, itemSchema, itemsPageSchema, storeSchema } from '@/lib/howmany/schemas';` and `ItemDetail` to the definitions type import (line 5).

**Change** (lines 51-65): replace doc comment (drop "or the API says it is sold") and the body:

```ts
export const getItem = cache(async (code: string): Promise<ItemDetail | null> => {
    if (!ITEM_CODE.test(code)) return null;
    try {
        return (await howmanyFetch(`/items/${encodeURIComponent(code)}`, itemDetailSchema)).data;
    } catch (error) {
        if (error instanceof HowManyError && error.status === 404) return null;
        throw error;
    }
});
```

Remove `return item.status === 'sold' ? null : item;`. The 404-only-null and rethrow stay (D-06).

### `src/lib/dates.ts` (utility)

**Analog:** `src/lib/money.ts` lines 1, 18-25 (imports `SHOP` from `@/shop/config`, uses `SHOP.locale`). Dates.ts currently has no imports; add one.

```ts
import { SHOP } from '@/shop/config';
/** "2026-11-03" -> "3 November 2026". A day key, so UTC: any other zone could print the day before. */
export const formatDay = (dayKey: string) =>
    new Intl.DateTimeFormat(SHOP.locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${dayKey}T00:00:00Z`));
```

### `src/lib/copy.ts` (config)

**Analog:** `item` block lines 129-148 (functions as `(n: string) => \`...\``), `seo` lines 150-153, `gone` lines 163-167. Add inside `item`: `sold`, `soldOn(date)`, `soldMessage`, `buyOn(name)`, `newestDrops` (values in RESEARCH "Sold copy keys"); `seo.sold: 'Sold.'`. Reword `gone.title` to "This piece is no longer available" and `gone.body` to "It may have been removed. Here are our newest pieces.". Keep `visitOn`, `listedOn`, `whereToBuyHelp` (ContactPanel uses `visitOn`). No em dashes (`copy.test.ts` calls each function with `'2'`).

### `src/app/items/[code]/page.tsx` (route, request-response)

**Analog:** same file, plus robots pattern from `src/app/shop/page.tsx:16-19`:

```ts
return {
    ...pageMetadata({ url: ..., title: ..., description: ... }),
    robots: listingRobots(query, ALLOW_INDEXING),
};
```

For items use a literal `robots: { index: false, follow: true }` when sold (`listingRobots` takes a `CatalogueQuery`; cannot be reused).

**Edits by current line:**
- Imports (5-17): add `SoldNotice`, `formatDay` from `@/lib/dates`.
- `generateMetadata` (23-39): after `description` is built (28-32), `const sold = item.status === 'sold'`; description `sold ? \`${COPY.seo.sold} ${description}\` : description`; spread `...(sold ? { robots: { index: false, follow: true } } : {})` after `pageMetadata(...)`. Title unchanged.
- Page (46-59): `const sold = item.status === 'sold'`; guard `more`: `const more = item.brand && !sold ? await getItemsPage(...)... : null;` (lines 54-59, skips the API call). Keep the `getFilters` read for the brand link.
- Line 67: `<ItemGallery photos={item.photos} name={nameOf(item)} soldLabel={sold ? COPY.item.sold : undefined} />`.
- Lines 78-79 become:

```tsx
{sold ? (
    <>
        <p className="mt-4 font-heading text-heading">{item.soldAt ? COPY.item.soldOn(formatDay(item.soldAt)) : COPY.item.sold}</p>
        <div className="mt-6"><SoldNotice /></div>
    </>
) : (
    <>
        <p className="mt-4 font-heading text-heading tabular-nums">{formatMoney(item.priceCents!, item.currency)}</p>
        <div className="mt-6"><WhereToBuy listings={item.listings} /></div>
    </>
)}
```

`priceCents` is `number | null` now; guard instead of `!` if lint complains (e.g. `item.priceCents !== null &&`). Never call `formatMoney(null)`. Price paragraph must not render at all when sold (D-02).

### `src/components/item/WhereToBuy.tsx` (component)

**Analog:** same file (whole file, 25 lines, shown in repo). Imports already there: `ExternalLink`, `ButtonLink`, `COPY`, `SHOP`; add `import type { ItemDetail } from '@/lib/definitions';`.

Change signature to `WhereToBuy({ listings }: { listings: ItemDetail['listings'] })`. If `listings.length > 0`: same `<section className="bg-sand/40 p-6">`, intro `COPY.item.listedOn(names)` where names = de-duplicated display names through the same `new Intl.ListFormat(SHOP.locale, { type: 'conjunction' }).format(...)` (existing line 9), NO `whereToBuyHelp` line, buttons row `className="mt-4 flex flex-col flex-wrap gap-2 min-[480px]:flex-row"` (add `flex-wrap`), per listing:

```tsx
<ButtonLink key={l.url} external variant="secondary" href={l.url}>
    {COPY.item.buyOn(nameFor(l))}
    <span className="sr-only">{COPY.common.opensInNewTab}</span>
    <ExternalLink size={16} aria-hidden />
</ButtonLink>
```

```ts
const nameFor = ({ platform, url }: { platform: string; url: string }) =>
    SHOP.platforms.find(p => p.name.toLowerCase() === platform.toLowerCase())?.name
    ?? new URL(url).hostname.replace(/^www\./, '');
```

Else (empty): today's output exactly (lines 8-24 incl. `visitOn`, `return null` when `SHOP.platforms.length === 0`). API order, no sorting.

### `src/components/item/SoldNotice.tsx` (new, component)

**Analog:** `WhereToBuy.tsx` panel and buttons (above). Imports: `ButtonLink` from `@/components/ui/buttons`, `COPY`, `ROUTES` from `@/lib/routes` (`shop: '/shop'`, `justDropped: '/just-dropped'`). Server component, no `'use client'`.

```tsx
export function SoldNotice() {
    return (
        <section className="bg-sand/40 p-6">
            <p className="text-base">{COPY.item.soldMessage}</p>
            <div className="mt-4 flex flex-col gap-2 min-[480px]:flex-row">
                <ButtonLink variant="primary" href={ROUTES.shop}>{COPY.common.shopAll}</ButtonLink>
                <ButtonLink variant="secondary" href={ROUTES.justDropped}>{COPY.item.newestDrops}</ButtonLink>
            </div>
        </section>
    );
}
```

Confirm `COPY.common.shopAll` and `ButtonLink` `variant="primary"` exist (UI-SPEC cites both) before use.

### `src/components/item/ItemJsonLd.tsx` (component, transform)

**Analog:** same file. Prop type `item: ItemDetail`. Replace lines 13-16 of `offers`:

```ts
...(item.priceCents === null ? {} : { price: (item.priceCents / 100).toFixed(2) }),
priceCurrency: item.currency,
availability:  item.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
```

Keep named fields only (no `listings`, `soldAt`, code) and the `.replace(/</g, '\\u003c')` on the last line.

### `src/components/item/ItemGallery.tsx` (client component)

**Analog badge:** `src/components/catalogue/ItemCard.tsx:30`:
`<span className="absolute left-2 top-2 border border-forest bg-ivory px-2 py-1 text-label uppercase text-forest">{COPY.catalogue.newBadge}</span>`

Change line 18 signature to `{ photos, name, soldLabel }: { photos: ItemPhoto[]; name: string; soldLabel?: string }`. At line 86 the plain column wrapper `<div>` (the one after the thumbnail rail, directly before `{cover ? (`) becomes `<div className="relative">` and first child:

```tsx
{soldLabel && <span aria-hidden="true" className="pointer-events-none absolute left-2 top-2 z-10 border border-forest bg-forest px-2 py-1 text-label uppercase text-ivory">{soldLabel}</span>}
```

Not inside the scroll track (line ~89, `ref={track}`), which already has its own `relative`. `cn` is already imported in this file.

### `scripts/mock-howmany.mjs`

**Analog:** same file. `gone` state line 26, `items()` filter line 29, `/__set` handling line 144-145, item read line 166:
`found ? send(res, 200, { ...found, status: gone.includes(code) ? 'sold' : 'inStock' }, cache) : send(res, 404, ..., { 'cache-control': 'no-store' })`.

Add `let hidden = []`, accept `set.hidden` like `set.gone` (line 145), exclude hidden from `items()`/filters and make the single read a no-store 404 for hidden. Add `listings: []`, `soldAt: null` to every item; sold response sets `soldAt: '2026-11-03'`; give MOCK-0003 two listings (`ebay` then `vinted`). Update header comment lines 5 and 9-10.

### `scripts/prove-freshness.mjs`

**Analog:** `check('item-gone', ...)` lines 176-199 (warm two views at 200, `setMock`, `sleep(1200)`, `post(valid())` expect 204, `poll(...)`, reset in `finally`). Split into `item-sold` (poll for 200 whose HTML includes `Sold on 3 November 2026`, `https://schema.org/SoldOut`, `noindex`, and lacks `Buy on` and `More from`) and `item-hidden` (`setMock({ hidden: [code] })`, poll for 404 containing the new `COPY.gone.title` "This piece is no longer available"; line 188-192 string must change). Update header line 3.

### `.github/workflows/ci.yml`

**Analog:** the "Item and brand pages on the Worker" step (grep-based asserts; MOCK-0001 `https://schema.org/InStock` and `More from Mock Brand`). Add asserts: `/items/MOCK-0003` has `Buy on eBay`, `Buy on Vinted`, the exact hrefs and `target="_blank"`; MOCK-0001 still shows the profile panel. Update the comment near line 96 that says sold gives 404.

### Tests

- `src/lib/howmany/client.test.ts` lines 132-138: replace "resolves null for a sold piece" with: sold returns item with `soldAt`; `priceCents: null` + `soldAt: null` parses; `listings` with `http://`, `javascript:` and a good entry keeps only the good one; missing `listings`/`soldAt` become `[]`/`null`. Use existing `reply({ ...item, ... })` and `fetchMock.mockResolvedValue` style (lines 5-13, 123-130). 404/429/500 tests unchanged.
- `src/components/item/ItemInfo.test.ts`: line 67 `renderToStaticMarkup(createElement(WhereToBuy))` becomes `createElement(WhereToBuy, { listings: [] })` for the fallback case; add cases for two listings (hrefs, `target="_blank"`, `rel="noopener noreferrer"`, labels via `COPY.item.buyOn`), unknown platform hostname; JSON-LD sold = `SoldOut` and no `price` key when null. Fixtures of type `Item` need `listings: []`, `soldAt: null` to become `ItemDetail`. Read platform names from `SHOP.platforms[0].name`, never type them (shop-guard scans tests).
- `src/lib/dates.test.ts`: add `describe('formatDay')`: `formatDay('2026-11-03')` equals `'3 November 2026'` (SHOP.locale en-IE).

## Shared Patterns

### Shop values only from `SHOP` / `COPY`
**Source:** `src/shop/config.ts`, `src/lib/copy.ts`; enforced by `src/lib/shop-guard.test.ts` and `copy.test.ts` (no em dashes).
**Apply to:** every new string/component/test above. Platform names via `SHOP.platforms`, dates via `SHOP.locale`.

### External links
**Source:** `WhereToBuy.tsx` lines 15-19: `ButtonLink external variant="secondary"` + sr-only `COPY.common.opensInNewTab` + `<ExternalLink size={16} aria-hidden />`.
**Apply to:** per-listing buttons. Internal links (SoldNotice) omit `external`.

### One cached read, errors propagate
**Source:** `client.ts` `howmanyFetch` + `getItem` (only `HowManyError` 404 maps to null).
**Apply to:** getItem change; do not add a second fetch, tag or `try/catch` that swallows parse errors.

### Privacy / markup whitelist
**Source:** `ItemJsonLd.tsx` named-field object; `itemSchema` strips unknown keys.
**Apply to:** never render `priceCents` on a sold page, never print `listings` URL or platform code as text.

## No Analog Found

None. `SoldNotice` is new but is a direct sibling of `WhereToBuy`.

## Metadata

**Analog search scope:** `src/lib`, `src/lib/howmany`, `src/components/item`, `src/components/catalogue`, `src/app/items/[code]`, `src/app/shop`, `scripts`, `.github/workflows`
**Files scanned:** about 20 (all tracked per `git ls-files`)
**Pattern extraction date:** 2026-11-06
