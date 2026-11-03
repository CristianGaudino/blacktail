import { ItemCard } from '@/components/catalogue/ItemCard';
import { HOME } from '@/lib/config';
import type { Item } from '@/lib/definitions';
import { getItemsPage } from '@/lib/howmany/client';
import { SHOP } from '@/shop/config';

/**
 * The newest in-stock pieces (D-10, D-12). The empty query is the same cache key as /shop page 1 and the API's default
 * sort is newest, so this adds no API call and must never re-sort. A failed or empty read hides the whole section (HOME-02).
 * The caller has already called connection().
 */
export async function JustDropped() {
    let items: Item[] = [];
    try {
        items = (await getItemsPage('')).page.items.slice(0, HOME.carouselItems);
    } catch (error) {
        console.warn('Home: just dropped read failed', error);
    }
    if (items.length === 0) return null;
    // One clock per render, so every card agrees about what is new. A server component runs once per request.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const { heading, eyebrow } = SHOP.home.justDropped;
    return (
        <section aria-labelledby="home-just-dropped" className="bg-ivory py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <h2 id="home-just-dropped" className="font-heading text-heading uppercase text-forest">{heading}</h2>
                    <span aria-hidden="true" className="hidden h-px flex-1 bg-stone sm:block" />
                    <p className="hidden text-label uppercase text-olive md:block">{eyebrow}</p>
                </div>
                <ul className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden [&>li]:shrink-0 [&>li]:basis-[calc((100%_-_16px)/2)] [&>li]:snap-start sm:[&>li]:basis-[calc((100%_-_48px)/3)] lg:[&>li]:basis-[calc((100%_-_96px)/5)]">
                    {items.map(item => <ItemCard key={item.code} item={item} eager={false} now={now} />)}
                </ul>
            </div>
        </section>
    );
}
