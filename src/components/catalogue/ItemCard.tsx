import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { isNew } from '@/lib/dates';
import type { Item } from '@/lib/definitions';
import { formatMoney } from '@/lib/money';
import { ROUTES } from '@/lib/routes';
import { SHOP } from '@/shop/config';

/** Reads named fields only, never spreads the item: nothing outside the parsed schema can reach the markup */
export function ItemCard({ item, eager, now }: { item: Item; eager: boolean; now: number }) {
    const cover = item.photos[0];
    const colourSize = [item.colour, item.size].filter(Boolean).join(' / ');
    return (
        <li>
            <Link href={ROUTES.item(item.code)} prefetch={false} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-sand/40">
                    {cover && (
                        <Image
                            src={cover.thumbUrl}
                            width={cover.width}
                            height={cover.height}
                            alt={[item.brand, item.title].filter(Boolean).join(' ')}
                            className="size-full object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.02]"
                            {...(eager ? { loading: 'eager' as const, fetchPriority: 'high' as const } : {})}
                        />
                    )}
                    {isNew(item.publishedAt, now, SHOP.newBadgeDays) && (
                        <span className="absolute left-2 top-2 border border-forest bg-ivory px-2 py-1 text-label uppercase text-forest">{COPY.catalogue.newBadge}</span>
                    )}
                    <span aria-hidden="true" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-forest/40">
                        <Heart className="size-5 text-ivory" />
                    </span>
                </div>
                <div className="mt-4 flex flex-col gap-1">
                    {item.brand && <p className="truncate text-label uppercase">{item.brand}</p>}
                    <p className="line-clamp-2 font-heading text-base leading-[1.2]">{item.title}</p>
                    {colourSize && <p className="text-label normal-case tracking-normal text-olive">{colourSize}</p>}
                    <p className="text-base tabular-nums">{formatMoney(item.priceCents, item.currency)}</p>
                </div>
            </Link>
        </li>
    );
}
