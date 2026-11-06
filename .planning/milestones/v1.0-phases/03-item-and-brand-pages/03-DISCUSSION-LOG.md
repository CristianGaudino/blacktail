# Phase 3: Item and Brand Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-11-02
**Phase:** 3-Item and Brand Pages
**Areas discussed:** Gallery behaviour, Item page layout and info, Gone-item 404 page, Brands pages and logo matching

---

## Gallery behaviour

| Question | Options | Selected |
|----------|---------|----------|
| Desktop layout | Big photo + thumbnail strip / Stacked photos / Grid | Big photo + thumbnail strip |
| Phone behaviour | Swipe carousel with dots / Photo + thumbnail row / Stacked | Swipe carousel with dots |
| Zoom | Lightbox on click / No zoom / Hover zoom | Lightbox on click |
| Loading | Cover priority, rest lazy / You decide | Cover priority, rest lazy |

---

## Item page layout and info

| Question | Options | Selected |
|----------|---------|----------|
| Details | Label/value list / Chips | Label/value list |
| Measurements | cm only / cm and inches | cm and inches |
| Where to buy | Line + profile buttons / Plain text links | Line + profile buttons |
| More from this brand | 4 newest excluding this item / 8 scrolling row / You decide | 4 newest excluding this item |

---

## Gone-item 404 page

| Question | Options | Selected |
|----------|---------|----------|
| Page content | Message + 8 drops / Message + 4 drops / Same brand first | Free text: the item page should still show, clearly marked sold with a message |
| Scope | Item-only plus generic not-found / One page for everything | Item-only plus generic not-found |
| Follow-up (API drops sold items) | Sold message + newest drops / Keep a sold copy of the item / Ask How many for sold items | Ask How many for sold items |

**Notes:** The owner wanted the item shown as sold. The API returns 404 for sold items, so for now the page shows a sold message and the newest drops. Sold item pages are deferred until How many exposes them.

---

## Brands pages and logo matching

| Question | Options | Selected |
|----------|---------|----------|
| Brands page | Logo grid A to Z with text fallback / Ordered by item count | Logo grid with text fallback |
| Brand page | Reuse /shop with brand locked / Simple grid | Reuse /shop with brand locked |
| Slug rule | Slug the API name, match file / Alias map | Slug the API name, match file |
| Header dropdown | Link to /brands/[slug] / Keep /shop?brand= | Link to /brands/[slug] |

---

## Claude's Discretion

Visual treatment, copy wording, unknown brand slug handling, and how the brand-locked catalogue shares code with `/shop`.

## Deferred Ideas

- Sold item pages (needs a How many API addition)
- Brand alias map
