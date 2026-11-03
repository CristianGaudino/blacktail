import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SHOP } from '@/shop/config';
import { IMAGES } from './config';

// The second-shop guide must name what the template actually has (TMPL-02)
const root = process.cwd();
const doc = readFileSync(join(root, 'docs', 'ONBOARDING.md'), 'utf8');
const envNames = [...readFileSync(join(root, '.env.example'), 'utf8').matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(m => m[1]);
const imageFiles = [...Object.values(IMAGES), ...SHOP.home.categories.tiles.map(t => t.image)].map(path => basename(path));

describe('docs/ONBOARDING.md', () => {
    it('finds the variables and images to check', () => {
        expect(envNames).toContain('ALLOW_INDEXING');
        expect(imageFiles.length).toBeGreaterThanOrEqual(9);
    });

    it.each(envNames)('names the variable %s', name => {
        expect(doc).toContain(name);
    });

    it.each([...new Set(imageFiles)])('names the image file %s', file => {
        expect(doc).toContain(file);
    });

    it.each(['NEXT_INC_CACHE_R2_BUCKET', 'NEXT_TAG_CACHE_D1', 'NEXT_CACHE_DO_QUEUE', 'WORKER_SELF_REFERENCE'])('names the binding %s', binding => {
        expect(doc).toContain(binding);
    });

    it.each(['src/shop/', 'public/brands/', 'public/images/', 'PENDING-OWNER'])('names %s', name => {
        expect(doc).toContain(name);
    });

    it('has no em dash', () => {
        expect(doc).not.toContain(String.fromCharCode(0x2014));
    });
});
