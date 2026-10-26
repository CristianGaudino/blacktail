/** Readable name for a How many code. A code that is not in the map still shows (first letter capitalised), so a new code never breaks the page (D-19). */
export function label(code: string, map: Readonly<Record<string, string>>): string {
    return map[code.toLowerCase()] ?? code.charAt(0).toUpperCase() + code.slice(1);
}
