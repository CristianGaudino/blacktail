import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '@/lib/config';
import type { CatalogueQuery } from '@/lib/definitions';
import { Pager } from './Pager';

const query = (over: Partial<CatalogueQuery> = {}, brand: string[] = []): CatalogueQuery => ({
    lists: { ...Object.fromEntries(CATALOGUE.lists.map(k => [k, []])), brand } as CatalogueQuery['lists'],
    ranges: { price: { min: null, max: null }, pitToPit: { min: null, max: null }, length: { min: null, max: null } },
    q: '', sort: 'newest', page: 1, ...over,
});
const render = (q: CatalogueQuery, pageCount: number) => renderToStaticMarkup(createElement(Pager, { query: q, pageCount }));

describe('Pager', () => {
    it('renders nothing for a single page', () => {
        expect(render(query(), 1)).toBe('');
    });

    it('marks the current page and links previous and next', () => {
        const html = render(query({ page: 2 }), 3);
        expect(html).toContain('aria-current="page"');
        expect(html).toContain('href="/shop#results"');
        expect(html).toContain('href="/shop?page=3#results"');
    });

    it('keeps filters when it changes page', () => {
        expect(render(query({}, ['Acme']), 3)).toContain('href="/shop?brand=Acme&amp;page=2#results"');
    });

    it('shows the gap twice on page 5 of 9 and never writes page=1', () => {
        const html = render(query({ page: 5 }), 9);
        expect(html.match(/…/g)).toHaveLength(2);
        expect(html).not.toContain('page=1');
    });
});
