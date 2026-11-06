---
phase: 02-branded-catalogue
reviewed: 2026-10-27T00:00:00Z
depth: standard
files_reviewed: 50
files_reviewed_list:
  - .github/workflows/ci.yml
  - .github/workflows/deploy-workers.yml
  - next.config.ts
  - package.json
  - scripts/mock-howmany.mjs
  - scripts/prove-freshness.mjs
  - src/app/error.tsx
  - src/app/layout.tsx
  - src/app/shop/loading.tsx
  - src/app/shop/page.tsx
  - src/components/catalogue/CatalogueBanner.tsx
  - src/components/catalogue/CatalogueShell.tsx
  - src/components/catalogue/ColourSwatches.tsx
  - src/components/catalogue/FilterChips.tsx
  - src/components/catalogue/FilterDrawer.tsx
  - src/components/catalogue/FilterGroup.tsx
  - src/components/catalogue/FilterPanel.tsx
  - src/components/catalogue/ItemCard.tsx
  - src/components/catalogue/ItemGrid.tsx
  - src/components/catalogue/Pager.tsx
  - src/components/catalogue/RangeSlider.tsx
  - src/components/catalogue/SortSelect.tsx
  - src/components/layout/Footer.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/HeaderSearch.tsx
  - src/components/layout/MobileMenu.tsx
  - src/components/layout/NavDropdown.tsx
  - src/components/layout/NavLink.tsx
  - src/components/ui/Sheet.tsx
  - src/components/ui/SocialIcons.tsx
  - src/components/ui/StatusScreen.tsx
  - src/components/ui/buttons.tsx
  - src/hooks/useModalDialog.ts
  - src/lib/config.ts
  - src/lib/copy.ts
  - src/lib/dates.ts
  - src/lib/definitions.ts
  - src/lib/howmany/client.ts
  - src/lib/howmany/schemas.ts
  - src/lib/labels.ts
  - src/lib/money.ts
  - src/lib/paging.ts
  - src/lib/params.ts
  - src/lib/routes.ts
  - src/lib/seo.ts
  - src/lib/utils.ts
  - src/shop/colours.ts
  - src/shop/config.ts
  - src/shop/fonts.ts
  - src/shop/theme.css
  - src/styles/globals.css
findings:
  critical: 2
  warning: 3
  info: 8
  total: 13
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-27
**Depth:** standard
**Files Reviewed:** 50
**Status:** issues_found

## Summary

The catalogue is carefully built: URL cleaning is thorough (values whitelisted against `/filters`, numeric bounds clamped and snapped, page clamped, 400 from a stale cache handled), the client keeps cache keys canonical, the webhook path and error screen are consistent with the documented caching contract, and no item data reaches a client component. `error.tsx` using `retry` is correct for Next 16.3+ (checked in the installed docs), so that is not a defect.

Two things need fixing before ship: `cn()` strips the custom `text-label` size from every `Button`, and free-text `q` (plus filter combinations) mints unbounded cache keys, each costing one call against the shared 3000/min How many rate limit. Both known issues from the caller were reproduced and are listed below with refinements.

## Critical Issues

### CR-01: `cn()` drops `text-label` from every Button (tailwind-merge does not know the custom font sizes)

**File:** `src/lib/utils.ts:8-10` (effect in `src/components/ui/buttons.tsx:32-38`)
**Issue:** `twMerge` classifies an unknown `text-<word>` as a text colour, so `text-label` and `text-ivory` / `text-forest` collide and the earlier one is removed. Reproduced with the installed package:
`twMerge('inline-flex text-label uppercase bg-forest text-ivory')` returns `inline-flex uppercase bg-forest text-ivory`.
`buttonClassName` always puts `text-label` before the variant colour, so all `Button` and `ButtonLink` instances (Try again, Go home, Apply filters, Clear all filters) render at 16px with no 0.16em tracking instead of the 12px label style from the mockups. It is silent: no error, no test failure, only a visual mismatch against the v1 target. Plain-string usages elsewhere (e.g. `FilterDrawer.tsx:20`) are unaffected because they bypass `cn`, so the bug looks inconsistent between buttons. `text-heading` and `text-display` would hit the same trap the first time they go through `cn`.
**Fix:**
```ts
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
    extend: { classGroups: { 'font-size': [{ text: ['label', 'heading', 'display'] }] } },
});
```
Add a `utils.test.ts` case asserting `cn('text-label', 'text-ivory')` keeps both.

### CR-02: Unbounded cache-key minting via `q` and filter combinations exhausts the shared API rate limit

**File:** `src/lib/params.ts:52-55`, `src/lib/howmany/client.ts:25-35`, `src/lib/config.ts:18-21`
**Issue:** The code already caps `page` "so a made-up page number cannot mint cache keys", but `q` is free text (80 code points, any content), so `/shop?q=a1`, `/shop?q=a2`, ... each produce a distinct upstream URL, a cache miss, a blocking API call and a persistent R2 entry for 600 s. The project constraint says the 3000/min limit is shared by one server IP. About 50 requests per second from one client (or any crawler following links) is enough to push every real visitor, and every other shop on that IP, into 429s. The page then throws `HowManyError` and shows the error screen, and the 400/429 responses are not cached so the damage persists. Valid-value filter combinations (brand x type x size x price steps) are a second, smaller key space of the same kind.
**Fix:** Bound it at the edge and in the code:
1. Add a Cloudflare rate-limiting (or WAF) rule on `/shop` requests carrying `q` (and on `/shop` in general) per client IP.
2. In code, treat a query with `q` differently: shorten `maxQueryChars` (80 is generous for a shop search), reject queries that are only punctuation, and consider `revalidate` of a few seconds (or `cache: 'no-store'` so R2 is not filled) for `q` queries, since they are rarely repeated.
3. Add a ceiling on distinct list values per request (for example 5 per group) so combinations cannot grow without limit.

## Warnings

### WR-01: Header and mobile menu `<nav>` landmarks have no accessible name (confirmed, refined)

**File:** `src/components/layout/Header.tsx:56`, `src/components/layout/MobileMenu.tsx:68`
**Issue:** The page exposes four navigation landmarks: the header nav, the mobile-menu nav, the Pager (`aria-label="Pages"`) and the footer nav (`aria-labelledby`). Two of them have no name, so a screen-reader landmark list shows "navigation, navigation, Pages, Explore". The known report only named the header; the mobile menu nav has the same gap. Copy strings live in `src/lib/copy.ts`, which has no `nav.label` entry yet.
**Fix:** Add `COPY.nav.main: 'Main'` and set `<nav aria-label={COPY.nav.main}>` in both places (the mobile one can reuse the same text; only one is exposed at a time because the other is `display: none`).

### WR-02: Hover-opened dropdown closes when the user then clicks the button

**File:** `src/components/layout/NavDropdown.tsx:44-48, 69`
**Issue:** On desktop a mouse hover opens the panel after 150 ms (`setOpen(true)`). The button's `onClick` is a toggle (`setOpen(o => !o)`), so the common sequence "hover, then click to open" closes the panel the hover just opened. Only a click inside the first 150 ms behaves as intended.
**Fix:** Make the click open-only when it follows a hover open, for example track `openedByHover` in a ref and, in `onClick`, `setOpen(o => (openedByHover.current ? true : !o)); openedByHover.current = false;`, or make the click handler only toggle for non-mouse pointers.

### WR-03: Placeholder owner contact and third-party profile URLs ship to production

**File:** `src/shop/config.ts:14-18`
**Issue:** `deploy-workers.yml` publishes every merge to `main`. The footer renders a `mailto:` to `pending-owner@blacktailarchive.example` (undeliverable) and links to `vinted.ie/member/pending-owner` and `ebay.ie/usr/pending-owner`, which are real URL shapes on third-party sites and could point at an unrelated person's profile. The `PENDING-OWNER` comments show it is known, but nothing blocks the deploy.
**Fix:** Render the email and platform entries only when the value is not the placeholder (or use `null`/empty arrays until the owner supplies values), and add a guard test that fails when `pending-owner` is present and `NODE_ENV`/the deploy flag says production.

## Info

### IN-01: Card image alt text repeats the adjacent link text

**File:** `src/components/catalogue/ItemCard.tsx:24`
**Issue:** The image is inside a link that also contains the brand and title as text. With `alt="Brand Title"` the link's accessible name reads brand and title twice.
**Fix:** Use `alt=""` (the image is decorative next to the text) or drop the text duplicate from the name.

### IN-02: Stone borders and the slider track are about 2.1:1 against Ivory

**File:** `src/components/catalogue/SortSelect.tsx:27`, `src/components/catalogue/FilterDrawer.tsx:20`, `src/components/catalogue/RangeSlider.tsx:49`, `src/shop/theme.css:5`
**Issue:** `#A69D8F` on `#E8E5DD` is about 2.1:1. WCAG 1.4.11 asks 3:1 for the boundary of a control (the select, the Filter button, the slider track).
**Fix:** Use `border-olive` (or a darker shop token) for interactive control borders and keep Stone for decorative dividers.

### IN-03: The mm to cm conversion `/ 10` is repeated as a magic number

**File:** `src/components/catalogue/FilterChips.tsx:34-35`, `src/components/catalogue/FilterPanel.tsx:101`
**Issue:** Three places divide by 10 independently of `CATALOGUE.ranges.*.step` (which happens to also be 10).
**Fix:** Add `MM_PER_CM = 10` to `src/lib/config.ts` (or a `formatCm()` in `money.ts`'s neighbour) and use it in all three places.

### IN-04: Plain-object lookups accept inherited keys

**File:** `src/lib/labels.ts:3`, `src/components/catalogue/ColourSwatches.tsx:16`
**Issue:** `map[code.toLowerCase()]` and `SHOP.colours[...]` read from plain objects, so an API value such as `constructor` or `toString` returns a function. In `label()` that makes the page try to render a function; in `ColourSwatches` it becomes a truthy "hex" and a function is set as `backgroundColor`. Values come from an external API and the project promises an unknown code never breaks the page (D-19, D-15).
**Fix:** `Object.hasOwn(map, key) ? map[key] : fallback` in both places.

### IN-05: A group the user opened by hand collapses when its last selection is removed

**File:** `src/components/catalogue/FilterPanel.tsx:64`, `src/components/catalogue/FilterGroup.tsx:15`
**Issue:** `open` is the controlled prop `OPEN_BY_DEFAULT.includes(list) || selection > 0`. For a non-default group (era, material, ...) the user opens it, selects a value (prop true), deselects it (prop false), and React then sets `open=false`, closing the group under the pointer.
**Fix:** Keep an `everOpened` flag per group in state (set when a value is first selected) and use `open = default || everOpened`.

### IN-06: Duplicated sort comparator and a server-style module imported by a client component

**File:** `src/lib/howmany/client.ts:27` and `src/lib/params.ts:82`; `src/components/catalogue/FilterPanel.tsx:12` importing `LABEL_MAPS` from `FilterChips.tsx:13`
**Issue:** The "sort by key then value" rule exists twice, so a change to one silently desyncs the cache-key canonicalisation. `LABEL_MAPS` lives in a server component file (`FilterChips`, which imports `next/link`) but is consumed by the `'use client'` `FilterPanel`, coupling a UI component to a data constant. `clearFilters` (`params.ts:107`) also hard-codes a full empty `Filters` literal just to call the parser.
**Fix:** Export one `sortedEntries()` helper from `params.ts` (it is client-safe and `client.ts` already imports from `lib`), move `LABEL_MAPS` to `src/lib/labels.ts`, and build the empty query directly in `clearFilters`.

### IN-07: Phone filtering needs JavaScript, contrary to the "works without JavaScript" comments

**File:** `src/app/shop/page.tsx:61`, `src/components/catalogue/FilterPanel.tsx:21-22`, `src/components/catalogue/FilterDrawer.tsx:17-20`
**Issue:** The sidebar form is `hidden lg:block` and the only phone entry point is a `<button>` with an `onClick`, so below `lg` with JavaScript off there is no way to filter, while the comments and `noscript` button promise a working GET form.
**Fix:** Either correct the comments to say desktop only, or render the drawer trigger as a `<details>`/anchor to the form so it works without scripts.

### IN-08: Header swallows every error without logging

**File:** `src/components/layout/Header.tsx:34-36`
**Issue:** `catch {}` covers `storeEnv()` validation failures, schema drift (`ZodError`) and API errors alike, and logs nothing. The page re-throws later for the same cached rejection so users still see the error screen, but on routes that do not call `getFilters` (future pages) a misconfiguration would silently produce an empty nav.
**Fix:** `catch (error) { console.error('Header: nav data unavailable', error); }`, keeping the `connection()` call outside as it is now.

---

Not flagged, checked and fine: `error.tsx` `retry` prop (stable since Next 16.3), `force-cache` plus `revalidate` combination (no Next conflict warning), HMAC verification path, `redirect()` loop on page past end (strictly decreasing, terminates), RangeSlider commit timing, `next/image` with `unoptimized` and remote `thumbUrl`, CI `grep -q` pipelines (default shell has no pipefail). Deploy workflow runs tests but not lint on merge to `main`; `next build` covers types, so this is left as an observation only.

_Reviewed: 2026-10-27_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
