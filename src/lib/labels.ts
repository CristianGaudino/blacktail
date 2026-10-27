import { COPY } from '@/lib/copy';

/** Readable name for a How many code. A code that is not in the map still shows (first letter capitalised), so a new code never breaks the page (D-19). */
export function label(code: string, map: Readonly<Record<string, string>>): string {
    return map[code.toLowerCase()] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

/** Code-to-label maps for the filter lists that have one; other lists show the API value */
export const LABEL_MAPS: Partial<Record<string, Readonly<Record<string, string>>>> = {
    type:       COPY.labels.type,
    department: COPY.labels.department,
    condition:  COPY.labels.condition,
};
