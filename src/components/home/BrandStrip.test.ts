import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import { BRAND_LOGOS } from '@/shop/brand-logos';
import { BrandRow } from './BrandStrip';

const render = (brands: { name: string; slug: string }[]) => renderToStaticMarkup(createElement(BrandRow, { brands }));
const logoSlug = BRAND_LOGOS[0];

describe('BrandRow', () => {
    it('renders nothing for no brands', () => {
        expect(render([])).toBe('');
    });

    it('links each brand to its page in the order given, with a View all brands link', () => {
        const html = render([{ name: 'Zed Co', slug: 'zed-co' }, { name: 'Abc Co', slug: 'abc-co' }]);
        expect(html.indexOf('href="/brands/zed-co"')).toBeLessThan(html.indexOf('href="/brands/abc-co"'));
        expect(html).toContain('href="/brands"');
        expect(html).toContain(COPY.home.viewAllBrands);
    });

    it('shows the logo with the name as alt when the manifest has the slug', () => {
        const html = render([{ name: 'Logo Name', slug: logoSlug }]);
        expect(html).toContain(`src="/brands/${logoSlug}.svg"`);
        expect(html).toContain('alt="Logo Name"');
        expect(html).toContain('mix-blend-multiply');
    });

    it('shows the name in the heading font, on one line, when there is no logo', () => {
        const html = render([{ name: 'No Logo Brand', slug: 'no-logo-brand' }]);
        expect(html).toContain('No Logo Brand');
        expect(html).toContain('font-heading');
        expect(html).toContain('whitespace-nowrap');
        expect(html).not.toContain('<img');
    });
});
