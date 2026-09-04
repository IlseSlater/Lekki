/**
 * Batch 7 — route SEO titles/descriptions (pure).
 * Used by marketing pages + unit proof.
 */

export type RouteSeo = {
  title: string;
  description: string;
};

export const MARKETING_SEO: Record<string, RouteSeo> = {
  '/': {
    title: 'Lekki — Your venue deserves its own home',
    description:
      'Lekki gives restaurants, cafés, hotels, and festivals a fully branded guest space with menus, orders, kitchen, and the bill.',
  },
  '/privacy': {
    title: 'Privacy — Lekki',
    description:
      'How Lekki handles guest first names and order data on behalf of venues. POPIA enquiries welcome.',
  },
  '/terms': {
    title: 'Terms — Lekki',
    description: 'Terms of use for Lekki LEOS hospitality experiences.',
  },
};

export function seoForPath(path: string): RouteSeo {
  const key = path.split('?')[0] || '/';
  return MARKETING_SEO[key] ?? MARKETING_SEO['/'];
}

/** Organization + SoftwareApplication JSON-LD for the marketing home. */
export function lekkiJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Lekki',
        url: 'https://lekki.io/',
        logo: 'https://lekki.io/brand/lekki-logo.png',
        email: 'hello@lekki.app',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'LEOS',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://lekki.io/',
        description:
          'Hospitality experience platform — QR guest menus, orders, kitchen fulfilment, and split bills.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Lekki',
        },
      },
    ],
  };
}
