import { COLOURS } from './colours';

/**
 * Every per-shop value. Public values only: client components import this and it ships in the bundle,
 * so it never reads env or secrets. Another shop replaces the src/shop folder; src/lib/shop-guard.test.ts
 * fails if any of these values appears elsewhere in src.
 */
export const SHOP = {
    name: 'Blacktail Archive',
    locale: 'en-IE',
    /** A public/images/... path for the All Items banner; null draws the solid Forest panel. */
    bannerImage: null as string | null,
    contact: {
        email: 'pending-owner@blacktailarchive.example', // PENDING-OWNER (D-05): real value from the owner; only this line changes
    },
    platforms: [
        { name: 'Vinted', url: 'https://www.vinted.ie/member/pending-owner' }, // PENDING-OWNER (D-05): real value from the owner; only this line changes
        { name: 'eBay', url: 'https://www.ebay.ie/usr/pending-owner' }, // PENDING-OWNER (D-05): real value from the owner; only this line changes
    ],
    /** An icon with a URL becomes a link; null shows the icon without a link (D-07). */
    socials: {
        instagram: 'https://www.instagram.com/blacktailarchive',
        tiktok: null,
        pinterest: null,
        spotify: null,
    } as Record<'instagram' | 'tiktok' | 'pinterest' | 'spotify', string | null>,
    /** A piece published within this many days shows the New badge (D-21). */
    newBadgeDays: 7,
    colours: COLOURS,
};
