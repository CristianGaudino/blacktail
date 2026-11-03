import { ExternalLink } from 'lucide-react';
import { ButtonLink } from '@/components/ui/buttons';
import { COPY } from '@/lib/copy';
import { SHOP } from '@/shop/config';

/** Where the piece is listed: one link per platform to the shop's own profile, never a per-item link, and no buy button (D-07) */
export function WhereToBuy() {
    if (SHOP.platforms.length === 0) return null;
    const names = new Intl.ListFormat(SHOP.locale, { type: 'conjunction' }).format(SHOP.platforms.map(p => p.name));
    return (
        <section className="bg-sand/40 p-6">
            <p className="text-base">{COPY.item.listedOn(names)}</p>
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
