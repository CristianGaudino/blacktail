const DAY_MS = 24 * 60 * 60 * 1000;

/** True when the piece was published less than `days` days before `now`. `now` is passed in so one render uses one clock. */
export function isNew(publishedAt: string, now: number, days: number): boolean {
    const published = Date.parse(publishedAt);
    if (Number.isNaN(published)) return false;
    return now - published < days * DAY_MS;
}
