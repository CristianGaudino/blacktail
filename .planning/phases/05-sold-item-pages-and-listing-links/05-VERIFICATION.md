---
phase: 05-sold-item-pages-and-listing-links
verified: 2026-11-06T20:40:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".github/workflows/ci.yml"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-01-PLAN.md"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-01-SUMMARY.md"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-02-PLAN.md"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-02-SUMMARY.md"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-03-PLAN.md"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-03-SUMMARY.md"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-04-PLAN.md"
  - ".planning/phases/05-sold-item-pages-and-listing-links/05-04-SUMMARY.md"
  - "scripts/mock-howmany.mjs"
  - "scripts/prove-freshness.mjs"
  - "src/app/api/webhooks/howmany/route.ts"
  - "src/app/items/[code]/page.tsx"
  - "src/components/item/ItemGallery.tsx"
  - "src/components/item/ItemJsonLd.tsx"
  - "src/components/item/SoldNotice.tsx"
  - "src/components/item/WhereToBuy.tsx"
  - "src/lib/howmany/client.ts"
  - "src/lib/howmany/schemas.ts"
covered_digest: "v3:sha256:e4ac78eaca42a935abbf983be61991f9454735af14c144f2fe88e5f921df3337"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Owner adds a listing URL to one live piece and marks another sold, then curl /items/<code> on the live API"
    expected: "listings is [{platform, url}] with https urls; a sold piece answers 200 with status 'sold', soldAt YYYY-MM-DD or null, priceCents number or null"
    why_human: "Non-empty listings and soldAt shapes are proven only against scripts/mock-howmany.mjs. The live API has no such sample yet (RESEARCH A1). A mismatch would silently drop listings (schema falls back to []) or null the date, so it needs the owner's live sample."
  - test: "On the deployed site: open a sold piece, a piece with listings, and a hidden piece; view on a phone width"
    expected: "Sold page with badge, Sold on date and no price or Buy block; Buy on buttons wrap with no sideways scroll; hidden piece shows the branded 404 with newest drops; Rich Results shows SoldOut"
    why_human: "Visual layout, responsive wrap and Google Rich Results cannot be checked from the code (PR #27 UAT items 1 to 7)."
---

# Phase 5: Sold Item Pages and Listing Links Verification Report

**Phase Goal:** A sold piece's address keeps working as a clear Sold page, and a piece for sale sends the shopper to its exact Vinted or eBay listing, so shared links never dead-end.
**Verified:** 2026-11-06T20:40:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

All code-level truths hold. The only open items are live-API shape confirmation (mock-only so far) and visual/Rich Results checks, which are human items rather than gaps.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|--------------------|--------|----------|
| 1 | Sold piece address returns 200 with photos, title, details and a Sold mark with the `soldAt` date; no where-to-buy, no price CTA | VERIFIED | `getItem` (`client.ts`) no longer maps sold to null; `page.tsx` sold branch renders `COPY.item.soldOn(formatDay(item.soldAt))` (falls back to "Sold"), `SoldNotice`, `ItemDetails`, gallery with `soldLabel` badge. The sold branch never calls `WhereToBuy` or `formatMoney`. `itemDetailSchema` has nullable `priceCents`, `soldAt` regex day key with `.catch(null)`. CI `worker` job green on PR #27 and #28; prove-freshness `item-sold`, `item-sold-bare` assert this. |
| 2 | Sold page has JSON-LD `SoldOut` and `noindex`; absent from sitemap, All Items, Just Dropped, More from this brand | VERIFIED | `ItemJsonLd` sets `SoldOut` when `status === 'sold'`; `generateMetadata` adds `soldItemRobots()` (`index:false, follow:true`); page skips the More-from read when sold. Sitemap and lists only read `/items` list pages, which never carry sold pieces; CI step "Indexing on" sells MOCK-0002, posts a signed webhook and asserts sitemap, /shop, /just-dropped and home exclude it. |
| 3 | Hidden, deleted, unknown or wrong-shaped code is still a real 404 with the newest drops, including right after the webhook | VERIFIED | `getItem` returns null for a bad shape (`SHOP.itemCode`, no API call) and for API 404; `page.tsx` calls `notFound()`; `not-found.tsx` renders newest drops. 404 memory (30 s, max 500) is on `globalThis` and cleared by `forgetMissing()` in the webhook route before `revalidateTag`; route test "makes getItem forget a remembered 404" and prove-freshness `item-hidden` (404 + gone message within 10 s of the webhook) cover the post-webhook case. |
| 4 | A piece with `listings` shows one button per listing, labelled with the platform name from config, opening the exact listing in a new tab | VERIFIED (mock) | `itemDetailSchema.listings` keeps https-only entries one by one; `WhereToBuy` maps each to `ButtonLink external` "Buy on {name}" (config name case-insensitive, else URL host), keyed by index and URL. CI asserts MOCK-0003 anchors with `target=_blank rel="noopener noreferrer"` to the exact URLs and no "Visit us on". Live shape: human item 1. |
| 5 | A piece with empty `listings` shows the shop's Vinted and eBay profile links from config | VERIFIED | `WhereToBuy` falls back to `SHOP.platforms` "Visit us on" buttons when `listings` is empty; schema default `[]`. CI asserts MOCK-0001 keeps "Visit us on". |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

The two post-review fixes (404 memory plus `SHOP.itemCode` shape check; webhook clears remembered 404s) are in the code and pinned by unit tests (`client.test.ts` lines 173 to 226, `route.test.ts` line 83).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/howmany/schemas.ts` | `itemDetailSchema` with nullable price, `soldAt`, `listings` | VERIFIED | Present, strict list schema untouched |
| `src/lib/howmany/client.ts` | `getItem` returning sold, 404 memory, `forgetMissing` | VERIFIED | Wired from page and webhook route |
| `src/app/items/[code]/page.tsx` | Sold branch, noindex, no More from | VERIFIED | |
| `src/components/item/SoldNotice.tsx` | Sold panel | VERIFIED | Imported and rendered by page |
| `src/components/item/WhereToBuy.tsx` | Per-listing buttons plus fallback | VERIFIED | |
| `src/components/item/ItemJsonLd.tsx` | SoldOut, optional price | VERIFIED | |
| `src/components/item/ItemGallery.tsx` | Sold badge | VERIFIED | Fed by `soldLabel` from page |
| `.github/workflows/ci.yml`, `scripts/prove-freshness.mjs`, `scripts/mock-howmany.mjs` | Workerd proof | VERIFIED | |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| webhook route | `forgetMissing` and `revalidateTag` | WIRED | Same `globalThis` map shared with pages |
| page | `getItem` -> `notFound()` | WIRED | Real 404 status asserted in prove-freshness |
| page | `WhereToBuy listings={item.listings}` | WIRED | In-stock branch only |
| page | `ItemGallery soldLabel` | WIRED | Only when `status === 'sold'` |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Sold date | `item.soldAt` | `/items/{code}` parsed by `itemDetailSchema` | Yes (mock proven; live sample pending) | FLOWING |
| Buy buttons | `item.listings` | `/items/{code}` | Yes (mock proven; live sample pending) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests | `npm test` | 32 files, 313 passed | PASS |
| Lint | `npm run lint` | clean | PASS |
| Typecheck | `npm run typecheck` | clean | PASS |
| Worker proof | `gh pr view 27 / 28` checks | check, worker, CodeQL, Analyze all SUCCESS | PASS |

### Probe Execution

No `probe-*.sh` scripts are declared by this phase. The equivalent runnable proof is `scripts/prove-freshness.mjs` and the CI `worker` job, both green on the merged PRs. Not re-run locally (needs a build and a mock server).

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| SOLD-01 | 05-01, 05-02 | SATISFIED | Truth 1 |
| SOLD-02 | 05-01 | SATISFIED | Truths 1 and 2 |
| SOLD-03 | 05-01, 05-04 | SATISFIED | Truth 2 |
| SOLD-04 | 05-01, 05-04 | SATISFIED | Truth 3 |
| LINK-01 | 05-03, 05-04 | SATISFIED (mock) | Truth 4; live shape pending |
| LINK-02 | 05-03, 05-04 | SATISFIED | Truth 5 |

No orphaned requirements: all six IDs map to Phase 5 plans.

### Anti-Patterns Found

None blocking. No TBD/FIXME/XXX in the phase's source files. One accepted, documented `shortcut:` in `client.ts`: the 404 memory is per isolate, so a piece shown again can take up to 30 s to reappear on another isolate (webhook clears only the isolate that receives it). Info only.

### Human Verification Required

1. **Live API shapes (RESEARCH A1).** Test: owner adds a listing URL to one live piece and marks another sold, supplies the two codes; `curl https://www.checkhowmany.com/api/v1/stores/blacktail-archive/items/<code>`. Expected: `listings` as `{platform, url}` with https, sold piece 200 with `status` "sold", `soldAt` YYYY-MM-DD or null, `priceCents` number or null. Why human: needs live data only the owner can create; a mismatch is fixed in `src/lib/howmany/schemas.ts` first.
2. **Deployed-site visual check.** Test: sold page and badge, Buy on buttons and responsive wrap, hidden piece 404, Rich Results SoldOut, no-photo sold placeholder. Why human: visual and Google tooling.

### Gaps Summary

No gaps. Housekeeping outside the verified code: `.planning/REQUIREMENTS.md` still shows SOLD-01..04 and LINK-01..02 as unchecked/Pending, and ROADMAP lists Phase 5 as unchecked in the milestone list; the close-phase branch should update these once the human items are signed off.

---

_Verified: 2026-11-06T20:40:00Z_
_Verifier: Claude (gsd-verifier)_
