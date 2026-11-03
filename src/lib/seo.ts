import { DEFAULT_SORT } from '@/lib/config';
import type { CatalogueQuery } from '@/lib/definitions';
import { hasFilters, toSearchString } from '@/lib/params';
import { ROUTES } from '@/lib/routes';

/**
 * Filtered, searched or sorted listings are noindex, follow; a clean listing follows the site switch (ALLOW_INDEXING).
 * A crawler obeys the stricter of this and the site-wide X-Robots-Tag header, which is only sent while indexing is off.
 */
export function listingRobots(query: CatalogueQuery, indexable: boolean): { index: boolean; follow: boolean } {
    if (hasFilters(query) || query.sort !== DEFAULT_SORT) return { index: false, follow: true };
    return { index: indexable, follow: indexable };
}

/** The same sorted query string as links and the API cache key, so equivalent URLs share one canonical */
export function canonicalUrl(siteUrl: string, query: CatalogueQuery, basePath: string = ROUTES.shop): string {
    const search = toSearchString(query);
    return new URL(search ? `${basePath}?${search}` : basePath, siteUrl).toString();
}
