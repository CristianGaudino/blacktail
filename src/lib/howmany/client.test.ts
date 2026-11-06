import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE } from '@/lib/config';
import { getFilters, getItem, getItemsPage, getStore, HowManyError } from './client';

const base = 'https://api.test/api/v1/stores/test-shop';
const item = {
    code: 'BT-0001', title: 'Wool coat', brand: 'Acme', category: 'clothing', type: null, size: 'L', condition: 'A', colour: 'Navy', era: '90s',
    department: null, measurements: { pitToPitMm: 580, lengthMm: 700 }, details: {}, priceCents: 12000, currency: 'EUR',
    photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }], publishedAt: '2026-01-01T00:00:00Z',
};
const page = (items: unknown[]) => ({ items, page: 1, limit: 100, total: items.length });
const reply = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, headers: { date: 'Mon, 26 Oct 2026 14:00:00 GMT' }, ...init });

const fetchMock = vi.fn();

beforeEach(() => {
    vi.stubEnv('STORE_SLUG', 'test-shop');
    vi.stubEnv('HOWMANY_API_URL', base);
    vi.stubEnv('HOWMANY_WEBHOOK_SECRET', 'a-secret-of-sufficient-length');
    vi.stubEnv('SITE_URL', 'https://shop.test');
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
});

const filtersBody = { brand: [{ value: 'Acme', count: 3 }], priceCents: { min: 900, max: 12000 }, lengthMm: null, costCents: 5 };
const readers: [string, () => Promise<unknown>][] = [
    ['getStore', () => getStore()],
    ['getItemsPage', () => getItemsPage('')],
    ['getFilters', () => getFilters()],
];

describe('how many client', () => {
    it('fetches every read with the cache options, the store tag and no headers', async () => {
        for (const [, call] of readers) {
            fetchMock.mockReset();
            fetchMock.mockResolvedValue(reply({ slug: 'test-shop', name: 'Test', currency: 'EUR', ...page([item]), ...filtersBody }));
            await call();
            const [, init] = fetchMock.mock.calls[0];
            expect(init.cache).toBe('force-cache');
            expect(init.next).toEqual({ tags: ['store:test-shop'], revalidate: 600 });
            expect(init.signal).toBeInstanceOf(AbortSignal);
            expect(init).not.toHaveProperty('headers');
        }
    });

    it('rejects with HowManyError carrying the status for 404, 429 and 500', async () => {
        for (const status of [404, 429, 500]) {
            for (const [, call] of readers) {
                fetchMock.mockResolvedValue(new Response('{}', { status }));
                await expect(call()).rejects.toMatchObject({ name: 'HowManyError', status });
                await expect(call()).rejects.toBeInstanceOf(HowManyError);
            }
        }
    });

    it('getItemsPage always sends limit=24 and nothing else for an empty query', async () => {
        fetchMock.mockResolvedValue(reply(page([item])));
        await getItemsPage('');
        expect(fetchMock.mock.calls[0][0]).toBe(`${base}/items?limit=24`);
    });

    it('getItemsPage sorts the query by key then value and overrides a given limit', async () => {
        fetchMock.mockResolvedValue(reply(page([item])));
        await getItemsPage('type=knit&brand=B&brand=A&limit=100');
        expect(fetchMock.mock.calls[0][0]).toBe(`${base}/items?brand=A&brand=B&limit=24&type=knit`);
    });

    it('getItemsPage sends a given limit, with or without other params', async () => {
        fetchMock.mockImplementation(async () => reply(page([item])));
        await getItemsPage('', 100);
        expect(fetchMock.mock.calls[0][0]).toBe(`${base}/items?limit=100`);
        await getItemsPage('page=2', 100);
        expect(fetchMock.mock.calls[1][0]).toBe(`${base}/items?limit=100&page=2`);
    });

    it('getFilters fetches /filters, defaults missing facets to [] and ranges to null, and strips unknown keys', async () => {
        fetchMock.mockResolvedValue(reply(filtersBody));
        const filters = await getFilters();
        expect(fetchMock.mock.calls[0][0]).toBe(`${base}/filters`);
        expect(filters.brand).toEqual([{ value: 'Acme', count: 3 }]);
        expect(filters.size).toEqual([]);
        expect(filters.priceCents).toEqual({ min: 900, max: 12000 });
        expect(filters.pitToPitMm).toBeNull();
        expect(filters.lengthMm).toBeNull();
        expect(filters).not.toHaveProperty('costCents');
    });

    it('ignores extra keys and unknown condition codes, and strips the extras', async () => {
        fetchMock.mockResolvedValue(reply({ ...page([{ ...item, condition: 'C', costCents: 5, notes: 'x' }]), future: true }));
        const { page: parsed } = await getItemsPage('');
        expect(parsed.items[0].condition).toBe('C');
        expect(parsed.items[0]).not.toHaveProperty('costCents');
        expect(parsed.items[0]).not.toHaveProperty('notes');
        expect(parsed).not.toHaveProperty('future');
    });

    it('keeps an item with a null brand, size, colour or era, and the other items', async () => {
        fetchMock.mockResolvedValue(reply(page([{ ...item, brand: null, size: null, colour: null, era: null }, { ...item, code: 'BT-0002' }])));
        const { page: parsed } = await getItemsPage('');
        expect(parsed.items).toHaveLength(2);
        expect(parsed.items[0]).toMatchObject({ brand: null, size: null, colour: null, era: null });
    });

    it('returns the response Date header as asOf', async () => {
        fetchMock.mockResolvedValue(reply(page([])));
        expect((await getItemsPage('')).asOf).toBe('Mon, 26 Oct 2026 14:00:00 GMT');
    });

    describe('getItem', () => {
        it('fetches /items/{code} with the cache options, the store tag and no headers', async () => {
            fetchMock.mockResolvedValue(reply(item));
            await getItem('BT-0001');
            const [url, init] = fetchMock.mock.calls[0];
            expect(url).toBe(`${base}/items/BT-0001`);
            expect(init.cache).toBe('force-cache');
            expect(init.next).toEqual({ tags: ['store:test-shop'], revalidate: 600 });
            expect(init).not.toHaveProperty('headers');
        });

        it('returns the parsed item and strips unknown fields', async () => {
            fetchMock.mockResolvedValue(reply({ ...item, costCents: 5, notes: 'x' }));
            const parsed = await getItem('BT-0001');
            expect(parsed?.title).toBe('Wool coat');
            expect(parsed).not.toHaveProperty('costCents');
            expect(parsed).not.toHaveProperty('notes');
        });

        it('returns a sold piece with its sale day, and keeps one that is in stock or has no status', async () => {
            fetchMock.mockResolvedValue(reply({ ...item, status: 'sold', soldAt: '2026-11-03' }));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ code: 'BT-0001', status: 'sold', soldAt: '2026-11-03' });
            fetchMock.mockResolvedValue(reply({ ...item, status: 'inStock' }));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ code: 'BT-0001' });
            fetchMock.mockResolvedValue(reply(item));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ code: 'BT-0001' });
        });

        it('parses a sold piece with no price, no sale day or a malformed one, and no photos', async () => {
            fetchMock.mockResolvedValue(reply({ ...item, status: 'sold', priceCents: null, soldAt: null, photos: [] }));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ priceCents: null, soldAt: null, photos: [] });
            fetchMock.mockResolvedValue(reply({ ...item, status: 'sold', soldAt: '3 Nov' }));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ soldAt: null });
            fetchMock.mockResolvedValue(reply({ ...item, status: 'sold', soldAt: 'yesterday' }));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ soldAt: null });
            fetchMock.mockResolvedValue(reply({ ...item, status: 'sold', soldAt: '2026-11-03T10:00:00Z' }));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ soldAt: null });
            fetchMock.mockResolvedValue(reply(item));
            await expect(getItem('BT-0001')).resolves.toMatchObject({ soldAt: null });
        });

        it('keeps, in order, only the https listings and drops each bad entry alone', async () => {
            const good = (n: number) => ({ platform: 'ebay', url: `https://listing.test/${n}` });
            const bad = [
                { platform: 'ebay', url: 'http://a.test/x' }, { platform: 'ebay', url: 'javascript:alert(1)' }, { platform: 'ebay', url: 'https://' },
                { platform: 'ebay' }, { platform: 5, url: 'https://listing.test/5' }, null, 'x',
            ];
            fetchMock.mockResolvedValue(reply({ ...item, listings: [good(1), ...bad, good(2)] }));
            const parsed = await getItem('BT-0001');
            expect(parsed?.listings).toEqual([good(1), good(2)]);
        });

        it('gives no listings when the field is missing, a string or null', async () => {
            for (const listings of [undefined, 'x', null]) {
                fetchMock.mockResolvedValue(reply({ ...item, listings }));
                await expect(getItem('BT-0001')).resolves.toMatchObject({ listings: [] });
            }
        });

        it('asks the API once for a code it answered 404 for', async () => {
            fetchMock.mockResolvedValue(reply({}, { status: 404 }));
            await expect(getItem('GONE-1')).resolves.toBeNull();
            await expect(getItem('GONE-1')).resolves.toBeNull();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('warns when a listed piece has a code outside the shop pattern', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            fetchMock.mockResolvedValue(reply(page([item])));
            await getItemsPage('a=1');
            expect(warn).not.toHaveBeenCalled();
            fetchMock.mockResolvedValue(reply(page([{ ...item, code: 'JACKET-WIDE-12' }])));
            await getItemsPage('a=2');
            expect(warn).toHaveBeenCalledOnce();
            warn.mockRestore();
        });

        it('keeps listings off the list read', async () => {
            fetchMock.mockResolvedValue(reply(page([{ ...item, listings: [{ platform: 'ebay', url: 'https://listing.test/1' }] }])));
            expect((await getItemsPage('')).page.items[0]).not.toHaveProperty('listings');
        });

        it('resolves null for a 404 (hidden or unknown)', async () => {
            fetchMock.mockResolvedValue(new Response('{}', { status: 404 }));
            await expect(getItem('BT-0404')).resolves.toBeNull();
        });

        it('rejects with HowManyError for 429 and 500, so they never look like a not-found', async () => {
            for (const status of [429, 500]) {
                fetchMock.mockResolvedValue(new Response('{}', { status }));
                await expect(getItem('BT-0001')).rejects.toMatchObject({ name: 'HowManyError', status });
            }
        });

        it('rejects, never null, for a body that fails the schema', async () => {
            fetchMock.mockResolvedValue(reply({ ...item, title: 5 }));
            await expect(getItem('BT-0001')).rejects.toThrow();
        });

        it('resolves null without fetching for a badly shaped code', async () => {
            for (const code of ['../filters', 'a b', '', 'A'.repeat(65), '-X']) await expect(getItem(code)).resolves.toBeNull();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('answers null without fetching for a code that is not in the shop\'s shape', async () => {
            for (const code of ['BT_0001.v2', 'NOPE', 'ABCDEFG-1', 'BT-12x']) await expect(getItem(code)).resolves.toBeNull();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('forgets a 404 after missingSeconds and keeps at most missingMax codes', async () => {
            vi.useFakeTimers();
            try {
                fetchMock.mockResolvedValue(reply({}, { status: 404 }));
                await getItem('EXP-1');
                vi.advanceTimersByTime(CACHE.missingSeconds * 1000 + 1);
                await getItem('EXP-1');
                expect(fetchMock).toHaveBeenCalledTimes(2);
                fetchMock.mockClear();
                for (let i = 0; i < CACHE.missingMax + 1; i++) await getItem(`CAP-${i}`);
                await getItem('CAP-0');
                expect(fetchMock).toHaveBeenCalledTimes(CACHE.missingMax + 2);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    it('does not read env until called', async () => {
        vi.unstubAllEnvs();
        for (const k of ['STORE_SLUG', 'HOWMANY_API_URL', 'HOWMANY_WEBHOOK_SECRET', 'SITE_URL']) vi.stubEnv(k, undefined as unknown as string);
        await expect(getItemsPage('')).rejects.toThrow(/Invalid environment variables/);
        await expect(getFilters()).rejects.toThrow(/Invalid environment variables/);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
