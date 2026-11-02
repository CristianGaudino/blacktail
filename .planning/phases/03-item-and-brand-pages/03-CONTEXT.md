# Phase 3: Item and Brand Pages - Context

**Gathered:** 2026-11-02
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the item page at `/items/[code]`, the real 404 for gone items, the Brands page at `/brands` and the brand pages at `/brands/[slug]`. The item page has a photo gallery, details, measurements, a "listed on Vinted and eBay" block with the shop's profile links, a "More from this brand" row and JSON-LD `Product` data. Item cards (Phase 2) already link to `/items/[code]`, and the header Brands dropdown moves to the brand pages.

The home page, Just Dropped, About and Contact belong to Phase 4. A buy button, checkout, sold badges and any storage of sold items are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Gallery (ITEM-01)
- **D-01:** On desktop the gallery is one large photo with a column of thumbnails beside it. Clicking a thumbnail swaps the large photo.
- **D-02:** On a phone the gallery is a swipe carousel (scroll-snap, no library) with a position indicator (dots).
- **D-03:** Clicking the large photo opens a lightbox dialog with the full-size photo, previous and next arrows, a close button and keyboard support. Reuse `src/hooks/useModalDialog` and the existing `Sheet` pattern where it fits.
- **D-04:** The cover photo (first, in the seller's order) loads with `priority`; the others lazy-load. Every photo uses the API `url` with its `width` and `height` and a CSS `aspect-ratio`, so nothing shifts (images stay `unoptimized`).

### Item page layout and info (ITEM-02, 03, 04, 05)
- **D-05:** Details are a label/value list: Size, Colour, Era, Department, Condition (in words: A Excellent, AB Very good, B Good), Material when present. A row with no value is left out. Labels come from the existing code-label maps in `COPY` (unknown codes fall back to the capitalised code).
- **D-06:** Measurements (Pit to pit, Length) show in **both cm and inches** (e.g. 56 cm / 22 in), converted from the API's mm. The block is hidden when the item has neither.
- **D-07:** The "where to buy" block is a line ("This piece is listed on Vinted and eBay") with a link button per platform to the shop's profile. Platform names and URLs come from `SHOP.platforms`, so nothing is hard coded. No buy button and no per-item link.
- **D-08:** "More from this brand" shows the **4 newest in-stock items of the same brand, excluding the current one**, as the normal item cards in one row, with a "View all" link to `/brands/[slug]`. It is hidden when the item has no brand or the brand has no other items.

### Gone-item page (ITEM-06)
- **D-09:** A sold, hidden or unknown `/items/[code]` returns a **real 404 status** with a branded page: a clear "sold" message from `COPY` ("this piece has found a new home" style, no em dash), then the **8 newest drops** in the normal grid and a link to All Items. No item details are shown, because the API drops sold items entirely.
- **D-10:** Any other unknown URL gets a simpler on-brand not-found page without the drops grid.
- **D-11:** This must hold on the deployed site right after the webhook for a piece that just sold (success criterion 3), so the item page renders on demand over the tagged fetch cache (`await connection()`, no `generateStaticParams`).

### Brands pages (BRAND-01, 03, 04)
- **D-12:** The Brands page is a responsive grid of tiles, ordered A to Z. Each tile shows the brand's SVG logo, or the brand name in Bodoni Moda when there is no logo, and links to `/brands/[slug]`.
- **D-13:** `/brands/[slug]` **reuses the full `/shop` catalogue with the brand locked**: same grid, filters, sort, search, paging and URL handling, plus a brand heading or logo. One code path, so the two stay consistent.
- **D-14:** The brand slug rule is: lowercase, drop accents and apostrophes, turn other characters into hyphens (Arc'teryx becomes arcteryx). The slug is computed from the brand names in `/filters`. A logo shows only when `public/brands/<slug>.svg` exists. No alias map for now.
- **D-15:** The header Brands dropdown items link to `/brands/[slug]` and the top-level Brands link goes to `/brands`. Add the new routes to `ROUTES` and `BUILT_PAGES`, and remove the `BUILT_PAGES` stopgap for the pages this phase ships.

### SEO (SEO-02)
- **D-16:** Item pages carry JSON-LD `Product` data (name, image, price, currency, `InStock`, `UsedCondition`) and `generateMetadata`. Site-wide titles and Open Graph belong to Phase 4 (SEO-01), and the site stays `noindex` until then.

### Claude's Discretion
- Exact visual treatment of the item page, lightbox and brand tiles, following the item and Brands mockups in the branding PDF and the Vintage UI conventions.
- Copy wording for the sold message, the where-to-buy line and the generic not-found page.
- How an unknown brand slug on `/brands/[slug]` is handled (expected: the same generic not-found).
- Whether the brand-locked catalogue is a shared component or a route param passed into the existing `/shop` page logic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual target
- `docs/refs/Blacktail Archive - Branding.pdf`: item page, Brands page and mobile mockups (the v1 visual target)
- `docs/refs/misc-mockup.png`, `docs/refs/just-dropped.png`: card design, header and footer

### API contract
- `docs/refs/issues.json` issue #2: `GET /items/{code}` (404 for anything not shown), `/items` params including repeated `brand`, `/filters` brand values, photo `url` / `thumbUrl` / `width` / `height`, caching and rate limit

### Project
- `.planning/REQUIREMENTS.md`: ITEM-01..06, BRAND-01, BRAND-03, BRAND-04, SEO-02
- `.planning/ROADMAP.md` (Phase 3): success criteria 1 to 5
- `.planning/PROJECT.md`: key decisions (no checkout, condition wording, logos by slug), open items (arcteryx rename, ralph-lauren vs polo-ralph-lauren)
- `.planning/phases/02-branded-catalogue/02-CONTEXT.md`: D-09 (routes), D-12 (nav dropdowns), D-19 (code labels), D-21 to D-24 (cards)
- `.claude/CLAUDE.md`: stack, images (`unoptimized`, width/height from the API), revalidation contract (every read through the tagged client)

### Reference codebase
- `C:\Git\vintage\.planning\codebase\CONVENTIONS.md`, `STRUCTURE.md`: structure and UI primitives conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/howmany/client.ts` and `schemas.ts`: tagged `howmanyFetch`; `itemSchema` already has photos with `url`, `width`, `height`, measurements and details. Add a single-item read for `/items/{code}` through the same client.
- `src/components/catalogue/`: `ItemCard`, `ItemGrid`, `Pager`, `FilterPanel`, `CatalogueShell`, `CatalogueBanner` for the brand-locked catalogue and the More-from-brand and drops rows.
- `src/components/ui/`: `Sheet`, `StatusScreen`, `ButtonLink`, `useModalDialog` hook for the lightbox.
- `src/lib/labels.ts`, `money.ts`, `params.ts`, `paging.ts`, `seo.ts`: code labels, money, URL cleaning and canonical helpers.
- `src/shop/config.ts` (`SHOP.platforms`, `SHOP.name`): where-to-buy links.
- `public/brands/*.svg`: 30 logos by slug.

### Established Patterns
- Pages call `await connection()` and render per request over the cached fetch; no `generateStaticParams`.
- All on-screen text in `COPY` (no em dashes), shop strings only in `src/shop/` (guarded by `shop-guard.test.ts`).
- Named exports, 4-space indents, single quotes, colocated `*.test.ts`, `import 'server-only'` on API modules.

### Integration Points
- New routes: `src/app/items/[code]/`, `src/app/brands/`, `src/app/brands/[slug]/`, plus `not-found` pages; `ROUTES` gains `brand(slug)`.
- The header Brands dropdown (Phase 2 D-12) is repointed to `/brands/[slug]`.

</code_context>

<specifics>
## Specific Ideas

- The owner first asked for the sold item to still show with a clear "sold" mark. Because the API removes sold items, this became a sold message on the 404 page, and the fuller version is deferred as a request to How many.

</specifics>

<deferred>
## Deferred Ideas

- **Sold item pages**: showing the original item (photos, details) marked as sold needs How many to expose sold items through the API (ask How many). Until then, a gone item shows the sold message and the newest drops.
- Brand alias map (for spelling mismatches such as ralph-lauren vs polo-ralph-lauren): add to shop config only if a real mismatch shows up.
- Home page, Just Dropped, About, Contact, site-wide metadata and sitemap: Phase 4.

</deferred>

---

*Phase: 03-item-and-brand-pages*
*Context gathered: 2026-11-02*
