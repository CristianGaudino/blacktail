import type { NextConfig } from 'next';

const SECURITY_HEADERS = [
    // The unfinished site stays out of search engines. SEO-03 (Phase 4) makes this depend on the environment.
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    // Never render inside someone else's frame (clickjacking)
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // HTTPS only, for two years, on this host and below it
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
    poweredByHeader: false,
    // The API ships a thumbUrl sized for grids, and Next's optimiser would bill per transformation on Workers
    images: { unoptimized: true },
    async headers() {
        return [{ source: '/:path*', headers: SECURITY_HEADERS }];
    },
};

export default nextConfig;
