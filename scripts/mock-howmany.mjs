// Mock How many API for local and CI proofs. No dependencies.
// Usage: node scripts/mock-howmany.mjs [--port 4010] [--host 127.0.0.1]
//   GET <anything>/items    -> 30 items, filtered, sorted and paged by the query (brand, ...; page, limit)
//   GET <anything>/filters  -> the facets and ranges of those 30 items
//   GET <anything else>     -> the store
//   GET /__count            -> {"store":n,"items":n} of non-control GETs so far (/filters counts as store)
//   GET /__last             -> the raw query string (no "?") of the last /items request
//   POST /__set             -> JSON { title?: string, status?: number }: change the first item's title,
//                              and/or make every non-control GET answer that status with an error body
import { createServer } from 'node:http';

const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? process.argv[i + 1] : fallback;
};
const port = Number(arg('port', '4010'));
const host = arg('host', '127.0.0.1');

const counts = { store: 0, items: 0 };
const startedAt = Date.now();
let title = 'Mock oxford shirt';
let failStatus = 0;
let last = '';

const DAY = 24 * 60 * 60 * 1000;
const items = () => Array.from({ length: 30 }, (_, n) => {
    const i = n + 1;
    return {
        code:         `MOCK-${String(i).padStart(4, '0')}`,
        title:        i === 1 ? title : `Mock item ${i}`,
        brand:        i === 30 ? null : ['Mock Brand', 'Acme', 'Northwind'][n % 3],
        category:     'clothing',
        type:         ['shirt', 'knit', 'jacket'][n % 3],
        size:         ['S', 'M', 'L', 'XL'][n % 4],
        condition:    ['A', 'AB', 'B'][n % 3],
        colour:       ['Blue', 'Navy', 'Green', 'Ochre'][n % 4],
        era:          ['1990s', '2000s'][n % 2],
        department:   i % 2 ? 'mens' : 'womens',
        measurements: { pitToPitMm: 500 + (i % 7) * 10, lengthMm: null },
        details:      { material: ['Cotton', 'Wool'][n % 2] },
        priceCents:   1000 + i * 250,
        currency:     'EUR',
        photos:       i === 29 ? [] : [{ url: `https://example.com/photo-${i}.jpg`, thumbUrl: `https://example.com/thumb-${i}.jpg`, width: 1500, height: 2000 }],
        publishedAt:  new Date(startedAt - n * DAY).toISOString(),
        futureField:  'ignored',
    };
});

/** Facet entries: values that differ only in case are merged (first spelling kept), most common first */
function facet(values) {
    const byLower = new Map();
    for (const value of values.filter(v => v !== null && v !== undefined)) {
        const entry = byLower.get(value.toLowerCase());
        if (entry) entry.count++;
        else byLower.set(value.toLowerCase(), { value, count: 1 });
    }
    return [...byLower.values()].sort((a, b) => b.count - a.count);
}
const range = values => {
    const present = values.filter(v => typeof v === 'number');
    return present.length ? { min: Math.min(...present), max: Math.max(...present) } : null;
};

function filters() {
    const all = items();
    return {
        brand:      facet(all.map(x => x.brand)),
        size:       facet(all.map(x => x.size)),
        colour:     facet(all.map(x => x.colour)),
        era:        facet(all.map(x => x.era)),
        material:   facet(all.map(x => x.details.material)),
        category:   facet(all.map(x => x.category)),
        type:       facet(all.map(x => x.type)),
        condition:  facet(all.map(x => x.condition)),
        department: facet(all.map(x => x.department)),
        priceCents: range(all.map(x => x.priceCents)),
        pitToPitMm: range(all.map(x => x.measurements.pitToPitMm)),
        lengthMm:   range(all.map(x => x.measurements.lengthMm)),
        futureField: 'ignored',
    };
}

/** Case-insensitive match on any of the repeated values of a list param */
const listMatch = (search, key, value) => {
    const wanted = search.getAll(key).map(v => v.toLowerCase());
    return wanted.length === 0 || (typeof value === 'string' && wanted.includes(value.toLowerCase()));
};
/** Inclusive range; a null value is excluded as soon as either bound is given */
const rangeMatch = (search, minKey, maxKey, value) => {
    const min = search.get(minKey);
    const max = search.get(maxKey);
    if (min === null && max === null) return true;
    if (typeof value !== 'number') return false;
    return (min === null || value >= Number(min)) && (max === null || value <= Number(max));
};

function listItems(search) {
    const words = (search.get('q') ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    const matched = items().filter(x => listMatch(search, 'brand', x.brand)
        && listMatch(search, 'type', x.type) && listMatch(search, 'size', x.size) && listMatch(search, 'colour', x.colour)
        && listMatch(search, 'era', x.era) && listMatch(search, 'condition', x.condition) && listMatch(search, 'department', x.department)
        && listMatch(search, 'category', x.category) && listMatch(search, 'material', x.details.material)
        && rangeMatch(search, 'minPrice', 'maxPrice', x.priceCents)
        && rangeMatch(search, 'minPitToPitMm', 'maxPitToPitMm', x.measurements.pitToPitMm)
        && rangeMatch(search, 'minLengthMm', 'maxLengthMm', x.measurements.lengthMm)
        && words.every(w => [x.title, x.brand, x.colour].some(t => t && t.toLowerCase().includes(w))));
    const sort = search.get('sort');
    if (sort === 'price_asc') matched.sort((a, b) => a.priceCents - b.priceCents);
    else if (sort === 'price_desc') matched.sort((a, b) => b.priceCents - a.priceCents);
    else matched.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const page = Math.max(1, Number(search.get('page') ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(search.get('limit') ?? 24) || 24));
    return { items: matched.slice((page - 1) * limit, page * limit), page, limit, total: matched.length, futureField: 'ignored' };
}

function send(res, status, body, headers = {}) {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

createServer((req, res) => {
    const { pathname, searchParams, search } = new URL(req.url, 'http://mock');
    if (req.method === 'GET' && pathname === '/__count') return send(res, 200, JSON.stringify(counts));
    if (req.method === 'GET' && pathname === '/__last') return send(res, 200, last, { 'content-type': 'text/plain' });
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
    if (isItems) last = search.replace(/^\?/, '');
    if (failStatus) return send(res, failStatus, { error: 'Mock failure' }, { 'cache-control': 'no-store' });

    const cache = { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=600' };
    if (isItems) return send(res, 200, listItems(searchParams), cache);
    if (pathname.endsWith('/filters')) return send(res, 200, filters(), cache);
    send(res, 200, { slug: pathname.split('/').filter(Boolean).pop(), name: 'Mock Store', currency: 'EUR', futureField: 'ignored' }, cache);
}).listen(port, host, () => console.log(`Mock How many API on http://${host}:${port}`));
