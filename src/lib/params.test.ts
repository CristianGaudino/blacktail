import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '@/lib/config';
import type { Filters } from '@/lib/definitions';
import { clearFilters, hasFilters, pageHref, parseCatalogueQuery, rangeBounds, shopHref, toSearchString } from '@/lib/params';

const facet = (...values: string[]) => values.map((value, i) => ({ value, count: 10 - i }));
const filters: Filters = {
    brand:      facet('Nike', 'Acme'),
    type:       facet('shirt', 'knit'),
    size:       facet('M', 'L'),
    colour:     facet('Navy', 'Ochre'),
    era:        facet('1990s'),
    condition:  facet('A', 'AB'),
    department: facet('mens', 'womens'),
    material:   facet('Wool'),
    category:   facet('clothing'),
    priceCents: { min: 1250, max: 8500 },
    pitToPitMm: { min: 500, max: 560 },
    lengthMm:   null,
};
const parse = (raw: Record<string, string | string[] | undefined>, f: Filters = filters) => parseCatalogueQuery(raw, f);
const str = (raw: Record<string, string | string[] | undefined>, f: Filters = filters) => toSearchString(parse(raw, f));

describe('parseCatalogueQuery lists', () => {
    it('gives an empty query and an empty string for junk only', () => {
        const query = parse({ utm_source: 'x', brand: 'NotABrand', page: 'abc', sort: 'x', category: 'clothing' });
        expect(hasFilters(query)).toBe(false);
        expect(toSearchString(query)).toBe('');
    });

    it('sends the /filters spelling and collapses case variants', () => {
        expect(parse({ brand: ['nike', 'NIKE'] }).lists.brand).toEqual(['Nike']);
        expect(str({ brand: 'nike' })).toBe('brand=Nike');
    });

    it('works for every list key and keeps /filters order', () => {
        for (const key of CATALOGUE.lists) {
            const [first, second] = filters[key].map(f => f.value);
            const wanted = second ? [second.toUpperCase(), first.toLowerCase()] : [first.toUpperCase()];
            expect(parse({ [key]: wanted }).lists[key]).toEqual(second ? [first, second] : [first]);
        }
    });

    it('parses a string and a string[] the same, and takes the first of q, sort and page arrays', () => {
        expect(parse({ type: 'knit' })).toEqual(parse({ type: ['knit'] }));
        const query = parse({ q: ['Wool', 'Silk'], sort: ['price_asc', 'x'], page: ['2', '3'] });
        expect(query).toMatchObject({ q: 'wool', sort: 'price_asc', page: 2 });
    });

    it('drops a list whose /filters list is empty', () => {
        expect(parse({ era: '1990s' }, { ...filters, era: [] }).lists.era).toEqual([]);
    });
});

describe('parseCatalogueQuery ranges', () => {
    const price = (raw: Record<string, string>) => parse(raw).ranges.price;

    it('keeps one euro inside the bounds and drops values at or beyond them', () => {
        expect(price({ minPrice: '1200' })).toEqual({ min: null, max: null });
        expect(price({ minPrice: '1300' })).toEqual({ min: 1300, max: null });
        expect(price({ maxPrice: '8500' })).toEqual({ min: null, max: null });
        expect(price({ maxPrice: '8400' })).toEqual({ min: null, max: 8400 });
        expect(price({ maxPrice: '999999' })).toEqual({ min: null, max: null });
    });

    it('snaps to whole euros half-up', () => {
        expect(price({ minPrice: '2049' }).min).toBe(2000);
        expect(price({ minPrice: '2050' }).min).toBe(2100);
    });

    it('drops anything that is not plain digits', () => {
        for (const bad of ['-5', '20.5', '1e3', '', ' 2000', 'abc']) expect(price({ minPrice: bad })).toEqual({ min: null, max: null });
    });

    it('swaps min greater than max and keeps min equal to max', () => {
        expect(price({ minPrice: '5000', maxPrice: '3000' })).toEqual({ min: 3000, max: 5000 });
        expect(price({ minPrice: '3000', maxPrice: '3000' })).toEqual({ min: 3000, max: 3000 });
    });

    it('snaps measurements to 10 mm and drops them when /filters has no range', () => {
        expect(parse({ minPitToPitMm: '523' }).ranges.pitToPit.min).toBe(520);
        expect(parse({ minLengthMm: '600', maxLengthMm: '700' }).ranges.length).toEqual({ min: null, max: null });
        expect(parse({ minPitToPitMm: '530', maxPitToPitMm: '530' }).ranges.pitToPit).toEqual({ min: 530, max: 530 });
        expect(parse({ minPitToPitMm: '540', maxPitToPitMm: '520' }).ranges.pitToPit).toEqual({ min: 520, max: 540 });
    });

    it('computes bounds as min floored and max ceiled to the step', () => {
        expect(rangeBounds({ min: 1250, max: 8500 }, 100)).toEqual({ min: 1200, max: 8500 });
        expect(rangeBounds({ min: 1250, max: 8501 }, 100)).toEqual({ min: 1200, max: 8600 });
    });
});

describe('parseCatalogueQuery q, sort and page', () => {
    it('trims, collapses whitespace and lowercases q', () => {
        expect(parse({ q: '  Mock   ITEM ' }).q).toBe('mock item');
    });

    it('caps q at maxQueryChars code points without splitting a character', () => {
        const q = parse({ q: `${'a'.repeat(CATALOGUE.maxQueryChars - 1)}\u{1F600} more text` }).q;
        expect(Array.from(q)).toHaveLength(CATALOGUE.maxQueryChars);
        expect(q.endsWith('\u{1F600}')).toBe(true);
    });

    it('accepts exactly the three sorts and leaves newest out of the string', () => {
        expect(parse({ sort: 'price_asc' }).sort).toBe('price_asc');
        expect(parse({ sort: 'price_desc' }).sort).toBe('price_desc');
        for (const bad of ['newest', 'PRICE_ASC', 'x', '']) expect(parse({ sort: bad }).sort).toBe('newest');
        expect(str({ sort: 'newest' })).toBe('');
    });

    it('accepts whole page numbers from 1 and clamps to maxPage', () => {
        expect(parse({ page: '2' }).page).toBe(2);
        for (const bad of ['0', '-1', '1.5', 'abc', '']) expect(parse({ page: bad }).page).toBe(1);
        expect(parse({ page: '999999' }).page).toBe(CATALOGUE.maxPage);
        expect(str({ page: '1' })).toBe('');
    });
});

describe('toSearchString', () => {
    it('serialises one selection one way whatever the order or case', () => {
        const a = str({ type: ['knit', 'shirt'], brand: 'nike', sort: 'price_asc', minPrice: '2000', q: 'Wool' });
        const b = str({ q: 'wool', minPrice: '2000', sort: 'price_asc', brand: 'NIKE', type: ['SHIRT', 'Knit'] });
        expect(a).toBe(b);
        expect(a).toBe('brand=Nike&minPrice=2000&q=wool&sort=price_asc&type=knit&type=shirt');
    });
});

describe('hrefs', () => {
    const query = parse({ brand: 'nike', sort: 'price_asc', page: '3' });

    it('shopHref drops page and has no ? when nothing is set', () => {
        expect(shopHref(query)).toBe('/shop?brand=Nike&sort=price_asc');
        expect(shopHref(parse({}))).toBe('/shop');
    });

    it('pageHref keeps every param and omits page 1', () => {
        expect(pageHref(query, 4)).toBe('/shop?brand=Nike&page=4&sort=price_asc');
        expect(pageHref(query, 1)).toBe('/shop?brand=Nike&sort=price_asc');
    });

    it('hasFilters is true for lists, ranges and q, and false for sort or page alone', () => {
        expect(hasFilters(parse({ brand: 'nike' }))).toBe(true);
        expect(hasFilters(parse({ minPrice: '2000' }))).toBe(true);
        expect(hasFilters(parse({ q: 'wool' }))).toBe(true);
        expect(hasFilters(parse({ sort: 'price_asc', page: '2' }))).toBe(false);
    });

    it('clearFilters keeps sort and resets everything else', () => {
        const cleared = clearFilters(parse({ brand: 'nike', minPrice: '2000', q: 'wool', sort: 'price_asc', page: '3' }));
        expect(hasFilters(cleared)).toBe(false);
        expect(cleared).toMatchObject({ sort: 'price_asc', page: 1, q: '' });
    });
});
