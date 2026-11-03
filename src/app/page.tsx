import type { Metadata } from 'next';
import { connection } from 'next/server';
import { HeroBanner } from '@/components/home/HeroBanner';
import { JustDropped } from '@/components/home/JustDropped';
import { PromoBanners } from '@/components/home/PromoBanners';
import { StoryBand } from '@/components/home/StoryBand';
import { storeEnv } from '@/lib/env';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { SHOP } from '@/shop/config';

// SITE_URL is read here, per request, never at module scope and never from the Host header
export async function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        url:         new URL(ROUTES.home, storeEnv().SITE_URL).toString(),
        title:       { absolute: `${SHOP.name} | ${SHOP.seo.homeTitle}` },
        description: SHOP.seo.home,
    });
}

export default async function HomePage() {
    // Outside any try/catch: each data section guards its own read, but this signal must not be swallowed or the build would call the API
    await connection();
    return (
        <main>
            <HeroBanner />
            <JustDropped />
            <PromoBanners />
            <StoryBand />
        </main>
    );
}
