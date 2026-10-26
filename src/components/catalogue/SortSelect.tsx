'use client';

import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { DEFAULT_SORT, SORTS } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery, Sort } from '@/lib/definitions';
import { shopHref, toSearchString } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { useCatalogueNavigate } from './CatalogueShell';

/** Applies at once with JavaScript; a GET form carrying the current filters covers the no-JS case */
export function SortSelect({ query }: { query: CatalogueQuery }) {
    const id = useId();
    const navigate = useCatalogueNavigate();
    const carried = new URLSearchParams(toSearchString({ ...query, sort: DEFAULT_SORT, page: 1 }));
    return (
        <form action={ROUTES.shop} method="get" className="flex items-center gap-2">
            {[...carried].map(([name, value]) => <input key={`${name}=${value}`} type="hidden" name={name} value={value} />)}
            <label htmlFor={id} className="text-label uppercase text-olive">{COPY.catalogue.sortBy}</label>
            <div className="relative">
                <select
                    id={id}
                    name="sort"
                    value={query.sort}
                    onChange={e => navigate(shopHref({ ...query, sort: e.target.value as Sort }))}
                    className="min-h-11 appearance-none border border-stone bg-ivory pl-3 pr-9 text-label uppercase"
                >
                    {SORTS.map(sort => <option key={sort} value={sort}>{COPY.catalogue.sorts[sort]}</option>)}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
            </div>
            <noscript><button type="submit" className="min-h-11 border border-stone px-3 text-label uppercase">{COPY.catalogue.sort}</button></noscript>
        </form>
    );
}
