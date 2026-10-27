---
phase: 02-branded-catalogue
review: 02-REVIEW.md
recorded: 2026-10-27
open: 13
---

# Phase 02 code review: disposition

What happened to each finding in `02-REVIEW.md`. Every row starts `open`; change it when a finding is fixed, deferred or accepted.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| CR-01 | critical | `cn()` drops `text-label` when a text colour follows, so buttons lose the label style | open |
| CR-02 | critical | Free-text `q` and filter combinations mint unbounded cache keys and API calls against the shared rate limit | open |
| WR-01 | warning | Header and mobile `<nav>` landmarks have no `aria-label` | open |
| WR-02 | warning | `NavDropdown` hover-then-click closes the menu it just opened | open |
| WR-03 | warning | Placeholder email, Vinted and eBay URLs in `src/shop/config.ts` ship on merge | open |
| IN-01 | info | Card image alt repeats the link text | open |
| IN-02 | info | Stone borders and slider track are about 2.1:1 on Ivory, below 3:1 for controls | open |
| IN-03 | info | mm-to-cm `/ 10` repeated in three places | open |
| IN-04 | info | Plain-object lookups accept inherited keys (`labels.ts`, `ColourSwatches`) | open |
| IN-05 | info | Hand-opened filter group collapses when its last selection is removed | open |
| IN-06 | info | Duplicated sort comparator, `LABEL_MAPS` imported across the server/client boundary, verbose `clearFilters` literal | open |
| IN-07 | info | Phone filtering needs JavaScript, despite comments | open |
| IN-08 | info | `Header` swallows `/filters` errors without logging | open |
