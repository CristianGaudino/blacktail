# Phase 2: Branded Catalogue - Research

**Researched:** 2026-10-26
**Domain:** Next 16 App Router storefront UI (Tailwind 4 design tokens, URL-driven filtering over a cached read-only API) on Cloudflare Workers via OpenNext
**Confidence:** HIGH (stack and API contract read from source this session); MEDIUM on three runtime behaviours that only CI or a browser can confirm (listed in Assumptions Log)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Shop folder and theming (TMPL-01, SHELL-01)**
- **D-01:** One deploy is one shop. **There is no multi-shop logic and no shop picker.** All of Blacktail Archive's details live in one folder, `src/shop/`: config (name, contact, platform links, socials, colour-swatch map, New-badge days), shop-specific copy, `theme.css` and logo assets. Components read only from that folder. Another shop would be a copy of the repo with that folder replaced (the owner explicitly rejected a site that holds several shops). Generic UI text stays in `COPY` in `src/lib/copy.ts`, and shop wording goes in the shop folder.
- **D-02:** Palette and fonts are Tailwind `@theme` tokens in `src/shop/theme.css`, imported by `globals.css`. Components use the token names only, never hex values.
- **D-03:** The guard test reads the shop's own values from its config (name, contact email, profile URLs, colour hexes) and fails if any appears in `src/` outside `src/shop/`. It updates itself when config changes.

**Region and placeholders**
- **D-04:** The shop is **Ireland/EU, not the UK**. Never use `.co.uk` URLs. The money formatter uses the `en-IE` locale with the item's own currency (expected EUR).
- **D-05:** The Vinted and eBay profile URLs and contact details are **clearly marked placeholders** in shop config (e.g. `vinted.ie`, `ebay.ie`, a placeholder email) until the owner supplies the real ones. Only config changes when they arrive.

**Footer and header "mock feel"**
- **D-06:** The owner wants to get a feel for the finished site, with everything visible even if it doesn't work yet, and will strip things back later. The footer has the full mockup: logo, nav columns, contact details, Vinted and eBay links, a **non-working newsletter box** and social icons. This knowingly overrides the REQUIREMENTS "no newsletter signup" out-of-scope row for v1, as a visual mock only: no provider and no submission. It must be accessible and must not pretend to submit, for example a disabled input or a clearly non-submitting form.
- **D-07:** Socials: Instagram is a real link (`https://www.instagram.com/blacktailarchive`). TikTok, Pinterest and Spotify are shown as icons **without links** until URLs go in config. Any icon with a URL in config becomes a link.
- **D-08:** "Mock feel" covers only the visible parts of the header, footer and All Items page. No fake pages (no static "Your Bag"). The bag, account and wishlist icons, the bag count and the card hearts are decorative.

**Routes and navigation**
- **D-09:** All Items is at **`/shop`** (e.g. `/shop?brand=Nike&sort=price_asc&page=2`). Item pages will be `/items/[code]` (Phase 3).
- **D-10:** `/` **redirects temporarily (307) to `/shop`** until Phase 4 builds the home page.
- **D-11:** The header and footer show the full nav now: Shop, Brands, Just Dropped, About, Contact. Each links to its real route, which shows the 404 until its phase builds it. The site is `noindex` until Phase 4, so this does no SEO harm.
- **D-12:** **The Shop nav item is a dropdown of types** from `/filters`, linking to `/shop?type=...`. **The Brands nav item is a dropdown of in-stock brands** from `/filters`, linking to `/shop?brand=...` for now (Phase 3 may repoint these to `/brands/[slug]`). Both use the same dropdown component. Labels come from the label maps (D-17).
- **D-13:** The header search icon **opens a search field** in the header. It is a GET form that submits to `/shop?q=...` and works without JS.

**Filter panel (CAT-02, 03, 06, 08)**
- **D-14:** On desktop, filters **apply instantly** when clicked (the URL and results update). Build it as a small client component around a GET form. The mobile drawer keeps its Apply button (CAT-08).
- **D-15:** Colour is shown as **round swatches** as in the mockup, with the colour name as the accessible label. Hex values come from a colour-name map in the shop folder. An unknown colour gets a neutral swatch plus its name.
- **D-16:** Price is a **two-handle range slider** bounded by the `/filters` min and max, with the values shown. Pit-to-pit and length use the same control (shown in cm, sent to the API as mm), and are hidden when the `/filters` range is `null`.
- **D-17:** **Facet counts are hidden.** The `/filters` counts cover all items and don't narrow as filters are picked (narrowing counts are ENG-03, v2).
- **D-18:** Long lists show the **first 8** values in `/filters` order (most common first), then "Show more" expands them in place. Picked values always stay visible.
- **D-19:** Code labels (type, department, condition) come from a map in `COPY` (Knitwear, Shirts, Mens, A Excellent, and so on). An unknown code falls back to the capitalised code, so a new code from How many never breaks the page.
- **D-20:** The **material filter is included** (the API supports `material`), as one more checkbox group using the same component.

**Item cards (CAT-01, CAT-10, SHELL-05)**
- **D-21:** The "New" badge shows on items published in the **last 7 days**, based on `publishedAt`. The number of days is in config.
- **D-22:** Prices look like **€120**, with cents only when needed (€119.50), in `en-IE` format and the item's currency, through one formatter built from integer cents.
- **D-23:** Cards **link to `/items/[code]` now** (404 until Phase 3).
- **D-24:** Cards show the **decorative heart** (aria-hidden, not a button) and a "Colour / Size" line that leaves out whichever part is missing.

### Claude's Discretion
- The "All Items" page banner follows the mockup, with a `public/images/` slot and a placeholder until the lifestyle photos arrive (same approach as HOME-03).
- The mobile menu and drawer details, the sort control's look and placement ("Sort by: Newest" as in the mockup), the empty and error states, and the chip styling all follow the mockups and the Vintage UI conventions.
- How dropdown data is fetched: `/filters` through the existing tagged client, shared by the header and the filter panel.

### Deferred Ideas (OUT OF SCOPE)
- Real Vinted, eBay and contact values: config change when the owner supplies them.
- TikTok, Pinterest and Spotify URLs: config change when available.
- Pointing the Brands dropdown items to `/brands/[slug]`: Phase 3.
- Narrowing facet counts: ENG-03 (v2, needs an API change).

The approved visual contract is `02-UI-SPEC.md` (treat as locked; this document does not restate it, it flags where it cannot be implemented literally: see Pitfalls 4, 5, 6).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-01 | Palette and fonts as design tokens | Tailwind 4 `@theme` in `src/shop/theme.css`; `next/font/local` pattern from Vintage; font files sourced (Standard Stack, Pattern 1) |
| SHELL-02 | Header: logo, nav, search, decorative icons | Header server component + 3 client islands; `/filters` fetched via cached client with try/catch (Pattern 3, Pitfall 2) |
| SHELL-03 | Footer: logo, nav, contact, Vinted/eBay | Server component reading `src/shop/config.ts` (Pattern 1) |
| SHELL-04 | Mobile menu, no horizontal scroll | Native `<dialog>` + Vintage `useModalDialog`; CSS-only body scroll lock (Pattern 6, Pitfall 10) |
| SHELL-05 | One money formatter from integer cents | `Intl.NumberFormat('en-IE')` with per-amount fraction digits (Pitfall 4, Code Examples) |
| CAT-01 | Card grid, no layout shift | `next/image` `unoptimized` + 4:5 frame + API width/height (Pattern 5) |
| CAT-02 | Multi-select filters | Repeated list params, validated against `/filters` (Pattern 2, Code Examples) |
| CAT-03 | Pit-to-pit and length ranges, hidden when `null` | `filters.pitToPitMm` / `lengthMm` nullable; mm in URL, cm in UI |
| CAT-04 | Search by words | `q` param, normalised and length-capped (Pattern 2, Pitfall 3) |
| CAT-05 | Sort | `sort` = `newest` / `price_asc` / `price_desc`, native `<select>` |
| CAT-06 | State in URL, junk dropped | Pure `parseCatalogueQuery` against `/filters` (Pattern 2) |
| CAT-07 | Numbered pages of 24, reset to 1 | `limit=24`, pure pager window function, `page` dropped on any other change (Pattern 2, Code Examples) |
| CAT-08 | Mobile filter drawer with Apply | Draft-state `FilterPanel` in a left-sliding `<dialog>` (Pattern 4, Pitfall 7) |
| CAT-09 | Chips, count, empty state | Chips are links to the same URL minus one value (Pattern 2) |
| CAT-10 | "New" badge | Pure `isNew(publishedAt, now, days)` with days from shop config (Code Examples) |
| SEO-04 | Filtered listings `noindex,follow` + canonical from `SITE_URL` | `generateMetadata` on `/shop` over the cleaned query (Pattern 7, Pitfall 1 on header conflict) |
| TMPL-01 | Shop strings only in `src/shop/`, test enforces | Guard test beside `guard.test.ts` (Pattern 8) |
</phase_requirements>

## Summary

Phase 1 left a small, healthy base: a tagged, cached, server-only How many client (`howmanyFetch`), lenient Zod schemas, `COPY`, `ROUTES`, a baseline of 43 passing tests, and a CI `worker` job that proves the webhook round trip on workerd. Phase 2 adds almost no new infrastructure: it installs Tailwind and icons (none are in `package.json` yet), adds two API reads (`/filters` and a filtered `/items` page) through the same client, and builds a large amount of UI. The hard parts are not libraries; they are (a) keeping every URL a deterministic, bounded cache key, (b) making instant client-side filtering coexist with server-rendered results, and (c) not breaking the Phase 1 proofs that currently assume `/` is the stock page.

The recommended architecture is: pure, unit-tested modules for everything with logic (query parsing/serialising, pager window, money, `isNew`, label maps, shop-string guard), thin server components for layout and the grid, and four small client components (filter panel with draft state, drawer/menu shell, nav dropdown, header search). No new runtime dependencies beyond Tailwind, `tailwind-merge`, `lucide-react` (all already used by Vintage at exactly these versions). Filtering is done by the API; the page cleans the URL against `/filters`, serialises one canonical query string, and fetches with the existing `force-cache` + tag contract.

Three things in the approved UI-SPEC cannot be implemented literally and need a planner decision (Pitfalls 4, 5, 6): the money formatter options it prescribes print `€119.5`; a `redirect()` for a page past the end is a streamed meta redirect (HTTP 200) once `loading.tsx` exists; and the site-wide `X-Robots-Tag: noindex, nofollow` header makes the page-level `noindex,follow` unobservable until Phase 4 (the unit test on the pure robots function is the proof).

**Primary recommendation:** Build the pure query layer first (`src/lib/params.ts` + `getFilters`/`getItemsPage`, fully tested), update `scripts/mock-howmany.mjs` and `scripts/prove-freshness.mjs` in the same plan as the `/` redirect so CI never goes red, then the design tokens and shell, then the catalogue UI on top of both.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Filtering, search, sort, paging | API (How many) | Frontend Server | The API does it (project decision); the server only cleans params and serialises one canonical query |
| URL param validation (CAT-06) | Frontend Server (SSR) | Browser (building next URL) | Validation must happen before the API call (API 400s on unknown codes); the client only builds hrefs from already-clean server state |
| Cached reads, revalidation | Frontend Server (Worker) | R2 / D1 (OpenNext) | Existing Phase 1 contract: `fetch` + tag `store:<slug>` |
| Result grid, cards, pager, chips | Frontend Server (SSR) | — | Pure presentation of server data; chips/pager are plain links so they work without JS |
| Instant filter apply, draft state | Browser | — | Interactive only: builds a URL and calls `router.push` |
| Mobile drawer / menu / dropdowns / search disclosure | Browser | Frontend Server (initial HTML) | Open state is client state; contents are server-rendered props |
| "New" badge, money formatting | Frontend Server | Browser (slider read-out) | Same pure formatter used on both sides so output is identical (no hydration mismatch) |
| Theme tokens, fonts, logo | CDN / Static (build-time CSS, `public/`, fonts) | — | Compiled CSS and self-hosted woff2 |
| Shop strings and colours | Static config (`src/shop/`) | — | Single replaceable folder (D-01) |
| Robots meta + canonical | Frontend Server (`generateMetadata`) | Header in `next.config.ts` | Page-level meta; global header stays until Phase 4 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.1 (installed) | App Router | Already pinned [VERIFIED: package.json] |
| react / react-dom | 19.3.0 (installed) | UI | Already pinned |
| zod | ^4.6.7 (installed) | `filtersSchema`; may also parse URL params | Phase 1 convention |
| tailwindcss | 4.3.3 | Design tokens via `@theme`, utilities | Same version as Vintage's lockfile [VERIFIED: C:\Git\vintage\package-lock.json: tailwindcss 4.3.3; gsd-tools package-legitimacy: OK] |
| @tailwindcss/turbopack | 4.3.3 | Tailwind loader for Next's Turbopack | Required by Vintage's `next.config.ts` `turbopack.rules`; see audit (SUS) |
| lucide-react | 1.57.0 (exact) | Icons | Vintage lockfile resolves 1.57.0; icons used by the UI-SPEC all exist in it (checked: `search user heart shopping-bag menu x chevron-down chevron-right chevron-left plus minus check arrow-right sliders-horizontal`) [VERIFIED: tarball `lucide-react@1.57.0` dist/esm/icons]; it has no brand icons (instagram, tiktok, pinterest, spotify) so those are inline SVGs |
| tailwind-merge | ^3.7.0 | `cn()` inside `components/ui` only | Vintage convention; Vintage lock 3.7.0 [VERIFIED: gsd-tools OK] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@fontsource/bodoni-moda` | 5.3.0 (NOT a dependency) | Source of `bodoni-moda-latin-700-normal.woff2` | Download the tarball once, commit the single woff2 + `LICENSE` into `src/shop/fonts/`; do not add to `package.json` [VERIFIED: `npm pack @fontsource/bodoni-moda@5.3.0` contains `package/files/bodoni-moda-latin-700-normal.woff2` and `package/LICENSE`] |
| Montserrat Variable woff2 | — | Body font | Copy `C:\Git\vintage\src\fonts\Montserrat-Variable.woff2` and `OFL-Montserrat.txt` [VERIFIED: files listed in `C:\Git\vintage\src\fonts`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<input type="range">` x2 | a slider library (e.g. noUiSlider, Radix Slider) | Library adds a dependency, ARIA and keyboard handling already come free from native inputs; UI-SPEC already specifies native |
| Next `<Link>` for chips/pager | plain `<a>` | `<Link>` keeps client navigation; set `prefetch={false}` (Pitfall 9) |
| `useSearchParams()` in the client panel | server passes cleaned state as props | Props avoid the Suspense requirement and the case where the URL holds junk that the server already dropped |

**Installation:**
```bash
npm install tailwind-merge@^3.7.0 lucide-react@1.57.0
npm install -D tailwindcss@4.3.3 @tailwindcss/turbopack@4.3.3
```
(Vintage puts `tailwindcss` and `@tailwindcss/turbopack` in devDependencies; copy that.) Then copy the `turbopack.rules` block from `C:\Git\vintage\next.config.ts` into `next.config.ts` unchanged:
```ts
turbopack: { rules: { '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' } } },
```
[VERIFIED: read at `C:\Git\vintage\next.config.ts`, `turbopack:` block].

**Version verification:** `npm view` this session: tailwindcss 4.3.3 (modified 2026-10-19), @tailwindcss/turbopack 4.3.3 (2026-10-19), lucide-react latest 1.61.0 (2026-10-21; pin to Vintage's 1.57.0), tailwind-merge 3.7.0 (2026-10-23), @fontsource/bodoni-moda 5.3.0.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| tailwindcss | npm | years (4.3.3 published 2026-07-16 line) | ~117M/wk | github.com/tailwindlabs/tailwindcss | OK | Approved |
| tailwind-merge | npm | years | ~68M/wk | github.com/dcastil/tailwind-merge | OK | Approved |
| @tailwindcss/turbopack | npm | ~3 mo (first publish 2026-07-31) | 0/wk reported | github.com/tailwindlabs/tailwindcss | SUS (low-downloads) | Flagged: planner adds a `checkpoint:human-verify` before install |
| lucide-react | npm | years | ~81M/wk | github.com/lucide-icons/lucide | SUS (too-new: 1.61.0 published 2026-10-21) | Flagged: pin exactly `1.57.0` (Vintage's locked version), checkpoint is a one-line confirm |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@tailwindcss/turbopack` [WARNING: flagged as suspicious, verify before using.] and `lucide-react` [WARNING: flagged as suspicious, verify before using.]

Evidence that reduces both to a quick confirmation: `@tailwindcss/turbopack` depends only on `tailwindcss`, `@tailwindcss/node`, `@tailwindcss/oxide` and `@alloc/quick-lru`, repository `tailwindlabs/tailwindcss`, same 4.3.3 as `tailwindcss`, no `postinstall` script [VERIFIED: `npm view @tailwindcss/turbopack dependencies repository.url scripts.postinstall`]; it is already in `C:\Git\vintage\package-lock.json` at 4.3.3 and `package.json` (production-proven by the user's other repo). `lucide-react` has no postinstall script and Vintage locks 1.57.0. No package here has a `postinstall` [VERIFIED: `npm view <pkg> scripts.postinstall` empty for all four].

Lockfile note: Vintage's lock contains `node_modules/@tailwindcss/oxide-linux-x64-gnu`, so a Windows `npm install` produced a lock that works on the Linux CI. Confirm with the CI `npm ci` on the first PR [VERIFIED: Vintage package-lock key present].

## Architecture Patterns

### System Architecture Diagram

```
Browser                          Cloudflare Worker (OpenNext)                      How many API
-------                          ----------------------------                      ------------
GET /            ------------->  next.config redirect 307 ------------> /shop (no layout render, no API call)

GET /shop?brand=nike&PRICE=x&page=9
                 ------------->  RootLayout
                                   ├─ Header (await connection())
                                   │    └─ getFilters()  [React cache + fetch force-cache, tag store:slug] ----> /filters   (cached: R2, 600s + webhook)
                                   │         try/catch -> on failure dropdowns show only their fixed link
                                   └─ /shop/page.tsx (await connection(), await searchParams)
                                        1. filters = getFilters()                       (same cached call, deduped)
                                        2. query   = parseCatalogueQuery(raw, filters)  (pure: drop junk, canonicalise case, clamp ranges)
                                        3. data    = getItemsPage(query)                ---------------> /items?limit=24&brand=Nike...  (canonical string = cache key)
                                        4. page > pageCount ? redirect(last page)
                                        5. render: Banner, Toolbar(count, Sort), Chips(<Link>), ItemGrid(<ul>), Pager(<Link>)
                                           + FilterPanel(props: filters, selected)  <-- client island
                                   └─ Footer (server, reads src/shop only)
                 <-------------  HTML (+ RSC payload)

Client island: FilterPanel
   draft state (from props) --change--> buildHref(draft) --debounce 250ms / on slider `change`--> router.push(href, {scroll:false})
        ^                                                                                              |
        └──────── re-sync draft when server `search` prop changes (Back/Forward, chip click) <---------┘

Webhook POST /api/webhooks/howmany --> revalidateTag(store:slug, {expire:0}) --> next read of any /filters or /items URL refetches
```

### Recommended Project Structure
```
src/
├── shop/                         # EVERYTHING shop-specific (D-01). Replace this folder for another shop
│   ├── config.ts                 # name, contact, platform links, socials, newBadgeDays, bannerImage (null = placeholder), colour map import
│   ├── copy.ts                   # shop wording (footer tagline, newsletter body if shop-specific, About stub later)
│   ├── colours.ts                # lowercase colour name -> hex
│   ├── theme.css                 # @theme tokens: colours, font families
│   ├── fonts.ts                  # next/font/local (Bodoni Moda 700, Montserrat Variable)
│   ├── fonts/                    # woff2 + OFL licences
│   └── logo.svg                  # tightened viewBox copy of docs/assets/blacktail_brandmark_and_text.svg
├── styles/globals.css            # @import 'tailwindcss'; @import '../shop/theme.css'; base + utilities (no hex)
├── lib/
│   ├── config.ts                 # + CATALOGUE {pageSize:24, maxQueryChars, maxValuesPerList...}, SEARCH_PARAMS, SORTS, FACET_SHOW_FIRST:8
│   ├── copy.ts                   # + catalogue/header/footer text, code-label maps, wording functions
│   ├── routes.ts                 # + shop, items(code), brands, justDropped, about, contact
│   ├── params.ts                 # parseCatalogueQuery, toSearchString, withoutValue, withPage (pure, mirrors Vintage lib/params.ts)
│   ├── paging.ts                 # pageCountOf, pageLinks(page, pageCount) (pure)
│   ├── money.ts                  # formatMoney(cents, currency)
│   ├── labels.ts                 # label(code, map) with capitalise fallback
│   ├── seo.ts                    # listingRobots(), absoluteUrl(), canonical for /shop
│   ├── utils.ts                  # cn, isNavActive (copy from Vintage)
│   └── howmany/{client,schemas}.ts   # + getFilters, getItemsPage, filtersSchema
├── hooks/useModalDialog.ts       # copy from Vintage
├── components/
│   ├── layout/    Header, HeaderSearch*, NavDropdown*, NavLink*, MobileMenu*, Footer, NewsletterMock     (* = client)
│   ├── catalogue/ ItemCard, ItemGrid, FilterPanel*, FilterGroup*, ColourSwatches*, RangeSlider*, FilterChips, SortSelect*, FilterDrawer*, Pager, CatalogueBanner, CatalogueShell* (pending context)
│   └── ui/        buttons, Checkbox, Chip, Sheet*, SocialIcons, StatusScreen (restyled)
└── app/
    ├── layout.tsx                # fonts, theme, Header, Footer, robots default
    ├── shop/{page.tsx, loading.tsx}
    └── error.tsx                 # restyle only
```

### Pattern 1: Shop seam and tokens (SHELL-01, TMPL-01)
**What:** `src/shop/theme.css` holds only `@theme` tokens; `globals.css` imports it after Tailwind. Fonts come from `next/font/local` set on `<html>` as CSS variables, mapped to Tailwind font tokens with `@theme inline`.
**When to use:** all colour and font usage. Components use `bg-ivory`, `text-forest`, `font-heading`; never a hex.
```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "../shop/theme.css";

/* src/shop/theme.css (the only CSS file allowed to contain hex values) */
@theme {
    --color-forest: #1F2A1F;
    --color-olive:  #4A5A46;
    --color-stone:  #A69D8F;
    --color-sand:   #CBB89E;
    --color-ivory:  #E8E5DD;
}
@theme inline {
    --font-heading: var(--font-bodoni);
    --font-sans:    var(--font-montserrat);
}
```
Palette hexes quoted from `.planning/PROJECT.md` "Forest `#1F2A1F` (primary), Olive `#4A5A46`, Stone `#A69D8F`, Sand `#CBB89E`, Ivory `#E8E5DD`" [VERIFIED: PROJECT.md read this session]. Vintage maps `next/font/local` variables with `--font-primary: var(--font-montserrat)` inside `@theme inline` [VERIFIED: `C:\Git\vintage\src\styles\globals.css:142`]; layout applies `${montserrat.variable}` on `<html>` [VERIFIED: `C:\Git\vintage\src\app\layout.tsx:41`]. `next/font/local` `src` must be relative to the file that calls it, so put `fonts.ts` next to `fonts/` inside `src/shop/`:
```ts
// src/shop/fonts.ts  (pattern from C:\Git\vintage\src\components\ui\fonts.ts)
import localFont from 'next/font/local';
export const montserrat = localFont({ src: './fonts/Montserrat-Variable.woff2', weight: '400 700', variable: '--font-montserrat' });
export const bodoni     = localFont({ src: './fonts/BodoniModa-700.woff2',      weight: '700',     variable: '--font-bodoni' });
```

### Pattern 2: Pure query layer (CAT-02..07)
**What:** One module turns raw `searchParams` plus the cached `/filters` into a clean, typed `CatalogueQuery`, and one function serialises it. Everything (page, chips, pager, canonical, API call, client panel) derives from these two.
**Rules:**
1. Unknown keys dropped. List params: every value must match a `/filters` value case-insensitively; emit the `/filters` spelling (so `nike` and `Nike` become one cache key). Cap values per list.
2. `sort` must be one of `newest | price_asc | price_desc`, else default; default omitted from URLs.
3. `page`: integer >= 1 else 1; omitted when 1.
4. Ranges: parse integer, clamp into the `/filters` range, drop when equal to the bound, swap or drop if min > max; drop entirely when the `/filters` range is `null`. Snap to the step (100 cents for price, 10 mm for measurements) so arbitrary integers cannot mint cache keys.
5. `q`: trim, collapse whitespace, cap length (config), lowercase for the API call.
6. One canonical serialisation: keys sorted, values sorted within a key, `limit=24` always sent to the API.
7. A change to anything except `page` drops `page` (CAT-07).
Helpers mirror Vintage's `lib/params.ts` (`parse*`, `href` builders, `withPage`) and `lib/paging.ts` [VERIFIED: read both files this session].

### Pattern 3: Shared, deduped, failure-tolerant `/filters` read
**What:** `getFilters()` is called by the Header, the page and `generateMetadata`. Phase 1's `howmanyFetch` passes `signal: AbortSignal.timeout(...)`, which opts out of Next's fetch memoization [CITED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md, "Memoization" section: "To opt out, pass an AbortController signal to fetch"], so wrap the exported readers in React `cache()` to dedupe per request. The Header must catch errors (Pitfall 2).

### Pattern 4: Filter panel as a draft-state client component (D-14, CAT-08)
**What:** `FilterPanel` receives `filters` (from `/filters`), `selected` (clean query) and `search` (its serialised string) as props. It holds a `draft` copy in state, renders controlled inputs from it, and on change either pushes immediately (sidebar, `mode='instant'`) or waits for Apply (drawer, `mode='apply'`). When the `search` prop changes (Back, chip click, a push finishing) it re-initialises the draft using the "adjust state during render" pattern (`if (prev !== search) { setPrev(search); setDraft(fromProps) }`). It also renders real `name` attributes inside `<form action="/shop" method="get">` so the no-JS submit works.
**Why not `key={search}` on the form:** remounting closes every `<details>`, collapses "Show more", and drops keyboard focus after each toggle (Pitfall 7).
**Pending UI:** a small `CatalogueShell` client component owns `useTransition` and a context; `FilterPanel`/`SortSelect` call `startTransition(() => router.push(href, { scroll: false }))`; a `GridBusy` client wrapper around the server-rendered grid reads `isPending` and applies the 60% opacity and `aria-busy`. `loading.tsx` alone will not show on a search-param-only navigation because the router wraps navigations in a transition and React keeps the old UI [ASSUMED: standard React transition behaviour; confirm in the browser].
**Drawer:** mount the drawer's `FilterPanel` only while open (`{open && ...}`) to avoid a second full copy of the DOM and duplicate ids; use `useId()` for every input id.

### Pattern 5: Item card (CAT-01, CAT-10, D-21..24)
`<li><Link href={ROUTES.item(code)} prefetch={false}>` wrapping a 4:5 frame (`aspect-[4/5] bg-sand/40`) and `next/image` with the API's `width`/`height`, `className="size-full object-cover"`, `unoptimized` already set in `next.config.ts` [VERIFIED: next.config.ts `images: { unoptimized: true }`]. In Next 16 the `priority` prop is deprecated in favour of `preload`, and the docs say to prefer `loading="eager"` or `fetchPriority="high"` in most cases [CITED: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md, `priority` and `preload` sections]. Use `loading="eager" fetchPriority="high"` for the first row (index < 4) and the default lazy loading for the rest. `isNew(publishedAt, now, days)` is pure, takes `now` as an argument, and returns `false` for an unparseable date.

### Pattern 6: Dialog shells (SHELL-04, CAT-08)
Copy Vintage's `useModalDialog` verbatim [VERIFIED: `C:\Git\vintage\src\hooks\useModalDialog.ts` read]. Vintage's `Sheet` is a bottom sheet; Blacktail needs a left slide-in variant (`side` prop), same hook. Keep the dialog's own padding at zero and put padding on an inner wrapper: the hook closes when `e.target === e.currentTarget`, so a click on the dialog's own padding would otherwise close it. Lock body scroll in CSS, no JS: `body:has(dialog[open]) { overflow: hidden; }`. Slide animation via `@keyframes` on `dialog[open]`, disabled under `prefers-reduced-motion`.

### Pattern 7: Listing metadata (SEO-04)
`generateMetadata({ searchParams })` awaits `searchParams`, calls the same cached `getFilters()`, cleans the query, and returns `robots` + `alternates.canonical`. Metadata objects from nested segments are shallowly merged and duplicate keys replaced [CITED: generate-metadata.md "shallowly merged"], so a page-level `robots` fully replaces the layout's: the page must emit the complete value itself.
- Filtered, searched or sorted (any of: a list filter, a range, `q`, a non-default `sort`): `{ index: false, follow: true }`.
- Clean listing (including plain `?page=2`): `{ index: SITE_INDEXABLE, follow: SITE_INDEXABLE }` where `SITE_INDEXABLE` is a single `false` constant in `src/lib/seo.ts` until Phase 4 (SEO-03 makes it environment-driven). This keeps the Phase 1 CI check (`noindex` meta in the HTML) passing.
- Canonical: absolute, `${SITE_URL}/shop` + the serialised clean query (self-canonical with junk and case variants collapsed). `SITE_URL` comes from `storeEnv()` inside the function, never at module scope.

### Pattern 8: Shop-string guard (D-03, TMPL-01)
A test beside `guard.test.ts` that imports `src/shop/config.ts` (and the colour map, and reads hex literals out of `theme.css`), builds a list of needles (shop name, contact email, every profile URL, every hex, the Instagram handle), then scans every `.ts`, `.tsx` and `.css` under `src/` except `src/shop/**` and itself, case-insensitively. Include a "cannot pass vacuously" test exactly like `guard.test.ts` (a sample containing a needle must be caught). Test fixtures elsewhere must use neutral values (`Acme`, `test-shop`), never Blacktail's. Currently no file under `src/` mentions blacktail or archive [VERIFIED: `grep -rniE "blacktail|archive" src` returned nothing], so the guard starts green. Extend `copy.test.ts` to also run its em dash scan over the shop copy object.

### Anti-Patterns to Avoid
- **`key={search}` on the filter form or lists:** focus loss and collapsed groups (Pattern 4).
- **`useSearchParams()` in the panel:** needs Suspense and reads un-cleaned junk; use server-cleaned props.
- **Calling `fetch` from a component:** all reads stay in `src/lib/howmany/client.ts` (project rule).
- **Dynamic Tailwind class names** (`grid-cols-${n}`): the compiler only sees static strings.
- **Hex or shop names outside `src/shop/`:** fails the guard test by design.
- **A global `error.tsx` expectation for layout failures:** `error.tsx` does not wrap the `layout.js` in the same segment (Pitfall 2).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | string concatenation of `€` and cents | `Intl.NumberFormat('en-IE', { style: 'currency', currency })`, choosing 0 or 2 fraction digits per amount | Locale-correct symbol placement; see Pitfall 4 for the digit rule |
| Query string building/encoding | manual `&` joins | `URLSearchParams` (`append` for repeated keys) | Encoding and repeated params |
| Modal focus trap, Esc, backdrop | custom overlay | native `<dialog>.showModal()` via Vintage `useModalDialog` | Browser handles focus trap and inert background |
| Dual-handle slider | pointer-math slider | two overlaid native `<input type="range">` | Keyboard and screen-reader support come free |
| Collapsible groups | custom accordion state | `<details>/<summary>` | Native, works without JS |
| Class merging | string templates | `cn()` (`tailwind-merge`) inside `components/ui` only | Vintage convention |
| Debounce of typed search | new hook | Vintage `useDebouncedSearch` only if live-typing search is wanted (it is not: search is a GET form) | Not needed in this phase |
| Image sizing | own aspect maths | API `width`/`height` + CSS `aspect-ratio` | Contract from the API (CLAUDE.md "never derive sizes") |
| Social brand icons | an icon package | 4 inline SVGs in `ui/SocialIcons.tsx` | `lucide-react` 1.57.0 has none of them [VERIFIED: tarball listing] |

**Key insight:** every piece of logic in this phase is small and pure; the risk is in wiring (cache keys, redirects, client/server state), not in missing libraries.

## Common Pitfalls

### Pitfall 1: Global `X-Robots-Tag` hides SEO-04
**What goes wrong:** `next.config.ts` sets `X-Robots-Tag: noindex, nofollow` on every path [VERIFIED: next.config.ts `SECURITY_HEADERS`: `{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }`]. A crawler combines header and meta and obeys the most restrictive, so `noindex,follow` on filtered pages is not observable in production until Phase 4.
**How to avoid:** Implement and unit-test `listingRobots()` and the canonical builder as pure functions (this is the verifiable SEO-04 surface). Do not remove the header (CONTEXT: site stays `noindex` until Phase 4). Verification step: `curl` the HTML of a filtered `/shop` URL on the Worker and assert `<meta name="robots" content="noindex, follow">` and `<link rel="canonical" href="https://...">`.
**Warning signs:** a plan that edits the header to "make SEO-04 visible".

### Pitfall 2: A layout that fetches the API breaks builds, error pages and 404s
**What goes wrong:** Header calls `/filters` on every page. (a) Without a request-time API in that component, Next tries to prerender layouts and fetches the API at build time, breaking DATA-06 and the CI step "The build made no How many calls". (b) If the fetch throws, `error.tsx` does not catch it: "It does not wrap the layout.js or template.js above it in the same segment" [CITED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md line 96], so the app falls through to `global-error`. (c) The built-in 404 page also renders the root layout.
**How to avoid:** Header starts with `await connection()` (as Phase 1's page does) and wraps `getFilters()` in `try/catch`, returning empty lists on failure (the UI-SPEC already says an empty dropdown shows only its fixed link). The page itself must NOT swallow errors, so the existing error screen and the CI outage proof keep working. Keep the CI "build made no calls" check as the guard; if `/_not-found` prerender calls the API, it fails there.
**Warning signs:** `{"store":0,"items":0}` assertion failing in CI after the Header lands.

### Pitfall 3: Unbounded cache keys and shared rate limit
**What goes wrong:** Every distinct `/items?...` URL is a separate R2 cache entry and a separate API call. Arbitrary `q` strings, arbitrary price integers or un-normalised case (`nike`/`Nike`) mint endless keys; the limit is 3000 requests a minute per IP shared by everything [VERIFIED: docs/refs/issues.json issue #2: "3000 requests a minute per IP"].
**How to avoid:** Pattern 2 rules 1, 4, 5, 6 (canonical case, snapping, caps, one serialisation). Accept the residual risk (free-text `q` is still enumerable); a 429 surfaces as the existing error screen and is never cached (DATA-03). Note in the plan; no rate limiter in v1.

### Pitfall 4: The UI-SPEC money options print `€119.5`
**What goes wrong:** UI-SPEC says use `minimumFractionDigits: 0` and `maximumFractionDigits: 2`. Verified in Node 24: that configuration formats 11950 cents as `€119.5` and 11905 as `€119.05`, not `€119.50` [VERIFIED: ran `new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:0,maximumFractionDigits:2}).format(119.5)` this session, output `€119.5`].
**How to avoid:** choose digits per amount: `cents % 100 === 0 ? 0 : 2` for both min and max. Output then: 12000 -> `€120`, 11950 -> `€119.50`. Unit-test those two plus 11905 and a non-EUR currency (GBP -> `£120`, USD -> `US$120` under `en-IE`).

### Pitfall 5: `redirect()` after streaming starts is not an HTTP 307
**What goes wrong:** "When used in a streaming context, this will insert a meta tag to emit the redirect on the client side" [CITED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md line 12]. With `loading.tsx` the page is inside a Suspense boundary, so the shell is flushed with 200 before the page can decide the page number is past the end.
**How to avoid:** Keep `loading.tsx` (UI-SPEC requirement) and treat "page past the last page" as a client-side/meta redirect; put the decision in a pure function (`resolvePage(requested, total)` returning `'ok' | { redirectTo }`) and unit-test it. Do not promise a 307 in acceptance checks; the `/` -> `/shop` redirect (D-10) is separate and IS a real 307 because it is a `next.config.ts` redirect with `permanent: false` [CITED: redirects.md line 30: "if `false` will use the 307 status code"]. Use the config redirect, not a page, for `/` so no layout or API call runs.

### Pitfall 6: Phase 1 proofs assume `/` is the stock page
**What goes wrong:** `scripts/prove-freshness.mjs` fetches `${base}/` with `redirect: 'manual'` and requires status 200 plus a `data-as-of` attribute [VERIFIED: scripts/prove-freshness.mjs `page()` and the `ready` check]. After D-10, `/` is a 307, so the CI `worker` job goes red. The mock (`scripts/mock-howmany.mjs`) answers every non-`/items` path with the store object, so `/filters` would return `{slug,name,currency}` and `filtersSchema` parsing would fail; it also ignores query params (always one item). CI also warms up on `/` and deploy smoke curls `/`.
**How to avoid (same plan as the redirect):**
1. `prove-freshness.mjs`: request `/shop` instead of `/` (one-line change in `page()`; keep `data-as-of` on the grid section).
2. `mock-howmany.mjs`: add a `/filters` branch returning every documented key (facets arrays with `{value,count}`, `priceCents`/`pitToPitMm`/`lengthMm` objects) and make `/items` honour `page`/`limit` minimally; keep counting in the same two counters so `{"store":0,"items":0}` after build still holds.
3. `ci.yml` warm-up and `deploy-workers.yml` smoke (`curl .../` lines) point at `/shop`. The deploy `x-robots-tag` header grep should hit `/shop` (a 200), not rely on headers being attached to a redirect response.
4. Keep the `noindex` meta check passing (Pattern 7).
5. The "cache-hit" proof asserts zero upstream calls on warm views; `/shop` makes two upstream reads (`/items?...`, `/filters`), both cached, so it still holds.

### Pitfall 7: Controlled draft state, not remounting
See Pattern 4. Symptoms of getting it wrong: after ticking a box with the keyboard, focus jumps to `<body>` once the navigation lands; groups the shopper opened snap shut; "Show more" re-collapses.

### Pitfall 8: Range inputs fire on every pixel, and two overlaid ranges swallow clicks
**What goes wrong:** React's `onChange` on `<input type="range">` maps to the `input` event (fires continuously while dragging). UI-SPEC wants apply "on release (the `change` event)". Two stacked range inputs: the top one captures all pointer events so the lower thumb cannot be grabbed.
**How to avoid:** attach a native `change` listener (ref + `addEventListener('change', ...)`), or use `onPointerUp` + `onKeyUp`; use `onChange` only to update the read-out. CSS: `pointer-events: none` on both inputs and `pointer-events: auto` on `::-webkit-slider-thumb` and `::-moz-range-thumb`, with a 44px hit area on the thumb. Clamp so min never exceeds max. Keep raw units in the input values (cents, mm) and format only the read-out, so the no-JS GET form sends API-ready values.

### Pitfall 9: Prefetch storms and rate limit
24 cards plus ~10 type links plus ~30 brand links with default `<Link>` prefetching can fan out requests once Phase 3 item pages exist (each item page reads the API). Set `prefetch={false}` on card links, dropdown rows and chips [ASSUMED: prefetch behaviour for dynamic routes without a `loading.tsx` varies; the setting is free and safe].

### Pitfall 10: `<dialog>` details
`body:has(dialog[open])` scroll lock (no JS); close on backdrop click only when the click target is the dialog element itself; avoid `100vh` (use `100dvh`) for the full-height panels so mobile browser chrome does not hide the sticky Apply footer; test at 320 px for horizontal overflow (long brand names: use `[overflow-wrap:anywhere]` as Vintage's Sheet title does).

### Pitfall 11: Next `error.tsx` prop is `retry`, not `reset`
Next 16.4 documents `retry` [VERIFIED: error.md example `{ error, retry }`] and Phase 1's `src/app/error.tsx` already uses it. Restyle only; keep the prop name.

### Pitfall 12: Component tests cannot render hook-using client components
`vitest.config.mts` is `environment: 'node'`, `include: ['src/**/*.test.ts']` [VERIFIED: vitest.config.mts], and `ItemList.test.ts` renders with `renderToStaticMarkup(createElement(...))`. `useRouter` throws outside the app router. Put logic in pure modules (`params.ts`, `buildHref(draft)`, `pageLinks`) and test those; render-test only server components (card, grid, chips, pager). No jsdom, no new test dependency.

## Code Examples

### API contract (verbatim, from `docs/refs/issues.json` issue #2)
> - `sort`: `newest` (default, by when it was added to the store), `price_asc`, `price_desc`
> - `q`: words that must each be in the title, brand or colour (any case)
> - Lists, any of the values matches. Repeat the param for several, e.g. `?type=shirt&type=knit`: `brand`, `size`, `colour`, `era`, `material`: exact text, any case; `category`: ...; `type`: ...; `condition`: `A`, `AB`, `B`; `department`: `mens`, `womens`
> - Ranges, inclusive, whole numbers: `minPrice` / `maxPrice` (cents), `minPitToPitMm` / `maxPitToPitMm`, `minLengthMm` / `maxLengthMm`
> An unknown category, type, condition or department, or anything else invalid, returns 400.
> `"priceCents": { "min": 900, "max": 12000 }, "pitToPitMm": { "min": 480, "max": 640 }, "lengthMm": null` ... `A range is null when no shown item has that value.`
> `page`: 1 or more, default 1; `limit`: 1 to 100, default 24 ... The last page is when `page * limit >= total`.

[VERIFIED: docs/refs/issues.json issue #2 body, read this session]. `/filters` facet entries are `{ "value": "Ralph Lauren", "count": 12 }`, "most common first, and values that differ only in case are one entry".

### Existing client signature that must widen
```ts
// src/lib/howmany/client.ts:24 (verbatim)
async function howmanyFetch<S extends z.ZodType>(path: string, schema: S, params?: Record<string, string>): Promise<{ data: z.output<S>; asOf: string | null }> {
```
[VERIFIED: client.ts:24]. Change `params` to `URLSearchParams` and sort by key then value for the cache key; keep `cache: 'force-cache'`, `next: { tags: [storeTag()], revalidate: CACHE.revalidateSeconds }`, the timeout signal and the "no headers" rule (tested in `client.test.ts`).

### Filters schema (lenient: Header depends on it on every page)
```ts
// src/lib/howmany/schemas.ts (addition)
const facet = z.array(z.object({ value: z.string(), count: z.number() })).default([]);
const range = z.object({ min: z.number(), max: z.number() }).nullable().default(null);
export const filtersSchema = z.object({
    brand: facet, size: facet, colour: facet, era: facet, material: facet,
    category: facet, type: facet, condition: facet, department: facet,
    priceCents: range, pitToPitMm: range, lengthMm: range,
});
```
Keys are exactly the documented `/filters` keys above [VERIFIED: issue #2 `/filters` JSON]. Unknown extra keys are stripped (same privacy whitelist behaviour as Phase 1).

### Readers (new)
```ts
// src/lib/howmany/client.ts (additions; keep 'server-only' at top)
import { cache } from 'react';
export const getFilters   = cache(async (): Promise<Filters>  => (await howmanyFetch('/filters', filtersSchema)).data);
export const getItemsPage = cache(async (params: string): Promise<{ page: ItemsPage; asOf: string | null }> => {
    const { data, asOf } = await howmanyFetch('/items', itemsPageSchema, new URLSearchParams(params));
    return { page: data, asOf };
});
// React cache() keys on argument identity: pass the canonical query STRING, not an object.
```
`getItems()` (Phase 1: fetch every page) loses its only consumer when `/` stops rendering the list; delete it with `ItemList` and port its page-following tests to `getItemsPage`. A 400 from `getItemsPage` should render the empty state (defensive: `/filters` and `/items` are separate cache entries that can briefly disagree), not the error screen.

### Money
```ts
// src/lib/money.ts
const cache = new Map<string, Intl.NumberFormat>();
export function formatMoney(cents: number, currency: string): string {
    const digits = cents % 100 === 0 ? 0 : 2;
    const key = `${currency}${digits}`;
    let f = cache.get(key);
    if (!f) cache.set(key, f = new Intl.NumberFormat('en-IE', { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }));
    return f.format(cents / 100);
}
```
Locale `en-IE` is a shop-level value; read it from `src/shop/config.ts` rather than hard-coding in `lib/money.ts` (the guard does not flag locales, but the template rule says per-shop values come from config).

### Pager window (pure, tested)
```ts
// first, last, current and one neighbour either side, 'gap' between non-adjacent runs
export function pageLinks(page: number, count: number): (number | 'gap')[] {
    const keep = new Set([1, count, page - 1, page, page + 1].filter(n => n >= 1 && n <= count));
    const sorted = [...keep].sort((a, b) => a - b);
    return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ['gap' as const, n] : [n]));
}
```

### Debounced instant apply (client)
```ts
// inside FilterPanel (client)
const router = useRouter();
const [, startTransition] = useTransition();   // or the CatalogueShell context version
const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
const push = (next: Draft, immediate = false) => {
    clearTimeout(timer.current);
    const go = () => startTransition(() => router.push(buildHref(next), { scroll: false }));
    immediate ? go() : (timer.current = setTimeout(go, 250));
};
```
`router.push(href, { scroll: false })` is the documented option [CITED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md "Disabling scroll to top"]. `buildHref` is the shared pure serialiser (drops `page`, defaults and range-at-bound).

### Colour swatch fallback
Lookup `SHOP.colours[value.toLowerCase()]`; missing -> neutral `bg-sand` swatch plus the visible name (UI-SPEC). The map and its hexes live in `src/shop/colours.ts` so the guard covers them.

### Code labels
`label(code, map) = map[code.toLowerCase()] ?? code.charAt(0).toUpperCase() + code.slice(1)`.
How many's type codes, from the seller app that produces them: `'jacket', 'coat', 'fleece', 'knit', 'sweatshirt', 'hoodie', 'shirt', 'polo', 'tshirt', 'trousers', 'jeans', 'shorts', ... 'other'` (clothing; shoes, accessories, tech and book codes also exist) and departments `['mens', 'womens']`, conditions `['A', 'AB', 'B']` [VERIFIED: `C:\Git\vintage\src\lib\config.ts:195-206` (`ITEM_TYPES`), `:171` (`CONDITIONS`), `C:\Git\vintage\src\lib\sizes.ts:8` (`DEPARTMENTS`)]. Seed the `COPY` maps with the clothing codes at minimum (wording is a copy decision; mockup shows Jackets, Knitwear, Sweatshirts, T-Shirts, Shirts, Denim, Trousers). Condition wording is the project decision: A Excellent, AB Very good, B Good (PROJECT.md Key Decisions) [VERIFIED].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority` on `next/image` | `preload`, or `loading="eager"` / `fetchPriority="high"` | Next 16.0 | Use `fetchPriority` for the first row |
| `revalidateTag(tag)` | `revalidateTag(tag, { expire: 0 })` | Next 16 | Already done in Phase 1 |
| Synchronous `searchParams` | `await searchParams` (Promise) | Next 15 | Page and `generateMetadata` both await it |
| `reset` prop in `error.tsx` | `retry` | Next 16.4 docs | Phase 1 already uses `retry` |
| JS scroll lock for modals | `body:has(dialog[open])` | Baseline | No JS needed |

**Deprecated/outdated:** `middleware.ts` (renamed `proxy.ts`; not used here), `next/font/google` (build-time network).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Type label wording (Jackets, Knitwear, T-shirts, ...) | Code Examples | Cosmetic copy; owner can edit `COPY` |
| A2 | Self-referential canonical (clean query, junk dropped) is preferred over canonicalising every filtered view to bare `/shop` | Pattern 7 | SEO nuance only; both satisfy "canonical from `SITE_URL`"; ask the owner if it matters |
| A3 | Search-param-only navigations keep the old UI (so `useTransition` pending state is required for the 60% opacity) | Pattern 4 | If `loading.tsx` does show, the grid flashes to skeleton on each filter click; verify in browser |
| A4 | `<Link prefetch={false}>` on cards/dropdowns is harmless and avoids prefetch fan-out | Pitfall 9 | Slightly slower first click |
| A5 | A `/_not-found` prerender would be caught by the existing CI "build made no calls" check if the Header triggers it | Pitfall 2 | Build fails in CI; fix by `connection()` placement |
| A6 | `docs/assets/blacktail_brandmark_and_text.svg` has a 1024x1024 viewBox with `width="100%" height="auto"`, 56 KB of traced paths; needs a tightened viewBox and explicit width/height to size at 32/40 px height | Pattern 1 / structure | Logo renders tiny or oversized; check visually, crop the viewBox when copying into `src/shop/logo.svg` |
| A7 | Config-level `redirects()` responses also carry the `headers()` entries | Pitfall 6 | Why the smoke check is moved to `/shop` |
| A8 | `@tailwindcss/turbopack` and `lucide-react@1.57.0` are acceptable (SUS flags are age/download artefacts) | Package Audit | Supply-chain; mitigated by Vintage's lockfile and a confirm checkpoint |

## Open Questions

1. **Canonical for a paged, unfiltered listing (`?page=2`)**
   - What we know: SEO-04 only mandates `noindex,follow` for filtered, searched or sorted views.
   - What's unclear: whether page 2+ should be indexable or consolidated.
   - Recommendation: index pages normally with self-canonical (Pattern 7); revisit in Phase 4 with SEO-03.
2. **Logo asset readiness**
   - What we know: only the 1024-square wordmark SVG exists (A6).
   - Recommendation: planner includes a task to produce `src/shop/logo.svg` with a tight viewBox and verify it at both heights; if it needs designer work, ship the current file and note it as a UAT item.
3. **Banner image**
   - Slot `config.bannerImage: string | null` (null = solid Forest); no image supplied yet (STATE: lifestyle photos pending).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, test | yes | 24.22.1 | none needed |
| npm / registry | install deps | yes | npm view works | none |
| Vitest | tests | yes | 5.0.5, 43 tests pass baseline | none |
| `next dev` | local manual check | yes (`next` in node_modules/.bin) | 16.4.1 | none |
| OpenNext build / `wrangler dev` on Windows | worker proofs | no (documented: cannot build on Windows) | n/a | CI `worker` job (Linux) is the only place the Worker is built and run |
| Browser automation (Playwright) | responsive and focus checks | no (not in stack, CLAUDE.md "not in v1") | n/a | Manual UAT checklist at 320, 375, 768, 1024, 1280 px (end-of-phase human verify per config) |
| Mock How many API | local dev and CI | yes (`scripts/mock-howmany.mjs`) | n/a | needs `/filters` support (Pitfall 6) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** OpenNext/wrangler locally (use CI); browser automation (manual UAT).

## Security Domain

### Applicable ASVS Categories (level 1, `security_enforcement` true)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts; bag/account/wishlist are decorative non-interactive spans |
| V3 Session Management | no | No sessions or cookies |
| V4 Access Control | no | Public read-only catalogue; only the existing HMAC-protected webhook is privileged |
| V5 Input Validation | yes | All URL params parsed against `/filters` and enums; `q` length-capped; numbers parsed as integers and clamped; `URLSearchParams` encodes values into the upstream query |
| V6 Cryptography | no (unchanged) | Webhook HMAC from Phase 1 untouched |
| V10/V14 Config and output | yes | React escapes output (chip text with `q` is rendered as text); no `dangerouslySetInnerHTML`; external links `rel="noopener noreferrer"`; logo via `<img>` not inline-injected markup |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cache-key flooding / rate-limit exhaustion via arbitrary query values | DoS | Canonicalise, snap and cap params (Pitfall 3); errors never cached (DATA-03) |
| Open redirect via page-past-end or `/` redirect | Spoofing | Redirect target is built only from the app's own path plus the cleaned query; never from a user-supplied URL |
| Reflected XSS through `q` in chips, input value, metadata | Tampering | JSX text/attributes only; metadata strings pass through Next; no raw HTML |
| Upstream request smuggling via param injection | Tampering | Values only ever go through `URLSearchParams`; path is a fixed literal (`/items`, `/filters`) |
| Tabnabbing from footer links | Spoofing | `rel="noopener noreferrer"` (UI-SPEC) |
| Fake newsletter box collecting emails | Info disclosure | Disabled input and button in a `<div>`, no `<form>`, no handler, no network (D-06) |
| Leaking cost/notes/internal ids | Info disclosure | Zod strips unknown keys (Phase 1); render only schema fields |

## Sources

### Primary (HIGH confidence)
- `C:\Git\blacktail` source read this session: `src/lib/howmany/{client,schemas}.ts`, `src/lib/{config,copy,definitions,routes,env,guard.test,copy.test}.ts`, `src/app/{layout,page,error}.tsx`, `src/components/{stock/ItemList,ui/StatusScreen}.tsx`, `next.config.ts`, `vitest.config.mts`, `wrangler.jsonc`, `open-next.config.ts`, `package.json`, `scripts/{mock-howmany,prove-freshness}.mjs`, `.github/workflows/{ci,deploy-workers}.yml`
- `docs/refs/issues.json` issue #2 (API contract)
- `.planning/{PROJECT,REQUIREMENTS,STATE,config}`, `02-CONTEXT.md`, `02-UI-SPEC.md`, Phase 1 `01-VERIFICATION.md` and fix/summary reports
- Installed Next 16.4.1 docs in `node_modules/next/dist/docs/01-app/`: `error.md`, `redirect.md`, `redirects.md`, `headers.md`, `fetch.md` (Memoization), `use-router.md`, `image.md`, `generate-metadata.md`, `page.md`, `loading.md`
- Vintage reference: `package.json`, `package-lock.json`, `next.config.ts`, `src/styles/globals.css`, `src/components/ui/{fonts,Sheet,Pager,buttons,styles}.ts*`, `src/hooks/{useModalDialog,useDebouncedSearch}.ts`, `src/lib/{params,paging,money,utils,config,sizes}.ts`
- npm registry and `gsd-tools query package-legitimacy check` (tailwindcss OK, tailwind-merge OK, @tailwindcss/turbopack SUS, lucide-react SUS), `npm pack` of `@fontsource/bodoni-moda@5.3.0` and `lucide-react@1.57.0`
- Executed: `npx vitest run` (43 passed), `Intl.NumberFormat` check in Node 24.22.1

### Secondary (MEDIUM confidence)
- Visual cross-check of `docs/refs/misc-mockup.png` and `docs/refs/just-dropped.png` against the UI-SPEC

### Tertiary (LOW confidence)
- None used. Context7, Exa, Brave were not enabled in `.planning/config.json`; primary sources above were used instead.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, same versions as the user's production repo, checked against registry and lockfile
- Architecture: HIGH for the pure query layer and server/client split; MEDIUM for the pending-state wiring (A3) and the `/_not-found` interaction (A5), both settled by one CI run or a browser pass
- Pitfalls: HIGH for 1, 2, 4, 5, 6, 11 (read from source or executed); MEDIUM for 8 to 10 (standard browser behaviour, not run here)

**Research date:** 2026-10-26
**Valid until:** 2026-11-09 (14 days: OpenNext and Next release every few days; re-check `npm view` before install)
