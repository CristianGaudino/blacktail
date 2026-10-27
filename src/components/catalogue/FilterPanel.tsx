'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { CATALOGUE, DEFAULT_SORT, SEARCH_PARAMS } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery, Filters, ListKey, RangeKey } from '@/lib/definitions';
import { label } from '@/lib/labels';
import { formatMoney } from '@/lib/money';
import { rangeBounds, shopHref, toSearchString } from '@/lib/params';
import { ROUTES } from '@/lib/routes';
import { LABEL_MAPS } from './FilterChips';
import { useCatalogueNavigate } from './CatalogueShell';
import { ColourSwatches } from './ColourSwatches';
import { FacetList, FilterGroup } from './FilterGroup';
import { RangeSlider } from './RangeSlider';

/** Groups that start open; any other group opens only when one of its values is selected */
const OPEN_BY_DEFAULT: readonly string[] = ['brand', 'type', 'size', 'colour', 'price'];

/**
 * The filter form. A GET form to /shop, so it works without JavaScript. With JavaScript it keeps a draft
 * of the query: `instant` pushes the draft after a short pause (desktop sidebar), `apply` waits for the
 * Apply button (phone drawer).
 */
export function FilterPanel({ filters, query, currency, mode }: {
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
                {list === 'colour' ? (
                    <ColourSwatches values={values} selected={draft.lists.colour} onToggle={toggle(list)} first={CATALOGUE.facetShowFirst} />
                ) : (
                    <FacetList
                        name={list}
                        values={values}
                        selected={draft.lists[list]}
                        labelOf={value => (map ? label(value, map) : value)}
                        onToggle={toggle(list)}
                        first={CATALOGUE.facetShowFirst}
                    />
                )}
            </FilterGroup>
        );
    };

    const withRange = (range: RangeKey, v: CatalogueQuery['ranges'][RangeKey]): CatalogueQuery => ({ ...draft, ranges: { ...draft.ranges, [range]: v } });

    const rangeGroup = (range: RangeKey) => {
        const { filter, min, max, step } = CATALOGUE.ranges[range];
        const available = filters[filter];
        if (!available) return null;
        const bounds = rangeBounds(available, step);
        // Nothing to choose between
        if (bounds.min >= bounds.max) return null;
        const value = draft.ranges[range];
        const title = COPY.catalogue.groups[range];
        const price = range === 'price';
        return (
            <FilterGroup key={range} title={title} open={OPEN_BY_DEFAULT.includes(range) || value.min !== null || value.max !== null}>
                <RangeSlider
                    names={{ min, max }}
                    bounds={bounds}
                    step={step}
                    value={value}
                    label={title}
                    format={n => (price ? formatMoney(n, currency) : String(n / 10))}
                    readout={price ? COPY.catalogue.range : COPY.catalogue.cmRange}
                    onDraft={v => setDraft(withRange(range, v))}
                    onCommit={v => {
                        const next = withRange(range, v);
                        setDraft(next);
                        if (mode !== 'instant') return;
                        // A release is its own settled change: drop any pending checkbox push and go now
                        clearTimeout(timer.current);
                        navigate(shopHref(next));
                    }}
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
            {listGroup('colour')}
            {rangeGroup('price')}
            {listGroup('era')}
            {listGroup('condition')}
            {listGroup('department')}
            {listGroup('material')}
            {rangeGroup('pitToPit')}
            {rangeGroup('length')}
            {mode === 'instant' && <noscript><Button type="submit" fullWidth className="mt-6">{COPY.catalogue.applyFilters}</Button></noscript>}
        </form>
    );
}
