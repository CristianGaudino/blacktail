import { X } from 'lucide-react';
import Link from 'next/link';
import { CATALOGUE } from '@/lib/config';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery, Filters, RangeKey } from '@/lib/definitions';
import { LABEL_MAPS, label } from '@/lib/labels';
import { formatMoney } from '@/lib/money';
import { rangeBounds, shopHref } from '@/lib/params';
import { ROUTES } from '@/lib/routes';

type Chip = { key: string; text: string; href: string };

/** One removable chip per choice, each linking to the same URL minus that choice (and minus page) */
function buildChips(query: CatalogueQuery, filters: Filters, currency: string): Chip[] {
    const chips: Chip[] = [];
    for (const key of CATALOGUE.lists) {
        for (const value of query.lists[key]) {
            const map = LABEL_MAPS[key];
            chips.push({
                key:  `${key}:${value}`,
                text: map ? label(value, map) : value,
                href: shopHref({ ...query, lists: { ...query.lists, [key]: query.lists[key].filter(v => v !== value) } }),
            });
        }
    }
    const rangeText: Record<RangeKey, (from: number, to: number) => string> = {
        price:    (from, to) => COPY.catalogue.range(formatMoney(from, currency), formatMoney(to, currency)),
        pitToPit: (from, to) => COPY.catalogue.pitToPitChip(String(from / 10), String(to / 10)),
        length:   (from, to) => COPY.catalogue.lengthChip(String(from / 10), String(to / 10)),
    };
    for (const key of Object.keys(CATALOGUE.ranges) as RangeKey[]) {
        const { min, max } = query.ranges[key];
        const available = filters[CATALOGUE.ranges[key].filter];
        if ((min === null && max === null) || !available) continue;
        const bounds = rangeBounds(available, CATALOGUE.ranges[key].step);
        chips.push({
            key,
            text: rangeText[key](min ?? bounds.min, max ?? bounds.max),
            href: shopHref({ ...query, ranges: { ...query.ranges, [key]: { min: null, max: null } } }),
        });
    }
    if (query.q) chips.push({ key: 'q', text: COPY.catalogue.searchChip(query.q), href: shopHref({ ...query, q: '' }) });
    return chips;
}

export function FilterChips({ query, filters, currency }: { query: CatalogueQuery; filters: Filters; currency: string }) {
    const chips = buildChips(query, filters, currency);
    if (chips.length === 0) return null;
    return (
        <ul className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map(chip => (
                <li key={chip.key}>
                    <Link
                        href={chip.href}
                        prefetch={false}
                        aria-label={COPY.catalogue.removeChip(chip.text)}
                        className="inline-flex min-h-10 items-center gap-2 bg-sand/40 px-3 text-base text-forest"
                    >
                        <span className="[overflow-wrap:anywhere]">{chip.text}</span>
                        <X aria-hidden="true" className="size-4 shrink-0" />
                    </Link>
                </li>
            ))}
            <li>
                <Link href={ROUTES.shop} prefetch={false} className="text-base text-forest underline underline-offset-4">{COPY.catalogue.clearAll}</Link>
            </li>
        </ul>
    );
}
