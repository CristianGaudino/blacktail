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
