import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
});

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

export const metadata: Metadata = {
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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'Nubia Aura',
    description: 'Boutique de mode africaine à Dakar - Robes de soirée, mariage, costumes africains',
    url: 'https://www.nubiaaura.com',
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
      name: 'Sénégal',
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

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Canonical URL for the current locale */}
        <link rel="canonical" href={`https://www.nubiaaura.com/${locale}`} />

        {/* hreflang for multilingual SEO */}
        <link rel="alternate" hrefLang="fr" href={`https://www.nubiaaura.com/fr`} />
        <link rel="alternate" hrefLang="en" href={`https://www.nubiaaura.com/en`} />
        <link rel="alternate" hrefLang="x-default" href="https://www.nubiaaura.com/fr" />

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
      </head>
      <body className="font-inter bg-nubia-white text-nubia-black antialiased" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
