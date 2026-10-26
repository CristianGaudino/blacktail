'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { cn, isNavActive } from '@/lib/utils';

/** Hover opens the panel after this pause, so passing the pointer over the nav does not flicker it open. */
const HOVER_OPEN_DELAY_MS = 150;
const DESKTOP = '(min-width: 1024px)';

/** Disclosure dropdown: the button toggles a panel of links. Shared by Shop and Brands (D-12). */
export function NavDropdown({ label, href, links, columns = 1 }: {
    label:    string;
    href:     string;
    links:    { label: string; href: string }[];
    columns?: 1 | 2;
}) {
    const [open, setOpen] = useState(false);
    const wrapper   = useRef<HTMLDivElement>(null);
    const button    = useRef<HTMLButtonElement>(null);
    const timer     = useRef<ReturnType<typeof setTimeout>>(undefined);
    const panelId   = useId();
    const active    = isNavActive(usePathname(), href);

    const clearTimer = () => clearTimeout(timer.current);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: PointerEvent) => {
            if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    useEffect(() => clearTimer, []);

    return (
        <div
            ref={wrapper}
            className="relative"
            onPointerEnter={e => {
                if (e.pointerType !== 'mouse' || !window.matchMedia(DESKTOP).matches) return;
                clearTimer();
                timer.current = setTimeout(() => setOpen(true), HOVER_OPEN_DELAY_MS);
            }}
            onPointerLeave={e => {
                if (e.pointerType !== 'mouse' || !window.matchMedia(DESKTOP).matches) return;
                clearTimer();
                setOpen(false);
            }}
            onKeyDown={e => {
                if (e.key === 'Escape' && open) {
                    setOpen(false);
                    button.current?.focus();
                }
            }}
            onBlur={e => {
                if (!wrapper.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
            }}
        >
            <button
                ref={button}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => { clearTimer(); setOpen(o => !o); }}
                className={cn('inline-flex min-h-11 items-center gap-1 uppercase underline-offset-8', active && 'underline decoration-1')}
            >
                {label}
                <ChevronDown size={12} aria-hidden className={cn('transition-transform', open && 'rotate-180')} />
            </button>
            <div
                id={panelId}
                hidden={!open}
                className={cn(
                    'absolute top-full left-0 z-50 min-w-56 border border-stone bg-ivory p-4 normal-case tracking-normal',
                    columns === 2 && 'grid w-[28rem] max-h-[70vh] grid-cols-2 gap-x-4 overflow-y-auto',
                )}
            >
                {links.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className="flex min-h-11 items-center px-2 text-base [overflow-wrap:anywhere] hover:bg-sand/40 lg:min-h-8"
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
