import Image from 'next/image';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';

// Phase 2 owns the shared money formatter (SHELL-05)
const formatPrice = (cents: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);

/** data-as-of is the API's Date header for the cached /items response: an attribute only, never visible text */
export function ItemList({ items, asOf }: { items: Item[]; asOf: string | null }) {
    return (
        <section data-as-of={asOf ?? undefined}>
            {items.length === 0 ? <p>{COPY.stock.empty}</p> : (
                <ul>
                    {items.map(item => {
                        const cover = item.photos[0];
                        return (
                            <li key={item.code}>
                                {cover && <Image src={cover.thumbUrl} width={cover.width} height={cover.height} alt={[item.brand, item.title].filter(Boolean).join(' ')} />}
                                {item.brand && <p>{item.brand}</p>}
                                <p>{item.title}</p>
                                <p>{formatPrice(item.priceCents, item.currency)}</p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
