import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
    it('shows no cents for whole amounts', () => {
        expect(formatMoney(12000, 'EUR')).toBe('€120');
        expect(formatMoney(0, 'EUR')).toBe('€0');
    });

    it('always shows two digits otherwise', () => {
        expect(formatMoney(11950, 'EUR')).toBe('€119.50');
        expect(formatMoney(11905, 'EUR')).toBe('€119.05');
        expect(formatMoney(1, 'EUR')).toBe('€0.01');
        expect(formatMoney(123456789, 'EUR')).toBe('€1,234,567.89');
    });

    it('uses the pieces own currency', () => {
        expect(formatMoney(12000, 'GBP')).toBe('£120');
        expect(formatMoney(12000, 'USD')).toBe('US$120');
    });
});
