import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SHOP } from '@/shop/config';
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

    it('has a file under public/ for every configured category tile', () => {
        for (const { type, image } of SHOP.home.categories.tiles) {
            expect(existsSync(join(process.cwd(), 'public', image)), `${type}: ${image}`).toBe(true);
        }
    });
});
