import type { NextConfig } from 'next';
import { ROUTES } from './src/lib/routes';

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
    // Temporary until Phase 4 builds the home page (D-10); a config redirect renders no layout and calls no API
    async redirects() {
        return [{ source: ROUTES.home, destination: ROUTES.shop, permanent: false }];
    },
    async headers() {
        return [{ source: '/:path*', headers: SECURITY_HEADERS }];
    },
    turbopack: {
        rules: {
            '*.css': {
                loaders: ['@tailwindcss/turbopack'],
                as: '*.css',
            },
        },
    },
};

export default nextConfig;
