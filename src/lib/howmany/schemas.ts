import { z } from 'zod';

// The How many public API only ever adds fields, so these are lenient: unknown keys are
// stripped (which is also the privacy whitelist) and API codes are plain strings, never enums.

export const storeSchema = z.object({
    slug:     z.string(),
    name:     z.string(),
    currency: z.string(),
});

export const photoSchema = z.object({
    url:      z.string(),
    thumbUrl: z.string(),
    width:    z.number(),
    height:   z.number(),
});

export const itemSchema = z.object({
    code:         z.string(),
    title:        z.string(),
    brand:        z.string().nullable(),
    category:     z.string(),
    type:         z.string().nullable(),
    size:         z.string().nullable(),
    condition:    z.string(),
    colour:       z.string().nullable(),
    era:          z.string().nullable(),
    department:   z.string().nullable(),
    // Optional: no live item carries it yet (it is a top-level /filters facet, so this is its likely home)
    material:     z.string().nullish(),
    measurements: z.object({ pitToPitMm: z.number().nullable(), lengthMm: z.number().nullable() }),
    details:      z.record(z.string(), z.unknown()),
    priceCents:   z.number().int(),
    currency:     z.string(),
    photos:       z.array(photoSchema),
    publishedAt:  z.string(),
    // "inStock" or "sold"; "sold" only comes from /items/{code}, never from a list. A plain string, like every API code. A reader without it (older API) sees an in-stock piece.
    status:       z.string().optional(),
});

// https only, so a javascript: or http: link never becomes an href
const listingSchema = z.object({ platform: z.string(), url: z.url({ protocol: /^https$/ }) });

/** The /items/{code} read. Lists stay on the strict itemSchema; a sold piece can lack a price, a sale date and photos. */
export const itemDetailSchema = itemSchema.extend({
    // null only for a sold piece that never had a price
    priceCents: z.number().int().nullable(),
    // A day key (YYYY-MM-DD) in the seller's zone, not a timestamp; missing or malformed becomes null instead of an error page
    soldAt:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().catch(null),
    // Where this piece is listed, in the API's order; a bad entry is dropped on its own, a bad field is []
    listings:   z.array(z.unknown()).catch([]).transform(list => list.flatMap(entry => {
        const parsed = listingSchema.safeParse(entry);
        return parsed.success ? [parsed.data] : [];
    })),
});

export const itemsPageSchema = z.object({
    items: z.array(itemSchema),
    page:  z.number(),
    limit: z.number(),
    total: z.number(),
});

const facet = z.array(z.object({ value: z.string(), count: z.number() })).default([]);
const range = z.object({ min: z.number(), max: z.number() }).nullable().default(null);

// The element shape is not observed yet (the live list is empty), so plain names and facet-like { value, count } objects are both accepted.
const soldBrand = z.union([z.string(), z.object({ value: z.string() }).transform(o => o.value)]).transform(s => s.trim()).pipe(z.string().min(1));

/** The values a shopper can pick, from GET /filters. Lenient: the header reads it on every page */
export const filtersSchema = z.object({
    brand: facet, size: facet, colour: facet, era: facet, material: facet,
    category: facet, type: facet, condition: facet, department: facet,
    priceCents: range, pitToPitMm: range, lengthMm: range,
    // Brands the seller has sold before but has none of now; a bad entry is dropped on its own, a missing or non-array field is []
    soldBrands: z.array(z.unknown()).catch([]).transform(list => list.flatMap(entry => {
        const parsed = soldBrand.safeParse(entry);
        return parsed.success ? [parsed.data] : [];
    })),
});

export const webhookEventSchema = z.object({
    store: z.string(),
    event: z.string(),
});
