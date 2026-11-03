// Every path in the app. Kept free of other imports.

export const ROUTES = {
    home:        '/',
    shop:        '/shop',
    item:        (code: string) => `/items/${encodeURIComponent(code)}`,
    brands:      '/brands',
    brand:       (slug: string) => `/brands/${encodeURIComponent(slug)}`,
    justDropped: '/just-dropped',
    about:       '/about',
    contact:     '/contact',
} as const;

// shortcut: pages not built yet are not linked (they would 404 on the live site); add each page here as it ships (item and brand pages shipped in Phase 3; Phase 4: just dropped, about, contact), then delete BUILT_PAGES and isBuilt
export const BUILT_PAGES: readonly string[] = [ROUTES.home, ROUTES.shop, '/items', ROUTES.brands];
