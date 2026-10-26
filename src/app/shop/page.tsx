import { connection } from 'next/server';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { ItemGrid } from '@/components/catalogue/ItemGrid';
import { getFilters, getItemsPage } from '@/lib/howmany/client';
import { parseCatalogueQuery, toSearchString } from '@/lib/params';

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
    // Render on each request, so nothing is fetched at build and the cached fetch is the only snapshot
    await connection();
    const [raw, filters] = await Promise.all([searchParams, getFilters()]);
    const query = parseCatalogueQuery(raw, filters);
    const { page, asOf } = await getItemsPage(toSearchString(query));
    // One clock per render, so every card agrees about what is new. A server component runs once per request.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (
        <main>
            <CatalogueBanner />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-12">
                <ItemGrid items={page.items} asOf={asOf} now={now} />
            </div>
        </main>
    );
}
