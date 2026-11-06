# Phase 1: Live Stock Skeleton - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 34 new files
**Analogs found:** 22 / 34 (Blacktail is greenfield; all analogs are tracked files in `C:\Git\vintage`, verified with `git ls-files`)

Blacktail has no `src/`. Every analog is in Vintage (`V:` = `C:\Git\vintage`). Where the file must differ from Vintage, the "Change" note says how (see `.claude/CLAUDE.md` "What NOT to Use").

## File Classification

| New File | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `package.json` | config | n/a | `V:package.json` | exact (trim deps) |
| `tsconfig.json`, `.nvmrc` | config | n/a | `V:tsconfig.json`, `V:.nvmrc` | exact (copy) |
| `eslint.config.mjs` | config | n/a | `V:eslint.config.mjs` | exact (copy) |
| `vitest.config.mts` | config | n/a | `V:vitest.config.mts` | role-match (change alias, add setupFiles) |
| `next.config.ts` | config | request-response | `V:next.config.ts` | role-match (no CSP, no turbopack CSS, add noindex) |
| `open-next.config.ts` | config | n/a | `V:open-next.config.ts` | partial (add tag cache + queue) |
| `wrangler.jsonc` | config | n/a | `V:wrangler.jsonc` | role-match (main, D1, DO, no crons) |
| `.github/workflows/ci.yml` | config | batch | `V:.github/workflows/ci.yml` | exact shape |
| `.github/workflows/deploy-workers.yml` | config | batch | `V:.github/workflows/deploy-workers.yml` | exact shape |
| `.env.example` | config | n/a | `V:.env.example` | role-match |
| `src/lib/env.ts` + `env.test.ts` | utility + test | transform | `V:src/lib/env.ts`, `env.test.ts` | exact |
| `src/instrumentation.ts` | config | event-driven | `V:src/instrumentation.ts` | exact |
| `src/lib/config.ts`, `copy.ts`, `routes.ts`, `definitions.ts` | config | n/a | `V:src/lib/{config,copy,routes,definitions}.ts` | role-match |
| `src/lib/copy.test.ts` | test | transform | `V:src/lib/copy.test.ts` | exact |
| `src/lib/guard.test.ts` | test | batch (file scan) | none | no analog |
| `src/lib/webhook.ts` + test | utility | request-response | none (RESEARCH Pattern 3); Vintage uses Svix | no analog |
| `src/app/api/webhooks/howmany/route.ts` + test | route | request-response | `V:src/app/api/webhooks/clerk/route.ts` | role-match |
| `src/lib/howmany/client.ts`, `schemas.ts` + tests | service | request-response | none (RESEARCH Pattern 2); Vintage has a DB layer | no analog |
| `src/lib/data/store.ts`, `items.ts` | service | CRUD (read) | none | no analog |
| `src/app/layout.tsx` | component | request-response | `V:src/app/layout.tsx` | role-match |
| `src/app/page.tsx` | component | request-response | none (RESEARCH Pattern 1) | no analog |
| `src/app/error.tsx`, `global-error.tsx` | component | request-response | `V:src/app/error.tsx`, `global-error.tsx` | exact (simplify) |
| `src/app/not-found.tsx` | component | request-response | `V:src/components/ui/StatusScreen.tsx` use | partial |
| `src/components/ui/StatusScreen.tsx` | component | request-response | `V:src/components/ui/StatusScreen.tsx` | role-match (unstyled) |
| `src/components/stock/ItemList.tsx` | component | request-response | none | no analog |
| `src/test/setup.ts` | test | n/a | `vi.mock('server-only', () => ({}))` in `V:src/app/api/routes.int.test.ts:16` | role-match |
| `scripts/mock-howmany.mjs`, `scripts/prove-freshness.mjs` | utility | request-response | none | no analog |
| `public/_headers` | config | n/a | none | no analog |

## Pattern Assignments

### `src/lib/env.ts` + `env.test.ts` (utility, transform)

**Analog:** `V:src/lib/env.ts` lines 1-9, 53-63; test `V:src/lib/env.test.ts` lines 1-45.

**msg() helper and schema style** (env.ts:8-16):
```typescript
/** "missing" when unset, otherwise the given message */
const msg = (invalid: string) => ({ error: (issue: { input?: unknown }) => (issue.input === undefined ? 'missing' : invalid) });

const serverSchema = z.object({
    DATABASE_URL:                      databaseUrl,
    CLERK_SECRET_KEY:                  z.string(msg('must start with sk_test_ or sk_live_')).regex(/^sk_(test|live)_/, 'must start with sk_test_ or sk_live_'),
    PHOTO_BASE_URL:                    z.url({ protocol: /^https$/, ...msg('must be an https:// URL') }),
});
```
**Throw with the full list** (env.ts:56-63):
```typescript
export function serverEnv(): ServerEnv {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        throw new Error(`Invalid environment variables:\n${issues.map(i => `  • ${i}`).join('\n')}\nSee .env.example.`);
    }
    return parsed.data;
}
```
**Change:** name the function `storeEnv()`, read lazily on each call, no module-scope `process.env`. Keys `STORE_SLUG`, `HOWMANY_API_URL`, `HOWMANY_WEBHOOK_SECRET`, `SITE_URL`. Add `.superRefine` (D-02): strip trailing slash, path must end with `/stores/${STORE_SLUG}`. Do not import `server-only` is optional here (Vintage's env.ts has none); RESEARCH wants it on modules reading env or calling the API.

**Test pattern** (env.test.ts:1-45): `vi.stubEnv` with a `setEnv` that blanks every known key first, `afterEach(() => vi.unstubAllEnvs())`, and `toThrow(/KEY: missing/)` and ordered-regex assertions naming each bad variable.

---

### `src/instrumentation.ts` (config, event-driven)

**Analog:** `V:src/instrumentation.ts` lines 1-9 (copy, swap import):
```typescript
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { storeEnv } = await import('./lib/env');
        storeEnv();
    }
}
```
No `envWarnings` needed.

---

### `src/app/api/webhooks/howmany/route.ts` (route, request-response)

**Analog:** `V:src/app/api/webhooks/clerk/route.ts` lines 1-28, 48.

**Shape to copy** (named `POST`, env read inside the handler, `Response` with status, log reason without secrets, 204 at the end):
```typescript
import type { NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';

export async function POST(request: NextRequest): Promise<Response> {
    const signingSecret = serverEnv().CLERK_WEBHOOK_SIGNING_SECRET;
    ...
    try {
        event = await verifyWebhook(request, { signingSecret });
    } catch (error) {
        console.error('Clerk webhook refused:', reason);
        return new Response(`Webhook verification failed: ${reason}`, { status: 400 });
    }
    ...
    return new Response(null, { status: 204 });
}
```
**Change (per CONTEXT D-07 and RESEARCH Pattern 3):** replace Svix with `verifyWebhook` from `@/lib/webhook` (WebCrypto, headers `X-Howmany-Timestamp`/`X-Howmany-Signature`, `await request.text()` once). Bad signature, stale timestamp, unparseable or non-object body: `new Response(null, { status: 401 })` with empty body (Vintage echoes the reason; do NOT do that here, and never log body, signature or secret). Valid signature but other `store` or `event !== 'store.updated'`: 204 without revalidating. Success: `revalidateTag(storeTag(), CACHE.webhookRevalidate)` (`{ expire: 0 }` in `config.ts`) then 204. Export only `POST`. Route test mocks `next/cache` with `vi.mock('next/cache')`.

---

### `src/lib/webhook.ts`, `src/lib/howmany/client.ts`, `schemas.ts`, `src/lib/data/*` (no analog)

Use RESEARCH.md Pattern 3 (verifier, lines 206-225), Pattern 2 (client, lines 179-204) and "Lenient item schema" (lines 335-337) verbatim as the starting point. Conventions to apply from Vintage: named exports, `import 'server-only'` first line, 4-space indent, single quotes, colocated `*.test.ts`, money fields as `...Cents`, `get*` functions in `src/lib/data/` return types from `definitions.ts`. `PublicItem` type source: `V:src/lib/definitions.ts:840-857`.

---

### `src/lib/config.ts`, `copy.ts`, `routes.ts`, `definitions.ts` (config)

**Analogs:** `V:src/lib/config.ts` (typed constants objects with `as const`, JSDoc one-liners, aligned values), `V:src/lib/copy.ts` lines 1-30 (single exported `COPY` object grouped by screen, wording as functions), `V:src/lib/routes.ts` lines 1-6 (`export const ROUTES = { home: '/', ... }`, no other imports).
```typescript
export const COPY = {
    common: {
        somethingWentWrong: 'Something went wrong',
        tryAgain:   'Try again',
    },
    ...
};
```
**Change:** `config.ts` holds `CACHE = { revalidateSeconds: 600, fetchTimeoutMs, webhookRevalidate: { expire: 0 } }` and `STORE_API = { webhookToleranceSeconds: 300 }`. No shop name anywhere (heading from `GET /`). Add `COPY.stock.empty`, `COPY.status.error*`. No em dash.

---

### `src/lib/copy.test.ts` (test)

**Analog:** `V:src/lib/copy.test.ts` lines 6-29. Copy `allText()` as is:
```typescript
function allText(value: unknown, path = ''): { path: string; text: string }[] {
    if (typeof value === 'string') return [{ path, text: value }];
    if (typeof value === 'function') {
        const args = Array.from({ length: value.length }, () => '2');
        return allText(value(...args), path);
    }
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, v]) => allText(v, path ? `${path}.${key}` : key));
    return [];
}
```
Assert `allText(COPY).filter(t => t.text.includes('—'))` maps to `[]`. Drop the `listingText`, `TERMS`, `PRIVACY` parts.

---

### `src/app/error.tsx`, `global-error.tsx`, `not-found.tsx`, `StatusScreen` (component)

**Analog:** `V:src/app/error.tsx` (lines 1-8):
```typescript
'use client';
import { ErrorScreen, type ErrorScreenProps } from '@/components/layout/ErrorScreen';
export default function RootError(props: ErrorScreenProps) {
    return <ErrorScreen {...props} fullScreen />;
}
```
`ErrorScreen` (`V:src/components/layout/ErrorScreen.tsx:9-28`) takes `{ error, retry }`, shows `COPY.status.errorTitle/errorMessage` and the digest, and renders a `StatusScreen` with children. **Change:** unstyled (no lucide, no Tailwind, no fonts, no `globals.css`). Keep the props type `Error & { digest?: string }`, `retry`. Note Next 16 error boundaries receive `unstable_retry`/`reset`; check `node_modules/next/dist/docs` before copying `retry`. `global-error.tsx` must render its own `<html><body>` (Vintage global-error.tsx:18-28) minus fonts and theme script. `data-as-of` never goes in error screens.

---

### `src/app/layout.tsx` (component)

**Analog:** `V:src/app/layout.tsx` lines 1-36 (typed `Metadata`, `RootLayout({ children }: LayoutProps<'/'>)`). **Change:** no fonts, no globals.css, no theme script. `metadata.robots = { index: false, follow: false }` plus `metadataBase: new URL(env SITE_URL)` only if it can be read without breaking build (env is lazy; read via `storeEnv()` or skip in Phase 1).

---

### `src/app/page.tsx` + `ItemList.tsx` (no analog)

RESEARCH Pattern 1: `await connection()` from `next/server` first, then `getStore()` and `getItems()`; no `dynamic`, no `revalidate` export. `ItemList` renders `<ul data-as-of={asOf}>` with brand, title, price (minimal formatter using `priceCents` and store `currency` via `Intl.NumberFormat`), `thumbUrl` via `next/image` with API width/height. Empty state from `COPY` (D-08).

---

### `next.config.ts` (config)

**Analog:** `V:next.config.ts` lines 53-99. Reusable shape:
```typescript
const nextConfig: NextConfig = {
    // No cacheComponents ...   <- write "Cache Components" with a space (guard test, Pitfall 11)
    poweredByHeader: false,
    images: { unoptimized: true },
    async headers() { return [{ source: "/:path*", headers: SECURITY_HEADERS }]; },
};
export default nextConfig;
```
**Change:** drop `contentSecurityPolicy`, Clerk, `experimental.serverActions`, `outputFileTracingExcludes`, redirects and the `turbopack` CSS rule (no Tailwind in Phase 1). Headers: `X-Robots-Tag: noindex, nofollow` (comment pointing at SEO-03) plus Vintage's `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`. Vintage uses double quotes here; the project convention is single quotes, so use single.

---

### `open-next.config.ts` (config)

**Analog:** `V:open-next.config.ts` lines 1-5. **Change** (no-copy-as-is, per CLAUDE.md):
```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

// Plain d1NextTagCache: NOT wrapped in withFilter (Pitfall 1)
export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache, queue: doQueue, tagCache: d1NextTagCache });
```

---

### `wrangler.jsonc` (config)

**Analog:** `V:wrangler.jsonc` lines 5-41 (tabs for indent, comments explaining why; `compatibility_flags`, `assets`, `services` self-reference, `r2_buckets`, plain `vars`, `routes` with `custom_domain: true`, `observability`).
Keep verbatim: `$schema`, `compatibility_date 2026-10-01`, `["nodejs_compat", "global_fetch_strictly_public"]`, `assets { ".open-next/assets", "ASSETS" }`, the "plain values live here because deploy overwrites dashboard vars" comment.
**Change:** `"main": ".open-next/worker.js"` (not `cloudflare-worker.js`, which would not re-export `DOQueueHandler`); add `d1_databases` (`NEXT_TAG_CACHE_D1`, `database_id` from owner), `durable_objects.bindings` (`NEXT_CACHE_DO_QUEUE`/`DOQueueHandler`), `migrations [{ tag: v1, new_sqlite_classes: [DOQueueHandler] }]`; drop `triggers.crons`; `routes: [{ pattern: 'www.blacktailarchive.cgaudino.com', custom_domain: true }]`; `workers_dev: true` in Phase 1 (D-discretion); vars `STORE_SLUG=blacktail-archive`, `HOWMANY_API_URL`, `SITE_URL`. `HOWMANY_WEBHOOK_SECRET` is a secret, never a var. Names: Worker `blacktail-archive`, D1 `blacktail-archive-tags`, R2 `blacktail-archive-opennext-cache`.

---

### `.github/workflows/ci.yml` (config, batch)

**Analog:** `V:.github/workflows/ci.yml`.
Copy: header `on: pull_request` with `types: [opened, synchronize, reopened, ready_for_review]` and `paths-ignore: ['**.md', '.planning/**']` (lines 5-10), `concurrency` (12-14), `permissions: contents: read`, `if: github.event.pull_request.draft == false`, `actions/checkout@v7`, `actions/setup-node@v7` with `node-version-file: .nvmrc` and `cache: npm`, `npm ci`, steps Lint / Typecheck / Tests (lines 36-54).
Worker job pattern (lines 89-115) to extend:
```bash
npx opennextjs-cloudflare build
printf '...' > .dev.vars
npx wrangler dev --port 8787 --ip 127.0.0.1 > wrangler.log 2>&1 &
curl -s -o /dev/null --retry 60 --retry-connrefused --retry-delay 2 http://127.0.0.1:8787/robots.txt || true
check() { local label=$1 want=$2; shift 2; got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "$@"); echo "$label: $got (want $want)"; [ "$got" = "$want" ] || fail=1; }
if grep -q 'ERROR' wrangler.log; then echo 'the Worker logged an error'; fail=1; fi
```
**Change:** remove the Playwright-image, db:check and migrations steps and the Clerk/R2 placeholder env. Add: start `scripts/mock-howmany.mjs`, `/__count` must be 0 after build (DATA-06), `populateCache local` before `wrangler dev`, then `node scripts/prove-freshness.mjs`, plus the missing-env negative check, a Cache Components guard (runs inside `npm test`) and the em-dash guard (inside `npm test`). Note `/robots.txt` does not exist in Phase 1: warm up on `/` instead. Keep the "billed in whole minutes" cost comments.

---

### `.github/workflows/deploy-workers.yml` (config, batch)

**Analog:** `V:.github/workflows/deploy-workers.yml` lines 1-85.
```yaml
on:
  push:
    branches: [main]
    paths-ignore: ['**.md', '.planning/**']
  workflow_dispatch:
concurrency: { group: deploy-workers, cancel-in-progress: false }
...
      - run: npm ci
      - name: Tests
        run: npm test
      - run: npx opennextjs-cloudflare build
      - name: Prerendered pages into the cache bucket
        run: npx opennextjs-cloudflare populateCache remote
      - name: Deploy
        run: npx wrangler deploy --var APP_COMMIT_SHA:${{ github.sha }}
      - name: Wait for the site
        run: curl -fsS -o /dev/null --retry 40 --retry-delay 15 --retry-all-errors --max-time 20 https://www.checkhowmany.com/welcome
```
Env keeps `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID: ${{ secrets.* }}`, `NEXT_TELEMETRY_DISABLED: 1`, `WRANGLER_SEND_METRICS: false`. **Change:** delete the migrate step, Clerk/R2/DB env and the `e2e` job; the wait URL is `https://www.blacktailarchive.cgaudino.com/`; add smoke: `/` 200 with `X-Robots-Tag`, unsigned `POST /api/webhooks/howmany` 401. `populateCache remote` is what creates the D1 `revalidations` table, so keep it. PR B only (CONTEXT).

---

### `package.json`, `tsconfig.json`, `.nvmrc`, `eslint.config.mjs`, `vitest.config.mts`

- `V:package.json` lines 4-18 scripts: keep `dev`, `build`, `start`, `lint: "eslint"`, `typecheck: "next typegen && tsc --noEmit"`, `test: "vitest run"`; drop db/e2e scripts. Exact pins `next 16.4.1`, `react 19.3.0`, `react-dom 19.3.0`, `eslint-config-next 16.4.1`; dependencies per RESEARCH install list. Copy Vintage's `overrides` block (see `V:package.json` after line 60).
- `V:tsconfig.json` and `V:.nvmrc` (`24`): copy whole.
- `V:eslint.config.mjs`: copy whole (24 lines; `ignoreRestSiblings`).
- `V:vitest.config.mts` lines 4-16: keep the `@` alias with `fileURLToPath(new URL('./src', import.meta.url))`, `environment: 'node'`, `include: ['src/**/*.test.ts']`. **Change:** delete the `.open-next/worker.js` alias; add `setupFiles: ['./src/test/setup.ts']`. Do NOT alias to `server-only/empty.js` (not exported, Pitfall 5).

### `src/test/setup.ts`
Vintage mocks per file: `vi.mock('server-only', () => ({}));` (`V:src/app/api/routes.int.test.ts:16`). Put that single line in the setup file.

---

## Shared Patterns

### Lazy validated env
**Source:** `V:src/lib/env.ts:56-63`. **Apply to:** client, webhook route, page, instrumentation. Call `storeEnv()` inside functions; never read `process.env` at module scope.

### Tagged fetch seam
**Source:** RESEARCH Pattern 2 (no Vintage analog). **Apply to:** every API read, only through `src/lib/howmany/client.ts`: `cache: 'force-cache'`, `next: { tags: [storeTag()], revalidate: CACHE.revalidateSeconds }`, no custom headers, throw on non-2xx.

### Webhook response discipline
**Source:** `V:src/app/api/webhooks/clerk/route.ts:15-48` (shape) with CONTEXT D-07 (401 empty body for auth/parse failures, 204 for valid-but-ignored, never 500).

### Conventions
**Source:** Vintage CONVENTIONS.md: named exports, 4-space indent, single quotes, semicolons, `@/*` alias, colocated `*.test.ts`, `import 'server-only'` as first line of server modules, all on-screen text in `COPY`.

### Tracked-source gate
All analog paths above were confirmed tracked in Vintage's git (11 of the config/lib files checked with `git ls-files`). Nothing points at `.open-next/` or any gitignored mirror.

## No Analog Found

| File | Role | Reason |
|------|------|--------|
| `src/lib/webhook.ts`, `src/lib/howmany/*`, `src/lib/data/*` | service/utility | Vintage reads Postgres and uses Svix; use RESEARCH Patterns 2 and 3 |
| `src/app/page.tsx`, `src/components/stock/ItemList.tsx` | component | Vintage pages are signed-in and DB-backed; use RESEARCH Pattern 1 |
| `src/lib/guard.test.ts` | test | Use RESEARCH "Guard test" (recursive `fs.readdirSync`, regex on `cacheComponents|cacheTag|cacheLife|'use cache'`, skip itself) |
| `scripts/mock-howmany.mjs`, `scripts/prove-freshness.mjs` | utility | New; RESEARCH CI worker job steps 1-4 |
| `public/_headers` | config | New; `/_next/static/*` immutable |

## Metadata

**Analog search scope:** `C:\Git\vintage` root config, `.github/workflows`, `src/lib`, `src/app`, `src/components/layout`
**Files scanned:** about 20 read, rest by listing
**Pattern extraction date:** 2026-10-26
