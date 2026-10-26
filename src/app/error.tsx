'use client';

import Link from 'next/link';
import { StatusScreen } from '@/components/ui/StatusScreen';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';

/** What the shop shows when the API is down and nothing is cached. The digest matches the server log entry. */
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    return (
        <StatusScreen
            title={COPY.status.errorTitle}
            message={COPY.status.errorMessage}
            detail={error.digest ? COPY.status.errorId(error.digest) : undefined}
        >
            <button type="button" onClick={retry}>{COPY.common.tryAgain}</button>
            <Link href={ROUTES.home}>{COPY.common.goHome}</Link>
        </StatusScreen>
    );
}
