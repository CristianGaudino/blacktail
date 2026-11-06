import { ItemCard } from '@/components/catalogue/ItemCard';
import { JustDroppedCarousel } from '@/components/home/JustDroppedCarousel';
import { HOME } from '@/lib/config';
import { spotlightFirst } from '@/lib/homeSections';
import { getItemsPage } from '@/lib/howmany/client';
import { SHOP } from '@/shop/config';

/**
 * The Just Dropped carousel (D-10, D-12, HOME-05). The newest read is the empty query: the same cache key as /shop page 1 and the
 * API's default sort is newest, so it adds no call and is never re-sorted. The spotlight read is `?spotlight=true` cut to the carousel
 * size, one more tagged cached call; the literal `true` is the only value the API accepts. Spotlight pieces come first in the API's
 * order, then the newest, no piece twice and no badge (D-01). A failed or empty spotlight read leaves the newest list as it was (D-03).
 * Only this carousel reads spotlight: /just-dropped stays newest first (D-02). The section hides only when both give nothing (HOME-02).
 * The caller has already called connection().
 */
export async function JustDropped() {
    const [spotlight, newest] = await Promise.allSettled([getItemsPage('spotlight=true', HOME.carouselItems), getItemsPage('')]);
    if (spotlight.status === 'rejected') console.warn('Home: spotlight read failed', spotlight.reason);
    if (newest.status === 'rejected') console.warn('Home: just dropped read failed', newest.reason);
    const items = spotlightFirst(
        spotlight.status === 'fulfilled' ? spotlight.value.page.items : [],
        newest.status === 'fulfilled' ? newest.value.page.items : [],
        HOME.carouselItems,
    );
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
