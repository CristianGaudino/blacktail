import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getItems, getStore, HowManyError } from './client';

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

describe('how many client', () => {
    it('fetches with the cache options, the store tag and no headers', async () => {
        fetchMock.mockResolvedValue(reply(page([item])));
        await getItems();
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${base}/items?limit=100`);
        expect(init.cache).toBe('force-cache');
        expect(init.next).toEqual({ tags: ['store:test-shop'], revalidate: 600 });
        expect(init.signal).toBeInstanceOf(AbortSignal);
        expect(init).not.toHaveProperty('headers');
    });

    it('rejects with HowManyError carrying the status for 404, 429 and 500', async () => {
        for (const status of [404, 429, 500]) {
            for (const call of [getStore, getItems]) {
                fetchMock.mockResolvedValue(new Response('{}', { status }));
                await expect(call()).rejects.toMatchObject({ name: 'HowManyError', status });
                await expect(call()).rejects.toBeInstanceOf(HowManyError);
            }
        }
    });

    it('ignores extra keys and unknown condition codes, and strips the extras', async () => {
        fetchMock.mockResolvedValue(reply({ ...page([{ ...item, condition: 'C', costCents: 5, notes: 'x' }]), future: true }));
        const { page: parsed } = await getItems();
        expect(parsed.items[0].condition).toBe('C');
        expect(parsed.items[0]).not.toHaveProperty('costCents');
        expect(parsed.items[0]).not.toHaveProperty('notes');
        expect(parsed).not.toHaveProperty('future');
    });

    it('keeps an item with a null brand, size, colour or era, and the other items', async () => {
        fetchMock.mockResolvedValue(reply(page([{ ...item, brand: null, size: null, colour: null, era: null }, { ...item, code: 'BT-0002' }])));
        const { page: parsed } = await getItems();
        expect(parsed.items).toHaveLength(2);
        expect(parsed.items[0]).toMatchObject({ brand: null, size: null, colour: null, era: null });
    });

    it('returns the response Date header as asOf', async () => {
        fetchMock.mockResolvedValue(reply(page([])));
        expect((await getItems()).asOf).toBe('Mon, 26 Oct 2026 14:00:00 GMT');
    });

    it('does not read env until called', async () => {
        vi.unstubAllEnvs();
        for (const k of ['STORE_SLUG', 'HOWMANY_API_URL', 'HOWMANY_WEBHOOK_SECRET', 'SITE_URL']) vi.stubEnv(k, undefined as unknown as string);
        await expect(getItems()).rejects.toThrow(/Invalid environment variables/);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
