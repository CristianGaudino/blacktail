/** Full-page message for errors and other status screens: a Bodoni heading, the message, optional small print, then actions. */
export function StatusScreen({ title, message, detail, bare = false, children }: {
    title:     string;
    message:   string;
    /** Small print under the message, e.g. an error reference */
    detail?:   string;
    /** Render a div instead of a main, for a page that brings its own main (the gone-item page) */
    bare?:     boolean;
    children?: React.ReactNode;
}) {
    const Root = bare ? 'div' : 'main';
    return (
        <Root className="mx-auto max-w-xl px-4 py-16 text-center">
            <h1 className="font-heading text-heading">{title}</h1>
            <p className="mt-4 text-base">{message}</p>
            {detail && <p className="mt-2 text-label normal-case tracking-normal text-olive">{detail}</p>}
            {children && <div className="mt-8 flex flex-wrap justify-center gap-4">{children}</div>}
        </Root>
    );
}
