import type { Metadata } from 'next';
import { connection } from 'next/server';
import Image from 'next/image';
import { AboutBanner } from '@/components/pages/AboutBanner';
import { IMAGES } from '@/lib/config';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { SHOP } from '@/shop/config';

// SITE_URL is read per request, never at module scope
export function generateMetadata(): Metadata {
    return pageMetadata({ url: new URL(ROUTES.about, storeEnv().SITE_URL).toString(), title: COPY.nav.about, description: SHOP.seo.about });
}

/** Reads no API, so an outage cannot break it. connection() keeps SITE_URL per request, like the other pages. */
export default async function AboutPage() {
    await connection();
    const { eyebrow, heading, paragraphs } = SHOP.about;
    return (
        <main>
            <AboutBanner />
            <section className="py-12 lg:py-16">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12">
                    <div className="w-full max-w-lg border-8 border-ivory outline outline-1 outline-stone">
                        <div className="relative aspect-4/3 bg-sand/40">
                            <Image src={IMAGES.story} alt="" fill loading="lazy" className="object-cover" />
                        </div>
                    </div>
                    <div>
                        <p className="text-label uppercase text-olive">{eyebrow}</p>
                        <h2 className="mt-2 font-heading text-heading text-forest">{heading}</h2>
                        <div className="mt-4 max-w-[60ch] space-y-4">
                            {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
