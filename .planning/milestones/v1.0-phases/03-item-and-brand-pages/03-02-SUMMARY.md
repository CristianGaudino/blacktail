---
phase: 03-item-and-brand-pages
plan: 02
subsystem: item-page
tags: [nextjs, gallery, lightbox, brand-link, more-from-brand]
requires: [03-01]
provides:
  - ItemGallery (client): scroll-snap track, thumbnails from 1024px, dots or counter, cover-ratio frame
  - PhotoLightbox (client): full-viewport dialog with arrows, keys, focus return
  - MoreFromBrand (server): up to 4 other newest pieces of the brand
  - brandSlug(), ROUTES.brand(), CATALOGUE.moreFromBrand
affects: [03-03, 03-04]
tech-stack:
  added: []
  patterns: [client islands receive photos and name only, IntersectionObserver for current slide with a pending ref for jumps, More-from slices the brand page's page-1 read]
key-files:
  created:
    - src/components/item/ItemGallery.tsx
    - src/components/item/PhotoLightbox.tsx
    - src/components/item/ItemGallery.test.ts
    - src/components/item/MoreFromBrand.tsx
    - src/components/item/MoreFromBrand.test.ts
    - src/lib/brands.ts
    - src/lib/brands.test.ts
  modified:
    - src/app/items/[code]/page.tsx
    - src/lib/routes.ts
    - src/lib/config.ts
    - src/lib/copy.ts
    - src/styles/globals.css
    - scripts/mock-howmany.mjs
key-decisions:
  - "More-from reads getItemsPage with the exact brand-only query string (brand=<name>), so the key equals page 1 of the brand page; failure logs a warning and hides the row"
  - "fetchPriority=high + loading=eager on the cover only (priority prop is deprecated in Next 16)"
status: complete
commits: 3
plan_head_before: 7ae880a
plan_head_after: 20bf4b70cc713020a5c1a11b3c2eea15ade764c1
actuals:
  tokens: 25000
  tasks: 3
  commits: 3
---

# Phase 3 Plan 2: Gallery, lightbox and More from this brand Summary

The item page now shows every photo in a no-shift scroll-snap gallery with thumbnails, dots and a full-size lightbox, links the brand label to /brands/<slug>, and ends with a "More from {brand}" row that reuses the brand page's cache entry.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Tracer: gallery track, thumbnails, dots, two-column layout, three-photo mock | f83beab |
| 2 | Lightbox with arrows, keys, focus return and fade | 193fc38 |
| 3 | brandSlug, brand link, More from this brand | 20bf4b7 |

## Verification

- `npm test` 198 passed (23 files), `npm run lint` and `npm run typecheck` clean after each task.
- The plan's local harness (next build with the mock down, mock on 4010, `next start` on 3000, `prove-freshness --outage`) ran for all three tasks, every check PASS:
  - Task 1: `T=3 Z=200` (3 thumbnails on MOCK-0001, none on one-photo MOCK-0002, zero-photo MOCK-0029 is 200), carousel region, `photo-1b.jpg`, `aspect-ratio:1500` present.
  - Task 2: `C=1` (cover mounted once, lightbox photo not mounted while closed), dialog, close button and Next button in the markup.
  - Task 3: API received exactly `brand=Mock+Brand&limit=24`; row has MOCK-0004 and MOCK-0013, not MOCK-0016; `/brands/mock-brand` link; brandless MOCK-0030 has no row.
- Acceptance greps: no `priority=`, no `item={item}` in the gallery, no `limit` in MoreFromBrand, no `ROUTES.brands` in routes.ts.

## Deviations from Plan

**1. [Test] next/image URL form under Vitest.** The test renderer emits `/_next/image?url=...` (the `unoptimized` flag lives in next.config.ts), and the high-priority attribute renders as lowercase `fetchpriority` in static markup. The unit tests match on the encoded `url=` parameter and a case-insensitive attribute. Production HTML (checked by the harness) carries the original photo URLs.

**2. [Test] "no live line" assertion** uses the gallery's `sr-only` line, not `aria-live`, because the lightbox counter (also in the markup) is itself `aria-live="polite"` as specified.

**3. [Scope] STATE.md and ROADMAP.md not touched**, per the orchestrator's instruction for this run.

## Not verified

- Swipe, thumbnail click, IntersectionObserver current-index tracking, lightbox open/step/close, Esc/backdrop, arrow keys, focus return and the reduced-motion fade are client behaviour with no DOM in Vitest and were not exercised in a browser; they are on the Plan 04 UAT list.
- Cloudflare Worker build (`opennextjs-cloudflare`) not run here; only `next build` / `next start`.
- Visual match to the mockups and the lg thumbnail column height were not checked.

## Known Stubs

None.

## Threat Flags

None. The islands receive only `photos` and the display name (T-03-06), the More-from query equals page 1 of the brand page (T-03-07), slugs reduce to `[a-z0-9-]` and pass `encodeURIComponent`, an empty slug gets no link (T-03-08).

## Self-Check: PASSED

Files exist (ItemGallery, PhotoLightbox, MoreFromBrand, brands.ts and the three tests); commits f83beab, 193fc38, 20bf4b7 are on the branch.
