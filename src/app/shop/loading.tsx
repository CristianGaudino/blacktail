import { CatalogueBanner } from '@/components/catalogue/CatalogueBanner';

// Same banner and grid as the page, so nothing jumps when the real cards arrive
export default function Loading() {
    return (
        <main>
            <CatalogueBanner />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-12">
                <ul aria-hidden="true" className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                    {Array.from({ length: 8 }, (_, i) => (
                        <li key={i}>
                            <div className="aspect-[4/5] bg-sand/40 motion-safe:animate-pulse" />
                            <div className="mt-4 h-3 w-2/3 bg-sand/40" />
                            <div className="mt-2 h-3 w-1/3 bg-sand/40" />
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}
