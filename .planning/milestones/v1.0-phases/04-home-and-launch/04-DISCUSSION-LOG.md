# Phase 4: Home and Launch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-11-03
**Phase:** 4-Home and Launch
**Areas discussed:** Hero/banners/placeholders, Category tiles and brand strip, Just Dropped carousel and page, About/Contact/SEO/launch

---

## Hero, banners and placeholders

| Question | Options | Selected |
|----------|---------|----------|
| Placeholder look | Solid palette panels / Placeholder image files / Item photos | Placeholder image files |
| Slot wiring | Paths in SHOP config / Fixed filenames | Fixed filenames |
| Home copy location | Shop folder / COPY | Shop folder |
| CTA targets | As the mockup implies / Hero to /shop | As the mockup implies |

**Notes:** Fixed filenames chosen as "the most configurable and easy to update in the future".

---

## Category tiles and brand strip

| Question | Options | Selected |
|----------|---------|----------|
| Tile source | Shop config, hidden if empty / Top types from /filters | Shop config, hidden if empty |
| Strip behaviour | Single row scrolls, View all / Fixed first 8 | Single row scrolls, View all |
| Default order | Mockup order placeholder / User gives list | Mockup order placeholder |
| Sold tier | Code the seam, empty / Skip tier | Code the seam, empty |

---

## Just Dropped carousel and page

| Question | Options | Selected |
|----------|---------|----------|
| Page shape | Catalogue locked to newest / Plain grid | Catalogue locked to newest |
| Scope | All in-stock newest first / Only New window | All in-stock newest first |
| Carousel | 10 newest arrows + swipe / 5 newest no scroll | 10 newest arrows + swipe |
| Thin stock | Show what exists, hide at zero / Always show | Show what exists, hide at zero |

**Notes:** New badge window changes from 7 to 14 days everywhere. The owner plans spotlighted items in How many that would be prioritised in the carousel only, not on the page; filed as GitHub issue #19.

---

## About, Contact, SEO and launch

| Question | Options | Selected |
|----------|---------|----------|
| Static pages | Shop-folder copy, simple layout / Markdown files | Shop-folder copy |
| Indexing | Env flag off by default / Derive from SITE_URL | Env flag off by default |
| Sitemap | Pages, brands, items / Pages and items | Pages, brands, items |
| OG image and doc | Shop OG image + docs/ONBOARDING.md / Brandmark + README | Shop OG image + docs/ONBOARDING.md |

**Notes:** Vinted links, email and other contact details must be read from the shared shop source, not hard coded.

---

## Claude's Discretion

Visual treatment, mobile layout, placeholder image look, exact filenames, config shapes, indexing env name, metadata copy.

## Deferred Ideas

Spotlighted carousel items (issue #19), sold-before brand data (BRAND-05), real photos, default brand order and contact values.
