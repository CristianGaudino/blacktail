# Phase 2: Branded Catalogue - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds the Blacktail Archive look across the site and builds the All Items catalogue at `/shop`. It covers design tokens (palette and self-hosted Bodoni Moda and Montserrat), the header (logo, nav with Shop and Brands dropdowns, a search field, and decorative bag, account and wishlist icons) and the footer (logo, nav, contact, Vinted and eBay links, a decorative newsletter box, social icons). It also covers the mobile menu and one money formatter. The catalogue is a grid of cards with multi-select filters (type, brand, size, colour, era, condition, department, material, price, plus pit-to-pit and length when present), search, sort and numbered pages of 24. All state lives in the URL, and the page has removable chips, a result count, an empty state, a mobile filter drawer and `noindex,follow` with a canonical URL for filtered views. Everything shop-specific sits in one shop folder, and a test makes sure it doesn't leak.

The home page, item pages, brand pages, About, Contact and Just Dropped belong to Phases 3 and 4. In this phase they exist only as links.

</domain>

<decisions>
## Implementation Decisions

### Shop folder and theming (TMPL-01, SHELL-01)
- **D-01:** One deploy is one shop. **There is no multi-shop logic and no shop picker.** All of Blacktail Archive's details live in one folder, `src/shop/`: config (name, contact, platform links, socials, colour-swatch map, New-badge days), shop-specific copy, `theme.css` and logo assets. Components read only from that folder. Another shop would be a copy of the repo with that folder replaced (the owner explicitly rejected a site that holds several shops). Generic UI text stays in `COPY` in `src/lib/copy.ts`, and shop wording goes in the shop folder.
- **D-02:** Palette and fonts are Tailwind `@theme` tokens in `src/shop/theme.css`, imported by `globals.css`. Components use the token names only, never hex values.
- **D-03:** The guard test reads the shop's own values from its config (name, contact email, profile URLs, colour hexes) and fails if any appears in `src/` outside `src/shop/`. It updates itself when config changes.

### Region and placeholders
- **D-04:** The shop is **Ireland/EU, not the UK**. Never use `.co.uk` URLs. The money formatter uses the `en-IE` locale with the item's own currency (expected EUR).
- **D-05:** The Vinted and eBay profile URLs and contact details are **clearly marked placeholders** in shop config (e.g. `vinted.ie`, `ebay.ie`, a placeholder email) until the owner supplies the real ones. Only config changes when they arrive.

### Footer and header "mock feel"
- **D-06:** The owner wants to get a feel for the finished site, with everything visible even if it doesn't work yet, and will strip things back later. The footer has the full mockup: logo, nav columns, contact details, Vinted and eBay links, a **non-working newsletter box** and social icons. This knowingly overrides the REQUIREMENTS "no newsletter signup" out-of-scope row for v1, as a visual mock only: no provider and no submission. It must be accessible and must not pretend to submit, for example a disabled input or a clearly non-submitting form.
- **D-07:** Socials: Instagram is a real link (`https://www.instagram.com/blacktailarchive`). TikTok, Pinterest and Spotify are shown as icons **without links** until URLs go in config. Any icon with a URL in config becomes a link.
- **D-08:** "Mock feel" covers only the visible parts of the header, footer and All Items page. No fake pages (no static "Your Bag"). The bag, account and wishlist icons, the bag count and the card hearts are decorative.

### Routes and navigation
- **D-09:** All Items is at **`/shop`** (e.g. `/shop?brand=Nike&sort=price_asc&page=2`). Item pages will be `/items/[code]` (Phase 3).
- **D-10:** `/` **redirects temporarily (307) to `/shop`** until Phase 4 builds the home page.
- **D-11:** The header and footer show the full nav now: Shop, Brands, Just Dropped, About, Contact. Each links to its real route, which shows the 404 until its phase builds it. The site is `noindex` until Phase 4, so this does no SEO harm.
- **D-12:** **The Shop nav item is a dropdown of types** from `/filters`, linking to `/shop?type=...`. **The Brands nav item is a dropdown of in-stock brands** from `/filters`, linking to `/shop?brand=...` for now (Phase 3 may repoint these to `/brands/[slug]`). Both use the same dropdown component. Labels come from the label maps (D-17).
- **D-13:** The header search icon **opens a search field** in the header. It is a GET form that submits to `/shop?q=...` and works without JS.

### Filter panel (CAT-02, 03, 06, 08)
- **D-14:** On desktop, filters **apply instantly** when clicked (the URL and results update). Build it as a small client component around a GET form. The mobile drawer keeps its Apply button (CAT-08).
- **D-15:** Colour is shown as **round swatches** as in the mockup, with the colour name as the accessible label. Hex values come from a colour-name map in the shop folder. An unknown colour gets a neutral swatch plus its name.
- **D-16:** Price is a **two-handle range slider** bounded by the `/filters` min and max, with the values shown. Pit-to-pit and length use the same control (shown in cm, sent to the API as mm), and are hidden when the `/filters` range is `null`.
- **D-17:** **Facet counts are hidden.** The `/filters` counts cover all items and don't narrow as filters are picked (narrowing counts are ENG-03, v2).
- **D-18:** Long lists show the **first 8** values in `/filters` order (most common first), then "Show more" expands them in place. Picked values always stay visible.
- **D-19:** Code labels (type, department, condition) come from a map in `COPY` (Knitwear, Shirts, Mens, A Excellent, and so on). An unknown code falls back to the capitalised code, so a new code from How many never breaks the page.
- **D-20:** The **material filter is included** (the API supports `material`), as one more checkbox group using the same component.

### Item cards (CAT-01, CAT-10, SHELL-05)
- **D-21:** The "New" badge shows on items published in the **last 7 days**, based on `publishedAt`. The number of days is in config.
- **D-22:** Prices look like **€120**, with cents only when needed (€119.50), in `en-IE` format and the item's currency, through one formatter built from integer cents.
- **D-23:** Cards **link to `/items/[code]` now** (404 until Phase 3).
- **D-24:** Cards show the **decorative heart** (aria-hidden, not a button) and a "Colour / Size" line that leaves out whichever part is missing.

### Claude's Discretion
- The "All Items" page banner follows the mockup, with a `public/images/` slot and a placeholder until the lifestyle photos arrive (same approach as HOME-03).
- The mobile menu and drawer details, the sort control's look and placement ("Sort by: Newest" as in the mockup), the empty and error states, and the chip styling all follow the mockups and the Vintage UI conventions.
- How dropdown data is fetched: `/filters` through the existing tagged client, shared by the header and the filter panel.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual target
- `docs/refs/Blacktail Archive - Branding.pdf`: palette, typography, logos, mockups (the v1 visual target)
- `docs/refs/misc-mockup.png`: All Items page (sidebar filters, sort, grid), footer, mobile menu and All Items, style guide
- `docs/refs/just-dropped.png`: header and nav with chevrons, card design (New badge, heart, brand, title, colour / size, price)
- `docs/assets/blacktail_brandmark_and_text.svg`, `docs/assets/brandmark.svg`: logo sources

### API contract
- `docs/refs/issues.json` issue #2: `/items` query params (`sort`, `q`, repeated list params incl. `material`, `minPrice`/`maxPrice` in cents, `min/maxPitToPitMm`, `min/maxLengthMm`, 400 on invalid), `/filters` shape (most common first, `null` ranges), labelling of codes in Blacktail's own words

### Project
- `.planning/REQUIREMENTS.md`: SHELL-01..05, CAT-01..10, SEO-04, TMPL-01
- `.planning/ROADMAP.md` (Phase 2): success criteria 1 to 5
- `.planning/PROJECT.md`: key decisions (decorative icons, API-side filtering, condition wording)
- `.claude/CLAUDE.md`: stack, fonts (Bodoni Moda 700 from `@fontsource/bodoni-moda@5.3.0`, Montserrat Variable from Vintage), images (`unoptimized`, `thumbUrl` in grids, width and height from the API), revalidation contract
- `.planning/phases/01-live-stock-skeleton/01-CONTEXT.md`: Phase 1 decisions (keep `data-as-of`, `COPY` screens)

### Reference codebase
- `C:\Git\vintage\.planning\codebase\CONVENTIONS.md`, `STRUCTURE.md`: structure and UI primitives conventions
- `C:\Git\vintage\src\components\ui\fonts.ts`, `C:\Git\vintage\src\fonts\`: font loading pattern and Montserrat file

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/howmany/client.ts`: `howmanyFetch` (tagged, `force-cache`, sorted params) handles new `getFilters()` / filtered `getItemsPage()` reads. Repeated list params need `URLSearchParams` with appended entries; the current `Record<string,string>` signature must widen.
- `src/lib/howmany/schemas.ts`: lenient Zod. Add `filtersSchema` the same way (codes as strings, ranges nullable).
- `src/components/stock/ItemList.tsx`: Phase 1 list, which the card grid replaces. Keep `data-as-of`.
- `src/components/ui/StatusScreen.tsx`, `src/app/error.tsx`: error and empty screens to restyle.
- `src/lib/copy.ts` (+ em-dash test), `src/lib/config.ts`, `src/lib/routes.ts` (only `home` so far, so add `shop`, `items`, `brands`, `justDropped`, `about`, `contact`).
- `public/brands/*.svg`: not used in this phase (the Brands dropdown is text).

### Established Patterns
- Pages call `await connection()` and render per request over the cached fetch (no `generateStaticParams`).
- 4-space indents, single quotes, named exports, colocated `*.test.ts`, `import 'server-only'` on API modules.
- `guard.test.ts` already scans for banned patterns, so the shop-string guard (D-03) fits beside it.

### Integration Points
- `src/app/page.tsx` becomes the `/` → `/shop` redirect (a `next.config.ts` redirect or `redirect()`).
- `src/app/layout.tsx` gets fonts, the theme, the header and the footer.
- The API returns 400 for invalid params, so URL params are cleaned against `/filters` values and known enums before calling `/items` (CAT-06).

</code_context>

<specifics>
## Specific Ideas

- "I want everything, it doesn't have to be working. I want a feel for the final version and mock site, I can strip it back after."
- This is primarily an IE/EU shop: never link to `.co.uk`.
- Instagram: `https://www.instagram.com/blacktailarchive`.

</specifics>

<deferred>
## Deferred Ideas

- Real Vinted, eBay and contact values: config change when the owner supplies them.
- TikTok, Pinterest and Spotify URLs: config change when available.
- Pointing the Brands dropdown items to `/brands/[slug]`: Phase 3.
- Narrowing facet counts: ENG-03 (v2, needs an API change).

</deferred>

---

*Phase: 02-branded-catalogue*
*Context gathered: 2026-10-26*
