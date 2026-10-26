# Blacktail

## What This Is

Blacktail is a Next.js storefront template that shows the stock a seller picks in **How many** (the inventory app), read through its public, read-only API. The first deploy is **Blacktail Archive**, a pre-loved branded menswear shop. Each new shop is another deploy of the same template with its own config, content and logos. Nothing is hard coded to one shop.

## Core Value

Shoppers see the shop's current in-stock pieces, always up to date with How many, in a storefront that looks like the Blacktail Archive mockups.

## Business Context

- **Customer**: Shoppers browsing pre-loved branded clothing. They buy on Vinted or eBay, not on the site.
- **Revenue model**: The site drives sales on the resale platforms. There is no checkout in v1.
- **Success metric**: The site matches the mockups and always shows current stock.
- **Strategy notes**: Branding in `docs/refs/Blacktail Archive - Branding.pdf` (GitHub issue #3).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Home page as in the mockup: hero, brand logo strip, Just Dropped carousel, two promo banners, shop by category tiles, "a more conscious way to shop" story band, footer
- [ ] All Items page with filters (type, brand, size, colour, era, condition, department, price range), search (`q`), sort (newest, price up, price down) and paging, all done by the How many API
- [ ] Item page: photo gallery, brand, title, size, condition, colour, era, measurements, price and a line saying the piece is available on Vinted / eBay
- [ ] Item pages have `generateMetadata` and JSON-LD `Product` data for search
- [ ] Just Dropped page: newest items first
- [ ] Brands page: in-stock brands with their logos
- [ ] About / Our story page and Contact page (static, per-shop content, no form)
- [ ] Header with Shop, Brands, Just Dropped, About and Contact nav, plus search. Bag, account and wishlist icons are shown to match the mockup but do nothing
- [ ] Brand logo strip order: brands in stock first, then brands sold before, then a default order set in config. A brand with no SVG falls back to its name as text
- [ ] Signed webhook route: check the HMAC signature and the 5-minute timestamp window, then revalidate the `store:<slug>` tag. A time-based revalidate (about 10 minutes) covers a missed webhook
- [ ] Responsive layouts that follow the mobile mockups
- [ ] Brand system: Bodoni Moda 700 and Montserrat 400/500 self-hosted, and the Forest, Olive, Stone, Sand and Ivory palette as design tokens
- [ ] Template config: env `STORE_SLUG`, `HOWMANY_API_URL`, `HOWMANY_WEBHOOK_SECRET` validated at startup. Shop name, copy, platforms, theme tokens, images and the default brand order live in config, not in components
- [ ] Deployed on Cloudflare Workers through OpenNext

### Out of Scope

- Checkout, bag and payments — v1 sends buyers to Vinted / eBay. A later checkout needs a stock reservation so a one-off item can't sell twice
- Accounts and a working wishlist — icons are decorative in v1
- Per-item listing links and enquiry forms — the API has no per-item links yet. The item page says the piece is available on Vinted / eBay instead
- Newsletter signup in the footer — no provider and nobody asked for one
- Multi-tenant hosting (several shops in one deploy) — every API call already carries the slug, so a host-to-store lookup can be added later without API changes
- Any direct database access — Blacktail only talks to the public API, so How many's internals stay free to change

## Context

- **How many** (repo `C:\Git\vintage`, product "How many?") owns the data. Its public API is built and documented in issue #2 (`docs/refs/issues.json`):
  - Base `https://www.checkhowmany.com/api/v1/stores/{slug}`, with `GET /`, `/items`, `/items/{code}` and `/filters`
  - Money is integer cents in the seller's currency
  - Photos come with `thumbUrl` for grids and `url` for item pages, plus full-size width and height so space can be reserved
  - Condition, type and department arrive as codes (`A`, `knit`, `mens`). Blacktail labels them in its own words
  - Rate limit is 3000 requests a minute per IP, shared by everything Blacktail does, page builds included. A server-side cache keeps it well under that
  - `/api/v1` only ever gains fields. Ignore unknown ones
- The issue #1 technical outline sets the split: How many owns data, and Blacktail owns presentation only (theme, shop links, contact details, layout).
- **Code reference: `C:\Git\vintage`**. Follow its structure, coding principles and reuse patterns. The design is entirely different. Its conventions are mapped in `C:\Git\vintage\.planning\codebase\` (CONVENTIONS.md, STRUCTURE.md, STACK.md, ARCHITECTURE.md). In short:
  - Next 16 App Router with route groups, feature folders in `src/components/<area>/` and shared primitives in `src/components/ui/`
  - All on-screen text in `src/lib/copy.ts` (`COPY`), with no em dashes in copy
  - Settings and limits in `src/lib/config.ts`, route paths in `src/lib/routes.ts`, and types in `src/lib/definitions.ts`
  - Design tokens in `src/styles/globals.css` (Tailwind v4 `@theme`)
  - Env validated with Zod in `src/lib/env.ts` and checked at startup in `src/instrumentation.ts`
  - Money as integer cents with a `Cents` suffix, formatted through helpers
  - Named exports only, 4-space indents, single quotes, `import 'server-only'` on server modules
  - Colocated Vitest tests (`*.test.ts`)
  - Vintage also runs on Cloudflare through OpenNext (`wrangler.jsonc`, `open-next.config.ts`, `.github/workflows/deploy-workers.yml`). Reuse that setup
  - Next 16 has breaking changes. Read `node_modules/next/dist/docs/` before writing framework code
- **Branding** (`docs/refs/Blacktail Archive - Branding.pdf`):
  - Fonts: Bodoni Moda Bold 700 (serif headings) and Montserrat Medium 400/500 (sans)
  - Colours: Forest `#1F2A1F` (primary), Olive `#4A5A46`, Stone `#A69D8F`, Sand `#CBB89E`, Ivory `#E8E5DD`
  - Mockups: home, All Items with filter sidebar, item page, About, Brands, bag, mobile views and a style guide. The "Just Dropped" home variant on page 2 is the reference home page
- **Assets in the repo**:
  - `docs/assets/brandmark.svg` (the feather brandmark) and `docs/assets/blacktail_brandmark_and_text.svg` (emblem with wordmark)
  - `public/brands/*.svg`: 30 brand logos named by slug (brand name lowercased, accents and apostrophes dropped, other characters turned into hyphens)
  - Lifestyle photos for the hero, banners, category tiles and story band are not supplied yet. Use placeholders under `public/images/` until they are

## Constraints

- **Data access**: Only the How many public API, never its database — keeps How many free to change
- **Hosting**: Cloudflare Workers (OpenNext) — the user's choice and the same platform How many uses
- **Caching**: Server-side fetches cached by tag `store:<slug>`, refreshed by the webhook, with a time-based fallback — the webhook is never retried, and the rate limit is shared by one server IP
- **Template**: No shop-specific values in components. Everything per-shop comes from env or config — the template must deploy for other shops
- **Conventions**: Match `C:\Git\vintage` structure and coding principles — the user's explicit instruction
- **Visual target**: v1 is done when it looks like the mockups in the branding PDF
- **Privacy**: Show only what the API returns. Never derive or display cost, notes or internal ids (the API already leaves them out)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No checkout. The item page says "available on Vinted / eBay" | User choice for v1. The API has no per-item links | — Pending |
| Bag, account and wishlist icons are decorative | Match the mockup without building features | — Pending |
| Filtering and search are done by the API | The user extended the API with `/filters`, `q`, list filters and ranges | — Pending |
| Brand strip order: in stock, then sold before, then the config default order | User rule, so the strip always shows relevant brands first | — Pending |
| Brand logos are static SVGs in `public/brands/`, matched by slug, with a text fallback | Simple, per-deploy, and works with no extra API | — Pending |
| Follow `C:\Git\vintage` structure and conventions | User instruction. Keeps both repos consistent | — Pending |
| Cloudflare Workers through OpenNext | User choice. Vintage already proves the setup | — Pending |

## Open Items

- **Sold-before brands**: The API only describes in-stock items, so the strip's second tier has no source. Either How many adds sold brands (for example to `/filters` or a `/brands` endpoint), or the tier is skipped until it does
- **Default brand order**: To be set together with the user. A placeholder order lives in config until then
- **`public/brands/arc-teryx.svg`**: Should be `arcteryx.svg` to match the slug rule (`Arc’teryx` → `arcteryx`)
- **Brand spelling**: Both `ralph-lauren.svg` and `polo-ralph-lauren.svg` exist. Confirm which name How many records
- **Lifestyle photos**: Hero, two promo banners, four category tiles and story band images are still to be supplied

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-26 after initialization*
