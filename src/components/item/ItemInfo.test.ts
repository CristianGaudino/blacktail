import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { SHOP } from '@/shop/config';
import { ItemDetails } from './ItemDetails';
import { ItemJsonLd } from './ItemJsonLd';
import { WhereToBuy } from './WhereToBuy';

const item: Item = {
    code: 'BT-0001', title: 'Wool coat', brand: 'Acme', category: 'clothing', type: null, size: 'L', condition: 'A', colour: 'Navy', era: '90s',
    department: 'mens', measurements: { pitToPitMm: 560, lengthMm: 700 }, details: {}, priceCents: 12000, currency: 'EUR',
    photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }],
    publishedAt: '2026-01-01T00:00:00Z',
};
const details = (over: Partial<Item>) => renderToStaticMarkup(createElement(ItemDetails, { item: { ...item, ...over } }));
const ld = (over: Partial<Item> = {}) => renderToStaticMarkup(createElement(ItemJsonLd, { item: { ...item, ...over }, url: 'https://shop.test/items/BT-0001' }));
const ldBody = (html: string) => html.match(/<script[^>]*>([\s\S]*)<\/script>/)![1];

describe('ItemDetails', () => {
    it('leaves out a row whose value is an empty string or null', () => {
        const html = details({ size: '', colour: '', era: '', department: null });
        for (const group of ['size', 'colour', 'era', 'department'] as const) expect(html).not.toContain(`>${COPY.catalogue.groups[group]}<`);
        expect(html).toContain(`>${COPY.catalogue.groups.condition}<`);
    });

    it('shows the condition and department in words, and an unknown code as itself', () => {
        expect(details({ condition: 'A' })).toContain('>A Excellent<');
        expect(details({ condition: 'AB' })).toContain('>AB Very good<');
        expect(details({ condition: 'C' })).toContain('>C<');
        expect(details({ department: 'womens' })).toContain('>Womens<');
    });

    it('takes the top-level material first, then details.material', () => {
        expect(details({ material: 'Wool', details: { material: 'Cotton' } })).toContain('>Wool<');
        expect(details({ material: 'Wool', details: { material: 'Cotton' } })).not.toContain('>Cotton<');
        expect(details({ details: { material: 'Cotton' } })).toContain('>Cotton<');
    });

    it('adds no material row for a number, an empty string or nothing', () => {
        for (const over of [{ details: { material: 5 } }, { material: '', details: {} }, { details: {} }]) {
            expect(details(over)).not.toContain(`>${COPY.catalogue.groups.material}<`);
        }
    });

    it('never prints anything else from details', () => {
        expect(details({ details: { costCents: 'SECRET', notes: 'SECRET' } })).not.toContain('SECRET');
    });

    it('shows measurements in cm and inches', () => {
        const html = details({ measurements: { pitToPitMm: 560, lengthMm: 700 } });
        expect(html).toContain('56 cm / 22 in');
        expect(html).toContain('70 cm / 28 in');
    });

    it('hides the Measurements block when both are missing, and keeps the other row when one is', () => {
        expect(details({ measurements: { pitToPitMm: null, lengthMm: null } })).not.toContain(COPY.item.measurements);
        const one = details({ measurements: { pitToPitMm: 510, lengthMm: null } });
        expect(one).toContain('51 cm / 20 in');
        expect(one).toContain(`>${COPY.catalogue.groups.pitToPit}<`);
        expect(one).not.toContain(`>${COPY.catalogue.groups.length}<`);
    });
});

describe('WhereToBuy', () => {
    const html = renderToStaticMarkup(createElement(WhereToBuy));

    it('links each platform profile in a new tab with rel noopener noreferrer', () => {
        for (const platform of SHOP.platforms) {
            expect(html).toMatch(new RegExp(`<a [^>]*href="${platform.url}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>`));
            expect(html).toContain(COPY.item.visitOn(platform.name));
        }
        expect(html.match(/<a /g)).toHaveLength(SHOP.platforms.length);
    });

    it('says the piece is listed on every platform', () => {
        for (const platform of SHOP.platforms) expect(html).toContain(platform.name);
        expect(html).toContain(COPY.item.listedOn('').trim());
    });
});

describe('ItemJsonLd', () => {
    it('escapes every < so a title cannot close the script tag', () => {
        const title = '</script><script>alert(1)</script>';
        const body = ldBody(ld({ title }));
        expect(body).not.toContain('<');
        expect(JSON.parse(body).name).toBe(title);
    });

    it('prices from cents with two decimals, in stock and used', () => {
        const data = JSON.parse(ldBody(ld()));
        expect(data.offers).toMatchObject({ price: '120.00', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/UsedCondition' });
        expect(JSON.parse(ldBody(ld({ priceCents: 11950 }))).offers.price).toBe('119.50');
    });

    it('leaves out image when the piece has no photos', () => {
        expect(JSON.parse(ldBody(ld({ photos: [] }))).image).toBeUndefined();
    });

    it('leaves out the brand when there is none, and never carries the code, details or cost', () => {
        expect(JSON.parse(ldBody(ld({ brand: null }))).brand).toBeUndefined();
        const leaky = ld({ details: { costCents: 'SECRET' }, notes: 'SECRET' } as unknown as Partial<Item>);
        expect(leaky).not.toContain('SECRET');
        const data = JSON.parse(ldBody(ld()));
        for (const key of ['sku', 'code', 'details']) expect(data).not.toHaveProperty(key);
    });
});
