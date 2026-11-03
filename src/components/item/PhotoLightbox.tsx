'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { IconButton } from '@/components/ui/buttons';
import { useModalDialog } from '@/hooks/useModalDialog';
import { COPY } from '@/lib/copy';
import type { ItemPhoto } from '@/lib/definitions';

const ARROW = 'absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone bg-ivory text-forest';

/**
 * Full-viewport viewer on a native <dialog>: focus, Esc and backdrop come from useModalDialog. Not a Sheet (no slide-in).
 * The full-size photo is mounted only while open, so neighbours are never fetched in advance.
 */
export function PhotoLightbox({ photos, index, open, name, onIndex, onClose }: {
    photos:  ItemPhoto[];
    index:   number;
    open:    boolean;
    name:    string;
    onIndex: (index: number) => void;
    onClose: () => void;
}) {
    const dialog = useModalDialog(open, onClose);
    const total = photos.length;
    const photo = photos[index];
    const step = (by: number) => onIndex((index + by + total) % total);

    return (
        <dialog
            {...dialog}
            aria-label={COPY.item.viewer(name)}
            onKeyDown={e => {
                if (total < 2) return;
                if (e.key === 'ArrowLeft') step(-1);
                if (e.key === 'ArrowRight') step(1);
            }}
            className="lightbox m-0 h-dvh max-h-dvh w-screen max-w-none flex-col bg-ivory p-0 text-forest outline-none backdrop:bg-forest/50 open:flex"
        >
            <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-stone px-4">
                <p aria-live="polite" className="text-label uppercase">{COPY.item.photoOf(index + 1, total)}</p>
                <IconButton icon={X} label={COPY.item.closeViewer} onClick={onClose} className="-mr-2" />
            </header>
            {/* Not flex-1: from a zero basis, iOS Safari can size the dialog to the header alone */}
            <div className="relative min-h-0 flex-auto bg-sand/40">
                {open && photo && (
                    <Image src={photo.url} alt={COPY.item.photoAlt(name, index + 1)} fill sizes="100vw" className="object-contain" />
                )}
                {total > 1 && (
                    <>
                        <button type="button" aria-label={COPY.item.previousPhoto} onClick={() => step(-1)} className={`${ARROW} left-4`}>
                            <ChevronLeft aria-hidden="true" className="size-5" />
                        </button>
                        <button type="button" aria-label={COPY.item.nextPhoto} onClick={() => step(1)} className={`${ARROW} right-4`}>
                            <ChevronRight aria-hidden="true" className="size-5" />
                        </button>
                    </>
                )}
            </div>
        </dialog>
    );
}
