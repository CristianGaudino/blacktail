import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SocialIcons } from '@/components/ui/SocialIcons';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';
import { isBuilt } from '@/lib/utils';
import { SHOP } from '@/shop/config';
import logo from '@/shop/logo.svg';

const heading = 'mb-4 text-label uppercase';
const link = 'hover:underline';
const field = 'min-h-11 bg-sand/40 text-olive disabled:cursor-not-allowed';

const EXPLORE = [
    { label: COPY.nav.shop, href: ROUTES.shop },
    { label: COPY.nav.brands, href: ROUTES.brands },
    { label: COPY.nav.justDropped, href: ROUTES.justDropped },
    { label: COPY.nav.about, href: ROUTES.about },
    { label: COPY.nav.contact, href: ROUTES.contact },
];

export function Footer() {
    return (
        <footer className="mt-16 border-t border-forest bg-ivory py-12">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                <div>
                    <Image src={logo} alt={SHOP.name} className="h-10 w-auto" />
                    <div className="mt-4">
                        <SocialIcons links={SHOP.socials} />
                    </div>
                </div>

                <nav aria-labelledby="footer-explore">
                    <h2 id="footer-explore" className={heading}>{COPY.footer.explore}</h2>
                    <ul className="space-y-2">
                        {EXPLORE.filter(item => isBuilt(item.href)).map(item => (
                            <li key={item.href}><Link href={item.href} className={link}>{item.label}</Link></li>
                        ))}
                    </ul>
                </nav>

                <div>
                    <h2 className={heading}>{COPY.footer.findUs}</h2>
                    <ul className="space-y-2">
                        <li>
                            {COPY.footer.email}: <a href={`mailto:${SHOP.contact.email}`} className={link}>{SHOP.contact.email}</a>
                        </li>
                        {SHOP.platforms.map(platform => (
                            <li key={platform.name}>
                                <a href={platform.url} target="_blank" rel="noopener noreferrer" className={link}>
                                    {platform.name}
                                    <span className="sr-only"> {COPY.common.opensInNewTab}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className={heading}>{COPY.footer.newsletter}</h2>
                    <p className="mb-4">{COPY.footer.newsletterBody}</p>
                    {/* A mock (D-06): a plain div, not a form, with nothing wired. Never collects an address. */}
                    <div className="flex">
                        <label htmlFor="newsletter-email" className="sr-only">{COPY.footer.newsletterLabel}</label>
                        <input
                            id="newsletter-email"
                            type="email"
                            disabled
                            placeholder={COPY.footer.newsletterHint}
                            aria-describedby="newsletter-note"
                            className={`${field} min-w-0 flex-1 px-4 placeholder:text-olive`}
                        />
                        <button type="button" disabled aria-label={COPY.footer.subscribe} className={`${field} inline-flex size-11 shrink-0 items-center justify-center`}>
                            <ArrowRight size={20} aria-hidden />
                        </button>
                    </div>
                    <p id="newsletter-note" className="mt-2 text-label normal-case tracking-normal text-olive">{COPY.footer.newsletterNote}</p>
                </div>
            </div>

            <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
                <div className="border-t border-stone pt-6 text-label uppercase text-olive">
                    {COPY.footer.legal(new Date().getFullYear(), SHOP.name)}
                </div>
            </div>
        </footer>
    );
}
