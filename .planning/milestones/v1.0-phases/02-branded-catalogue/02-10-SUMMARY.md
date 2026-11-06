---
phase: 02-branded-catalogue
plan: 10
subsystem: ci-deploy
tags: [ci, workerd, smoke, seo, pull-request, tracer]
status: complete

requires:
  - phase: 02-branded-catalogue
    provides: "scripts/prove-freshness.mjs targeting /shop (02-01), money formatter (02-04), noindex, follow listing meta (02-08), filter panel (02-09)"
provides:
  - "CI worker job proves /shop on workerd: warm-up, freshness, outage, filtered-listing SEO, en-IE money, missing-secret 500"
  - "Deploy smoke follows /shop: noindex header, root 307, webhook 401, filtered-listing SEO"
  - "Phase PR #8 against main, both checks green, UAT checklist posted as a PR comment"
affects: [phase-04]

actuals:
  tokens: 6000
  tasks: 2
  commits: 3
plan_head_before: be77498281c27baadfe6b5fdb6426a10d6a143a3
plan_head_after: 36e3826211b2e501f23016884c748ab586e3546f

tech-stack:
  added: []
  patterns:
    - "Every header check targets /shop, never /, because headers on a config redirect are not guaranteed (RESEARCH A7)"
    - "Filtered URLs are pinned as page noindex, follow plus wire X-Robots-Tag noindex, nofollow until Phase 4 drops the site-wide header"

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml
    - .github/workflows/deploy-workers.yml

key-decisions:
  - "Money en-IE check on workerd added to the worker job (carry-forward from 02-04): the mock's second cheapest piece must render as the euro sign plus 12.50"

requirements-completed: [SEO-04, SHELL-04, CAT-08]
duration: ~20min
completed: 2026-10-27
---

# Phase 2 Plan 10: Prove the phase on workerd and open the PR Summary

CI's worker job and the deploy smoke now run against `/shop` (the root is a 307), pin the filtered-listing SEO interaction, and the phase PR (https://github.com/CristianGaudino/blacktail/pull/8) is open against main with `check` and `worker` green.

## Accomplishments

- **ci.yml, worker job:** warm-up curls `/shop`; new step "Filtered listings are noindex, follow" fetches `/shop?sort=price_asc` and requires the page meta `noindex, follow` and the header `x-robots-tag: noindex, nofollow`; the missing-secret step polls `/shop` and still asserts 500 plus the "Invalid environment variables" log line.
- **ci.yml, carry-forward:** new step "Money is formatted as en-IE on the Worker" greps `/shop?sort=price_asc` for the euro sign plus `12.50`, confirming workerd's ICU formats money as en-IE.
- **deploy-workers.yml:** wait polls `/shop`; Smoke checks the noindex header on `/shop`, root = 307, unsigned webhook POST = 401, and the filtered-listing page meta plus header. `if: github.ref == 'refs/heads/main'` and token scoping unchanged.
- **PR #8** opened (not merged) with what shoppers get, the knowing deviations, owner-pending values, known issues and a test plan; the UAT checklist is posted as a PR comment.

## Task Commits

| Task | Commit | Description |
| ---- | ------ | ----------- |
| 1 | c5e52ba | worker job proves /shop, filtered listings noindex follow |
| 1 (follow-up) | 36e3826 | en-IE money check on workerd |
| 2 | 6d2451f | production smoke follows /shop |

## Verification

- Local: `npm test` (145 passed), `npm run lint`, `npm run typecheck` all clean before the push.
- CI on the last commit (run 40424862127): `check` pass, `worker` pass, CodeQL pass. Worker steps "Filtered listings are noindex, follow", "Money is formatted as en-IE on the Worker" and "A Worker without its secret refuses to serve" concluded `success`.
- Acceptance greps: `127.0.0.1:8787/shop` and `127.0.0.1:8788/shop` present, `noindex, follow` and the `x-robots-tag: noindex, nofollow` pin present in both workflows, `contents: read` and the main-only deploy guard intact, `blacktailarchive.cgaudino.com/shop` appears 3 times in deploy-workers.yml, `= 307` present.
- `gh pr view`: `main OPEN`. PR comment count at least 1.

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing critical] en-IE money check on workerd**
- **Found during:** Task 1 (carry-forward from 02-04, which assigned the en-IE proof to this plan; the plan's task text did not include it)
- **Fix:** one extra worker-job step grepping `/shop?sort=price_asc` for the euro sign plus `12.50`
- **Files modified:** .github/workflows/ci.yml
- **Commit:** 36e3826

**Total deviations:** 1 auto-added. **Impact:** none on scope; one extra CI step, passing.

The carry-forward item about `ci.yml` and `deploy-workers.yml` still requesting `/` is covered by the plan's own tasks.

## Not verifiable here

- The production smoke in deploy-workers.yml only runs after the owner merges to main; it was not executed. Its assertions mirror the CI ones but run against the live host (root 307, header on `/shop`).
- Header-on-`/` behaviour of the config redirect (RESEARCH A7) was not checked; every header check avoids `/`.

## End-of-phase UAT checklist

Posted on PR #8: https://github.com/CristianGaudino/blacktail/pull/8#issuecomment-6430388541

1. Look matches `docs/refs/misc-mockup.png` and `docs/refs/just-dropped.png` (palette, Bodoni, Montserrat, header chevrons, cards with NEW and heart, footer).
2. No sideways scroll at 320/375/768/1024/1280 (long brand name in a dropdown, filter row, chip).
3. Dropdowns, header search, phone menu and filter drawer work by mouse, touch and keyboard with a visible Forest focus ring.
4. Filters, search, sort and pages combine; shared URL reopens the same results; junk ignored; any change returns to page 1.
5. Drawer Apply with no change just closes; X, Esc and backdrop discard changes.
6. Bag, account, wishlist, hearts and newsletter are visibly decorative and never act.
7. Logo crisp and correctly sized at 32px and 40px.
8. Only the pending owner values (Vinted, eBay, email) are placeholders.

Deferred browser checks from earlier plans: fonts/palette/focus ring (02-02); grid at 320/375/640/1280, hover zoom, slow-network skeleton (02-05); header dropdowns hover/Esc/focus, phone menu, logo size (02-06); footer at 1280/375, social glyphs, outage screen with Tab (02-07); sort without reload, grid dims, Back undoes sort, no-JS sort (02-08); filter debounce, sliders drag/keyboard, swatch ring/wrap, drawer behaviours, no sideways scroll at 320px (02-09).

## Known issues / follow-ups (listed in the PR body, not fixed)

- `cn()` in `src/lib/utils.ts` drops the custom `text-label` size when `text-ivory`/`text-forest` follows (Button/ButtonLink, error screen); fix via `extendTailwindMerge`.
- Header `<nav>` has no aria-label (no COPY string).
- Commit a08c25f (02-08) has one failing test, fixed by 1618a55.
- 02-09 filter panel: "unchanged Apply adds no history entry" and "newer change cancels pending debounce" have no automated test.
- Owner-pending values in `src/shop/config.ts` (email, Vinted, eBay); footer copyright sign vs UI-SPEC "(c)" is the owner's choice.

## Known Stubs

The only placeholders are the three `PENDING-OWNER` values in `src/shop/config.ts`, intentional and listed above. They were already recorded by 02-07.

## Next Phase Readiness

Phase 2 plans are complete. The owner reviews and merges PR #8; the deploy job's smoke then proves the live site.

## Self-Check: PASSED
