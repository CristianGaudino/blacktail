import Image from 'next/image';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';
import { BRAND_LOGOS } from '@/shop/brand-logos';

/** Logo tile when the committed manifest lists the slug, else the name in Bodoni. The src is built only from a manifest entry (T-03-10) */
export function BrandGrid({ brands }: { brands: { name: string; slug: string }[] }) {
    if (brands.length === 0) return <p className="py-16 text-center">{COPY.stock.empty}</p>;
    return (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {brands.map(({ name, slug }) => (
                <li key={slug}>
                    <Link
                        href={ROUTES.brand(slug)}
                        prefetch={false}
                        className="relative flex aspect-3/2 items-center justify-center border border-stone bg-ivory transition-colors duration-150 hover:bg-sand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                    >
                        {BRAND_LOGOS.includes(slug) ? (
                            <Image src={`/brands/${slug}.svg`} alt={name} fill loading="lazy" className="object-contain p-6 mix-blend-multiply" />
                        ) : (
                            <span className="line-clamp-2 break-words px-4 text-center font-heading text-heading">{name}</span>
                        )}
                    </Link>
                </li>
            ))}
        </ul>
    );
}
