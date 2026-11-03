'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { COPY } from '@/lib/copy';
import type { ItemPhoto } from '@/lib/definitions';
import { cn } from '@/lib/utils';

/** Past this many photos the dots become a "n / total" text */
const MAX_DOTS = 10;

/**
 * Gets the photos and the display name only, never the item: its details would ship in the RSC payload.
 * One scroll-snap track of full-size photos on every viewport; its frame takes the cover's ratio, so
 * switching photos never moves the page.
 */
export function ItemGallery({ photos, name }: { photos: ItemPhoto[]; name: string }) {
    const [index, setIndex] = useState(0);
    const track = useRef<HTMLDivElement>(null);
    const slides = useRef<(HTMLDivElement | null)[]>([]);
    // The slide a thumbnail jump is heading to: updates for the slides passed on the way are ignored
    const pending = useRef<number | null>(null);
    const total = photos.length;
    const cover = photos[0];

    useEffect(() => {
        const root = track.current;
        if (!root || total < 2) return;
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const i = slides.current.indexOf(entry.target as HTMLDivElement);
                if (i < 0) continue;
                if (pending.current !== null) {
                    if (i !== pending.current) continue;
                    pending.current = null;
                }
                setIndex(i);
            }
        }, { root, threshold: 0.6 });
        for (const slide of slides.current) if (slide) observer.observe(slide);
        return () => observer.disconnect();
    }, [total]);

    function scrollToPhoto(i: number, smooth: boolean) {
        const root = track.current;
        const slide = slides.current[i];
        if (!root || !slide) return;
        setIndex(i);
        // Already there: no intersection change will follow to clear it
        pending.current = Math.abs(root.scrollLeft - slide.offsetLeft) < 1 ? null : i;
        const calm = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        root.scrollTo({ left: slide.offsetLeft, behavior: smooth && calm ? 'smooth' : 'instant' });
    }

    return (
        <div className={cn(total > 1 && 'lg:grid lg:grid-cols-[80px_minmax(0,1fr)] lg:gap-4')}>
            {total > 1 && (
                <div className="relative hidden lg:block">
                    <div className="absolute inset-0 flex flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {photos.map((photo, i) => (
                            <button
                                key={photo.url}
                                type="button"
                                aria-label={COPY.item.showPhoto(i + 1)}
                                aria-current={i === index ? 'true' : undefined}
                                onClick={() => scrollToPhoto(i, true)}
                                className={cn('aspect-[4/5] w-20 shrink-0 overflow-hidden border-2 bg-sand/40 hover:border-stone', i === index ? 'border-forest' : 'border-transparent')}
                            >
                                <Image src={photo.thumbUrl} width={photo.width} height={photo.height} alt="" loading="lazy" className="size-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div>
                {cover ? (
                    <div
                        ref={track}
                        role="region"
                        aria-roledescription="carousel"
                        aria-label={COPY.item.photos}
                        tabIndex={0}
                        onPointerDown={() => { pending.current = null; }}
                        style={{ aspectRatio: `${cover.width} / ${cover.height}` }}
                        className="relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {photos.map((photo, i) => (
                            <div
                                key={photo.url}
                                ref={el => { slides.current[i] = el; }}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={COPY.item.photoOf(i + 1, total)}
                                className="h-full w-full shrink-0 snap-center bg-sand/40"
                            >
                                <button type="button" aria-label={COPY.item.openPhoto(i + 1, total)} className="block size-full cursor-zoom-in">
                                    <Image
                                        src={photo.url}
                                        width={photo.width}
                                        height={photo.height}
                                        alt={COPY.item.photoAlt(name, i + 1)}
                                        className="size-full object-contain"
                                        {...(i === 0 ? { loading: 'eager' as const, fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="aspect-[4/5] bg-sand/40" />
                )}
                {total > 1 && (
                    <>
                        <div aria-hidden="true" className="mt-4 flex justify-center gap-2 lg:hidden">
                            {total > MAX_DOTS
                                ? <span className="text-label uppercase text-olive">{COPY.item.position(index + 1, total)}</span>
                                : photos.map((photo, i) => <span key={photo.url} className={cn('size-2 rounded-full', i === index ? 'bg-forest' : 'bg-stone')} />)}
                        </div>
                        <p className="sr-only" aria-live="polite">{COPY.item.photoOf(index + 1, total)}</p>
                    </>
                )}
            </div>
        </div>
    );
}
