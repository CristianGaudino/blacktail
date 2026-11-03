import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import type { CatalogueQuery } from '@/lib/definitions';
import { pageLinks } from '@/lib/paging';
import { pageHref } from '@/lib/params';
import { ROUTES } from '@/lib/routes';

const box = 'inline-flex size-11 items-center justify-center text-base';
// #results scrolls to the grid when a page link is followed
const href = (query: CatalogueQuery, page: number, basePath: string) => `${pageHref(query, page, basePath)}#results`;

export function Pager({ query, pageCount, basePath = ROUTES.shop }: { query: CatalogueQuery; pageCount: number; basePath?: string }) {
    if (pageCount <= 1) return null;
    const { page } = query;
    return (
        <nav aria-label={COPY.pager.label} className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {page > 1 ? (
                <Link href={href(query, page - 1, basePath)} prefetch={false} aria-label={COPY.pager.previous} className={box}><ChevronLeft className="size-5" /></Link>
            ) : (
                <span aria-hidden="true" className={`${box} opacity-40`}><ChevronLeft className="size-5" /></span>
            )}
            {pageLinks(page, pageCount).map((n, i) => n === 'gap' ? (
                <span key={`gap-${i}`} aria-hidden="true" className={box}>{COPY.pager.gap}</span>
            ) : (
                <Link
                    key={n}
                    href={href(query, n, basePath)}
                    prefetch={false}
                    aria-current={n === page ? 'page' : undefined}
                    className={`${box} ${n === page ? 'bg-forest text-ivory' : 'border border-transparent hover:border-stone'}`}
                >
                    {n}
                </Link>
            ))}
            {page < pageCount ? (
                <Link href={href(query, page + 1, basePath)} prefetch={false} aria-label={COPY.pager.next} className={box}><ChevronRight className="size-5" /></Link>
            ) : (
                <span aria-hidden="true" className={`${box} opacity-40`}><ChevronRight className="size-5" /></span>
            )}
        </nav>
    );
}
