---
phase: 04-home-and-launch
plan: 05
subsystem: launch
tags: [ci, deploy, indexing, onboarding, cloudflare, workerd]
requires: ["04-04"]
provides:
  - "ci.yml worker job: home, images, /just-dropped, /about, /contact, robots.txt and sitemap.xml on workerd with the flag off, plus a second Worker (port 8789) with ALLOW_INDEXING=true"
  - "deploy-workers.yml: one ALLOW_INDEXING repository variable feeds the build env and wrangler deploy --var; a value other than true or false stops the deploy; SITE_URL smoke checks the live state"
  - "wrangler.jsonc with workers_dev and preview_urls off"
  - "docs/ONBOARDING.md plus src/lib/onboarding.test.ts drift guard"
affects: []
tech-stack:
  added: []
  patterns:
    - "Every workflow step that uses the code() or body() shell helpers defines them in its own run block"
    - "Docs checked against the template by a test (env names, image slots, bindings, folders, no em dash)"
key-files:
  created:
    - docs/ONBOARDING.md
    - src/lib/onboarding.test.ts
  modified:
    - .github/workflows/ci.yml
    - .github/workflows/deploy-workers.yml
    - wrangler.jsonc
    - .env.example
    - README.md
decisions:
  - "ALLOW_INDEXING is passed with wrangler deploy --var, not put in wrangler.jsonc vars (RESEARCH A1)"
  - "The R2 lifecycle command in the onboarding doc was checked against `wrangler r2 bucket lifecycle add --help` (bucket, name, prefix, --expire-days)"
metrics:
  duration: "about 25 minutes"
  completed: 2026-11-03
status: complete
actuals:
  tokens: 14000
  tasks: 3
  commits: 3
plan_head_before: 23839e4
plan_head_after: 305c767
commits: 3
---

# Phase 4 Plan 05: Launch switch, workerd proof and onboarding Summary

One ALLOW_INDEXING repository variable now drives both the build and the Worker, CI proves the home page and the new pages on workerd with indexing off and on, and docs/ONBOARDING.md (guarded by a test) lets another shop deploy the template.

## What was done

1. **CI (commit 04aa774).** The Worker warm-up now hits `/`. A new step checks `/` (200, h1, item link, brand link, `type=jacket` tile, absolute og:image from SITE_URL, no Denim tile), `hero.jpg` and `og-default.jpg` as image/jpeg, `/just-dropped` (no sort control, sort-only URL canonicalises, `?page=99` is 307), `/about`, `/contact` (mailto), `robots.txt` (exact `Disallow: /`, no Sitemap) and an empty sitemap. A second Worker on 8789 with `ALLOW_INDEXING=true` checks the absolute Sitemap line, `Disallow: /api/` without a blanket disallow, the sitemap entries and `index, follow` on `/shop`. The helper-definition check passes for both workflow files. Existing checks are unchanged.
2. **Deploy (commit 73d6975).** `ALLOW_INDEXING: ${{ vars.ALLOW_INDEXING || 'false' }}` in the job env, a true-or-false gate before the build, `wrangler deploy --var "ALLOW_INDEXING:$ALLOW_INDEXING"`, and a smoke that uses `$SITE_URL` (the host appears once) and defines its own helpers. It expects `/` 200, adds `/just-dropped` and `/sitemap.xml`, and branches on the flag. Off: noindex header, exact `Disallow: /`, no Sitemap line. On: no x-robots-tag, Sitemap line, `index, follow`. `wrangler.jsonc` has `workers_dev: false` and `preview_urls: false`. `.env.example` has `ALLOW_INDEXING=false`. The README rate-limit rule now covers `/shop`, `/just-dropped` and `/brands/`, and links to the onboarding doc.
3. **Onboarding (commit 305c767).** `docs/ONBOARDING.md` has the twelve sections from the plan. `src/lib/onboarding.test.ts` fails if the doc stops naming an `.env.example` variable, an image slot file, one of the four Cloudflare bindings, a template folder or PENDING-OWNER, or contains an em dash.

## Verification

- `npm test` 292 passed (32 files), `npm run lint` and `npm run typecheck` clean.
- Both workflow files parse with js-yaml; the helper-definition check exits 0; the Task 2 grep acceptance checks pass.
- NOT run here: the `worker` CI job (OpenNext cannot build on Windows), so none of the new workerd assertions has run yet. They run on the phase PR in CI.

## Deviations from Plan

- **Not done by instruction of the orchestrator:** no `git push`, no `gh pr create`, no PR checks watch, no PR comment. The PR body (sections listed in Task 1) and the UAT comment (Task 3 human-check list, which must say RESEARCH A1 is "NOT proven before merge") are left to the orchestrator. The acceptance criteria that read the PR (`gh pr view ...`) are therefore not satisfied by this plan run.
- **[Rule 3 - Blocking]** The worktree HEAD was not a descendant of 23839e4; reset to it as the dispatch told me.

## Open items

- RESEARCH A1 (`wrangler deploy --var` sets the run-time flag) is not proven before merge. The first post-merge deploy smoke checks only the flag-off state; A1 is proven by the launch redeploy with `ALLOW_INDEXING=true`.
- The CI `worker` job assertions are untested until the PR runs; most likely failure points are the exact og:image meta shape and the `rel="canonical"` attribute order in the rendered HTML.

## Known Stubs

None added. Existing PENDING-OWNER placeholders in `src/shop/config.ts` are listed by `grep -rn PENDING-OWNER src` and in the onboarding doc.

## Threat Flags

None.

## Self-Check: PASSED

Files exist: docs/ONBOARDING.md, src/lib/onboarding.test.ts, this SUMMARY. Commits 04aa774, 73d6975, 305c767 are on the branch.
