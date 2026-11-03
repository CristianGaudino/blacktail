// Pure and client-safe: no env, no fetch.

/** D-14: "Arc'teryx" -> arcteryx, "Dr. Martens" -> dr-martens. An empty slug means the name has no Latin letters or digits and gets no link */
export const brandSlug = (name: string): string =>
    name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
