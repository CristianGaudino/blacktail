'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import { IconButton } from '@/components/ui/buttons';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';

/**
 * Search bar under the header. A native details element and a GET form, so it opens and submits
 * with JavaScript off; the script only moves focus (D-13). Submitting carries only q.
 */
export function HeaderSearch() {
    const details = useRef<HTMLDetailsElement>(null);
    const toggle  = useRef<HTMLElement>(null);
    const input   = useRef<HTMLInputElement>(null);
    const query   = useSearchParams().get('q') ?? '';
    // The input is only prefilled on the catalogue, where q is the active search
    const prefill = usePathname() === ROUTES.shop ? query : '';

    const close = () => {
        if (details.current) details.current.open = false;
        toggle.current?.focus();
    };

    return (
        <details
            ref={details}
            onToggle={e => { if (e.currentTarget.open) input.current?.focus(); }}
            onKeyDown={e => { if (e.key === 'Escape') close(); }}
        >
            <summary
                ref={toggle}
                aria-label={COPY.header.search}
                title={COPY.header.search}
                className="inline-flex size-11 cursor-pointer list-none items-center justify-center [&::-webkit-details-marker]:hidden"
            >
                <Search size={20} aria-hidden />
            </summary>
            <div className="absolute inset-x-0 top-full h-14 border-b border-stone bg-ivory">
                <form action={ROUTES.shop} method="get" role="search" className="mx-auto flex h-full max-w-7xl items-center gap-2 px-4 sm:px-6">
                    <label htmlFor="header-search" className="sr-only">{COPY.header.searchLabel}</label>
                    <input
                        key={prefill}
                        ref={input}
                        id="header-search"
                        type="search"
                        name="q"
                        defaultValue={prefill}
                        placeholder={COPY.header.searchHint}
                        className="h-11 min-w-0 flex-1 bg-transparent text-base placeholder:text-olive"
                    />
                    <IconButton type="submit" icon={Search} label={COPY.header.submitSearch} />
                    <IconButton icon={X} label={COPY.header.closeSearch} onClick={close} />
                </form>
            </div>
        </details>
    );
}
