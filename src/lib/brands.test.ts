import { describe, expect, it } from 'vitest';
import { brandIndex, brandSlug } from './brands';

describe('brandSlug', () => {
    it.each([
        ["Arc'teryx", 'arcteryx'],
        ["Levi's", 'levis'],
        ['Levi’s', 'levis'],
        ['Dr. Martens', 'dr-martens'],
        ['Stüssy', 'stussy'],
        ['The North Face', 'the-north-face'],
        ['  Nike  ', 'nike'],
        ['Mock Brand', 'mock-brand'],
        ['A.P.C.', 'a-p-c'],
    ])('%s -> %s', (name, slug) => {
        expect(brandSlug(name)).toBe(slug);
    });

    it('gives an empty slug for a name with no Latin letters or digits', () => {
        expect(brandSlug('東京')).toBe('');
        expect(brandSlug('***')).toBe('');
    });
});

describe('brandIndex', () => {
    it('sorts A to Z ignoring case', () => {
        expect(brandIndex(['Northwind', 'acme', 'Mock Brand']).map(b => b.name)).toEqual(['acme', 'Mock Brand', 'Northwind']);
    });

    it('keeps one entry per slug, the first in API order', () => {
        expect(brandIndex(['Stüssy', 'Stussy'])).toEqual([{ name: 'Stüssy', slug: 'stussy' }]);
    });

    it('drops a name with an empty slug', () => {
        expect(brandIndex(['東京', 'Acme'])).toEqual([{ name: 'Acme', slug: 'acme' }]);
    });
});
