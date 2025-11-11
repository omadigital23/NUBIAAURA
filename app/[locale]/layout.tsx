import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

// Generate static params for locales
export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export const metadata: Metadata = {
  title: 'Nubia Aura - Mode Africaine Éthique & Sur-Mesure',
  description:
    "Plateforme de mode africaine alliant créativité, authenticité et élégance. Prêt-à-porter et sur-mesure.",
  keywords: 'mode africaine, prêt-à-porter, sur-mesure, Sénégal, Nubia Aura, fashion',
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
    locale: 'fr_FR',
    url: 'https://www.nubiaaura.com',
    title: 'Nubia Aura - Mode Africaine Éthique & Sur-Mesure',
    description: 'Plateforme de mode africaine alliant créativité, authenticité et élégance.',
    siteName: 'Nubia Aura',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nubia Aura - Mode Africaine Éthique & Sur-Mesure',
    description: 'Plateforme de mode africaine alliant créativité, authenticité et élégance.',
  },
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: 'fr' | 'en' };
}) {
  const { locale } = params;
  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-inter bg-nubia-white text-nubia-black">{children}</body>
    </html>
  );
}
