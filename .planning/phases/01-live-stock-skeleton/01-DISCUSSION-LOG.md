# Phase 1: Live Stock Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-26
**Phase:** 01-live-stock-skeleton
**Areas discussed:** Store & API URL setup, Skeleton page & webhook edges

---

## Store & API URL setup

| Question | Options | Selected |
|----------|---------|----------|
| Store slug | blacktail / blacktail-archive / Not decided yet | blacktail, corrected by the owner to blacktail-archive |
| HOWMANY_API_URL form | Full store URL (panel value) + slug cross-check / API base only | Full store URL |
| How to prove before store is live | Mock API then human-verify / Store is ready now | Store is ready now |
| Who sets up Cloudflare | Claude runs wrangler, owner does secrets / Owner does all of it | Owner does all of it |
| Live API still 404 | Human step first in the plan / Owner fixes before execution / Slug is different | Human step first in the plan |

**Notes:** `blacktail` returned 404. The owner then said the store was set up as `blacktail-archive`. That slug returns 200 with 0 items, so the slug is `blacktail-archive`, and the human checkpoint now only covers marking items "Show in store".

---

## Skeleton page & webhook edges

| Question | Options | Selected |
|----------|---------|----------|
| List fields | Brand, title, price + thumb / Brand, title, price only / Everything | Brand, title, price + thumb |
| As-of stamp | Hidden data attribute / Visible text / None | Hidden data attribute |
| Valid signature, other store or event | 204 ignored / 401 | 204 ignored |
| Empty / API down | Plain COPY message + minimal error.tsx / Bare default | Plain COPY message |

---

## Claude's Discretion

Skipped areas follow the 01-RESEARCH.md recommendations: deploy URL (workers.dev and the custom domain), PR order (A then B), resource names, `{ expire: 0 }`, stale-while-revalidate fallback, idle DO queue.

## Deferred Ideas

None
