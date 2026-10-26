import type { z } from 'zod';
import type { itemSchema, itemsPageSchema, photoSchema, storeSchema } from '@/lib/howmany/schemas';

// The schema is the single source of these types.
export type Store = z.output<typeof storeSchema>;
export type ItemPhoto = z.output<typeof photoSchema>;
export type Item = z.output<typeof itemSchema>;
export type ItemsPage = z.output<typeof itemsPageSchema>;
