// Every path in the app. Kept free of other imports.

export const ROUTES = {
    home:        '/',
    shop:        '/shop',
    item:        (code: string) => `/items/${encodeURIComponent(code)}`,
    brands:      '/brands',
    justDropped: '/just-dropped',
    about:       '/about',
    contact:     '/contact',
} as const;

// shortcut: pages not built yet are not linked (they would 404 on the live site); add each page here as it ships (Phase 3: item pages as '/items', brands; Phase 4: just dropped, about, contact), then delete BUILT_PAGES and isBuilt
export const BUILT_PAGES: readonly string[] = [ROUTES.home, ROUTES.shop];
