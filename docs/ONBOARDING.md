# Deploying this template for another shop

## 1. What a shop is

A shop is one copy of this repository, one Cloudflare Worker and one How many store. Everything that belongs to one shop (name, words, colours, fonts, logos, pictures, addresses) lives in a few folders and files named below. Nothing in `src/components` or `src/app` changes.

## 2. Before you start

- Node 24 (the version in `.nvmrc`).
- A Cloudflare account on the Workers Paid plan, with the shop's domain on Cloudflare.
- A GitHub repository for the copy.
- The How many store, with its online store switched on.
- OpenNext builds only on Linux, so the Worker is built in GitHub Actions (or in WSL on Windows). Do not try to build it on plain Windows.

## 3. Swap the shop folder `src/shop/`

Replace these files with the new shop's own:

- `config.ts`: name, locale, contact email and intro, platforms (Vinted, eBay and so on), socials, the number of days a piece counts as new, the home page words and category tiles, the About text, the page descriptions and the default brand order.
- `colours.ts` and `theme.css`: the colour palette.
- `fonts.ts` and the `fonts/` folder: the two typefaces (committed files, never downloaded at build time).
- `logo.svg`: the shop logo.
- `brand-logos.ts`: the list of brand logo slugs (see the next section).

Run `grep -rn PENDING-OWNER src` to list every placeholder that still needs a real value. A test (`src/lib/shop-guard.test.ts`) fails if a shop value ends up outside `src/shop/`.

## 4. Brand logos

Put one SVG per brand in `public/brands/<slug>.svg`. The slug is the brand name in lower case with accents removed and every run of other characters turned into one hyphen. For example, `Dr. Martens` becomes `dr-martens` and `Levi's` becomes `levis`. The rule is in `src/lib/brands.ts`. List each slug in `src/shop/brand-logos.ts`; a test checks that the list and the folder match. A brand without a logo file shows its name as text.

## 5. Lifestyle images

The pictures live in `public/images/`. There are nine fixed file names. Replace a picture by overwriting the file with the same name. Use JPEG and keep each file small.

| File | Size | Used for |
| --- | --- | --- |
| `hero.jpg` | 2400 x 1000 | Home hero and About banner |
| `banner-just-dropped.jpg` | 1600 x 720 | Just Dropped banner on the home page |
| `banner-brands.jpg` | 1600 x 720 | Brands banner on the home page |
| `category-1.jpg` | 800 x 600 | First category tile |
| `category-2.jpg` | 800 x 600 | Second category tile |
| `category-3.jpg` | 800 x 600 | Third category tile |
| `category-4.jpg` | 800 x 600 | Fourth category tile |
| `story.jpg` | 1200 x 900 | Story band and About photo |
| `og-default.jpg` | 1200 x 630 | Link previews for pages without a piece photo |

The category tiles are set in `src/shop/config.ts`; each tile names its type code, label and image file.

## 6. How many

In How many, open More, then Online store, and note three things:

- The store address name (the slug). It becomes `STORE_SLUG`.
- The API address, exactly as shown. It becomes `HOWMANY_API_URL` and must end in `/stores/<slug>`.
- The webhook secret (at least 16 characters). It becomes `HOWMANY_WEBHOOK_SECRET`.

Set the webhook URL there to `https://<your host>/api/webhooks/howmany`.

## 7. Cloudflare, once per shop

```bash
npx wrangler login
npx wrangler d1 create <name>-tags
npx wrangler r2 bucket create <name>-opennext-cache
npx wrangler r2 bucket lifecycle add <name>-opennext-cache expire-old-builds incremental-cache/ --expire-days 30
npx wrangler secret put HOWMANY_WEBHOOK_SECRET
```

- Copy the `database_id` that the D1 command prints.
- The lifecycle rule is optional. Each deploy starts with a clean cache and leaves the old objects behind, so the rule removes them after about 30 days.
- Create an API token with Workers, R2 and D1 edit rights, then store it and the account id in GitHub:

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

- Add a Cloudflare rate-limiting rule (Security > WAF > Rate limiting rules) on the shop's zone: paths `/shop`, `/brands/*`, `/just-dropped` and `/items/*`, about 30 requests a minute per IP, action Block. Every new search text, filter mix or item code is an uncached call to How many, and all calls share one allowance of 600 uncached requests a minute per IP. Without the rule one script can use it up and every shopper sees the error page. Do not cover `/api/webhooks/*`.

## 8. `wrangler.jsonc`

Edit these values and nothing else:

- `name`: the Worker name.
- The `WORKER_SELF_REFERENCE` service: its `service` must equal `name`, or revalidation fails silently.
- `NEXT_INC_CACHE_R2_BUCKET`: your bucket name.
- `NEXT_TAG_CACHE_D1`: your database name and `database_id`.
- `NEXT_CACHE_DO_QUEUE`: leave it as it is.
- `vars`: `STORE_SLUG`, `HOWMANY_API_URL` and `SITE_URL`.
- `routes`: the shop's host as a custom domain. The host must have no DNS record of its own first.

`workers_dev` and `preview_urls` stay `false`, so the custom domain is the only address. That means the custom domain route must be in place before the first deploy.

## 9. Workflows

- `.github/workflows/deploy-workers.yml`: set the three env lines (`STORE_SLUG`, `HOWMANY_API_URL`, `SITE_URL`) to the same values as `vars` above.
- `.github/workflows/ci.yml`: set the worker job placeholders. `STORE_SLUG` must match the store path the mock How many API serves (`scripts/mock-howmany.mjs`).

## 10. Environment variables

| Variable | What it is | Where it is set |
| --- | --- | --- |
| `STORE_SLUG` | The store address name | `.env.local` for development, `vars` in `wrangler.jsonc`, the deploy workflow |
| `HOWMANY_API_URL` | The API address, ending in `/stores/<slug>` | `.env.local`, `vars`, the deploy workflow |
| `HOWMANY_WEBHOOK_SECRET` | The webhook secret | `.env.local`, and `npx wrangler secret put` on the Worker. Never in `wrangler.jsonc` or the repository |
| `SITE_URL` | The public address of the site, https only | `.env.local`, `vars`, the deploy workflow |
| `ALLOW_INDEXING` | `true` lets search engines in; anything else keeps the site out. Unset means off | The GitHub repository variable `ALLOW_INDEXING`. The deploy workflow passes it to the build and to the Worker |

## 11. Launch checklist

1. Overwrite the pictures in `public/images/` with the real ones.
2. Fill the contact, platform and About values and the brand order (`grep -rn PENDING-OWNER src` shows what is left).
3. Create the Cloudflare rate-limit rule described in the README.
4. In GitHub, set the repository variable `ALLOW_INDEXING` to `true` (Settings, Secrets and variables, Actions, Variables), then run the Deploy workflow (Actions, Deploy, Run workflow). A redeploy is needed because the robots header is fixed at build. Always deploy through this workflow: it passes the variable to both the build and the Worker. A hand-run `wrangler deploy` with the variable set only on the Worker leaves `robots.txt` open while every page still says noindex.
5. Check that `https://<host>/robots.txt` has a `Sitemap:` line and that `curl -sI https://<host>/shop` shows no `x-robots-tag` header.
6. Submit `https://<host>/sitemap.xml` in Google Search Console.

## 12. Local development

```bash
cp .env.example .env.local
node scripts/mock-howmany.mjs
npm run dev
npm test
```

Fill `.env.local` first. For the mock API, point `HOWMANY_API_URL` at `http://127.0.0.1:4010/api/v1/stores/<slug>` and start the mock with `--port 4010`.
