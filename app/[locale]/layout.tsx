import type { Metadata, Viewport } from 'next';

// Generate static params for locales
export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

const legacyMetadata: Metadata = {
  title: 'Nubia Aura - Mode Africaine à Dakar | Robes de cérémonie, Mariage & Costumes',
  description:
    "Boutique de mode africaine à Dakar, Sénégal. Robes de cérémonie, robes de mariage, chemises wax, costumes africains, robes en wax. Prêt-à-porter et sur-mesure.",
  keywords: 'mode africaine Dakar, robe de soirée Dakar, robe de mariage Sénégal, chemise wax, costume africain, robe en wax, robe de ville, prêt-à-porter Dakar, sur-mesure Sénégal, Nubia Aura, fashion africaine',
  authors: [{ name: 'OMA Digital' }],
  creator: 'OMA Digital',
  publisher: 'OMA Digital',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    url: 'https://www.nubiaaura.com',
    title: 'Nubia Aura - Mode Africaine à Dakar | Robes & Costumes',
    description: 'Boutique de mode africaine à Dakar. Robes de soirée, mariage, chemises wax, costumes africains. Prêt-à-porter et sur-mesure.',
    siteName: 'Nubia Aura',
    countryName: 'Sénégal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nubia Aura - Mode Africaine à Dakar',
    description: 'Robes de soirée, mariage, chemises wax, costumes africains à Dakar, Sénégal.',
  },
};

void legacyMetadata;

const seoByLocale = {
  fr: {
    title: 'Nubia Aura - Mode Africaine à Dakar | Robes de cérémonie, Mariage & Costumes',
    description:
      "Boutique de mode africaine à Dakar, Sénégal. Robes de cérémonie, robes de mariage, chemises wax, costumes africains, robes en wax. Prêt-à-porter et sur-mesure.",
    keywords: 'mode africaine Dakar, robe de soirée Dakar, robe de mariage Sénégal, chemise wax, costume africain, robe en wax, robe de ville, prêt-à-porter Dakar, sur-mesure Sénégal, Nubia Aura, fashion africaine',
    openGraphLocale: 'fr_SN',
    countryName: 'Sénégal',
    shortTitle: 'Nubia Aura - Mode Africaine à Dakar',
    shortDescription: 'Boutique de mode africaine à Dakar. Robes de soirée, mariage, chemises wax, costumes africains. Prêt-à-porter et sur-mesure.',
    structuredDescription: 'Boutique de mode africaine à Dakar - robes de soirée, mariage et costumes africains',
    areaServed: 'Sénégal',
    offers: [
      ['Robes de soirée africaines', 'Collection de robes de soirée africaines sur-mesure et prêt-à-porter'],
      ['Robes de mariage', 'Robes de mariage africaines traditionnelles et modernes'],
      ['Chemises en wax', 'Chemises en tissu wax africain pour hommes'],
      ['Costumes africains', 'Costumes africains pour hommes sur-mesure'],
      ['Robes en wax', 'Robes en tissu wax africain pour femmes'],
    ],
  },
  en: {
    title: 'Nubia Aura - African Fashion in Dakar | Occasion Dresses, Bridalwear & Suits',
    description:
      'African fashion boutique in Dakar, Senegal. Occasion dresses, bridalwear, wax shirts, African suits, wax dresses, ready-to-wear pieces, and custom-made creations.',
    keywords: 'African fashion Dakar, occasion dress Dakar, bridalwear Senegal, wax shirt, African suit, wax dress, ready-to-wear Dakar, custom tailoring Senegal, Nubia Aura',
    openGraphLocale: 'en_SN',
    countryName: 'Senegal',
    shortTitle: 'Nubia Aura - African Fashion in Dakar',
    shortDescription: 'African fashion boutique in Dakar. Occasion dresses, bridalwear, wax shirts, African suits, ready-to-wear and custom-made pieces.',
    structuredDescription: 'African fashion boutique in Dakar - occasion dresses, bridalwear, and African suits',
    areaServed: 'Senegal',
    offers: [
      ['African occasion dresses', 'Custom-made and ready-to-wear African occasion dresses'],
      ['Bridalwear', 'Traditional and modern African bridalwear'],
      ['Wax shirts', 'African wax fabric shirts for men'],
      ['African suits', 'Custom-made African suits for men'],
      ['Wax dresses', 'African wax fabric dresses for women'],
    ],
  },
};

function getLocaleSeo(locale: string) {
  return locale === 'en' ? seoByLocale.en : seoByLocale.fr;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = getLocaleSeo(locale);
  const canonical = `https://www.nubiaaura.com/${locale}`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: 'OMA Digital' }],
    creator: 'OMA Digital',
    publisher: 'OMA Digital',
    formatDetection: {
      email: false,
      telephone: false,
      address: false,
    },
    alternates: {
      canonical,
      languages: {
        fr: 'https://www.nubiaaura.com/fr',
        en: 'https://www.nubiaaura.com/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: seo.openGraphLocale,
      url: canonical,
      title: seo.shortTitle,
      description: seo.shortDescription,
      siteName: 'Nubia Aura',
      countryName: seo.countryName,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.shortTitle,
      description: seo.shortDescription,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const seo = getLocaleSeo(locale);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'Nubia Aura',
    inLanguage: locale,
    description: seo.structuredDescription,
    url: `https://www.nubiaaura.com/${locale}`,
    image: 'https://www.nubiaaura.com/images/logo.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dakar',
      addressCountry: 'SN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '14.6937',
      longitude: '-17.4441',
    },
    areaServed: {
      '@type': 'Country',
      name: seo.areaServed,
    },
    priceRange: '$$',
    telephone: '+221771234567',
    openingHours: 'Mo-Sa 09:00-19:00',
    makesOffer: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Robes de soirée africaines',
          description: 'Collection de robes de soirée africaines sur-mesure et prêt-à-porter',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Robes de mariage',
          description: 'Robes de mariage africaines traditionnelles et modernes',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Chemises en wax',
          description: 'Chemises en tissu wax africain pour hommes',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Costumes africains',
          description: 'Costumes africains pour hommes sur-mesure',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Robes en wax',
          description: 'Robes en tissu wax africain pour femmes',
        },
      },
    ],
  };

  structuredData.makesOffer = seo.offers.map(([name, description]) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name,
      description,
    },
  }));

  return (
    <>
      {supabaseUrl && (
        <>
          <link rel="dns-prefetch" href={supabaseUrl} />
          <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />
        </>
      )}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
