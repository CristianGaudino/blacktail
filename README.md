# blacktail

Deploying this template for another shop: see [docs/ONBOARDING.md](docs/ONBOARDING.md).

## Operations

### Rate limit catalogue queries (Cloudflare dashboard)

Every distinct catalogue query string (search text, filter combination) on `/shop`, `/just-dropped` or `/brands/<slug>` is a cache miss and one call to the How many API, and the API's 3000 requests per minute are shared by one server IP. The code caps a search at 40 characters and each filter group at 10 values. This rule caps how fast one visitor can mint new queries. Set it up once per shop:

- Where: the shop's zone in the Cloudflare dashboard, Security, WAF, Rate limiting rules, Create rule.
- Match: the path is `/shop`, `/just-dropped` or starts with `/brands/`, and the URI Query String is not empty. As an expression: `(http.request.uri.path in {"/shop" "/just-dropped"} or starts_with(http.request.uri.path, "/brands/")) and http.request.uri.query ne ""`.
- Counting: characteristic IP; 30 requests per 1 minute; action Block (or Managed Challenge) for the plan's default duration.
- Plan limits: if the plan only offers a 10-second period, use 5 requests per 10 seconds. If it does not offer the query string field, match the paths alone (without the query condition) with 10 requests per 10 seconds. Check what the plan offers in the dashboard.
- Coverage: `workers_dev` and `preview_urls` are off in `wrangler.jsonc`, so the custom domain is the only address and the rule covers it.
