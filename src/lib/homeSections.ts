// Pure and client-safe: no env, no fetch. The orderings the home page sections render (D-07, D-05).
import { brandIndex, brandSlug } from '@/lib/brands';
import { HOME } from '@/lib/config';

/**
 * The brand strip order (D-07): brands in stock, then sold-before brands, each tier A to Z and then ranked by the shop's default order.
 * `soldBefore` is supplied by BRAND-05 (empty until How many provides it): sold-before brands show even with no stock and their
 * brand page renders the empty catalogue (D-21). A default-order brand that is in neither tier is never added (D-21).
 */
export function stripBrands(inStock: string[], soldBefore: readonly string[], defaultOrder: readonly string[]): { name: string; slug: string }[] {
    const rank = defaultOrder.map(brandSlug);
    const position = (slug: string) => (rank.includes(slug) ? rank.indexOf(slug) : rank.length);
    // Array.prototype.sort is stable, so unranked brands keep A to Z
    const byRank = (brands: { name: string; slug: string }[]) => [...brands].sort((a, b) => position(a.slug) - position(b.slug));
    const first = brandIndex(inStock);
    const stocked = new Set(first.map(b => b.slug));
    const second = brandIndex([...soldBefore]).filter(b => !stocked.has(b.slug));
    return [...byRank(first), ...byRank(second)].slice(0, HOME.stripBrands);
}
