import Image from 'next/image';
import { IMAGES } from '@/lib/config';
import { SHOP } from '@/shop/config';

/** The About page's first screen and its LCP image; it grows with its text, unlike the fixed-height home hero */
export function AboutBanner() {
    const { title, lead, body } = SHOP.about;
    return (
        <section className="relative min-h-80 overflow-hidden bg-forest md:min-h-96">
            <Image src={IMAGES.hero} alt="" fill loading="eager" fetchPriority="high" className="object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-forest/60 md:bg-transparent md:bg-linear-to-r md:from-forest/80 md:via-forest/60 md:to-forest/10" />
            <div className="relative mx-auto flex min-h-80 max-w-7xl flex-col justify-end px-4 py-6 sm:px-6 md:min-h-96 md:py-12">
                <h1 className="font-heading text-display text-ivory">{title}</h1>
                <p className="mt-4 max-w-[36ch] text-label uppercase text-ivory">{lead}</p>
                <p className="mt-4 max-w-[60ch] text-ivory">{body}</p>
            </div>
        </section>
    );
}
