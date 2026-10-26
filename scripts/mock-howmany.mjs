// Mock How many API for local and CI proofs. No dependencies.
// Usage: node scripts/mock-howmany.mjs [--port 4010] [--host 127.0.0.1]
//   GET <anything>/items  -> item list (one fixture item)
//   GET <anything else>   -> the store
//   GET /__count          -> {"store":n,"items":n} of non-control GETs so far
//   POST /__set           -> JSON { title?: string, status?: number }: change the fixture title,
//                            and/or make every non-control GET answer that status with an error body
import { createServer } from 'node:http';

const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? process.argv[i + 1] : fallback;
};
const port = Number(arg('port', '4010'));
const host = arg('host', '127.0.0.1');

const counts = { store: 0, items: 0 };
let title = 'Mock oxford shirt';
let failStatus = 0;

const item = () => ({
    code:         'MOCK-0001',
    title,
    brand:        'Mock Brand',
    category:     'shirts',
    type:         null,
    size:         'M',
    condition:    'A',
    colour:       'Blue',
    era:          '2020s',
    department:   null,
    measurements: { pitToPitMm: 550, lengthMm: 720 },
    details:      {},
    priceCents:   2500,
    currency:     'EUR',
    photos:       [{ url: 'https://example.com/photo.jpg', thumbUrl: 'https://example.com/thumb.jpg', width: 1500, height: 2000 }],
    publishedAt:  '2026-10-26T00:00:00.000Z',
    futureField:  'ignored',
});

function send(res, status, body, headers = {}) {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://mock');
    if (req.method === 'GET' && pathname === '/__count') return send(res, 200, JSON.stringify(counts));
    if (req.method === 'POST' && pathname === '/__set') {
        let raw = '';
        req.on('data', chunk => (raw += chunk));
        req.on('end', () => {
            try {
                const set = JSON.parse(raw);
                if (typeof set.title === 'string') title = set.title;
                if (typeof set.status === 'number') failStatus = set.status === 200 ? 0 : set.status;
                send(res, 200, { ok: true });
            } catch {
                send(res, 400, { error: 'Bad body' });
            }
        });
        return;
    }
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

    const isItems = pathname.endsWith('/items');
    counts[isItems ? 'items' : 'store']++;
    if (failStatus) return send(res, failStatus, { error: 'Mock failure' }, { 'cache-control': 'no-store' });

    const cache = { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=600' };
    if (isItems) return send(res, 200, { items: [item()], page: 1, limit: 100, total: 1, futureField: 'ignored' }, cache);
    send(res, 200, { slug: pathname.split('/').filter(Boolean).pop(), name: 'Mock Store', currency: 'EUR', futureField: 'ignored' }, cache);
}).listen(port, host, () => console.log(`Mock How many API on http://${host}:${port}`));
