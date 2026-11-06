import type { ItemDetail } from '@/lib/definitions';

/**
 * Product data for search engines (SEO-02). Named fields only: no code, sku, details or cost.
 * The price string is machine data, not display (formatMoney stays the only display formatter).
 */
export function ItemJsonLd({ item, url }: { item: ItemDetail; url: string }) {
    const data = {
        '@context': 'https://schema.org',
        '@type':    'Product',
        name:       item.title,
        ...(item.photos.length > 0 ? { image: item.photos.map(photo => photo.url) } : {}),
        ...(item.brand ? { brand: { '@type': 'Brand', name: item.brand } } : {}),
        offers: {
            '@type':       'Offer',
            // A sold piece that never had a price has no price key
            ...(item.priceCents === null ? {} : { price: (item.priceCents / 100).toFixed(2) }),
            priceCurrency: item.currency,
            availability:  item.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/UsedCondition',
            url,
        },
    };
    // Escaping every < means item text can never close the script tag
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
