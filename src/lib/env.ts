import { z } from 'zod';

// Every environment variable the app reads, validated in one place. A missing
// or malformed value fails with a message naming it, instead of a 500 later.
// Values are read fresh each call, never at module scope, so build order and
// cold starts cannot see them half-set. Messages never include the input value.

/** "missing" when unset, otherwise the given message */
const msg = (invalid: string) => ({ error: (issue: { input?: unknown }) => (issue.input === undefined ? 'missing' : invalid) });

const storeSchema = z.object({
    STORE_SLUG:             z.string(msg('must be the store address, lowercase letters, digits and hyphens')).regex(/^[a-z0-9-]+$/, 'must be lowercase letters, digits and hyphens'),
    /** The full store address from More > Online store in How many, ending in /stores/<STORE_SLUG> */
    HOWMANY_API_URL:        z.url({ protocol: /^https?$/, ...msg('must be the store address from More > Online store') }).transform(url => url.replace(/\/+$/, '')),
    HOWMANY_WEBHOOK_SECRET: z.string(msg('must be the webhook secret')).min(16, 'must be at least 16 characters'),
    SITE_URL:               z.url({ protocol: /^https$/, ...msg('must be an https:// URL') }),
}).refine(
    // Runs even when other variables fail, so one pass lists every problem. A variable that failed is absent here.
    env => !env.STORE_SLUG || !env.HOWMANY_API_URL || new URL(env.HOWMANY_API_URL).pathname.endsWith(`/stores/${env.STORE_SLUG}`),
    { path: ['HOWMANY_API_URL'], message: 'must be the address from More > Online store, ending in /stores/<STORE_SLUG>', when: () => true },
);

export type StoreEnv = z.output<typeof storeSchema>;

/** All server configuration, validated. Throws listing every problem. */
export function storeEnv(): StoreEnv {
    const parsed = storeSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        throw new Error(`Invalid environment variables:\n${issues.map(i => `  • ${i}`).join('\n')}\nSee .env.example.`);
    }
    return parsed.data;
}
