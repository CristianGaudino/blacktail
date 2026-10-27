// The URL query layer: raw search params in, one cleaned CatalogueQuery out, one canonical string back.
// Pure and client-safe (no env, no server modules), so the server page and client islands share it.
import { CATALOGUE, DEFAULT_SORT, SEARCH_PARAMS, SORTS } from '@/lib/config';
import type { CatalogueQuery, Filters, ListKey, RangeKey, Sort } from '@/lib/definitions';
import { ROUTES } from '@/lib/routes';

export type RawParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

const all = (value: string | string[] | undefined): string[] => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

/** Each /filters value, in /filters order and spelling, that any raw value matches case-insensitively; the first maxSelectedPerGroup only */
function pickList(raw: string | string[] | undefined, available: Filters[ListKey]): string[] {
    const wanted = new Set(all(raw).map(v => v.trim().toLowerCase()));
    return available.map(f => f.value).filter(v => wanted.has(v.toLowerCase())).slice(0, CATALOGUE.maxSelectedPerGroup);
}

function parsePage(raw: string | string[] | undefined): number {
    const text = single(raw);
    if (text === undefined || !/^\d+$/.test(text)) return 1;
    return Math.min(Math.max(Number(text), 1), CATALOGUE.maxPage);
}

/** Min floored and max ceiled to the step, so the slider's ends are whole units that cover every item */
export function rangeBounds(range: { min: number; max: number }, step: number): { min: number; max: number } {
    return { min: Math.floor(range.min / step) * step, max: Math.ceil(range.max / step) * step };
}

/** Plain digits only, snapped half-up to the step and clamped into the bounds; anything else is no bound */
function parseBound(raw: string | string[] | undefined, step: number, bounds: { min: number; max: number }): number | null {
    const text = single(raw);
    if (text === undefined || !/^\d+$/.test(text)) return null;
    const snapped = Math.round(Number(text) / step) * step;
    return Math.min(Math.max(snapped, bounds.min), bounds.max);
}

function parseRange(raw: RawParams, key: RangeKey, filters: Filters): { min: number | null; max: number | null } {
    const { filter, min: minKey, max: maxKey, step } = CATALOGUE.ranges[key];
    const available = filters[filter];
    if (!available) return { min: null, max: null };
    const bounds = rangeBounds(available, step);
    let min = parseBound(raw[minKey], step, bounds);
    let max = parseBound(raw[maxKey], step, bounds);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    // A value at its own bound is the same as no filter, so it must not mint a second cache key
    return { min: min === bounds.min ? null : min, max: max === bounds.max ? null : max };
}

function parseQ(raw: string | string[] | undefined): string {
    const text = (single(raw) ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    return Array.from(text).slice(0, CATALOGUE.maxQueryChars).join('').trim();
}

export function parseCatalogueQuery(raw: RawParams, filters: Filters): CatalogueQuery {
    const lists = Object.fromEntries(CATALOGUE.lists.map(key => [key, pickList(raw[key], filters[key])])) as CatalogueQuery['lists'];
    const ranges = Object.fromEntries((Object.keys(CATALOGUE.ranges) as RangeKey[]).map(key => [key, parseRange(raw, key, filters)])) as CatalogueQuery['ranges'];
    const sort = single(raw[SEARCH_PARAMS.sort]);
    return {
        lists,
        ranges,
        q:    parseQ(raw[SEARCH_PARAMS.q]),
        sort: SORTS.includes(sort as Sort) ? (sort as Sort) : DEFAULT_SORT,
        page: parsePage(raw[SEARCH_PARAMS.page]),
    };
}

/** Sorted by key then value, so one selection is one string and one cache key; shared with the API client so the two never disagree */
export function sortEntries(entries: [string, string][]): [string, string][] {
    return entries.sort(([a, x], [b, y]) => a.localeCompare(b) || x.localeCompare(y));
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
    return new URLSearchParams(sortEntries(entries)).toString();
}

/**
 * Every non-page change (filter, search, sort) builds its link here and starts at page 1, which is
 * how CAT-07's reset is enforced in one place.
 */
export function shopHref(query: CatalogueQuery): string {
    return pageHref(query, 1);
}

export function pageHref(query: CatalogueQuery, page: number): string {
    const search = toSearchString({ ...query, page });
    return search ? `${ROUTES.shop}?${search}` : ROUTES.shop;
}

/** Sort and page are not filters: a shopper can still have "everything", sorted */
export function hasFilters(query: CatalogueQuery): boolean {
    return query.q !== ''
        || CATALOGUE.lists.some(key => query.lists[key].length > 0)
        || Object.values(query.ranges).some(r => r.min !== null || r.max !== null);
}

export function clearFilters(query: CatalogueQuery): CatalogueQuery {
    const empty = parseCatalogueQuery({}, { brand: [], size: [], colour: [], era: [], material: [], category: [], type: [], condition: [], department: [], priceCents: null, pitToPitMm: null, lengthMm: null });
    return { ...empty, sort: query.sort };
}
