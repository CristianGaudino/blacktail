import { extendTailwindMerge } from 'tailwind-merge';

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

/** Nav highlighting — Home only matches exactly, others match their subtree. */
export function isNavActive(pathname: string, href: string): boolean {
    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
