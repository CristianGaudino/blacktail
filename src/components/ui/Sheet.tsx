'use client';

import { X } from 'lucide-react';
import { useId } from 'react';
import { IconButton } from './buttons';
import { useModalDialog } from '@/hooks/useModalDialog';
import { cn } from '@/lib/utils';

/**
 * Dialog that slides in from the left (the phone menu now, the filter drawer later). Built on <dialog>,
 * so focus trapping, Esc and stacking come from the browser. The dialog has no padding, so a click on
 * the panel never counts as a backdrop click. Callers set the width through `className`.
 */
export function Sheet({ open, onClose, title, closeLabel, footer, className, children }: {
    open:       boolean;
    onClose:    () => void;
    title:      React.ReactNode;
    closeLabel: string;
    footer?:    React.ReactNode;
    className?: string;
    children:   React.ReactNode;
}) {
    const dialog  = useModalDialog(open, onClose);
    const titleId = useId();

    return (
        <dialog
            {...dialog}
            aria-labelledby={titleId}
            className={cn(
                'sheet m-0 h-dvh max-h-dvh w-screen max-w-none flex-col bg-ivory p-0 text-forest outline-none backdrop:bg-forest/50 open:flex',
                className,
            )}
        >
            <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-stone px-4">
                <div id={titleId} className="min-w-0">{title}</div>
                <IconButton icon={X} label={closeLabel} onClick={onClose} className="-mr-2" />
            </header>
            {/* Not flex-1: from a zero basis, iOS Safari can size the sheet to the header and footer alone */}
            <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain">{children}</div>
            {footer && <footer className="shrink-0 border-t border-stone px-4 py-4">{footer}</footer>}
        </dialog>
    );
}
