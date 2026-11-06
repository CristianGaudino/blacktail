# API Coverage — How many public API (v1) and store webhook

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

| capability | decision | reason |
|---|---|---|
| GET / (store: slug, name, currency) | INTEGRATE | |
| GET /items (limit) | INTEGRATE | |
| GET /items paging (page) | OPT-OUT | not needed yet: Phase 2 CAT-07 numbered pages; Phase 1 reads one page of up to 100 |
| GET /items sort (newest, price_asc, price_desc) | OPT-OUT | not needed yet: Phase 2 CAT-05; Phase 1 uses the API default (newest) |
| GET /items search (q) | OPT-OUT | not needed yet: Phase 2 CAT-04 |
| GET /items list filters (brand, size, colour, era, material, category, type, condition, department) | OPT-OUT | not needed yet: Phase 2 CAT-02 |
| GET /items range filters (minPrice/maxPrice, pit-to-pit, length) | OPT-OUT | not needed yet: Phase 2 CAT-02 and CAT-03 |
| GET /items/{code} | OPT-OUT | not needed yet: Phase 3 item page (ITEM-01 to ITEM-06) |
| GET /filters | OPT-OUT | not needed yet: Phase 2 filter UI (CAT-02, CAT-03) |
| Error responses (400, 404, 429 with Retry-After, 500) | INTEGRATE | |
| Webhook store.updated (X-Howmany-Timestamp, X-Howmany-Signature) | INTEGRATE | |
