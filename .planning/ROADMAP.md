# Roadmap: Blacktail

## Overview

Blacktail goes from an empty repo to a launched Blacktail Archive storefront in four vertical slices, each deployed to Cloudflare Workers. Phase 1 proves the riskiest part first: a deployed Worker that shows real How many stock and refreshes within seconds of a signed webhook (R2 + D1 tag cache + DO queue). Phase 2 puts the Blacktail Archive look on top and delivers the full All Items catalogue. Phase 3 adds item pages and brand pages, so a shopper can decide on a piece and go buy it on Vinted or eBay. Phase 4 finishes the mockup home page, the story and contact pages, site-wide SEO and the template onboarding doc. The visual target throughout is `docs/refs/Blacktail Archive - Branding.pdf`.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Live Stock Skeleton** - Deployed Worker shows real How many stock and refreshes within seconds of a signed webhook
- [ ] **Phase 2: Branded Catalogue** - Blacktail Archive look, header and footer, and the full All Items browse, filter, search, sort and paging
- [ ] **Phase 3: Item and Brand Pages** - Item page with gallery, details and where to buy, real 404s, JSON-LD, and Brands pages with logos
- [ ] **Phase 4: Home and Launch** - Mockup home page, Just Dropped, About and Contact, site-wide SEO, and the second-shop onboarding doc

## Phase Details

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

**Plans:** 3/4 plans executed

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Walking skeleton: live item list through the tagged fetch and signed-webhook refresh, proven on `next start` against a mock API

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Hardening: env fail-fast, webhook/client unit tests, COPY empty and error screens, Cache Components and em-dash guards, lint and typecheck

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — R2 + D1 tag cache + DO queue config, CI check and worker jobs proving the round trip on workerd, PR A

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 01-04-PLAN.md — Owner Cloudflare/GitHub/How many setup, deploy workflow on push to main, PR B, live checks on the deployed Worker

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

**Plans**: TBD
**UI hint**: yes

### Phase 3: Item and Brand Pages

**Goal**: As a shopper, I want to open any piece to see its photos, condition, measurements and where to buy it, and to browse by brand, so that I can decide on a piece and go buy it on Vinted or eBay.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: ITEM-01, ITEM-02, ITEM-03, ITEM-04, ITEM-05, ITEM-06, SEO-02, BRAND-01, BRAND-03, BRAND-04
**Success Criteria** (what must be TRUE):
  1. Opening an item from the grid shows a gallery of full-size photos (cover first, in the seller's order) with brand, title, price, size, colour, era, department, the condition in words (A Excellent, AB Very good, B Good) and pit-to-pit and length when the item has them
  2. The item page says the piece is listed on Vinted and eBay with links to the shop's profiles from config (no buy button, no checkout), and shows a "More from this brand" row
  3. A sold, hidden or unknown item returns a real 404 status with a branded page showing the newest drops, including on the deployed site right after the webhook for a piece that just sold
  4. Item pages carry JSON-LD `Product` data (name, image, price, currency, `InStock`, `UsedCondition`) that passes Google's Rich Results Test
  5. A shopper can open a Brands page of in-stock brands shown as their logos (or the brand name as text when there is no logo), and open `/brands/[slug]` to see that brand's in-stock items

**Plans**: TBD
**UI hint**: yes

### Phase 4: Home and Launch

**Goal**: As a shopper, I want to land on a home page that matches the Blacktail Archive mockup, see the latest drops and read the shop's story and contact details, so that I trust the shop and come back for new pieces.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: HOME-01, HOME-02, HOME-03, BRAND-02, CAT-11, PAGE-01, PAGE-02, SEO-01, SEO-03, TMPL-02
**Success Criteria** (what must be TRUE):
  1. The home page matches the Just Dropped mockup on desktop and mobile: hero, brand strip, Just Dropped carousel, two promo banners, shop by category tiles, the "a more conscious way to shop" story band and the footer; a section with nothing to show is hidden, and lifestyle images come from `public/images/` slots with placeholders until real photos arrive
  2. The brand strip lists brands in stock first, then sold-before brands (empty until How many provides them), then the default order from config
  3. A shopper can open a Just Dropped page of the newest items, an About / Our story page, and a Contact page with the shop's contact details and shop links (no form)
  4. Every page has its own title, description and Open Graph tags (item links preview with the item's name and cover photo); a sitemap lists all pages and in-stock items and refreshes with the store tag; robots blocks indexing outside production
  5. Following the onboarding doc, someone can deploy the template for another shop (env, Cloudflare R2, D1 and Worker setup, assets) without editing any component

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Live Stock Skeleton | 3/4 | In Progress | - |
| 2. Branded Catalogue | 0/TBD | Not started | - |
| 3. Item and Brand Pages | 0/TBD | Not started | - |
| 4. Home and Launch | 0/TBD | Not started | - |
