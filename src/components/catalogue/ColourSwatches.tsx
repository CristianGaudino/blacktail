import { SHOP } from '@/shop/config';
import { ShowMore, splitFacet } from './FilterGroup';

/**
 * Colour as a wrapping row of round swatches. Each is a native checkbox named colour, so it is a GET form
 * field too. The hex comes from the shop map; a colour not in the map gets a neutral swatch plus its name (D-15).
 */
export function ColourSwatches({ values, selected, onToggle, first }: {
    values:   string[];
    selected: string[];
    onToggle: (value: string) => void;
    first:    number;
}) {
    const { shown, more } = splitFacet(values, selected, first);
    const swatch = (value: string) => {
        const hex = SHOP.colours[value.toLowerCase()];
        return (
            <label key={value} className="flex min-h-11 min-w-11 items-center justify-center gap-2">
                <input
                    type="checkbox"
                    name="colour"
                    value={value}
                    checked={selected.includes(value)}
                    onChange={() => onToggle(value)}
                    aria-label={value}
                    title={value}
                    className="peer sr-only"
                />
                <span
                    aria-hidden="true"
                    style={hex ? { backgroundColor: hex } : undefined}
                    className={`size-6 shrink-0 rounded-full border border-stone peer-checked:ring-2 peer-checked:ring-forest peer-checked:ring-offset-4 peer-checked:ring-offset-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-forest ${hex ? '' : 'bg-sand'}`}
                />
                {!hex && <span aria-hidden="true" className="text-label [overflow-wrap:anywhere]">{value}</span>}
            </label>
        );
    };
    return (
        <div>
            <div className="flex flex-wrap gap-2">{shown.map(swatch)}</div>
            {more.length > 0 && <ShowMore><div className="flex flex-wrap gap-2">{more.map(swatch)}</div></ShowMore>}
        </div>
    );
}
