import { describe, expect, it } from 'vitest';
import { isIndexingOn, securityHeaders } from './indexing';

describe('isIndexingOn', () => {
    it('is true only for the exact string true', () => {
        expect(isIndexingOn('true')).toBe(true);
        for (const raw of ['false', undefined, '', 'TRUE', 'yes', '1', ' true']) expect(isIndexingOn(raw), String(raw)).toBe(false);
    });
});

describe('securityHeaders', () => {
    it('puts X-Robots-Tag first while indexing is off', () => {
        const headers = securityHeaders(false);
        expect(headers).toHaveLength(5);
        expect(headers[0]).toEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    });

    it('drops only X-Robots-Tag when indexing is on', () => {
        expect(securityHeaders(true)).toEqual(securityHeaders(false).slice(1));
        expect(securityHeaders(true).map(h => h.key)).not.toContain('X-Robots-Tag');
    });
});
