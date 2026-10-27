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
    measurements: z.object({ pitToPitMm: z.number().nullable(), lengthMm: z.number().nullable() }),
    details:      z.record(z.string(), z.unknown()),
    priceCents:   z.number().int(),
    currency:     z.string(),
    photos:       z.array(photoSchema),
    publishedAt:  z.string(),
});

export const itemsPageSchema = z.object({
    items: z.array(itemSchema),
    page:  z.number(),
    limit: z.number(),
    total: z.number(),
});

const facet = z.array(z.object({ value: z.string(), count: z.number() })).default([]);
const range = z.object({ min: z.number(), max: z.number() }).nullable().default(null);

/** The values a shopper can pick, from GET /filters. Lenient: the header reads it on every page */
export const filtersSchema = z.object({
    brand: facet, size: facet, colour: facet, era: facet, material: facet,
    category: facet, type: facet, condition: facet, department: facet,
    priceCents: range, pitToPitMm: range, lengthMm: range,
});

export const webhookEventSchema = z.object({
    store: z.string(),
    event: z.string(),
});
