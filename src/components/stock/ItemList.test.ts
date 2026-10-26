import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { ItemList } from './ItemList';

const item: Item = {
    code: 'BT-0001', title: 'Wool coat', brand: 'Acme', category: 'clothing', type: null, size: 'L', condition: 'A', colour: 'Navy', era: '90s',
    department: null, measurements: { pitToPitMm: 580, lengthMm: 700 }, details: {}, priceCents: 12000, currency: 'EUR',
    photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }], publishedAt: '2026-01-01T00:00:00Z',
};
const render = (items: Item[]) => renderToStaticMarkup(createElement(ItemList, { items, asOf: null }));

describe('ItemList', () => {
    it('shows the empty message and no list when nothing is in stock', () => {
        const html = render([]);
        expect(html).toContain(COPY.stock.empty);
        expect(html).not.toContain('<ul');
    });

    it('leaves the brand out, and never prints "null", when an item has no brand', () => {
        const html = render([{ ...item, brand: null, size: null, colour: null, era: null }]);
        expect(html).toContain('Wool coat');
        expect(html).not.toContain('null');
        expect(html).toContain('alt="Wool coat"');
    });

    it('formats each price in the item\'s own currency', () => {
        expect(render([{ ...item, currency: 'USD', priceCents: 2500 }])).toMatch(/\$25\.00|US\$/);
    });
});
