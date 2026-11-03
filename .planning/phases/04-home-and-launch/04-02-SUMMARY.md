---
phase: 04-home-and-launch
plan: 02
subsystem: home-page
tags: [home, hero, carousel, promo-banners, story-band, image-slots, nextjs]
requires: ["04-01"]
provides:
  - "/ is the home page: hero, Just Dropped carousel (10 newest), two promo banners, story band"
  - "inverse ButtonLink variant, IconButton disabled styles"
  - "IMAGES hero, bannerJustDropped, bannerBrands, story slots with committed placeholders and a slot test"
  - "SHOP.home (hero, justDropped, promos, story), HOME.carouselItems, COPY.home previous/next"
  - "New badge window of 14 days (SHOP.newBadgeDays)"
affects: [04-03, 04-04, 04-05]
tech-stack:
  added: []
  patterns:
    - "Data section reads inside its own try/catch, one console.warn, returns null when empty or failed"
    - "Client island receives primitive props and server-rendered children only; arrows exist only after a measured overflow"
key-files:
  created:
    - src/app/page.tsx
    - src/components/home/HeroBanner.tsx
    - src/components/home/JustDropped.tsx
    - src/components/home/JustDroppedCarousel.tsx
    - src/components/home/JustDroppedCarousel.test.ts
    - src/components/home/PromoBanners.tsx
    - src/components/home/StoryBand.tsx
    - src/lib/images.test.ts
    - public/images/hero.jpg
    - public/images/banner-just-dropped.jpg
    - public/images/banner-brands.jpg
    - public/images/story.jpg
  modified:
    - next.config.ts
    - src/components/ui/buttons.tsx
    - src/shop/config.ts
    - src/lib/config.ts
    - src/lib/copy.ts
    - src/lib/dates.test.ts
    - scripts/prove-freshness.mjs
decisions:
  - "The inverse button variant has an Ivory focus ring, because the global Forest ring would vanish on the Forest overlay"
  - "Promo text is limited to 60% of the banner width only from 768px; below that the overlay is flat Forest 60% so any width is safe"
metrics:
  duration: "about 40 minutes"
  completed: 2026-11-03
status: complete
commits: 3
plan_head_before: 9f61a929d7eecd77e7b9f0d23dd2d5d6094608b9
plan_head_after: 415944b494891efe86f6e4d469c668f7d5f0ac23
actuals:
  tokens: 6700
  tasks: 3
  commits: 3
---

# Phase 4 Plan 02: Home page Summary

The `/` redirect is gone: the root now renders the hero, a Just Dropped carousel of the 10 newest pieces read from the same cache entry as /shop page 1, two promo banners and the story band, with fixed-name placeholder images.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 (tracer) | / is the home page with the hero and the 10 newest pieces from the tagged client | fb3375f |
| 2 | Carousel arrows page through the newest pieces, only when the track overflows | e59da25 |
| 3 | Promo banners and story band with fixed image slots | 415944b |

## What was built

- `next.config.ts` no longer redirects `/`; `src/app/page.tsx` calls `await connection()` first (outside any try/catch, so the build makes no API call) and builds an absolute title `Blacktail Archive | Pre-loved branded clothing`, description and Open Graph tags through `pageMetadata`.
- `HeroBanner`: 420px (480px from 768px) full-bleed frame, `hero.jpg` with `loading="eager"` and `fetchPriority="high"` (no deprecated `priority`), flat Forest 60% overlay then the left-to-right Forest 80/60/10 gradient, eyebrow, two-sentence `h1`, rule, and an inverse `Shop new arrivals` button to `ROUTES.justDropped`.
- `JustDropped` reads `getItemsPage('')` (same key as /shop page 1) sliced to `HOME.carouselItems`; a failed or empty read logs one `console.warn` and hides the whole section.
- `JustDroppedCarousel` (the only client component): `carouselEdges` with a 1px tolerance, `ResizeObserver` plus an rAF-throttled passive scroll listener (state set only inside callbacks), arrows only when the track overflows, scroll by the visible width, `instant` under reduced motion, no auto-advance, no library. Cards show 2 / 3 / 5 by width.
- `PromoBanners` (Just Dropped, brands with the mirrored gradient from 768px) and `StoryBand` (Sand 40%, framed photo rotated -2 degrees from 1024px, the phase's only Forest-filled button to `/about`).
- `buttons.tsx`: `inverse` variant; `IconButton` gets `disabled:cursor-not-allowed disabled:opacity-50`.
- `SHOP.home` holds every home word; `COPY.home` only the arrow labels; `SHOP.newBadgeDays` is 14 and `dates.test.ts` pins the rule through it.
- `src/lib/images.test.ts` fails when an `IMAGES` slot has no file under `public/images`. Placeholders are palette-only gradients made by an uncommitted scratch sharp script: hero 8 KB, banners 4 KB each, story 4 KB.
- `prove-freshness.mjs`: `home-redirect` became `home` (200, one `<h1`, item links with --mock), and the outage check asserts `/` stays 200 with its `<h1` and no item links.

## Verification

- `npm test` (242 tests), `npm run lint`, `npm run typecheck` pass.
- Plan harness on `next start` against the mock: the build made zero API calls; `/` is 200 with an `h1`, exactly 10 distinct item links, home list read `limit=24` and `/shop` added no second list read (items count 1), hero CTA, hero `src`, `fetchpriority="high"` and the absolute `og:title` present, `hero.jpg` served 200; carousel region and `aria-labelledby` present with no arrow in the server HTML; all four images referenced in order (hero, just dropped, banner 1, banner 2, story), served 200, `/about` link present, one `h1`; `prove-freshness --mock --outage` passes every check including the home outage check.
- Not verified here (backstops in the plan): the 5-line hero headline at 320px and 1280px, and arrow disabling on 125% and 150% Windows display scaling. No browser was driven in this run.

## Deviations from Plan

**1. [Process] Worktree base reset.** The worktree started on `a4718f0` (main), not a descendant of `9f61a92`; reset to `9f61a92` as the startup branch check allows. Ran `npm ci` because the new worktree had no `node_modules`.

**2. [Rule 2 - Accessibility] Ivory focus ring on the inverse button.** The global focus ring is Forest, which is invisible on the Forest hero and banner overlays. The `inverse` variant sets `focus-visible:outline-ivory`. Files: `src/components/ui/buttons.tsx`. Commit: fb3375f.

**3. [Test fix] Carousel test children.** `react/no-children-prop` rejects `children` in an inline `createElement` props literal, and TypeScript requires `children` in the props; the test passes a named props object. No source change.

Otherwise the plan was executed as written (19 files against the usual 5 per task was the owner-accepted deviation noted in the plan).

## Known Stubs

- `public/images/hero.jpg`, `banner-just-dropped.jpg`, `banner-brands.jpg` and `story.jpg` are placeholder gradients by design (D-01); the owner replaces each by overwriting the file. They go in the slots table of `docs/ONBOARDING.md` (Plan 05).
- `SHOP.home` words are Blacktail Archive's mockup words (UI-SPEC Copywriting), not owner-reviewed.

## Threat Flags

None. Image sources come only from the `IMAGES` constant, the client island receives primitive strings and server-rendered children (no item objects), and `/` shares the /shop page 1 cache key.

## Notes for later plans

- Plan 03 inserts the brand strip after the hero and the category tiles before the story band in `src/app/page.tsx`, and adds `category-1.jpg` to `category-4.jpg` slots (extend `IMAGES` or the slot test as it sees fit).
- Plan 04 deletes the built-pages stopgap; until then the header and footer still hide `/just-dropped`, `/about` and `/contact`, so the home page's only `/about` link is the story band.

## Self-Check: PASSED

- Created files present: src/app/page.tsx, HeroBanner.tsx, JustDropped.tsx, JustDroppedCarousel.tsx (+ test), PromoBanners.tsx, StoryBand.tsx, src/lib/images.test.ts, four public/images JPEGs.
- Commits fb3375f, e59da25, 415944b are on the branch (3 commits measured from `9f61a92`).
