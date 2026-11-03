import { Heart, ShoppingBag, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { HeaderSearch } from './HeaderSearch';
import { MobileMenu } from './MobileMenu';
import { NavDropdown } from './NavDropdown';
import { NavLink } from './NavLink';
import { brandIndex } from '@/lib/brands';
import { getFilters } from '@/lib/howmany/client';
import { COPY } from '@/lib/copy';
import { label } from '@/lib/labels';
import { ROUTES } from '@/lib/routes';
import logo from '@/shop/logo.svg';
import { SHOP } from '@/shop/config';

type NavItem = { label: string; href: string };

const typeHref = (value: string) => `${ROUTES.shop}?${new URLSearchParams({ type: value })}`;

/** Decorative, like the mockup: not focusable, no handler (D-08) */
const iconSlot = 'size-11 items-center justify-center';

export async function Header() {
    // Outside the try: the dynamic-usage signal must not be swallowed, or the build would call the API (Pitfall 2)
    await connection();

    let types: string[] = [];
    let brands: string[] = [];
    try {
        const filters = await getFilters();
        types  = filters.type.map(f => f.value);
        brands = filters.brand.map(f => f.value);
    } catch (error) {
        console.warn('Header: /filters failed', error);
        // The dropdowns fall back to their fixed link; the page itself still shows the error
    }

    const typeLinks: NavItem[]  = [
        { label: COPY.nav.allItems, href: ROUTES.shop },
        ...types.map(value => ({ label: label(value, COPY.labels.type), href: typeHref(value) })),
    ];
    const brandLinks: NavItem[] = [
        ...brandIndex(brands).map(({ name, slug }) => ({ label: name, href: ROUTES.brand(slug) })),
        { label: COPY.nav.allBrands, href: ROUTES.brands },
    ];

    return (
        <header className="sticky top-0 z-40 border-b border-stone bg-ivory">
            <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:flex lg:h-20 lg:justify-between">
                <div className="lg:hidden">
                    <MobileMenu typeLinks={typeLinks} brandLinks={brandLinks} />
                </div>
                <Link href={ROUTES.home} className="justify-self-center">
                    <Image src={logo} alt={SHOP.name} loading="eager" className="h-8 w-auto lg:h-10" />
                </Link>
                <nav aria-label={COPY.nav.label} className="hidden lg:flex items-center gap-8 text-label uppercase">
                    <NavDropdown label={COPY.nav.shop} href={ROUTES.shop} links={typeLinks} />
                    <NavDropdown label={COPY.nav.brands} href={ROUTES.brands} links={brandLinks} columns={2} />
                    <NavLink href={ROUTES.justDropped}>{COPY.nav.justDropped}</NavLink>
                    <NavLink href={ROUTES.about}>{COPY.nav.about}</NavLink>
                    <NavLink href={ROUTES.contact}>{COPY.nav.contact}</NavLink>
                </nav>
                <div className="flex items-center justify-end">
                    <Suspense>
                        <HeaderSearch />
                    </Suspense>
                    <span aria-hidden className={`${iconSlot} hidden lg:inline-flex`}><User size={20} /></span>
                    <span aria-hidden className={`${iconSlot} hidden lg:inline-flex`}><Heart size={20} /></span>
                    <span aria-hidden className={`${iconSlot} inline-flex w-auto gap-1 text-label`}>
                        <ShoppingBag size={20} />
                        {COPY.header.bagCount(0)}
                    </span>
                </div>
            </div>
        </header>
    );
}
