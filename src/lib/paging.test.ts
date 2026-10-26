import { describe, expect, it } from 'vitest';
import { pageCountOf, pageLinks, resolvePage } from './paging';

describe('pageCountOf', () => {
    it.each([[0, 1], [24, 1], [25, 2], [48, 2], [49, 3]])('%i results is %i pages', (total, pages) => {
        expect(pageCountOf(total)).toBe(pages);
    });
});

describe('resolvePage', () => {
    it.each([[99, 30, 2], [1, 0, 1], [3, 0, 1], [2, 30, 2]])('page %i of %i results resolves to %i', (requested, total, page) => {
        expect(resolvePage(requested, total)).toBe(page);
    });
});

describe('pageLinks', () => {
    it.each([
        [1, 1, [1]],
        [1, 2, [1, 2]],
        [2, 3, [1, 2, 3]],
        [5, 9, [1, 'gap', 4, 5, 6, 'gap', 9]],
        [1, 9, [1, 2, 'gap', 9]],
        [9, 9, [1, 'gap', 8, 9]],
        [3, 9, [1, 2, 3, 4, 'gap', 9]],
    ])('page %i of %i', (page, count, links) => {
        expect(pageLinks(page, count)).toEqual(links);
    });
});
