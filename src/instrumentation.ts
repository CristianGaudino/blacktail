// Runs once when the server starts: fail fast, with a readable list of what's
// wrong, if configuration is missing, instead of a minified 500 per request.
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { storeEnv } = await import('./lib/env');
        storeEnv();
    }
}
