import { CATALOGUE } from './config';

/** How many pages `total` results fill: at least one, so an empty list is page 1 of 1. */
export function pageCountOf(total: number): number {
    return Math.max(1, Math.ceil(total / CATALOGUE.pageSize));
}

/** The requested page (already cleaned to 1 or more), or the last real page if it is past the end. */
export function resolvePage(requested: number, total: number): number {
    return Math.min(requested, pageCountOf(total));
}

/** The pager window: first, last, current and one neighbour each side, with 'gap' between numbers that do not touch. */
export function pageLinks(page: number, count: number): (number | 'gap')[] {
    const shown = [...new Set([1, page - 1, page, page + 1, count])]
        .filter(n => n >= 1 && n <= count)
        .sort((a, b) => a - b);
    return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? ['gap' as const, n] : [n]));
}
