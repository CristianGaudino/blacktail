import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { brandIndex } from '@/lib/brands';
import { CATALOGUE } from '@/lib/config';
import { storeEnv } from '@/lib/env';
import { getFilters, getItemsPage } from '@/lib/howmany/client';
import { sitemapEntries } from '@/lib/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Without this a metadata route is built once at build time, with no env and no API. Outside any try/catch.
    await connection();
    const { ALLOW_INDEXING, SITE_URL } = storeEnv();
    if (!ALLOW_INDEXING) return [];
    // Every read goes through the tagged client, so the webhook refreshes the sitemap. A failed read throws:
    // a crawler retries a 500, and a sitemap with pieces missing is worse.
    const [filters, first] = await Promise.all([getFilters(), getItemsPage('', CATALOGUE.sitemapPageSize)]);
    const pages = Math.min(Math.ceil(first.page.total / CATALOGUE.sitemapPageSize), CATALOGUE.maxPage);
    // shortcut: every page is read in parallel; fine for a few thousand pieces, switch to generateSitemaps if a shop grows far past that
    const rest = await Promise.all(
        Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
            getItemsPage(new URLSearchParams({ page: String(i + 2) }).toString(), CATALOGUE.sitemapPageSize)),
    );
    return sitemapEntries({
        siteUrl: SITE_URL,
        brands:  brandIndex(filters.brand.map(f => f.value)),
        items:   [first, ...rest].flatMap(r => r.page.items),
    });
}
