import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { storeEnv } from '@/lib/env';

export default async function robots(): Promise<MetadataRoute.Robots> {
    // Without this a metadata route is cached and built once, so the flag would be frozen at build time. Outside any try/catch.
    await connection();
    const { ALLOW_INDEXING, SITE_URL } = storeEnv();
    // Query URLs are never disallowed: a filtered listing's noindex is only seen if the crawler may fetch it
    return ALLOW_INDEXING
        ? { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: new URL('/sitemap.xml', SITE_URL).toString() }
        : { rules: { userAgent: '*', disallow: '/' } };
}
