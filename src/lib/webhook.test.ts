import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseWebhookEvent, verifyWebhook } from './webhook';

const secret = 'a-secret-of-sufficient-length';
const nowMs = 1_800_000_000_000;
const nowS = nowMs / 1000;
const body = '{"store":"test-shop","event":"store.updated"}';
const sign = (ts: string, text = body, key = secret) => createHmac('sha256', key).update(`${ts}.${text}`).digest('hex');
const check = (over: Partial<{ secret: string; timestamp: string; signature: string; body: string }> = {}) => {
    const timestamp = over.timestamp ?? String(nowS - 10);
    return verifyWebhook({ secret, timestamp, signature: sign(timestamp), body, nowMs, ...over });
};

describe('verifyWebhook', () => {
    it('accepts a valid signature inside the window', async () => {
        expect(await check()).toBe(true);
        expect(await check({ timestamp: String(nowS - 299), signature: sign(String(nowS - 299)) })).toBe(true);
    });

    it('accepts an uppercase hex signature', async () => {
        expect(await check({ signature: sign(String(nowS - 10)).toUpperCase() })).toBe(true);
    });

    it('rejects a wrong secret and a tampered body', async () => {
        expect(await check({ signature: sign(String(nowS - 10), body, 'another-secret-long-enough') })).toBe(false);
        expect(await check({ body: `${body} ` })).toBe(false);
    });

    it('rejects timestamps outside the window, old or future', async () => {
        for (const age of [301, -301]) {
            const timestamp = String(nowS - age);
            expect(await check({ timestamp, signature: sign(timestamp) })).toBe(false);
        }
    });

    it('rejects malformed timestamps and signatures without throwing', async () => {
        const ts = String(nowS - 10);
        expect(await check({ timestamp: '12a', signature: sign('12a') })).toBe(false);
        expect(await check({ timestamp: '', signature: sign('') })).toBe(false);
        expect(await check({ signature: '' })).toBe(false);
        expect(await check({ signature: 'g'.repeat(64) })).toBe(false);
        expect(await check({ signature: 'é'.repeat(64) })).toBe(false);
        expect(await check({ signature: sign(ts).slice(2) })).toBe(false);
    });
});

describe('parseWebhookEvent', () => {
    it('returns null for anything that is not an object with a store and an event', () => {
        for (const text of ['', 'not json', '[]', 'null', '{"store":1,"event":"x"}']) expect(parseWebhookEvent(text)).toBeNull();
    });

    it('returns store and event, ignoring extra keys', () => {
        expect(parseWebhookEvent('{"store":"a","event":"store.updated","extra":1}')).toEqual({ store: 'a', event: 'store.updated' });
    });
});
