import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/lib/routes';
import { cn, isBuilt, isNavActive } from './utils';

describe('isNavActive', () => {
    it('matches Home only exactly', () => {
        expect(isNavActive('/', '/')).toBe(true);
        expect(isNavActive('/shop', '/')).toBe(false);
    });

    it('matches a route and its subtree, not a longer sibling', () => {
        expect(isNavActive('/shop', '/shop')).toBe(true);
        expect(isNavActive('/shop/x', '/shop')).toBe(true);
        expect(isNavActive('/shopping', '/shop')).toBe(false);
    });
});

describe('isBuilt', () => {
    it('is true for the home and shop pages, with or without a query', () => {
        expect(isBuilt('/')).toBe(true);
        expect(isBuilt('/shop')).toBe(true);
        expect(isBuilt('/shop?brand=Acme')).toBe(true);
    });

    it('is false for pages that do not exist yet', () => {
        for (const href of [ROUTES.item('BT-1'), ROUTES.brands, ROUTES.justDropped, ROUTES.about, ROUTES.contact]) expect(isBuilt(href)).toBe(false);
    });
});

describe('cn', () => {
    it('skips falsy values and lets the later class win', () => {
        expect(cn('w-full', false, null, undefined, 'w-20')).toBe('w-20');
    });

    it('keeps the custom font sizes next to a text colour', () => {
        expect(cn('text-label', 'text-ivory')).toBe('text-label text-ivory');
        expect(cn('inline-flex text-label uppercase bg-forest text-ivory')).toContain('text-label');
    });

    it('still lets one font size replace another', () => {
        expect(cn('text-label', 'text-heading')).toBe('text-heading');
    });
});
