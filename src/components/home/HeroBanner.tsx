import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/buttons';
import { IMAGES } from '@/lib/config';
import { ROUTES } from '@/lib/routes';
import { SHOP } from '@/shop/config';

/** The home page's first screen and its LCP image: the frame has a fixed height, so a photo of any shape never moves the page */
export function HeroBanner() {
    const { eyebrow, headline, button } = SHOP.home.hero;
    return (
        <section className="relative h-105 overflow-hidden bg-forest md:h-120">
            <Image src={IMAGES.hero} alt="" fill loading="eager" fetchPriority="high" className="object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-forest/60 md:bg-transparent md:bg-linear-to-r md:from-forest/80 md:via-forest/60 md:to-forest/10" />
            <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
                <div className="max-w-xl">
                    <p className="text-label uppercase text-ivory">{eyebrow}</p>
                    <h1 className="mt-1 break-words font-heading text-heading uppercase text-ivory md:text-display">
                        {headline.map(sentence => <span key={sentence} className="block">{sentence}</span>)}
                    </h1>
                    <span aria-hidden="true" className="mt-6 block h-px w-12 bg-ivory/60" />
                    <ButtonLink variant="inverse" href={ROUTES.justDropped} className="mt-6 min-w-48 justify-between">
                        {button}
                        <ChevronRight size={16} aria-hidden="true" />
                    </ButtonLink>
                </div>
            </div>
        </section>
    );
}
