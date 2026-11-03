import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CataloguePage } from '@/components/catalogue/CataloguePage';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { getFilters } from '@/lib/howmany/client';
import { parseCatalogueQuery } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { canonicalUrl, listingRobots } from '@/lib/seo';

// SITE_URL is read here, per request, never at module scope and never from the Host header
export async function generateMetadata({ searchParams }: PageProps<'/shop'>): Promise<Metadata> {
    const query = parseCatalogueQuery(await searchParams, await getFilters());
    return {
        title:      COPY.catalogue.title,
        robots:     listingRobots(query),
        alternates: { canonical: canonicalUrl(storeEnv().SITE_URL, query) },
    };
}

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
    // Render on each request, so nothing is fetched at build and the cached fetch is the only snapshot
    await connection();
    return <CataloguePage raw={await searchParams} basePath={ROUTES.shop} title={COPY.catalogue.title} />;
}
