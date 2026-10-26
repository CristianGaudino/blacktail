import Image from 'next/image';
import type { Item } from '@/lib/definitions';

// Phase 2 owns the shared money formatter (SHELL-05)
const formatPrice = (cents: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);

/** data-as-of is the API's Date header for the cached /items response: an attribute only, never visible text */
export function ItemList({ items, currency, asOf }: { items: Item[]; currency: string; asOf: string | null }) {
    return (
        <section data-as-of={asOf ?? undefined}>
            <ul>
                {items.map(item => {
                    const cover = item.photos[0];
                    return (
                        <li key={item.code}>
                            {cover && <Image src={cover.thumbUrl} width={cover.width} height={cover.height} alt={`${item.brand} ${item.title}`} />}
                            <p>{item.brand}</p>
                            <p>{item.title}</p>
                            <p>{formatPrice(item.priceCents, currency)}</p>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
