import type { Metadata } from 'next';
import { connection } from 'next/server';
import { BrandGrid } from '@/components/brands/BrandGrid';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { brandIndex } from '@/lib/brands';
import { COPY } from '@/lib/copy';
import { getFilters } from '@/lib/howmany/client';

export const metadata: Metadata = { title: COPY.nav.brands };

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
