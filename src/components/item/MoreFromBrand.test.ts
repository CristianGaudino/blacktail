import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { MoreFromBrand } from './MoreFromBrand';

const NOW = Date.parse('2026-06-10T12:00:00Z');
const base: Item = {
    code: 'BT-0', title: 'Wool coat', brand: 'Acme', category: 'clothing', type: null, size: 'L', condition: 'A', colour: 'Navy', era: '90s',
    department: null, measurements: { pitToPitMm: 580, lengthMm: 700 }, details: {}, priceCents: 12000, currency: 'EUR',
    photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }],
    publishedAt: '2026-01-01T00:00:00Z',
};
const items = (n: number): Item[] => Array.from({ length: n }, (_, i) => ({ ...base, code: `BT-${i + 1}` }));
const render = (list: Item[], slug = 'acme', code = 'BT-1') =>
    renderToStaticMarkup(createElement(MoreFromBrand, { brand: 'Acme', slug, code, items: list, now: NOW }));

describe('MoreFromBrand', () => {
    it('leaves out the current piece and keeps the given order', () => {
        const html = render(items(3));
        expect(html).not.toContain('/items/BT-1"');
        expect(html.indexOf('/items/BT-2"')).toBeGreaterThan(-1);
        expect(html.indexOf('/items/BT-2"')).toBeLessThan(html.indexOf('/items/BT-3"'));
    });

    it('shows at most 4 cards', () => {
        expect(render(items(10)).split('<li>').length - 1).toBe(4);
    });

    it('renders nothing when no other piece is left', () => {
        expect(render(items(1))).toBe('');
        expect(render([])).toBe('');
    });

    it('has the heading, a labelled View all link to the brand page, and no eager image', () => {
        const html = render(items(3));
        expect(html).toContain(COPY.item.moreFrom('Acme'));
        expect(html).toContain('href="/brands/acme"');
        expect(html).toContain(`aria-label="${COPY.item.viewAllLabel('Acme')}"`);
        expect(html).not.toContain('loading="eager"');
    });

    it('drops the View all link when the brand has no slug', () => {
        expect(render(items(3), '')).not.toContain('/brands/');
    });
});
