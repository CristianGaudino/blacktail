import { ButtonLink } from '@/components/ui/buttons';
import { StatusScreen } from '@/components/ui/StatusScreen';
import { COPY } from '@/lib/copy';
import { ROUTES } from '@/lib/routes';

/** Any URL that matches no page, and an unknown brand slug. No API read: this is prerendered at build, which must make no How many call. */
export default function NotFound() {
    return (
        <StatusScreen title={COPY.notFound.title} message={COPY.notFound.body}>
            <ButtonLink variant="primary" href={ROUTES.shop}>{COPY.common.shopAll}</ButtonLink>
            <ButtonLink variant="secondary" href={ROUTES.home}>{COPY.common.goHome}</ButtonLink>
        </StatusScreen>
    );
}
