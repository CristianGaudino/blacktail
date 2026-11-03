# Phase 4: Home and Launch - Context

**Gathered:** 2026-11-03
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the home page at `/` (replacing the `/` to `/shop` redirect), the Just Dropped page at `/just-dropped`, the About page at `/about` and the Contact page at `/contact`. It also adds site-wide SEO (titles, descriptions, Open Graph, sitemap, robots, an indexing switch) and the onboarding doc for deploying the template for another shop. The home page follows the Just Dropped mockup (`docs/refs/just-dropped.png`, `docs/refs/homepage-mock.png`): hero, brand strip, Just Dropped carousel, two promo banners, shop by category tiles, the "a more conscious way to shop" story band and the footer.

Checkout, accounts, a working wishlist, a newsletter, spotlighted items and sold-item pages are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Image slots and placeholders (HOME-03)
- **D-01:** Until real lifestyle photos arrive, the slots (hero, 2 promo banners, 4 category tiles, story band, default Open Graph image) use **committed placeholder image files** under `public/images/`.
- **D-02:** Slots use **fixed filenames** (for example `hero.jpg`, `banner-just-dropped.jpg`, `banner-brands.jpg`, `category-<n>.jpg`, `story.jpg`, `og-default.jpg`). The real photo replaces the placeholder by overwriting the file, so there is no config edit and no file-exists check. The planner picks the exact names and lists them in the onboarding doc.
- **D-03:** All home headings, eyebrows and button labels (TIMELESS CLOTHES. JUST DIFFERENT., PRE-LOVED, SHOP NEW ARRIVALS, and so on) are Blacktail Archive's own words and live in `src/shop/` (the shop-string guard keeps them out of components). Generic labels ("View all", arrows' accessible names) stay in `COPY`. No em dashes.
- **D-04:** CTA targets follow the mockup: hero "Shop new arrivals" and the Just Dropped banner go to `/just-dropped`; "Shop all brands" goes to `/brands`; each category tile goes to `/shop?type=<code>`; the story band "Our story" goes to `/about`. All paths come from `ROUTES`.

### Category tiles (HOME-01, HOME-02, TMPL-01)
- **D-05:** The tile list is in shop config: up to 4 entries, each with a type code, a label and an image filename. A tile is **hidden when `/filters` shows no in-stock items of that type**, so it never links to an empty page. If no tile remains, the whole section is hidden. (This is the "category tiles" part of TMPL-01 that Phase 2 deferred to here.)

### Brand strip (BRAND-02, HOME-01)
- **D-06:** The strip is **one row of logos that scrolls horizontally** (scroll-snap) when it does not fit, with a "View all" link to `/brands`. A brand without an SVG shows its name in Bodoni Moda. Logos are matched by the Phase 3 slug rule.
- **D-07:** Order is: brands in stock first, then sold-before brands, then the default order from config. The ordering function takes a `soldBeforeBrands` list that is **empty for now**, so BRAND-05 only needs a data source later; a unit test proves the order with a fake list.
- **D-08:** The default order in `src/shop/` is a placeholder marked PENDING-OWNER: Polo Ralph Lauren, Carhartt, Nike, Adidas, Levi's, Barbour, The North Face, Patagonia, then the rest A to Z. Only that one array changes when the owner decides.

### Just Dropped carousel and page (CAT-11, HOME-01, HOME-02)
- **D-09:** `/just-dropped` is the **`/shop` catalogue locked to newest** (filters, search, paging and chips, sort fixed to newest and the sort control hidden) with a Just Dropped banner. It reuses the same code path as `/brands/[slug]`.
- **D-10:** The page and the carousel show **all in-stock pieces, newest first** (by `publishedAt`), with no time window, so they are never empty while the shop has stock.
- **D-11:** **The New badge is 14 days across the board** (was 7). Change `SHOP.newBadgeDays` to 14 and update the `isNew` tests, any "7 days" wording and the Phase 2 D-21 references.
- **D-12:** The home carousel shows the **10 newest** pieces: 5 cards visible on desktop as in the mockup, 2 on a phone, scroll-snap with previous and next arrow buttons (no library). With fewer items it shows what exists and hides the arrows; with zero items the whole section is hidden.
- **D-13:** Spotlighted items (a How many feature the owner plans) will later be prioritised in the carousel only, not on `/just-dropped`. Tracked in GitHub issue #19. Not built in this phase.

### About and Contact (PAGE-01, PAGE-02)
- **D-14:** About and Contact take their text and details from `src/shop/` (a placeholder story marked PENDING-OWNER, with the story-band image slot). Layouts follow the mockups in the branding PDF.
- **D-15:** Contact shows the email, the Vinted and eBay profile links and the socials, with no form. **Every contact detail and platform link is read from the shared source (`SHOP.contact`, `SHOP.platforms`, `SHOP.socials`), the same one the footer and the item page use. Nothing is typed into the page.**

### SEO and indexing (SEO-01, SEO-03)
- **D-16:** Indexing is controlled by a **new validated env flag, off by default** (for example `ALLOW_INDEXING=true`, set only on the live deploy). When off: `robots.txt` disallows all, and the `noindex` meta and `X-Robots-Tag` header from Phase 1 stay. When on: both go away and the sitemap is served. Preview deploys and `workers.dev` stay safe by default. The planner names the variable and adds it to the env schema, the deploy workflow and the onboarding doc.
- **D-17:** The sitemap lists `/`, `/shop`, `/brands`, `/just-dropped`, `/about`, `/contact`, each `/brands/[slug]` (from `/filters`) and every in-stock `/items/[code]`. It is built through the tagged client so the webhook refreshes it. Filtered, searched and sorted views are excluded. Absolute URLs come from `SITE_URL`.
- **D-18:** Every page gets a title, description and Open Graph tags. Item pages use the item's name and cover photo; every other page uses `public/images/og-default.jpg` (a fixed-filename slot with a placeholder).

### Template onboarding (TMPL-02)
- **D-19:** The onboarding doc is `docs/ONBOARDING.md`. It covers env vars (including the indexing flag), the Cloudflare R2, D1 and Worker setup, the `src/shop/` folder swap, the `public/brands/` logos and the `public/images/` slots with their filenames. A reader can deploy another shop without editing a component.

### Cleanup
- **D-20:** Delete the `BUILT_PAGES` stopgap and `isBuilt` in `src/lib/routes.ts` once the last page ships, and replace the `/` redirect with the home page.

### Claude's Discretion
- Visual treatment of the home sections, the mobile layout and the About and Contact pages, following the mockups in the branding PDF and the Vintage UI conventions.
- The exact placeholder look of the committed images, as long as they are neutral and use the palette.
- Exact fixed filenames, the shape of `SHOP.home` and `SHOP.about`, and the name of the indexing env variable.
- Metadata copy for each page (descriptions), without em dashes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual target
- `docs/refs/Blacktail Archive - Branding.pdf`: home (Just Dropped variant on page 2 is the reference), About, mobile mockups
- `docs/refs/just-dropped.png`, `docs/refs/homepage-mock.png`, `docs/refs/misc-mockup.png`: home layout, brand strip, carousel, banners, category tiles, story band, footer

### API contract
- `docs/refs/issues.json` issue #2: `/items` (`sort=newest`), `/filters` (types, brands), caching and rate limit

### Project
- `.planning/REQUIREMENTS.md`: HOME-01..03, BRAND-02, CAT-11, PAGE-01, PAGE-02, SEO-01, SEO-03, TMPL-01, TMPL-02
- `.planning/ROADMAP.md` (Phase 4): success criteria 1 to 5
- `.planning/PROJECT.md`: key decisions, open items (default brand order, lifestyle photos, sold-before tier)
- `.planning/phases/02-branded-catalogue/02-CONTEXT.md`: D-01 to D-03 (shop folder, guard), D-21 (New badge, now 14 days)
- `.planning/phases/03-item-and-brand-pages/03-CONTEXT.md`: D-12 to D-14 (brand slug rule, brand-locked catalogue), D-16 (item metadata)
- `.claude/CLAUDE.md`: stack, caching contract, images (`unoptimized`), revalidation
- GitHub issue #19: spotlight items (deferred), issue #9: placeholder contact and platform values

### Reference codebase
- `C:\Git\vintage\.planning\codebase\CONVENTIONS.md`, `STRUCTURE.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/catalogue/`: `CataloguePage`, `CatalogueShell`, `CatalogueBanner`, `ItemCard`, `ItemGrid`, `Pager` for `/just-dropped` and the carousel cards.
- `src/components/brands/BrandGrid`, `src/lib/brandSlug.ts`, `src/shop/brand-logos.ts`, `public/brands/*.svg`: logos and the slug rule for the brand strip.
- `src/lib/howmany/` (`getStore`, tagged client, schemas): all reads, including `/filters` for tile checks and the sitemap.
- `src/lib/isNew`, `SHOP.newBadgeDays`: the New badge rule (becomes 14).
- `src/components/ui/`: `ButtonLink`, `IconButton` for CTAs and carousel arrows; `StatusScreen` for states.
- `src/app/brands/[slug]/`: the pattern for a catalogue locked to one value, reused for `/just-dropped`.
- `src/lib/listingRobots`, `src/lib/ROUTES`, `src/lib/storeEnv`: metadata, routes, env.

### Established Patterns
- Pages call `await connection()` and render per request over the cached fetch; no `generateStaticParams`.
- All on-screen text in `COPY`, shop strings only in `src/shop/` (guarded), named exports, 4-space indents, single quotes, colocated `*.test.ts`, `import 'server-only'` on API modules.
- Placeholders marked `PENDING-OWNER` so a later config change finds them.

### Integration Points
- `src/app/page.tsx` (currently the `/` redirect) becomes the home page; new `src/app/just-dropped/`, `about/`, `contact/`, `sitemap.ts`, `robots.ts`.
- Header and footer already link to the Phase 4 routes; `BUILT_PAGES` is removed when they ship.
- Env schema and `next.config.ts` headers gain the indexing switch; deploy workflow sets it for production only.
- `src/shop/config.ts` gains `home`, `about` and the default brand order.

</code_context>

<specifics>
## Specific Ideas

- The owner wants everything contact-related (email, Vinted and eBay links) read from the shared shop source, never hard coded on a page.
- The owner prefers fixed filenames for lifestyle images because they are the easiest to update later.

</specifics>

<deferred>
## Deferred Ideas

- **Spotlighted items in the carousel**: needs How many to expose a spotlight flag; GitHub issue #19.
- **Sold-before brand tier data (BRAND-05)**: needs How many; the seam exists but stays empty.
- Real lifestyle photos, the default brand order, and real contact, Vinted and eBay values: owner supplies later (issue #9); each is a file overwrite or one config line.

</deferred>

---

*Phase: 04-home-and-launch*
*Context gathered: 2026-11-03*
