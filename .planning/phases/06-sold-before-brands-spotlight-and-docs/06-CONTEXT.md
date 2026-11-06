# Phase 6: Sold-Before Brands, Spotlight and Docs - Context

**Gathered:** 2026-11-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The home page follows the seller's own data: the brand strip's second tier comes from `/filters` `soldBrands` (BRAND-05), the Just Dropped carousel on the home page puts spotlight pieces first (HOME-05, `?spotlight=true`), and the docs, comments and scripts state the real rate limit of 600 uncached requests a minute per IP (DOC-01). Closes GitHub issue #19. No new pages, no new filters.

</domain>

<decisions>
## Implementation Decisions

### Spotlight (HOME-05)
- **D-01:** Spotlight pieces are marked by order only: they come first in the carousel, then it fills with the newest pieces up to the carousel size, no piece twice. No extra badge and no new copy.
- **D-02:** Spotlight applies to the home carousel only. `/just-dropped` stays strictly newest-first.
- **D-03:** With no spotlight pieces (or a failed spotlight read) the carousel is today's newest-first list, with no gap and no error (success criterion 3).

### Sold-before brands (BRAND-05)
- **D-04:** A sold-before brand looks the same as any other brand in the strip (logo if the file exists, otherwise its name). Its brand page uses the empty-catalogue screen built in v1.0 (D-21). No new note or copy.
- **D-05:** Order stays: in stock first, then sold before (each A to Z then ranked by `SHOP.defaultBrandOrder`), `stripBrands` already does this. The empty `SOLD_BEFORE_BRANDS` constant in `src/lib/brands.ts` is replaced by the `/filters` `soldBrands` data.

### Docs (DOC-01)
- **D-06:** Replace the old 3000/min rate-limit wording with "600 uncached requests a minute per IP" in live docs, code comments, scripts and CLAUDE.md. Archived v1.0 files under `.planning/milestones/` are left as the historical record.

### Claude's Discretion
- The shape of `soldBrands` is unknown: the live store returns an empty list today. Accept a list of plain strings or `{ value, count }` objects, drop bad entries one at a time, and treat a missing field as `[]` (the API only ever adds fields).
- How the spotlight read is cached: it must go through `client.ts` with the store tag and `revalidate: 600`, with `?spotlight=true` part of the key; the requested size and the merge-and-dedupe live in one pure function with a unit test.
- Whether the spotlight read adds a call beyond the existing newest read (it is a second `/items` call; within the 600/min budget, cached).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/REQUIREMENTS.md` - BRAND-05, HOME-05, DOC-01
- `.planning/ROADMAP.md` - Phase 6 goal and success criteria
- `.planning/milestones/v1.0-phases/04-home-and-launch/04-CONTEXT.md` - D-07 (strip order), D-10 and D-12 (Just Dropped)
- `.planning/milestones/v1.0-phases/03-item-and-brand-pages/03-CONTEXT.md` - D-21 (empty brand page)
- GitHub issue #19 (closed by this phase)

### Code
- `src/lib/homeSections.ts` - `stripBrands` (already takes the sold-before tier)
- `src/lib/brands.ts` - `SOLD_BEFORE_BRANDS` placeholder
- `src/components/home/BrandStrip.tsx`, `JustDropped.tsx`, `JustDroppedCarousel.tsx`
- `src/lib/howmany/client.ts`, `schemas.ts` (`filtersSchema`), `src/lib/config.ts` (`HOME`)

Live API: `GET /filters` already returns `soldBrands` (empty today) and `/items` accepts `spotlight=true`; confirm both shapes against the live API once the seller has a sold brand and a spotlight piece.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stripBrands(inStock, soldBefore, defaultOrder)` already implements the three-tier order; `brandBySlug` already resolves sold-before names for brand pages.
- `getItemsPage(search, limit)` is the one tagged items read; the empty query is the shared newest list.

### Established Patterns
- All reads through `client.ts` with the store tag; React `cache()` dedupes; per-shop values from `SHOP`; copy from `COPY`.

### Integration Points
- `BrandStrip` (replace `SOLD_BEFORE_BRANDS` with filters data), `JustDropped` (spotlight-first merge), `filtersSchema` (add `soldBrands`).

</code_context>

<specifics>
## Specific Ideas

None beyond the success criteria. Look is unchanged from v1.0.

</specifics>

<deferred>
## Deferred Ideas

None. A Featured badge, a sold-before note on brand pages and spotlight on `/just-dropped` were considered and declined.

</deferred>
