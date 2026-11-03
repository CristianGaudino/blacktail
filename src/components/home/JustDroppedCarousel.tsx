'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconButton } from '@/components/ui/buttons';
import { COPY } from '@/lib/copy';

/** Where the track is scrolled to. Browsers report fractional widths at 125% and 150% display scaling, hence the 1px tolerance */
export function carouselEdges(scrollLeft: number, clientWidth: number, scrollWidth: number) {
    return {
        overflows: scrollWidth - clientWidth > 1,
        atStart:   scrollLeft <= 1,
        atEnd:     scrollLeft + clientWidth >= scrollWidth - 1,
    };
}

/**
 * The only client part of the home page (D-12). It gets the heading words and the server-rendered cards as children,
 * never item data. The arrows exist only once the script has measured an overflow, so before that, and with few
 * pieces, the track is a plain swipeable list. No auto-advance and no library.
 */
export function JustDroppedCarousel({ headingId, heading, eyebrow, children }: {
    headingId: string;
    heading:   string;
    eyebrow:   string;
    children:  ReactNode;
}) {
    const track = useRef<HTMLUListElement>(null);
    const [edges, setEdges] = useState({ overflows: false, atStart: true, atEnd: true });

    useEffect(() => {
        const el = track.current;
        if (!el) return;
        const measure = () => setEdges(carouselEdges(el.scrollLeft, el.clientWidth, el.scrollWidth));
        let frame = 0;
        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => { frame = 0; measure(); });
        };
        // The observer reports once when it starts, which gives the first measurement
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            observer.disconnect();
            el.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);

    function page(direction: -1 | 1) {
        const el = track.current;
        if (!el) return;
        const calm = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollBy({ left: direction * el.clientWidth, behavior: calm ? 'smooth' : 'instant' });
    }

    return (
        <div role="region" aria-roledescription="carousel" aria-labelledby={headingId}>
            <div className="flex items-center gap-4">
                <h2 id={headingId} className="font-heading text-heading uppercase text-forest">{heading}</h2>
                <span aria-hidden="true" className="hidden h-px flex-1 bg-stone sm:block" />
                <p className="hidden text-label uppercase text-olive md:block">{eyebrow}</p>
                {edges.overflows && (
                    <div className="ml-auto flex gap-2">
                        <IconButton icon={ChevronLeft} label={COPY.home.previous} disabled={edges.atStart} onClick={() => page(-1)} />
                        <IconButton icon={ChevronRight} label={COPY.home.next} disabled={edges.atEnd} onClick={() => page(1)} />
                    </div>
                )}
            </div>
            <ul
                ref={track}
                className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden [&>li]:shrink-0 [&>li]:basis-[calc((100%_-_16px)/2)] [&>li]:snap-start sm:[&>li]:basis-[calc((100%_-_48px)/3)] lg:[&>li]:basis-[calc((100%_-_96px)/5)]"
            >
                {children}
            </ul>
        </div>
    );
}
