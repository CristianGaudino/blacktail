import { connection } from 'next/server';
import { ItemGrid } from '@/components/catalogue/ItemGrid';
import { ButtonLink } from '@/components/ui/buttons';
import { StatusScreen } from '@/components/ui/StatusScreen';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { getItemsPage } from '@/lib/howmany/client';
import { ROUTES } from '@/lib/routes';

/** A sold, hidden or unknown piece: a real 404 (the page body called notFound()) with the newest drops. Nothing about the piece is shown. */
export default async function ItemGone() {
    // This reads the API, so it must never run at build
    await connection();
    // Same cache key as page 1 of /shop, so no extra API call; a failed read leaves the drops out
    const drops = await getItemsPage('').then(
        ({ page, asOf }) => ({ items: page.items.slice(0, CATALOGUE.goneDrops), asOf }),
        (): { items: Item[]; asOf: string | null } | null => {
            console.warn('Gone page: /items failed');
            return null;
        },
    );
    // One clock per render, so every card agrees about what is new
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (
        <main>
            <StatusScreen bare title={COPY.gone.title} message={COPY.gone.body}>
                <ButtonLink variant="primary" href={ROUTES.shop}>{COPY.common.shopAll}</ButtonLink>
            </StatusScreen>
            {drops && (drops.items.length > 0 ? (
                <section aria-labelledby="newest-drops" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
                    <h2 id="newest-drops" className="mb-6 font-heading text-heading">{COPY.gone.newest}</h2>
                    <ItemGrid row items={drops.items} asOf={drops.asOf} now={now} />
                </section>
            ) : (
                <p className="pb-16 text-center">{COPY.stock.empty}</p>
            ))}
        </main>
    );
}
