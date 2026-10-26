import 'server-only';
import { cache } from 'react';
import type { z } from 'zod';
import { CACHE, CATALOGUE, STORE_API } from '@/lib/config';
import type { Filters, ItemsPage, Store } from '@/lib/definitions';
import { storeEnv } from '@/lib/env';
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
    const query = params?.size ? `?${new URLSearchParams([...params].sort(([a, x], [b, y]) => a.localeCompare(b) || x.localeCompare(y))).toString()}` : '';
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
 * Every shown item: pages 2.. up to the API's last-page rule (page * limit >= total), fetched together.
 * Each page is its own cache entry and can be a refresh apart, so an item that moved between pages is kept once.
 */
export async function getItems(): Promise<{ page: ItemsPage; asOf: string | null }> {
    const limit = String(STORE_API.listLimit);
    const first = await howmanyFetch('/items', itemsPageSchema, new URLSearchParams({ limit }));
    const pageCount = Math.ceil(first.data.total / STORE_API.listLimit);
    const rest = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) =>
        howmanyFetch('/items', itemsPageSchema, new URLSearchParams({ limit, page: String(i + 2) }))));
    const byCode = new Map([first, ...rest].flatMap(p => p.data.items).map(item => [item.code, item]));
    return { page: { ...first.data, items: [...byCode.values()] }, asOf: first.asOf };
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