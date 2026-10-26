import { describe, expect, it } from 'vitest';
import { COPY } from './copy';

const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);

/** Every piece of text in a nested object; wording functions are called with sample values. */
function allText(value: unknown, path = ''): { path: string; text: string }[] {
    if (typeof value === 'string') return [{ path, text: value }];
    if (typeof value === 'function') {
        // '2' works wherever a number or a word is expected
        const args = Array.from({ length: value.length }, () => '2');
        return allText(value(...args), path);
    }
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, v]) => allText(v, path ? `${path}.${key}` : key));
    return [];
}

const withEmDash = (value: unknown) => allText(value).filter(({ text }) => text.includes(EM_DASH)).map(({ path }) => path);

// The site never shows an em dash
describe('on-screen text', () => {
    it('has no em dashes', () => {
        expect(withEmDash(COPY)).toEqual([]);
    });

    it('finds an em dash in strings and in wording functions, but not an en dash or a hyphen', () => {
        expect(withEmDash({ a: `x${EM_DASH}y`, f: (n: string) => n + EM_DASH })).toEqual(['a', 'f']);
        expect(withEmDash({ a: `x${EN_DASH}y`, b: 'x-y', f: (n: string) => n + EN_DASH })).toEqual([]);
    });

    it('calls the wording functions, so their output is checked', () => {
        expect(allText(COPY).some(({ path }) => path === 'status.errorId')).toBe(true);
    });
});
