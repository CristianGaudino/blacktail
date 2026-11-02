---
quick_id: 261102-vvy
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - src/components/catalogue/FilterGroup.tsx
  - src/components/catalogue/ItemCard.tsx
  - src/components/catalogue/ItemGrid.test.ts
  - src/components/ui/buttons.tsx
  - src/components/ui/Sheet.tsx
  - src/lib/money.ts
  - src/lib/money.test.ts
  - src/components/catalogue/FilterChips.tsx
  - src/components/catalogue/FilterPanel.tsx
  - src/components/layout/HeaderSearch.tsx
---

<objective>
Fix the six ponytail audit findings on branch gsd/ponytail-audit-fixes (already created from origin/main; stay on it). Small, reversible edits. Then push and open a PR into main.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Behaviour and accessibility fixes</name>
  <files>src/components/catalogue/FilterGroup.tsx, src/components/catalogue/ItemCard.tsx, src/components/catalogue/ItemGrid.test.ts, src/components/layout/HeaderSearch.tsx</files>
  <action>
1. FilterGroup.tsx: a group that has been open stays open. Add `useState` from react: `const [wasOpen, setWasOpen] = useState(open); if (open && !wasOpen) setWasOpen(true);` and render `<details open={open || wasOpen}>`. Set-state-during-render for a derived flag is the same pattern FilterPanel already uses. FilterGroup is only imported by client components; if the build complains about hooks in a server component add 'use client' at the top. `ShowMore` and `FacetList` are unchanged.
2. ItemCard.tsx: the Image gets `alt=""` (brand and title are printed next to it inside the same link). Update ItemGrid.test.ts: the two alt assertions ('alt="Wool coat"', 'alt="Acme Wool coat"') become assertions that the image alt is empty (`alt=""`) while the brand and title text still render.
3. HeaderSearch.tsx: add `maxLength={CATALOGUE.maxQueryChars}` to the search input (import CATALOGUE from '@/lib/config').
  </action>
  <verify>
    <automated>npm test && npm run lint && npm run typecheck</automated>
  </verify>
  <done>Tests, lint and typecheck pass; commit as `fix(quick-261102-vvy): keep opened filter groups open, empty card image alt, cap the search box`.</done>
</task>

<task type="auto">
  <name>Task 2: Lean-ups</name>
  <files>src/components/ui/buttons.tsx, src/components/ui/Sheet.tsx, src/lib/money.ts, src/lib/money.test.ts, src/components/catalogue/FilterChips.tsx, src/components/catalogue/FilterPanel.tsx</files>
  <action>
1. Grep the whole tree first (src, scripts, tests): nothing may pass `newTab` to ButtonLink or `footer=` to Sheet. Then delete `newTab` from ButtonLinkProps and the `newTab ? <a target=_blank ...> : <Link>` branch in buttons.tsx (keep only the Link), and delete the `footer` prop, its type and the `<footer>` element in Sheet.tsx.
2. money.ts: add `/** Millimetres from the API as a centimetre string: 305 -> "30.5", 300 -> "30" */ export const cm = (mm: number): string => String(mm / 10);`. Add a small test in money.test.ts (300 -> '30', 305 -> '30.5'). Replace the three `String(x / 10)` uses: two in FilterChips.tsx rangeText (pitToPit, length; each has two calls, from and to) and the `String(n / 10)` in FilterPanel.tsx's RangeSlider `format`.
3. FilterPanel.tsx doc comment (above the component): say the form works without JavaScript for the desktop sidebar only; the phone drawer needs JavaScript to open.
  </action>
  <verify>
    <automated>npm test && npm run lint && npm run typecheck</automated>
  </verify>
  <done>Tests, lint and typecheck pass; grep finds no `newTab`, no `footer=` on Sheet and no `/ 10` outside money.ts; commit as `refactor(quick-261102-vvy): drop unused ButtonLink newTab and Sheet footer, one cm() helper`.</done>
</task>

</tasks>

<constraints>
- Do not touch src/lib/labels.ts, src/components/catalogue/ColourSwatches.tsx, package.json, package-lock.json (open PR #10 changes them), src/shop/config.ts or .planning/config.json. Stage files by name.
- Do not install packages. Do not merge.
- After both tasks: `git push -u origin gsd/ponytail-audit-fixes` and `gh pr create --base main --head gsd/ponytail-audit-fixes --title "Ponytail audit fixes"` with a body listing the six fixes and a test plan, ending with the line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
</constraints>
