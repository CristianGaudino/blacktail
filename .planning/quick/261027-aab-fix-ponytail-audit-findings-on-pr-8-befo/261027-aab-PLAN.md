---
phase: quick-261027-aab
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
  - src/lib/utils.ts
  - src/lib/utils.test.ts
  - src/lib/config.ts
  - src/lib/params.ts
  - src/lib/params.test.ts
  - src/lib/howmany/client.ts
  - src/lib/labels.ts
  - src/lib/routes.ts
  - src/lib/copy.ts
  - src/components/catalogue/FilterChips.tsx
  - src/components/catalogue/FilterPanel.tsx
  - src/components/catalogue/ItemCard.tsx
  - src/components/catalogue/ItemGrid.test.ts
  - src/components/catalogue/SortSelect.tsx
  - src/components/catalogue/FilterDrawer.tsx
  - src/components/catalogue/RangeSlider.tsx
  - src/components/catalogue/ColourSwatches.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/NavLink.tsx
  - src/components/layout/MobileMenu.tsx
  - src/components/layout/Footer.tsx
  - src/components/layout/NavDropdown.tsx
  - src/components/ui/Sheet.tsx
  - src/app/shop/page.tsx
autonomous: true
requirements: [CR-01, CR-02, WR-01, WR-02, IN-02, IN-06, IN-08, AUDIT-UNBUILT-LINKS, UI-SPACING]

must_haves:
  truths:
    - "Every Button renders the 12px label size: cn('text-label', 'text-ivory') keeps both classes"
    - "No rendered link points at a page that does not exist yet (/items/<code>, /brands, /just-dropped, /about, /contact); /shop, All items, type and brand filter links still work"
    - "A search is capped at 40 code points and each filter group keeps at most 10 values, so a URL cannot mint unbounded cache keys"
    - "The owner has written instructions for a Cloudflare rate-limiting rule on /shop requests with a query string"
    - "A mouse user who hovers a nav dropdown open and then clicks its button sees the panel stay open"
    - "Both header nav landmarks have an accessible name"
    - "Control borders and the slider track meet 3:1 against Ivory; spacing uses only the declared 4/8/16/24 scale in the audited spots"
  artifacts:
    - path: src/lib/utils.ts
      provides: "cn() built on extendTailwindMerge with label/heading/display font sizes; isBuilt()"
      contains: "extendTailwindMerge"
    - path: src/lib/routes.ts
      provides: "BUILT_PAGES list with a shortcut: comment naming Phase 3 / Phase 4"
      contains: "BUILT_PAGES"
    - path: src/lib/params.ts
      provides: "exported sortEntries; pickList capped by CATALOGUE.maxSelectedPerGroup"
      contains: "export function sortEntries"
    - path: src/lib/labels.ts
      provides: "LABEL_MAPS (moved from FilterChips)"
      contains: "export const LABEL_MAPS"
    - path: README.md
      provides: "Operations section with the Cloudflare rate-limiting rule"
      contains: "## Operations"
  key_links:
    - from: src/lib/howmany/client.ts
      to: src/lib/params.ts
      via: "import { sortEntries } from '@/lib/params'"
      pattern: "sortEntries"
    - from: src/components/catalogue/FilterPanel.tsx
      to: src/lib/labels.ts
      via: "LABEL_MAPS imported from '@/lib/labels'"
      pattern: "LABEL_MAPS.*@/lib/labels|@/lib/labels"
    - from: "src/components/{catalogue/ItemCard,layout/NavLink,layout/MobileMenu,layout/Footer,layout/Header}.tsx"
      to: src/lib/utils.ts
      via: "isBuilt(href) gates every link to a page"
      pattern: "isBuilt\\("
---

<objective>
Fix the audit findings on PR #8 (branch `gsd/phase-02-branded-catalogue`) before the owner merges: the `cn()` font-size bug, unbounded cache keys, links to pages that do not exist yet, the hover-then-click dropdown bug, unnamed nav landmarks, low-contrast control borders, a server/client coupling (`LABEL_MAPS`), a duplicated sort comparator, a silent Header catch, and off-scale spacing.

Purpose: deploy runs on every merge to `main`, so these ship to shoppers the moment the owner merges.
Output: small edits across `src/lib`, `src/components`, `src/app/shop/page.tsx`, tests for each behaviour change, and a README Operations note for the owner.

Audit item 4 (placeholder owner contact, WR-03) is deliberately excluded. Do NOT touch the PENDING-OWNER values in `src/shop/config.ts`.

Checked against the code during planning (deviations from the task description):
- The FacetList checkbox border is already Forest, not Stone, so item 7 touches the select, the Filter button, the noscript Sort button, the swatch rim and the slider track only.
- `/` is reachable today (next.config.ts redirects it to /shop), so the logo and "Go home" links stay.
- No CI workflow or script asserts any of the unbuilt hrefs; only `ItemGrid.test.ts` does.
- The Sheet `footer` slot has no caller today; its spacing is fixed anyway as the audit asked.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@.planning/STATE.md
@.planning/phases/02-branded-catalogue/02-REVIEW.md
@.planning/phases/02-branded-catalogue/02-UI-REVIEW.md

Conventions: 4-space indent, single quotes, one-line why-comments, every per-shop value only in `src/shop/` (guard test `src/lib/shop-guard.test.ts` fails on a hex or shop string elsewhere), no em dashes in COPY (`src/lib/copy.test.ts`).

Git: stay on the current branch `gsd/phase-02-branded-catalogue` (do not create another). One commit per task, staging only the files the task lists. `.planning/config.json` and `.planning/state.json` have unrelated local changes: never stage or edit them. Push the branch so PR #8 updates. Never merge.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Shared lib fixes: cn keeps custom sizes, capped cache keys, one sort, LABEL_MAPS in lib, rate-limit note</name>
  <files>src/lib/utils.ts, src/lib/utils.test.ts, src/lib/config.ts, src/lib/params.ts, src/lib/params.test.ts, src/lib/howmany/client.ts, src/lib/labels.ts, src/components/catalogue/FilterChips.tsx, src/components/catalogue/FilterPanel.tsx, README.md</files>
  <read_first>src/lib/utils.ts, src/lib/params.ts, src/lib/howmany/client.ts, src/lib/config.ts, src/lib/labels.ts, src/styles/globals.css, src/lib/params.test.ts, src/lib/utils.test.ts, wrangler.jsonc</read_first>
  <behavior>
    - cn('text-label', 'text-ivory') returns 'text-label text-ivory' (both kept)
    - cn('inline-flex text-label uppercase bg-forest text-ivory') still contains text-label (the audit's exact repro)
    - cn('text-label', 'text-heading') returns 'text-heading' (font sizes still merge with each other)
    - Parsing brand=[12 valid brands in reverse order] keeps exactly CATALOGUE.maxSelectedPerGroup (10) values, the first 10 in /filters order
    - Existing params and client tests stay green unchanged (proves the shared sort did not change behaviour, including client.test.ts expecting brand=A&brand=B&limit=24&type=knit)
    - The existing q-cap test passes with the new maxQueryChars of 40
  </behavior>
  <action>
CR-01 (cn drops text-label). In src/lib/utils.ts swap the plain twMerge import for extendTailwindMerge from tailwind-merge (installed 3.7.0; during planning the extended merger was run against the installed package and kept text-label next to text-ivory). Create one module-level merger that extends classGroups 'font-size' with a single entry whose text values are 'label', 'heading' and 'display': the three custom sizes declared in the @theme block of src/styles/globals.css. One-line why-comment: without it tailwind-merge reads an unknown text size as a colour and drops it. The cn body and signature stay the same. Add the three cn cases from behavior to src/lib/utils.test.ts inside the existing describe('cn').

CR-02 (unbounded cache keys), code part. In src/lib/config.ts set CATALOGUE.maxQueryChars to 40 and extend its comment: every distinct search is a cache key and an API call against the shared rate limit. Add CATALOGUE.maxSelectedPerGroup = 10 next to it, commented: values kept per filter group, so combinations cannot mint cache keys without end. In src/lib/params.ts pickList, take only the first maxSelectedPerGroup values after the existing filter (slice), so the kept values are the first N in /filters order and the canonical string stays deterministic; update its doc comment. A shopper who ticks an 11th value sees it dropped after the URL is cleaned; accept that edge. In src/lib/params.test.ts add the cap test from behavior inside describe('parseCatalogueQuery lists'), building a 12-value brand facet with the file's existing facet() helper and parse(raw, filters) override.

IN-06 (duplicated comparator). In src/lib/params.ts export a function sortEntries that takes and returns an array of [string, string] pairs, sorting in place. Move the comparator that currently ends toSearchString into it unchanged (do not rewrite it), with the one-line doc: sorted by key then value, so one selection is one string and one cache key; shared with the API client so the two never disagree. toSearchString then passes its entries through sortEntries. In src/lib/howmany/client.ts import sortEntries from '@/lib/params' and build the query from sortEntries applied to a spread of params, replacing the inline comparator; keep the short comment above it. params.ts must stay client-safe: no server marker package and no env import (today it imports only config, definitions types and routes; add nothing).

IN-06 (LABEL_MAPS in a server component file). Move the LABEL_MAPS const, with its exact type annotation and three entries, from src/components/catalogue/FilterChips.tsx into src/lib/labels.ts, adding an import of COPY from '@/lib/copy' (copy.ts imports nothing, so there is no cycle) and a one-line doc: code-to-label maps for the filter lists that have one; other lists show the API value. FilterChips.tsx imports label and LABEL_MAPS from '@/lib/labels' (it keeps its COPY import, still used). In FilterPanel.tsx remove the import from the FilterChips component file and add LABEL_MAPS to its existing '@/lib/labels' import. No test imports LABEL_MAPS (checked), so no re-export is needed.

CR-02, edge part (docs only; do NOT add a wrangler rate-limit binding). README.md is only a title today. Append a section "## Operations" with a subsection "### Rate limit catalogue queries (Cloudflare dashboard)" in plain English, no em dashes, covering:
- Why: every distinct /shop query string (search text, filter combination) is a cache miss and one How many API call, and the API's 3000 requests per minute are shared by one server IP. The code caps search at 40 characters and 10 values per filter group; the rule caps how fast one visitor can mint new queries.
- Where: the shop's zone in the Cloudflare dashboard, Security, WAF, Rate limiting rules, Create rule.
- Match: URI Path equals /shop and URI Query String is not empty; expression (http.request.uri.path eq "/shop" and http.request.uri.query ne "").
- Counting: characteristic IP; 30 requests per 1 minute; action Block (or Managed Challenge) for the plan's default duration.
- Plan limits: if the plan only offers a 10-second period, use 5 requests per 10 seconds; if it does not offer the query-string field, match the path /shop alone with 10 requests per 10 seconds. Check what the plan offers in the dashboard.
- Coverage: the rule protects the custom domain only; the workers.dev address stays reachable until Phase 4 sets workers_dev to false in wrangler.jsonc.

In the task SUMMARY note that STATE.md's Phase 02 decision "q capped at 80 code points" is now 40.
  </action>
  <verify>
    <automated>npm test -- src/lib/utils.test.ts src/lib/params.test.ts src/lib/howmany/client.test.ts src/components/catalogue/FilterChips.test.ts src/components/catalogue/FilterPanel.test.ts src/lib/labels.test.ts</automated>
    <automated>! grep -n 'localeCompare' src/lib/howmany/client.ts && grep -q 'sortEntries' src/lib/howmany/client.ts && grep -q 'export const LABEL_MAPS' src/lib/labels.ts && ! grep -q 'const LABEL_MAPS' src/components/catalogue/FilterChips.tsx && ! grep -n "from './FilterChips'" src/components/catalogue/FilterPanel.tsx && grep -q '## Operations' README.md && ! grep -n 'server-only' src/lib/params.ts</automated>
    <automated>npm run lint && npm run typecheck</automated>
  </verify>
  <done>cn keeps text-label beside a text colour (test proves it); maxQueryChars is 40 and pickList keeps at most 10 per group (test proves it); one exported sortEntries is used by params.ts and client.ts with all existing tests unchanged and green; LABEL_MAPS lives in src/lib/labels.ts and neither component defines it; README has the Operations rate-limit note; lint and typecheck green. Committed on gsd/phase-02-branded-catalogue.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Nav: no links to unbuilt pages, named landmarks, hover-then-click keeps the dropdown open, Header logs /filters failures</name>
  <files>src/lib/routes.ts, src/lib/utils.ts, src/lib/utils.test.ts, src/lib/copy.ts, src/components/catalogue/ItemCard.tsx, src/components/catalogue/ItemGrid.test.ts, src/components/layout/Header.tsx, src/components/layout/NavLink.tsx, src/components/layout/MobileMenu.tsx, src/components/layout/Footer.tsx, src/components/layout/NavDropdown.tsx</files>
  <read_first>src/lib/routes.ts, src/lib/utils.ts, src/components/catalogue/ItemCard.tsx, src/components/catalogue/ItemGrid.test.ts, src/components/layout/Header.tsx, src/components/layout/NavLink.tsx, src/components/layout/MobileMenu.tsx, src/components/layout/Footer.tsx, src/components/layout/NavDropdown.tsx, src/lib/env.ts, next.config.ts</read_first>
  <behavior>
    - isBuilt('/') and isBuilt('/shop') and isBuilt('/shop?brand=Acme') are true
    - isBuilt(ROUTES.item('BT-1')), isBuilt(ROUTES.brands), isBuilt(ROUTES.justDropped), isBuilt(ROUTES.about), isBuilt(ROUTES.contact) are false
    - An ItemGrid card contains href="/items/BT-0001" exactly when isBuilt(ROUTES.item('BT-0001')) is true (false today), so the test stays valid when Phase 3 flips it
    - Card order is still preserved (asserted by title, since the code is no longer in the markup)
  </behavior>
  <action>
Unbuilt-page links (audit item 2). Only /shop exists (and / redirects to /shop via next.config.ts); item pages and /brands arrive in Phase 3, /just-dropped, /about and /contact in Phase 4, and deploy runs on every merge to main. Smallest reversible gate:
- src/lib/routes.ts: after ROUTES add an exported readonly string array BUILT_PAGES holding ROUTES.home and ROUTES.shop, with the comment "shortcut: pages not built yet are not linked (they would 404 on the live site); add each page here as it ships (Phase 3: item pages as '/items', brands; Phase 4: just dropped, about, contact), then delete BUILT_PAGES and isBuilt". Keep routes.ts import-free (next.config.ts imports it).
- src/lib/utils.ts: export isBuilt(href): drop any query or hash (everything from the first ? or #), then return whether some BUILT_PAGES entry matches via the existing isNavActive(path, page). Reusing isNavActive gives subtree matching, so adding '/items' in Phase 3 also covers /items/<code>, and '/' matches only itself. Import BUILT_PAGES from '@/lib/routes' (routes has no imports: no cycle). Add the isBuilt cases from behavior to src/lib/utils.test.ts in a new describe('isBuilt').
- src/components/catalogue/ItemCard.tsx: compute the item href once; hoist the existing card body (image frame and text block, unchanged) into a local const; render the existing Link (same props and "group block" class) when isBuilt(href), otherwise a div with the same "group block" class. Import isBuilt from '@/lib/utils'.
- src/components/catalogue/ItemGrid.test.ts: change the "links a card to its item" test so it asserts html.includes('href="/items/BT-0001"') equals isBuilt(ROUTES.item('BT-0001')), keeping its alt and no-"null" asserts; change "keeps the order it was given" to give the two items distinct titles as well as codes and compare the titles' indexOf. Import isBuilt and ROUTES.
- src/components/layout/NavLink.tsx: after the existing hook call, return null when the href is not built. This hides Just Dropped, About and Contact in the desktop header.
- src/components/layout/Header.tsx: filter brandLinks through isBuilt so the "All brands" entry is dropped while the brand entries (all /shop?brand=...) stay; typeLinks all point at /shop and need no filter. NavDropdown's href prop only drives the active underline (not a link), so leave it. On a /filters failure the Brands panel is then empty; the page shows the error screen anyway, accept.
- src/components/layout/MobileMenu.tsx: the link() helper returns false when its href is not built (React renders nothing), so the Just Dropped, About and Contact rows disappear; the Shop and Brands accordions stay. Import isBuilt alongside cn.
- src/components/layout/Footer.tsx: filter EXPLORE through isBuilt before mapping, so only Shop is listed for now.

WR-01 (unnamed nav landmarks). In src/lib/copy.ts add nav.label: 'Main' (screen readers announce "Main navigation"; plain ASCII, no dash). Set aria-label={COPY.nav.label} on the nav in Header.tsx and on the nav in MobileMenu.tsx. Same string in both is fine: only one is displayed at a time (the other is display none).

WR-02 (hover-opened dropdown closes on click). In src/components/layout/NavDropdown.tsx add a ref hoverOpened (false) with the why-comment: a panel opened by hover must survive the click that usually follows. The hover timer callback sets hoverOpened.current to true before setOpen(true). onPointerLeave (mouse branch) sets it to false before closing. The button onClick: clear the timer, copy hoverOpened.current into a local, reset the ref to false, then call setOpen with an updater returning the local OR not-previous. Read the ref into a local first, because React may run the updater after the reset. Keyboard and touch never set the ref, so their toggle is unchanged; a second mouse click still closes. No unit test (no jsdom in this project); covered by lint, typecheck and the grep below.

IN-08 (silent Header catch). In Header.tsx change the bare catch to catch the error and call console.warn('Header: /filters failed', error), keeping the existing fallback comment and keeping connection() outside the try. Safe to log: HowManyError's message carries only status and path; storeEnv errors never include values (src/lib/env.ts); Zod 4 issues omit the input by default.
  </action>
  <verify>
    <automated>npm test -- src/lib/utils.test.ts src/components/catalogue/ItemGrid.test.ts src/lib/copy.test.ts src/lib/shop-guard.test.ts</automated>
    <automated>grep -q 'shortcut:' src/lib/routes.ts && grep -q 'BUILT_PAGES' src/lib/routes.ts && test "$(grep -l 'aria-label={COPY.nav.label}' src/components/layout/Header.tsx src/components/layout/MobileMenu.tsx | wc -l)" -eq 2 && grep -q "console.warn('Header: /filters failed'" src/components/layout/Header.tsx && grep -q 'hoverOpened' src/components/layout/NavDropdown.tsx && test "$(grep -l 'isBuilt(' src/components/catalogue/ItemCard.tsx src/components/layout/NavLink.tsx src/components/layout/MobileMenu.tsx src/components/layout/Footer.tsx src/components/layout/Header.tsx | wc -l)" -eq 5</automated>
    <automated>npm run lint && npm run typecheck</automated>
  </verify>
  <done>No component renders a link to /items/..., /brands, /just-dropped, /about or /contact, gated by one BUILT_PAGES list with a shortcut: comment; /shop, All items and type/brand filter links unchanged; both header navs carry aria-label "Main"; a hover-opened dropdown stays open on the following click; the Header logs /filters failures with console.warn; tests, lint and typecheck green. Committed on gsd/phase-02-branded-catalogue.</done>
</task>

<task type="auto">
  <name>Task 3: Contrast for control borders and slider track; off-scale spacing back on the scale</name>
  <files>src/components/catalogue/SortSelect.tsx, src/components/catalogue/FilterDrawer.tsx, src/components/catalogue/RangeSlider.tsx, src/components/catalogue/ColourSwatches.tsx, src/components/layout/MobileMenu.tsx, src/components/ui/Sheet.tsx, src/components/catalogue/FilterChips.tsx, src/app/shop/page.tsx</files>
  <read_first>src/shop/theme.css, src/components/catalogue/SortSelect.tsx, src/components/catalogue/FilterDrawer.tsx, src/components/catalogue/RangeSlider.tsx, src/components/catalogue/ColourSwatches.tsx, src/components/ui/Sheet.tsx, src/app/shop/page.tsx, .planning/phases/02-branded-catalogue/02-UI-SPEC.md (Spacing and Color sections, lines 34-58 and 89-98)</read_first>
  <action>
IN-02 (contrast, audit item 7). Tokens from src/shop/theme.css: Olive #4A5A46 on Ivory #E8E5DD is about 5.9:1 (computed 5.87; UI-SPEC line 98 says the same); Stone #A69D8F on Ivory is about 2.1:1, under the 3:1 WCAG 1.4.11 asks for control boundaries. Use the Olive token class (no hex outside src/shop, the guard test checks) for:
- src/components/catalogue/SortSelect.tsx: the select's border and the noscript Sort button's border (border-olive).
- src/components/catalogue/FilterDrawer.tsx: the phone Filter button's border (border-olive).
- src/components/catalogue/RangeSlider.tsx: the visual track background (bg-olive); keep the Forest fill segment as is.
- src/components/catalogue/ColourSwatches.tsx: the swatch rim (border-olive), since the swatch is the visible boundary of the colour checkbox.
Keep Stone everywhere else: header, sheet, filter-group and toolbar hairlines, the NavDropdown panel border, the Pager hover border. The FacetList checkbox border is already Forest: leave it. This deviates from the UI-SPEC Color table (line 94 lists Stone for input borders and the swatch rim) in favour of WCAG, per the owner's audit item 7; record that in the SUMMARY. Known trade-off to record too: the Forest fill against the Olive track is about 2.0:1; the Forest thumbs (about 11.9:1) and the text read-out still carry the chosen range.

Spacing (UI review, scale 4/8/16/24 from UI-SPEC lines 35-45). Replace each 12px utility the UI review listed with a scale value, leaving every min-h-10, min-h-11 and size-11 tap target untouched:
- src/components/layout/MobileMenu.tsx, the three decorative Account / Wishlist / Bag rows: icon-to-label gap becomes gap-2 (8px, the same as the Filter button and Button icon gaps).
- src/components/ui/Sheet.tsx: the title-row gap becomes gap-4; the footer's vertical padding becomes py-4 (matching its px-4).
- src/components/catalogue/FilterChips.tsx: the chip link's horizontal padding becomes px-4.
- src/components/catalogue/SortSelect.tsx: the noscript Sort button's horizontal padding becomes px-4 (same as the Filter button), and the select's 12px left padding becomes pl-4 (same defect on the same control); keep pr-9 and the chevron's right offset (icon geometry).
- src/app/shop/page.tsx: the results anchor's scroll margin becomes scroll-mt-16 lg:scroll-mt-20, the sticky header's height (64px on phones, 80px from 1024px: UI-SPEC Layout constants, h-16 lg:h-20 in Header.tsx). Pager links target #results.
  </action>
  <verify>
    <automated>! grep -nE '(border|bg)-stone' src/components/catalogue/SortSelect.tsx src/components/catalogue/FilterDrawer.tsx src/components/catalogue/RangeSlider.tsx src/components/catalogue/ColourSwatches.tsx && ! grep -nE '\b(gap|px|py|pl)-3\b' src/components/layout/MobileMenu.tsx src/components/ui/Sheet.tsx src/components/catalogue/FilterChips.tsx src/components/catalogue/SortSelect.tsx && grep -q 'scroll-mt-16 lg:scroll-mt-20' src/app/shop/page.tsx && grep -q 'bg-olive' src/components/catalogue/RangeSlider.tsx</automated>
    <automated>npm test && npm run lint && npm run typecheck</automated>
  </verify>
  <done>Select, Filter button, noscript Sort button, swatch rim and slider track use Olive (about 5.9:1 on Ivory); Stone remains only on decorative dividers; no 12px gap/padding left in the audited spots; the results anchor offset equals the header height; full test suite (including shop-guard and copy guards), lint and typecheck green. Committed on gsd/phase-02-branded-catalogue and pushed so PR #8 updates.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser to Worker (/shop query string) | Untrusted URL params decide which upstream API URL is fetched and cached |
| Worker to How many API | Shared 3000/min rate limit on one server IP |
| Worker to logs | Header error logging |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-aab-01 | Denial of service | src/lib/params.ts parseQ / pickList, src/lib/howmany/client.ts | high | mitigate | maxQueryChars 40 and maxSelectedPerGroup 10 bound the key space in code (Task 1, tested); README documents the per-IP Cloudflare rate-limiting rule on /shop with a query string (owner applies it in the dashboard) |
| T-aab-02 | Information disclosure | src/components/layout/Header.tsx console.warn | low | mitigate | Only the error object is logged; HowManyError carries status and path, storeEnv messages never include values, Zod 4 omits inputs; no headers, body or secret are logged |
| T-aab-03 | Tampering | URL list params | low | accept | Values stay whitelisted against /filters (unchanged); the cap only drops extra valid values |
| T-aab-04 | Denial of service | workers.dev address | medium | accept | The zone rate-limiting rule does not cover workers.dev; Phase 4 turns workers_dev off (documented in README) |
| T-aab-SC | Tampering | npm installs | high | mitigate | No package is installed by this plan; tailwind-merge 3.7.0 is already a dependency |
</threat_model>

<verification>
- npm test && npm run lint && npm run typecheck all green (guard tests src/lib/shop-guard.test.ts and src/lib/copy.test.ts included).
- git diff --quiet a7ae25d HEAD -- src/shop/config.ts .planning/config.json (PENDING-OWNER values and planning config not touched by the commits).
- Manual, end of phase (owner): on desktop, hover Shop until it opens, then click the Shop button: the panel stays open; a second click closes it.
</verification>

<success_criteria>
- All audit items 1-3 and 5-10 plus the UI-review spacing items are fixed; item 4 untouched.
- Every behaviour change has a test (cn sizes, per-group cap, isBuilt, card link gate); the dropdown fix is lint/typecheck/grep verified (no jsdom).
- Three commits on gsd/phase-02-branded-catalogue, pushed; PR #8 updated; nothing merged.
</success_criteria>

<output>
Create `.planning/quick/261027-aab-fix-ponytail-audit-findings-on-pr-8-befo/261027-aab-SUMMARY.md` when done. Include: the README Operations note (so the owner sees the rate-limit rule), the UI-SPEC Stone-to-Olive deviation and the slider fill/track 2.0:1 trade-off, that STATE.md's "q capped at 80" decision is now 40, and the shortcut: in src/lib/routes.ts to remove in Phases 3 and 4.
</output>
