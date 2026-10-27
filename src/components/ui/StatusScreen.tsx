/** Full-page message for errors and other status screens: a Bodoni heading, the message, optional small print, then actions. */
export function StatusScreen({ title, message, detail, children }: {
    title:     string;
    message:   string;
    /** Small print under the message, e.g. an error reference */
    detail?:   string;
    children?: React.ReactNode;
}) {
    return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
            <h1 className="font-heading text-heading">{title}</h1>
            <p className="mt-4 text-base">{message}</p>
            {detail && <p className="mt-2 text-label normal-case tracking-normal text-olive">{detail}</p>}
            {children && <div className="mt-8 flex flex-wrap justify-center gap-4">{children}</div>}
        </main>
    );
}
