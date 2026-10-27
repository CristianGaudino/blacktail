/** How the How many data is cached */
export const CACHE = {
    /** Time-based fallback: the first visit after this many seconds refreshes the data (the webhook is never retried) */
    revalidateSeconds: 600,
    fetchTimeoutMs:    8000,
    /**
     * expire 0 makes the next visit after a webhook a blocking refetch. Chosen over 'max' so a sold
     * piece never shows again after a stock change.
     */
    webhookRevalidate: { expire: 0 },
} as const;

/** How the catalogue page reads its URL. Param names equal the API's, so a shared link is also an API query */
export const CATALOGUE = {
    pageSize:      24,
    /** The first row on the widest grid loads eagerly, the rest lazily */
    eagerImages:   4,
    /** Pages past this are clamped, so a made-up page number cannot mint cache keys */
    maxPage:       500,
    /** Code points, so the cap never splits a character */
    maxQueryChars: 80,
    /** A filter group shows this many values before "Show more" (selected ones always show) */
    facetShowFirst: 8,
    /** Desktop filters apply this long after the last change, so a burst of clicks is one request */
    applyDebounceMs: 250,
    /** Panel group order, without the ranges */
    lists:         ['brand', 'type', 'size', 'colour', 'era', 'condition', 'department', 'material'],
    /** `filter` is the /filters key; step is the snap unit (cents for price, mm for measurements) */
    ranges: {
        price:    { filter: 'priceCents', min: 'minPrice',      max: 'maxPrice',      step: 100 },
        pitToPit: { filter: 'pitToPitMm', min: 'minPitToPitMm', max: 'maxPitToPitMm', step: 10 },
        length:   { filter: 'lengthMm',   min: 'minLengthMm',   max: 'maxLengthMm',   step: 10 },
    },
} as const;

export const SORTS = ['newest', 'price_asc', 'price_desc'] as const;
/** The API default, so it is left out of URLs and API calls */
export const DEFAULT_SORT = 'newest';
export const SEARCH_PARAMS = { q: 'q', sort: 'sort', page: 'page' } as const;

/** The How many public API contract */
export const STORE_API = {
    webhookEvent:            'store.updated',
    webhookToleranceSeconds: 300,
    webhookMaxBytes:         8192,
} as const;
