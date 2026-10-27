import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery, Filters } from '@/lib/definitions';
import { FilterChips } from './FilterChips';

const query = (over: Partial<CatalogueQuery> = {}, lists: Partial<CatalogueQuery['lists']> = {}): CatalogueQuery => ({
    lists: { ...Object.fromEntries(CATALOGUE.lists.map(k => [k, []])), ...lists } as CatalogueQuery['lists'],
    ranges: { price: { min: null, max: null }, pitToPit: { min: null, max: null }, length: { min: null, max: null } },
    q: '', sort: 'newest', page: 1, ...over,
});
const filters = {
    priceCents: { min: 1250, max: 8500 }, pitToPitMm: { min: 500, max: 600 }, lengthMm: { min: 600, max: 800 },
} as unknown as Filters;
const render = (q: CatalogueQuery) => renderToStaticMarkup(createElement(FilterChips, { query: q, filters, currency: 'EUR' }));

describe('FilterChips', () => {
    it('renders nothing when nothing is chosen', () => {
        expect(render(query())).toBe('');
    });

    it('shows one removable chip per choice and a Clear all link', () => {
        const html = render(query({}, { brand: ['Acme'], colour: ['Navy'] }));
        expect(html).toContain('href="/shop?colour=Navy"');
        expect(html).toContain('href="/shop?brand=Acme"');
        expect(html).toContain('aria-label="Remove filter: Acme"');
        expect(html).toContain('aria-label="Remove filter: Navy"');
        expect(html).toContain(`href="/shop">${COPY.catalogue.clearAll}<`);
    });

    it('uses the panel wording for type, condition and department codes', () => {
        const html = render(query({}, { type: ['knit'], condition: ['AB'], department: ['mens'] }));
        expect(html).toContain('>Knitwear<');
        expect(html).toContain('>AB Very good<');
        expect(html).toContain('>Mens<');
    });

    it('formats a price range with the open side from /filters', () => {
        const html = render(query({ ranges: { price: { min: 2000, max: null }, pitToPit: { min: null, max: null }, length: { min: null, max: null } } }));
        expect(html).toContain('€20 to €85');
    });

    it('formats measurements in cm', () => {
        const html = render(query({ ranges: { price: { min: null, max: null }, pitToPit: { min: 520, max: 560 }, length: { min: 650, max: null } } }));
        expect(html).toContain('Pit to pit 52 to 56 cm');
        expect(html).toContain('Length 65 to 80 cm');
    });

    it('escapes the search text', () => {
        const html = render(query({ q: '<script>alert(1)</script>' }));
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>alert');
    });

    it('drops page from every chip link and wraps long labels', () => {
        const html = render(query({ page: 3 }, { brand: ['A very long brand name'] }));
        expect(html).not.toContain('page=');
        expect(html).toContain('[overflow-wrap:anywhere]');
    });
});
