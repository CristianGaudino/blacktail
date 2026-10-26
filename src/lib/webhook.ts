import { STORE_API } from '@/lib/config';
import { webhookEventSchema } from '@/lib/howmany/schemas';

const HEX64 = /^[0-9a-f]{64}$/i;
const SECONDS = /^\d{1,12}$/;
const encoder = new TextEncoder();

const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], byte => parseInt(byte, 16));

/**
 * Checks How many's X-Howmany-Timestamp / X-Howmany-Signature pair: HMAC-SHA256 of `${timestamp}.${body}`
 * within a 5 minute window. The shape guards run before any crypto, so no input (a multi-byte
 * signature, a huge timestamp) can throw; WebCrypto's verify compares in constant time.
 */
export async function verifyWebhook({ secret, timestamp, signature, body, nowMs = Date.now() }: {
    secret: string; timestamp: string; signature: string; body: string; nowMs?: number;
}): Promise<boolean> {
    if (!SECONDS.test(timestamp) || !HEX64.test(signature)) return false;
    if (!(Math.abs(nowMs / 1000 - Number(timestamp)) < STORE_API.webhookToleranceSeconds)) return false;
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, fromHex(signature), encoder.encode(`${timestamp}.${body}`));
}

/** The store and event named in a webhook body, or null when it is not JSON or lacks them */
export function parseWebhookEvent(body: string): { store: string; event: string } | null {
    try {
        const parsed = webhookEventSchema.safeParse(JSON.parse(body));
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}
