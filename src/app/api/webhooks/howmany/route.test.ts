import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidateTag } from 'next/cache';
import * as route from './route';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const secret = 'a-secret-of-sufficient-length';
const store = { event: 'store.updated', store: 'test-shop' };

const post = (body: string, over: { timestamp?: string; signature?: string; headers?: Record<string, string> } = {}) => {
    const timestamp = over.timestamp ?? String(Math.floor(Date.now() / 1000));
    const signature = over.signature ?? createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    return new Request('https://shop.test/api/webhooks/howmany', {
        method: 'POST',
        body,
        headers: { 'x-howmany-timestamp': timestamp, 'x-howmany-signature': signature, ...over.headers },
    });
};

beforeEach(() => {
    vi.stubEnv('STORE_SLUG', 'test-shop');
    vi.stubEnv('HOWMANY_API_URL', 'https://api.test/api/v1/stores/test-shop');
    vi.stubEnv('HOWMANY_WEBHOOK_SECRET', secret);
    vi.stubEnv('SITE_URL', 'https://shop.test');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(revalidateTag).mockClear();
});

const expect401 = async (res: Response) => {
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('');
    expect(revalidateTag).not.toHaveBeenCalled();
};

describe('POST /api/webhooks/howmany', () => {
    it('401 for an unsigned request', async () => {
        await expect401(await route.POST(new Request('https://shop.test/api/webhooks/howmany', { method: 'POST', body: JSON.stringify(store) })));
    });

    it('401 for a bad signature', async () => {
        await expect401(await route.POST(post(JSON.stringify(store), { signature: 'a'.repeat(64) })));
    });

    it('401 for a stale timestamp', async () => {
        await expect401(await route.POST(post(JSON.stringify(store), { timestamp: String(Math.floor(Date.now() / 1000) - 400) })));
    });

    it('401 for a signed but malformed body', async () => {
        await expect401(await route.POST(post('not json')));
        await expect401(await route.POST(post('[]')));
    });

    it('401 when content-length is above the limit', async () => {
        await expect401(await route.POST(post(JSON.stringify(store), { headers: { 'content-length': '100000' } })));
    });

    it('401 for a chunked body above the limit, with no content-length, and stops reading it', async () => {
        let pulls = 0;
        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                pulls++;
                controller.enqueue(new Uint8Array(4096));
            },
        });
        const request = new Request('https://shop.test/api/webhooks/howmany', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
        await expect401(await route.POST(request));
        expect(pulls).toBeLessThan(10);
    });

    it('204 and revalidateTag for a valid event for this store', async () => {
        const res = await route.POST(post(JSON.stringify(store)));
        expect(res.status).toBe(204);
        expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('store:test-shop', { expire: 0 });
    });

    it('is idempotent: the same valid request twice gives 204 twice with the same revalidation', async () => {
        const request = post(JSON.stringify(store));
        const again = request.clone();
        expect((await route.POST(request)).status).toBe(204);
        expect((await route.POST(again)).status).toBe(204);
        expect(revalidateTag).toHaveBeenCalledTimes(2);
        expect(vi.mocked(revalidateTag).mock.calls[0]).toEqual(vi.mocked(revalidateTag).mock.calls[1]);
    });

    it('204 without revalidation for another store, a different letter case or another event', async () => {
        for (const body of [{ ...store, store: 'other-shop' }, { ...store, store: 'Test-Shop' }, { ...store, event: 'store.deleted' }]) {
            const res = await route.POST(post(JSON.stringify(body)));
            expect(res.status).toBe(204);
        }
        expect(revalidateTag).not.toHaveBeenCalled();
    });

    it('exports no GET', () => {
        expect('GET' in route).toBe(false);
    });
});
