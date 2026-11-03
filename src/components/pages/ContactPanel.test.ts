import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SocialIcons } from '@/components/ui/SocialIcons';
import { COPY } from '@/lib/copy';
import { SHOP } from '@/shop/config';
import { ContactPanel } from './ContactPanel';

const render = (props: Partial<Parameters<typeof ContactPanel>[0]> = {}) =>
    renderToStaticMarkup(createElement(ContactPanel, { email: SHOP.contact.email, platforms: SHOP.platforms, socials: SHOP.socials, ...props }));

const noSocials = { instagram: null, tiktok: null, pinterest: null, spotify: null };

describe('ContactPanel', () => {
    it('links the email with mailto and shows the address', () => {
        const html = render();
        expect(html).toContain(`href="mailto:${SHOP.contact.email}"`);
        expect(html).toContain(`>${SHOP.contact.email}</a>`);
        expect(html).toContain(COPY.footer.email);
    });

    it('renders one safe new-tab link per platform with the visit text', () => {
        const html = render();
        for (const { name, url } of SHOP.platforms) {
            expect(html).toContain(`href="${url}"`);
            expect(html).toContain(COPY.item.visitOn(name));
        }
        expect(html.match(/target="_blank"/g)).toHaveLength(SHOP.platforms.length + Object.values(SHOP.socials).filter(Boolean).length);
        expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(SHOP.platforms.length + Object.values(SHOP.socials).filter(Boolean).length);
        expect(html).toContain(COPY.common.opensInNewTab);
    });

    it('renders linked socials with their labels and no icon-only span', () => {
        const html = render();
        for (const [network, url] of Object.entries(SHOP.socials)) {
            if (url) expect(html).toContain(`aria-label="${COPY.socials[network as keyof typeof COPY.socials]}"`);
        }
        expect(html).not.toContain('<span aria-hidden="true" class="inline-flex size-11');
    });

    it('uses the group labels from SHOP.contact', () => {
        const html = render();
        expect(html).toContain(SHOP.contact.shopWith);
        expect(html).toContain(SHOP.contact.follow);
    });

    it('leaves out the platforms group when there are none, and the socials group when none is linked', () => {
        expect(render({ platforms: [] })).not.toContain(SHOP.contact.shopWith);
        expect(render({ socials: noSocials })).not.toContain(SHOP.contact.follow);
        const bare = render({ platforms: [], socials: noSocials });
        expect(bare).toContain(COPY.footer.email);
        expect(bare).toContain(`href="mailto:${SHOP.contact.email}"`);
    });

    it('has no form and no field', () => {
        const html = render();
        expect(html).not.toContain('<form');
        expect(html).not.toContain('<input');
    });
});

describe('SocialIcons linkedOnly', () => {
    it('still shows an unlinked icon by default (the footer) and skips it when linkedOnly', () => {
        expect(renderToStaticMarkup(createElement(SocialIcons, { links: noSocials }))).toContain('<svg');
        expect(renderToStaticMarkup(createElement(SocialIcons, { links: noSocials, linkedOnly: true }))).not.toContain('<svg');
    });
});
