import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { storeEnv } from '@/lib/env';
import { SHOP } from '@/shop/config';
import { bodoni, montserrat } from '@/shop/fonts';
import '../styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: { default: SHOP.name, template: `%s | ${SHOP.name}` },
        robots: storeEnv().ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
    };
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang={SHOP.locale} className={`${montserrat.variable} ${bodoni.variable}`}>
            <body className="min-h-dvh bg-ivory font-sans text-forest antialiased">
                <Header />
                {children}
                <Footer />
            </body>
        </html>
    );
}
