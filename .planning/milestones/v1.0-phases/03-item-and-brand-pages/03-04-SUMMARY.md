---
phase: 03-item-and-brand-pages
plan: 04
subsystem: ci
tags: [ci, workerd, smoke, pr]
requires: [03-03]
provides:
  - CI worker step "Item and brand pages on the Worker": item page with JSON-LD, unknown item and page 404, brand pages, brand search box, out-of-range page 307, logo served as svg
  - Live smoke after deploy: unknown item 404, /brands 200
key-files:
  modified:
    - .github/workflows/ci.yml
    - .github/workflows/deploy-workers.yml
completed: 2026-11-03
---

# Plan 03-04 Summary

Ran inline by the orchestrator, not by an executor.

- The worker job proves on workerd that item and brand pages render and that unknown items, pages and brands are real 404s. RESEARCH A5 (OpenNext keeps Next's 404) and A6 (/brands next to public/brands) are confirmed by the green run.
- The just-sold 404 right after the webhook is proven by the prove-freshness item-gone check in the runs around that step.
- The phase PR (#14) was opened with the Known limits and Deviations sections and the UAT list as a comment, and merged by the owner. Follow-ups #15 to #17 (audit fixes, sold status) landed in #17.
- UAT was done by the owner and reported verified.
