import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { CataloguePage } from '@/components/catalogue/CataloguePage';
import { brandIndex } from '@/lib/brands';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { getFilters } from '@/lib/howmany/client';
import { parseCatalogueQuery } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { canonicalUrl, listingRobots } from '@/lib/seo';

/** The slug is only ever resolved against the cached /filters names (React-cached, shared with the Header) */
async function brandOf(slug: string) {
    const filters = await getFilters();
    const name = brandIndex(filters.brand.map(f => f.value)).find(b => b.slug === slug)?.name;
    return { filters, name };
}

// A 404 from metadata would answer 200, so an unknown slug returns {} here and the page body calls notFound()
export async function generateMetadata({ params, searchParams }: PageProps<'/brands/[slug]'>): Promise<Metadata> {
    const { slug } = await params;
    const { filters, name } = await brandOf(slug);
    if (!name) return {};
    const query = parseCatalogueQuery(await searchParams, { ...filters, brand: [] });
    const { ALLOW_INDEXING, SITE_URL } = storeEnv();
    return {
        title:      name,
        robots:     listingRobots(query, ALLOW_INDEXING),
        alternates: { canonical: canonicalUrl(SITE_URL, query, ROUTES.brand(slug)) },
    };
}

export default async function BrandPage({ params, searchParams }: PageProps<'/brands/[slug]'>) {
    await connection();
    const { slug } = await params;
    const { name } = await brandOf(slug);
    // Before any output and before any /items call
    if (!name) notFound();
    return (
        <CataloguePage
            raw={await searchParams}
            basePath={ROUTES.brand(slug)}
            brand={name}
            title={name}
            back={{ href: ROUTES.brands, label: COPY.nav.allBrands }}
        />
    );
}
