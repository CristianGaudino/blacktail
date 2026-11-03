import { Search } from 'lucide-react';
import { IconButton } from '@/components/ui/buttons';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery } from '@/lib/definitions';
import { toSearchString } from '@/lib/params';

/** Search within a brand page (D-13). A plain GET form, so it works without JavaScript; the other filters and the sort are carried and a new search starts at page 1 */
export function CatalogueSearch({ query, basePath, label }: { query: CatalogueQuery; basePath: string; label: string }) {
    const carried = new URLSearchParams(toSearchString({ ...query, q: '', page: 1 }));
    return (
        <form action={basePath} method="get" role="search" className="flex w-full items-center border border-olive lg:w-64">
            {[...carried].map(([name, value]) => <input key={`${name}=${value}`} type="hidden" name={name} value={value} />)}
            <label htmlFor="catalogue-search" className="sr-only">{label}</label>
            <input
                id="catalogue-search"
                type="search"
                name="q"
                maxLength={CATALOGUE.maxQueryChars}
                defaultValue={query.q}
                placeholder={COPY.header.searchHint}
                className="h-11 min-w-0 flex-1 bg-transparent pl-4 text-base placeholder:text-olive"
            />
            <IconButton type="submit" icon={Search} label={COPY.header.submitSearch} />
        </form>
    );
}
