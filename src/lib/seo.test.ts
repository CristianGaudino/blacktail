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
    it('keeps a clean listing out of search while the site is not indexable', () => {
        expect(listingRobots(query())).toEqual({ index: false, follow: false });
        expect(listingRobots(query({ page: 2 }))).toEqual({ index: false, follow: false });
        expect(listingRobots(query({ sort: 'newest' }))).toEqual({ index: false, follow: false });
    });

    it('gives noindex, follow to filtered, searched, ranged and sorted listings', () => {
        expect(listingRobots(query({}, { brand: ['Acme'] }))).toEqual({ index: false, follow: true });
        expect(listingRobots(query({ q: 'coat' }))).toEqual({ index: false, follow: true });
        expect(listingRobots(query({ sort: 'price_asc' }))).toEqual({ index: false, follow: true });
        expect(listingRobots(query({ ranges: { price: { min: 2000, max: null }, pitToPit: { min: null, max: null }, length: { min: null, max: null } } }))).toEqual({ index: false, follow: true });
    });
});

describe('canonicalUrl', () => {
    it('is the bare shop URL for an empty query, with or without a trailing slash', () => {
        expect(canonicalUrl('https://shop.test', query())).toBe('https://shop.test/shop');
        expect(canonicalUrl('https://shop.test/', query())).toBe('https://shop.test/shop');
    });

    it('uses the same sorted serialisation as links, including the page', () => {
        expect(canonicalUrl('https://shop.test', query({ page: 2 }, { brand: ['Acme'] }))).toBe('https://shop.test/shop?brand=Acme&page=2');
    });
});
