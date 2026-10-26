# Feature Research

**Domain:** Small pre-loved / vintage branded menswear storefront. One-off items, read-only catalogue from the How many API, no checkout, buyers sent to Vinted / eBay.
**Researched:** 2026-10-26
**Confidence:** MEDIUM. Google behaviour (Product markup, 404 handling) verified against Google Search Central docs (HIGH). Vintage-shop conventions (measurements, condition grading) come from seller guides plus domain knowledge (MEDIUM). Named competitor behaviours are from general knowledge, not re-verified this session (LOW to MEDIUM).

Scope is fixed by `PROJECT.md` and the mockups. This file does not re-argue the page list. It covers (1) what is expected inside those pages, (2) gaps, (3) what the API from issue #2 allows or forbids.

## Constraints That Shape Every Feature Below

These come from the API contract in issue #2 and change what is possible. Requirements should respect them.

| API fact | Consequence |
|----------|-------------|
| `/filters` counts are over the whole store, "not narrowed by filters already chosen" | Facet counts are global, not contextual. After a filter is applied, a count of "Ralph Lauren (12)" can be wrong for the current selection. Only `total` from `/items` is truthful for the current view. |
| Sold, written-off and unshown items return 404 (item) or vanish (list) | There is no "sold" state. Blacktail cannot tell "sold" from "never existed". No sold archive, no "sold" badge, no sold-brand source. |
| Unknown `category`, `type`, `condition`, `department` return 400 | A stale or hand-edited shared URL must not 500 the page. Validate URL params against `/filters` and drop unknowns before calling `/items`. |
| `brand`, `size`, `colour`, `era`, `material` are free text, exact match, any case | Unknown values just give zero results (no 400). Sizes arrive "most common first", not in size order. Blacktail must sort sizes itself. |
| `q` matches title, brand, colour only | Searching "knit" or "L" will not match type or size. Copy and empty states must not promise more. |
| No description, notes or flaws field. `details` is mostly empty for clothing | Condition text is generic per grade, not per item. Photos carry the flaw detail. JSON-LD description must be assembled from attributes. |
| Measurements are `pitToPitMm` and `lengthMm` only, in mm | Convert for display (cm, optionally inches). Range filters exist for both. `/filters` returns `null` for a range with no data, so hide that control. |
| Paging is by page number, `limit` 1 to 100, last page when `page * limit >= total` | Numbered, URL-addressed pages. A page past the end returns empty items, so handle it. |
| No per-item platform link | The buyer has to find the piece on Vinted / eBay themselves. See "Item code as the bridge" below. |
| `publishedAt` is "when it was added to the store". No `updatedAt` | "Newest" and "New" badges key off `publishedAt`. Sitemap `lastmod` can only use it. |
| Money is integer cents, currency from the seller (`GET /`) | One formatter, `Intl.NumberFormat`, currency from the store. Price URL params convert at the boundary. |

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and the site feels broken or untrustworthy for a vintage shop.

#### Browsing and filtering

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| URL-driven filters, sort, search and page (`?brand=a&brand=b&size=L&minPrice=20&sort=price_asc&q=knit&page=2`) | Shareable, back-button safe, crawlable. Shoppers share finds | MEDIUM | Reuse the API's param names 1:1 (repeated params for multi-select). Server component reads `searchParams`, so no client state library. One parse function validates against `/filters` and drops invalid values (see 400 note). Reset `page` to 1 whenever a filter, sort or `q` changes |
| Multi-select facet groups: type, brand, size, colour, era, condition, department | The mockup sidebar; any resale grid has them | MEDIUM | Checkbox groups, collapsible. Hide a group with fewer than 2 options (so "department" disappears on a menswear-only shop). Cap long lists (brands run to 30+) behind "Show more" |
| Facet counts from `/filters` | Tells shoppers what exists before they click | LOW | Counts are store-wide (API limitation). Recommendation: show counts only when no other filter is active, hide them otherwise, so a count never contradicts the result. The `total` in the results heading is the source of truth |
| Facet labels in Blacktail's words (condition codes, type codes, department codes) | API returns `A`, `knit`, `mens` | LOW | Label maps in `COPY`. Unknown future codes fall back to a title-cased raw value, never crash |
| Sensible size ordering | Alphabetical or "most common" size lists look broken | LOW | Config ladder (`XXS, XS, S, M, L, XL, XXL, XXXL`), then numeric sizes ascending, then unknowns last |
| Price range filter | In the PROJECT list; range bounds come from `/filters.priceCents` | LOW | Two number inputs with min and max placeholders from `/filters`. A slider is not needed. URL carries currency units, converted to cents in one helper |
| Sort: newest, price low to high, price high to low | In PROJECT list; API supports exactly these | LOW | `<select>` in a GET form. Default `newest` |
| Result count and active filter chips with remove and "Clear all" | Orientation after filtering | LOW | Chips are links that drop one param. Count is `total` from `/items` |
| Numbered, link-based pagination (24 per page) | Crawlable and back-button safe, unlike infinite scroll or "load more" | LOW | Plain `<a>` prev/next plus page numbers. Redirect or 404 a page past the last (`page * limit >= total`) |
| Mobile filter drawer | Most traffic is mobile; the mobile mockups need it | MEDIUM | Sticky "Filter and sort" button with active-count badge. Drawer or bottom sheet with an "Apply" / "Show results" button (not instant apply, so each tap does not refetch). Use a native `<dialog>` and a plain GET form, so it works with little JS and traps focus for free |
| Header search to `/shop?q=` | In PROJECT list | LOW | Same GET form pattern. Show the query in the results heading and keep it in the input |
| Product grid card: cover `thumbUrl`, brand, title, size, price | Core of the page | LOW | Reserve space from width/height (no layout shift). Brand above title. Size is the key buying signal for clothing, so show it on the card |
| Loading skeleton on filter change | Prevents blank flash | LOW | `loading.tsx` or `Suspense` keyed on the search string |

#### Item page (one-off pieces)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Photo gallery with thumbnails, swipe on mobile, and tap-to-zoom lightbox | Buyers inspect fabric, labels and flaws in photos. Photos replace the missing flaw notes | MEDIUM | `url` for gallery and lightbox, `thumbUrl` for the strip. First photo is the cover and gets `priority` (LCP). Reserve ratio from width/height |
| Measurements block, labelled and unit-converted | The single biggest vintage-specific need. Vintage sizing is unreliable, so tag size alone is not enough. Vintage seller guides ask for written measurements | LOW | "Pit to pit (flat)" and "Length" in cm (inches secondary if config says so). Say "laid flat" so nobody reads it as a circumference. Hide the block if neither value exists |
| Condition shown with a plain-words explanation | `A`, `AB`, `B` mean nothing without a key. Disclosure norms (Vintage Fashion Guild) say a bare "vintage condition" is not enough | LOW | Label plus one-line meaning from `COPY`, with a small "How we grade" key (popover or section) listing every grade. Grade definitions need to come from the seller (open question). Because the API has no per-item flaw notes, add "See photos for details" |
| Attribute list: brand, size, colour, era, material (if present), department | Standard spec table | LOW | Every field optional. Render only what exists, never an empty row or "undefined" |
| Price and "available on Vinted / eBay" line | Core of the no-checkout model | LOW | Platform names and shop-profile URLs come from config. See "Item code as the bridge" |
| Item code visible (for example `RL-0142`) | With no per-item link, the code is the only handle a buyer has to find the piece | LOW | Show as "Ref RL-0142" with a copy affordance. Ask the seller to put the code in the Vinted / eBay listing title or description (seller-side workflow, not code) |
| Link to the shop's Vinted / eBay profile | Closest thing to a "buy" button available without per-item links | LOW | Config-driven buttons. Open in a new tab with `rel="noopener"`. Copy must not claim the exact piece is one tap away |
| "Only one available" cue | Honest scarcity for one-offs. Shoppers know it is one-of-one | LOW | A copy line, not a stock counter. No fake urgency |
| Breadcrumb or back to results preserving filters | Shoppers browse many pieces from one filtered list | LOW | A "Back to all items" link. Preserving the filter query means passing it through or relying on browser back. Plain browser back works because filters are in the URL |
| Alt text on photos | Accessibility and image SEO | LOW | `"{brand} {title}, photo {n}"` |

#### Removed or unavailable items

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Real HTTP 404 for an item that is gone, with a useful page | Google's docs say 404 and 410 are treated the same for removed pages; a "sold" message with a 200 is a soft 404 and gets flagged in Search Console | LOW | `notFound()` when `/items/{code}` returns 404. Custom `not-found.tsx`: "This piece has gone" plus the newest drops and a link to All Items. Do not render a 200 "sold" page, because Blacktail cannot distinguish sold from invalid anyway |
| 404 responses carry the store cache tag | A cached 404 must clear when the webhook fires. Items can be re-shown in How many (same code) | LOW | Make sure the not-found result of the item fetch is tagged `store:<slug>` as well, not cached forever |
| Dead links pruned from the sitemap | Sitemap lists only current items | LOW | Same tag as the rest, so the webhook refreshes it |
| Last-good-data fallback when the API errors or rate limits (429, 500) | The API is the whole site. A blip must not blank the shop | MEDIUM | Catch fetch failures and serve the previous cached data where the cache layer allows. Otherwise a friendly error state with retry. Never show a raw error. Do not cache error responses (the API sends `no-store` for them) |

#### Empty and edge states

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| No results (filters or search) | The commonest dead end on a small catalogue | LOW | Message, the active chips, "Clear all filters", and a few newest items or top brands below. Say what `q` searches ("title, brand or colour") |
| Empty store (zero items shown) | A fresh deploy or a sell-out week | LOW | "New pieces are on their way" with the contact link. Hide empty home sections (Just Dropped carousel, brand strip) instead of rendering blank bands |
| Page beyond last page | Shared old URLs | LOW | Redirect to the last page or show the no-results state |
| Missing optional fields (era, colour, material, measurements) | Seller data is uneven | LOW | Never print blanks. Treat every non-core field as optional in `definitions.ts` |
| Missing logo for a brand | In PROJECT already | LOW | Text fallback, already specified |
| Custom 404 (site wide) and 500 pages in brand style | Expected polish | LOW | Next `not-found.tsx` / `error.tsx` |

#### SEO and sharing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `generateMetadata` per item: title, description, canonical, Open Graph, Twitter card | In PROJECT and issue #1 | LOW | Title like `{Brand} {title} | {Shop}`. Description assembled from attributes (no description field exists). `og:image` is the cover `url` with its width and height |
| JSON-LD `Product` on item pages | In PROJECT | LOW | See "JSON-LD specifics" below |
| `sitemap.xml` and `robots.txt` | Without them, one-off inventory is slow to get indexed | LOW | Next `sitemap.ts`: static pages, all item URLs (page `/items` at `limit=100`), tagged `store:<slug>`. `lastmod` from `publishedAt`. `robots.ts` points to it |
| Indexing rules for filtered listings | Faceted URLs can explode into thousands of near-duplicate crawl targets | LOW | Canonical on `/shop` pointing at the clean URL. `noindex,follow` when any filter, `q` or `sort` param is present. Keep plain `?page=N` indexable or canonical to itself |
| Per-page titles and descriptions for static pages | Basic hygiene | LOW | Title template in the root layout |
| Social previews that work | Items get shared in chats and on socials | LOW | Covered by OG metadata above. Test one item URL in a link previewer |
| Accessible, semantic markup | Baseline | LOW | Real headings, labelled checkboxes, focus trap in the drawer, visible focus, alt text, `lang` |
| Responsive images with reserved space | Core Web Vitals; photos are the product | MEDIUM | `sizes` on grid images, `priority` on LCP, width/height from API. Check how images are served on Cloudflare Workers (the default Next image optimiser needs a loader there). A stack question, flagged for the architecture researcher |
| Cookie-free by default | No consent banner needed if no tracking | LOW | Do not add analytics that need a banner. If analytics is wanted later, use a cookieless one |

#### Static pages and chrome

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| A clear "How buying works" explanation | The flow (browse here, buy on Vinted / eBay) is unusual. Shoppers expect a checkout | LOW | Short block on the item page and in the About or Contact page, from `COPY`. Prevents "where is the Add to bag button" confusion |
| Contact page with details and social links (static, no form) | In PROJECT | LOW | All in config |
| Brands page: in-stock brands with logos, linking to `/shop?brand=` | In PROJECT | LOW | Source is `/filters.brand`. Link target is the filtered grid |
| Just Dropped page and home carousel | In PROJECT | LOW | Same query: `sort=newest`. See differentiators for "New" badge |

### Differentiators (Competitive Advantage)

Aligned with the core value: always-current stock in a storefront that matches the mockups. Pick few.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Measurement range filters (pit to pit, length) | Lets buyers filter by a garment they already own and know fits. Rare in small shops. The API already supports it | MEDIUM | `minPitToPitMm` / `maxPitToPitMm` / `minLengthMm` / `maxLengthMm`. Only render when `/filters` gives a non-null range. Add after the core filters. A "Fit finder" with a short "measure your favourite shirt" explainer makes it usable |
| "How we measure" diagram / size guide | Clears up flat versus circumference, the top vintage buyer confusion | LOW | Static content with an image in config. Link from the measurements block |
| "New" badge on recent drops | Reinforces the Just Dropped story | LOW | `publishedAt` within N days (N in config). Pure client of existing data |
| More from this brand, and similar pieces, on the item page | Every one-off piece is a dead end. Keeps shoppers browsing | LOW | Two cached `/items` calls (`brand=` and `type=`), excluding the current code |
| Second photo on card hover | Cheap tactile feel in a photo-led shop | LOW | Each photo already has a `thumbUrl`. Hover only (pointer devices) |
| Brand search inside the brand facet | With 30+ brands, scanning is slow | LOW to MEDIUM | Client filter on the list. Defer unless the brand list is long in practice |
| Live "Show N items" count in the mobile drawer | Avoids empty results after applying | MEDIUM | Needs a request per change. Skip in v1, use a plain Apply button |
| Grouping on Just Dropped (today, this week, earlier) | Gives the page a rhythm | LOW | Group by `publishedAt` date. Optional polish |
| Copy-link / native share button on item page | One-off items get passed around between friends | LOW | `navigator.share` with a copy fallback |
| Branded generated OG image per item | Better previews than a raw photo | MEDIUM | Next `ImageResponse` support on Workers needs checking. Default to the cover photo URL, which is enough |
| Indexable brand landing pages (`/brands/[slug]`) with brand intro copy | Brand names are the searches that matter in this niche ("Ralph Lauren vintage shirt") | MEDIUM | Defer past v1. In v1 the Brands page links to `/shop?brand=`, which is `noindex` under the rule above |
| RSS / Atom feed of drops | A tiny, newsletter-free way to follow new stock | LOW | P3, only if someone asks |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Dead "Add to bag" / "Add to wishlist" buttons | Mockup shows bag, account and wishlist icons | Clickable-looking controls that do nothing erode trust and fail accessibility | Render the header icons as non-interactive decoration (`aria-hidden`, not focusable, no hover state), or show a "coming soon" tooltip. Do not put an "Add to bag" button on the item page |
| "Sold" badge pages or a sold archive | Social proof, SEO for sold pieces | The API removes sold items. Faking it needs data that does not exist, and a 200 "sold" page is a soft 404 | Real 404 with a helpful page, or a How many API addition later |
| Stock counters and urgency timers ("only 2 left", countdown) | Conversion tricks from mainstream retail | Every piece is one-off already. Timers would be false and break trust in a vintage shop | A quiet "One of one" line |
| Infinite scroll or "load more" | Feels modern | Breaks back-button, URL sharing, crawl, and footer access | Numbered page links |
| Instant-apply filters that refetch on every click on mobile | Feels responsive on desktop | On mobile, each tap reloads and scrolls the list. Burns API budget and annoys | Apply button in the drawer. Desktop sidebar may apply per click |
| Client-side filtering of a fully loaded catalogue | Simple to build | Ignores the API's `q`, filters and ranges, bloats the page, and drifts from the "API does the filtering" decision | Server-side via `/items` |
| Showing facet counts after other filters are active | Looks informative | `/filters` counts are store-wide, so they would be wrong | Counts only in the unfiltered state, or none |
| Accounts, saved wishlist, price drop alerts, back-in-stock alerts | Common on resale platforms | Out of scope. Back-in-stock makes no sense for one-offs. A wishlist would hold items that then vanish | Defer. If a localStorage wishlist is added later, design for removed-item handling from day one |
| Newsletter signup | Standard footer | In Out of Scope: no provider and nobody asked | Social links and the Vinted / eBay profile follow |
| Enquiry form on the item page | Fills the "how do I buy" gap | In Out of Scope. Needs a backend, spam control and an inbox | Platform profile links and the item code |
| Reviews, star ratings, `aggregateRating` markup | Social proof | No data, and fabricated review markup violates Google's guidelines | None |
| Currency or language switchers | International buyers | Currency is the seller's. Extra complexity for one shop | None |
| Typeahead search suggestions | Nice UX | An API request per keystroke against a shared rate limit, for a small catalogue | Plain search submit, with brand shortcuts on the empty state |
| Cost, notes or margins on any page | Transparency | Forbidden by the Privacy constraint. The API does not return them | None |
| Merchant-listing / shopping-ads feed work | Free Google shopping traffic | Google says merchant listing eligibility is limited to pages where shoppers can buy the product. A page that only points to Vinted / eBay does not qualify | Standard Product markup anyway (helps understanding), with no promise of rich results |

## JSON-LD Specifics (item pages)

Verified against Google's merchant listing docs. Requirements for `Product`: `name`, `image`, `offers`. For `Offer`: `price` and `priceCurrency`, and price must be above zero. `availability`, `itemCondition`, `url`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy` are recommended only.

Recommended output for Blacktail:

- `@type: Product`, `name` (title), `image` (array of `url`s), `description` (assembled: brand, type, size, condition label, era, key measurement), `sku` (the item code), `brand: { @type: Brand, name }`, `color`, `size`, `category` if mapped.
- `offers: { @type: Offer, price (cents / 100 as a decimal string), priceCurrency, availability: InStock, itemCondition: UsedCondition, url: canonical item URL }`.
- Always `InStock`: if the item is in the API it is shown. A gone item returns 404, so `OutOfStock` and `SoldOut` never appear. Do not emit them.
- `itemCondition` is `UsedCondition` for every grade. The A / AB / B grade goes in the visible page text, not the schema.
- Skip `priceValidUntil` (one-off, no price expiry), shipping and returns (handled by the platform), `gtin`, `mpn`, ratings and reviews.
- Optional `BreadcrumbList` (Home, Shop, Item) is cheap and useful.
- Escape `<` in the JSON string before putting it in a `<script type="application/ld+json">` tag.
- Validate with Google's Rich Results Test once on a deployed item. Expect product snippet-level eligibility, not merchant-listing eligibility.

## Item Code as the Bridge (no per-item links)

Without a per-item link the loop is: shopper finds a piece, then must locate it on Vinted / eBay. Mitigations, cheapest first:

1. Show the code prominently on the item page.
2. Config-driven buttons to the shop's Vinted and eBay profiles.
3. Seller practice: put the code in each marketplace listing so the shopper can search for it. This is a How many / seller workflow, but it decides whether the site converts at all.
4. Later: a per-item URL field in the API (issue #1 lists it as "left out for now"). The item page should be built so adding a "Buy on Vinted" button for an item with a link is a one-component change.

There is also an unavoidable staleness gap. A piece can sell on Vinted before the webhook fires, because the sale is recorded in How many first. Copy should say "listed on Vinted / eBay" rather than promise availability.

## Feature Dependencies

```
Config (STORE_SLUG, platforms, COPY, label maps, size ladder, theme)
    └──required by──> everything below

API client + tag cache (store:<slug>, webhook, time fallback)
    ├──requires──> Money/currency formatter (cents, store currency)
    └──required by──> All Items, Item page, Home, Just Dropped, Brands, sitemap

/filters fetch ──> Filter sidebar + mobile drawer + Brands page + price bounds + measurement ranges
    └──requires──> Label maps (condition, type, department) + size ladder

URL param parse/validate (drops unknowns, resets page)
    ├──required by──> Filter UI, Search, Sort, Pagination, Active chips
    └──required by──> noindex rule on filtered listings

Item fetch (/items/{code}) ──> Item page ──> notFound() ──> custom 404 page
    ├──> Gallery + lightbox (needs photo width/height)
    ├──> Measurements block (needs mm to cm helper)
    ├──> Condition label + "How we grade" key (needs seller-supplied grade meanings)
    ├──> generateMetadata + OG ──> JSON-LD Product
    └──> More from brand / similar (enhances)

Sitemap ──requires──> Item list paging at limit=100 ──shares──> same tag as webhook

Measurement range filters ──enhances──> Filter sidebar (needs /filters ranges non-null)
Per-item platform link (How many change) ──enhances──> Item page buy button
Sold-brands source (How many change) ──enables──> Brand strip tier 2
```

### Dependency Notes

- **Everything depends on the API client and cache.** The cache layer, tag and webhook must exist before page work, or every page will rework its fetching and the shared rate limit is at risk.
- **Filter UI requires the param parser.** Build the validate-and-normalise function first, with tests. Filters, search, pagination and chips all use it.
- **Filter labels require config.** Condition, type and department label maps and the size ladder must exist before the sidebar shows anything real.
- **JSON-LD requires item fetch and a canonical URL helper.** It reuses the same data as `generateMetadata`. Do them together.
- **Sitemap shares the tag.** If it is not tagged, the sitemap goes stale against the webhook and lists dead URLs.
- **Condition key requires seller input.** Grade meanings for A, AB, B are not in the API. Block on getting those words, or ship placeholders flagged for review.
- **Conflict: instant-apply filters vs mobile drawer.** The drawer commits on Apply. Desktop may apply on change. Do not mix patterns inside one component.

## MVP Definition

### Launch With (v1)

- [ ] API client, tagged cache, webhook, last-good-data fallback, currency formatter. Everything depends on it
- [ ] All Items: URL-driven filters (type, brand, size, colour, era, condition, department, price), `q`, sort, numbered pagination, active chips, result count
- [ ] Mobile filter drawer (native `<dialog>` + GET form)
- [ ] Facet labels, size ladder, counts shown only when unfiltered
- [ ] Item page: gallery with lightbox, measurements, condition with key, attributes, price, item code, "available on Vinted / eBay" plus profile buttons, "how buying works" line
- [ ] Real 404 for gone items, custom not-found page with newest drops
- [ ] Empty states: no results, empty store, page past end, empty home sections hidden
- [ ] Metadata, OG, JSON-LD Product (always `InStock`, `UsedCondition`), sitemap, robots, `noindex` on filtered listings
- [ ] Home, Just Dropped, Brands, About, Contact as in PROJECT
- [ ] Decorative bag / account / wishlist icons made non-interactive

### Add After Validation (v1.x)

- [ ] "New" badge, more-from-brand and similar rails, second photo on hover, share button. Trigger: core pages stable, cheap wins
- [ ] Measurement range filters and "How we measure" guide. Trigger: shoppers asking about fit, or seller measuring consistently
- [ ] Indexable `/brands/[slug]` landing pages. Trigger: search console shows brand queries
- [ ] Brand search in the facet. Trigger: brand list too long to scan

### Future Consideration (v2+)

- [ ] Per-item "Buy on Vinted / eBay" button. Needs a How many API field
- [ ] Sold-brand tier on the logo strip and any "recently sold" proof. Needs How many to expose sold brands
- [ ] Checkout, with stock reservation for one-offs. Out of scope for v1
- [ ] Working wishlist (localStorage first) with removed-item handling
- [ ] Branded generated OG images
- [ ] Contextual facet counts. Needs `/filters` to accept the current filters

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| API client, cache, fallback | HIGH | MEDIUM | P1 |
| URL param parse/validate | HIGH | MEDIUM | P1 |
| Filter sidebar + sort + search + paging | HIGH | MEDIUM | P1 |
| Mobile filter drawer | HIGH | MEDIUM | P1 |
| Item page core (gallery, measurements, condition, code) | HIGH | MEDIUM | P1 |
| 404 for gone items + empty states | HIGH | LOW | P1 |
| Metadata, OG, JSON-LD, sitemap, robots, noindex rule | HIGH | LOW | P1 |
| Platform profile buttons + "how buying works" | HIGH | LOW | P1 |
| Condition key ("How we grade") | MEDIUM | LOW | P1 (needs seller words) |
| Non-interactive decorative icons | MEDIUM | LOW | P1 |
| "New" badge | MEDIUM | LOW | P2 |
| More from brand / similar | MEDIUM | LOW | P2 |
| Measurement range filters | MEDIUM | MEDIUM | P2 |
| "How we measure" guide | MEDIUM | LOW | P2 |
| Hover second photo, share button | LOW | LOW | P2 |
| Brand landing pages | MEDIUM | MEDIUM | P3 |
| Live count in drawer, typeahead, generated OG | LOW | MEDIUM | P3 |

**Priority key:** P1 must have for launch. P2 should have, add when possible. P3 nice to have, later.

## Competitor Feature Analysis

Reference patterns only, from general knowledge of this niche. Not a measured audit (LOW to MEDIUM confidence).

| Feature | Marketplaces (Vinted, Depop, eBay) | Curated vintage shops (Shopify-style) | Our Approach |
|---------|------------------------------------|---------------------------------------|--------------|
| Filters | Heavy: size, brand, condition, price, sort | Brand, size, type, price, sold-out toggle | Same set via the API. No sold toggle (API cannot) |
| Condition | Platform scale with free text | Own scale (Excellent, Very Good, Good) plus flaw notes | A / AB / B in brand words with a key. No per-item notes (API gap), so lean on photos |
| Measurements | Often missing or in free text | Standard: flat pit to pit, length, shoulder, sleeve | Pit to pit and length from the API, labelled flat, cm |
| Sold items | Shown as sold | Often kept on page marked sold, or 404 | Real 404 (API removes them) |
| Buying | On platform | On site checkout | Link out to the shop's profile with the item code |
| Wishlist and alerts | Core | Common | Deferred, icons decorative |

## Open Questions for Requirements

1. **Condition grade meanings.** What do A, AB and B mean in Blacktail's words? Needed before launch copy is final.
2. **Size ladder and tops/bottoms mix.** Are numeric sizes (waist sizes, shoe sizes) in the catalogue? Decides whether the ladder needs a numeric branch.
3. **Inches as well as cm?** A config choice, depends on the shop's market.
4. **Do all items have measurements?** If many do not, the block's absent state matters more.
5. **Seller practice for the item code.** Will the code go in Vinted / eBay listings? If not, the site converts poorly.
6. **Which API additions to request from How many** (per-item platform link, sold brands, contextual facet counts, an `updatedAt`). These unblock v2 features.

## Sources

- Google Search Central, Merchant listing (Product, Offer) structured data: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing (HIGH). Source for required and recommended properties, availability values, `UsedCondition` example, and the rule that merchant listing eligibility is limited to pages where shoppers can buy.
- Google Search Central, HTTP status codes: https://developers.google.com/search/docs/crawling-indexing/http-network-errors (HIGH). Source for 404 and 410 being treated the same and for soft 404 definition.
- Vintage Fashion Guild code of practice: https://vintagefashionguild.org/vfg-code-of-practice (MEDIUM). Source for written measurements and flaw disclosure norms.
- Vintage Vixen, grading condition of vintage clothing: https://www.vintagevixen.com/pages/grading-condition-of-vintage-clothing (MEDIUM). Fixed-scale grading examples and photographed flaws.
- Defunkd, grading and measuring: https://www.defunkd.com/blog/2014/06/08/grading-and-measuring/ (MEDIUM). Grading modifiers and measuring conventions.
- Yoast, out-of-stock products and SEO: https://yoast.com/out-of-stock-products-ecommerce-seo/ (MEDIUM). Out-of-stock handling options, used only as context. The 404 recommendation rests on Google's docs plus the API's behaviour.
- Project inputs: `C:\Git\blacktail\.planning\PROJECT.md` and `C:\Git\blacktail\docs\refs\issues.json` (issues #1, #2, #3) (HIGH).

---
*Feature research for: pre-loved branded menswear storefront (read-only, link-out buying)*
*Researched: 2026-10-26*
