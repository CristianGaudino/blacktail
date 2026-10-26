/** Full-page message for errors and other status screens. Unstyled until the Phase 2 design system. */
export function StatusScreen({ title, message, detail, children }: {
    title:     string;
    message:   string;
    /** Small print under the message, e.g. an error reference */
    detail?:   string;
    children?: React.ReactNode;
}) {
    return (
        <main>
            <h1>{title}</h1>
            <p>{message}</p>
            {detail && <p>{detail}</p>}
            {children}
        </main>
    );
}
