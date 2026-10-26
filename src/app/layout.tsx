import type { Metadata } from 'next';

export const metadata: Metadata = {
    // The unfinished site stays out of search engines. SEO-03 (Phase 4) makes this depend on the environment.
    robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
