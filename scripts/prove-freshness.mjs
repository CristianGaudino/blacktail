// Freshness round trip: a signed How many webhook must refresh the list within seconds.
// Usage: node scripts/prove-freshness.mjs <baseUrl> [--mock <mockUrl>] [--outage]
// Item pages: item-page, item-unknown, code-gate (mock only), item-sold, item-hidden and item-sold-bare (mock only) check /items/<code>.
// Needs HOWMANY_WEBHOOK_SECRET and STORE_SLUG in the environment. No dependencies.
// The stock page is /shop; / is the home page (hero, newest pieces, static sections).
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

await check('home', async () => {
    const res = await fetch(`${base}/`, { redirect: 'manual' });
    const html = await res.text();
    assert(res.status === 200, `GET / returned ${res.status}, expected 200`);
    assert(html.includes('<h1'), 'GET / has no h1');
    if (mock) assert(html.includes('href="/items/'), 'GET / has no /items/<code> link (the Just Dropped carousel)');
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

await check('item-page', async () => {
    const href = current.html.match(/href="(\/items\/[^"]+)"/)?.[1];
    assert(href, 'no /items/<code> link on /shop');
    const res = await fetch(`${base}${href}`);
    const html = await res.text();
    assert(res.status === 200, `GET ${href} returned ${res.status}, expected 200`);
    assert(html.includes('<h1'), `GET ${href} has no h1`);
});

await check('item-unknown', async () => {
    const missing = await fetch(`${base}/items/NOPE-0000`);
    const html = await missing.text();
    assert(missing.status === 404, `GET /items/NOPE-0000 returned ${missing.status}, expected 404`);
    assert(/<meta[^>]*name="robots"[^>]*noindex/i.test(html) || /<meta[^>]*noindex[^>]*name="robots"/i.test(html), 'the 404 has no robots noindex meta tag');
    const other = await fetch(`${base}/no-such-page`);
    assert(other.status === 404, `GET /no-such-page returned ${other.status}, expected 404`);
});

if (mock) {
    await check('code-gate', async () => {
        const before = await counts();
        for (const path of ['/items/..%2Ffilters', '/items/bad%20code']) {
            const res = await fetch(`${base}${path}`);
            assert(res.status === 404, `GET ${path} returned ${res.status}, expected 404`);
        }
        const after = await counts();
        assert(before === after, `a junk code reached the API (${before} -> ${after})`);
    });
}

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

if (mock) {
    // The listing pages that must stop showing a sold piece, each by its path
    const listings = ['/shop', '/just-dropped', '/'];
    await check('item-sold', async () => {
        const code = 'MOCK-0002';
        const sibling = 'MOCK-0005'; // same brand (Acme), so its More from row starts with MOCK-0002
        const text = async path => {
            const res = await fetch(`${base}${path}`);
            return { status: res.status, html: await res.text() };
        };
        for (let i = 0; i < 2; i++) {
            const { status, html } = await text(`/items/${code}`);
            assert(status === 200, `GET /items/${code} returned ${status}, expected 200`);
            assert(html.includes('€15') && html.includes('This piece is listed on'), `the in-stock /items/${code} lost its price or where-to-buy panel`);
            assert(!html.includes('Sold on'), `the in-stock /items/${code} shows a Sold line`);
            assert(!html.includes('>Sold</span>'), `the in-stock /items/${code} shows a Sold badge`);
        }
        for (const path of listings) {
            const { html } = await text(path);
            assert(html.includes(`href="/items/${code}"`), `${path} does not list ${code} before it sells`);
        }
        const before = await text(`/items/${sibling}`);
        assert(before.html.includes(`href="/items/${code}"`), `/items/${sibling} has no More from link to ${code} before it sells`);
        try {
            await setMock({ gone: [code] });
            await sleep(1200);
            const status = await post(valid());
            assert(status === 204, `signed webhook returned ${status}, expected 204`);
            // COPY.item.soldOn over the mock's soldAt, in en-IE
            const sold = await poll(async () => {
                const res = await fetch(`${base}/items/${code}`);
                const html = await res.text();
                return res.status === 200 && html.includes('Sold on 3 November 2026') ? html : null;
            });
            assert(sold, `/items/${code} was not a 200 with "Sold on 3 November 2026" within 10 s of the webhook`);
            assert(sold.includes('https://schema.org/SoldOut'), 'the sold page has no SoldOut availability in its JSON-LD');
            assert(sold.includes('>Sold</span>'), 'the sold page has no Sold badge on the cover');
            assert(sold.includes('content="noindex, follow"'), 'the sold page has no "noindex, follow" robots meta tag');
            assert(sold.includes('content="Sold. '), 'the sold page description does not start with "Sold."');
            assert(!sold.includes('€15'), 'the sold page still shows the asking price');
            assert(!sold.includes('This piece is listed on'), 'the sold page still has the where-to-buy panel');
            assert(!sold.includes('More from'), 'the sold page still has a More from row');
            for (const path of listings) {
                const { status: s, html } = await text(path);
                assert(s === 200, `GET ${path} returned ${s}, expected 200`);
                assert(!html.includes(`href="/items/${code}"`), `${path} still lists the sold ${code}`);
            }
            const dropped = await poll(async () => {
                const { status: s, html } = await text(`/items/${sibling}`);
                return s === 200 && !html.includes(`href="/items/${code}"`) ? html : null;
            });
            assert(dropped, `the More from row of /items/${sibling} still links the sold ${code}`);
        } finally {
            await setMock({ gone: [] });
        }
    });

    await check('item-hidden', async () => {
        const code = 'MOCK-0004';
        const view = () => fetch(`${base}/items/${code}`);
        for (let i = 0; i < 2; i++) {
            const res = await view();
            assert(res.status === 200, `GET /items/${code} returned ${res.status}, expected 200`);
        }
        try {
            await setMock({ hidden: [code] });
            await sleep(1200);
            const status = await post(valid());
            assert(status === 204, `signed webhook returned ${status}, expected 204`);
            // COPY.gone.title in src/lib/copy.ts
            const gone = await poll(async () => {
                const res = await view();
                const html = await res.text();
                return res.status === 404 && html.includes('This piece is no longer available') ? html : null;
            });
            assert(gone, `/items/${code} was not a 404 with the gone message within 10 s of the webhook`);
            const shop = await (await fetch(`${base}/shop`)).text();
            assert(!shop.includes(`href="/items/${code}"`), `/shop still lists the hidden ${code}`);
        } finally {
            // A 404 is never cached, so the next read sees the piece again
            await setMock({ hidden: [] });
        }
    });

    // MOCK-0031 is always sold, with no price, no sale date and no photos (no webhook needed)
    await check('item-sold-bare', async () => {
        const res = await fetch(`${base}/items/MOCK-0031`);
        const html = await res.text();
        assert(res.status === 200, `GET /items/MOCK-0031 returned ${res.status}, expected 200`);
        assert(html.includes('>Sold</p>'), 'the bare sold page has no "Sold" line on its own');
        assert(html.includes('>Sold</span>'), 'the bare sold page has no Sold badge on the photo placeholder');
        assert(html.includes('https://schema.org/SoldOut'), 'the bare sold page has no SoldOut availability');
        assert(html.includes('content="noindex, follow"'), 'the bare sold page has no "noindex, follow" robots meta tag');
        for (const text of ['Sold on', 'NaN', 'Invalid Date', '"price":']) assert(!html.includes(text), `the bare sold page contains "${text}"`);
    });
}

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

        // The static sections stay up and the carousel hides (HOME-02, DATA-03)
        const home = await fetch(`${base}/`);
        const homeHtml = await home.text();
        assert(home.status === 200 && homeHtml.includes('<h1'), `GET / during the outage returned ${home.status} or has no h1`);
        assert(!homeHtml.includes('href="/items/'), 'GET / during the outage still shows item links');

        await setMock({ status: 200 });
        const recovered = await poll(async () => {
            const p = await page();
            return p.asOf && p.html.includes(lastTitle) ? p : null;
        });
        assert(recovered, 'the page did not recover once the API did');
    });
}

process.exit(failed ? 1 : 0);
