import 'server-only';
import { cache } from 'react';
import type { z } from 'zod';
import { CACHE, CATALOGUE } from '@/lib/config';
import type { Filters, ItemsPage, Store } from '@/lib/definitions';
import { storeEnv } from '@/lib/env';
import { sortEntries } from '@/lib/params';
import { filtersSchema, itemsPageSchema, storeSchema } from '@/lib/howmany/schemas';

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
async function howmanyFetch<S extends z.ZodType>(path: string, schema: S, params?: URLSearchParams): Promise<{ data: z.output<S>; asOf: string | null }> {
    // Sorted by key then value, so equal queries are one cache key
    const query = params?.size ? `?${new URLSearchParams(sortEntries([...params])).toString()}` : '';
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

/**
 * One /filters read. The AbortSignal opts this fetch out of Next's per-request memoization, so React
 * cache() dedupes the Header, the page and generateMetadata into one read per request.
 */
export const getFilters = cache(async (): Promise<Filters> => (await howmanyFetch('/filters', filtersSchema)).data);

/**
 * One page of /items. `search` is the canonical query string (not an object) because cache() keys on
 * identity; limit is always sent so every page is the same size.
 */
export const getItemsPage = cache(async (search: string): Promise<{ page: ItemsPage; asOf: string | null }> => {
    const params = new URLSearchParams(search);
    params.set('limit', String(CATALOGUE.pageSize));
    const { data, asOf } = await howmanyFetch('/items', itemsPageSchema, params);
    return { page: data, asOf };
});
