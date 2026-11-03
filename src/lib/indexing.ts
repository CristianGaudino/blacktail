// No imports on purpose: next.config.ts imports this file with a relative path, where '@/' aliases do not resolve.

/** Indexing is on only for the exact string "true", so a typo or an unset variable keeps the site out of search (D-16) */
export const isIndexingOn = (raw: string | undefined): boolean => raw === 'true';

/** The response headers for every route. X-Robots-Tag is left out only when indexing is on. */
export function securityHeaders(indexingOn: boolean): { key: string; value: string }[] {
    return [
        // The site stays out of search engines unless the build saw ALLOW_INDEXING=true
        ...(indexingOn ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
        // Never render inside someone else's frame (clickjacking)
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // HTTPS only, for two years, on this host and below it
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ];
}
