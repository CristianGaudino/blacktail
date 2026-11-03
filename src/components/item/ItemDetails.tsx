import { COPY } from '@/lib/copy';
import type { Item } from '@/lib/definitions';
import { label } from '@/lib/labels';
import { cm, inches } from '@/lib/money';

type Row = { label: string; value: string };

/** The API sends "" (not null) for a colour, era or size it does not have */
const present = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

function Block({ heading, rows }: { heading: string; rows: Row[] }) {
    return (
        <section>
            <h2 className="mb-2 text-label uppercase text-olive">{heading}</h2>
            <dl className="border-t border-stone">
                {rows.map(row => (
                    <div key={row.label} className="grid grid-cols-[128px_1fr] gap-x-4 border-b border-stone py-2">
                        <dt className="text-label uppercase text-olive">{row.label}</dt>
                        <dd className="text-base text-forest [overflow-wrap:anywhere]">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

/**
 * Details and measurements. Named fields only: `details` is never iterated, so nothing but the
 * one `material` key can reach the markup (CLAUDE.md privacy rule).
 */
export function ItemDetails({ item }: { item: Item }) {
    const groups = COPY.catalogue.groups;
    // Material: a top-level field first (the API filters it there), then details.material
    const material = [item.material, item.details.material].find(present);
    const details: Row[] = ([
        [groups.size, item.size],
        [groups.colour, item.colour],
        [groups.era, item.era],
        [groups.department, present(item.department) ? label(item.department, COPY.labels.department) : null],
        [groups.condition, label(item.condition, COPY.labels.condition)],
        [groups.material, material],
    ] as [string, string | null | undefined][]).flatMap(([rowLabel, value]) => (present(value) ? [{ label: rowLabel, value }] : []));
    const measurements: Row[] = [
        { label: groups.pitToPit, mm: item.measurements.pitToPitMm },
        { label: groups.length, mm: item.measurements.lengthMm },
    ].flatMap(({ label: rowLabel, mm }) => (typeof mm === 'number' ? [{ label: rowLabel, value: COPY.item.measurement(cm(mm), inches(mm)) }] : []));
    return (
        <div className="flex flex-col gap-8">
            <Block heading={COPY.item.details} rows={details} />
            {measurements.length > 0 && <Block heading={COPY.item.measurements} rows={measurements} />}
        </div>
    );
}
