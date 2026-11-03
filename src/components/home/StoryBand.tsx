import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/buttons';
import { IMAGES } from '@/lib/config';
import { ROUTES } from '@/lib/routes';
import { SHOP } from '@/shop/config';

/** The only Forest-filled button on the home page. Olive text never sits on this Sand band, so everything here is Forest */
export function StoryBand() {
    const { heading, body, button } = SHOP.home.story;
    return (
        <section aria-labelledby="home-story" className="bg-sand/40 py-12 lg:py-16">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12">
                <div>
                    <h2 id="home-story" className="font-heading text-heading uppercase text-forest">{heading}</h2>
                    <span aria-hidden="true" className="mt-6 block h-px w-12 bg-forest" />
                    <p className="mt-6 text-forest">{body}</p>
                    <ButtonLink href={ROUTES.about} className="mt-6 min-w-48 justify-between">
                        {button}
                        <ChevronRight size={16} aria-hidden="true" />
                    </ButtonLink>
                </div>
                <div className="mx-auto w-full max-w-lg border-8 border-ivory outline outline-1 outline-stone lg:-rotate-2">
                    <div className="relative aspect-4/3 bg-sand/40">
                        <Image src={IMAGES.story} alt="" fill loading="lazy" className="object-cover" />
                    </div>
                </div>
            </div>
        </section>
    );
}
