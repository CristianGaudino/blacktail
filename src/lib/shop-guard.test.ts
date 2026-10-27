import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLOURS } from '@/shop/colours';
import { SHOP } from '@/shop/config';

// Template seam (TMPL-01): every shop value lives in src/shop/. Needles are built from the config at
// run time, so this test follows the config when another shop replaces that folder.
const root = process.cwd();

const themeHexes = readFileSync(join(root, 'src', 'shop', 'theme.css'), 'utf8').match(/#[0-9a-f]{3,8}\b/gi) ?? [];

const NEEDLES = [
    SHOP.name,
    SHOP.name.replace(/\s+/g, ''),
    SHOP.contact.email,
    ...SHOP.platforms.map(p => p.url),
    ...Object.values(SHOP.socials).filter((url): url is string => !!url),
    ...Object.values(COLOURS),
    ...themeHexes,
]
    .map(n => n.toLowerCase())
    .filter(n => n.length > 0);

/** Paths under src/, slash-normalised so the exclusion works on Windows. */
const inShopFolder = (path: string) => path.replace(/\\/g, '/').startsWith('shop/');
const isScanned = (path: string) => /\.(tsx?|css)$/.test(path) && !inShopFolder(path);
const findNeedles = (text: string) => NEEDLES.filter(n => text.toLowerCase().includes(n));

describe('shop-string guard', () => {
    it('has a non-empty needle list with the name, email, links and colours', () => {
        expect(NEEDLES.length).toBeGreaterThan(0);
        expect(NEEDLES).not.toContain('');
        expect(NEEDLES).toContain(SHOP.name.toLowerCase());
        expect(NEEDLES).toContain(SHOP.name.replace(/\s+/g, '').toLowerCase());
        expect(NEEDLES).toContain(SHOP.contact.email.toLowerCase());
        for (const p of SHOP.platforms) expect(NEEDLES).toContain(p.url.toLowerCase());
        expect(NEEDLES).toContain((SHOP.socials.instagram ?? '').toLowerCase());
        for (const hex of Object.values(COLOURS)) expect(NEEDLES).toContain(hex.toLowerCase());
    });

    it('does not use a null social as a needle', () => {
        const nullSocials = Object.values(SHOP.socials).filter(url => !url);
        expect(nullSocials.length).toBeGreaterThan(0);
        expect(NEEDLES).not.toContain('null');
        expect(NEEDLES).not.toContain('undefined');
    });

    it('has a needle that matches a violating sample, so it cannot pass vacuously', () => {
        for (const needle of NEEDLES) expect(findNeedles(`x${needle.toUpperCase()}y`), needle).toContain(needle);
    });

    it('skips src/shop paths (either slash) and keeps the rest', () => {
        expect(isScanned('shop/config.ts')).toBe(false);
        expect(isScanned('shop\\theme.css')).toBe(false);
        expect(isScanned('lib/copy.ts')).toBe(true);
        expect(isScanned('app/page.png')).toBe(false);
    });

    it('finds no shop value in any .ts, .tsx or .css file under src outside src/shop', () => {
        const files = readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' }).filter(isScanned);
        expect(files.length).toBeGreaterThan(0);
        const hits = files.flatMap(file => findNeedles(readFileSync(join(root, 'src', file), 'utf8')).map(n => `${file}: ${n}`));
        expect(hits).toEqual([]);
    });
});
