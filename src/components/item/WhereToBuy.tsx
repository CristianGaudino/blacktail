import { ExternalLink } from 'lucide-react';
import { ButtonLink } from '@/components/ui/buttons';
import { COPY } from '@/lib/copy';
import type { ItemDetail } from '@/lib/definitions';
import { SHOP } from '@/shop/config';

type Listing = ItemDetail['listings'][number];

/** The shop's display name for a platform code (case-insensitive), else the URL host: the schema already proved a valid https URL */
function nameFor({ platform, url }: Listing): string {
    const match = SHOP.platforms.find(p => p.name.toLowerCase() === platform.toLowerCase());
    return match ? match.name : new URL(url).hostname.replace(/^www\./, '');
}

const list = (names: string[]) => new Intl.ListFormat(SHOP.locale, { type: 'conjunction' }).format(names);

/** Where to buy: the item's own listings when it has any, else the shop's profile on each platform. No buy button of our own, no checkout (D-07) */
export function WhereToBuy({ listings }: { listings: ItemDetail['listings'] }) {
    if (listings.length > 0) {
        const names = list([...new Set(listings.map(nameFor))]);
        return (
            <section className="bg-sand/40 p-6">
                <p className="text-base">{COPY.item.listedOn(names)}</p>
                <div className="mt-4 flex flex-col flex-wrap gap-2 min-[480px]:flex-row">
                    {listings.map(listing => (
                        <ButtonLink key={listing.url} external variant="secondary" href={listing.url}>
                            {COPY.item.buyOn(nameFor(listing))}
                            <span className="sr-only">{COPY.common.opensInNewTab}</span>
                            <ExternalLink size={16} aria-hidden />
                        </ButtonLink>
                    ))}
                </div>
            </section>
        );
    }
    if (SHOP.platforms.length === 0) return null;
    return (
        <section className="bg-sand/40 p-6">
            <p className="text-base">{COPY.item.listedOn(list(SHOP.platforms.map(p => p.name)))}</p>
            <p className="mt-1 text-label normal-case tracking-normal text-forest">{COPY.item.whereToBuyHelp}</p>
            <div className="mt-4 flex flex-col gap-2 min-[480px]:flex-row">
                {SHOP.platforms.map(platform => (
                    <ButtonLink key={platform.name} external variant="secondary" href={platform.url}>
                        {COPY.item.visitOn(platform.name)}
                        <span className="sr-only">{COPY.common.opensInNewTab}</span>
                        <ExternalLink size={16} aria-hidden />
                    </ButtonLink>
                ))}
            </div>
        </section>
    );
}
