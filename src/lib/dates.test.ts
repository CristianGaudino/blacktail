import { describe, expect, it } from 'vitest';
import { SHOP } from '@/shop/config';
import { formatDay, isNew } from './dates';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-26T12:00:00Z');
const before = (ms: number) => new Date(NOW - ms).toISOString();
const DAYS = SHOP.newBadgeDays;

describe('isNew', () => {
    it('uses the shop rule of 14 days (D-11)', () => {
        expect(DAYS).toBe(14);
        expect(isNew(before(13 * DAY), NOW, DAYS)).toBe(true);
    });

    it('is true for a piece published a day ago', () => {
        expect(isNew(before(DAY), NOW, DAYS)).toBe(true);
    });

    it('is false at exactly the cut-off and true 1 ms inside it', () => {
        expect(isNew(before(DAYS * DAY), NOW, DAYS)).toBe(false);
        expect(isNew(before(DAYS * DAY - 1), NOW, DAYS)).toBe(true);
    });

    it('is false for an empty or unparseable date and never throws', () => {
        expect(isNew('', NOW, DAYS)).toBe(false);
        expect(isNew('not-a-date', NOW, DAYS)).toBe(false);
    });
});

describe('formatDay', () => {
    // Pinned to en-IE; a shop with another locale needs its own expectation
    it('prints the date of the day key itself, whatever the machine time zone', () => {
        expect(SHOP.locale).toBe('en-IE');
        expect(formatDay('2026-11-03')).toBe('3 November 2026');
        expect(formatDay('2026-01-01')).toBe('1 January 2026');
        expect(formatDay('2026-12-31')).toBe('31 December 2026');
    });
});
