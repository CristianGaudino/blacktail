import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CataloguePage } from '@/components/catalogue/CataloguePage';
import { DEFAULT_SORT } from '@/lib/config';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { getFilters } from '@/lib/howmany/client';
import { parseCatalogueQuery } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { canonicalUrl, listingRobots, pageMetadata } from '@/lib/seo';
import { SHOP } from '@/shop/config';

// The sort is locked to newest, so a sort param is neither noindex nor part of the canonical
export async function generateMetadata({ searchParams }: PageProps<'/just-dropped'>): Promise<Metadata> {
    const query = { ...parseCatalogueQuery(await searchParams, await getFilters()), sort: DEFAULT_SORT };
    const { ALLOW_INDEXING, SITE_URL } = storeEnv();
    return {
        ...pageMetadata({ url: canonicalUrl(SITE_URL, query, ROUTES.justDropped), title: COPY.nav.justDropped, description: SHOP.seo.justDropped }),
        robots: listingRobots(query, ALLOW_INDEXING),
    };
}

export default async function JustDroppedPage({ searchParams }: PageProps<'/just-dropped'>) {
    // Render on each request, so nothing is fetched at build
    await connection();
    return <CataloguePage raw={await searchParams} basePath={ROUTES.justDropped} title={COPY.nav.justDropped} lockedSort />;
}
