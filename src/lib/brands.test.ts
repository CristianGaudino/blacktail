import { describe, expect, it } from 'vitest';
import { brandSlug } from './brands';

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
