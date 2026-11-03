import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { SHOP } from '@/shop/config';

export function CatalogueBanner({ title = COPY.catalogue.title, back }: { title?: string; back?: { href: string; label: string } }) {
    return (
        <section className="relative h-40 overflow-hidden bg-forest md:h-56">
            {SHOP.bannerImage && (
                <>
                    <Image src={SHOP.bannerImage} alt="" fill className="object-cover" loading="eager" fetchPriority="high" />
                    <div className="absolute inset-0 bg-linear-to-r from-forest/70 to-forest/20" />
                </>
            )}
            <div className="relative mx-auto flex h-full max-w-7xl flex-col items-start justify-end px-4 pb-6 sm:px-6">
                {back && (
                    <Link href={back.href} prefetch={false} className="inline-flex min-h-11 items-center gap-2 text-label uppercase text-ivory">
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        {back.label}
                    </Link>
                )}
                <h1 className="font-heading text-display text-ivory">{title}</h1>
            </div>
        </section>
    );
}
