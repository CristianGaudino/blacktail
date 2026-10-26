import { SHOP } from '@/shop/config';

// Money arrives as integer cents.
const CENTS_PER_UNIT = 100;

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * 12000 -> "€120", 11950 -> "€119.50": the one formatter for cards, chips and sliders (SHELL-05).
 * Whole amounts show no cents; anything else always shows two digits (never "€119.5").
 */
export function formatMoney(cents: number, currency: string): string {
    const digits = cents % 100 === 0 ? 0 : 2;
    const key = `${currency} ${digits}`;
    let formatter = formatters.get(key);
    if (!formatter) {
        formatter = new Intl.NumberFormat(SHOP.locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
        formatters.set(key, formatter);
    }
    return formatter.format(cents / CENTS_PER_UNIT);
}
