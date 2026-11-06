# Roadmap: Blacktail

## Milestones

- ✅ **v1.0 Blacktail Archive launch** - Phases 1-4 (shipped 2026-11-03)
- 🚧 **v1.1 How many API fields** - Phases 5-6 (in progress)

## Overview

Blacktail went from an empty repo to a launched Blacktail Archive storefront in four vertical slices (v1.0), each deployed to Cloudflare Workers. Phase 1 proved the riskiest part first: a deployed Worker that shows real How many stock and refreshes within seconds of a signed webhook (R2 + D1 tag cache + DO queue). Phase 2 put the Blacktail Archive look on top and delivered the full All Items catalogue. Phase 3 added item pages and brand pages. Phase 4 finished the mockup home page, the story and contact pages, site-wide SEO and the template onboarding doc. The visual target throughout is `docs/refs/Blacktail Archive - Branding.pdf`.

v1.1 starts using the fields How many has since added to its public API. Phase 5 keeps a sold piece's page alive (a Sold mark instead of a 404) and sends buyers to the exact Vinted or eBay listing of each piece. Phase 6 fills the sold-before brand tier from `/filters`, puts the seller's spotlight picks first in the Just Dropped carousel, and corrects the docs to the real rate limit.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 Blacktail Archive launch (Phases 1-4) - SHIPPED 2026-11-03</summary>

- [x] **Phase 1: Live Stock Skeleton** - Deployed Worker shows real How many stock and refreshes within seconds of a signed webhook (completed 2026-10-26)
- [x] **Phase 2: Branded Catalogue** - Blacktail Archive look, header and footer, and the full All Items browse, filter, search, sort and paging (completed 2026-11-02)
- [x] **Phase 3: Item and Brand Pages** - Item page with gallery, details and where to buy, real 404s, JSON-LD, and Brands pages with logos (completed 2026-11-03)
- [x] **Phase 4: Home and Launch** - Mockup home page, Just Dropped, About and Contact, site-wide SEO, and the second-shop onboarding doc (completed 2026-11-03)

### Phase 1: Live Stock Skeleton

**Goal**: As a shopper, I want to see the shop's current in-stock pieces on the live site, refreshed within seconds of any stock change, so that I never chase a piece that has already sold.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. Opening the deployed Worker URL shows the shop's current in-stock items read from the How many API (a plain, unstyled list is enough), and a push to main redeploys it from CI
  2. After stock changes in How many and its signed `store.updated` webhook arrives, the next visit to the deployed site shows the change within seconds; with no webhook, the change still shows within about 10 minutes
  3. A webhook with a bad signature, an old timestamp or a malformed body gets a 401 (never a 500), and a failing API never replaces the last good data with a cached error
  4. Starting the app with a missing or invalid env var stops it with a clear list of the problems, and a production build makes no per-item API calls while repeat page views are served from cache
  5. Every PR runs lint, typecheck, tests and an OpenNext worker build, and fails if `cacheComponents`, `'use cache'`, `cacheTag`, `cacheLife` or an em dash in `COPY` appears
  6. Every page of the deployed site sends `noindex` (robots meta and `X-Robots-Tag`), so the unfinished site isn't indexed before Phase 4 makes indexing depend on the environment (SEO-03)

**Plans:** 4/4 plans complete

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Walking skeleton: live item list through the tagged fetch and signed-webhook refresh, proven on `next start` against a mock API

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Hardening: env fail-fast, webhook/client unit tests, COPY empty and error screens, Cache Components and em-dash guards, lint and typecheck

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — R2 + D1 tag cache + DO queue config, CI check and worker jobs proving the round trip on workerd, PR A

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-04-PLAN.md — Owner Cloudflare/GitHub/How many setup, deploy workflow on push to main, PR B, live checks on the deployed Worker

**Research**: Highest-risk phase. Run `/gsd-plan-phase --research-phase 1` (research only) before planning, and prove the freshness round trip on a deployed Worker (D1 tag table, binding names, `WORKER_SELF_REFERENCE`, `{ expire: 0 }` vs `'max'`, `force-cache` after `await searchParams`).

### Phase 2: Branded Catalogue

**Goal**: As a shopper, I want to browse, filter, search, sort and page through the shop's in-stock pieces in the Blacktail Archive look on desktop and phone, so that I can quickly find pieces in my size, brand and budget.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08, CAT-09, CAT-10, SEO-04, TMPL-01
**Success Criteria** (what must be TRUE):
  1. Every page uses the Blacktail Archive look from the mockups: the Forest, Olive, Stone, Sand and Ivory palette, Bodoni Moda headings and Montserrat text, a header with logo, nav, search and decorative bag, account and wishlist icons, and a footer with contact details and Vinted and eBay profile links; all of it comes from the per-shop folder and config, and a test fails if shop-specific strings appear anywhere else
  2. A shopper can open All Items and see a grid of cards (cover photo, brand, title, colour and size, price in the shop's currency, a "New" badge on recent pieces) that does not shift while photos load
  3. A shopper can combine multi-select filters (type, brand, size, colour, era, condition, department, price range, plus pit-to-pit and length when the shop has measurements), search by words, sort by newest or price, and step through numbered pages of 24, with any change going back to page 1
  4. A filtered view's URL can be shared or bookmarked and reopens the same results; junk values in the URL are dropped instead of breaking the page; chosen filters show as removable chips with the result count; an empty result offers a way to clear filters; filtered, searched or sorted listings are `noindex,follow` with a canonical URL from `SITE_URL`
  5. On a phone, a menu opens the nav, filters open in a drawer with an Apply button, and no page scrolls sideways

**Plans:** 10/10 plans complete

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Tracer: / redirects to /shop; every catalogue param is cleaned against /filters into one canonical API query (mock and freshness proof on /shop)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02-PLAN.md — Package check, Tailwind tokens and self-hosted fonts in src/shop, All Items banner

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 02-03-PLAN.md — src/shop seam (contact, Vinted, eBay, socials, colours), COPY deck, code labels and the shop-string guard
- [x] 02-04-PLAN.md — One money formatter, the New-badge rule and the paging helpers, test first

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 02-05-PLAN.md — Item cards (NEW badge, no layout shift), numbered pager with past-the-end redirect, loading skeleton, streaming-aware outage proof
- [x] 02-06-PLAN.md — Header (logo, nav, Shop and Brands dropdowns, search) and phone menu

**Wave 5** *(blocked on 02-05 and 02-06)*
- [x] 02-07-PLAN.md — Footer (contact, Vinted, eBay, socials, newsletter mock) and the on-brand error screen
- [x] 02-08-PLAN.md — Result count, removable chips, empty states, sort with pending state, noindex,follow and SITE_URL canonical

**Wave 6** *(blocked on 02-06 and 02-08)*
- [x] 02-09-PLAN.md — Filter panel (checkbox groups, swatches, range sliders, instant apply) and the phone filter drawer

**Wave 7** *(blocked on Wave 6 completion and 02-07)*
- [x] 02-10-PLAN.md — CI worker job and deploy smoke follow /shop; phase PR opened with both checks green

**UI hint**: yes

### Phase 3: Item and Brand Pages

**Goal**: As a shopper, I want to open any piece to see its photos, condition, measurements and where to buy it, and to browse by brand, so that I can decide on a piece and go buy it on Vinted or eBay.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: ITEM-01, ITEM-02, ITEM-03, ITEM-04, ITEM-05, ITEM-06, SEO-02, BRAND-01, BRAND-03, BRAND-04
**Success Criteria** (what must be TRUE):
  1. Opening an item from the grid shows a gallery of full-size photos (cover first, in the seller's order) with brand, title, price, size, colour, era, department, the condition in words (A Excellent, AB Very good, B Good) and pit-to-pit and length when the item has them
  2. The item page says the piece is listed on Vinted and eBay with links to the shop's profiles from config (no buy button, no checkout), and shows a "More from this brand" row
  3. A sold, hidden or unknown item returns a real 404 status with a branded page showing the newest drops, including on the deployed site right after the webhook for a piece that just sold (v1.1 Phase 5 changes this for sold pieces: they keep a page)
  4. Item pages carry JSON-LD `Product` data (name, image, price, currency, `InStock`, `UsedCondition`) that passes Google's Rich Results Test
  5. A shopper can open a Brands page of in-stock brands shown as their logos (or the brand name as text when there is no logo), and open `/brands/[slug]` to see that brand's in-stock items

**Plans:** 4/4 plans complete

Plans:
**Wave 1**
- [x] 03-01-PLAN.md — Tracer: item page with details, where to buy and a real 404 after the webhook

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-02-PLAN.md — Photo gallery with lightbox, brand link and the "More from this brand" row

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 03-03-PLAN.md — Brands page and `/brands/[slug]` reusing the catalogue with the brand locked

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 03-04-PLAN.md — CI worker proof of item and brand pages on workerd, phase PR

**UI hint**: yes

### Phase 4: Home and Launch

**Goal**: As a shopper, I want to land on a home page that matches the Blacktail Archive mockup, see the latest drops and read the shop's story and contact details, so that I trust the shop and come back for new pieces.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: HOME-01, HOME-02, HOME-03, BRAND-02, CAT-11, PAGE-01, PAGE-02, SEO-01, SEO-03, TMPL-01, TMPL-02
**Success Criteria** (what must be TRUE):
  1. The home page matches the Just Dropped mockup on desktop and mobile: hero, brand strip, Just Dropped carousel, two promo banners, shop by category tiles, the "a more conscious way to shop" story band and the footer; a section with nothing to show is hidden, and lifestyle images come from `public/images/` slots with placeholders until real photos arrive
  2. The brand strip lists brands in stock first, then sold-before brands (empty until How many provides them), then the default order from config
  3. A shopper can open a Just Dropped page of the newest items, an About / Our story page, and a Contact page with the shop's contact details and shop links (no form)
  4. Every page has its own title, description and Open Graph tags (item links preview with the item's name and cover photo); a sitemap lists all pages and in-stock items and refreshes with the store tag; robots blocks indexing outside production
  5. Following the onboarding doc, someone can deploy the template for another shop (env, Cloudflare R2, D1 and Worker setup, assets) without editing any component

**Plans:** 5/5 plans complete

Plans:
**Wave 1**
- [x] 04-01-PLAN.md — Tracer: ALLOW_INDEXING drives robots.txt, robots meta and the X-Robots-Tag header; dynamic sitemap through the tagged client; pageMetadata (title, description, Open Graph) on the existing pages; og-default placeholder

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 04-02-PLAN.md — Tracer: / is the home page (redirect removed): hero, Just Dropped carousel of the 10 newest with arrows, two promo banners, story band, fixed image slots with placeholders, New badge at 14 days

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 04-03-PLAN.md — Tracer: brand strip (in stock, sold before, default order) and shop-by-category tiles that hide without stock, both from tested pure functions and shop config

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 04-04-PLAN.md — Tracer: /just-dropped is the catalogue locked to newest; About and Contact from src/shop (no form); the built-pages stopgap is deleted

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 04-05-PLAN.md — Tracer: workerd proof of home, pages, robots and sitemap (flag off and on), phase PR; one-switch deploy, workers.dev and preview URLs off; docs/ONBOARDING.md with a drift test; UAT comment

**UI hint**: yes

</details>

### 🚧 v1.1 How many API fields (In Progress)

**Milestone Goal:** Use the fields How many added to its public API, so sold pieces keep a page, buyers reach the exact listing, and the home page uses the seller's own picks.

- [ ] **Phase 5: Sold Item Pages and Listing Links** - A sold piece keeps a page with a Sold mark instead of a 404, and each piece links to its exact Vinted or eBay listing (closes #13)
- [ ] **Phase 6: Sold-Before Brands, Spotlight and Docs** - Brand strip filled from `soldBrands`, spotlight pieces first in the Just Dropped carousel, and docs that state the 600 requests a minute limit (closes #19)

#### Phase 5: Sold Item Pages and Listing Links

**Goal**: As a shopper, I want a sold piece's address to keep working as a clear Sold page, and a piece that is for sale to send me to its exact Vinted or eBay listing, so that shared links never dead-end and I land on the right listing.
**Depends on**: Phase 4
**Requirements**: SOLD-01, SOLD-02, SOLD-03, SOLD-04, LINK-01, LINK-02
**Closes**: GitHub issue #13
**Success Criteria** (what must be TRUE):
  1. Opening a sold piece's address returns 200 with its photos, title and details and a Sold mark showing the sold date from `soldAt`, with no where-to-buy block and no price call to action
  2. A sold item page carries JSON-LD availability `SoldOut` and `noindex`, and the piece appears nowhere else: not in the sitemap, All Items, Just Dropped or "More from this brand"
  3. A hidden, deleted or unknown item, or a code of the wrong shape, still returns a real 404 with the newest drops, including on the deployed site right after the webhook for a piece that was just hidden or deleted
  4. A piece with `listings` shows one button per listing, labelled with the platform name from config, and each opens that exact listing in a new tab
  5. A piece with an empty `listings` shows the shop's Vinted and eBay profile links from config, as it does today

**Plans:** 2/4 plans executed

Plans:
**Wave 1**
- [x] 05-01-PLAN.md — Tracer: a just-sold piece flips to a 200 Sold page (Sold on date, sold panel, SoldOut, noindex, out of /shop and More from) and a just-hidden piece to a 404 after the webhook; a sold piece with no price, date or photos still renders

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 05-02-PLAN.md — Tracer: the Sold badge on the cover photo (also with no photos); the sold edge cases pinned by unit tests

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 05-03-PLAN.md — Tracer: per-item "Buy on <Platform>" buttons to the exact https listings, profile links when there are none

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 05-04-PLAN.md — Tracer: workerd proof of the Sold flip, the sitemap exclusion, the hidden 404 and the listing buttons; phase PR (Closes #13) and the Phase 5 UAT comment

**UI hint**: yes

#### Phase 6: Sold-Before Brands, Spotlight and Docs

**Goal**: As a shopper, I want the home page to follow the seller's own data (brands the shop has sold before, and the pieces the seller spotlights), so that the front of the shop shows what it is known for and what the seller wants me to see first. Docs and comments state the real rate limit.
**Depends on**: Phase 4 (does not need Phase 5)
**Requirements**: BRAND-05, HOME-05, DOC-01
**Closes**: GitHub issue #19
**Success Criteria** (what must be TRUE):
  1. The brand strip on the home page lists brands in stock first, then brands sold before (from `/filters` `soldBrands`), then the default order from config, and a brand with no logo file still shows as its name
  2. The Just Dropped carousel on the home page shows the seller's spotlight pieces first, then fills with the newest pieces up to the carousel size, and no piece appears twice
  3. A shop with no spotlight pieces or no sold brands sees the home page as in v1.0: a newest-first carousel and a strip of in-stock brands then the default order, with no gap and no error
  4. Searching the docs, code comments and scripts for the rate limit finds "600 uncached requests a minute per IP" and no mention of 3000

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Live Stock Skeleton | v1.0 | 4/4 | Complete | 2026-10-26 |
| 2. Branded Catalogue | v1.0 | 10/10 | Complete | 2026-11-02 |
| 3. Item and Brand Pages | v1.0 | 4/4 | Complete | 2026-11-03 |
| 4. Home and Launch | v1.0 | 5/5 | Complete | 2026-11-03 |
| 5. Sold Item Pages and Listing Links | v1.1 | 2/4 | In Progress | - |
| 6. Sold-Before Brands, Spotlight and Docs | v1.1 | 0/0 | Not started | - |
