import type { NextConfig } from 'next';
import { isIndexingOn, securityHeaders } from './src/lib/indexing';
import { ROUTES } from './src/lib/routes';

const nextConfig: NextConfig = {
    poweredByHeader: false,
    // The API ships a thumbUrl sized for grids, and Next's optimiser would bill per transformation on Workers
    images: { unoptimized: true },
    // Temporary until Phase 4 builds the home page (D-10); a config redirect renders no layout and calls no API
    async redirects() {
        return [{ source: ROUTES.home, destination: ROUTES.shop, permanent: false }];
    },
    async headers() {
        // Fixed when `next build` runs, so the deploy workflow passes ALLOW_INDEXING to the build as well as to the Worker
        return [{ source: '/:path*', headers: securityHeaders(isIndexingOn(process.env.ALLOW_INDEXING)) }];
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
