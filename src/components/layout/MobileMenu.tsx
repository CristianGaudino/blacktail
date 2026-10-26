'use client';

import { ChevronRight, Heart, Menu, ShoppingBag, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { IconButton } from '@/components/ui/buttons';
import { Sheet } from '@/components/ui/Sheet';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { SHOP } from '@/shop/config';
import logo from '@/shop/logo.svg';

type NavItem = { label: string; href: string };

const ROW = 'flex min-h-14 w-full items-center justify-between border-b border-stone px-4 text-label uppercase';

/** The phone menu: the full nav in a left-sliding dialog. Shop and Brands expand in place. */
export function MobileMenu({ typeLinks, brandLinks }: { typeLinks: NavItem[]; brandLinks: NavItem[] }) {
    const [open, setOpen]         = useState(false);
    const [expanded, setExpanded] = useState<'shop' | 'brands' | null>(null);
    const close = () => setOpen(false);

    const group = (key: 'shop' | 'brands', title: string, links: NavItem[]) => (
        <li>
            <button
                type="button"
                aria-expanded={expanded === key}
                aria-controls={`menu-${key}`}
                onClick={() => setExpanded(expanded === key ? null : key)}
                className={ROW}
            >
                {title}
                <ChevronRight size={16} aria-hidden className={cn('transition-transform', expanded === key && 'rotate-90')} />
            </button>
            <ul id={`menu-${key}`} hidden={expanded !== key} className="border-b border-stone bg-sand/20 px-4 py-2">
                {links.map(link => (
                    <li key={link.href}>
                        <Link href={link.href} prefetch={false} onClick={close} className="flex min-h-11 items-center text-base [overflow-wrap:anywhere]">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </li>
    );

    const link = (href: string, text: string) => (
        <li>
            <Link href={href} prefetch={false} onClick={close} className={ROW}>
                {text}
                <ChevronRight size={16} aria-hidden />
            </Link>
        </li>
    );

    return (
        <>
            <IconButton icon={Menu} label={COPY.header.openMenu} onClick={() => setOpen(true)} className="-ml-2 lg:hidden" />
            <Sheet
                open={open}
                onClose={close}
                title={<Image src={logo} alt={SHOP.name} className="h-8 w-auto" />}
                closeLabel={COPY.header.closeMenu}
                className="min-[480px]:w-96"
            >
                <nav>
                    <ul>
                        {group('shop', COPY.nav.shop, typeLinks)}
                        {group('brands', COPY.nav.brands, brandLinks)}
                        {link(ROUTES.justDropped, COPY.nav.justDropped)}
                        {link(ROUTES.about, COPY.nav.about)}
                        {link(ROUTES.contact, COPY.nav.contact)}
                    </ul>
                </nav>
                {/* Decorative, like the mockup: not focusable, no handler (D-08) */}
                <div aria-hidden className="flex flex-col gap-4 px-4 py-6 text-label uppercase">
                    <span className="flex items-center gap-3"><User size={20} />{COPY.header.account}</span>
                    <span className="flex items-center gap-3"><Heart size={20} />{COPY.header.wishlist}</span>
                    <span className="flex items-center gap-3"><ShoppingBag size={20} />{COPY.header.bag} {COPY.header.bagCount(0)}</span>
                </div>
            </Sheet>
        </>
    );
}
