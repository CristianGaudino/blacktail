import { Check, Minus, Plus } from 'lucide-react';
import { COPY } from '@/lib/copy';

/** The first `first` values in /filters order, plus any selected value beyond them; the rest are `more` (D-18) */
export function splitFacet(values: string[], selected: string[], first: number): { shown: string[]; more: string[] } {
    const shown: string[] = [];
    const more: string[] = [];
    values.forEach((value, i) => (i < first || selected.includes(value) ? shown : more).push(value));
    return { shown, more };
}

/** One collapsible filter group. A details element, so it also opens and closes without JavaScript */
export function FilterGroup({ title, open, children }: { title: string; open: boolean; children: React.ReactNode }) {
    return (
        <details open={open} className="group/group border-b border-stone py-6">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                <span className="text-label uppercase">{title}</span>
                <Plus aria-hidden="true" className="size-4 shrink-0 group-open/group:hidden" />
                <Minus aria-hidden="true" className="hidden size-4 shrink-0 group-open/group:block" />
            </summary>
            <div className="pt-2">{children}</div>
        </details>
    );
}

/** The values past the first few, in a native disclosure that works without JavaScript */
export function ShowMore({ children }: { children: React.ReactNode }) {
    return (
        <details className="group/more">
            <summary className="flex min-h-11 cursor-pointer list-none items-center text-label uppercase underline underline-offset-4 [&::-webkit-details-marker]:hidden">
                <span className="group-open/more:hidden">{COPY.catalogue.showMore}</span>
                <span className="hidden group-open/more:inline">{COPY.catalogue.showFewer}</span>
            </summary>
            {children}
        </details>
    );
}

/** A list of native checkboxes sharing one name, so the same markup is a GET form field and a draft control */
export function FacetList({ name, values, selected, labelOf, onToggle, first }: {
    name:     string;
    values:   string[];
    selected: string[];
    labelOf:  (value: string) => string;
    onToggle: (value: string) => void;
    first:    number;
}) {
    const { shown, more } = splitFacet(values, selected, first);
    const row = (value: string) => (
        <label key={value} className="flex min-h-11 items-center gap-2 text-base lg:min-h-8">
            <span className="relative flex size-4 shrink-0">
                <input
                    type="checkbox"
                    name={name}
                    value={value}
                    checked={selected.includes(value)}
                    onChange={() => onToggle(value)}
                    className="peer size-4 appearance-none border border-forest checked:bg-forest"
                />
                <Check aria-hidden="true" className="pointer-events-none absolute inset-0 hidden size-4 text-ivory peer-checked:block" />
            </span>
            <span className="[overflow-wrap:anywhere]">{labelOf(value)}</span>
        </label>
    );
    return (
        <div>
            {shown.map(row)}
            {more.length > 0 && <ShowMore>{more.map(row)}</ShowMore>}
        </div>
    );
}
