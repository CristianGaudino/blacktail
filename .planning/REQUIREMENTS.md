# Requirements: Blacktail

**Defined:** 2026-11-06
**Core Value:** Shoppers see the shop's current in-stock pieces, always up to date with How many, in a storefront that looks like the Blacktail Archive mockups.

The v1.0 requirements are archived in `.planning/milestones/v1.0-REQUIREMENTS.md`.

## v1.1 Requirements

Uses the fields How many added to its public API: `listings`, `status: "sold"` with `soldAt`, `soldBrands` on `/filters`, and `spotlight`.

### Sold items

- [x] **SOLD-01**: A sold piece's item page returns 200 with its photos, title and details, and a Sold mark with the sold date from `soldAt`
- [x] **SOLD-02**: A sold item page shows no where-to-buy block and no price call to action, and its JSON-LD availability is `SoldOut`
- [x] **SOLD-03**: A sold item page is `noindex` and left out of the sitemap, the catalogue, Just Dropped and More from this brand
- [x] **SOLD-04**: A hidden, deleted or unknown item, or a code of the wrong shape, is still a real 404 with the newest drops, including right after the webhook

### Listing links

- [x] **LINK-01**: An item with `listings` shows one button per listing (platform name from config) that opens that exact listing in a new tab
- [x] **LINK-02**: An item with an empty `listings` falls back to the shop's Vinted and eBay profile links from config, as today

### Brands

- [ ] **BRAND-05**: The brand strip's second tier is filled from `/filters` `soldBrands` (in stock first, then sold before, then the default order)

### Home

- [ ] **HOME-05**: The Just Dropped carousel shows spotlight pieces first (`?spotlight=true`), then fills with the newest pieces up to the carousel size

### Docs

- [ ] **DOC-01**: Docs, comments and scripts say the rate limit is 600 uncached requests a minute per IP, and nothing still says 3000

## Future Requirements

- **BUY-02**: Checkout with a short stock reservation, so a one-off item can't sell twice
- **ENG-01**: A working wishlist saved in the browser
- **ENG-02**: Generated Open Graph images per item
- **ENG-03**: Facet counts that narrow as filters are chosen, computed on the site from `/items` (How many will not build narrowing facets)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sold archive page and sold listings in the catalogue | Sold items stay out of `/items` and `/filters`; a sold piece is only reachable by its own address |
| Stock counters and urgency timers | Fake urgency doesn't suit the brand |
| Showing what a piece sold for | The API only gives the asking price, and it must never be presented as a sale price |
| Narrowing facet counts | Deferred (ENG-03) |
| Checkout, bag and payments | Buyers still go to Vinted and eBay |
| Direct database access | Blacktail only uses the public API |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SOLD-01 | Phase 5 | Complete |
| SOLD-02 | Phase 5 | Complete |
| SOLD-03 | Phase 5 | Complete |
| SOLD-04 | Phase 5 | Complete |
| LINK-01 | Phase 5 | Complete |
| LINK-02 | Phase 5 | Complete |
| BRAND-05 | Phase 6 | Pending |
| HOME-05 | Phase 6 | Pending |
| DOC-01 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 9 total
- Mapped to phases: 9 (Phase 5: 6, Phase 6: 3)
- Unmapped: 0

---
*Requirements defined: 2026-11-06*
*Last updated: 2026-11-06 after creating the v1.1 roadmap*
