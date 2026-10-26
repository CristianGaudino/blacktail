import type { ReactNode } from 'react';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { ItemCard } from './ItemCard';

/** data-as-of is the API's Date header for the cached /items response: an attribute only, never visible text */
export function ItemGrid({ items, asOf, now, empty }: { items: Item[]; asOf: string | null; now: number; empty?: ReactNode }) {
    return (
        <section id="results" data-as-of={asOf ?? undefined}>
            {items.length === 0 ? (empty ?? <p>{COPY.stock.empty}</p>) : (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                    {items.map((item, i) => <ItemCard key={item.code} item={item} eager={i < CATALOGUE.eagerImages} now={now} />)}
                </ul>
            )}
        </section>
    );
}
