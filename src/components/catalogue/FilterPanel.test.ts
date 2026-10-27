import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '@/lib/config';
import type { CatalogueQuery, Filters } from '@/lib/definitions';
import { splitFacet } from './FilterGroup';
import { FilterPanel } from './FilterPanel';

const facet = (...values: string[]) => values.map(value => ({ value, count: 987 }));
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34'];

const filters = (over: Partial<Filters> = {}): Filters => ({
    brand: facet('Acme', 'Northwind'), size: facet(...SIZES), colour: facet('Navy', 'Ochre'), era: facet('1990s'),
    material: facet('Cotton'), category: facet('clothing'), type: facet('knit', 'shirt'),
    condition: facet('A', 'AB'), department: facet('mens'),
    priceCents: { min: 1250, max: 8500 }, pitToPitMm: { min: 500, max: 560 }, lengthMm: null,
    ...over,
});
const query = (lists: Partial<CatalogueQuery['lists']> = {}, ranges: Partial<CatalogueQuery['ranges']> = {}): CatalogueQuery => ({
    lists:  { ...Object.fromEntries(CATALOGUE.lists.map(k => [k, []])), ...lists } as CatalogueQuery['lists'],
    ranges: { price: { min: null, max: null }, pitToPit: { min: null, max: null }, length: { min: null, max: null }, ...ranges },
    q: '', sort: 'newest', page: 1,
});
const render = (f: Filters, q: CatalogueQuery, mode: 'instant' | 'apply' = 'instant') =>
    renderToStaticMarkup(createElement(FilterPanel, { filters: f, query: q, currency: 'EUR', mode }));

const ORDER = ['Brand', 'Category', 'Size', 'Colour', 'Price', 'Era', 'Condition', 'Department', 'Material', 'Pit to pit', 'Length'];
// Task 2 adds Colour and the sliders to this set
const CHECKBOX = new Set(['Brand', 'Category', 'Size', 'Era', 'Condition', 'Department', 'Material']);
const headings = (html: string) => [...html.matchAll(/<summary[^>]*>\s*<span[^>]*>([^<]+)<\/span>/g)].map(m => m[1]).filter(h => ORDER.includes(h));

describe('splitFacet', () => {
    const values = Array.from({ length: 10 }, (_, i) => `v${i + 1}`);
    it('shows the first 8 and hides the rest', () => {
        expect(splitFacet(values, [], 8)).toEqual({ shown: values.slice(0, 8), more: ['v9', 'v10'] });
    });
    it('keeps a selected value beyond the first 8 visible', () => {
        const { shown, more } = splitFacet(values, ['v10'], 8);
        expect(shown).toEqual([...values.slice(0, 8), 'v10']);
        expect(more).toEqual(['v9']);
    });
});

describe('FilterPanel', () => {
    it('lists the groups in the mockup order', () => {
        const got = headings(render(filters(), query()));
        expect(got).toEqual(ORDER.filter(g => g !== 'Length' && CHECKBOX.has(g)));
    });

    it('renders no group for an empty facet or a null range', () => {
        const got = headings(render(filters({ era: [], pitToPitMm: null }), query()));
        expect(got).not.toContain('Era');
        expect(got).not.toContain('Pit to pit');
        expect(got).not.toContain('Length');
    });

    it('never shows a facet count', () => {
        expect(render(filters(), query())).not.toContain('987');
    });

    it('puts a selected value beyond the first 8 before the Show more summary', () => {
        const html = render(filters(), query({ size: ['34'] }));
        const checked = html.indexOf('value="34"');
        expect(checked).toBeGreaterThan(-1);
        expect(html.slice(html.lastIndexOf('<input', checked), checked + 20)).toContain('checked');
        expect(checked).toBeLessThan(html.indexOf('Show more'));
    });

    it('uses the label words for type and condition codes', () => {
        const html = render(filters(), query());
        expect(html).toContain('Knitwear');
        expect(html).toContain('AB Very good');
    });

    it('names the Category checkboxes type and sends no category param', () => {
        const html = render(filters(), query());
        expect(html).toContain('name="type"');
        expect(html).not.toContain('name="category"');
    });

    it('opens the first groups and closes Era unless one is selected', () => {
        const closed = render(filters(), query());
        const open = render(filters(), query({ era: ['1990s'] }));
        const era = (html: string) => html.slice(html.lastIndexOf('<details', html.indexOf('>Era<')), html.indexOf('>Era<'));
        expect(era(closed)).not.toContain('open');
        expect(era(open)).toContain('open');
        expect(closed).toMatch(/<details[^>]*open[^>]*>\s*<summary[^>]*>\s*<span[^>]*>Brand/);
    });

    it('is a GET form to /shop with a no-JS Apply filters submit in instant mode', () => {
        const html = render(filters(), query());
        expect(html).toContain('action="/shop"');
        expect(html).toContain('method="get"');
        expect(html).toMatch(/<noscript>.*Apply filters/);
    });
});
