import type { Metadata } from 'next';
import { connection } from 'next/server';
import { BrandGrid } from '@/components/brands/BrandGrid';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { brandIndex } from '@/lib/brands';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { getFilters } from '@/lib/howmany/client';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { SHOP } from '@/shop/config';

export async function generateMetadata(): Promise<Metadata> {
    return pageMetadata({ url: new URL(ROUTES.brands, storeEnv().SITE_URL).toString(), title: COPY.nav.brands, description: SHOP.seo.brands });
}

export default async function BrandsPage() {
    // Reads the API, so it renders per request and never at build
    await connection();
    const brands = brandIndex((await getFilters()).brand.map(f => f.value));
    return (
        <main>
            <CatalogueBanner title={COPY.nav.brands} />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-12">
                <BrandGrid brands={brands} />
            </div>
        </main>
    );
}
