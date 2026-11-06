# Phase 5: Sold Item Pages and Listing Links - Context

**Gathered:** 2026-11-06
**Status:** Ready for planning

<domain>
## Phase Boundary

A sold piece keeps a working page at `/items/[code]`, clearly marked Sold. A piece for sale links to its exact Vinted or eBay listing (`listings`), falling back to the shop's profile links. Requirements SOLD-01..04, LINK-01, LINK-02. Closes issue #13. Brand strip and spotlight are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Sold page look
- **D-01:** A small "Sold" badge sits in a corner of the cover photo (not a full overlay). Where the price was, a line "Sold on <date>" from `soldAt`.
- **D-02:** The asking price is hidden on a sold page. It is never shown as a sale price.
- **D-03:** In place of the where-to-buy panel: a short sold message from `COPY` plus a button to All Items and the newest drops link. No price call to action. "More from this brand" stays hidden.
- **D-04:** The sold date is a long date in the shop locale (`SHOP.locale`, Intl), e.g. "3 November 2026". No relative dates.

### Freshness and 404s
- **D-05:** `getItem` stays one tagged, cached read of `/items/{code}`. The `status === 'sold'` to null mapping is removed so the page can render sold. The webhook tag refresh turns a cached copy into sold, or into a 404 for hidden or deleted, on the next request. No second cache path.
- **D-06:** Only an API 404 or a wrongly shaped code is a real 404 (with newest drops). Any other failure (429, 500) still reaches `error.tsx`, never a fake 404 or a fake Sold.
- **D-07:** Reword the `COPY.gone` 404 text to be neutral ("no longer available"), since "sold" now has its own page.

### Listing buttons
- **D-08:** Label is "Buy on <Platform>" (user choice; replaces today's "Visit on").
- **D-09:** Platform display name is resolved by matching the listing's platform to `SHOP.platforms` by name (config owns the name). An unknown platform falls back to the hostname of its URL.
- **D-10:** Keep the sand panel. Buttons follow the API order, stacked on mobile and in a row from 480px. The "listed on ..." copy is built from the item's own listings. Empty `listings` shows today's profile-link panel from `SHOP.platforms` (LINK-02).
- **D-11:** Listing URLs are validated in the zod schema: https only. Invalid ones are dropped, and if none remain the profile fallback shows. Links use `ButtonLink external` (new tab, opens-in-new-tab sr-only text).

### Sold SEO
- **D-12:** JSON-LD keeps the Offer with availability `https://schema.org/SoldOut` and the asking price.
- **D-13:** Title is unchanged; description is prefixed with "Sold.".
- **D-14:** Robots `noindex,follow`, canonical to itself, using the existing robots helper. The sitemap needs no change because it reads `/items`, which omits sold.

### Claude's Discretion
- Exact badge size, colour and sold message wording (no em dashes), the `soldAt` and `listings` zod field shapes (confirm against the live API), and where the sold-state branch lives in `ItemDetails` and `page.tsx`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` - SOLD-01..04, LINK-01, LINK-02 and Out of Scope (no sale prices)
- `.planning/ROADMAP.md` - Phase 5 goal and success criteria
- `.planning/milestones/v1.0-phases/03-item-and-brand-pages/03-CONTEXT.md` - D-09 (the 404 this phase replaces for sold)

### Code
- `src/lib/howmany/client.ts` - `getItem`, the one fetch path and tags
- `src/lib/howmany/schemas.ts` - `itemSchema` (`status`, to add `soldAt`, `listings`)
- `src/app/items/[code]/page.tsx`, `src/components/item/WhereToBuy.tsx`, `ItemJsonLd.tsx`, `ItemDetails.tsx`
- `src/lib/copy.ts` (`item`, `gone`), `src/shop/config.ts` (`platforms`, `locale`)

No external specs for the API shape: confirm `listings` and `soldAt` against the live public API.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ButtonLink` with `external`, `formatMoney` style formatter, `pageMetadata` and the robots helper, `ItemGone` / not-found newest drops.

### Established Patterns
- All reads through `client.ts` with the store tag and `revalidate: 600`; React `cache()` dedupes metadata and page; copy lives in `COPY`; per-shop values only from `SHOP`.

### Integration Points
- `getItem` sold to null mapping, the right column of `page.tsx`, `generateMetadata`, `ItemJsonLd`, `WhereToBuy`.

</code_context>

<specifics>
## Specific Ideas

Sold badge in a photo corner, not a big overlay.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Sold Item Pages and Listing Links*
*Context gathered: 2026-11-06*
