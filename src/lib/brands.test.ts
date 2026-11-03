import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND_LOGOS } from '@/shop/brand-logos';
import { brandBySlug, brandIndex, brandSlug, linkableSlug, SOLD_BEFORE_BRANDS } from './brands';

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

describe('BRAND_LOGOS', () => {
    it('lists exactly the .svg files in public/brands, each already in slug form', () => {
        const files = readdirSync(join(process.cwd(), 'public', 'brands')).filter(f => f.endsWith('.svg')).map(f => f.slice(0, -4)).sort();
        expect([...BRAND_LOGOS].sort()).toEqual(files);
        for (const slug of BRAND_LOGOS) expect(brandSlug(slug)).toBe(slug);
    });
});

describe('brandBySlug', () => {
    it('resolves an in-stock brand', () => expect(brandBySlug('acme', ['Acme', 'Northwind'], [])).toBe('Acme'));
    it('resolves a sold-before brand with no stock', () => expect(brandBySlug('barbour', ['Acme'], ['Barbour'])).toBe('Barbour'));
    it('gives undefined for a slug in neither list', () => expect(brandBySlug('not-a-brand', ['Acme'], ['Barbour'])).toBeUndefined());
    it('lets the in-stock name win a slug collision', () => expect(brandBySlug('levis', ['LEVIS'], ["Levi's"])).toBe('LEVIS'));
    it('ships an empty sold-before list until BRAND-05', () => expect(SOLD_BEFORE_BRANDS).toEqual([]));
});

describe('linkableSlug', () => {
    const names = ["Arc'teryx", 'Arcteryx', 'Acme', '日本'];
    it('links the name that owns the slug', () => expect(linkableSlug("Arc'teryx", names)).toBe('arcteryx'));
    it('gives the name that lost a collision no link', () => expect(linkableSlug('Arcteryx', names)).toBe(''));
    it('gives a name with no slug no link', () => expect(linkableSlug('日本', names)).toBe(''));
    it('gives a brand missing from the list no link', () => expect(linkableSlug('Nike', names)).toBe(''));
});
