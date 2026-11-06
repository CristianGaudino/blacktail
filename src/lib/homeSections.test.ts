import { describe, expect, it } from 'vitest';
import type { Item } from '@/lib/definitions';
import { spotlightFirst, stripBrands, visibleTiles } from './homeSections';

const names = (brands: { name: string }[]) => brands.map(b => b.name);

describe('stripBrands', () => {
    it('sorts A to Z with slugs when nothing is ranked', () => {
        expect(stripBrands(['Northwind', 'Acme', 'Mock Brand'], [], [])).toEqual([
            { name: 'Acme', slug: 'acme' },
            { name: 'Mock Brand', slug: 'mock-brand' },
            { name: 'Northwind', slug: 'northwind' },
        ]);
    });

    it('ranks by the default order matched on slug, unranked after, A to Z', () => {
        expect(names(stripBrands(['Acme', 'LEVIS', 'Northwind'], [], ['Northwind', "Levi's"]))).toEqual(['Northwind', 'LEVIS', 'Acme']);
    });

    it('puts sold-before brands after every in-stock brand and ranks inside each tier', () => {
        expect(names(stripBrands(['Acme', 'Nike'], ['Zed', 'Acme', 'Barbour'], ['Barbour']))).toEqual(['Acme', 'Nike', 'Barbour', 'Zed']);
    });

    it('never adds a default-order brand that has neither stock nor sold history', () => {
        expect(names(stripBrands(['Acme'], [], ['Nike', 'Acme']))).toEqual(['Acme']);
    });

    it('caps the strip at 16 brands', () => {
        const many = Array.from({ length: 20 }, (_, i) => `Brand ${String.fromCharCode(65 + i)}`);
        expect(stripBrands(many, [], [])).toHaveLength(16);
    });

    it('gives nothing when there is nothing to show', () => {
        expect(stripBrands([], [], ['Nike'])).toEqual([]);
    });

    it('drops a name with an empty slug', () => {
        expect(names(stripBrands(['東京', 'Acme'], [], []))).toEqual(['Acme']);
    });
});

describe('spotlightFirst', () => {
    const base: Item = {
        code: 'X', title: 'Wool coat', brand: 'Acme', category: 'clothing', type: null, size: 'L', condition: 'A', colour: 'Navy', era: '90s',
        department: null, measurements: { pitToPitMm: 580, lengthMm: 700 }, details: {}, priceCents: 12000, currency: 'EUR',
        photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }],
        publishedAt: '2026-06-10T12:00:00Z',
    };
    const list = (...codes: string[]): Item[] => codes.map(code => ({ ...base, code }));
    const codes = (items: Item[]) => items.map(i => i.code);

    it('puts spotlight pieces first, then the newest', () => {
        expect(codes(spotlightFirst(list('S1', 'S2'), list('N1', 'N2'), 10))).toEqual(['S1', 'S2', 'N1', 'N2']);
    });

    it('shows a piece in both lists once, at its spotlight position', () => {
        expect(codes(spotlightFirst(list('N2'), list('N1', 'N2', 'N3'), 10))).toEqual(['N2', 'N1', 'N3']);
    });

    it('is exactly the newest list cut to size when nothing is spotlighted', () => {
        expect(codes(spotlightFirst([], list('N1', 'N2', 'N3', 'N4'), 3))).toEqual(['N1', 'N2', 'N3']);
    });

    it('cuts a long spotlight list to size and shows no newest piece', () => {
        expect(codes(spotlightFirst(list('S1', 'S2', 'S3'), list('N1'), 2))).toEqual(['S1', 'S2']);
    });

    it('gives nothing when both lists are empty', () => {
        expect(spotlightFirst([], [], 10)).toEqual([]);
    });
});

describe('visibleTiles', () => {
    const tile = (type: string) => ({ type, label: type, image: `/images/${type}.jpg` });
    const types = [{ value: 'jacket', count: 3 }, { value: 'knit', count: 0 }, { value: 'shirt', count: 1 }];

    it('keeps a tile whose type has stock, matching case-insensitively', () => {
        expect(visibleTiles([tile('Jacket')], types).map(t => t.type)).toEqual(['Jacket']);
    });

    it('drops a tile whose type is absent or has a zero count', () => {
        expect(visibleTiles([tile('jeans'), tile('knit')], types)).toEqual([]);
    });

    it('keeps config order and caps at 4', () => {
        const many = ['a', 'b', 'c', 'd', 'e'].map(v => ({ value: v, count: 1 }));
        expect(visibleTiles(['e', 'a', 'b', 'c', 'd'].map(tile), many).map(t => t.type)).toEqual(['e', 'a', 'b', 'c']);
    });

    it('gives nothing for an empty list', () => {
        expect(visibleTiles([], types)).toEqual([]);
    });
});
