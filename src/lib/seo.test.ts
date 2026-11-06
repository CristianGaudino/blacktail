import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '@/lib/config';
import type { CatalogueQuery } from '@/lib/definitions';
import { SHOP } from '@/shop/config';
import { canonicalUrl, listingRobots, pageMetadata, soldItemRobots } from './seo';

const query = (over: Partial<CatalogueQuery> = {}, lists: Partial<CatalogueQuery['lists']> = {}): CatalogueQuery => ({
    lists: { ...Object.fromEntries(CATALOGUE.lists.map(k => [k, []])), ...lists } as CatalogueQuery['lists'],
    ranges: { price: { min: null, max: null }, pitToPit: { min: null, max: null }, length: { min: null, max: null } },
    q: '', sort: 'newest', page: 1, ...over,
});

describe('listingRobots', () => {
    it('follows the site switch for a clean listing', () => {
        for (const q of [query(), query({ page: 2 }), query({ sort: 'newest' })]) {
            expect(listingRobots(q, false)).toEqual({ index: false, follow: false });
            expect(listingRobots(q, true)).toEqual({ index: true, follow: true });
        }
    });

    it('gives noindex, follow to filtered, searched, ranged and sorted listings with either value', () => {
        const ranged = query({ ranges: { price: { min: 2000, max: null }, pitToPit: { min: null, max: null }, length: { min: null, max: null } } });
        for (const indexable of [false, true]) {
            for (const q of [query({}, { brand: ['Acme'] }), query({ q: 'coat' }), query({ sort: 'price_asc' }), ranged]) {
                expect(listingRobots(q, indexable)).toEqual({ index: false, follow: true });
            }
        }
    });
});

describe('soldItemRobots', () => {
    it('is noindex, follow', () => {
        expect(soldItemRobots()).toEqual({ index: false, follow: true });
    });
});

describe('canonicalUrl', () => {
    it('is the bare shop URL for an empty query, with or without a trailing slash', () => {
        expect(canonicalUrl('https://shop.test', query())).toBe('https://shop.test/shop');
        expect(canonicalUrl('https://shop.test/', query())).toBe('https://shop.test/shop');
    });

    it('uses another base path for a brand page', () => {
        expect(canonicalUrl('https://shop.test', query({ sort: 'price_asc' }), '/brands/acme')).toBe('https://shop.test/brands/acme?sort=price_asc');
        expect(canonicalUrl('https://shop.test', query(), '/brands/acme')).toBe('https://shop.test/brands/acme');
    });

    it('uses the same sorted serialisation as links, including the page', () => {
        expect(canonicalUrl('https://shop.test', query({ page: 2 }, { brand: ['Acme'] }))).toBe('https://shop.test/shop?brand=Acme&page=2');
    });
});

describe('pageMetadata', () => {
    const url = 'https://shop.test/about';
    const og = (m: ReturnType<typeof pageMetadata>) => m.openGraph as Record<string, unknown>;

    it('gives title, description, canonical and a full Open Graph block', () => {
        const m = pageMetadata({ url, title: 'About', description: 'Words' });
        expect(m.title).toBe('About');
        expect(m.description).toBe('Words');
        expect(m.alternates?.canonical).toBe(url);
        expect(og(m)).toEqual({
            type: 'website', url, siteName: SHOP.name, locale: SHOP.locale.replace('-', '_'),
            title: `About | ${SHOP.name}`, description: 'Words',
            images: [{ url: 'https://shop.test/images/og-default.jpg', width: 1200, height: 630 }],
        });
    });

    it('builds the default image from the origin even when the url has a path and a query', () => {
        const m = pageMetadata({ url: 'https://shop.test/shop?sort=price_asc', title: 'T', description: 'D' });
        expect(og(m).images).toEqual([{ url: 'https://shop.test/images/og-default.jpg', width: 1200, height: 630 }]);
    });

    it('lets a given image replace the default', () => {
        const image = { url: 'https://p.test/1.jpg', width: 800, height: 1000 };
        expect(og(pageMetadata({ url, title: 'T', description: 'D', image })).images).toEqual([image]);
    });

    it('uses an absolute title as the Open Graph title', () => {
        expect(og(pageMetadata({ url, title: { absolute: 'X' }, description: 'D' })).title).toBe('X');
    });
});
