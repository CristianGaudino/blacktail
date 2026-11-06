import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import type { ItemPhoto } from '@/lib/definitions';
import { ItemGallery } from './ItemGallery';

const photo = (n: number, width = 800, height = 1000): ItemPhoto => ({ url: `https://p.test/${n}.jpg`, thumbUrl: `https://p.test/${n}t.jpg`, width, height });
const photos = (n: number) => Array.from({ length: n }, (_, i) => photo(i + 1));
const render = (list: ItemPhoto[], soldLabel?: string) => renderToStaticMarkup(createElement(ItemGallery, { photos: list, name: 'Acme Wool coat', soldLabel }));
const count = (html: string, needle: string) => html.split(needle).length - 1;
// img tags only: React also hoists a preload link for a high-priority image
const imgs = (html: string) => html.match(/<img[^>]*>/g) ?? [];
// The test renderer goes through /_next/image, so the photo shows as an encoded url= parameter
const fullSize = (html: string) => imgs(html).filter(t => /url=https%3A%2F%2Fp\.test%2F\d\.jpg&/.test(t));
const thumbs = (html: string) => imgs(html).filter(t => /url=https%3A%2F%2Fp\.test%2F\dt\.jpg&/.test(t));

describe('ItemGallery', () => {
    it('shows every photo full size, only the cover eager with high priority', () => {
        const tags = fullSize(render(photos(3)));
        expect(tags).toHaveLength(3);
        expect(tags.filter(t => t.includes('loading="eager"'))).toHaveLength(1);
        expect(tags[0]).toContain('loading="eager"');
        expect(tags[0]).toMatch(/fetchpriority="high"/i);
        expect(tags[0]).toContain('width="800"');
        expect(tags[0]).toContain('height="1000"');
        for (const t of tags.slice(1)) {
            expect(t).toContain('loading="lazy"');
            expect(t).not.toMatch(/fetchpriority/i);
        }
    });

    it('is a labelled carousel region whose frame takes the cover ratio', () => {
        const html = render([photo(1, 1500, 2000), photo(2, 2000, 1500)]);
        expect(html).toContain('role="region"');
        expect(html).toContain('aria-roledescription="carousel"');
        expect(html).toContain(`aria-label="${COPY.item.photos}"`);
        expect(html).toContain('tabindex="0"');
        expect(html).toContain('aspect-ratio:1500 / 2000');
        expect(html).toContain('aria-roledescription="slide"');
        expect(html).toContain(`aria-label="${COPY.item.photoOf(2, 2)}"`);
    });

    it('labels the cover with the name and the others with their number', () => {
        const html = render(photos(2));
        expect(html).toContain('alt="Acme Wool coat"');
        expect(html).toContain('alt="Acme Wool coat, photo 2"');
    });

    it('gives three photos three lazy thumbnails, the first current, dots and a live line', () => {
        const html = render(photos(3));
        for (const n of [1, 2, 3]) expect(html).toContain(`aria-label="${COPY.item.showPhoto(n)}"`);
        expect(count(html, 'aria-current')).toBe(1);
        expect(thumbs(html).filter(t => t.includes('loading="lazy"'))).toHaveLength(3);
        expect(count(html, 'size-2 rounded-full')).toBe(3);
        expect(html).toContain(`aria-live="polite">${COPY.item.photoOf(1, 3)}<`);
    });

    it('swaps the dots for a counter past 10 photos', () => {
        const html = render(photos(11));
        expect(html).not.toContain('size-2 rounded-full');
        expect(html).toContain(COPY.item.position(1, 11));
    });

    it('shows one photo with no thumbnails, dots or live line', () => {
        const html = render(photos(1));
        expect(html).not.toContain(COPY.item.showPhoto(1));
        expect(html).not.toContain('size-2 rounded-full');
        expect(html).not.toContain('sr-only');
    });

    it('has the lightbox in the markup but the full-size photo only in the slide while closed', () => {
        const html = render(photos(3));
        expect(html).toContain('<dialog');
        expect(html).toContain(`aria-label="${COPY.item.viewer('Acme Wool coat')}"`);
        expect(html).toContain(`aria-label="${COPY.item.closeViewer}"`);
        expect(html).toContain(`>${COPY.item.photoOf(1, 3)}<`);
        expect(fullSize(html).filter(t => t.includes('%2F1.jpg&'))).toHaveLength(1);
    });

    it('offers previous and next for several photos, and neither for one', () => {
        const many = render(photos(3));
        expect(many).toContain(`aria-label="${COPY.item.previousPhoto}"`);
        expect(many).toContain(`aria-label="${COPY.item.nextPhoto}"`);
        const one = render(photos(1));
        expect(one).not.toContain(COPY.item.previousPhoto);
        expect(one).not.toContain(COPY.item.nextPhoto);
        expect(one).toContain(COPY.item.closeViewer);
    });

    it('shows a 4:5 frame and no image or button without photos', () => {
        const html = render([]);
        expect(html).toContain('aspect-[4/5]');
        expect(html).not.toContain('<img');
        expect(html).not.toContain('<button');
    });
});

describe('ItemGallery soldLabel', () => {
    const badge = (html: string) => html.match(/<span[^>]*pointer-events-none[^>]*>[^<]*<\/span>/g) ?? [];

    it('shows one aria-hidden badge before the carousel, outside the scroll track', () => {
        const html = render(photos(2), COPY.item.sold);
        const tags = badge(html);
        expect(tags).toHaveLength(1);
        expect(tags[0]).toContain('aria-hidden="true"');
        expect(tags[0]).toContain(`>${COPY.item.sold}<`);
        expect(html.indexOf(tags[0]!)).toBeLessThan(html.indexOf('role="region"'));
    });

    it('still shows the badge next to the placeholder when there are no photos', () => {
        const html = render([], COPY.item.sold);
        expect(badge(html)).toHaveLength(1);
        expect(html).not.toContain('role="region"');
    });

    it('shows no badge without a label', () => {
        expect(badge(render(photos(2)))).toHaveLength(0);
    });
});
