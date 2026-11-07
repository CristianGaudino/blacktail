import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOME } from '@/lib/config';
import type { Item } from '@/lib/definitions';
import { getItemsPage } from '@/lib/howmany/client';
import { JustDropped } from './JustDropped';

vi.mock('@/lib/howmany/client', () => ({ getItemsPage: vi.fn() }));

const base: Item = {
    code: 'X', title: 'Wool coat', brand: 'Acme', category: 'clothing', type: null, size: 'L', condition: 'A', colour: 'Navy', era: '90s',
    department: null, measurements: { pitToPitMm: 580, lengthMm: 700 }, details: {}, priceCents: 12000, currency: 'EUR',
    photos: [{ url: 'https://p.test/1.jpg', thumbUrl: 'https://p.test/1t.jpg', width: 800, height: 1000 }],
    publishedAt: '2026-06-10T12:00:00Z',
};
const page = (codes: string[]) => ({
    page: { items: codes.map(code => ({ ...base, code })), page: 1, limit: 24, total: codes.length },
    asOf: null,
});
/** Answers each read by its first argument: a list of codes is a page, 'fail' is a rejected read */
const reads = (spotlight: string[] | 'fail', newest: string[] | 'fail') =>
    vi.mocked(getItemsPage).mockImplementation(async (search: string) => {
        const answer = search === 'spotlight=true' ? spotlight : newest;
        if (answer === 'fail') throw new Error('How many API 500');
        return page(answer);
    });
const render = async () => {
    const element = await JustDropped();
    return element ? renderToStaticMarkup(element) : '';
};
const codes = (html: string) => [...html.matchAll(/href="\/items\/([^"]+)"/g)].map(m => m[1]);

describe('JustDropped', () => {
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
        vi.mocked(getItemsPage).mockReset();
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it('makes exactly two reads: spotlight cut to the carousel size, and the newest with the empty query', async () => {
        reads(['B'], ['A', 'B']);
        await render();
        expect(getItemsPage).toHaveBeenCalledTimes(2);
        expect(getItemsPage).toHaveBeenCalledWith('spotlight=true', HOME.carouselItems);
        expect(getItemsPage).toHaveBeenCalledWith('');
    });

    it('puts a spotlight piece before the newest and shows it once', async () => {
        reads(['B'], ['A', 'B', 'C']);
        expect(codes(await render())).toEqual(['B', 'A', 'C']);
    });

    it('is the newest order cut to the carousel size when no piece is spotlighted', async () => {
        const newest = Array.from({ length: HOME.carouselItems + 3 }, (_, i) => `N${i}`);
        reads([], newest);
        expect(codes(await render())).toEqual(newest.slice(0, HOME.carouselItems));
    });

    it('is the newest order when the spotlight read fails, without throwing, warning once', async () => {
        reads('fail', ['A', 'B', 'C']);
        expect(codes(await render())).toEqual(['A', 'B', 'C']);
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('hides the section when both reads fail', async () => {
        reads('fail', 'fail');
        expect(await JustDropped()).toBeNull();
    });
});
