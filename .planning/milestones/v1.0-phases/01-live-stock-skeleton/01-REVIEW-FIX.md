---
phase: 01-live-stock-skeleton
fixed_at: 2026-10-26T17:00:00Z
review_path: .planning/phases/01-live-stock-skeleton/01-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 1: Code Review Fix Report

**Fixed at:** 2026-10-26
**Source review:** .planning/phases/01-live-stock-skeleton/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (Info findings out of scope)
- Fixed: 5
- Skipped: 0

Verification ran in the main checkout (no worktree, as instructed) on branch `gsd/phase-1-deploy`: `npm test` (40 passed), `npm run lint`, `npm run typecheck` all clean. After the push, `gh pr checks 7` showed `check` and `worker` both passing.

## Fixed Issues

### WR-01: One item with a null text field takes down the whole shop

**Files modified:** `src/lib/howmany/schemas.ts`, `src/components/stock/ItemList.tsx`, `src/lib/howmany/client.test.ts`
**Commit:** 3a7553d
**Applied fix:** `brand`, `size`, `colour`, `era` are now `z.string().nullable()`. The list hides the brand line and builds the alt text from whatever exists. Test: an item with all four null parses and the other items are kept. Status: fixed, requires human verification (schema contract guess; a structurally broken item, such as a missing `code`, would still fail the page by design).

### WR-02: Only the first 100 items are shown

**Files modified:** `src/lib/howmany/client.ts`, `src/lib/howmany/client.test.ts`
**Commit:** 3984b4f
**Applied fix:** `getItems` follows `page=2..` while `page * limit < total`, stops on an empty page, merges the items, and keeps the first page's `asOf`. Page 1 URL is unchanged (`?limit=100`). Tests: 101 items over two pages; empty page stops the loop. Status: fixed, requires human verification (loop condition).

### WR-03: Webhook body read in full before authentication

**Files modified:** `src/app/api/webhooks/howmany/route.ts`, `src/app/api/webhooks/howmany/route.test.ts`
**Commit:** 5062fec
**Applied fix:** `readCapped` reads the stream chunk by chunk, counts bytes, cancels and returns 401 `size` past 8192 bytes. The Content-Length pre-check stays. Test: a chunked body with no Content-Length is refused after a few pulls.

### WR-04: Production deploy can be dispatched from any branch

**Files modified:** `.github/workflows/deploy-workers.yml`
**Commit:** 5228b8a
**Applied fix:** `if: github.ref == 'refs/heads/main'` on the deploy job. The optional protected `environment` was not added.

### WR-05: Cloudflare token exposed to npm ci, tests and build

**Files modified:** `.github/workflows/deploy-workers.yml`
**Commit:** 589a887
**Applied fix:** Moved `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from job `env` to step `env` on `populateCache remote` and `wrangler deploy` only. Not exercised: the deploy job only runs on main, so the `worker` CI job does not cover this change.

---

_Fixed: 2026-10-26_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
