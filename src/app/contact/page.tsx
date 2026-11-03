import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';
import { ContactPanel } from '@/components/pages/ContactPanel';
import { COPY } from '@/lib/copy';
import { storeEnv } from '@/lib/env';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { SHOP } from '@/shop/config';

export function generateMetadata(): Metadata {
    return pageMetadata({ url: new URL(ROUTES.contact, storeEnv().SITE_URL).toString(), title: COPY.nav.contact, description: SHOP.seo.contact });
}

/** Reads no API, so an outage cannot break it (connection() keeps SITE_URL per request). Every value comes from SHOP (D-15). */
export default async function ContactPage() {
    await connection();
    return (
        <main>
            <CatalogueBanner title={COPY.nav.contact} />
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:py-12">
                <div>
                    <h2 className="font-heading text-heading text-forest">{SHOP.contact.heading}</h2>
                    <p className="mt-4 max-w-[60ch]">{SHOP.contact.intro}</p>
                </div>
                <ContactPanel email={SHOP.contact.email} platforms={SHOP.platforms} socials={SHOP.socials} />
            </div>
        </main>
    );
}
