import 'server-only';
import type { z } from 'zod';
import { CACHE, STORE_API } from '@/lib/config';
import type { ItemsPage, Store } from '@/lib/definitions';
import { storeEnv } from '@/lib/env';
import { itemsPageSchema, storeSchema } from '@/lib/howmany/schemas';

/** The cache tag every How many read carries, and the webhook revalidates */
export const storeTag = () => `store:${storeEnv().STORE_SLUG}`;

export class HowManyError extends Error {
    constructor(readonly status: number, readonly path: string) {
        super(`How many API ${status} for ${path}`);
        this.name = 'HowManyError';
    }
}

/**
 * The one place the API is fetched. No custom headers: they are part of the cache key, and
 * authorization or cookie headers switch caching off. A non-2xx throws, so an error body is
 * never handed to a page as data. `asOf` is the API's Date header, stored with the cached body,
 * so it only changes when a real refetch happened.
 */
async function howmanyFetch<S extends z.ZodType>(path: string, schema: S, params?: Record<string, string>): Promise<{ data: z.output<S>; asOf: string | null }> {
    const query = params ? `?${new URLSearchParams(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))).toString()}` : '';
    const res = await fetch(`${storeEnv().HOWMANY_API_URL}${path}${query}`, {
        cache:  'force-cache',
        next:   { tags: [storeTag()], revalidate: CACHE.revalidateSeconds },
        signal: AbortSignal.timeout(CACHE.fetchTimeoutMs),
    });
    if (!res.ok) throw new HowManyError(res.status, path);
    return { data: schema.parse(await res.json()), asOf: res.headers.get('date') };
}

export async function getStore(): Promise<Store> {
    return (await howmanyFetch('', storeSchema)).data;
}

export async function getItems(): Promise<{ page: ItemsPage; asOf: string | null }> {
    const { data, asOf } = await howmanyFetch('/items', itemsPageSchema, { limit: String(STORE_API.listLimit) });
    return { page: data, asOf };
}
