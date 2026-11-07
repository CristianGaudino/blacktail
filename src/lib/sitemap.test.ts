import { describe, expect, it } from 'vitest';
import { sitemapEntries } from './sitemap';

const build = (over: Partial<Parameters<typeof sitemapEntries>[0]> = {}) =>
    sitemapEntries({ siteUrl: 'https://shop.test', brands: [], items: [], ...over });

describe('sitemapEntries', () => {
    it('lists the six fixed pages first, absolute and without lastModified', () => {
        expect(build()).toEqual(['/', '/shop', '/brands', '/just-dropped', '/about', '/contact'].map(p => ({ url: `https://shop.test${p}` })));
    });

    it('gives the same URLs with a trailing slash on siteUrl', () => {
        expect(build({ siteUrl: 'https://shop.test/' })).toEqual(build());
    });

    it('lists brands then items after the fixed pages', () => {
        const entries = build({ brands: [{ slug: 'acme' }], items: [{ code: 'BT-1', publishedAt: '2026-01-01T00:00:00Z' }] });
        expect(entries.slice(6).map(e => e.url)).toEqual(['https://shop.test/brands/acme', 'https://shop.test/items/BT-1']);
    });

    it('percent-encodes item codes so the XML stays valid', () => {
        const entries = build({ items: [{ code: 'A&B<1>', publishedAt: '2026-01-01T00:00:00Z' }] });
        expect(entries[6].url).toBe('https://shop.test/items/A%26B%3C1%3E');
        for (const { url } of entries) expect(url).not.toMatch(/[&<>?]/);
    });

    it('caps the list at 50,000 entries', () => {
        const items = Array.from({ length: 60_000 }, (_, i) => ({ code: `C${i}`, publishedAt: '2026-01-01T00:00:00Z' }));
        expect(build({ items })).toHaveLength(50_000);
    });
});
