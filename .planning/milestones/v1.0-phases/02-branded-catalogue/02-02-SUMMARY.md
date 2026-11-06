---
phase: 02-branded-catalogue
plan: 02
subsystem: ui
tags: [nextjs, tailwind4, next-font, design-tokens, fonts]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "/shop request-time page with a bare h1 and COPY.catalogue.title (Plan 01)"
provides:
  - "Tailwind 4 pipeline (@tailwindcss/turbopack rule in next.config.ts, src/styles/globals.css)"
  - "src/shop/theme.css: forest, olive, stone, sand, ivory and font-heading / font-sans tokens, the only CSS with hex values"
  - "src/shop/fonts.ts: self-hosted Bodoni Moda 700 and Montserrat Variable through next/font/local"
  - "src/shop/config.ts: SHOP { name, locale, bannerImage }"
  - "CatalogueBanner: the /shop h1 on a Forest panel"
affects: [02-03, 02-04, 02-05, 02-06, 02-07, 02-08, 02-09, 02-10]

actuals:
  tokens: 5000
  tasks: 2
  commits: 2
plan_head_before: f0c8cb478f63c69cab899006ff397ff8d144a8bb
plan_head_after: fa308a36f70c936737ea6272b7ca33fedb6af0e0

tech-stack:
  added: [tailwindcss 4.3.3, "@tailwindcss/turbopack 4.3.3", lucide-react 1.57.0, tailwind-merge 3.7.0]
  patterns:
    - "Hex values live only under src/shop/; components use token utilities (bg-forest, text-ivory, font-heading)"
    - "Fonts committed under src/shop/fonts and loaded with next/font/local, never downloaded at build"

key-files:
  created:
    - src/styles/globals.css
    - src/shop/theme.css
    - src/shop/fonts.ts
    - src/shop/config.ts
    - src/shop/fonts/BodoniModa-700.woff2
    - src/shop/fonts/OFL-BodoniModa.txt
    - src/shop/fonts/Montserrat-Variable.woff2
    - src/shop/fonts/OFL-Montserrat.txt
    - src/components/catalogue/CatalogueBanner.tsx
  modified:
    - package.json
    - package-lock.json
    - next.config.ts
    - src/app/layout.tsx
    - src/app/shop/page.tsx

key-decisions:
  - "Bodoni woff2 and licence were taken from the @fontsource/bodoni-moda 5.3.0 tarball in an isolated scratch dir; the package is not a dependency and nothing from it was run"

requirements-completed: [SHELL-01, TMPL-01]

duration: 10min
completed: 2026-10-26
---

# Phase 2 Plan 02: Blacktail look Summary

Tailwind 4 design tokens (forest/olive/stone/sand/ivory) and self-hosted Bodoni Moda 700 + Montserrat Variable now reach `/shop`, which opens with an "All Items" Forest banner h1; theme, fonts and shop name/locale/banner slot live in `src/shop/`.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Package legitimacy checkpoint (owner replied "approved") | n/a (no files) |
| 2a | Install the approved packages at the approved pins | 76f5be5 |
| 2 | Tracer: tokens, fonts, layout and banner on /shop | fa308a3 |

## Verification

- The plan's automated build-and-serve check printed OK: `lang="en-IE"`, `font-heading`, "All Items" in the HTML; compiled CSS has `--color-forest: #1f2a1f` and an `@font-face`.
- `npm test` (64 passed), `npm run lint`, `npm run typecheck` all clean.
- `npm ls` shows tailwindcss 4.3.3, @tailwindcss/turbopack 4.3.3, lucide-react 1.57.0, tailwind-merge 3.7.0. theme.css has 5 hex values; no hex outside `src/shop/`.
- NOT done: the `<human-check>` (eyeball /shop on `next dev`: Bodoni on Forest, Montserrat on Ivory, Tab focus ring). It needs a person at a browser; left for the owner or verify-work.

## Deviations from Plan

None - plan executed as written. The package install was split into its own commit (76f5be5) because the plan said to commit package.json and package-lock.json at step 1.

## Notes

- npm printed an install-scripts warning for `workerd@1.20261023.1` (postinstall). That is a pre-existing wrangler dependency, not one of the approved packages.
- Git warns that LF will become CRLF on the new files (repo autocrlf setting); harmless.
- Palette hexes come from PROJECT.md's transcription of the branding PDF; if the PDF differs only `src/shop/theme.css` changes.

## Known Stubs

None. `SHOP.bannerImage` is `null` by design (solid Forest panel), as the plan specifies.

## Self-Check: PASSED

All created files exist; commits 76f5be5 and fa308a3 are ancestors of HEAD.
