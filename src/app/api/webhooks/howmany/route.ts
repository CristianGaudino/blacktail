import { revalidateTag } from 'next/cache';
import { CACHE, STORE_API } from '@/lib/config';
import { storeEnv } from '@/lib/env';
import { storeTag } from '@/lib/howmany/client';
import { parseWebhookEvent, verifyWebhook } from '@/lib/webhook';

/** Never echoes why, and never logs the body, headers or secret */
const refuse = (reason: 'size' | 'signature' | 'body') => {
    console.warn(`How many webhook refused: ${reason}`);
    return new Response(null, { status: 401 });
};

export async function POST(request: Request): Promise<Response> {
    const { STORE_SLUG, HOWMANY_WEBHOOK_SECRET } = storeEnv();

    if (Number(request.headers.get('content-length')) > STORE_API.webhookMaxBytes) return refuse('size');
    const body = await request.text();
    if (body.length > STORE_API.webhookMaxBytes) return refuse('size');

    const verified = await verifyWebhook({
        secret:    HOWMANY_WEBHOOK_SECRET,
        timestamp: request.headers.get('x-howmany-timestamp') ?? '',
        signature: request.headers.get('x-howmany-signature') ?? '',
        body,
    });
    if (!verified) return refuse('signature');

    const event = parseWebhookEvent(body);
    if (!event) return refuse('body');

    if (event.store !== STORE_SLUG || event.event !== STORE_API.webhookEvent) {
        console.warn('How many webhook ignored: other store or event');
        return new Response(null, { status: 204 });
    }

    // The tag always comes from env, never from the body
    revalidateTag(storeTag(), CACHE.webhookRevalidate);
    return new Response(null, { status: 204 });
}
