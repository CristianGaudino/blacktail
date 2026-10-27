import { extendTailwindMerge } from 'tailwind-merge';
import { BUILT_PAGES } from '@/lib/routes';

// Without the custom sizes tailwind-merge reads an unknown `text-*` as a colour and drops it
const twMerge = extendTailwindMerge({ extend: { classGroups: { 'font-size': [{ text: ['label', 'heading', 'display'] }] } } });

/**
 * Joins class names, skipping falsy values. When two classes set the same
 * thing (e.g. a base `w-full` and an override `w-20`), the later one wins —
 * plain joining would leave it to stylesheet order.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return twMerge(classes.filter(Boolean).join(' '));
}

/** True when the href points at a page that exists; a query or hash is ignored. See BUILT_PAGES. */
export function isBuilt(href: string): boolean {
    const path = href.split(/[?#]/)[0];
    return BUILT_PAGES.some(page => isNavActive(path, page));
}

/** Nav highlighting — Home only matches exactly, others match their subtree. */
export function isNavActive(pathname: string, href: string): boolean {
    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
