import Link from 'next/link';
import { ItemGrid } from '@/components/catalogue/ItemGrid';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { ROUTES } from '@/lib/routes';

/** The brand's newest pieces other than this one (D-08). `items` is the brand page's first page, sliced here, so it costs no API call of its own */
export function MoreFromBrand({ brand, slug, code, items, now }: { brand: string; slug: string; code: string; items: Item[]; now: number }) {
    const others = items.filter(item => item.code !== code).slice(0, CATALOGUE.moreFromBrand);
    if (others.length === 0) return null;
    return (
        <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
                <h2 className="font-heading text-heading leading-[1.2]">{COPY.item.moreFrom(brand)}</h2>
                {slug && (
                    <Link
                        href={ROUTES.brand(slug)}
                        prefetch={false}
                        aria-label={COPY.item.viewAllLabel(brand)}
                        className="inline-flex min-h-11 shrink-0 items-center text-label uppercase underline underline-offset-4"
                    >
                        {COPY.item.viewAll}
                    </Link>
                )}
            </div>
            <ItemGrid items={others} asOf={null} now={now} row />
        </section>
    );
}
