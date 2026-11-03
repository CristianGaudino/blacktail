import type { Metadata } from 'next';
import { DEFAULT_SORT, IMAGES } from '@/lib/config';
import type { CatalogueQuery } from '@/lib/definitions';
import { hasFilters, toSearchString } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { SHOP } from '@/shop/config';

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

/**
 * Title, description, canonical and Open Graph for one page. Next merges metadata shallowly, so a page that sets
 * openGraph would lose the layout's; every page goes through here. Next does not apply the title template to
 * openGraph.title, so the shop name suffix is added here in the same form.
 */
export function pageMetadata({ url, title, description, image }: {
    url: string;
    title: string | { absolute: string };
    description: string;
    image?: { url: string; width?: number; height?: number };
}): Metadata {
    const ogTitle = typeof title === 'string' ? `${title} | ${SHOP.name}` : title.absolute;
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            type:        'website',
            url,
            siteName:    SHOP.name,
            locale:      SHOP.locale.replace('-', '_'),
            title:       ogTitle,
            description,
            images:      [image ?? { url: new URL(IMAGES.ogDefault, url).toString(), width: 1200, height: 630 }],
        },
    };
}
