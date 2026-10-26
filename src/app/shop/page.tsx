import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { ItemGrid } from '@/components/catalogue/ItemGrid';
import { Pager } from '@/components/catalogue/Pager';
import { getFilters, getItemsPage } from '@/lib/howmany/client';
import { pageCountOf, resolvePage } from '@/lib/paging';
import { pageHref, parseCatalogueQuery, toSearchString } from '@/lib/params';

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
    // Render on each request, so nothing is fetched at build and the cached fetch is the only snapshot
    await connection();
    const [raw, filters] = await Promise.all([searchParams, getFilters()]);
    const query = parseCatalogueQuery(raw, filters);
    const { page, asOf } = await getItemsPage(toSearchString(query));
    // A page past the end goes to the last real page; the target is built from the cleaned query only
    const target = resolvePage(query.page, page.total);
    if (target !== query.page) redirect(pageHref(query, target));
    // One clock per render, so every card agrees about what is new. A server component runs once per request.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (
        <main>
            <CatalogueBanner />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-12">
                <ItemGrid items={page.items} asOf={asOf} now={now} />
                <Pager query={query} pageCount={pageCountOf(page.total)} />
            </div>
        </main>
    );
}
