import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/buttons';
import { IMAGES } from '@/lib/config';
import { ROUTES } from '@/lib/routes';
import { SHOP } from '@/shop/config';

const FRAME = 'relative h-64 overflow-hidden bg-forest md:h-72';
const TEXT  = 'relative flex h-full items-center p-6 md:p-8';
const TITLE = 'break-words font-heading text-heading uppercase text-ivory lg:text-display';

/** Two static blocks under the carousel. Text stays inside the part of the overlay that is still Forest 60% or darker */
export function PromoBanners() {
    const { justDropped, brands } = SHOP.home.promos;
    return (
        <div className="grid md:grid-cols-2">
            <div className={FRAME}>
                <Image src={IMAGES.bannerJustDropped} alt="" fill loading="lazy" className="object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-forest/60 md:bg-transparent md:bg-linear-to-r md:from-forest/80 md:via-forest/60 md:to-forest/10" />
                <div className={TEXT}>
                    <div className="md:max-w-[60%]">
                        <h2 className={TITLE}>{justDropped.title}</h2>
                        <p className="mt-4 max-w-[36ch] text-ivory">{justDropped.body}</p>
                        <ButtonLink variant="inverse" href={ROUTES.justDropped} className="mt-6 min-w-48 justify-between">
                            {justDropped.button}
                            <ChevronRight size={16} aria-hidden="true" />
                        </ButtonLink>
                    </div>
                </div>
            </div>
            <div className={FRAME}>
                <Image src={IMAGES.bannerBrands} alt="" fill loading="lazy" className="object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-forest/60 md:bg-transparent md:bg-linear-to-l md:from-forest/80 md:via-forest/60 md:to-forest/10" />
                <div className={`${TEXT} md:justify-end`}>
                    <div className="md:max-w-[60%]">
                        <p className="text-label uppercase text-ivory">{brands.eyebrow}</p>
                        <h2 className={`mt-1 ${TITLE}`}>{brands.title}</h2>
                        <ButtonLink variant="inverse" href={ROUTES.brands} className="mt-6 min-w-48 justify-between">
                            {brands.button}
                            <ChevronRight size={16} aria-hidden="true" />
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </div>
    );
}
