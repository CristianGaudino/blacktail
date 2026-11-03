import type { NextConfig } from 'next';
import { isIndexingOn, securityHeaders } from './src/lib/indexing';

const nextConfig: NextConfig = {
    poweredByHeader: false,
    // The API ships a thumbUrl sized for grids, and Next's optimiser would bill per transformation on Workers
    images: { unoptimized: true },
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
