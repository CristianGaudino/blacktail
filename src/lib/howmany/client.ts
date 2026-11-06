import 'server-only';
import { cache } from 'react';
import type { z } from 'zod';
import { CACHE, CATALOGUE } from '@/lib/config';
import type { Filters, ItemDetail, ItemsPage, Store } from '@/lib/definitions';
import { storeEnv } from '@/lib/env';
import { sortEntries } from '@/lib/params';
import { filtersSchema, itemDetailSchema, itemsPageSchema, storeSchema } from '@/lib/howmany/schemas';
import { SHOP } from '@/shop/config';

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

// A code that cannot exist never reaches the shared 3000/min API limit (RESEARCH A1: relax this if a real code fails)
// Next never stores a 404, so without this each request for a made-up code would reach the shared API limit.
// shortcut: per isolate and short, so a piece shown again can take up to missingSeconds to reappear; share it (KV) only if that matters.
const missing = new Map<string, number>();
// A code that cannot exist never reaches the shared 3000/min API limit, and a made-up one fails here before any call: the shape is the shop's own (SHOP.itemCode)

/**
 * One /items/{code} read. null = the API answered 404 (hidden, deleted, unknown) or the code is badly shaped.
 * A sold piece is a 200 that the page shows as Sold; the webhook's tag refresh turns a cached copy into Sold or into a 404 on the next request.
 * Every other failure throws, so a 429 or 500 reaches error.tsx and is never shown as a not-found.
 * React cache() dedupes generateMetadata and the page (the AbortSignal opts out of Next's memoization).
 */
export const getItem = cache(async (code: string): Promise<ItemDetail | null> => {
    if (!SHOP.itemCode.test(code)) return null;
    if ((missing.get(code) ?? 0) > Date.now()) return null;
    try {
        return (await howmanyFetch(`/items/${encodeURIComponent(code)}`, itemDetailSchema)).data;
    } catch (error) {
        if (error instanceof HowManyError && error.status === 404) {
            if (missing.size >= CACHE.missingMax) missing.clear();
            missing.set(code, Date.now() + CACHE.missingSeconds * 1000);
            return null;
        }
        throw error;
    }
});

/**
 * One page of /items. `search` is the canonical query string (not an object) because cache() keys on
 * identity; limit is always sent so every page is the same size. Pages keep 24, the sitemap passes 100;
 * both arguments are primitives, so cache() keys stay stable.
 */
export const getItemsPage = cache(async (search: string, limit: number = CATALOGUE.pageSize): Promise<{ page: ItemsPage; asOf: string | null }> => {
    const params = new URLSearchParams(search);
    params.set('limit', String(limit));
    const { data, asOf } = await howmanyFetch('/items', itemsPageSchema, params);
    return { page: data, asOf };
});
