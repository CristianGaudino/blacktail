# Walking Skeleton — Blacktail

**Phase:** 1
**Generated:** 2026-10-26

## Capability Proven End-to-End

A shopper opening the deployed Worker sees the shop's current in-stock items read from the How many API, and a signed `store.updated` webhook makes the next visit show the change within seconds (proved locally on `next start` in Plan 01, on workerd in CI in Plan 03, and on the deployed Worker in Plan 04).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.4.1 App Router, React 19.3.0 (exact pins), TypeScript 5.9, Node 24 | Same versions Vintage runs in production on this adapter |
| Data layer | No database. One server-only fetch seam, `src/lib/howmany/client.ts`, reads the How many public API; Zod schemas in `src/lib/howmany/schemas.ts`, types in `src/lib/definitions.ts` | Blacktail only talks to the public API; one seam keeps caching and the rate limit under control |
| Caching | `fetch` with `cache: 'force-cache'`, `next.tags: ['store:<slug>']`, `next.revalidate: 600`. No Cache Components (`'use cache'`, `cacheTag`, `cacheLife`), enforced by a guard test | Cache Components hang or 500 on OpenNext today; fetch tags cover everything |
| Freshness | Signed webhook -> `revalidateTag('store:<slug>', { expire: 0 })` (tag from env, never the body); 10-minute stale-while-revalidate fallback | `expire: 0` makes the next visit a blocking refetch, so a sold piece never shows after a webhook; the webhook is never retried, so the TTL is the safety net |
| Rendering | `/` renders per request (`await connection()`) over the cached fetch; nothing fetched at build; future item pages render on demand | No build-time fan-out against the shared 3000/min limit, no stale build snapshot, avoids the runtime-ISR leak (#1455) |
| Cloudflare cache topology | OpenNext R2 incremental cache, plain D1 tag cache (never filter-wrapped), Durable Object queue (configured, idle in v1), `WORKER_SELF_REFERENCE` = Worker name | R2 and D1 are strongly consistent across isolates; the filter wrapper would skip creating the D1 table |
| Auth | None for shoppers. The webhook is authenticated with HMAC-SHA256 over `{timestamp}.{raw body}`, WebCrypto `subtle.verify`, 300 s window, 401 for anything invalid | No accounts or checkout in v1 |
| Env | `storeEnv()` in `src/lib/env.ts`: Zod, read lazily, fails with one list of every problem; `HOWMANY_API_URL` is the full store address and must end in `/stores/<STORE_SLUG>`; called from `instrumentation.ts` and on first use | Fail fast with a readable message; catches a slug typo |
| Deployment target | Cloudflare Workers via `@opennextjs/cloudflare`, Worker `blacktail-archive`, custom domain `www.blacktailarchive.cgaudino.com` plus workers.dev in Phase 1; deployed by `.github/workflows/deploy-workers.yml` on push to main | User's choice; same platform as How many. OpenNext cannot build on Windows, so builds run only in CI |
| CI | `ci.yml`: `check` job (lint, typecheck, tests) and `worker` job (OpenNext build, mock API, `wrangler dev`, `scripts/prove-freshness.mjs`) on every non-draft PR | The worker job is the only place the cache overrides run before production |
| Directory layout | Vintage conventions: `src/app/` routes, `src/components/<feature>/` (first: `stock/ItemList.tsx`) plus `src/components/ui/` primitives (first: `StatusScreen.tsx`), `src/lib/{config,copy,routes,definitions,env,webhook}.ts`, `src/lib/howmany/`, colocated `*.test.ts`, `scripts/` for the mock API and the freshness proof | The owner's explicit instruction to match `C:\Git\vintage` |
| Text and template | All on-screen text in `COPY` (no em dash, tested); no shop-specific value in `src/` (the heading comes from the API `name`); per-shop values in `wrangler.jsonc` vars and env | The template must deploy for other shops |
| Freshness marker | `data-as-of` attribute on the item list `<section>`, holding the cached `/items` response `Date` header; never visible text, never on error screens | Lets the proof script tell a cache hit, a refetch and an error apart; must survive Phase 2 styling |
| Item markup | Each item renders cover image, brand, title, price in that order (the card order in `docs/refs/just-dropped.png`), unstyled | Phase 2 can style it into the mockup cards without reordering |

## Stack Touched in Phase 1

- [x] Project scaffold (Next build, ESLint 9, Vitest 5, `tsc` typecheck)
- [x] Routing: `GET /` (request-time list) and `POST /api/webhooks/howmany`
- [x] Database: no app database by design (API only). Real read: `GET .../items` through the tagged fetch into R2. Real write: the webhook's tag row in D1 (`revalidations` table)
- [x] UI: the item list page, plus the error screen's Try again button that re-renders and refetches
- [x] Deployment: Cloudflare Worker deployed from CI on push to main (after the owner merges PR A and PR B); local full-stack run is `next build` + `next start` against `scripts/mock-howmany.mjs`

## Out of Scope (Deferred to Later Slices)

- Styling, design tokens, fonts, header, footer, mobile menu (Phase 2). The owner's mockups (`docs/refs/homepage-mock.png`, `just-dropped.png`, `misc-mockup.png`) are design direction for Phase 2 onward, not Phase 1 targets
- Shop seam `src/shop/` and the shop-strings guard test (Phase 2, TMPL-01)
- Money formatter with shop locale (Phase 2, SHELL-05); Phase 1 uses `Intl.NumberFormat` inline
- Filters, search, sort, paging, colour/size line, "New" badge (Phase 2)
- Item pages, branded 404 (`not-found.tsx`), JSON-LD, brand pages and logos (Phase 3)
- `global-error.tsx` (the root layout reads no data in Phase 1)
- Home page sections, About, Contact, sitemap, robots by environment, `workers_dev: false` (Phase 4)
- `public/_headers` immutable cache rule for `/_next/static/*` (performance only)
- Retry-After handling for 429s (errors are thrown and never cached; the TTL covers recovery)
- Checkout, bag, accounts, wishlist (out of v1)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Branded Catalogue. Blacktail Archive look, header and footer, and All Items with filters, search, sort and numbered pages, still through `client.ts` and the same tag
- Phase 3: Item and Brand Pages. On-demand `/items/[code]` (no generateStaticParams), real 404s, JSON-LD, `/brands` and `/brands/[slug]`
- Phase 4: Home and Launch. Mockup home page, Just Dropped, About, Contact, site-wide SEO, sitemap refreshed with the store tag, onboarding doc for a second shop
