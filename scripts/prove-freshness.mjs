// Freshness round trip: a signed How many webhook must refresh the list within seconds.
// Usage: node scripts/prove-freshness.mjs <baseUrl> [--mock <mockUrl>] [--outage]
// Needs HOWMANY_WEBHOOK_SECRET and STORE_SLUG in the environment. No dependencies.
// The stock page is /shop; / only redirects to it (307).
// Runs against `next start`, `wrangler dev` and the deployed Worker. Without --mock only the
// checks that need no mock run (no request counters, data-as-of only for the round trip).
import { createHmac } from 'node:crypto';

const args = process.argv.slice(2);
const flag = name => args.indexOf(`--${name}`);
const base = args[0]?.startsWith('--') ? undefined : args[0]?.replace(/\/+$/, '');
const mock = flag('mock') > -1 ? args[flag('mock') + 1]?.replace(/\/+$/, '') : undefined;
const outage = flag('outage') > -1;
const { HOWMANY_WEBHOOK_SECRET: secret, STORE_SLUG: slug } = process.env;

if (!base || !secret || !slug || (flag('mock') > -1 && !mock)) {
    console.error('Usage: HOWMANY_WEBHOOK_SECRET=... STORE_SLUG=... node scripts/prove-freshness.mjs <baseUrl> [--mock <mockUrl>] [--outage]');
    process.exit(2);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const now = () => Math.floor(Date.now() / 1000);
const sign = (ts, body) => createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
const asOf = html => html.match(/data-as-of="([^"]*)"/)?.[1] ?? null;
const assert = (condition, detail) => { if (!condition) throw new Error(detail); };

async function page() {
    const res = await fetch(`${base}/shop`, { redirect: 'manual' });
    const html = await res.text();
    return { status: res.status, headers: res.headers, html, asOf: asOf(html) };
}

async function post(body, { ts = String(now()), sig = sign(ts, body), headers = true } = {}) {
    const res = await fetch(`${base}/api/webhooks/howmany`, {
        method:  'POST',
        headers: headers ? { 'x-howmany-timestamp': ts, 'x-howmany-signature': sig } : {},
        body,
    });
    return res.status;
}

/** Retries every 500 ms for up to 10 s: the tag write lands after the 204, so never assert on the first GET */
async function poll(fn) {
    for (let waited = 0; waited <= 10_000; waited += 500) {
        const value = await fn();
        if (value) return value;
        await sleep(500);
    }
    return null;
}

const counts = async () => (await fetch(`${mock}/__count`)).text();
const setMock = body => fetch(`${mock}/__set`, { method: 'POST', body: JSON.stringify(body) });
const valid = () => JSON.stringify({ store: slug, event: 'store.updated', at: new Date().toISOString() });

let failed = false;
async function check(name, fn) {
    try {
        await fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        failed = true;
        console.log(`FAIL ${name}: ${error.message}`);
    }
}

let current = null;

await check('ready', async () => {
    for (let waited = 0; waited <= 60_000; waited += 1000) {
        try {
            const p = await page();
            if (p.status === 200 && p.asOf) { current = p; return; }
        } catch { /* server still starting */ }
        await sleep(1000);
    }
    throw new Error('GET /shop never returned 200 with a data-as-of value within 60 s');
});

await check('home-redirect', async () => {
    const res = await fetch(`${base}/`, { redirect: 'manual' });
    assert(res.status === 307, `GET / returned ${res.status}, expected 307`);
    assert(/\/shop$/.test(res.headers.get('location') ?? ''), `GET / location is ${res.headers.get('location')}, expected one ending in /shop`);
});

await check('noindex', async () => {
    assert(/noindex/i.test(current.headers.get('x-robots-tag') ?? ''), 'x-robots-tag header has no noindex');
    assert(/<meta[^>]*name="robots"[^>]*noindex/i.test(current.html) || /<meta[^>]*noindex[^>]*name="robots"/i.test(current.html), 'no robots noindex meta tag in the HTML');
});

await check('cache-hit', async () => {
    const before = mock ? await counts() : null;
    const [a, b] = [await page(), await page()];
    assert(a.asOf && a.asOf === b.asOf, `two views gave different data-as-of (${a.asOf} vs ${b.asOf})`);
    if (mock) {
        await Promise.all(Array.from({ length: 10 }, () => page()));
        const after = await counts();
        assert(before === after, `upstream was called on warm views (${before} -> ${after})`);
    }
    current = a;
});

await check('rejects', async () => {
    const body = valid();
    const ts = String(now());
    const cases = {
        'no headers':             () => post(body, { headers: false }),
        'wrong signature':        () => post(body, { ts, sig: 'a'.repeat(64) }),
        'timestamp 301 s old':    () => post(body, { ts: String(now() - 301), sig: sign(String(now() - 301), body) }),
        'timestamp 301 s ahead':  () => post(body, { ts: String(now() + 301), sig: sign(String(now() + 301), body) }),
        'multi-byte signature':   () => post(body, { ts, sig: 'é'.repeat(64) }),
        'empty body':             () => post('', { ts, sig: sign(ts, '') }),
        'not json':               () => post('not json', { ts, sig: sign(ts, 'not json') }),
        'json array':             () => post('[]', { ts, sig: sign(ts, '[]') }),
        'store is a number':      () => post('{"store":1,"event":"store.updated"}', { ts, sig: sign(ts, '{"store":1,"event":"store.updated"}') }),
    };
    const bad = [];
    for (const [label, run] of Object.entries(cases)) {
        const status = await run();
        if (status !== 401) bad.push(`${label}: ${status}`);
    }
    const get = await fetch(`${base}/api/webhooks/howmany`);
    if (get.status !== 405) bad.push(`GET: ${get.status}`);
    assert(bad.length === 0, `expected 401 (GET 405), got ${bad.join(', ')}`);
});

await check('ignored', async () => {
    const before = mock ? await counts() : null;
    for (const body of [
        JSON.stringify({ store: 'other-store', event: 'store.updated' }),
        JSON.stringify({ store: slug, event: 'store.deleted' }),
    ]) {
        const status = await post(body);
        assert(status === 204, `expected 204 for ${body}, got ${status}`);
    }
    await sleep(1200);
    const p = await page();
    assert(p.asOf === current.asOf, `data-as-of changed (${current.asOf} -> ${p.asOf}): an ignored webhook revalidated`);
    if (mock) assert(before === (await counts()), 'upstream was called after an ignored webhook');
});

await check('round-trip', async () => {
    const title = `Freshness ${Date.now()}`;
    if (mock) await setMock({ title });
    await sleep(1200); // so the API's Date header can change
    const status = await post(valid());
    assert(status === 204, `signed webhook returned ${status}, expected 204`);
    const fresh = await poll(async () => {
        const p = await page();
        return p.asOf && p.asOf !== current.asOf && (!mock || p.html.includes(title)) ? p : null;
    });
    assert(fresh, 'the list did not change within 10 s of the webhook');
    current = fresh;
});

if (mock && outage) {
    await check('outage', async () => {
        const lastTitle = current.html.match(/Freshness \d+/)?.[0];
        assert(lastTitle, 'no round-trip title to compare against');
        await setMock({ status: 500 });

        const cached = await page();
        assert(cached.asOf === current.asOf && cached.html.includes(lastTitle), 'a failing API changed a cached view before any webhook');

        const status = await post(valid());
        assert(status === 204, `signed webhook returned ${status}, expected 204`);
        const errored = await poll(async () => {
            const p = await page();
            return !p.asOf && !p.html.includes(lastTitle) ? p : null;
        });
        assert(errored, 'after a webhook with the API down, the page still showed the old stock');
        // Next's loading.js docs, "Status codes": streaming page responses begin with a 200 status code, so with
        // /shop/loading.tsx the error arrives inside the stream as React's failed-boundary marker ($RX( or data-dgst=), not as a 5xx
        assert(errored.status >= 500 || /\$RX\(|data-dgst=/.test(errored.html), `expected an error response or a streamed error marker, got ${errored.status}`);

        await setMock({ status: 200 });
        const recovered = await poll(async () => {
            const p = await page();
            return p.asOf && p.html.includes(lastTitle) ? p : null;
        });
        assert(recovered, 'the page did not recover once the API did');
    });
}

process.exit(failed ? 1 : 0);
