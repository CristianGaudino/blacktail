import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';
import { ItemDetails } from '@/components/item/ItemDetails';
import { ItemGallery } from '@/components/item/ItemGallery';
import { ItemJsonLd } from '@/components/item/ItemJsonLd';
import { MoreFromBrand } from '@/components/item/MoreFromBrand';
import { WhereToBuy } from '@/components/item/WhereToBuy';
import { brandSlug, linkableSlug } from '@/lib/brands';
import { storeEnv } from '@/lib/env';
import { getFilters, getItem, getItemsPage } from '@/lib/howmany/client';
import { formatMoney } from '@/lib/money';
import { ROUTES } from '@/lib/routes';

const nameOf = (item: { brand: string | null; title: string }) => [item.brand, item.title].filter(Boolean).join(' ');
// SITE_URL is read per call, never at module scope and never from the Host header
const itemUrl = (code: string) => new URL(ROUTES.item(code), storeEnv().SITE_URL).toString();

export async function generateMetadata({ params }: PageProps<'/items/[code]'>): Promise<Metadata> {
    const item = await getItem((await params).code);
    // a 404 thrown from metadata would answer 200 (Pitfall 1): the page body decides the status
    if (!item) return {};
    return { title: nameOf(item), alternates: { canonical: itemUrl(item.code) } };
}

export default async function ItemPage({ params }: PageProps<'/items/[code]'>) {
    // Render on each request over the tagged fetch cache: no generateStaticParams, nothing fetched at build (D-11)
    await connection();
    // Started now: the Header asks for the same list, so this is one cached read that overlaps the item read
    const filtersRead = getFilters().catch(() => null);
    const item = await getItem((await params).code);
    // Thrown from the page body, before any output, this is a real 404 (from generateMetadata it would be a 200)
    if (!item) notFound();
    // Two names can share a slug (Arc'teryx, Arcteryx): link only to a brand page that shows this brand. A failed /filters read keeps the link.
    const filters = await filtersRead;
    const slug = !item.brand ? '' : filters ? linkableSlug(item.brand, filters.brand.map(f => f.value)) : brandSlug(item.brand);
    // Exactly the query of page 1 of the brand page (never a limit of our own), so this shares its cache entry and adds no API call.
    // A failed read hides the row instead of showing the error screen.
    const more = item.brand
        ? await getItemsPage(new URLSearchParams({ brand: item.brand }).toString()).catch(() => {
            console.warn('Item page: more-from read failed');
            return null;
        })
        : null;
    // One clock per render, so every card agrees about what is new
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-12">
            <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
                <div className="-mx-4 sm:-mx-6 lg:mx-0">
                    <ItemGallery photos={item.photos} name={nameOf(item)} />
                </div>
                <div className="mt-6 flex flex-col lg:mt-0">
                    {item.brand && (
                        <p className="mb-2 text-label uppercase">
                            {slug
                                ? <Link href={ROUTES.brand(slug)} prefetch={false} className="inline-flex min-h-11 items-center hover:underline">{item.brand}</Link>
                                : item.brand}
                        </p>
                    )}
                    <h1 className="font-heading text-heading leading-[1.2] break-words lg:text-display">{item.title}</h1>
                    <p className="mt-4 font-heading text-heading tabular-nums">{formatMoney(item.priceCents, item.currency)}</p>
                    <div className="mt-6"><WhereToBuy /></div>
                    <div className="mt-8"><ItemDetails item={item} /></div>
                </div>
            </div>
            {item.brand && more && <MoreFromBrand brand={item.brand} slug={slug} code={item.code} items={more.page.items} now={now} />}
            <ItemJsonLd item={item} url={itemUrl(item.code)} />
        </main>
    );
}
