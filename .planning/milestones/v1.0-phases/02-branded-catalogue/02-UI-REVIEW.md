# Phase 02 - UI Review

**Audited:** 2026-10-27
**Baseline:** 02-UI-SPEC.md (approved)
**Screenshots:** not captured (no dev server on 3000, 5173 or 8080). Code-only audit; nothing visual (focal point, 60/30/10 as rendered, 320px overflow) was seen.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code-derived.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | All strings routed through COPY; no generic labels found, but not checked rendered |
| 2. Visuals | 3/4 | Card, footer, slider match the contract in code; focal point and 320px fit unverified |
| 3. Color | 3/4 | No hardcoded hex; tokens only. Accent spread not measurable without render |
| 4. Typography | 3/4 | Sizes via 4 tokens, no font-weight utilities; text-label also carries Olive and normal-case overrides ad hoc |
| 5. Spacing | 2/4 | Several 12px values (gap-3, px-3, py-3) are off the declared scale |
| 6. Experience Design | 3/4 | Loading, pending, empty, error, status all present; hover-open dropdown and drawer discard unverified |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **Off-scale 12px spacing** - drift from the approved scale (4/8/16/24/32/48/64) - replace `gap-3` (MobileMenu.tsx:79-81, Sheet.tsx:35), `py-3` (Sheet.tsx:41), `px-3` (FilterChips.tsx:63, SortSelect.tsx:33) with `gap-2`/`gap-4`, `py-2`/`py-4`, `px-2`/`px-4`.
2. **No rendered verification exists** - the contract's backstop items (long brand at 320px, long chip, banner as focal point, 60/30/10) were never seen - run `npm run dev` and capture 320/375/768/1024/1280, then re-run this review.
3. **Inline arbitrary values** - `w-[28rem]` (NavDropdown.tsx:80) and `inset-x-[22px]` (RangeSlider.tsx:49) are not declared layout constants; 28rem is 448px (spec says min-width 224px, 2 columns) and 22px is not a multiple of 4. Document or tokenise them.

Further minor items:
4. Footer grid uses `sm:grid-cols-2` (640px); spec wants Explore beside Find us from 480px.
5. `scroll-mt-24` (page.tsx:66) is 96px, which is not a declared header height (64/80); the toolbar can sit under the sticky header by 16px on desktop or be over-offset.
6. `text-label normal-case tracking-normal text-olive` is repeated (ItemCard.tsx, Footer.tsx) instead of one utility; drift risk.

Cited from 02-REVIEW.md rather than repeated: code-level defects there are out of scope here.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- Copy is centralised in `src/lib/copy.ts` and `src/shop/`; ItemCard, Footer, SortSelect, Loading use `COPY.*`. No "Submit", "Click Here", or "OK" literals found in components.
- Em-dash grep over components, app, shop, copy.ts found none (matches the no-em-dash rule).
- Footer: "Email:" is concatenated in JSX (`{COPY.footer.email}: <a>`), putting punctuation in the layout rather than copy. Minor. The newsletter button is icon-only with `aria-label`, so the visible "Subscribe to newsletter" label from the contract is not shown (acceptable for the mock, but a deviation from the table).
- Empty-state and error copy not re-verified against rendered output.

### Pillar 2: Visuals (3/4)
- ItemCard matches the contract: 4:5 frame, Sand 40% fill, NEW badge top-left at 8px, heart in 32px Forest/40 circle `aria-hidden`, eager loading only for the first cards, alt = brand + title.
- Footer newsletter is a plain div with disabled controls linked by `aria-describedby`, as specified. Social icons and external-link `sr-only` text present.
- Loading skeleton reuses `CatalogueBanner` and grid classes (no jump). Card text skeleton bars use h-3, close to Label height.
- Unverified: banner title as primary focal point, header height at 64/80px, Shop/Brands dropdown look, overflow at 320px.

### Pillar 3: Color (3/4)
- Zero hardcoded hex or `rgb()` in components or app. Tokens `forest`, `olive`, `stone`, `sand`, `ivory` used throughout.
- Forest classes (`bg/text/border-forest`) appear 15 times in components and app, `border/text-stone` 15 times. Stone is used for hairlines (Sheet.tsx borders, sort select border); no `text-stone` found, which respects the "never for text" rule.
- Chips use `bg-sand/40 text-forest`, not accent, per contract. Overlay/backdrop opacity and banner gradient not checked.
- Cannot confirm the 60/30/10 split visually.

### Pillar 4: Typography (3/4)
- Only `text-base` appears among stock size utilities (11 uses); the other sizes come from `text-label`, `text-heading`, `text-display` tokens in `globals.css` (12/24/40px with line-heights and 0.16em tracking). This honours the four-size contract.
- No `font-bold/medium/semibold` utilities; weight comes from `font-heading` (Bodoni 700) vs Montserrat 400. Good.
- Concern: the card colour/size line and the footer note override label tracking and case inline (`normal-case tracking-normal`), which is correct per spec but copy-pasted; the 0.16em tracking is not applied where the sentence-case role needs 0.
- Card title is `text-base font-heading` as specified.

### Pillar 5: Spacing (2/4)
- Dominant classes `px-4` (16), `gap-2` (13), `px-6` (8), `mt-4` (6), `gap-4` (6), all on scale.
- Off-scale 12px: `gap-3` x4 (MobileMenu.tsx:79-81, Sheet.tsx:35), `py-3` (Sheet.tsx:41), `px-3` x2 (FilterChips.tsx:63, SortSelect.tsx:33).
- Arbitrary values: `w-[min(calc(100vw-48px),24rem)]` (FilterDrawer.tsx:30) matches the declared drawer width; `inset-x-[22px]` and `w-[28rem]` do not match a declared constant.
- `scroll-mt-24` (96px) vs sticky header 64/80px.
- Footer top margin `mt-16` (64) and padding `py-12` (48) match the scale.

### Pillar 6: Experience Design (3/4)
- Loading: `loading.tsx` with 8 skeleton cards and `motion-safe:animate-pulse`; `CatalogueShell` uses `useTransition` with `aria-busy` and `opacity-60`, as specified.
- Result count has `role="status"` and `aria-live="polite"` (page.tsx:69-70).
- Global `:focus-visible` is a 2px Forest outline, 4px offset; range thumbs get an inset ring. Reduced-motion media query kills transitions and animation globally. Dialog scroll lock is CSS-only.
- 18 uses of `min-h-11`/`size-11` for 44px targets. Dropdown rows use `min-h-11 lg:min-h-8`, as specified.
- Not verified: hover-open with 150ms delay on NavDropdown, drawer discard-on-close, return of focus to the toggle on Esc, focus to result count after Apply.
- Only the heart badge and header icons are decorative, `aria-hidden`; good.

---

## Registry Safety
Registry audit: skipped (shadcn not initialised, no third-party registries).

---

## Files Audited
src/app/{error,layout}.tsx, src/app/shop/{page,loading}.tsx, src/components/catalogue/*.tsx, src/components/layout/*.tsx, src/components/ui/*.tsx, src/shop/theme.css, src/styles/globals.css (partial read: ItemCard, Footer, RangeSlider, globals.css, loading; others via grep)
