import { ExternalLink } from 'lucide-react';
import { ButtonLink } from '@/components/ui/buttons';
import { SocialIcons } from '@/components/ui/SocialIcons';
import { COPY } from '@/lib/copy';
import { SHOP } from '@/shop/config';

const label = 'text-label uppercase text-olive';
const group = 'not-first:mt-8 not-first:border-t not-first:border-stone not-first:pt-8';

/** Contact details from props; the page passes SHOP values, so the footer, item page and this panel share one source (D-15). No form. */
export function ContactPanel({ email, platforms, socials }: {
    email:     string;
    platforms: readonly { name: string; url: string }[];
    socials:   Record<keyof typeof COPY.socials, string | null>;
}) {
    const hasSocials = Object.values(socials).some(Boolean);
    return (
        <div className="border border-stone bg-ivory p-6 md:p-8">
            <div className={group}>
                <p className={label}>{COPY.footer.email}</p>
                <a href={`mailto:${email}`} className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4">{email}</a>
            </div>
            {platforms.length > 0 && (
                <div className={group}>
                    <p className={label}>{SHOP.contact.shopWith}</p>
                    <div className="mt-2 flex flex-col gap-2 min-[480px]:flex-row">
                        {platforms.map(platform => (
                            <ButtonLink key={platform.name} external variant="secondary" href={platform.url}>
                                {COPY.item.visitOn(platform.name)}
                                <span className="sr-only">{COPY.common.opensInNewTab}</span>
                                <ExternalLink size={16} aria-hidden />
                            </ButtonLink>
                        ))}
                    </div>
                </div>
            )}
            {hasSocials && (
                <div className={group}>
                    <p className={label}>{SHOP.contact.follow}</p>
                    <div className="mt-2"><SocialIcons links={socials} linkedOnly /></div>
                </div>
            )}
        </div>
    );
}
