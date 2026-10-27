---
phase: 02-branded-catalogue
review: 02-REVIEW.md
recorded: 2026-10-27
open: 8
---

# Phase 02 code review: disposition

What happened to each finding in `02-REVIEW.md`. Every row starts `open`; change it when a finding is fixed, deferred or accepted.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| CR-01 | critical | `cn()` drops `text-label` when a text colour follows, so buttons lose the label style | fixed (7fe79d6) |
| CR-02 | critical | Free-text `q` and filter combinations mint unbounded cache keys and API calls against the shared rate limit | partly fixed (7fe79d6): code caps; Cloudflare rate-limit rule is the owner's to create (README Operations) |
| WR-01 | warning | Header and mobile `<nav>` landmarks have no `aria-label` | fixed (e030bf0) |
| WR-02 | warning | `NavDropdown` hover-then-click closes the menu it just opened | fixed (e030bf0), needs browser check |
| WR-03 | warning | Placeholder email, Vinted and eBay URLs in `src/shop/config.ts` ship on merge | open: owner decision before merge |
| IN-01 | info | Card image alt repeats the link text | open |
| IN-02 | info | Stone borders and slider track are about 2.1:1 on Ivory, below 3:1 for controls | fixed (6e00acd) |
| IN-03 | info | mm-to-cm `/ 10` repeated in three places | open |
| IN-04 | info | Plain-object lookups accept inherited keys (`labels.ts`, `ColourSwatches`) | open |
| IN-05 | info | Hand-opened filter group collapses when its last selection is removed | open |
| IN-06 | info | Duplicated sort comparator, `LABEL_MAPS` imported across the server/client boundary, verbose `clearFilters` literal | partly fixed (7fe79d6): sort and LABEL_MAPS; clearFilters literal left |
| IN-07 | info | Phone filtering needs JavaScript, despite comments | open |
| IN-08 | info | `Header` swallows `/filters` errors without logging | fixed (e030bf0) |
