import { COPY } from '@/lib/copy';

type Network = keyof typeof COPY.socials;

/** Brand glyphs on a 24px grid (lucide 1.57 ships none). Drawn to be filled with evenodd. */
const GLYPHS: Record<Network, string> = {
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
    tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.3a7.4 7.4 0 0 0 4.3 1.4V7.6a4.3 4.3 0 0 1-3.2-1.8z',
    pinterest: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-.4 4.500c-2.600 0-4 1.800-4 3.600 0 .9.4 1.900 1.100 2.200l.3-.1.2-.7c0-.1 0-.2-.1-.3-.2-.3-.4-.7-.4-1.200 0-1.500 1.100-2.800 2.900-2.800 1.600 0 2.500 1 2.500 2.300 0 1.700-.8 3.200-1.900 3.200-.6 0-1.100-.5-.9-1.100.2-.7.5-1.500.5-2 0-.5-.3-.9-.8-.9-.7 0-1.200.7-1.200 1.600 0 .6.2 1 .2 1l-.8 3.400c-.1.600 0 1.400 0 1.800l.2.1c.3-.4.900-1.300 1.100-2l.4-1.500c.2.400.8.700 1.500.7 2 0 3.400-1.800 3.400-4.200 0-1.800-1.600-3.600-4-3.600z',
    spotify: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM7 9.200c3.400-1 7.200-.7 10.400 1l-.6 1.100c-2.900-1.600-6.300-1.800-9.300-.9zm.7 3.200c2.800-.8 5.900-.5 8.400.9l-.5.9c-2.300-1.300-5-1.500-7.500-.8zm.7 3c2.200-.6 4.500-.4 6.500.7l-.4.800c-1.800-1-3.900-1.200-5.700-.6z',
};

const ORDER = Object.keys(GLYPHS) as Network[];
const box = 'inline-flex size-11 items-center justify-center';

/** A glyph with a URL is a link that opens in a new tab; one without stays a plain icon (D-07). */
export function SocialIcons({ links }: { links: Record<Network, string | null> }) {
    return (
        <div className="flex">
            {ORDER.map(network => {
                const icon = (
                    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" fillRule="evenodd" aria-hidden="true">
                        <path d={GLYPHS[network]} />
                    </svg>
                );
                const url = links[network];
                return url
                    ? <a key={network} href={url} target="_blank" rel="noopener noreferrer" aria-label={COPY.socials[network]} className={box}>{icon}</a>
                    : <span key={network} aria-hidden="true" className={box}>{icon}</span>;
            })}
        </div>
    );
}
