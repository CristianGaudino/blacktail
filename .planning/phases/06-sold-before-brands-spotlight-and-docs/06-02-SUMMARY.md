---
phase: 06-sold-before-brands-spotlight-and-docs
plan: 02
subsystem: docs
tags: [docs, rate-limit, comments]
requires: []
provides:
  - "The real API limit (600 uncached requests a minute per IP) in README, CLAUDE.md, client.ts comment and living research notes"
affects: [README.md, .claude/CLAUDE.md, src/lib/howmany/client.ts, .planning/research]
key-files:
  modified:
    - src/lib/howmany/client.ts
    - README.md
    - .claude/CLAUDE.md
    - .planning/research/ARCHITECTURE.md
    - .planning/research/PITFALLS.md
    - .planning/research/STACK.md
    - .planning/research/SUMMARY.md
decisions:
  - "Historical record (docs/refs/issues.json, .planning/milestones, .planning/quick) left unchanged (RESEARCH A2)"
metrics:
  tasks: 2
  files: 7
status: complete
requirements: [DOC-01]
actuals:
  tokens: 2500
  tasks: 2
  commits: 2
plan_head_before: 2adfc26fe9b5360097917314d58ef87d85fcc891
plan_head_after: 7b0284e021f16db487c8e9f8b304c0cd1f9b5d78
completed: 2026-11-06
---

# Phase 6 Plan 02: Rate limit docs Summary

Every live doc, comment and research note now says the How many API allows 600 uncached requests a minute per IP (cache hits do not count); no behaviour changed.

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Tracer: client comment, README, CLAUDE.md | c7911ea | src/lib/howmany/client.ts, README.md, .claude/CLAUDE.md |
| 2 | Research notes and repo-wide phrase gate | 7b0284e | .planning/research/{ARCHITECTURE,PITFALLS,STACK,SUMMARY}.md |

## Verification

- `npm run lint` and `npm run typecheck`: pass (client.ts diff is two comment lines only: one reworded, the duplicate removed).
- Phrase gate over the repo (excluding milestones, quick, Phase 6 files, issues.json): no hit of the old figure.
- Phrase counts: ARCHITECTURE 4, PITFALLS 3, STACK 1, SUMMARY 1, README 1, CLAUDE.md 1, client.ts 1; client.ts has exactly one "A code that cannot exist" comment.
- docs/refs/issues.json, .planning/milestones and .planning/quick untouched.

## Deviations from Plan

None - plan executed as written. Note: the Phase 6 plan files were not in the worktree base (untracked on the main checkout), so they were read from the main checkout; only this SUMMARY was created in the worktree's phase directory.

## Known Stubs

None.

## Self-Check: PASSED
