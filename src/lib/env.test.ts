import { afterEach, describe, expect, it, vi } from 'vitest';
import { storeEnv } from './env';

const valid = {
    STORE_SLUG: 'test-shop',
    HOWMANY_API_URL: 'https://api.test/api/v1/stores/test-shop',
    HOWMANY_WEBHOOK_SECRET: 'a-secret-of-sufficient-length',
    SITE_URL: 'https://shop.test',
};

const setEnv = (vars: Record<string, string | undefined>) => {
    vi.unstubAllEnvs();
    for (const [k, v] of Object.entries({ ...Object.fromEntries(Object.keys(valid).map(k => [k, undefined])), ...vars })) {
        vi.stubEnv(k, v as string);
    }
};

const message = () => { try { storeEnv(); } catch (e) { return (e as Error).message; } return ''; };

afterEach(() => vi.unstubAllEnvs());

describe('env', () => {
    it('does not throw when imported with nothing set, only when called', () => {
        setEnv({});
        expect(() => storeEnv()).toThrow(/Invalid environment variables/);
    });

    it('accepts a complete configuration and strips the trailing slash', () => {
        setEnv({ ...valid, HOWMANY_API_URL: `${valid.HOWMANY_API_URL}/` });
        expect(storeEnv().HOWMANY_API_URL).toBe(valid.HOWMANY_API_URL);
    });

    it('says "missing" for each unset key', () => {
        for (const key of Object.keys(valid)) {
            setEnv({ ...valid, [key]: undefined });
            expect(message()).toMatch(new RegExp(`${key}: missing`));
        }
    });

    it('reports an empty string as invalid, not missing', () => {
        setEnv({ ...valid, SITE_URL: '' });
        expect(message()).toMatch(/SITE_URL: must be an https/);
        expect(message()).not.toMatch(/SITE_URL: missing/);
    });

    it('rejects a URL path that is not /stores/<STORE_SLUG>', () => {
        for (const url of ['https://api.test/api/v1/stores/other-shop', 'https://api.test/api/v1/stores/test-shop-old', 'https://api.test/api/v1']) {
            setEnv({ ...valid, HOWMANY_API_URL: url });
            expect(message()).toMatch(/HOWMANY_API_URL: .*More > Online store.*\/stores\/<STORE_SLUG>/);
        }
    });

    it('keeps the URL cross-check in the list when another variable also fails', () => {
        setEnv({ ...valid, HOWMANY_API_URL: 'https://api.test/api/v1/stores/other-shop', HOWMANY_WEBHOOK_SECRET: undefined });
        const text = message();
        expect(text).toMatch(/HOWMANY_API_URL: .*More > Online store/);
        expect(text).toMatch(/HOWMANY_WEBHOOK_SECRET: missing/);
    });

    it('lists every invalid variable in one message', () => {
        setEnv({});
        const text = message();
        for (const key of Object.keys(valid)) expect(text).toContain(`${key}: missing`);
    });

    it('rejects a bad slug, an http SITE_URL and a short secret', () => {
        setEnv({ ...valid, STORE_SLUG: 'Test-Shop' });
        expect(message()).toMatch(/STORE_SLUG/);
        setEnv({ ...valid, STORE_SLUG: 'test shop' });
        expect(message()).toMatch(/STORE_SLUG/);
        setEnv({ ...valid, SITE_URL: 'http://shop.test' });
        expect(message()).toMatch(/SITE_URL/);
        setEnv({ ...valid, HOWMANY_WEBHOOK_SECRET: '123456789012345' });
        expect(message()).toMatch(/HOWMANY_WEBHOOK_SECRET: must be at least 16/);
    });

    it('never puts a secret value in the message', () => {
        setEnv({ ...valid, HOWMANY_WEBHOOK_SECRET: 'short-secret-1234', STORE_SLUG: 'Bad Slug' });
        expect(message()).not.toContain('short-secret-1234');
        setEnv({ ...valid, HOWMANY_WEBHOOK_SECRET: '123456789012345' });
        expect(message()).not.toContain('123456789012345');
    });
});
