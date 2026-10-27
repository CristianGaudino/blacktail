import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { CatalogueShell, GridBusy } from '@/components/catalogue/CatalogueShell';
import { FilterChips } from '@/components/catalogue/FilterChips';
import { FilterPanel } from '@/components/catalogue/FilterPanel';
import { ItemGrid } from '@/components/catalogue/ItemGrid';
import { Pager } from '@/components/catalogue/Pager';
import { SortSelect } from '@/components/catalogue/SortSelect';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { getFilters, getItemsPage, getStore, HowManyError } from '@/lib/howmany/client';
import { pageCountOf, resolvePage } from '@/lib/paging';
import { hasFilters, pageHref, parseCatalogueQuery, toSearchString } from '@/lib/params';
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
    const [raw, filters, store] = await Promise.all([searchParams, getFilters(), getStore()]);
    const query = parseCatalogueQuery(raw, filters);
    const { page, asOf } = await getItemsPage(toSearchString(query)).catch(error => {
        // The cached /filters and the API can briefly disagree about a code: show "no match", not the error screen
        if (!(error instanceof HowManyError) || error.status !== 400) throw error;
        console.warn('How many API 400 for a cleaned query');
        return { page: { items: [], page: 1, limit: CATALOGUE.pageSize, total: 0 }, asOf: null };
    });
    // A page past the end goes to the last real page; the target is built from the cleaned query only
    const target = resolvePage(query.page, page.total);
    if (target !== query.page) redirect(pageHref(query, target));
    // One clock per render, so every card agrees about what is new. A server component runs once per request.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const empty = hasFilters(query) ? (
        <div className="py-16 text-center">
            <h2 className="font-heading text-heading">{COPY.catalogue.emptyTitle}</h2>
            <p className="mt-2">{COPY.catalogue.emptyBody}</p>
            <Link href={ROUTES.shop} prefetch={false} className="mt-4 inline-block underline underline-offset-4">{COPY.catalogue.clearAll}</Link>
        </div>
    ) : undefined;
    return (
        <main>
            <CatalogueBanner />
            <CatalogueShell>
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:flex lg:gap-8 lg:py-12">
                    <aside aria-label={COPY.catalogue.filter} className="hidden w-64 shrink-0 lg:block">
                        <h2 className="border-b border-stone pb-4 text-label uppercase">{COPY.catalogue.filter}</h2>
                        <FilterPanel filters={filters} query={query} currency={store.currency} mode="instant" />
                    </aside>
                    <div className="min-w-0 flex-1">
                        <div id="results" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-4">
                            <p
                                id="result-count"
                                role="status"
                                aria-live="polite"
                                tabIndex={-1}
                                className="order-last w-full text-label uppercase text-olive lg:order-first lg:w-auto"
                            >
                                {COPY.catalogue.count(page.total)}
                            </p>
                            <SortSelect query={query} />
                        </div>
                        <FilterChips query={query} filters={filters} currency={store.currency} />
                        <GridBusy>
                            <div className="mt-6">
                                <ItemGrid items={page.items} asOf={asOf} now={now} empty={empty} />
                            </div>
                            <Pager query={query} pageCount={pageCountOf(page.total)} />
                        </GridBusy>
                    </div>
                </div>
            </CatalogueShell>
        </main>
    );
}
