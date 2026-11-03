import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { carouselEdges, JustDroppedCarousel } from './JustDroppedCarousel';

describe('carouselEdges', () => {
    it('is not overflowing, and at both ends, when everything fits', () => {
        expect(carouselEdges(0, 300, 300)).toEqual({ overflows: false, atStart: true, atEnd: true });
    });

    it('overflows at the start of a longer track', () => {
        expect(carouselEdges(0, 300, 900)).toEqual({ overflows: true, atStart: true, atEnd: false });
    });

    it('is at the end with a 1px tolerance for fractional widths', () => {
        expect(carouselEdges(600, 300, 900).atEnd).toBe(true);
        expect(carouselEdges(599.5, 300, 900).atEnd).toBe(true);
        expect(carouselEdges(598, 300, 900).atEnd).toBe(false);
    });

    it('is at the start within 1px', () => {
        expect(carouselEdges(1, 300, 900).atStart).toBe(true);
        expect(carouselEdges(2, 300, 900).atStart).toBe(false);
    });
});

describe('JustDroppedCarousel', () => {
    const cards = ['one', 'two', 'three'].map(text => createElement('li', { key: text }, text));
    const props = { headingId: 'the-heading', heading: 'A heading', eyebrow: 'An eyebrow', children: cards };
    const html = renderToStaticMarkup(createElement(JustDroppedCarousel, props));

    it('is a labelled carousel region', () => {
        expect(html).toContain('role="region"');
        expect(html).toContain('aria-roledescription="carousel"');
        expect(html).toContain('aria-labelledby="the-heading"');
        expect(html).toMatch(/<h2 id="the-heading"[^>]*>A heading<\/h2>/);
    });

    it('holds the children in one list', () => {
        expect(html.match(/<ul/g)).toHaveLength(1);
        expect(html.match(/<li/g)).toHaveLength(3);
    });

    it('has no arrows until the script has measured an overflow', () => {
        expect(html).not.toContain('<button');
    });
});
