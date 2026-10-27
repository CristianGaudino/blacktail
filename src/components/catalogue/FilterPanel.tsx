'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { CATALOGUE, DEFAULT_SORT, SEARCH_PARAMS } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery, Filters, ListKey } from '@/lib/definitions';
import { label } from '@/lib/labels';
import { shopHref, toSearchString } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { LABEL_MAPS } from './FilterChips';
import { useCatalogueNavigate } from './CatalogueShell';
import { FacetList, FilterGroup } from './FilterGroup';

/** Groups that start open; any other group opens only when one of its values is selected */
const OPEN_BY_DEFAULT: readonly string[] = ['brand', 'type', 'size', 'colour', 'price'];

/**
 * The filter form. A GET form to /shop, so it works without JavaScript. With JavaScript it keeps a draft
 * of the query: `instant` pushes the draft after a short pause (desktop sidebar), `apply` waits for the
 * Apply button (phone drawer).
 */
export function FilterPanel({ filters, query, mode }: {
    filters:    Filters;
    query:      CatalogueQuery;
    currency:   string;
    mode:       'instant' | 'apply';
    onApplied?: () => void;
}) {
    const navigate = useCatalogueNavigate();
    const [draft, setDraft] = useState(query);
    // Follow the URL when it changes (Back, a chip) without remounting, so open groups and focus survive
    const key = toSearchString(query);
    const [seen, setSeen] = useState(key);
    if (seen !== key) {
        setSeen(key);
        setDraft(query);
    }

    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    const change = (next: CatalogueQuery) => {
        setDraft(next);
        if (mode !== 'instant') return;
        // Only the last change of a burst is pushed
        clearTimeout(timer.current);
        timer.current = setTimeout(() => navigate(shopHref(next)), CATALOGUE.applyDebounceMs);
    };

    const toggle = (list: ListKey) => (value: string) => {
        const current = draft.lists[list];
        change({ ...draft, lists: { ...draft.lists, [list]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] } });
    };

    const listGroup = (list: ListKey) => {
        const values = filters[list].map(f => f.value);
        if (values.length === 0) return null;
        const map = LABEL_MAPS[list];
        return (
            <FilterGroup key={list} title={COPY.catalogue.groups[list]} open={OPEN_BY_DEFAULT.includes(list) || draft.lists[list].length > 0}>
                <FacetList
                    name={list}
                    values={values}
                    selected={draft.lists[list]}
                    labelOf={value => (map ? label(value, map) : value)}
                    onToggle={toggle(list)}
                    first={CATALOGUE.facetShowFirst}
                />
            </FilterGroup>
        );
    };

    return (
        <form action={ROUTES.shop} method="get">
            {draft.q && <input type="hidden" name={SEARCH_PARAMS.q} value={draft.q} />}
            {draft.sort !== DEFAULT_SORT && <input type="hidden" name={SEARCH_PARAMS.sort} value={draft.sort} />}
            {listGroup('brand')}
            {listGroup('type')}
            {listGroup('size')}
            {listGroup('era')}
            {listGroup('condition')}
            {listGroup('department')}
            {listGroup('material')}
            {mode === 'instant' && <noscript><Button type="submit" fullWidth className="mt-6">{COPY.catalogue.applyFilters}</Button></noscript>}
        </form>
    );
}
