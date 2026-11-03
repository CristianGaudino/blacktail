import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGES } from './config';

// Fixed slots (D-02): a typo in a path would be a silent broken image. No size check: a real photo replaces the file.
describe('IMAGES', () => {
    it('has a file under public/ for every slot', () => {
        const slots = Object.entries(IMAGES);
        expect(slots.length).toBeGreaterThan(0);
        for (const [slot, path] of slots) {
            expect(path.startsWith('/images/'), slot).toBe(true);
            expect(existsSync(join(process.cwd(), 'public', path)), `${slot}: ${path}`).toBe(true);
        }
    });
});
