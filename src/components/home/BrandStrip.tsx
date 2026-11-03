import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SOLD_BEFORE_BRANDS } from '@/lib/brands';
import { COPY } from '@/lib/copy';
import { getFilters } from '@/lib/howmany/client';
import { stripBrands } from '@/lib/homeSections';
import { ROUTES } from '@/lib/routes';
import { BRAND_LOGOS } from '@/shop/brand-logos';
import { SHOP } from '@/shop/config';

const CELL = 'flex h-11 items-center motion-safe:transition-colors motion-safe:duration-150 motion-safe:hover:bg-sand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest';

/**
 * One row of brands that scrolls inside its own frame; no arrows, no script (D-06). The label and the link are each rendered once
 * and placed with CSS order: a header row below 1024px, one row from 1024px. The logo src is built only from a manifest entry (T-04-08)
 */
export function BrandRow({ brands }: { brands: { name: string; slug: string }[] }) {
    if (brands.length === 0) return null;
    return (
        <section aria-labelledby="home-brands" className="border-y border-stone bg-ivory py-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 px-4 sm:px-6 lg:flex-nowrap lg:gap-x-8">
                <h2 id="home-brands" className="order-1 text-label uppercase text-olive lg:w-24">{SHOP.home.brands.heading}</h2>
                <span aria-hidden="true" className="order-2 hidden h-10 w-px bg-stone lg:block" />
                <Link
                    href={ROUTES.brands}
                    prefetch={false}
                    className="order-3 ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 text-label uppercase text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest lg:order-4 lg:ml-0"
                >
                    {COPY.home.viewAllBrands}
                    <ChevronRight size={16} aria-hidden="true" />
                </Link>
                <ul className="order-4 flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:order-3 lg:w-auto lg:flex-1 lg:gap-8 [&::-webkit-scrollbar]:hidden">
                    {brands.map(({ name, slug }) => (
                        <li key={slug} className="shrink-0 snap-start">
                            <Link href={ROUTES.brand(slug)} prefetch={false} className={`${CELL} ${BRAND_LOGOS.includes(slug) ? 'relative w-28' : 'px-2'}`}>
                                {BRAND_LOGOS.includes(slug) ? (
                                    <Image src={`/brands/${slug}.svg`} alt={name} fill loading="lazy" className="object-contain mix-blend-multiply" />
                                ) : (
                                    <span className="whitespace-nowrap font-heading text-base text-forest">{name}</span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

/**
 * The home brand strip (HOME-02, D-07). Shares the React-cached /filters read with the Header, so it adds no API call.
 * A failed read or no brands hides the whole band. The caller has already called connection().
 */
export async function BrandStrip() {
    let brands: { name: string; slug: string }[] = [];
    try {
        const filters = await getFilters();
        brands = stripBrands(filters.brand.map(f => f.value), SOLD_BEFORE_BRANDS, SHOP.defaultBrandOrder);
    } catch (error) {
        console.warn('Home: brand strip read failed', error);
    }
    return <BrandRow brands={brands} />;
}
