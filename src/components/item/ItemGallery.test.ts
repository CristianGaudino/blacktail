import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COPY } from '@/lib/copy';
import type { ItemPhoto } from '@/lib/definitions';
import { ItemGallery } from './ItemGallery';

const photo = (n: number, width = 800, height = 1000): ItemPhoto => ({ url: `https://p.test/${n}.jpg`, thumbUrl: `https://p.test/${n}t.jpg`, width, height });
const photos = (n: number) => Array.from({ length: n }, (_, i) => photo(i + 1));
const render = (list: ItemPhoto[]) => renderToStaticMarkup(createElement(ItemGallery, { photos: list, name: 'Acme Wool coat' }));
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
        expect(html).not.toContain('aria-live');
    });

    it('shows a 4:5 frame and no image or button without photos', () => {
        const html = render([]);
        expect(html).toContain('aspect-[4/5]');
        expect(html).not.toContain('<img');
        expect(html).not.toContain('<button');
    });
});
