---
phase: "02"
slug: "branded-catalogue"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-02"
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Shopper browser to Worker | Public `/shop` URL, query string only (`q`, filters, sort, page) | Untrusted text, reflected into the page |
| Worker to How many API | Server-side fetch of `/`, `/filters`, `/items` | Cleaned query string out; public store data in |
| Env and config to code | `STORE_SLUG`, `HOWMANY_API_URL`, `SITE_URL` from Worker vars; shop values in `src/shop/` | Non-secret config (the webhook secret never reaches Phase 2 code) |
| CI and deploy to Cloudflare | GitHub Actions builds and deploys on merge to `main` | Deploy token (two steps only), npm packages |
| Footer to third parties | Outbound links to Vinted, eBay, Instagram | Referrer, shopper click-through |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | DoS (cache-key flooding) | `params.ts`, `getItemsPage` | medium | mitigate | Lists checked against `/filters` and capped per group; ranges digits-only and clamped; `q` trimmed and capped at 40 code points; page capped; one sorted serialisation. Edge rate-limit rule is a dashboard step (README Operations) | closed |
| T-02-02 | Tampering (query injection) | `howmany/client.ts` | medium | mitigate | One `fetch`, fixed path literals, query built with `URLSearchParams` | closed |
| T-02-03 | Spoofing (redirect) | `next.config.ts` | low | mitigate | Fixed `/` to `/shop`, `permanent: false` | closed |
| T-02-04 | Info disclosure | `filtersSchema` | low | mitigate | Plain `z.object` strips unknown keys | closed |
| T-02-05 | Info disclosure | `src/shop/config.ts` | medium | mitigate | No `process.env` or `storeEnv` under `src/shop` | closed |
| T-02-06 | Tampering (font tarball) | `@fontsource` tarball | medium | mitigate | Only the woff2 and licence committed; package not a dependency; `next/font/local` | closed |
| T-02-07 | Info disclosure | `ItemCard.tsx` | low | mitigate | Named fields only, leak test in `ItemGrid.test.ts` | closed |
| T-02-08 | DoS (prefetch fan-out) | `ItemCard.tsx`, `Pager.tsx` | low | mitigate | `prefetch={false}` on card, pager, chips and empty-state links | closed |
| T-02-09 | Tampering (stale stock) | `shop/page.tsx` | high | mitigate | Only a 400 from `/items` is caught (uncached empty result); every other error rethrown; outage proof in `prove-freshness.mjs`, run in CI | closed |
| T-02-10 | Spoofing (open redirect) | `shop/page.tsx` | low | mitigate | Redirect built from the cleaned query, always prefixed `/shop` | closed |
| T-02-11 | DoS (Header on every page) | `Header.tsx` | medium | mitigate | `connection()` outside the try; `getFilters` caught and logged; CI checks the build makes zero API calls | closed |
| T-02-12 | Info disclosure (newsletter) | `Footer.tsx` | medium | mitigate | Disabled input and button, no `<form>` | closed |
| T-02-13 | Spoofing (tabnabbing) | `Footer.tsx`, `SocialIcons.tsx`, `buttons.tsx` | low | mitigate | Every `target="_blank"` has `rel="noopener noreferrer"` | closed |
| T-02-14 | Tampering (reflected input) | `HeaderSearch.tsx` | low | mitigate | `q` only as `defaultValue`; no `dangerouslySetInnerHTML` or `innerHTML` in `src` | closed |
| T-02-15 | Tampering (reflected XSS) | `FilterChips.tsx`, metadata | medium | mitigate | `q` only as JSX text; fixed metadata title; canonical URL-encoded; escape test in `FilterChips.test.ts` | closed |
| T-02-16 | Spoofing (Host header) | `generateMetadata` | medium | mitigate | Canonical from `SITE_URL` (https only); nothing reads request headers | closed |
| T-02-17 | Info disclosure (early indexing) | `next.config.ts`, `layout.tsx` | medium | mitigate | `X-Robots-Tag: noindex, nofollow` on all paths; layout robots off; `SITE_INDEXABLE = false` | closed |
| T-02-18 | Tampering (client-built hrefs) | `FilterPanel.tsx` | low | mitigate | Server cleans every query before any API call; forms are GET to `/shop` | closed |
| T-02-19 | DoS (click bursts) | `FilterPanel.tsx`, `RangeSlider.tsx` | low | mitigate | 250 ms debounce; sliders commit on release | closed |
| T-02-20 | Elevation of privilege | `ci.yml` | medium | mitigate | `contents: read`, `pull_request` trigger only, placeholder env, deploy token scoped to two steps | closed |
| T-02-21 | Info disclosure (early indexing) | `deploy-workers.yml` | low | mitigate | Smoke test asserts the noindex header and listing meta | closed |
| T-02-SC | Tampering (supply chain) | npm installs | high | mitigate (Plan 02) / accept (Plans 01, 03-10) | Owner-approved package table; exact pins; lockfile integrity hashes; `npm ci`; no install scripts | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-01 | Free-text `q` can still mint new cache keys within the 40-character cap; a 429 is never cached. The Cloudflare rate-limit rule is a dashboard step for the owner (README Operations) and cannot be verified from the repo | Plan 02-01 threat model | 2026-11-02 |
| AR-02-02 | T-02-SC | Plans 01 and 03-10 install no packages; only commit 76f5be5 changed `package.json` and the lockfile | Plans 02-01, 02-03 to 02-10 threat models | 2026-11-02 |

Findings outside the register, tracked elsewhere (none is high, none blocks):

- Placeholder Vinted and eBay URLs are live (code review WR-03): GitHub issue #9. Fix before the shop is promoted.
- The Cloudflare rate-limit rule only covers the custom domain; `workers_dev` stays on until Phase 4.
- Inherited-key lookups in `labels.ts` and `ColourSwatches.tsx` (code review IN-04): fixed in the follow-up PR.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-02 | 22 | 22 | 0 | gsd-security-auditor (ASVS 1, block_on high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-02
