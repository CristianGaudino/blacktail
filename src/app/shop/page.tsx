import { connection } from 'next/server';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { ItemList } from '@/components/stock/ItemList';
import { getFilters, getItemsPage } from '@/lib/howmany/client';
import { parseCatalogueQuery, toSearchString } from '@/lib/params';

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
    // Render on each request, so nothing is fetched at build and the cached fetch is the only snapshot
    await connection();
    const [raw, filters] = await Promise.all([searchParams, getFilters()]);
    const query = parseCatalogueQuery(raw, filters);
    const { page, asOf } = await getItemsPage(toSearchString(query));
    return (
        <main>
            <CatalogueBanner />
            <ItemList items={page.items} asOf={asOf} />
        </main>
    );
}
