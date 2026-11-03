// Pure and client-safe: no env, no fetch.
import { SHOP } from '@/shop/config';

/** D-14: "Arc'teryx" -> arcteryx, "Dr. Martens" -> dr-martens. An empty slug means the name has no Latin letters or digits and gets no link */
export const brandSlug = (name: string): string =>
    name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** A to Z (case and accent insensitive) with one entry per slug: on a collision the first name in API order wins, and a name with no slug is dropped */
export function brandIndex(names: string[]): { name: string; slug: string }[] {
    const collator = new Intl.Collator(SHOP.locale, { sensitivity: 'base' });
    const seen = new Set<string>();
    return names
        .map(name => ({ name, slug: brandSlug(name) }))
        .filter(({ slug }) => slug !== '' && !seen.has(slug) && !!seen.add(slug))
        .sort((a, b) => collator.compare(a.name, b.name));
}

/** The slug to link a brand name to, or '' when none: a name with no slug, or one that lost a slug collision to another name, has no page of its own */
export const linkableSlug = (name: string, names: string[]): string => {
    const slug = brandSlug(name);
    return brandIndex(names).find(b => b.slug === slug)?.name === name ? slug : '';
};
