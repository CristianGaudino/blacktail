import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Cache Components hangs and 500s on Workers today, and the calls below bypass or break the tag cache
// (CLAUDE.md "What NOT to Use"). Comments are not exempt: write "Cache Components" with a space.
const FORBIDDEN: Record<string, RegExp> = {
    cacheComponents:     /\bcacheComponents\b/,
    cacheTag:            /\bcacheTag\b/,
    cacheLife:           /\bcacheLife\b/,
    'use cache':         /(['"])use cache(:\s*[\w-]+)?\1/,
    unstable_cache:      /\bunstable_cache\b/,
    updateTag:           /\bupdateTag\b/,
    revalidatePath:      /\brevalidatePath\b/,
    'revalidateTag(tag)': /\brevalidateTag\((?:[^,()]|\([^()]*\))*\)/,
};

const SAMPLES: Record<string, string> = {
    cacheComponents:     'cacheComponents: true',
    cacheTag:            "cacheTag('x')",
    cacheLife:           "cacheLife('max')",
    'use cache':         "'use cache: remote'",
    unstable_cache:      'unstable_cache(fn)',
    updateTag:           "updateTag('x')",
    revalidatePath:      "revalidatePath('/')",
    'revalidateTag(tag)': "revalidateTag('store:x')",
};

const root = process.cwd();
const files = [
    ...readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' })
        .filter(f => /\.tsx?$/.test(f) && !/guard\.test\.ts$/.test(f))
        .map(f => join('src', f)),
    ...['next.config.ts', 'open-next.config.ts'].filter(f => existsSync(join(root, f))),
];

describe('Cache Components guard', () => {
    it('has a pattern that matches a violating sample, so it cannot pass vacuously', () => {
        for (const [token, pattern] of Object.entries(FORBIDDEN)) expect(pattern.test(SAMPLES[token]), token).toBe(true);
    });

    it('does not flag the two-argument revalidateTag call', () => {
        expect(FORBIDDEN['revalidateTag(tag)'].test('revalidateTag(storeTag(), { expire: 0 })')).toBe(false);
    });

    it('finds no forbidden token in src, next.config.ts or open-next.config.ts', () => {
        expect(files.length).toBeGreaterThan(0);
        const hits = files.flatMap(file => {
            const text = readFileSync(join(root, file), 'utf8');
            return Object.entries(FORBIDDEN).filter(([, pattern]) => pattern.test(text)).map(([token]) => `${file}: ${token}`);
        });
        expect(hits).toEqual([]);
    });
});
