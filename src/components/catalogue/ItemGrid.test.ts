import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { ItemGrid } from './ItemGrid';

const NOW = Date.parse('2026-06-10T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const item: Item = {
    code: 'BT-0001', title: 'Wool coat', brand: 'Acme', category: 'clothing', type: null, size: 'L', condition: 'A', colour: 'Navy', era: '90s',
    department: null, measurements: { pitToPitMm: 580, lengthMm: 700 }, details: {}, priceCents: 12000, currency: 'EUR',
    photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }],
    publishedAt: new Date(NOW - 30 * DAY).toISOString(),
};
const render = (items: Item[], extra: { asOf?: string | null } = {}) =>
    renderToStaticMarkup(createElement(ItemGrid, { items, asOf: extra.asOf ?? null, now: NOW }));
const many = (n: number): Item[] => Array.from({ length: n }, (_, i) => ({ ...item, code: `BT-${i}` }));

describe('ItemGrid', () => {
    it('shows the empty message and no list when nothing is in stock', () => {
        const html = render([]);
        expect(html).toContain(COPY.stock.empty);
        expect(html).not.toContain('<ul');
    });

    it('shows a given empty node instead of the default message', () => {
        const html = renderToStaticMarkup(createElement(ItemGrid, { items: [], asOf: null, now: NOW, empty: createElement('p', null, 'Custom empty') }));
        expect(html).toContain('Custom empty');
        expect(html).not.toContain(COPY.stock.empty);
    });

    it('links a card to its item and never prints "null" for missing fields', () => {
        const html = render([{ ...item, brand: null, size: null, colour: null, era: null }]);
        expect(html).toContain('href="/items/BT-0001"');
        expect(html).toContain('alt="Wool coat"');
        expect(html).not.toContain('null');
    });

    it('joins brand and title for the alt text', () => {
        expect(render([item])).toContain('alt="Acme Wool coat"');
    });

    it('formats prices from cents in the item\'s own currency, dropping empty cents', () => {
        expect(render([{ ...item, priceCents: 11950 }])).toContain('€119.50');
        expect(render([item])).toContain('€120<');
    });

    it('builds the Colour / Size line from whichever halves exist', () => {
        expect(render([item])).toContain('Navy / L');
        expect(render([{ ...item, size: null }])).toContain('>Navy<');
        expect(render([{ ...item, colour: null }])).toContain('>L<');
        const none = render([{ ...item, colour: null, size: null }]);
        expect(none).not.toContain('text-olive');
        expect(none).not.toContain(' / ');
    });

    it('loads only the first 4 images eagerly', () => {
        // React also hoists a preload <link> for each high-priority image, so count img tags only
        const imgs = render(many(5)).match(/<img[^>]*>/g) ?? [];
        expect(imgs).toHaveLength(5);
        expect(imgs.filter(tag => tag.includes('loading="eager"') && /fetchpriority="high"/i.test(tag))).toHaveLength(4);
        expect(imgs.filter(tag => tag.includes('loading="lazy"'))).toHaveLength(1);
    });

    it('keeps the frame and drops the img when an item has no photo', () => {
        const html = render([{ ...item, photos: [] }]);
        expect(html).toContain('aspect-[4/5]');
        expect(html).not.toContain('<img');
    });

    it('badges a piece published a day ago as New and one from 30 days ago not', () => {
        expect(render([{ ...item, publishedAt: new Date(NOW - DAY).toISOString() }])).toContain(`>${COPY.catalogue.newBadge}<`);
        expect(render([item])).not.toContain(`>${COPY.catalogue.newBadge}<`);
    });

    it('draws the heart as decoration, not a button', () => {
        const html = render([item]);
        expect(html).toContain('aria-hidden="true"');
        expect(html).not.toContain('<button');
    });

    it('renders two cards for items that differ only by code', () => {
        expect(render([item, { ...item, code: 'BT-0002' }]).match(/<li>/g)).toHaveLength(2);
    });

    it('keeps the order it was given', () => {
        const html = render([{ ...item, code: 'B-2' }, { ...item, code: 'A-1' }]);
        expect(html.indexOf('/items/B-2')).toBeLessThan(html.indexOf('/items/A-1'));
    });

    it('never shows fields outside the schema', () => {
        const leaky = { ...item, notes: 'SECRET-NOTE', cost: 'SECRET-COST' } as unknown as Item;
        const html = render([leaky]);
        expect(html).not.toContain('SECRET');
    });

    it('carries asOf as data-as-of; the results anchor lives on the toolbar', () => {
        const html = render([item], { asOf: 'Mon, 01 Jun 2026 10:00:00 GMT' });
        expect(html).toContain('data-as-of="Mon, 01 Jun 2026 10:00:00 GMT"');
        expect(html).not.toContain('id="results"');
    });
});
