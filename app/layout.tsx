import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/app/globals.css';
import { CartProvider } from '@/contexts/CartContext';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nubiaaura.com'),
  title: {
    default: 'Nubia Aura - Mode Africaine Éthique & Sur-Mesure | Sénégal & Maroc',
    template: '%s | Nubia Aura',
  },
  description: 'Boutique de mode africaine haut de gamme : prêt-à-porter, robes de mariage, costumes africains sur-mesure. Livraison Sénégal, Maroc et international. Qualité premium, créations uniques.',
  keywords: [
    'mode africaine', 'prêt-à-porter africain', 'sur-mesure',
    'robe de mariage africaine', 'costume africain', 'wax',
    'Sénégal', 'Dakar', 'Thiès', 'Maroc', 'Casablanca',
    'Nubia Aura', 'fashion africaine', 'tenue traditionnelle',
    'robe de cérémonie', 'chemise wax', 'boubou',
  ],
  authors: [{ name: 'Nubia Aura', url: 'https://www.nubiaaura.com' }],
  creator: 'Nubia Aura',
  publisher: 'OMA Digital',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  alternates: {
    canonical: 'https://www.nubiaaura.com',
    languages: {
      'fr-SN': 'https://www.nubiaaura.com/fr',
      'fr-MA': 'https://www.nubiaaura.com/fr',
      'fr': 'https://www.nubiaaura.com/fr',
      'en': 'https://www.nubiaaura.com/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    alternateLocale: ['fr_MA', 'en_US'],
    url: 'https://www.nubiaaura.com',
    title: 'Nubia Aura - Mode Africaine Éthique & Sur-Mesure',
    description: 'Boutique de mode africaine haut de gamme : prêt-à-porter, robes de mariage, costumes africains sur-mesure. Livraison Sénégal, Maroc et international.',
    siteName: 'Nubia Aura',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nubia Aura - Mode Africaine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nubia Aura - Mode Africaine Éthique & Sur-Mesure',
    description: 'Boutique de mode africaine haut de gamme. Prêt-à-porter et sur-mesure. Sénégal & Maroc.',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google015bb540921ade9d',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <GoogleAnalytics />
      </head>
      <body className="font-inter bg-nubia-white text-nubia-black antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
