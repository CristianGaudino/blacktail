---
phase: 03-item-and-brand-pages
plan: 03
subsystem: brand-pages
tags: [nextjs, brands, catalogue, basePath, logo-manifest]
requires: [03-01, 03-02]
provides:
  - CataloguePage: the one catalogue body shared by /shop and /brands/[slug]
  - /brands/[slug]: catalogue locked to one brand, with its own search box and a 404 for an unknown slug
  - /brands: A to Z tiles, logo when listed in BRAND_LOGOS, else the name in Bodoni
  - brandIndex(), BRAND_LOGOS manifest pinned to public/brands by a test
  - basePath on shopHref, pageHref, canonicalUrl, FilterPanel, FilterDrawer, SortSelect, FilterChips, Pager
affects: [03-04]
tech-stack:
  added: []
  patterns: [brand lock by parsing against { ...filters, brand: [] } and adding the brand to the API query only, committed logo manifest instead of run-time fs read]
key-files:
  created:
    - src/components/catalogue/CataloguePage.tsx
    - src/components/catalogue/CatalogueSearch.tsx
    - src/app/brands/page.tsx
    - src/app/brands/[slug]/page.tsx
    - src/components/brands/BrandGrid.tsx
    - src/components/brands/BrandGrid.test.ts
    - src/shop/brand-logos.ts
  modified:
    - src/app/shop/page.tsx
    - src/lib/brands.ts
    - src/lib/brands.test.ts
    - src/lib/params.ts
    - src/lib/params.test.ts
    - src/lib/seo.ts
    - src/lib/seo.test.ts
    - src/lib/copy.ts
    - src/lib/routes.ts
    - src/lib/utils.test.ts
    - src/components/catalogue/CatalogueBanner.tsx
    - src/components/catalogue/FilterPanel.tsx
    - src/components/catalogue/FilterPanel.test.ts
    - src/components/catalogue/FilterDrawer.tsx
    - src/components/catalogue/SortSelect.tsx
    - src/components/catalogue/FilterChips.tsx
    - src/components/catalogue/FilterChips.test.ts
    - src/components/catalogue/Pager.tsx
    - src/components/catalogue/Pager.test.ts
    - src/components/layout/Header.tsx
key-decisions:
  - "Brand lock: the query is parsed against filters with an empty brand list, so a URL brand param is dropped and the Brand group/chip never render; the brand is added to the API query string only"
  - "Logo existence is a committed BRAND_LOGOS list checked against public/brands by a test (no fs read at run time)"
  - "Name collisions (Stussy and Stuessy forms) keep the first name in API order, one entry per slug"
status: complete
commits: 2
plan_head_before: c4e9518503cb429a6aaf6eb8141dc86d0e05d91d
plan_head_after: 2d003d1bb57909561cb5b50fc4a97fc594d56935
actuals:
  tokens: 28000
  tasks: 2
  commits: 2
---

# Phase 3 Plan 3: Brand pages Summary

/brands/<slug> is the whole /shop catalogue locked to one brand through a single shared CataloguePage, /brands shows in-stock brands as logo or name tiles, and the header Brands menu now links the brand pages.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Tracer: /brands/[slug] is the /shop catalogue locked to one brand | 7d32b39 |
| 2 | Brands page tiles, logo manifest, header Brands menu | 2d003d1 |

## Verification

- `npm test` 211 passed (24 files), `npm run lint` and `npm run typecheck` clean after each task.
- Task 1 harness (next build with the mock down, mock on 4010, `next start` on 3000, `prove-freshness --outage`) exit 0: `B=200`, API saw exactly `brand=Mock+Brand&limit=24&sort=price_asc` even with `?brand=Acme` in the URL, the brand search reached the API as `brand=Mock+Brand&limit=24&q=mock+item+4&sort=price_asc`, unknown slug 404, `?page=99` is a 307 to /brands/mock-brand, forms post to the brand path, h1, `noindex, follow` and canonical present, no `name="brand"` input, /shop still posts to /shop and has no brand search box. All prove-freshness checks PASS.
- Task 2 harness exit 0: `/brands` 200 with tile links for mock-brand, acme, northwind; `/brands/nike.svg` 200 `image/svg+xml` (the public logo is not shadowed by the route); /shop header links /brands/acme and /brands, no `/shop?brand=`; all prove-freshness checks PASS.
- Acceptance greps all pass (no fs read in BrandGrid or the brands page, no `shopHref('brand'` in Header, no hard-coded /shop action or href in the catalogue components, no loading.tsx under src/app/brands).

## Deviations from Plan

**1. [Test] BrandGrid logo assertion** matches `src="/brands/<slug>.svg"`, because next/image under Vitest with this config emits the plain src here (unlike the gallery tests in Plan 02).

**2. [Scope] STATE.md and ROADMAP.md not touched**, per the orchestrator's instruction for this run.

**3. [Detail] CataloguePage does not call connection()**; both route pages do before rendering it, as the plan's page descriptions say.

## Not verified

- Not run on workerd (OpenNext cannot build on Windows). A6 (the /brands route next to the public/brands assets prefix) is confirmed on `next start` only (nike.svg serves as SVG); the Worker check is Plan 04.
- No browser check: tile layout, 3:2 ratio, mix-blend-multiply look on the SVGs, the banner back link and the brand-page toolbar layout (search box full width on phones, beside the count from 1024px) follow the UI-SPEC but were not eyeballed. Header Brands dropdown current-state on brand pages relies on the existing prefix match and was not clicked through.
- Mock only: no live brand names, so real collisions or non-Latin names are covered by unit tests only.

## Known Stubs

None.

## Threat Flags

None beyond the plan's model: T-03-09 (slug resolved against cached /filters, unknown slug 404 before any /items call, URL brand dropped, harness asserts the exact API query) and T-03-10 (logo src only from a BRAND_LOGOS entry, manifest pinned by test) are mitigated and tested.

## Self-Check: PASSED

Created files exist; commits 7d32b39 and 2d003d1 are on branch worktree-agent-aa4c8d24f671961f4.
