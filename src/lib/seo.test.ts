import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '@/lib/config';
import type { CatalogueQuery } from '@/lib/definitions';
import { canonicalUrl, listingRobots } from './seo';

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
