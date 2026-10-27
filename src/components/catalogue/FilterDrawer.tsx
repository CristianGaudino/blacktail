'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery, Filters } from '@/lib/definitions';
import { FilterPanel } from './FilterPanel';

/** The phone filter button and its left drawer. The panel is mounted only while open, so closing discards the draft */
export function FilterDrawer({ filters, query, currency }: { filters: Filters; query: CatalogueQuery; currency: string }) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 border border-olive px-4 text-label uppercase lg:hidden"
            >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                {COPY.catalogue.filter}
            </button>
            <Sheet
                open={open}
                onClose={close}
                title={<span className="text-label uppercase">{COPY.catalogue.filter}</span>}
                closeLabel={COPY.common.close}
                className="w-[min(calc(100vw-48px),24rem)]"
            >
                {open && <FilterPanel
                    filters={filters}
                    query={query}
                    currency={currency}
                    mode="apply"
                    onApplied={() => {
                        close();
                        // After the dialog has closed and returned focus to the Filter button
                        requestAnimationFrame(() => document.getElementById('result-count')?.focus());
                    }}
                />}
            </Sheet>
        </>
    );
}
