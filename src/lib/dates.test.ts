import { describe, expect, it } from 'vitest';
import { isNew } from './dates';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-26T12:00:00Z');
const before = (ms: number) => new Date(NOW - ms).toISOString();

describe('isNew', () => {
    it('is true for a piece published a day ago', () => {
        expect(isNew(before(DAY), NOW, 7)).toBe(true);
    });

    it('is false at exactly the cut-off and true 1 ms inside it', () => {
        expect(isNew(before(7 * DAY), NOW, 7)).toBe(false);
        expect(isNew(before(7 * DAY - 1), NOW, 7)).toBe(true);
    });

    it('is false for an empty or unparseable date and never throws', () => {
        expect(isNew('', NOW, 7)).toBe(false);
        expect(isNew('not-a-date', NOW, 7)).toBe(false);
    });
});
