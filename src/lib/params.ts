// The URL query layer: raw search params in, one cleaned CatalogueQuery out, one canonical string back.
// Pure and client-safe (no env, no server modules), so the server page and client islands share it.
import { CATALOGUE, DEFAULT_SORT, SEARCH_PARAMS } from '@/lib/config';
import type { CatalogueQuery, Filters, ListKey, RangeKey } from '@/lib/definitions';

export type RawParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

const all = (value: string | string[] | undefined): string[] => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

/** Each /filters value, in /filters order and spelling, that any raw value matches case-insensitively */
function pickList(raw: string | string[] | undefined, available: Filters[ListKey]): string[] {
    const wanted = new Set(all(raw).map(v => v.trim().toLowerCase()));
    return available.map(f => f.value).filter(v => wanted.has(v.toLowerCase()));
}

function parsePage(raw: string | string[] | undefined): number {
    const text = single(raw);
    if (text === undefined || !/^\d+$/.test(text)) return 1;
    return Math.min(Math.max(Number(text), 1), CATALOGUE.maxPage);
}

export function parseCatalogueQuery(raw: RawParams, filters: Filters): CatalogueQuery {
    const lists = Object.fromEntries(CATALOGUE.lists.map(key => [key, [] as string[]])) as CatalogueQuery['lists'];
    lists.brand = pickList(raw.brand, filters.brand);
    const ranges = Object.fromEntries(Object.keys(CATALOGUE.ranges).map(key => [key, { min: null, max: null }])) as CatalogueQuery['ranges'];
    return { lists, ranges, q: '', sort: DEFAULT_SORT, page: parsePage(raw[SEARCH_PARAMS.page]) };
}

/** The canonical query string: keys sorted, then values, so one selection is one string (and one cache entry) */
export function toSearchString(query: CatalogueQuery): string {
    const entries: [string, string][] = [];
    for (const key of CATALOGUE.lists) for (const value of query.lists[key]) entries.push([key, value]);
    for (const key of Object.keys(CATALOGUE.ranges) as RangeKey[]) {
        const { min, max } = query.ranges[key];
        if (min !== null) entries.push([CATALOGUE.ranges[key].min, String(min)]);
        if (max !== null) entries.push([CATALOGUE.ranges[key].max, String(max)]);
    }
    if (query.q) entries.push([SEARCH_PARAMS.q, query.q]);
    if (query.sort !== DEFAULT_SORT) entries.push([SEARCH_PARAMS.sort, query.sort]);
    if (query.page > 1) entries.push([SEARCH_PARAMS.page, String(query.page)]);
    entries.sort(([a, x], [b, y]) => a.localeCompare(b) || x.localeCompare(y));
    return new URLSearchParams(entries).toString();
}
