# Phase 5: Sold Item Pages and Listing Links - Research

**Researched:** 2026-11-06
**Domain:** Next.js 16 App Router item page over a tagged fetch cache (OpenNext on Workers), zod 4 API parsing, schema.org JSON-LD
**Confidence:** HIGH (the API shape is verified from How many's own source and the live API; no new packages)

## Summary

This phase is a change inside code that already exists. No new package is needed. The work is: (1) widen the item schema for the detail read (`listings`, `soldAt`, and a **nullable price**), (2) stop mapping sold to `null` in `getItem`, (3) add a sold branch to `page.tsx` / `generateMetadata` / `ItemJsonLd` / gallery badge, (4) make `WhereToBuy` take the item's `listings`, (5) reword the 404 copy, (6) update the mock API, `prove-freshness.mjs` and CI so the Worker proves sold = 200 and hidden = 404 right after the webhook.

The one finding that changes the plan: **How many returns `priceCents: null` for a sold piece that never had a price, and `soldAt` can be `null` for a sold piece.** The current `itemSchema` has `priceCents: z.number().int()`, so such an item would throw a zod error and show `error.tsx`, not a Sold page. The schema must be loosened for the detail read only (list reads keep the strict price). Also `soldAt` is a **day key `YYYY-MM-DD`, not a timestamp**, so it must be formatted in UTC or the date can shift a day.

**Primary recommendation:** Add `itemDetailSchema = itemSchema.extend({ priceCents: nullable, listings: lenient https-only array, soldAt: lenient day string or null })`, return it from `getItem` unchanged (no sold-to-null mapping), branch once in `page.tsx` on `item.status === 'sold'`, and prove it on workerd by extending the mock and `prove-freshness.mjs`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**Sold page look**
- **D-01:** A small "Sold" badge sits in a corner of the cover photo (not a full overlay). Where the price was, a line "Sold on <date>" from `soldAt`.
- **D-02:** The asking price is hidden on a sold page. It is never shown as a sale price.
- **D-03:** In place of the where-to-buy panel: a short sold message from `COPY` plus a button to All Items and the newest drops link. No price call to action. "More from this brand" stays hidden.
- **D-04:** The sold date is a long date in the shop locale (`SHOP.locale`, Intl), e.g. "3 November 2026". No relative dates.

**Freshness and 404s**
- **D-05:** `getItem` stays one tagged, cached read of `/items/{code}`. The `status === 'sold'` to null mapping is removed so the page can render sold. The webhook tag refresh turns a cached copy into sold, or into a 404 for hidden or deleted, on the next request. No second cache path.
- **D-06:** Only an API 404 or a wrongly shaped code is a real 404 (with newest drops). Any other failure (429, 500) still reaches `error.tsx`, never a fake 404 or a fake Sold.
- **D-07:** Reword the `COPY.gone` 404 text to be neutral ("no longer available"), since "sold" now has its own page.

**Listing buttons**
- **D-08:** Label is "Buy on <Platform>" (user choice; replaces today's "Visit on").
- **D-09:** Platform display name is resolved by matching the listing's platform to `SHOP.platforms` by name (config owns the name). An unknown platform falls back to the hostname of its URL.
- **D-10:** Keep the sand panel. Buttons follow the API order, stacked on mobile and in a row from 480px. The "listed on ..." copy is built from the item's own listings. Empty `listings` shows today's profile-link panel from `SHOP.platforms` (LINK-02).
- **D-11:** Listing URLs are validated in the zod schema: https only. Invalid ones are dropped, and if none remain the profile fallback shows. Links use `ButtonLink external` (new tab, opens-in-new-tab sr-only text).

**Sold SEO**
- **D-12:** JSON-LD keeps the Offer with availability `https://schema.org/SoldOut` and the asking price.
- **D-13:** Title is unchanged; description is prefixed with "Sold.".
- **D-14:** Robots `noindex,follow`, canonical to itself, using the existing robots helper. The sitemap needs no change because it reads `/items`, which omits sold.

### Claude's Discretion
Exact badge size, colour and sold message wording (no em dashes), the `soldAt` and `listings` zod field shapes (confirm against the live API), and where the sold-state branch lives in `ItemDetails` and `page.tsx`.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope. (Brand strip and spotlight are Phase 6.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SOLD-01 | Sold item page 200 with photos, title, details, Sold mark with `soldAt` date | `getItem` no longer maps sold to null; schema accepts null price and day-key `soldAt`; UTC date formatting (Pitfalls 1, 2) |
| SOLD-02 | No where-to-buy, no price CTA; JSON-LD `SoldOut` | Sold branch in `page.tsx`; `ItemJsonLd` takes sold state, omits `price` when null (Patterns 2, 4) |
| SOLD-03 | `noindex`; out of sitemap, catalogue, Just Dropped, More from this brand | `robots: { index: false, follow: true }` in `generateMetadata`; lists never contain sold (verified in API source); skip the More-from read when sold (Pattern 3) |
| SOLD-04 | Hidden/deleted/unknown/wrong-shape stays real 404 with newest drops, incl. right after webhook | 404 path unchanged in `getItem` and `notFound()`; extend the mock with a `hidden` set and `prove-freshness.mjs` (Pattern 6) |
| LINK-01 | One button per listing, platform name from config, new tab | `WhereToBuy` takes `listings`; name match by `SHOP.platforms`; `ButtonLink external` (Pattern 5) |
| LINK-02 | Empty `listings` falls back to profile links as today | Keep current profile panel when the (filtered) list is empty |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Data only through the How many public API; every read through `src/lib/howmany/client.ts` with the `store:<slug>` tag and `revalidate: 600`. No second cache path, no `unstable_cache`, no `'use cache'`.
- No shop-specific values in components: platform names come from `SHOP.platforms`, locale from `SHOP.locale`, words from `COPY`. `src/lib/shop-guard.test.ts` fails if a shop value (name, email, platform URLs, long SHOP sentences) appears in any `.ts/.tsx/.css` under `src` outside `src/shop` (test files are scanned too).
- Privacy: show only what the API returns; never print `details` wholesale (existing rule); never derive a sale price.
- No em dashes in copy (`copy.test.ts` enforces it for `COPY` and `SHOP`).
- Style: 4 spaces, single quotes. Match Vintage conventions.
- Git: branch + PR only, never commit to `main`, never merge.
- No `middleware`/`proxy`, no edge runtime, no `revalidatePath`.
- Windows cannot build OpenNext: the Worker proof runs only in CI (Linux). Locally: `npm test`, `npm run lint`, `npm run typecheck`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sold vs in stock vs 404 decision | Frontend Server (SSR, `page.tsx`) | API (How many owns status) | Page renders per request over the tagged fetch cache; status comes from the API |
| Freshness after a stock change | API/Backend (webhook route) | Database/Storage (D1 tag cache, R2 fetch cache) | Existing `revalidateTag(tag, { expire: 0 })`; nothing new |
| Listing URL validation (https only) | Frontend Server (zod in `schemas.ts`) | -- | Trust boundary: API data parsed once, bad URLs dropped before any component sees them |
| Platform display name | Frontend Server (component reads `SHOP`) | -- | Config owns names (D-09) |
| Sold date formatting | Frontend Server (`Intl`, `SHOP.locale`) | -- | Server-rendered text, no client JS |
| Sold badge on cover photo | Browser (inside client `ItemGallery`) | Frontend Server (passes label) | The cover box lives in the client gallery component |
| Noindex / canonical / JSON-LD | Frontend Server (`generateMetadata`, `ItemJsonLd`) | -- | Rendered HTML |
| Sitemap/list exclusion of sold | API (never returns sold in lists) | -- | Verified in API source; no Blacktail change |

## Standard Stack

No new dependencies. Everything below is already installed and used.

| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| zod | 4.6.7 (installed) | Detail schema, https-only `listings` | `z.url({ protocol: /^https$/ })` verified below |
| next | 16.4.1 | `generateMetadata` `robots`, `notFound()` | existing |
| lucide-react | existing | `ExternalLink` icon on listing buttons | existing in `WhereToBuy` |
| vitest | ^5.0.5 | Unit tests (`renderToStaticMarkup`, mocked `fetch`) | existing pattern |

**Package Legitimacy Audit:** No external packages are installed in this phase. Not applicable.

## Architecture Patterns

### Data flow

```
GET /items/[code]
  |
  v
page.tsx (await connection()) --> getItem(code)  [React cache(), tag store:<slug>, revalidate 600]
  |                                   |
  |                          code shape bad --> null
  |                          API 404         --> null
  |                          429/500/parse   --> throws --> error.tsx
  |                          200             --> ItemDetail (status inStock | sold)
  v
null --> notFound() --> items/[code]/not-found.tsx (real 404 + newest drops)
  |
  +-- status 'sold'  --> badge on cover, "Sold on <date>", SoldNotice (message + All Items), details,
  |                      NO WhereToBuy, NO MoreFromBrand read, JSON-LD SoldOut, robots noindex,follow
  +-- otherwise      --> price, WhereToBuy(listings) [buttons | profile fallback], details, MoreFromBrand,
                         JSON-LD InStock

Webhook POST -> revalidateTag('store:<slug>', { expire: 0 }) -> next getItem refetches:
   cached 200 inStock --> now 200 sold  (page flips to Sold)
   cached 200 inStock --> now 404       (hidden/deleted: page flips to 404)
```

### Recommended file touch list

```
src/lib/howmany/schemas.ts      itemDetailSchema (+ listingsSchema, soldAt)
src/lib/definitions.ts          export type ItemDetail
src/lib/howmany/client.ts       getItem returns ItemDetail, drop the sold -> null line, fix doc comment
src/lib/dates.ts                formatDay(dayKey) (UTC, SHOP.locale)
src/lib/copy.ts                 item.sold/soldOn/soldMessage/buyOn/..., seo.sold, gone.* neutral
src/app/items/[code]/page.tsx   sold branch, robots, description prefix, skip More-from read
src/app/items/[code]/not-found.tsx  comment only
src/components/item/WhereToBuy.tsx  takes listings
src/components/item/SoldNotice.tsx  new (message + ButtonLink to shop + newest drops link)
src/components/item/ItemJsonLd.tsx  availability + optional price
src/components/item/ItemGallery.tsx optional badge prop
scripts/mock-howmany.mjs, scripts/prove-freshness.mjs, .github/workflows/ci.yml
tests: client.test.ts, ItemInfo.test.ts (+ new cases), dates test, schemas test
```

### Pattern 1: Detail schema (lenient where the API is lenient, strict at the trust boundary)

Verified API facts (How many source, `C:\Git\vintage\src\lib\definitions.ts:893-919`, quoted verbatim):

```ts
    /** `sold` only from /items/{code}, which keeps answering for a sold piece; the list never has one */
    status:       'inStock' | 'sold';
    /** The asking price; null only for a sold piece that never had one */
    priceCents:   number | null;
    /** Links to its listing on each platform it is listed on, as `{ platform, url }` (platform: a lowercase code like `vinted` or `ebay`; url: https). Empty when it has none, and for a sold piece. */
    listings:     { platform: string; url: string }[];
    /** The seller chose this piece to show first */
    spotlight:    boolean;
    /** `sold` only: the day it sold, `YYYY-MM-DD` in the seller's time zone. Nothing else about the sale is given. */
    soldAt:       string | null;
```

[VERIFIED: C:\Git\vintage\src\lib\definitions.ts:893-919, main at 3aca171, PR #429 "Store API: listing links, sold date, sold-before brands, spotlight"]. The live API already serves the fields [VERIFIED: curl https://www.checkhowmany.com/api/v1/stores/blacktail-archive/items/SR-0177 on 2026-11-06 returned keys `status,code,...,priceCents,currency,photos,listings,spotlight,soldAt,publishedAt`, with `status` "inStock", `listings` `[]`, `soldAt` null]. At research time the live store had no item with listings and no sold item, so the non-empty shapes come from the source above, not from a live sample.

How the API builds them (`C:\Git\vintage\src\lib\db\data\store.ts`):
- `listings: row.status === 'listed' ? links.get(row.id) ?? [] : []` (line 88). Ordered `asc(listings.platform)` (line 106), so "API order" is alphabetical by platform code (ebay before vinted). Only built-in platform codes except `in_person` (line 109): `BUILT_IN_PLATFORMS = ['vinted','ebay','facebook','in_person','depop','etsy','vestiaire','grailed','leboncoin','donedeal','wallapop','kleinanzeigen','marktplaats','subito']` [VERIFIED: C:\Git\vintage\src\lib\config.ts:416-419]. The API already filters to https (line 98 comment).
- `soldAt` = `inZone(store.timeZone).dayKeyOf(sale.soldAt)` or `null` when the item is sold but has no un-returned sale (lines 256-261). So a sold item with `soldAt: null` is a real case.
- A sold item is only returned if it was chosen for the store and is in `SOLD_STATUSES = ['sold','posted']` [VERIFIED: C:\Git\vintage\src\lib\config.ts:176]; its photos may be empty (the `showing()` photo check does not apply to sold, store.ts:268), so a sold page can have zero photos.
- The item list (`/items`) uses `showing()` only (in stock), so sold items never appear in `/items`, hence not in the sitemap, All Items, Just Dropped, More from this brand, or the 404 drops [VERIFIED: store.ts:56-65 and the definitions comment "the list never has one"].

Recommended schema (verified behaviour of `z.url({ protocol })` in installed zod 4.6.7: `https://...` true; `http://a.com` false; `javascript:alert(1)` false; `https://` false; `HTTPS://A.COM/x` true; `not a url` false [VERIFIED: ran in node against installed zod]):

```ts
// schemas.ts
const listingSchema = z.object({ platform: z.string(), url: z.url({ protocol: /^https$/ }) });
// One bad entry is dropped, not fatal (D-11); a non-array becomes []
const listings = z.array(z.unknown()).catch([]).transform(list =>
    list.flatMap(entry => { const r = listingSchema.safeParse(entry); return r.success ? [r.data] : []; }));

export const itemDetailSchema = itemSchema.extend({
    // null only for a sold piece that never had a price; the list keeps the strict number
    priceCents: z.number().int().nullable(),
    listings,
    // A day key, not a timestamp. A malformed value becomes null rather than an error page.
    soldAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().catch(null),
});
```

`.catch([])` on `listings` and `.catch(null)` on `soldAt` also cover an older API without the field (undefined → default). `Item` (list) stays untouched, so list fixtures need no change. Add `export type ItemDetail = z.output<typeof itemDetailSchema>` in `definitions.ts`. `Item` is assignable to `ItemDetail`'s price type, but not to the whole type (missing `listings`/`soldAt`), so test fixtures that render item components get `listings: []`, `soldAt: null` added.

Note: the live API returns `brand: ""` (empty string, not null) for the live item [VERIFIED: live curl, brand printed empty]; `page.tsx` already guards with `item.brand &&`, and `nameOf` filters falsy. Keep that.

### Pattern 2: getItem

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

Update the doc comment (it still says null for sold). `getItem` tests: the "resolves null for a sold piece" test becomes "returns a sold piece with soldAt and no listings".

### Pattern 3: page.tsx sold branch

- `const sold = item.status === 'sold'` (a plain string compare, like the API codes elsewhere).
- Skip `getItemsPage` (More from brand) when sold: saves an API call and honours D-03. Keep the `getFilters` read only for the brand link (brand link on a sold page is fine; it goes to a brand page that shows in-stock items).
- Right column when sold: brand, h1, `<p>` "Sold on 3 November 2026" (or just "Sold" when `soldAt` is null), `<SoldNotice />` instead of `<WhereToBuy />`, then `ItemDetails` unchanged. The price paragraph is not rendered at all (D-02).
- `generateMetadata`: for sold add `robots: { index: false, follow: true }` after `pageMetadata(...)` (same pattern as `src/app/shop/page.tsx:17-18`: spread `pageMetadata`, then set `robots`). `listingRobots` takes a `CatalogueQuery` and cannot be reused for an item; the "existing robots helper" in D-14 means the `robots` metadata field and the same `{ index: false, follow: true }` value it returns for filtered listings. Description: `COPY.seo.sold + ' ' + description` giving "Sold. Brand Title. Size L. Condition A." Title unchanged. Canonical stays `itemUrl(item.code)` from `pageMetadata`.
- Layout default is `{ index: false, follow: false }` while `ALLOW_INDEXING` is off, so the page-level `follow: true` is a deliberate override, same as filtered `/shop` URLs (the CI comment at ci.yml:86-87 notes the X-Robots-Tag header then still says nofollow). Fine.

### Pattern 4: JSON-LD

`ItemJsonLd` gets the item as `ItemDetail`: `availability: item.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock'`, and `...(item.priceCents === null ? {} : { price: (item.priceCents / 100).toFixed(2) })` with `priceCurrency` kept. Keep the `.replace(/</g, '\\u003c')` escaping. Keep named fields only (no `listings`, no `soldAt`, no code).

### Pattern 5: WhereToBuy

```tsx
export function WhereToBuy({ listings }: { listings: ItemDetail['listings'] }) {
    if (listings.length > 0) { /* buttons: COPY.item.buyOn(nameFor(l)) with ButtonLink external variant="secondary" */ }
    /* else: today's profile panel, unchanged */
}
const nameFor = ({ platform, url }) =>
    SHOP.platforms.find(p => p.name.toLowerCase() === platform.toLowerCase())?.name
    ?? new URL(url).hostname.replace(/^www\./, '');
```

- API codes are lowercase codes (`vinted`, `ebay`, `depop`, ...), so the match must be case-insensitive: config name `eBay` must match code `ebay`. A code like `vestiaire` only matches if the config name is exactly "Vestiaire" (D-09's accepted limit); otherwise the hostname (`vestiairecollective.com`) shows. `new URL(url)` cannot throw here because the schema already proved it is a valid https URL. `www.` stripping is optional polish within Claude's discretion.
- Keep the existing markup: `ButtonLink external variant="secondary"`, the sr-only `COPY.common.opensInNewTab`, `ExternalLink` icon, `flex flex-col gap-2 min-[480px]:flex-row`, in API order (do not sort).
- `listedOn(names)` uses `Intl.ListFormat(SHOP.locale)` over the item's own display names. `COPY.item.whereToBuyHelp` ("Find this piece in our shop on each platform.") is about the profile fallback; for exact listings use a different help line or none (copy in discretion).
- Fallback (empty or all-invalid listings) is exactly today's output, including the `visitOn` label. **Interpretation to confirm:** D-08 says "Buy on" "replaces today's Visit on", but LINK-02 says the fallback is "as today" and the profile links are not a purchase link for this piece. Recommend: `buyOn` only for per-item listing buttons; keep `COPY.item.visitOn` for the fallback panel and for `ContactPanel` (`src/components/pages/ContactPanel.tsx:29` and its test also use `visitOn`, so the key must stay).
- If `SHOP.platforms` is empty and there are no listings, return `null` as today.

### Pattern 6: Sold notice and badge

- `SoldNotice`: sand panel like `WhereToBuy` for visual consistency, `COPY.item.soldMessage` (short, no em dash), `ButtonLink` to `ROUTES.shop` with `COPY.common.shopAll`, and a text link to the newest drops. "Newest drops link": `ROUTES.justDropped` exists (`src/lib/routes.ts`); use it with the existing `COPY.nav.justDropped` text or a new `COPY.item.newestDrops`. No external link, no price.
- Badge: `ItemGallery` is a client component fed only `photos` and `name` (deliberately, to keep `details` out of the RSC payload). Add an optional `soldLabel?: string` prop (a string, serialisable). Render `<span className="pointer-events-none absolute left-2 top-2 z-10 ...">` inside the `<div>` at line 87 (the column wrapper that contains the track), and add `relative` to that wrapper. Do **not** put it inside the scrolling track (it would scroll away with the slides). `pointer-events-none` keeps the photo click (lightbox) working. The `New` badge style on cards (`absolute left-2 top-2 border border-forest bg-ivory px-2 py-1 text-label uppercase text-forest`, `ItemCard.tsx:30`) is the sibling pattern; the Sold badge can invert it (`bg-forest text-ivory`) so it reads as stronger. Mark the badge `aria-hidden` and let the "Sold on ..." paragraph carry the meaning for screen readers (avoids reading Sold twice). With zero photos the gallery renders a placeholder box; the badge still shows in its corner.

### Pattern 7: Date formatting

`soldAt` is a day key, so format it as a calendar date in UTC:

```ts
// dates.ts (SHOP.locale as money.ts does)
export const formatDay = (dayKey: string) =>
    new Intl.DateTimeFormat(SHOP.locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${dayKey}T00:00:00Z`));
```

[VERIFIED: ran in node: `en-IE` `dateStyle: 'long'` `timeZone: 'UTC'` of `2026-11-03` prints `3 November 2026`]. Without `timeZone: 'UTC'` a server in a negative-offset zone would print 2 November. The Worker runs UTC, but the unit test runs wherever; pinning UTC makes both correct. Also pin it on workerd in CI (the repo already pins money as `€12.50` for the same ICU reason, ci.yml:93-95): grep the sold mock page for `3 November 2026`.

### Anti-Patterns to Avoid

- **Treating `soldAt` as an ISO timestamp** (`new Date(soldAt)` in local time shifts the day).
- **Keeping `priceCents: z.number().int()` for the detail read**: a priceless sold piece becomes a 500/`error.tsx`, the exact fake-failure D-06 forbids.
- **Hiding sold behind `item.status === 'sold' ? null`**: the line to remove; also remove `Item | null` typing that implied it.
- **Catching parse errors to return null**: a schema failure must stay an error (D-06), never a fake 404.
- **A second fetch for sold items or a different tag**: D-05 forbids.
- **Rendering the badge in the scroll track or without `pointer-events-none`.**
- **Using `listings` for anything other than href + name** (no platform code shown, no raw URL printed).
- **Reusing `COPY.gone` on the sold page**: it is the 404 text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| https-only URL check | regex on `url` | `z.url({ protocol: /^https$/ })` in the schema | `new URL()` alone accepts `javascript:`; verified the zod option rejects it |
| Date formatting | manual month names | `Intl.DateTimeFormat(SHOP.locale, { dateStyle: 'long', timeZone: 'UTC' })` | locale-correct, matches `formatMoney`'s approach |
| List of platform names | string concat | `Intl.ListFormat(SHOP.locale)` (already used) | "Vinted and eBay" per locale |
| External link | raw `<a target=_blank>` | `ButtonLink external` | already sets `rel="noopener noreferrer"` |
| Revalidation of sold state | new cache, `revalidatePath`, `unstable_cache` | existing tagged fetch + webhook `{ expire: 0 }` | D-05; CLAUDE.md "What NOT to use" |

## Common Pitfalls

### Pitfall 1: Null price on a sold item throws at parse
**What goes wrong:** `/items/{code}` for a sold piece that never had a list price has `priceCents: null`; the strict schema throws, `error.tsx` shows.
**Why:** The API comment says "null only for a sold piece that never had one".
**Avoid:** Nullable price in `itemDetailSchema` only; never format a null price (`formatMoney(null)` would print `NaN`); omit `price` from JSON-LD when null.
**Warning signs:** Sold page works in tests with a price but a priceless fixture 500s. Add a priceless sold fixture.

### Pitfall 2: `soldAt` is a day, and can be null
**What goes wrong:** Date shifts by a day; or "Sold on null" / "Invalid Date".
**Avoid:** UTC formatting of the day key; when `soldAt` is null render only "Sold" (separate copy key, e.g. `COPY.item.sold`); regex-guard the field with `.catch(null)`.

### Pitfall 3: A sold item can have no photos
**What goes wrong:** Gallery, OG image, JSON-LD image assume a cover.
**Avoid:** Existing code already handles `photos: []` (placeholder box, `image` omitted, default OG image); keep it, add a sold-with-no-photos test.

### Pitfall 4: Wrong-status 404 right after the webhook (SOLD-04)
**What goes wrong:** A cached 200 for a now-hidden item still renders.
**Why:** The webhook only expires the tag; the next read refetches. With `{ expire: 0 }` that read is blocking, so it is correct. A 404 from the API is `no-store` and never cached, so a 404 never sticks. This already works (v1.0 proved it for sold); the proof script must now prove sold = 200 and hidden = 404 separately (Pattern 8).
**Warning signs:** `prove-freshness.mjs` still expecting a sold item to 404.

### Pitfall 5: Listing platform name case and config mismatch
**What goes wrong:** Code `ebay` does not equal config name `eBay`, so the button shows `www.ebay.ie`.
**Avoid:** Case-insensitive compare (above). Test with codes `ebay`, `vinted`, an unknown `depop`.

### Pitfall 6: Shop-guard hits from new tests
**What goes wrong:** A test fixture uses a platform profile URL or "Blacktail Archive" literally; `shop-guard.test.ts` fails (test files are scanned).
**Avoid:** Fixture listing URLs like `https://www.vinted.ie/items/123-coat` do not contain the full profile URL needle, but never paste a `SHOP.platforms[].url`; import `SHOP` and read `SHOP.platforms[0].name` instead of typing the name.

### Pitfall 7: Stale references to "sold = 404"
Text that must change so docs stay true: `client.ts` doc comment (lines 51-56), `schemas.ts` status comment (line 38 is still accurate; extend it), `not-found.tsx` doc comment ("A sold, hidden or unknown piece"), `scripts/mock-howmany.mjs` header ("a piece in `gone` is a 200 with status sold" is already right), `ci.yml` comment at line 96 and `prove-freshness.mjs` line 188 (`COPY.gone.title`). `COPY.gone.title` ("This piece has found a new home") and `body` ("It has sold or is no longer available") both imply sold; D-07 asks for neutral wording. Change both title and body (e.g. "This piece is no longer available" / "It may have been removed. Here are our newest pieces."), and update the one script string that matches the title.

### Pitfall 8: `generateMetadata` and the page call `getItem` separately
Both share the React `cache()` result, so there is no second API call. Do not add a different read for the sold flag.

## Code Examples

### Sold copy keys (suggested, no em dashes)

```ts
// copy.ts additions under item:
sold:        'Sold',
soldOn:      (date: string) => `Sold on ${date}`,
soldMessage: 'This piece has been sold. Have a look at what else we have.',
buyOn:       (name: string) => `Buy on ${name}`,
newestDrops: 'See the newest drops',
// seo:
sold:        'Sold.',
```

`copy.test.ts` calls each wording function with `'2'` and checks for em dashes, so new functions are covered automatically.

### Test shapes (match existing style: `renderToStaticMarkup`, mocked `fetch`)

- `client.test.ts`: sold 200 returns the item with `soldAt`; sold with `priceCents: null` and `soldAt: null` parses; `listings` with one `http://`, one `javascript:` and one good entry keeps only the good one; missing `listings` and `soldAt` become `[]` and `null`; 404, 429, 500 and bad code unchanged.
- `ItemInfo.test.ts`: `WhereToBuy` with two listings renders two anchors with the exact hrefs, `target="_blank"`, `rel="noopener noreferrer"`, labels `COPY.item.buyOn(...)`, in the given order; unknown platform shows the hostname; empty list renders the existing profile panel (count equals `SHOP.platforms.length`); `ItemJsonLd` sold gives `SoldOut`, no price key for null price, and the `<` escaping still holds.
- New `dates.test.ts`: `formatDay('2026-11-03')` equals `3 November 2026` for `en-IE`.
- Page-level: the repo has no page render tests; keep the page logic thin (`sold` boolean + components) and cover behaviour in component tests and the Worker proof.

### Pattern 8: Worker proof (mock, script, CI)

Mock changes (`scripts/mock-howmany.mjs`):
- Add the detail fields to every item: `listings: []`, `soldAt: null`, `spotlight: false`; give one in-stock item (e.g. MOCK-0003) two listings `[{ platform: 'ebay', url: 'https://www.ebay.ie/itm/mock-3' }, { platform: 'vinted', url: 'https://www.vinted.ie/items/mock-3' }]` (alphabetical by platform, like the real API).
- A piece in `gone` answers a 200 with `status: 'sold'`, `listings: []`, `soldAt: '2026-11-03'` (it already answers status sold). Add a second set, `hidden: string[]` via `/__set`, that makes the single read a `404 no-store` and removes the piece from the list and `/filters`.
- Optionally a sold fixture with `priceCents: null` to prove the null price path on workerd.

`prove-freshness.mjs` `item-gone` check becomes two: **item-sold** (warm two views at 200, set `gone`, webhook, poll for 200 whose HTML includes `Sold on 3 November 2026`, `https://schema.org/SoldOut`, `noindex`, and lacks `Buy on`, `More from`) and **item-hidden** (set `hidden`, webhook, poll for 404 containing the new `COPY.gone.title`). Both reset the mock in `finally`. `code-gate` stays (junk codes never reach the API; counts must not change).

CI `Item and brand pages on the Worker` step: add `/items/MOCK-0003` has `Buy on eBay` and `Buy on Vinted` anchors with the exact hrefs and `target="_blank"`; MOCK-0001 (no listings) still shows the profile panel. The existing assertion that MOCK-0001 contains `https://schema.org/InStock` and `More from Mock Brand` stays valid.

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| API drops sold items (404) | `/items/{code}` answers 200 with `status: "sold"` for sold pieces chosen for the store | Blacktail can render the page (issue #13) |
| One profile link per platform | `listings` of `{ platform, url }` per item | Exact listing buttons |
| `revalidateTag(tag)` one argument | `revalidateTag(tag, { expire: 0 })` (already in place) | unchanged |

API rate limit is now 600/min per IP per the milestone (DOC-01, Phase 6); not touched here.

## Runtime State Inventory

Not a rename/migration phase. None.

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node 24, npm, vitest | tests, lint, typecheck | assumed present (existing repo workflow) | -- |
| OpenNext build / `wrangler dev` | Worker proof | Windows: no | Runs only in CI (Linux), as in v1.0 |
| Live How many API | shape confirmation | yes (reachable 2026-11-06) | has no sold or listed item right now; ask the owner to list one item with a URL and sell another to take a live sample before sign-off |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `listings` appear on the detail read exactly as `{ platform, url }[]` with lowercase platform codes (verified from API source, not from a live non-empty sample) | Pattern 1 | Name matching falls to hostname; low |
| A2 | Keep `visitOn` for the empty-listings fallback and ContactPanel; `buyOn` only for per-item buttons (D-08 wording could be read as replacing all "Visit on") | Pattern 5 | Owner wanted "Buy on" on profile links too; one-line copy change |
| A3 | Hostname fallback strips a leading `www.` | Pattern 5 | Cosmetic |
| A4 | Reword both `COPY.gone.title` and `.body` (D-07 only says "text") | Pitfall 7 | Title kept as is would still say "found a new home" |
| A5 | Badge colour inverse (forest on ivory text) and `aria-hidden` badge | Pattern 6 | Cosmetic / a11y preference |
| A6 | The webhook fires when a piece is sold or hidden (How many sends one coarse event for any stock change per issue #2 spec) | Pitfall 4 | If sold does not fire it, the 10 minute fallback covers it |

## Open Questions

1. **Live sample of a sold and a listed item.** What we know: the source and live key set agree. Unclear: real-world values (e.g. a sold item with no photos). Recommendation: after implementation, owner lists one item with a Vinted URL and sells one, then check the deployed pages (also useful for issue #26 visual check).
2. **Newest drops link target.** D-03 says "newest drops link": `ROUTES.justDropped` is the closest existing page; confirm that is what is meant (vs. only the All Items button plus drops on 404). Recommendation: link to `ROUTES.justDropped`.
3. **UI contract.** `workflow.ui_phase` is on; a UI-SPEC for this phase was not found. The badge and sold panel are small; colours here are from existing tokens (forest, ivory, sand). Planner can proceed without one.

## Security Domain

`security_enforcement` is enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication / V3 Session | no | none in this app |
| V4 Access Control | no | public read-only storefront |
| V5 Input Validation | yes | zod: https-only `listings`, regex-checked `soldAt`, nullable price; item code shape check already in `getItem` |
| V6 Cryptography | no | webhook HMAC already built and untouched |
| V12/V13 Output & API | yes | listing URLs reach `href` only via `ButtonLink external` (`rel="noopener noreferrer"`, `target="_blank"`); JSON-LD keeps `<` escaping |

### Known Threat Patterns

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| `javascript:` / `data:` URL in a listing becoming an `href` (XSS) | Tampering | `z.url({ protocol: /^https$/ })` drops it (verified rejects `javascript:`) |
| Reverse tabnabbing from external links | Tampering | `ButtonLink external` sets `rel="noopener noreferrer"` |
| Script-close injection via title in JSON-LD | Tampering | existing `.replace(/</g, '\\u003c')`, existing test |
| Leaking cost/notes through sold data | Information disclosure | schema strips unknown keys; `details` never iterated; `soldAt` is a day only. Do not add `spotlight` or any new field to markup |
| Fake Sold/404 on API failure | Spoofing/Reliability | only API 404 maps to null; 429/500/parse errors still throw to `error.tsx` (D-06) |
| Crawler hammering unknown codes against the shared rate limit | DoS | existing `ITEM_CODE` pre-check; keep it |

## Sources

### Primary (HIGH confidence)
- `C:\Git\vintage\src\lib\definitions.ts:893-919` (PublicItem), `src\lib\db\data\store.ts:56-113, 255-274` (listings, soldAt, visibility), `src\lib\config.ts:174-176, 416-419` (statuses, platform codes), `src\app\api\v1\stores\[slug]\items\[code]\route.ts` — How many's own API source at main 3aca171
- Live API `https://www.checkhowmany.com/api/v1/stores/blacktail-archive/items/SR-0177` and `/items?limit=100` (2026-11-06): key set, `status`, empty `listings`, null `soldAt`, 404 for an unknown code
- Repo code read this session: `client.ts`, `schemas.ts`, `page.tsx`, `WhereToBuy.tsx`, `ItemJsonLd.tsx`, `ItemDetails.tsx`, `ItemGallery.tsx`, `buttons.tsx`, `copy.ts`, `seo.ts`, `shop/config.ts`, `not-found.tsx`, `dates.ts`, `money.ts`, `shop-guard.test.ts`, `copy.test.ts`, `client.test.ts`, `ItemInfo.test.ts`, `scripts/mock-howmany.mjs`, `scripts/prove-freshness.mjs`, `.github/workflows/ci.yml`
- Node runs against installed zod 4.6.7 and `Intl` (https-only URL; en-IE date output)

### Secondary / Tertiary
- None. Context7/Exa/Brave not enabled in `.planning/config.json`; not needed (no new library).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (no new packages)
- Architecture: HIGH (small deltas to proven code)
- API shape: HIGH for fields and nullability (source); MEDIUM for real non-empty values (no live sample yet)
- Pitfalls: HIGH

**Research date:** 2026-11-06
**Valid until:** 2026-12-06 (the API only adds fields)
