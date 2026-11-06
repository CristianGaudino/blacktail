---
phase: 01-live-stock-skeleton
reviewed: 2026-10-26T00:00:00Z
depth: standard
files_reviewed: 35
files_reviewed_list:
  - .env.example
  - .github/workflows/ci.yml
  - .github/workflows/deploy-workers.yml
  - .gitignore
  - .nvmrc
  - eslint.config.mjs
  - next.config.ts
  - open-next.config.ts
  - package.json
  - scripts/mock-howmany.mjs
  - scripts/prove-freshness.mjs
  - src/app/api/webhooks/howmany/route.test.ts
  - src/app/api/webhooks/howmany/route.ts
  - src/app/error.tsx
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/components/stock/ItemList.tsx
  - src/components/ui/StatusScreen.tsx
  - src/instrumentation.ts
  - src/lib/config.ts
  - src/lib/copy.test.ts
  - src/lib/copy.ts
  - src/lib/definitions.ts
  - src/lib/env.test.ts
  - src/lib/env.ts
  - src/lib/guard.test.ts
  - src/lib/howmany/client.test.ts
  - src/lib/howmany/client.ts
  - src/lib/howmany/schemas.ts
  - src/lib/routes.ts
  - src/lib/webhook.test.ts
  - src/lib/webhook.ts
  - src/test/setup.ts
  - tsconfig.json
  - vitest.config.mts
  - wrangler.jsonc
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-26
**Depth:** standard
**Files Reviewed:** 35 (wrangler.jsonc and the other config files counted)
**Status:** issues_found

## Summary

The webhook verifier is sound. The shape guards run before any crypto, WebCrypto compares in constant time, the tag comes from env and not from the body, and the unit tests cover the edge cases. The client centralises fetches with tags and a time-based fallback, and the privacy whitelist is enforced by the Zod schema. I found no critical defects.

I did not run the app, the tests or the CI jobs. All findings come from reading the code against the API contract in docs/refs/issues.json.

The weak points are:
- The home page has a single point of failure in strict schema parsing.
- Item lists are silently truncated at 100.
- The webhook reads its body before authenticating.
- The production deploy workflow hands the Cloudflare token to every step and can be dispatched from any branch.

## Warnings

### WR-01: One item with a null text field takes down the whole shop, and the bad body stays cached

**File:** `src/lib/howmany/schemas.ts:19-36` (consumed in `src/lib/howmany/client.ts:32`)
**Issue:** `brand`, `size`, `colour` and `era` are `z.string()`, so they are not nullable. `type` and `department` are nullable, which suggests the author knew some fields can be empty. The API doc lists `size`, `colour` and `era` as filter dimensions and the issue text never promises they are always present. If How many returns `null` for one of them on a single item (for example a piece with no era), `schema.parse` throws a `ZodError` for the whole `/items` page. Three things follow:
- `HomePage` renders the error screen for every visitor.
- The 200 response is already stored in the fetch cache, so the failure repeats for up to 600 s, until a webhook fires or the data is refetched.
- A schema change does not heal itself.

This is the opposite of the "ignore what you don't know" principle the file's header comment states.
**Fix:** Make the display-only descriptive fields tolerant (`z.string().nullable()` or `.nullish().transform(v => v ?? '')`). Alternatively, parse items one by one with `safeParse`, drop and log any item that fails, and keep the rest:
```ts
const itemsPageSchema = z.object({
    items: z.array(z.unknown()).transform(raw => raw.flatMap(i => {
        const r = itemSchema.safeParse(i);
        if (!r.success) console.warn('How many item skipped: invalid shape');
        return r.success ? [r.data] : [];
    })),
    page: z.number(), limit: z.number(), total: z.number(),
});
```

### WR-02: Only the first 100 items are ever shown, with no signal when `total` is larger

**File:** `src/lib/howmany/client.ts:40`, `src/lib/config.ts:15`, `src/app/page.tsx:8`
**Issue:** `getItems()` fetches a single page (`limit=100`) and returns it. `page.total` is parsed but never compared with `items.length`. A shop with 101 or more in-stock pieces silently loses the newest ones beyond 100, because the default sort is `newest`, so the oldest are cut. The section is shown as "all current stock", which breaks the core value ("always up to date"). Phase 2 may add paging, but nothing here records the limit or fails loudly.
**Fix:** Loop until `page * limit >= total` (the doc's stated last-page rule), or at minimum log a warning and add a TODO tied to the phase that owns paging. Each extra page is a tagged, cached fetch, so the rate limit is unaffected.

### WR-03: Webhook body is read in full before any authentication when `Content-Length` is absent

**File:** `src/app/api/webhooks/howmany/route.ts:16-18`
**Issue:** The size guard trusts the `Content-Length` header. A chunked request has no such header (`Number(null)` is 0), so `await request.text()` buffers the entire body from an unauthenticated caller before the post-hoc `body.length` check. On Workers, request bodies can be very large, so this is an unauthenticated memory and CPU burn on a public endpoint. `body.length` also counts UTF-16 code units, not bytes, so the "8192 bytes" limit is only approximate. The test at `route.test.ts:59` covers only the header path.
**Fix:** Cap while reading, for example:
```ts
const reader = request.body?.getReader();
let bytes = 0; const chunks: Uint8Array[] = [];
while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > STORE_API.webhookMaxBytes) { await reader.cancel(); return refuse('size'); }
    chunks.push(value);
}
const body = new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
```
Add a chunked-body test.

### WR-04: The production deploy can be dispatched from any branch

**File:** `.github/workflows/deploy-workers.yml:5-10`
**Issue:** `workflow_dispatch` has no ref restriction. Anyone with write access can run "Deploy (Cloudflare Workers)" from an unreviewed feature branch and push that code to production. Production then bypasses the "owner merges" rule in the project git rules. The only thing that gates a `push` to `main` is branch protection, which does not apply to a dispatched run.
**Fix:** Gate the job:
```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
```
Also consider a protected `environment: production` with required reviewers.

### WR-05: Cloudflare API token is exposed to `npm ci`, the test run and the build

**File:** `.github/workflows/deploy-workers.yml:31-32`
**Issue:** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set at job `env:` level, so every step sees them, including `npm ci` (dependency lifecycle scripts) and `npm test`. A compromised transitive dependency, which is a real risk given the fast OpenNext release cadence and the several `overrides` in package.json, can exfiltrate a token that can deploy to the account. Only `populateCache remote` and `wrangler deploy` need it.
**Fix:** Move the two variables to a step-level `env:` on those two steps.
```yaml
- name: Prerendered pages into the cache bucket
  run: npx opennextjs-cloudflare populateCache remote
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```
Repeat the same `env:` block on the Deploy step.

## Info

### IN-01: A webhook followed by an API blip shows an error to every shopper

**File:** `src/lib/config.ts:10`, `src/app/page.tsx:8`
**Issue:** `expire: 0` plus a hard throw on any non-2xx means the first refetch after a webhook shows the error screen to everyone if the API is rate limited (429, a shared per-IP limit) or briefly down. The old good data is expired and cannot be served as stale. The outage path in `prove-freshness.mjs` asserts this behaviour, so it is a deliberate trade-off. It is worth recording as accepted risk, or revisiting once real traffic and the 429 rate are known. A 429 with `Retry-After` is already a typed `HowManyError`.
**Fix:** None required for Phase 1. Consider a short retry on 429/5xx inside `howmanyFetch`, or switching to `'max'` if blank pages prove worse than a one-visit stale view.

### IN-02: Price formatted with the store currency, not the item's own

**File:** `src/components/stock/ItemList.tsx:6,21`
**Issue:** Each item carries its own `currency` (schema line 33), but the list formats every price with the store's currency prop. They are equal today ("currency is the seller's"). If they ever differ the displayed price would be wrong. A non-ISO currency string from the API would also make `Intl.NumberFormat` throw a `RangeError` and take the page down.
**Fix:** Use `item.currency`, and wrap the formatter in a try/catch that falls back to a plain `${cents / 100} ${currency}` string. This belongs with the Phase 2 shared money formatter.

### IN-03: `HOWMANY_API_URL` with a query string or fragment would build broken request URLs

**File:** `src/lib/env.ts:14`, `src/lib/howmany/client.ts:26`
**Issue:** The transform only strips trailing slashes. A value such as `https://x/api/v1/stores/slug?foo=1` passes validation, because `pathname` still ends in `/stores/<slug>`. The client then builds `...?foo=1/items?limit=100`.
**Fix:** In the refine, also require `!url.search && !url.hash`, or normalise through `new URL()` and rebuild from `origin + pathname`.

### IN-04: CI `paths-ignore` can leave required checks pending on docs-only pull requests

**File:** `.github/workflows/ci.yml:11`
**Issue:** If branch protection requires the `check` or `worker` job, a markdown-only or `.planning/`-only PR never triggers the workflow and the required status stays "expected" forever, which blocks the merge. The same comment states the intent ("notes and docs can't break anything"), so this only matters once required checks are enabled.
**Fix:** Skip required status checks for those paths via a ruleset, or drop `paths-ignore` and use a lightweight changed-files step that no-ops the jobs.

---

_Reviewed: 2026-10-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
