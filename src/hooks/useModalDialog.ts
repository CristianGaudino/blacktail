'use client';

import { useEffect, useRef } from 'react';

/**
 * Opens/closes a native <dialog> as a modal in sync with `open`, and returns
 * props wiring Esc and backdrop taps to `onClose`.
 */
export function useModalDialog(open: boolean, onClose: () => void) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            // Focus the dialog itself rather than its first button
            dialog.focus();
        }
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return {
        ref,
        tabIndex: -1,
        onCancel: (e: React.SyntheticEvent<HTMLDialogElement>) => {
            // React passes a nested dialog's cancel up the tree — only handle our own
            if (e.target !== e.currentTarget) return;
            e.preventDefault();
            onClose();
        },
        onClick: (e: React.MouseEvent<HTMLDialogElement>) => {
            if (e.target === e.currentTarget) onClose();
        },
    };
}
