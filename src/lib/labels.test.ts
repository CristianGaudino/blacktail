import { describe, expect, it } from 'vitest';
import { COPY } from './copy';
import { label } from './labels';

describe('label', () => {
    it('looks a code up case-insensitively', () => {
        expect(label('knit', COPY.labels.type)).toBe('Knitwear');
        expect(label('KNIT', COPY.labels.type)).toBe('Knitwear');
        expect(label('AB', COPY.labels.condition)).toBe('AB Very good');
        expect(label('A', COPY.labels.condition)).toBe('A Excellent');
        expect(label('B', COPY.labels.condition)).toBe('B Good');
        expect(label('mens', COPY.labels.department)).toBe('Mens');
    });

    it('falls back to the code with its first letter capitalised', () => {
        expect(label('vest', COPY.labels.type)).toBe('Vest');
        expect(label('unisex', COPY.labels.department)).toBe('Unisex');
    });

    it('returns an empty string for an empty code', () => {
        expect(label('', COPY.labels.type)).toBe('');
    });
});
