import type { MetadataRoute } from 'next';
import { ROUTES } from '@/lib/routes';

/** The sitemap protocol limit per file */
const MAX_URLS = 50_000;

/**
 * The fixed pages, then every brand, then every item, as absolute URLs on siteUrl.
 * Next writes each URL into the XML without escaping, so paths come from ROUTES (encodeURIComponent)
 * and never carry a query string.
 */
export function sitemapEntries({ siteUrl, brands, items }: {
    siteUrl: string;
    brands: { slug: string }[];
    items: { code: string; publishedAt: string }[];
}): MetadataRoute.Sitemap {
    const abs = (path: string) => new URL(path, siteUrl).toString();
    return [
        ...[ROUTES.home, ROUTES.shop, ROUTES.brands, ROUTES.justDropped, ROUTES.about, ROUTES.contact].map(path => ({ url: abs(path) })),
        ...brands.map(b => ({ url: abs(ROUTES.brand(b.slug)) })),
        ...items.map(i => ({
            url: abs(ROUTES.item(i.code)),
            ...(Number.isNaN(Date.parse(i.publishedAt)) ? {} : { lastModified: i.publishedAt }),
        })),
    ].slice(0, MAX_URLS);
}
