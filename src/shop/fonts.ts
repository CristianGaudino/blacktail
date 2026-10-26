import localFont from 'next/font/local';

// Kept in the repo (src/shop/fonts, SIL Open Font License) rather than downloaded
// from Google at build time: a failed download once broke a CI build.

export const montserrat = localFont({
    src: './fonts/Montserrat-Variable.woff2',
    weight: '400 700',
    variable: '--font-montserrat',
    display: 'swap',
});

// Bold only and no italic: every file listed here is preloaded on every page
export const bodoni = localFont({
    src: './fonts/BodoniModa-700.woff2',
    weight: '700',
    variable: '--font-bodoni',
    display: 'swap',
});
