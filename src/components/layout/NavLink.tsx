'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, isBuilt, isNavActive } from '@/lib/utils';

/** A header link that marks the current route with aria-current and a 1px Forest underline. */
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const active = isNavActive(usePathname(), href);
    if (!isBuilt(href)) return null;
    return (
        <Link
            href={href}
            prefetch={false}
            aria-current={active ? 'page' : undefined}
            className={cn('underline-offset-8', active && 'underline decoration-1')}
        >
            {children}
        </Link>
    );
}
