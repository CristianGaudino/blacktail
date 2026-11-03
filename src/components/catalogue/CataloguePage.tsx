import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { CatalogueSearch } from '@/components/catalogue/CatalogueSearch';
import { CatalogueShell, GridBusy } from '@/components/catalogue/CatalogueShell';
import { FilterChips } from '@/components/catalogue/FilterChips';
import { FilterDrawer } from '@/components/catalogue/FilterDrawer';
import { FilterPanel } from '@/components/catalogue/FilterPanel';
import { ItemGrid } from '@/components/catalogue/ItemGrid';
import { Pager } from '@/components/catalogue/Pager';
import { SortSelect } from '@/components/catalogue/SortSelect';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import { getFilters, getItemsPage, getStore, HowManyError } from '@/lib/howmany/client';
import { pageCountOf, resolvePage } from '@/lib/paging';
import { hasFilters, pageHref, parseCatalogueQuery, toSearchString, type RawParams } from '@/lib/params';

/**
 * The one catalogue body, shared by /shop and /brands/[slug] (D-13). With `brand` the catalogue is locked to it:
 * the URL's brand param is ignored, the Brand filter and chip are hidden, and the brand is added to the API query only.
 * The caller has already called connection().
 */
export async function CataloguePage({ raw, basePath, title, back, brand }: {
    raw:      RawParams;
    basePath: string;
    title:    string;
    back?:    { href: string; label: string };
    brand?:   string;
}) {
    const [fullFilters, store] = await Promise.all([getFilters(), getStore()]);
    // An empty Brand list makes pickList drop any brand param, and FilterPanel hides an empty group
    const filters = brand ? { ...fullFilters, brand: [] } : fullFilters;
    const query = parseCatalogueQuery(raw, filters);
    const apiQuery = brand ? { ...query, lists: { ...query.lists, brand: [brand] } } : query;
    const { page, asOf } = await getItemsPage(toSearchString(apiQuery)).catch(error => {
        // The cached /filters and the API can briefly disagree about a code: show "no match", not the error screen
        if (!(error instanceof HowManyError) || error.status !== 400) throw error;
        console.warn('How many API 400 for a cleaned query');
        return { page: { items: [], page: 1, limit: CATALOGUE.pageSize, total: 0 }, asOf: null };
    });
    // A page past the end goes to the last real page; the target is built from the cleaned query only
    const target = resolvePage(query.page, page.total);
    if (target !== query.page) redirect(pageHref(query, target, basePath));
    // One clock per render, so every card agrees about what is new. A server component runs once per request.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const empty = hasFilters(query) ? (
        <div className="py-16 text-center">
            <h2 className="font-heading text-heading">{COPY.catalogue.emptyTitle}</h2>
            <p className="mt-2">{COPY.catalogue.emptyBody}</p>
            <Link href={basePath} prefetch={false} className="mt-4 inline-block underline underline-offset-4">{COPY.catalogue.clearAll}</Link>
        </div>
    ) : undefined;
    return (
        <main>
            <CatalogueBanner title={title} back={back} />
            <CatalogueShell>
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:flex lg:gap-8 lg:py-12">
                    <aside aria-label={COPY.catalogue.filter} className="hidden w-64 shrink-0 lg:block">
                        <h2 className="border-b border-stone pb-4 text-label uppercase">{COPY.catalogue.filter}</h2>
                        <FilterPanel filters={filters} query={query} currency={store.currency} mode="instant" basePath={basePath} />
                    </aside>
                    <div className="min-w-0 flex-1">
                        <div id="results" className="flex scroll-mt-16 lg:scroll-mt-20 flex-wrap items-center justify-between gap-4">
                            <p
                                id="result-count"
                                role="status"
                                aria-live="polite"
                                tabIndex={-1}
                                className="order-last w-full text-label uppercase text-olive lg:order-first lg:w-auto"
                            >
                                {COPY.catalogue.count(page.total)}
                            </p>
                            {brand && <CatalogueSearch query={query} basePath={basePath} label={COPY.catalogue.searchIn(brand)} />}
                            <FilterDrawer filters={filters} query={query} currency={store.currency} basePath={basePath} />
                            <SortSelect query={query} basePath={basePath} />
                        </div>
                        <FilterChips query={query} filters={filters} currency={store.currency} basePath={basePath} />
                        <GridBusy>
                            <div className="mt-6">
                                <ItemGrid items={page.items} asOf={asOf} now={now} empty={empty} />
                            </div>
                            <Pager query={query} pageCount={pageCountOf(page.total)} basePath={basePath} />
                        </GridBusy>
                    </div>
                </div>
            </CatalogueShell>
        </main>
    );
}
