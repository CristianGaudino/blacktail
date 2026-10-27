'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useTransition, type ReactNode } from 'react';

type Shell = { isPending: boolean; navigate: (href: string) => void };

// The default lets a control render outside the shell (tests, other pages)
const ShellContext = createContext<Shell>({ isPending: false, navigate: () => {} });

/**
 * One transition shared by every catalogue control. A search-param-only navigation keeps the old UI
 * inside a transition, so loading.tsx does not show for it: this is its pending state.
 */
export function CatalogueShell({ children }: { children: ReactNode }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    // push, not replace, so Back undoes a change
    const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }));
    return <ShellContext value={{ isPending, navigate }}>{children}</ShellContext>;
}

/** Keeps the old grid visible but dimmed while a navigation is pending */
export function GridBusy({ children }: { children: ReactNode }) {
    const { isPending } = useContext(ShellContext);
    return (
        <div aria-busy={isPending} className={`transition-opacity duration-150 ease-out ${isPending ? 'opacity-60' : ''}`}>
            {children}
        </div>
    );
}

export const useCatalogueNavigate = () => useContext(ShellContext).navigate;
