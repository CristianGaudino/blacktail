'use client';

import { Button, ButtonLink } from '@/components/ui/buttons';
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
            <Button variant="primary" onClick={retry}>{COPY.common.tryAgain}</Button>
            <ButtonLink variant="secondary" href={ROUTES.home}>{COPY.common.goHome}</ButtonLink>
        </StatusScreen>
    );
}
