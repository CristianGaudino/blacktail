import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RootError from '@/app/error';
import { COPY } from '@/lib/copy';
import { StatusScreen } from './StatusScreen';

const screen = (props: { detail?: string; children?: React.ReactNode } = {}) =>
    renderToStaticMarkup(createElement(StatusScreen, { title: 'T', message: 'M', ...props }));
const errorPage = (digest?: string) =>
    renderToStaticMarkup(createElement(RootError, { error: Object.assign(new Error('boom'), { digest }), retry: () => {} }));

describe('StatusScreen', () => {
    it('renders the title as a Bodoni heading and the message', () => {
        const html = screen();
        expect(html).toMatch(/<h1 class="[^"]*font-heading[^"]*text-heading[^"]*">T<\/h1>/);
        expect(html).toContain('>M</p>');
    });

    it('shows the detail in Olive, and nothing Olive without it', () => {
        expect(screen({ detail: 'D' })).toMatch(/<p class="[^"]*text-olive[^"]*">D<\/p>/);
        expect(screen()).not.toContain('text-olive');
    });

    it('lays children out in a flex row with a gap', () => {
        expect(screen({ children: createElement('i', null, 'x') })).toMatch(/<div class="[^"]*flex[^"]*gap-4[^"]*"><i>x<\/i><\/div>/);
    });
});

describe('error page', () => {
    it('shows the words, the reference, a Forest Try again button and a Go home link', () => {
        const html = errorPage('abc');
        expect(html).toContain(COPY.status.errorTitle);
        expect(html).toContain(COPY.status.errorId('abc'));
        expect(html).toMatch(new RegExp(`<button type="button" class="[^"]*bg-forest[^"]*">${COPY.common.tryAgain}</button>`));
        expect(html).toMatch(new RegExp(`<a [^>]*href="/"[^>]*>${COPY.common.goHome}</a>`));
    });

    it('shows no reference without a digest', () => {
        expect(errorPage()).not.toContain('Reference:');
    });
});
