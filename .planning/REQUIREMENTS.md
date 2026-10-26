# Requirements: Blacktail

**Defined:** 2026-10-26
**Core Value:** Shoppers see the shop's current in-stock pieces, always up to date with How many, in a storefront that looks like the Blacktail Archive mockups.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: The app builds with Next 16 and deploys to Cloudflare Workers through OpenNext, from CI on push to main
- [x] **FOUND-02**: OpenNext uses an R2 incremental cache, a D1 tag cache and a Durable Object queue, so tag revalidation works across Worker isolates
- [x] **FOUND-03**: Env vars `STORE_SLUG`, `HOWMANY_API_URL`, `HOWMANY_WEBHOOK_SECRET` and `SITE_URL` are validated with Zod, and a bad or missing value stops the app with a clear list of problems
- [x] **FOUND-04**: CI runs lint, typecheck, tests and an OpenNext worker build on every PR
- [x] **FOUND-05**: The project follows `C:\Git\vintage` conventions: `COPY` for all on-screen text (no em dashes, enforced by a test), `config.ts`, `routes.ts`, `definitions.ts`, feature component folders plus `ui/` primitives, and colocated Vitest tests
- [x] **FOUND-06**: A guard test fails if `cacheComponents`, `'use cache'`, `cacheTag` or `cacheLife` appear in the code

### Data and Freshness

- [x] **DATA-01**: All How many API calls go through one server-only client that caches each fetch under the tag `store:<slug>` with a 10-minute time-based fallback
- [x] **DATA-02**: API responses are validated with lenient Zod schemas, so unknown fields or new code values never break a page
- [x] **DATA-03**: API error responses are never cached. A failed refresh keeps showing the last good data or the error page, never a cached error
- [x] **DATA-04**: A webhook route accepts How many's signed `store.updated` POST, checks the HMAC signature and the 5-minute timestamp window in constant time, and returns 401 for anything invalid (never 500)
- [x] **DATA-05**: A valid webhook revalidates the `store:<slug>` tag (taken from env, not the request body), so the next visitor sees updated stock within seconds on the deployed Worker
- [x] **DATA-06**: Page builds don't fan out API calls (item pages render on demand), keeping Blacktail well under the shared rate limit

### Design System and Shell

- [ ] **SHELL-01**: The Blacktail palette (Forest, Olive, Stone, Sand, Ivory) and fonts (Bodoni Moda 700, Montserrat 400/500, self-hosted) are design tokens used across the site
- [ ] **SHELL-02**: The header shows the Blacktail Archive logo and nav (Shop, Brands, Just Dropped, About, Contact), plus search, and bag, account and wishlist icons that are decorative only
- [ ] **SHELL-03**: The footer shows the logo, nav links, contact details and shop links (Vinted and eBay profiles) from config
- [ ] **SHELL-04**: On mobile, a menu opens the nav, and every page follows the mobile mockups with no horizontal scroll
- [ ] **SHELL-05**: Prices are shown from integer cents in the shop's currency through one money formatter

### Catalogue

- [ ] **CAT-01**: The visitor can browse All Items as a grid of cards (cover thumbnail, brand, title, colour and size, price) with space reserved for each photo so nothing shifts
- [ ] **CAT-02**: The visitor can filter by type, brand, size, colour, era, condition, department and price range, choosing several values per filter
- [ ] **CAT-03**: The visitor can filter by pit-to-pit and length ranges. These filters hide when the shop has no measurements
- [ ] **CAT-04**: The visitor can search by words in the title, brand or colour
- [ ] **CAT-05**: The visitor can sort by newest, price low to high and price high to low
- [ ] **CAT-06**: Filters, search, sort and page live in the URL, so a filtered view can be shared or bookmarked, and invalid values are dropped instead of breaking the page
- [ ] **CAT-07**: The visitor can move through results with numbered pages (24 per page), and any filter, search or sort change goes back to page 1
- [ ] **CAT-08**: On mobile, filters open in a drawer with an Apply button
- [ ] **CAT-09**: Chosen filters show as removable chips with the result count, and an empty result shows a helpful message with a way to clear filters
- [ ] **CAT-10**: Recently added items show a "New" badge
- [ ] **CAT-11**: The visitor can see a Just Dropped page of the newest items

### Item Page

- [ ] **ITEM-01**: The visitor can view an item's photos in a gallery (full-size images, cover first, in the seller's order)
- [ ] **ITEM-02**: The item page shows brand, title, price, size, colour, era, department and condition, with the grade in words (A Excellent, AB Very good, B Good)
- [ ] **ITEM-03**: The item page shows measurements (pit to pit, length) when the item has them
- [ ] **ITEM-04**: The item page says the piece is listed on Vinted and eBay and links to the shop's profiles from config. There is no per-item link and no checkout
- [ ] **ITEM-05**: The item page shows a "More from this brand" row
- [ ] **ITEM-06**: An item that is gone (sold, hidden or unknown code) returns a real 404 with a branded page that shows the newest drops

### Brands

- [ ] **BRAND-01**: Brand logos come from `public/brands/<slug>.svg` matched by slug, with the brand name as text when there is no logo
- [ ] **BRAND-02**: The brand strip is ordered in stock first, then sold before (empty until How many provides it), then the default order from config
- [ ] **BRAND-03**: The visitor can see a Brands page of the brands in stock
- [ ] **BRAND-04**: The visitor can open a brand page (`/brands/[slug]`) that lists that brand's in-stock items

### Home

- [ ] **HOME-01**: The home page matches the Just Dropped mockup: hero, brand strip, Just Dropped carousel, two promo banners, shop by category tiles, the "a more conscious way to shop" story band, and the footer
- [ ] **HOME-02**: Home sections with no items to show are hidden rather than shown empty
- [ ] **HOME-03**: Lifestyle images (hero, banners, category tiles, story band) come from `public/images/` slots, with placeholders until the real photos are supplied

### Pages

- [ ] **PAGE-01**: The visitor can read an About / Our story page
- [ ] **PAGE-02**: The visitor can read a Contact page with the shop's contact details and shop links (no form)

### SEO

- [ ] **SEO-01**: Every page has a title, description and Open Graph tags, and item pages use the item's name and cover photo
- [ ] **SEO-02**: Item pages include JSON-LD `Product` data (name, image, price, currency, `InStock`, `UsedCondition`)
- [ ] **SEO-03**: There is a sitemap of all pages and in-stock items, refreshed with the store tag, and a robots file that blocks indexing outside production
- [ ] **SEO-04**: Filtered, searched or sorted listings are `noindex,follow`, with a canonical URL built from `SITE_URL`

### Template

- [ ] **TMPL-01**: Everything shop-specific (name, copy, contact, platform links, theme tokens, fonts, images, default brand order, category tiles) lives in one per-shop folder and config, and a test fails if shop-specific strings appear elsewhere
- [ ] **TMPL-02**: A short onboarding doc explains how to deploy the template for another shop (env, Cloudflare R2, D1 and Worker setup, and assets)

## v2 Requirements

### Buying

- **BUY-01**: A per-item "Buy on Vinted / eBay" link (needs How many to expose per-item listing links)
- **BUY-02**: Checkout with a short stock reservation, so a one-off item can't sell twice

### Brands

- **BRAND-05**: The sold-before brand tier is filled from How many (needs an API addition)

### Engagement

- **ENG-01**: A working wishlist saved in the browser
- **ENG-02**: Generated Open Graph images per item
- **ENG-03**: Facet counts that narrow as filters are chosen (needs an API change)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Checkout, bag and payments | v1 sends buyers to Vinted and eBay |
| Accounts and login | Nothing to sign in for without checkout |
| Enquiry form and newsletter signup | Not wanted for v1, and no provider |
| Sold archive, sold badges, stock counters and urgency timers | Sold items leave the API, and fake urgency doesn't suit the brand |
| Infinite scroll and client-side filtering | The API does the filtering, and numbered pages are better for SEO |
| Reviews and rating markup | Not supported, and Google penalises unverified reviews |
| Direct database access | Blacktail only uses the public API |
| Multi-tenant hosting (several shops per deploy) | One deploy per shop. A host-to-store lookup can be added later |
| `cacheComponents` / `'use cache'` | Broken on Cloudflare Workers through OpenNext (#1450) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| DATA-06 | Phase 1 | Complete |
| SHELL-01 | Phase 2 | Pending |
| SHELL-02 | Phase 2 | Pending |
| SHELL-03 | Phase 2 | Pending |
| SHELL-04 | Phase 2 | Pending |
| SHELL-05 | Phase 2 | Pending |
| CAT-01 | Phase 2 | Pending |
| CAT-02 | Phase 2 | Pending |
| CAT-03 | Phase 2 | Pending |
| CAT-04 | Phase 2 | Pending |
| CAT-05 | Phase 2 | Pending |
| CAT-06 | Phase 2 | Pending |
| CAT-07 | Phase 2 | Pending |
| CAT-08 | Phase 2 | Pending |
| CAT-09 | Phase 2 | Pending |
| CAT-10 | Phase 2 | Pending |
| CAT-11 | Phase 4 | Pending |
| ITEM-01 | Phase 3 | Pending |
| ITEM-02 | Phase 3 | Pending |
| ITEM-03 | Phase 3 | Pending |
| ITEM-04 | Phase 3 | Pending |
| ITEM-05 | Phase 3 | Pending |
| ITEM-06 | Phase 3 | Pending |
| BRAND-01 | Phase 3 | Pending |
| BRAND-02 | Phase 4 | Pending |
| BRAND-03 | Phase 3 | Pending |
| BRAND-04 | Phase 3 | Pending |
| HOME-01 | Phase 4 | Pending |
| HOME-02 | Phase 4 | Pending |
| HOME-03 | Phase 4 | Pending |
| PAGE-01 | Phase 4 | Pending |
| PAGE-02 | Phase 4 | Pending |
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 3 | Pending |
| SEO-03 | Phase 4 | Pending |
| SEO-04 | Phase 2 | Pending |
| TMPL-01 | Phase 2 | Pending |
| TMPL-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-10-26*
*Last updated: 2026-10-26 after roadmap creation*
