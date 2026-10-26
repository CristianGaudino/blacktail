/** How the How many data is cached */
export const CACHE = {
    /** Time-based fallback: the first visit after this many seconds refreshes the data (the webhook is never retried) */
    revalidateSeconds: 600,
    fetchTimeoutMs:    8000,
    /**
     * expire 0 makes the next visit after a webhook a blocking refetch. Chosen over 'max' so a sold
     * piece never shows again after a stock change.
     */
    webhookRevalidate: { expire: 0 },
} as const;

/** The How many public API contract */
export const STORE_API = {
    listLimit:               100,
    webhookEvent:            'store.updated',
    webhookToleranceSeconds: 300,
    webhookMaxBytes:         8192,
} as const;
