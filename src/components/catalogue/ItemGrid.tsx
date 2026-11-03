import type { ReactNode } from 'react';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { ItemCard } from './ItemCard';

/**
 * data-as-of is the API's Date header for the cached /items response: an attribute only, never visible text.
 * `row` is a secondary grid (the gone page, More from this brand): 4 columns from 1024px, every image lazy.
 */
export function ItemGrid({ items, asOf, now, empty, row = false }: { items: Item[]; asOf: string | null; now: number; empty?: ReactNode; row?: boolean }) {
    return (
        <section data-as-of={asOf ?? undefined}>
            {items.length === 0 ? (empty ?? <p>{COPY.stock.empty}</p>) : (
                <ul className={cn('grid grid-cols-2 gap-4', row ? 'sm:gap-6 lg:grid-cols-4' : 'sm:grid-cols-3 sm:gap-6')}>
                    {items.map((item, i) => <ItemCard key={item.code} item={item} eager={!row && i < CATALOGUE.eagerImages} now={now} />)}
                </ul>
            )}
        </section>
    );
}
