# Phase 2: Branded Catalogue - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 40 (new/modified)
**Analogs found:** 33 / 40 (all analog paths are git-tracked; `C:\Git\vintage\src\...` paths verified with `git ls-files` in that repo)

Blacktail `src/` is small (22 tracked files), so most analogs come from Blacktail itself for logic and API, and from Vintage for UI. Conventions: 4-space indent, single quotes, named exports, colocated `*.test.ts`, `import 'server-only'` on API modules, JSDoc one-liners that explain why.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `src/lib/howmany/client.ts` (modify: `URLSearchParams`, `getFilters`, `getItemsPage`, delete `getItems`) | service | request-response | itself (`client.ts:24-51`) | exact |
| `src/lib/howmany/schemas.ts` (add `filtersSchema`) | model | transform | itself (`schemas.ts`) | exact |
| `src/lib/howmany/client.test.ts` (modify) | test | request-response | itself (lines 1-40) | exact |
| `src/lib/definitions.ts` (add `Filters`, `CatalogueQuery`) | model | - | itself | exact |
| `src/lib/params.ts` | utility | transform | Vintage `src/lib/params.ts` | role-match |
| `src/lib/params.test.ts` | test | transform | `src/lib/webhook.test.ts` / `copy.test.ts` | role-match |
| `src/lib/paging.ts` | utility | transform | Vintage `src/lib/paging.ts` | exact |
| `src/lib/money.ts` | utility | transform | Vintage `src/lib/money.ts` + RESEARCH Money example | role-match |
| `src/lib/labels.ts` | utility | transform | none (RESEARCH "Code labels") | no analog |
| `src/lib/seo.ts` | utility | transform | `src/app/layout.tsx:3-6` | partial |
| `src/lib/utils.ts` (`cn`, `isNavActive`) | utility | transform | Vintage `src/lib/utils.ts` | exact |
| `src/lib/routes.ts` (modify) | config | - | itself | exact |
| `src/lib/config.ts` (modify: `CATALOGUE`, `SORTS`) | config | - | itself (`STORE_API`, `CACHE`) | exact |
| `src/lib/copy.ts` (modify) | config | - | itself | exact |
| `src/lib/copy.test.ts` (extend to shop copy) | test | transform | itself | exact |
| `src/shop/config.ts`, `colours.ts`, `copy.ts` | config | - | `src/lib/config.ts` | role-match |
| `src/shop/theme.css`, `src/styles/globals.css` | config | - | Vintage `src/styles/globals.css` | role-match |
| `src/shop/fonts.ts` | config | - | Vintage `src/components/ui/fonts.ts` | exact |
| `src/shop/shop-guard.test.ts` | test | batch (file scan) | `src/lib/guard.test.ts` | exact |
| `src/hooks/useModalDialog.ts` | hook | event-driven | Vintage `src/hooks/useModalDialog.ts` (copy verbatim) | exact |
| `src/components/ui/Sheet.tsx` (left-slide variant) | component | event-driven | Vintage `src/components/ui/Sheet.tsx` | role-match |
| `src/components/ui/{buttons,Checkbox,Chip,SocialIcons}.tsx` | component | - | Vintage `src/components/ui/buttons.tsx` | role-match |
| `src/components/ui/StatusScreen.tsx` (restyle) | component | - | itself | exact |
| `src/components/catalogue/Pager.tsx` | component | request-response | Vintage `src/components/ui/Pager.tsx` | exact |
| `src/components/catalogue/ItemCard.tsx`, `ItemGrid.tsx` | component | request-response | `src/components/stock/ItemList.tsx` | exact |
| `src/components/catalogue/*.test.ts` | test | request-response | `src/components/stock/ItemList.test.ts` | exact |
| `src/components/catalogue/FilterChips.tsx`, `CatalogueBanner.tsx` | component | request-response | `ItemList.tsx` (server component) | partial |
| `src/components/catalogue/FilterPanel.tsx`, `FilterGroup`, `RangeSlider`, `ColourSwatches`, `SortSelect`, `FilterDrawer`, `CatalogueShell` | component (client) | event-driven | RESEARCH Pattern 4 + Vintage `Sheet.tsx` | no codebase analog |
| `src/components/layout/Header.tsx`, `Footer.tsx`, `NewsletterMock.tsx` | component | request-response | `src/app/page.tsx` (`connection()` + fetch) | partial |
| `src/components/layout/{NavDropdown,HeaderSearch,MobileMenu,NavLink}.tsx` | component (client) | event-driven | Vintage `Sheet.tsx` + `useModalDialog` | partial |
| `src/app/layout.tsx` (modify) | layout | request-response | itself | exact |
| `src/app/page.tsx` -> redirect in `next.config.ts` | config | request-response | `next.config.ts` (existing `headers()`) | role-match |
| `src/app/shop/page.tsx`, `loading.tsx` | route | request-response | `src/app/page.tsx` | exact |
| `src/app/error.tsx` (restyle) | component | - | itself | exact |
| `scripts/mock-howmany.mjs`, `scripts/prove-freshness.mjs`, `ci.yml`, `deploy-workers.yml` | config/script | request-response | themselves | exact |

## Pattern Assignments

### `src/lib/howmany/client.ts` (service, request-response) - modify

**Analog:** itself, `C:/Git/blacktail/src/lib/howmany/client.ts`.

**Keep unchanged** (lines 1-16, 26-33): imports, `storeTag`, `HowManyError`, fetch options. `client.test.ts` asserts `cache: 'force-cache'`, `next: { tags, revalidate: 600 }`, an `AbortSignal`, and no `headers`.

**Change** (line 24-25): widen `params` from `Record<string,string>` to `URLSearchParams`, sorted by key then value:
```ts
async function howmanyFetch<S extends z.ZodType>(path: string, schema: S, params?: URLSearchParams): Promise<{ data: z.output<S>; asOf: string | null }> {
    const query = params ? `?${new URLSearchParams([...params].sort(([a, x], [b, y]) => a.localeCompare(b) || x.localeCompare(y))).toString()}` : '';
```
**Add** (RESEARCH "Readers"): wrap in React `cache()` (an `AbortSignal` opts out of Next fetch memoization), pass the canonical query STRING for identity:
```ts
export const getFilters   = cache(async () => (await howmanyFetch('/filters', filtersSchema)).data);
export const getItemsPage = cache(async (params: string) => { const { data, asOf } = await howmanyFetch('/items', itemsPageSchema, new URLSearchParams(params)); return { page: data, asOf }; });
```
**Delete** `getItems` (lines 39-51) and `STORE_API.listLimit`-based paging with `ItemList`; port its tests to `getItemsPage`. `getStore` (35-37) unchanged.

**Test pattern** (`client.test.ts:1-40`): `vi.stubEnv` for `STORE_SLUG`, `HOWMANY_API_URL`, `HOWMANY_WEBHOOK_SECRET`, `SITE_URL`; `vi.stubGlobal('fetch', fetchMock)`; `reply()` helper builds `new Response(JSON.stringify(body), { status: 200, headers: { date } })`; assert `url` equals `${base}/items?limit=24...` and `init.next` equals `{ tags: ['store:test-shop'], revalidate: 600 }`. Add `/filters` fixtures with every documented key.

---

### `src/lib/howmany/schemas.ts` - add `filtersSchema`

**Analog:** itself, lenient zod (lines 1-8 comment, `z.object`, nullable fields). Use the RESEARCH "Filters schema" block verbatim (facet arrays `{value,count}` default `[]`, ranges `.nullable().default(null)`). Unknown keys stay stripped.

---

### `src/lib/params.ts` (utility, transform)

**Analog:** `C:\Git\vintage\src\lib\params.ts`.

**Helpers to copy** (lines 22-70):
```ts
type RawParams = Record<string, string | string[] | undefined>;
function single(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function oneOf<T extends string>(list: readonly T[], value: string | undefined, fallback: T): T { return list.includes(value as T) ? (value as T) : fallback; }
export function parsePage(params: RawParams, key = SEARCH_PARAMS.page): number {
    const value = Number(single(params[key]));
    return Number.isInteger(value) && value >= 1 ? Math.min(value, MAX_PAGE) : 1;
}
export function withPage(href: string, page: number, key = SEARCH_PARAMS.page): string { /* page 1 omitted */ }
```
Differences for Blacktail: list params arrive as `string | string[]`, are matched case-insensitively against `/filters` and emitted in `/filters` spelling; ranges clamped and snapped (100 cents / 10 mm); `q` trimmed, collapsed, capped; one canonical serialisation via `URLSearchParams.append` (sorted keys and values); any non-page change drops `page`. All constants (`SEARCH_PARAMS`, `CATALOGUE.pageSize=24`, caps) go in `src/lib/config.ts`, no magic numbers. Import `server-only` is NOT used here (the client panel imports it).

**Test analog:** `src/lib/webhook.test.ts` / `copy.test.ts` style: `describe`/`it`/`expect` with plain inputs. Cover junk dropped, case canonicalised, range null hidden, snapping, page reset.

---

### `src/lib/paging.ts` (utility, transform)

**Analog:** `C:\Git\vintage\src\lib\paging.ts` lines 1-17 (`pageCountOf`, `pageInfo` clamp). Use `CATALOGUE.pageSize` in place of `PAGE_SIZE`, add `pageLinks` from RESEARCH "Pager window", and a pure `resolvePage(requested, total)` (Pitfall 5: no HTTP 307 promise).

---

### `src/lib/money.ts` (utility, transform)

**Analog:** Vintage `src/lib/money.ts` (same role). Use RESEARCH "Money" block: digits `cents % 100 === 0 ? 0 : 2` for BOTH min and max (the UI-SPEC options print `€119.5`, Pitfall 4). Locale from `src/shop/config.ts`. Tests: 12000 -> `€120`, 11950 -> `€119.50`, 11905 -> `€119.05`, GBP/USD. Existing `ItemList.test.ts:29-31` asserts non-EUR currency in item's own currency; keep that case.

---

### `src/lib/utils.ts` (utility)

**Analog:** `C:\Git\vintage\src\lib\utils.ts` lines 1-14: copy `cn` (tailwind-merge) and `isNavActive`. `cn` is used only in `components/ui`.

---

### `src/lib/routes.ts`, `src/lib/config.ts`, `src/lib/copy.ts` (config)

**Analog:** themselves. `routes.ts` is `export const ROUTES = { home: '/' } as const;` and "Kept free of other imports". Add `shop`, `item: (code) => ...`, `brands`, `justDropped`, `about`, `contact` the same way (functions allowed). `config.ts` uses grouped `as const` objects with a JSDoc line each (`CACHE`, `STORE_API`); add `CATALOGUE` (`pageSize`, `maxQueryChars`, `maxValuesPerList`, `facetShowFirst: 8`, `pageSteps`) and `SORTS`. `copy.ts` is `COPY = { group: { key: 'text', fn: (x) => ... } } as const`, "No em dashes, no shop names"; add label maps (type, department, condition: A Excellent, AB Very good, B Good) here, shop wording in `src/shop/copy.ts`. `copy.test.ts:7-30` walks nested objects, calling functions with `'2'`; extend `withEmDash` to also run on the shop copy.

---

### `src/shop/fonts.ts` (config)

**Analog:** `C:\Git\vintage\src\components\ui\fonts.ts` lines 1-17. `src` is relative to the calling file, so keep it beside `src/shop/fonts/`:
```ts
import localFont from 'next/font/local';
export const montserrat = localFont({ src: './fonts/Montserrat-Variable.woff2', weight: '400 700', variable: '--font-montserrat' });
export const bodoni     = localFont({ src: './fonts/BodoniModa-700.woff2', weight: '700', variable: '--font-bodoni' });
```
Keep Vintage's comment explaining why fonts are committed (no Google download at build).

### `src/shop/theme.css`, `src/styles/globals.css`

**Analog:** Vintage `src/styles/globals.css` (`@theme inline { --font-primary: var(--font-montserrat) }` at about line 142; layout applies `${montserrat.variable}` on `<html>`, Vintage `src/app/layout.tsx:41`). Use RESEARCH Pattern 1 block: `@import "tailwindcss"; @import "../shop/theme.css";`, tokens `--color-forest/olive/stone/sand/ivory`, `@theme inline` font vars. Hex lives ONLY in `theme.css`.

---

### `src/shop/shop-guard.test.ts` (test, file scan)

**Analog:** `C:/Git/blacktail/src/lib/guard.test.ts`. Reuse structure exactly: `readdirSync(join(root,'src'), { recursive: true, encoding: 'utf8' })` filtered, `FORBIDDEN`/`SAMPLES` map, a "cannot pass vacuously" test, then a hits scan.
```ts
const files = [
    ...readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' })
        .filter(f => /\.tsx?$/.test(f) && !/guard\.test\.ts$/.test(f))
        .map(f => join('src', f)),
];
...
const hits = files.flatMap(file => {
    const text = readFileSync(join(root, file), 'utf8');
    return Object.entries(FORBIDDEN).filter(([, pattern]) => pattern.test(text)).map(([token]) => `${file}: ${token}`);
});
expect(hits).toEqual([]);
```
Differences: needles built from `import { SHOP } from '@/shop/config'` (name, email, URLs, handle, colour hexes, plus hex literals read from `theme.css`); extend the filter to `.css`; exclude paths starting `shop/` (use `sep`-safe test on Windows: `readdirSync` returns backslashes) and the guard file itself; case-insensitive. Test fixtures elsewhere must use neutral values (`Acme`, `test-shop`). NOTE: the existing guard excludes `guard\.test\.ts$` by regex, so the new file name must end `guard.test.ts` to be self-excluded by the existing scan (it quotes forbidden tokens) or be listed explicitly.

---

### `src/hooks/useModalDialog.ts` (hook) and `Sheet.tsx` (left slide)

**Analog:** `C:\Git\vintage\src\hooks\useModalDialog.ts` (copy verbatim, 36 lines): `showModal()` on `open`, returns `{ ref, tabIndex: -1, onCancel, onClick }`; click closes only `e.target === e.currentTarget`.
`C:\Git\vintage\src\components\ui\Sheet.tsx` lines 14-55 for the shell:
```tsx
const dialog  = useModalDialog(open, close);
const titleId = useId();
<dialog {...dialog} aria-labelledby={titleId}
    className="sheet m-0 ... overflow-hidden bg-surface text-fg shadow-2xl outline-none backdrop:bg-overlay open:flex">
    <header className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
        <h2 id={titleId} className="min-w-0 ... [overflow-wrap:anywhere]">{title}</h2>
        <IconButton icon={X} label={COPY.common.close} onClick={close} className="-mr-2" />
    </header>
    <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
    {footer && <footer className="border-t border-line px-5 pt-3 pb-safe">...</footer>}
</dialog>
```
Blacktail changes: add a `side="left"` variant; drop `useDragToDismiss` (bottom-sheet only); keep dialog padding zero (padding on inner wrapper) so backdrop click works; lock scroll with `body:has(dialog[open]) { overflow: hidden }`; use `100dvh`; use the sticky Apply footer for the drawer. Mount drawer `FilterPanel` only while open.

---

### `src/components/catalogue/Pager.tsx` (component, request-response)

**Analog:** `C:\Git\vintage\src\components\ui\Pager.tsx` lines 1-27: `<nav aria-label>` with prev/next `ButtonLink` and `aria-current="page"`, returns `null` when `pageCount <= 1`. Blacktail extends to numbered links via `pageLinks()` and `'gap'` entries; links are `<Link prefetch={false}>`. Test as server markup.

---

### `src/components/catalogue/ItemCard.tsx`, `ItemGrid.tsx` (server components)

**Analog:** `C:/Git/blacktail/src/components/stock/ItemList.tsx` (read it when planning; Phase 1 list being replaced) and its test `ItemList.test.ts`. Keep `data-as-of` on the grid section (CI proof depends on it). Cards link with `<Link href={ROUTES.item(code)} prefetch={false}>`, `next/image` with API `width/height`, `thumbUrl`, `alt={title}`, 4:5 frame; first row `loading="eager" fetchPriority="high"`; New badge via pure `isNew(publishedAt, now, days)`; Colour / Size line omits the missing part; heart `aria-hidden`.

**Test pattern** (`ItemList.test.ts:1-32`):
```ts
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const item: Item = { code: 'BT-0001', title: 'Wool coat', brand: 'Acme', ... photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }], publishedAt: '2026-01-01T00:00:00Z' };
const render = (items: Item[]) => renderToStaticMarkup(createElement(ItemList, { items, asOf: null }));
expect(html).not.toContain('null');           // null brand/size/colour never printed
expect(html).toContain('alt="Wool coat"');
```
Vitest is `environment: 'node'`, `include: ['src/**/*.test.ts']`: only `.ts` tests, no jsdom, so render-test server components only; client components with hooks are tested through their pure helpers.

---

### `src/app/shop/page.tsx` (route, request-response)

**Analog:** `C:/Git/blacktail/src/app/page.tsx` (whole file):
```tsx
export default async function HomePage() {
    // Render on each request, so nothing is fetched at build and the cached fetch is the only snapshot
    await connection();
    const [store, { page, asOf }] = await Promise.all([getStore(), getItems()]);
    return (<main><h1>{store.name}</h1><ItemList items={page.items} asOf={asOf} /></main>);
}
```
Copy: `await connection()` first, `Promise.all`, no try/catch in the page (errors reach `error.tsx` and the CI outage proof). Add `await searchParams` -> `getFilters()` -> `parseCatalogueQuery` -> `getItemsPage(toSearchString(q))`. `generateMetadata` repeats the same cleaning (cached, deduped) and returns `robots` (complete value, replaces the layout's) plus `alternates.canonical` from `storeEnv().SITE_URL` inside the function. A 400 from `getItemsPage` renders the empty state, not the error screen. `src/app/page.tsx` itself goes away; `/` -> `/shop` is a `next.config.ts` `redirects()` entry with `permanent: false`.

### `src/app/layout.tsx` (modify)

**Analog:** itself. Keep `metadata.robots: { index: false, follow: false }` and `LayoutProps<'/'>`. Add `${montserrat.variable} ${bodoni.variable}` on `<html>`, import `../styles/globals.css`, render `<Header/><body>{children}<Footer/>`. `lang` becomes `en-IE` from shop config. The Header must start `await connection()` and wrap `getFilters()` in try/catch (Pitfall 2); footer is static.

### `src/components/ui/StatusScreen.tsx`, `src/app/error.tsx`

**Analog:** themselves. `StatusScreen({ title, message, detail, children })` is already unstyled "until the Phase 2 design system": restyle in place, keep props and the `retry` prop name in `error.tsx`.

---

## Shared Patterns

### Server-only API access
**Source:** `src/lib/howmany/client.ts:1-9`. **Apply to:** every module that reads env or calls the API. `import 'server-only'` at top; all reads through `howmanyFetch`; never `fetch` in a component or page. Vitest config aliases `server-only`.

### Request-time rendering
**Source:** `src/app/page.tsx` (`await connection()`). **Apply to:** `Header`, `/shop` page. Prevents API calls at build (CI asserts `{"store":0,"items":0}` after build).

### Lenient external data
**Source:** `src/lib/howmany/schemas.ts` header comment: unknown keys stripped (privacy whitelist), API codes are plain strings, never enums. **Apply to:** `filtersSchema`, label maps (unknown code falls back to capitalised code).

### All text in COPY, no em dashes
**Source:** `src/lib/copy.ts` + `src/lib/copy.test.ts:7-30`. **Apply to:** all UI strings; shop wording in `src/shop/copy.ts` and included in the em-dash test.

### Native dialog + draft state
**Source:** Vintage `useModalDialog.ts`, `Sheet.tsx`. **Apply to:** mobile menu, filter drawer.

### Tests
**Source:** `ItemList.test.ts` (render), `client.test.ts` (fetch mock), `guard.test.ts` (scan). **Apply to:** all new logic as pure modules, `.test.ts` only.

### Tracked-source note
All Blacktail analogs above are tracked (`git ls-files src` confirmed). Vintage files are tracked in that repo. No `.gsd` or `.open-next` mirror paths are referenced.

## No Analog Found

| File | Role | Data Flow | Reason / Source to use |
|---|---|---|---|
| `src/lib/labels.ts` | utility | transform | Trivial; RESEARCH "Code labels" one-liner |
| `FilterPanel`, `FilterGroup`, `RangeSlider`, `ColourSwatches`, `SortSelect`, `CatalogueShell` | client component | event-driven | No filter UI in either repo; use RESEARCH Pattern 4, "Debounced instant apply", Pitfall 7/8 |
| `NavDropdown`, `HeaderSearch`, `MobileMenu` | client component | event-driven | Only dialog patterns exist; use UI-SPEC plus `useModalDialog` |
| `SocialIcons.tsx` | component | - | lucide has no brand icons; 4 inline SVGs (Instagram, TikTok, Pinterest, Spotify) |
| `isNew` | utility | transform | Pure function per RESEARCH Pattern 5, `now` passed as an argument |
| `src/shop/logo.svg` | asset | - | Crop viewBox of `docs/assets/blacktail_brandmark_and_text.svg` (A6) |

## Metadata

**Analog search scope:** `C:/Git/blacktail/src` (all 22 tracked files), `C:\Git\vintage\src` (hooks, lib, components/ui)
**Files scanned:** about 14 read in full or in part
**Pattern extraction date:** 2026-10-26
