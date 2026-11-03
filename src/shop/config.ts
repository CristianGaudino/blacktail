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
    /** Page titles and descriptions for search results and link previews (D-18) */
    seo: {
        homeTitle: 'Pre-loved branded clothing',
        home: 'Pre-loved clothing from iconic brands. One-of-a-kind pieces, with new arrivals every week.',
        shop: 'Browse every piece in stock. Filter by brand, size, colour and condition.',
        brands: 'Shop pre-loved pieces by brand.',
        brand: (brand: string) => `Pre-loved ${brand} pieces in stock now.`,
        justDropped: 'The newest pre-loved pieces, added weekly.',
        about: 'The story behind the shop and why we love pre-loved clothing.',
        contact: 'How to reach the shop, and where to find our pieces on Vinted and eBay.',
    },
    /**
     * Ranks the home brand strip inside its in-stock and sold-before tiers (D-08); it never adds a brand. Names match by slug, so Levi's equals LEVIS.
     * The rest follow A to Z.
     */
    // PENDING-OWNER (D-08): the owner's preferred order; only this array changes
    defaultBrandOrder: ['Polo Ralph Lauren', 'Carhartt', 'Nike', 'Adidas', "Levi's", 'Barbour', 'The North Face', 'Patagonia'] as readonly string[],
    /** Home page words (Phase 4 D-03), stored in normal case: CSS uppercases the headings and eyebrows. */
    home: {
        hero: {
            eyebrow:  'Pre-loved',
            headline: ['Timeless clothes.', 'Just different.'],
            button:   'Shop new arrivals',
        },
        brands: { heading: 'Shop by brand' },
        categories: {
            heading:    'Shop by category',
            exploreAll: 'Explore all pieces',
            // PENDING-OWNER (D-05): up to 4 tiles. The owner confirmed Shirts as the fourth (D-22); the mockup's Accessories has no type code.
            // A tile hides when its type has no stock. Still one entry to change.
            tiles: [
                { type: 'jacket', label: 'Jackets',  image: '/images/category-1.jpg' },
                { type: 'knit',   label: 'Knitwear', image: '/images/category-2.jpg' },
                { type: 'jeans',  label: 'Denim',    image: '/images/category-3.jpg' },
                { type: 'shirt',  label: 'Shirts',   image: '/images/category-4.jpg' },
            ],
        },
        justDropped: {
            heading: 'Just dropped',
            eyebrow: 'New arrivals weekly',
        },
        promos: {
            justDropped: {
                title:  'Just dropped',
                body:   'Fresh arrivals. Iconic brands. One-of-a-kind pieces. Be the first to find them before they are gone.',
                button: 'Shop Just Dropped',
            },
            brands: {
                eyebrow: 'Pre-loved',
                title:   'Iconic brands. Real style.',
                button:  'Shop all brands',
            },
        },
        story: {
            heading: 'A more conscious way to shop.',
            body:    'Pre-loved pieces. Longer lives. Better choices.',
            button:  'Our story',
        },
    },
    /** A piece published within this many days shows the New badge, everywhere (Phase 4 D-11). */
    newBadgeDays: 14,
    colours: COLOURS,
};
