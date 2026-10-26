import { connection } from 'next/server';
import { ItemList } from '@/components/stock/ItemList';
import { getItems, getStore } from '@/lib/howmany/client';

export default async function HomePage() {
    // Render on each request, so nothing is fetched at build and the cached fetch is the only snapshot
    await connection();
    const [store, { page, asOf }] = await Promise.all([getStore(), getItems()]);
    return (
        <main>
            <h1>{store.name}</h1>
            <ItemList items={page.items} asOf={asOf} />
        </main>
    );
}
