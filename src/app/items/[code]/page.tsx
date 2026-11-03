import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getItem } from '@/lib/howmany/client';
import { formatMoney } from '@/lib/money';

export default async function ItemPage({ params }: PageProps<'/items/[code]'>) {
    // Render on each request over the tagged fetch cache: no generateStaticParams, nothing fetched at build (D-11)
    await connection();
    const item = await getItem((await params).code);
    // Thrown from the page body, before any output, this is a real 404 (from generateMetadata it would be a 200)
    if (!item) notFound();
    return (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-12">
            <div className="flex flex-col">
                {item.brand && <p className="mb-2 text-label uppercase">{item.brand}</p>}
                <h1 className="font-heading text-heading leading-[1.2] break-words lg:text-display">{item.title}</h1>
                <p className="mt-4 font-heading text-heading tabular-nums">{formatMoney(item.priceCents, item.currency)}</p>
            </div>
        </main>
    );
}
