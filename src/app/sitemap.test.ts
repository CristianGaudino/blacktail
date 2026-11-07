import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFilters, getItemsPage } from '@/lib/howmany/client';
import sitemap from './sitemap';

vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));
vi.mock('@/lib/howmany/client', () => ({ getFilters: vi.fn(), getItemsPage: vi.fn() }));

const item = (code: string) => ({ code, publishedAt: '2026-01-01T00:00:00Z' });

beforeEach(() => {
    vi.stubEnv('STORE_SLUG', 'test-shop');
    vi.stubEnv('HOWMANY_API_URL', 'https://api.test/api/v1/stores/test-shop');
    vi.stubEnv('HOWMANY_WEBHOOK_SECRET', 'a-secret-of-sufficient-length');
    vi.stubEnv('SITE_URL', 'https://shop.test');
    vi.stubEnv('ALLOW_INDEXING', 'true');
    vi.mocked(getFilters).mockResolvedValue({ brand: [{ value: 'Barbour', count: 1 }] } as never);
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
});

describe('sitemap', () => {
    it('reads every page of items and lists them all', async () => {
        vi.mocked(getItemsPage).mockImplementation((async (search: string) => ({
            page: { items: [item(search.includes('page=2') ? 'B-2' : 'A-1')], total: 150 },
            asOf: null,
        })) as never);
        const urls = (await sitemap()).map(e => e.url);
        expect(urls).toContain('https://shop.test/items/A-1');
        expect(urls).toContain('https://shop.test/items/B-2');
        expect(urls).toContain('https://shop.test/brands/barbour');
        expect(getItemsPage).toHaveBeenCalledTimes(2);
    });

    it('is empty while indexing is off, with no API call', async () => {
        vi.stubEnv('ALLOW_INDEXING', 'false');
        expect(await sitemap()).toEqual([]);
        expect(getItemsPage).not.toHaveBeenCalled();
    });
});
