import Image from 'next/image';
import { COPY } from '@/lib/copy';
import { SHOP } from '@/shop/config';

export function CatalogueBanner() {
    return (
        <section className="relative h-40 overflow-hidden bg-forest md:h-56">
            {SHOP.bannerImage && (
                <>
                    <Image src={SHOP.bannerImage} alt="" fill className="object-cover" loading="eager" fetchPriority="high" />
                    <div className="absolute inset-0 bg-linear-to-r from-forest/70 to-forest/20" />
                </>
            )}
            <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-6 sm:px-6">
                <h1 className="font-heading text-display text-ivory">{COPY.catalogue.title}</h1>
            </div>
        </section>
    );
}
