import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import { BRAND_LOGOS } from '@/shop/brand-logos';
import { BrandGrid } from './BrandGrid';

const render = (brands: { name: string; slug: string }[]) => renderToStaticMarkup(createElement(BrandGrid, { brands }));
const logoSlug = BRAND_LOGOS[0];

describe('BrandGrid', () => {
    it('shows the empty message and no list for no brands', () => {
        const html = render([]);
        expect(html).toContain(COPY.stock.empty);
        expect(html).not.toContain('<ul');
    });

    it('links each tile to its brand page, in the order given', () => {
        const html = render([{ name: 'Zed Co', slug: 'zed-co' }, { name: 'Abc Co', slug: 'abc-co' }]);
        expect(html.match(/<li/g)).toHaveLength(2);
        expect(html.indexOf('href="/brands/zed-co"')).toBeLessThan(html.indexOf('href="/brands/abc-co"'));
    });

    it('shows the logo with the name as alt when the manifest has the slug', () => {
        const html = render([{ name: 'Logo Name', slug: logoSlug }]);
        expect(html).toContain(`src="/brands/${logoSlug}.svg"`);
        expect(html).toContain('alt="Logo Name"');
        expect(html).toContain('mix-blend-multiply');
        expect(html).toContain('loading="lazy"');
    });

    it('shows the name in the heading font, clamped, when there is no logo', () => {
        const html = render([{ name: 'No Logo Brand', slug: 'no-logo-brand' }]);
        expect(html).toContain('No Logo Brand');
        expect(html).toContain('font-heading');
        expect(html).toContain('line-clamp-2');
        expect(html).not.toContain('<img');
    });
});
