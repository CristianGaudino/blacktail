import type { z } from 'zod';
import type { CATALOGUE, SORTS } from '@/lib/config';
import type { filtersSchema, itemSchema, itemsPageSchema, photoSchema, storeSchema } from '@/lib/howmany/schemas';

// The schema is the single source of these types.
export type Store = z.output<typeof storeSchema>;
export type ItemPhoto = z.output<typeof photoSchema>;
export type Item = z.output<typeof itemSchema>;
export type ItemsPage = z.output<typeof itemsPageSchema>;
export type Filters = z.output<typeof filtersSchema>;

export type Sort = (typeof SORTS)[number];
export type ListKey = (typeof CATALOGUE.lists)[number];
export type RangeKey = keyof typeof CATALOGUE.ranges;

/** The cleaned catalogue URL: only values the API will accept, in one canonical shape */
export type CatalogueQuery = {
    lists:  Record<ListKey, string[]>;
    ranges: Record<RangeKey, { min: number | null; max: number | null }>;
    q:      string;
    sort:   Sort;
    page:   number;
};
