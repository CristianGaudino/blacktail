import { ItemCard } from '@/components/catalogue/ItemCard';
import { JustDroppedCarousel } from '@/components/home/JustDroppedCarousel';
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
                <JustDroppedCarousel headingId="home-just-dropped" heading={heading} eyebrow={eyebrow}>
                    {items.map(item => <ItemCard key={item.code} item={item} eager={false} now={now} />)}
                </JustDroppedCarousel>
            </div>
        </section>
    );
}
