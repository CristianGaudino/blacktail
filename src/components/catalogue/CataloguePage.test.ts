import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFilters, getItemsPage, getStore, HowManyError } from '@/lib/howmany/client';
import { CataloguePage } from './CataloguePage';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/howmany/client', async importOriginal => ({
    ...(await importOriginal<typeof import('@/lib/howmany/client')>()),
    getFilters: vi.fn(), getItemsPage: vi.fn(), getStore: vi.fn(),
}));

const emptyFilters = { brand: [], size: [], colour: [], era: [], material: [], category: [], type: [], condition: [], department: [], priceCents: null, pitToPitMm: null, lengthMm: null, soldBrands: ['Old Mill'] };

/** The first element anywhere in the tree whose props carry `items` (the ItemGrid) */
function findGrid(node: unknown): { items: unknown[] } | undefined {
    if (!node || typeof node !== 'object') return undefined;
    const props = (node as { props?: Record<string, unknown> }).props;
    if (props && Array.isArray(props.items)) return props as { items: unknown[] };
    for (const child of Array.isArray(node) ? node : Object.values(props ?? {})) {
        const found = findGrid(child);
        if (found) return found;
    }
    return undefined;
}

const render = () => CataloguePage({ raw: {}, basePath: '/brands/old-mill', title: 'Old Mill', brand: 'Old Mill' });

afterEach(() => {
    vi.resetAllMocks();
});

describe('CataloguePage', () => {
    it('shows an empty catalogue when the API answers 400 (a sold-before brand)', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.mocked(getFilters).mockResolvedValue(emptyFilters as never);
        vi.mocked(getStore).mockResolvedValue({ slug: 's', name: 'S', currency: 'GBP' });
        vi.mocked(getItemsPage).mockRejectedValue(new HowManyError(400, '/items'));
        expect(findGrid(await render())?.items).toEqual([]);
    });

    it('rethrows any other API error', async () => {
        vi.mocked(getFilters).mockResolvedValue(emptyFilters as never);
        vi.mocked(getStore).mockResolvedValue({ slug: 's', name: 'S', currency: 'GBP' });
        vi.mocked(getItemsPage).mockRejectedValue(new HowManyError(429, '/items'));
        await expect(render()).rejects.toThrow('429');
    });
});
