# Phase 2: Branded Catalogue - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-26
**Phase:** 02-branded-catalogue
**Areas discussed:** Per-shop folder, Routes and unbuilt pages, Filter panel behaviour, Item card details

---

## Per-shop folder

| Question | Options | Selected |
|----------|---------|----------|
| How a deploy picks its shop | Folder per shop by slug / One swapped folder | Neither at first. The owner does not want multiple shops. Clarified: one `src/shop/` folder, chosen |
| Palette and fonts | Shop theme.css with @theme / Generic token names | Shop theme.css with @theme |
| Guard test | Values from shop config / Fixed word list | Values from shop config |
| Footer contents | Contact + Vinted/eBay only / Also socials | Free text: "I want everything, it doesn't have to be working" (newsletter box and socials as mock) |
| Social URLs | No links / I'll give URLs | Instagram `https://www.instagram.com/blacktailarchive`, others as icons without links |
| Vinted/eBay/contact | Placeholders / I'll give them | Placeholders. Note: IE/EU shop, never `.co.uk` |
| Mock scope | Visible parts only / Mock pages too | Visible parts only |

## Routes and unbuilt pages

| Question | Options | Selected |
|----------|---------|----------|
| All Items URL | /shop / /items | /shop |
| What / shows | Redirect to /shop / Same catalogue | Redirect to /shop |
| Nav links to unbuilt pages | Link to real routes / Not clickable / Hide | Link to real routes |
| Dropdown chevrons | Plain links / Shop dropdown of types | Shop dropdown of types |
| Brands dropdown | Yes, in-stock brands / Plain link | Yes, in-stock brands |
| Header search | Opens a field / Links to /shop | Opens a field |

## Filter panel behaviour

| Question | Options | Selected |
|----------|---------|----------|
| Apply mode (desktop) | Instantly / Apply button | Instantly |
| Colour | Swatches / Checkbox names | Swatches |
| Price | Two-handle slider / Min-max fields | Two-handle slider |
| Counts | Hide / Show | Hide |
| Long lists | First 8 + Show more / Scroll box / Show all | First 8 + Show more |
| Code labels | COPY map + fallback / Capitalise only | COPY map + fallback |
| Material filter | Leave out / Include | Include |

## Item card details

| Question | Options | Selected |
|----------|---------|----------|
| New badge | 7 days / 14 days / Newest N | 7 days |
| Price format | €120, cents when needed / Always 2 decimals | €120, cents when needed |
| Card link | /items/[code] now / Not clickable | /items/[code] now |
| Card extras | Heart decorative + colour/size / No heart | Heart decorative + colour/size |

## Claude's Discretion

- The All Items banner image slot and placeholder, the mobile menu and drawer details, the sort control, empty and error states, and chip styling, all following the mockups.

## Deferred Ideas

- Real marketplace, contact and social URLs (config only), Brands dropdown repointed to `/brands/[slug]` in Phase 3, narrowing facet counts (ENG-03).
