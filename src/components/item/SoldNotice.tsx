import { ButtonLink } from '@/components/ui/buttons';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';

/** Shown in place of where-to-buy on a sold piece: no price, no platform, just a way back to the stock */
export function SoldNotice() {
    return (
        <section className="bg-sand/40 p-6">
            <p className="text-base">{COPY.item.soldMessage}</p>
            <div className="mt-4 flex flex-col gap-2 min-[480px]:flex-row">
                <ButtonLink variant="primary" href={ROUTES.shop}>{COPY.common.shopAll}</ButtonLink>
                <ButtonLink variant="secondary" href={ROUTES.justDropped}>{COPY.item.newestDrops}</ButtonLink>
            </div>
        </section>
    );
}
