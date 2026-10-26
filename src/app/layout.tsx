import type { Metadata } from 'next';
import { SHOP } from '@/shop/config';
import { bodoni, montserrat } from '@/shop/fonts';
import '../styles/globals.css';

export const metadata: Metadata = {
    title: { default: SHOP.name, template: `%s | ${SHOP.name}` },
    // The unfinished site stays out of search engines. SEO-03 (Phase 4) makes this depend on the environment.
    robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang={SHOP.locale} className={`${montserrat.variable} ${bodoni.variable}`}>
            <body className="min-h-dvh bg-ivory font-sans text-forest antialiased">{children}</body>
        </html>
    );
}
