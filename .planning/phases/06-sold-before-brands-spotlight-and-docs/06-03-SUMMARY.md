---
phase: 06-sold-before-brands-spotlight-and-docs
plan: 03
subsystem: home
tags: [brands, sold-before, filters, zod, how-many-api]
requires: [06-01]
provides:
  - filtersSchema.soldBrands (lenient string[]) feeding the home brand strip and /brands/[slug] (BRAND-05)
affects: [home page, brand pages, mock API, prove-freshness]
tech-stack:
  added: []
  patterns: [per-entry safeParse in a transform, like itemDetailSchema.listings]
key-files:
  created: []
  modified:
    - src/lib/howmany/schemas.ts
    - src/lib/params.ts
    - src/lib/params.test.ts
    - src/components/catalogue/FilterPanel.test.ts
    - src/components/home/BrandStrip.tsx
    - src/app/brands/[slug]/page.tsx
    - scripts/mock-howmany.mjs
    - scripts/prove-freshness.mjs
    - src/lib/howmany/client.test.ts
    - src/lib/brands.ts
    - src/lib/brands.test.ts
    - src/lib/homeSections.ts
decisions:
  - "soldBrands accepts plain names and { value } objects; anything else drops alone; a missing or non-array field is [] (RESEARCH A3)"
status: complete
commits: 2
plan_head_before: 49b29f8f03acfc3cba4f2b27f26a148300198bbb
plan_head_after: ceacf87bdf7d45720a1e39bcd7e53c5b4834a76b
actuals:
  tokens: 6000
  tasks: 2
  commits: 2
requirements-completed: [BRAND-05]
---

# Phase 6 Plan 03: Sold-before brands in the strip Summary

`/filters` `soldBrands` is parsed leniently and now feeds the home brand strip's second tier and `/brands/[slug]` together, so a sold-before brand shows like any other (logo or name) and its page opens the v1.0 empty catalogue.

## What was built

- `filtersSchema.soldBrands`: array of unknown, `.catch([])`, each entry safeParsed (non-empty trimmed string, or an object whose `value` is one); bad entries drop alone. Output `string[]`, so `stripBrands` and `brandBySlug` needed no change.
- `BrandStrip` and `brands/[slug]/page.tsx` read `filters.soldBrands` (same React-cached `/filters` as the header, no extra call). `/brands`, header and sitemap still read in-stock `filters.brand` only.
- Type fallout: `soldBrands: []` in `clearFilters` and the two `Filters` test fixtures.
- Mock `/filters` returns `soldBrands: ['Barbour', { value: 'Old Mill', count: 2 }]`.
- `prove-freshness` `home-sold-brands` (mock only): strip order Acme, Mock Brand, Northwind, Barbour (logo), Old Mill (name); both brand pages 200 with "Nothing is in stock right now"; `/brands` lists in-stock only.
- `client.test.ts`: soldBrands cases (plain names, objects, bad entries with trimming, string/null/object field) plus the default-empty expectation.
- Removed the `SOLD_BEFORE_BRANDS` placeholder and its test; updated the `stripBrands` JSDoc.

## Verification

- Harness (next build with zero API calls, next start, prove-freshness `--mock --outage`): all checks PASS including `home-sold-brands` and `home-spotlight`. Run on ports 3347/4347 because port 3000 was held by another process.
- `npm test` 326 passed, `npm run lint` clean, `npm run typecheck` clean.

## Deviations from Plan

None - plan executed as written (ports aside, as the plan allows).

## Known Stubs

None.

## Threat Flags

None. No new endpoint; T-06-05 to T-06-07 mitigations are in place (names rendered as text, slug from `brandSlug`, logo path only from the manifest, brand pages 404 before any /items call unless the slug is in the /filters lists, soldBrands lenient and unit-tested).

## Known limits

- RESEARCH A3: the live `soldBrands` element shape is unobserved (empty list on 2026-11-06). Other shapes give an empty second tier, never an error. The owner should check the live shape once the seller has a sold brand.
- RESEARCH A4: a live `/items?brand=<sold brand>` is assumed to answer 200 with zero items (a 400 is already turned into an empty result by CataloguePage). Proven against the mock only.

## Self-Check: PASSED

All 12 files modified as listed; commits 8895832 and ceacf87 are on the branch.
