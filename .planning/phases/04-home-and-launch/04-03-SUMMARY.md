---
phase: 04-home-and-launch
plan: 03
subsystem: home-page
tags: [home, brand-strip, category-tiles, sold-before-seam, nextjs]
requires: ["04-02"]
provides:
  - "Home brand strip: in stock, then sold before, then the default order, capped at 16"
  - "SOLD_BEFORE_BRANDS (empty until BRAND-05) and brandBySlug: a sold-before brand page renders the empty catalogue, unknown slugs still 404"
  - "Shop-by-category tiles from SHOP.home.categories that hide when their type has no stock"
  - "SHOP.defaultBrandOrder (PENDING-OWNER D-08), HOME.stripBrands, HOME.categoryTiles, COPY.home.viewAllBrands"
  - "category-1.jpg to category-4.jpg placeholder slots with a slot test"
affects: [04-04, 04-05]
tech-stack:
  added: []
  patterns:
    - "Ordering decided by pure tested functions in src/lib/homeSections.ts; components only render their output"
    - "Home data sections share the React-cached /filters read with the Header"
key-files:
  created:
    - src/lib/homeSections.ts
    - src/lib/homeSections.test.ts
    - src/components/home/BrandStrip.tsx
    - src/components/home/BrandStrip.test.ts
    - src/components/home/CategoryTiles.tsx
    - public/images/category-1.jpg
    - public/images/category-2.jpg
    - public/images/category-3.jpg
    - public/images/category-4.jpg
  modified:
    - src/lib/brands.ts
    - src/lib/brands.test.ts
    - src/app/brands/[slug]/page.tsx
    - src/app/page.tsx
    - src/shop/config.ts
    - src/lib/config.ts
    - src/lib/copy.ts
    - src/lib/images.test.ts
decisions:
  - "Brand strip label and View all brands link are rendered once and placed with CSS order, so there is no duplicated markup between phone and desktop layouts"
  - "The tile list in src/shop/config.ts is a plain literal array; CategoryTile lives in homeSections.ts and the config stays free of lib imports"
metrics:
  duration: "about 60 minutes (one rate-limit stop)"
  completed: 2026-11-03
status: complete
commits: 2
plan_head_before: 52c8efe83697e0fc5f87308985d37ac858aa9b5d
plan_head_after: ab94acc650841ff968a180eeb117b386158604dc
actuals:
  tokens: 9000
  tasks: 2
  commits: 2
---

# Phase 4 Plan 03: Brand strip and category tiles Summary

The home page now has every mockup section in order: a scroll-snap brand strip (in stock, sold before, then the shop's default order) after the hero, and shop-by-category tiles that hide per type with no stock, before the story band.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 (tracer) | Brand strip with stripBrands, SOLD_BEFORE_BRANDS and brandBySlug | 59228a5 |
| 2 | Category tiles, visibleTiles, category-1..4.jpg slots | ab94acc |

## What was built

- `stripBrands(inStock, soldBefore, defaultOrder)`: both tiers go through `brandIndex` (Phase 3 dedupe and empty-slug rules), sold-before names already in stock are dropped, each tier is stable-sorted by its slug's position in the default order (so Levi's matches LEVIS), then sliced to 16. A default-order brand with no stock and no sold history is never added (D-21).
- `SOLD_BEFORE_BRANDS` (empty, BRAND-05) and `brandBySlug` in `src/lib/brands.ts`; `/brands/[slug]` resolves through it, so a sold-before brand opens its empty catalogue while any other slug still 404s before an `/items` call.
- `BrandStrip` / `BrandRow`: one row in its own frame, `snap-x snap-mandatory`, no arrows, no script; logo only from a `BRAND_LOGOS` entry (mix-blend-multiply), else the name in Bodoni; View all brands outside the scroller; the whole band is hidden on no brands or a failed read.
- `visibleTiles` and `CategoryTiles`: tiles link to `/shop?type=<code>` built with `URLSearchParams`; columns equal the visible tile count from 1024px, two columns below with an odd last tile spanning both; Explore all pieces link to `/shop`.
- `SHOP.defaultBrandOrder` (PENDING-OWNER D-08), `SHOP.home.brands`, `SHOP.home.categories` (Jackets, Knitwear, Denim, Shirts, PENDING-OWNER D-05 with D-22 cited).

## Verification

- `npm test` (263 tests), `npm run lint`, `npm run typecheck` pass.
- Task 1 harness (build against the mock, `next start`): the build made zero API calls; strip links are exactly acme, mock-brand, northwind in order; View all brands present; `/brands/acme` 200, `/brands/not-a-brand` 404; `prove-freshness --mock --outage` all PASS.
- Task 2 harness: tile links are exactly jacket, knit, shirt (Denim hidden, no `category-3.jpg` in the HTML); Explore all pieces link present; sections in order hero, brand strip, Just Dropped, banner 1, banner 2, categories, story; `category-1.jpg` served 200; `prove-freshness --mock --outage` all PASS (the outage run logs the expected `/filters 500` warnings).
- Not verified here (no browser driven): visual layout at 320px to 1280px, the strip header-row to single-row switch at 1024px, 2-line label clamping, and the `last:odd:` tile spanning on a real viewport. The logo-cell fit (all 30 logos inside 112 x 44px) is a plan backstop, unchecked.

## Deviations from Plan

**1. [Process] Worktree base reset.** The worktree started on `a4718f0` (main), not a descendant of `52c8efe`; reset to `52c8efe` as the startup check allows, then `npm ci`.

**2. [Process] Rate-limit stop.** The run stopped between writing the Task 2 files and committing; resumed from the uncommitted tree, checked every file against the plan, then committed. No code change from the stop.

Otherwise the plan was executed as written (17 files against the usual 5 per task was the owner-accepted deviation noted in the plan).

## Known Stubs

- `public/images/category-1.jpg` to `category-4.jpg` are tonal Stone-to-Sand placeholders by design (D-01), 3 to 4 KB each, made by an uncommitted scratch sharp script; the owner replaces each by overwriting the file. They belong in the slots table of `docs/ONBOARDING.md` (Plan 05).
- `SHOP.defaultBrandOrder` and the category tile list are PENDING-OWNER values (D-08, D-05).
- `SOLD_BEFORE_BRANDS` is empty until How many supplies sold-before brands (BRAND-05); intended seam.

## Threat Flags

None. Logo src only from `BRAND_LOGOS`, brand hrefs via `ROUTES.brand(brandSlug)`, tile hrefs and images from config only, `brandBySlug` resolves only against cached `/filters` names and the committed list (T-04-08, T-04-09, T-04-17).

## Self-Check: PASSED

- Created files present: homeSections.ts (+ test), BrandStrip.tsx (+ test), CategoryTiles.tsx, four category JPEGs.
- Commits 59228a5 and ab94acc are on the branch (2 commits measured from `52c8efe`).
