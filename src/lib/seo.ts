import { DEFAULT_SORT } from '@/lib/config';
import type { CatalogueQuery } from '@/lib/definitions';
import { hasFilters, toSearchString } from '@/lib/params';
import { ROUTES } from '@/lib/routes';

/** The one switch until SEO-03 (Phase 4) makes indexing depend on the environment */
export const SITE_INDEXABLE = false;

/**
 * Filtered, searched or sorted listings are noindex, follow; a clean listing follows the site switch.
 * A crawler obeys the stricter of this and the site-wide X-Robots-Tag header, so the header stays until Phase 4.
 */
export function listingRobots(query: CatalogueQuery): { index: boolean; follow: boolean } {
    if (hasFilters(query) || query.sort !== DEFAULT_SORT) return { index: false, follow: true };
    return { index: SITE_INDEXABLE, follow: SITE_INDEXABLE };
}

/** The same sorted query string as links and the API cache key, so equivalent URLs share one canonical */
export function canonicalUrl(siteUrl: string, query: CatalogueQuery): string {
    const search = toSearchString(query);
    return new URL(search ? `${ROUTES.shop}?${search}` : ROUTES.shop, siteUrl).toString();
}
