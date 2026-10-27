# blacktail

## Operations

### Rate limit catalogue queries (Cloudflare dashboard)

Every distinct `/shop` query string (search text, filter combination) is a cache miss and one call to the How many API, and the API's 3000 requests per minute are shared by one server IP. The code caps a search at 40 characters and each filter group at 10 values. This rule caps how fast one visitor can mint new queries. Set it up once per shop:

- Where: the shop's zone in the Cloudflare dashboard, Security, WAF, Rate limiting rules, Create rule.
- Match: URI Path equals `/shop` and URI Query String is not empty. As an expression: `(http.request.uri.path eq "/shop" and http.request.uri.query ne "")`.
- Counting: characteristic IP; 30 requests per 1 minute; action Block (or Managed Challenge) for the plan's default duration.
- Plan limits: if the plan only offers a 10-second period, use 5 requests per 10 seconds. If it does not offer the query string field, match the path `/shop` alone with 10 requests per 10 seconds. Check what the plan offers in the dashboard.
- Coverage: the rule protects the custom domain only. The workers.dev address stays reachable until Phase 4 sets `workers_dev` to false in `wrangler.jsonc`.
