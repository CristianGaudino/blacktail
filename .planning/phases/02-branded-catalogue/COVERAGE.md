# API Coverage — How many public API (v1) and store webhook, Phase 2

> Full coverage by default. Opt-outs are explicit, reasoned decisions. Source: docs/refs/issues.json issue #2.

| capability | decision | reason |
|---|---|---|
| GET / (store: slug, name, currency) | INTEGRATE | Plan 05: the store currency formats price chips and the price slider read-out; the shop name shown on screen comes from src/shop/config.ts (D-01) |
| GET /items limit | INTEGRATE | Always 24 (CAT-07), set inside getItemsPage |
| GET /items page | INTEGRATE | Numbered pages (Plan 03) |
| GET /items sort (newest, price_asc, price_desc) | INTEGRATE | CAT-05; newest is the default and is left out of the query |
| GET /items q | INTEGRATE | CAT-04; trimmed, collapsed, lowercased, capped |
| GET /items list filters brand, size, colour, era, material, type, condition, department | INTEGRATE | CAT-02, D-20; values are cleaned against /filters before the call |
| GET /items list filter category | OPT-OUT | The panel's "Category" group is the API type param (UI-SPEC, D-12); CAT-02 names no category filter and Blacktail Archive lists clothing only; the URL parser drops it |
| GET /items ranges minPrice/maxPrice, minPitToPitMm/maxPitToPitMm, minLengthMm/maxLengthMm | INTEGRATE | CAT-02, CAT-03, D-16; snapped and clamped to the /filters bounds, hidden when the range is null |
| GET /items/{code} | OPT-OUT | not needed yet: Phase 3 item page (ITEM-01 to ITEM-06); cards link to /items/[code] now (D-23) |
| GET /filters lists and ranges | INTEGRATE | Header dropdowns (D-12), URL cleaning (CAT-06), filter panel (CAT-02, CAT-03) |
| GET /filters counts | OPT-OUT | D-17: counts cover all items and do not narrow as filters are picked; narrowing counts are ENG-03 (v2) |
| Error responses (400, 404, 429 with Retry-After, 500) | INTEGRATE | Every non-2xx throws and is never cached (DATA-03, Phase 1); a 400 is prevented by cleaning params against /filters |
| Webhook store.updated (X-Howmany-Timestamp, X-Howmany-Signature) | INTEGRATE | Unchanged from Phase 1; revalidates the one store tag that /filters and every /items page share |
