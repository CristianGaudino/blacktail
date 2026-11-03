import { ArrowRight, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getFilters } from '@/lib/howmany/client';
import { visibleTiles, type CategoryTile } from '@/lib/homeSections';
import { ROUTES } from '@/lib/routes';
import { SHOP } from '@/shop/config';

// Literal class names so Tailwind sees them: from 1024px the columns equal the visible tile count
const COLUMNS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

/**
 * Shop by category (D-04, D-05, HOME-02). Shares the React-cached /filters read with the Header. A tile whose type has no stock
 * is hidden; with none left, no config or a failed read the whole section is hidden. The caller has already called connection().
 */
export async function CategoryTiles() {
    let tiles: CategoryTile[] = [];
    try {
        tiles = visibleTiles(SHOP.home.categories.tiles, (await getFilters()).type);
    } catch (error) {
        console.warn('Home: category tiles read failed', error);
    }
    if (tiles.length === 0) return null;
    const { heading, exploreAll } = SHOP.home.categories;
    return (
        <section aria-labelledby="home-categories" className="bg-ivory py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-6 flex items-center gap-4">
                    <h2 id="home-categories" className="font-heading text-heading uppercase text-forest">{heading}</h2>
                    <span aria-hidden="true" className="hidden h-px flex-1 bg-stone sm:block" />
                    <Link
                        href={ROUTES.shop}
                        prefetch={false}
                        className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 text-label uppercase text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:ml-0"
                    >
                        {exploreAll}
                        <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                </div>
                <ul className={`grid grid-cols-2 gap-4 ${COLUMNS[tiles.length]}`}>
                    {tiles.map(({ type, label, image }) => (
                        <li key={type} className="group aspect-4/3 last:odd:col-span-2 last:odd:aspect-8/3 lg:aspect-5/3 lg:last:odd:col-span-1 lg:last:odd:aspect-5/3">
                            <Link
                                href={`${ROUTES.shop}?${new URLSearchParams({ type })}`}
                                prefetch={false}
                                className="relative block h-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                            >
                                <Image src={image} alt="" fill loading="lazy" className="object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-102" />
                                <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-forest/70 to-transparent" />
                                <span className="absolute bottom-4 left-4 right-4 line-clamp-2 break-words font-heading text-base font-bold uppercase text-ivory lg:text-heading sm:right-12">{label}</span>
                                <ArrowRight size={20} aria-hidden="true" className="absolute bottom-4 right-4 hidden text-ivory sm:block" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
