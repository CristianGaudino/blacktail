# Phase 6: Sold-Before Brands, Spotlight and Docs - Research

**Researched:** 2026-11-06
**Domain:** Next.js 16 server components over the How many public API (tagged fetch cache), pure ordering functions, docs sweep
**Confidence:** HIGH (live API probed this session, every touched file read)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Spotlight pieces are marked by order only: they come first in the carousel, then it fills with the newest pieces up to the carousel size, no piece twice. No extra badge and no new copy.
- **D-02:** Spotlight applies to the home carousel only. `/just-dropped` stays strictly newest-first.
- **D-03:** With no spotlight pieces (or a failed spotlight read) the carousel is today's newest-first list, with no gap and no error (success criterion 3).
- **D-04:** A sold-before brand looks the same as any other brand in the strip (logo if the file exists, otherwise its name). Its brand page uses the empty-catalogue screen built in v1.0 (D-21). No new note or copy.
- **D-05:** Order stays: in stock first, then sold before (each A to Z then ranked by `SHOP.defaultBrandOrder`), `stripBrands` already does this. The empty `SOLD_BEFORE_BRANDS` constant in `src/lib/brands.ts` is replaced by the `/filters` `soldBrands` data.
- **D-06:** Replace the old 3000/min rate-limit wording with "600 uncached requests a minute per IP" in live docs, code comments, scripts and CLAUDE.md. Archived v1.0 files under `.planning/milestones/` are left as the historical record.

### Claude's Discretion
- The shape of `soldBrands` is unknown: the live store returns an empty list today. Accept a list of plain strings or `{ value, count }` objects, drop bad entries one at a time, and treat a missing field as `[]` (the API only ever adds fields).
- How the spotlight read is cached: it must go through `client.ts` with the store tag and `revalidate: 600`, with `?spotlight=true` part of the key; the requested size and the merge-and-dedupe live in one pure function with a unit test.
- Whether the spotlight read adds a call beyond the existing newest read (it is a second `/items` call; within the 600/min budget, cached).

### Deferred Ideas (OUT OF SCOPE)
None. A Featured badge, a sold-before note on brand pages and spotlight on `/just-dropped` were considered and declined.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-05 | Brand strip's second tier filled from `/filters` `soldBrands` | `stripBrands` already takes the tier; add `soldBrands` to `filtersSchema`, read it in `BrandStrip` and `brands/[slug]/page.tsx`, delete `SOLD_BEFORE_BRANDS` |
| HOME-05 | Just Dropped carousel shows spotlight pieces first, then newest, no duplicates | `GET /items?spotlight=true` confirmed live; one pure `spotlightFirst` merge function; second tagged `getItemsPage` call |
| DOC-01 | Docs, comments, scripts say 600 uncached requests a minute per IP, nothing says 3000 | Exact 4 live hits listed below plus `.planning/research/*` |
</phase_requirements>

## Summary

Small phase, three independent edits. Everything it needs already exists: `stripBrands(inStock, soldBefore, defaultOrder)` implements the three-tier order, `brandBySlug` resolves sold-before names, and `getItemsPage(search, limit)` is the one tagged items read. The work is (1) teach `filtersSchema` about `soldBrands` and replace the `SOLD_BEFORE_BRANDS` constant at its two call sites, (2) add a spotlight-first merge to the home carousel, (3) rewrite four live rate-limit sentences.

The live API was probed this session and already carries both features: `/filters` has a `soldBrands` key (empty today), `/items` accepts `spotlight=true` and every item now carries a boolean `spotlight` field, and exactly one piece (RL-0174) is spotlighted. So the spotlight shape is known, only the `soldBrands` element shape is still unknown (empty list). `spotlight=false` and `spotlight=yes` return 400, so only the literal `true` is valid.

**Primary recommendation:** Add `soldBrands` to `filtersSchema` (lenient, strings or `{value}` objects, bad entries dropped, missing field `[]`), pass `filters.soldBrands` to `stripBrands` and `brandBySlug`, fetch `getItemsPage('spotlight=true', HOME.carouselItems)` alongside `getItemsPage('')` in `JustDropped` and merge with one pure tested function in `src/lib/homeSections.ts`, then sweep the rate-limit wording.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Parse `soldBrands`, spotlight read | API / Backend (server module `client.ts`, `schemas.ts`) | — | All API reads are server-side, tagged, through one client |
| Merge and dedupe spotlight + newest | Frontend Server (pure fn in `homeSections.ts`, called by the `JustDropped` server component) | — | Pure and client-safe, testable without env |
| Brand strip tiers | Frontend Server (`BrandStrip`) | — | Reads cached `/filters`, calls `stripBrands` |
| Sold-before brand page | Frontend Server (`brands/[slug]/page.tsx`) | Database/Storage (API data) | Slug resolves against `filters.brand` then `filters.soldBrands`; empty catalogue already built |
| Rate-limit wording | Docs | — | README, CLAUDE.md, code comments |

## Standard Stack

No new packages. Existing: Next 16.4.1, React 19.3.0, Zod 4.x, Vitest 5. [VERIFIED: `.claude/CLAUDE.md` stack table, `package.json` scripts read]

## Package Legitimacy Audit

No external packages are installed in this phase. Nothing to audit. Packages removed: none. Packages flagged: none.

## Verified API shapes (live probe, 2026-11-06)

Base `https://www.checkhowmany.com/api/v1/stores/blacktail-archive` (from `wrangler.jsonc`). [VERIFIED: curl this session]

- `GET /filters` keys returned: `brand,size,colour,era,material,category,type,condition,department,priceCents,pitToPitMm,lengthMm,soldBrands`. `soldBrands` is `[]`. The element shape is still unobserved. [VERIFIED: curl output `soldBrands []`]
- `GET /items?limit=100` returns 10 items (`total 10`), item keys include `spotlight` (boolean: both `true` and `false` seen) and `status`, `listings`, `soldAt`. [VERIFIED: curl output `types boolean:false|boolean:true`, `spot 1`]
- `GET /items?spotlight=true&limit=100` returns `total 1`: RL-0174 only. Default sort is still newest within the spotlight set. [VERIFIED: curl output]
- `spotlight=true&brand=Lotto` returns `total 0` (filters combine). `spotlight=false` and `spotlight=yes` return HTTP 400 `{"error":"Bad query: ..."}`. Never send anything but `spotlight=true`. [VERIFIED: curl output]
- `itemSchema` (`src/lib/howmany/schemas.ts:19-40`) has no `spotlight` field and zod strips unknown keys, so the field is dropped today. The home merge does not need it (the `?spotlight=true` query already filters), so do NOT add it to the schema (privacy whitelist stays minimal).

## Architecture Patterns

### Data flow

```
GET /  (connection() first, in page.tsx)
 ├─ BrandStrip ── getFilters() [React cache, shared with Header]
 │     └─ stripBrands(brand names, filters.soldBrands, SHOP.defaultBrandOrder) -> BrandRow
 └─ JustDropped ── Promise.allSettled
       ├─ getItemsPage('')                                  (newest, same key as /shop page 1)
       └─ getItemsPage('spotlight=true', HOME.carouselItems) (new key, tag store:<slug>, revalidate 600)
             └─ spotlightFirst(spotlight, newest, HOME.carouselItems) -> carousel cards
/brands/[slug] ── getFilters() -> brandBySlug(slug, brand names, filters.soldBrands) -> CataloguePage (empty screen if no stock)
```

### Pattern 1: `soldBrands` in the schema (lenient, per-entry drop)
Mirror the existing `listings` pattern in `schemas.ts:52-55` (array of unknown, `.catch([])`, `flatMap` of `safeParse`). Output is `string[]`, so `stripBrands` / `brandBySlug` need no change.

```ts
// in schemas.ts, next to facet/range
const soldBrand = z.union([z.string(), z.object({ value: z.string() })]).transform(v => (typeof v === 'string' ? v : v.value).trim());

// inside filtersSchema:
soldBrands: z.array(z.unknown()).catch([]).transform(list => list.flatMap(entry => {
    const parsed = soldBrand.safeParse(entry);
    return parsed.success && parsed.data !== '' ? [parsed.data] : [];
})),
```
The `.catch([])` handles a missing field, the same way the existing `listings` field does ("gives no listings when the field is missing" test exists, `client.test.ts:166`). `brandIndex` already drops names with no slug and dedupes by slug, so no extra cleaning is needed.

### Pattern 2: pure spotlight-first merge
Put next to `stripBrands` in `src/lib/homeSections.ts` (pure, client-safe, already imports `HOME`). One function, one test file already exists (`homeSections.test.ts`).

```ts
/** HOME-05 / D-01: spotlight pieces first (API order), then the newest, no code twice, at most `size` */
export function spotlightFirst(spotlight: Item[], newest: Item[], size: number): Item[] {
    const seen = new Set<string>();
    return [...spotlight, ...newest].filter(({ code }) => !seen.has(code) && !!seen.add(code)).slice(0, size);
}
```
Same dedupe idiom as `brandIndex` (`brands.ts:14`). Needs `import type { Item } from '@/lib/definitions'` (already used in `JustDropped.tsx`).

### Pattern 3: `JustDropped` reads both, never fails on the spotlight
```ts
const [spot, newest] = await Promise.allSettled([
    getItemsPage('spotlight=true', HOME.carouselItems),
    getItemsPage(''),
]);
// log each rejection with console.warn (existing style), treat it as []
items = spotlightFirst(spot.status === 'fulfilled' ? spot.value.page.items : [], newest.status === 'fulfilled' ? newest.value.page.items : [], HOME.carouselItems);
```
- Newest stays the existing cache key (empty query, limit 24, shared with `/shop` page 1), sliced inside `spotlightFirst`.
- The spotlight call is `/items?limit=10&spotlight=true` (client sorts params by key). `limit` equals the carousel size so a shop with more than 10 spotlight pieces cannot over-fetch.
- Spotlight failed: carousel equals today's newest-first list (D-03). Newest failed but spotlight fine: shows the spotlight pieces only, which is acceptable (section only hides when merged list is empty).
- Cost: one extra tagged `/items` call per 10-minute window or per webhook; negligible against 600 uncached requests a minute (cache hits do not count). [CITED: `.planning/PROJECT.md:68`]

### Pattern 4: call sites for `soldBrands`
- `src/components/home/BrandStrip.tsx:4,59`: drop the `SOLD_BEFORE_BRANDS` import; call `stripBrands(filters.brand.map(f => f.value), filters.soldBrands, SHOP.defaultBrandOrder)`. [VERIFIED: read BrandStrip.tsx]
- `src/app/brands/[slug]/page.tsx:5,17`: the brand page MUST also use `filters.soldBrands`, otherwise the strip links to a sold-before brand page that 404s. [VERIFIED: read page.tsx]
- `src/lib/brands.ts:18-19`: delete `SOLD_BEFORE_BRANDS` and its comment. `src/lib/brands.test.ts:5,55`: delete the import and the test `'ships an empty sold-before list until BRAND-05'`.
- Update the `stripBrands` JSDoc in `homeSections.ts:8-10` ("supplied by BRAND-05 (empty until How many provides it)") to say it comes from `/filters` `soldBrands`.

### Anti-Patterns to Avoid
- Calling `fetch` outside `client.ts`, or adding a `getSpotlight` wrapper that bypasses the tag: use `getItemsPage('spotlight=true', HOME.carouselItems)`.
- Adding `spotlight` to `itemSchema`, a badge, or any copy (D-01).
- Touching `/just-dropped` (D-02) or adding sold-before brands to `/brands` or the sitemap: `/brands` and `sitemap.ts:26` use in-stock `filters.brand` only; leave them, a sold-before page is an empty catalogue and should not be advertised to crawlers.
- Sending `spotlight=false` (API answers 400).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Three-tier brand order, slug collision, A to Z | New sorting | `stripBrands`, `brandIndex` | Already tested (`homeSections.test.ts:20`) |
| Dedupe by code | Index juggling | `Set` filter idiom from `brandIndex` | Preserves first-wins order |
| Tolerant array parsing | try/catch around parse | `z.array(z.unknown()).catch([]).transform(flatMap safeParse)` | Same as `listings` |
| Cache key / tag / timeout | A second fetch path | `getItemsPage` | Tag + revalidate + sorted params are in `howmanyFetch` |

## Common Pitfalls

### Pitfall 1: `Filters` type now requires `soldBrands`
**What goes wrong:** `Filters = z.output<typeof filtersSchema>` (`definitions.ts:11`), so object literals typed `Filters` fail `tsc`.
**How to avoid:** add `soldBrands: []` to the fixtures at `src/lib/params.test.ts:7-19` and `src/components/catalogue/FilterPanel.test.ts:12-18`. `FilterChips.test.ts:16` uses `as unknown as Filters` and needs nothing. [VERIFIED: read those lines]
**Warning signs:** `npm run typecheck` errors "Property 'soldBrands' is missing".

### Pitfall 2: sold-before brand strip entry links to a 404
Fixed only if `brands/[slug]/page.tsx` is updated together with `BrandStrip` (Pattern 4). Test both from the mock.

### Pitfall 3: spotlight webhook freshness
The webhook fires on stock changes; whether toggling a spotlight in How many fires `store.updated` is unknown. The 600 s `revalidate` is the safety net either way. [ASSUMED] Note it in the summary; no code change.

### Pitfall 4: the mock ignores unknown params
`scripts/mock-howmany.mjs` `listItems` ignores `spotlight` and its `/filters` has no `soldBrands`, so the CI/worker proof would pass vacuously. Extend the mock (below).

### Pitfall 5: DOC-01 grep false positives
`git grep 3000` also hits port 3000 in old plan files and `params.test.ts` price values (`'3000'`). Verify with a phrase pattern, not the bare number (see DOC-01 section).

## Mock and proof changes (scripts)

Small, keeps the existing proofs green. [VERIFIED: read `scripts/mock-howmany.mjs` 1-175]
- `allItems()`: add `spotlight: i === 15`. MOCK-0015 is 14 days old, so outside the 10 newest: it proves promotion.
- `listItems`: add `&& (search.get('spotlight') !== 'true' || x.spotlight)`; and return 400 for any `spotlight` value other than `true` (matches the real API).
- `filters()`: add `soldBrands: ['Barbour']` (a brand name not in the mock stock; there is no `public/brands/barbour.svg` check needed, a name fallback is also covered by D-04).
- Header comment: document `?spotlight=true` and `soldBrands`.
- `.github/workflows/ci.yml` home step (line ~131): add `href="/brands/barbour"` to the required strings and assert MOCK-0015 appears before MOCK-0001 in the home HTML (`printf | grep -ob` or node); add `code /brands/barbour` = 200 beside the `/brands/mock-brand` checks. `scripts/prove-freshness.mjs` `home` check (line 81) can assert the same for `--mock`. No existing check reads `__last` or compares counts on `/`, so the extra `/items` call is safe. [VERIFIED: grep of `__last|__count`]
- `item-sold` check removes a sold code from every list; the mock's `items()` base already feeds both lists, so a spotlighted-then-sold piece vanishes from the carousel too.

## DOC-01: the exact sweep

Live hits (read this session) [VERIFIED: `git grep` output]:

| File:line | Current wording | Action |
|-----------|-----------------|--------|
| `README.md:9` | "the API's 3000 requests per minute are shared by one server IP" | "the API allows 600 uncached requests a minute per IP, shared by one server IP" (use the literal phrase "600 uncached requests a minute per IP") |
| `.claude/CLAUDE.md:66` | "would hammer the 3000/min shared rate limit" | "the shared limit of 600 uncached requests a minute per IP" |
| `src/lib/howmany/client.ts:49` and `:57` | "shared 3000/min API limit" (two near-duplicate comments) | one comment: "A code that cannot exist never reaches the shared limit of 600 uncached requests a minute per IP"; keep the RESEARCH A1 note and the shortcut note, delete the duplicate line |
| `.planning/research/ARCHITECTURE.md` (49, 151, 219, 283), `PITFALLS.md` (96, 115, 305), `STACK.md:98`, `SUMMARY.md:17` | 3000/min wording | Replace; these are living project research, not under `milestones/` |

Leave as historical record (not "live"): `.planning/milestones/**`, `.planning/quick/261027-*` plans, `.planning/phases/05-*` port 3000 mentions (a port, not the limit), and `docs/refs/issues.json` (verbatim snapshot of upstream issues #1/#2 which themselves say 3000; the upstream How many issue text is outside this repo). [ASSUMED: see Assumptions A2]

Also tighten the sentence in `README.md:9` only as needed; do not touch the Cloudflare rule numbers (30 requests per minute is the shop's own edge rule, unrelated).

Verification command (phrase based, excludes the historical set):
```bash
git grep -n -I -E "3000 ?(requests|/ ?min)|3,000|3000 a minute" -- . ':!.planning/milestones' ':!.planning/quick' ':!docs/refs/issues.json'   # expect no output
git grep -n -F "600 uncached requests a minute per IP" -- README.md .claude/CLAUDE.md src      # expect hits in README, CLAUDE.md, client.ts
```

## Code Examples

Tests the plan should include (all colocated Vitest, `environment: 'node'`):
- `homeSections.test.ts`: `spotlightFirst` (a) spotlight first then newest, (b) a code in both appears once at its spotlight position, (c) empty spotlight returns `newest.slice(0, size)` unchanged, (d) spotlight longer than size is truncated to size, (e) both empty gives `[]`.
- `client.test.ts`: `getFilters` parses `soldBrands` from strings, from `{ value, count }` objects, mixed with a bad entry (`5`, `null`, `''`) dropped alone, missing field gives `[]`, non-array gives `[]`. `getItemsPage('spotlight=true', 10)` fetches `${base}/items?limit=10&spotlight=true` with the cache options (pattern at `client.test.ts:73-79`).
- `homeSections.test.ts` `stripBrands` already covers the tiers (line 20); no change.
- `brands.test.ts`: remove the placeholder test; `brandBySlug` sold-before case already exists (line 52).

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| `SOLD_BEFORE_BRANDS = []` placeholder | `/filters` `soldBrands` | One list feeds strip and brand page |
| Carousel = first 10 of newest | Spotlight first, then newest | Second tagged `/items` call |
| 3000/min limit | 600 uncached requests/min per IP, cache hits do not count | Comments and README only; no code threshold depends on it [CITED: `.planning/PROJECT.md:68`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A spotlight toggle in How many may not fire `store.updated`; the 600 s fallback covers it | Pitfall 3 | Spotlight changes appear up to 10 min late; owner could ask How many to fire the webhook |
| A2 | `docs/refs/issues.json` and `.planning/quick/*` count as historical snapshots and are left alone, while `.planning/research/*` are edited | DOC-01 | If the owner reads success criterion 4 literally for `docs/`, planner must also patch the two lines inside the issues.json snapshot (a one-line node script). Cheap either way: confirm with owner |
| A3 | `soldBrands` entries will be strings or `{ value, count }` | Pattern 1 | Unknown shape yields an empty tier (entries dropped), never an error; revisit when the seller has a sold brand |
| A4 | A sold-before brand's `/items?brand=X` returns 200 with zero items (not 400) | Pitfall 2 | v1.0 built the empty screen for this; confirm once with the live API when a sold brand exists (`brand` accepts exact text, any case per the API contract) |

## Open Questions

1. **Real `soldBrands` shape.** Empty today. Tolerant parser covers both plausible shapes; re-check against the live API once the seller has a sold brand (CONTEXT canonical note already asks for this). Not blocking.
2. **Does `soldBrands` include brands that are currently in stock?** `stripBrands` already excludes in-stock slugs from tier two (`homeSections.ts:18`), so either answer is safe.

## Environment Availability

No new external dependencies. Node, npm, git, gh and curl were all used in this session. Windows cannot run `opennextjs-cloudflare build`, so the worker proof stays CI-only (existing constraint). Local proof uses the Phase 4/5 harness shape (mock on 4010, `next build` with zero API calls, `next start`).

## Security Domain

| ASVS | Applies | Control |
|------|---------|---------|
| V5 Input validation | yes | Zod parse of `soldBrands` (per-entry drop); brand names are rendered as React text and slugged via `brandSlug`; the logo `src` is built only from the `BRAND_LOGOS` manifest (T-04-08 in `BrandStrip.tsx`). A hostile brand name cannot become a path |
| V4 Access control, V2, V3, V6 | no | Read-only public API, no auth |

Threats: arbitrary query minting via the brand page is already bounded (slug must resolve against `filters.brand` or `soldBrands`, anything else is 404 before any `/items` call). The spotlight query is a fixed constant, so it adds exactly one cache key. Privacy: no new field is displayed; `spotlight` is not added to the item whitelist.

## Sources

### Primary (HIGH)
- Live API probe, `https://www.checkhowmany.com/api/v1/stores/blacktail-archive` `/filters` and `/items?spotlight=...` (this session)
- Files read this session: `src/lib/homeSections.ts`, `brands.ts`, `config.ts`, `howmany/client.ts`, `howmany/schemas.ts`, `components/home/BrandStrip.tsx`, `JustDropped.tsx`, `app/page.tsx`, `app/brands/[slug]/page.tsx`, `scripts/mock-howmany.mjs`, `README.md`, `.github/workflows/ci.yml`, test fixtures named above
- GitHub issue #19 (via `gh issue view 19`): spotlight first on the home carousel only, `/just-dropped` unchanged, read the flag in `schemas.ts`. Issue #19 asks to read the flag in the schema, but D-01/D-02 and the live `?spotlight=true` filter make a schema field unnecessary
- `.planning/PROJECT.md:68` (600 uncached requests a minute per IP, cache hits do not count)

### Tertiary (LOW)
- None used.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, nothing new
- Architecture: HIGH, all integration points read
- Pitfalls: HIGH for type fixtures and mock gap; MEDIUM for webhook-on-spotlight (A1)

**Research date:** 2026-11-06
**Valid until:** 2026-12-06 (API fields only ever added; re-check `soldBrands` shape when a sold brand exists)
