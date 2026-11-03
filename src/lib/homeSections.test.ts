import { describe, expect, it } from 'vitest';
import { stripBrands } from './homeSections';

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
