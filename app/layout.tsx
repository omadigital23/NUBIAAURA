import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/app/globals.css';
import { CartProvider } from '@/contexts/CartContext';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nubiaaura.com'),
  icons: {
    icon: [
      { url: 'https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: 'https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/logo.png' },
    ],
    shortcut: 'https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/logo.png',
  },
  title: {
    default: 'Nubia Aura - Mode Africaine Éthique & Sur-Mesure | Sénégal & Maroc',
    template: '%s | Nubia Aura',
  },
  description: 'Boutique de mode africaine haut de gamme : prêt-à-porter, robes de mariage, costumes africains sur-mesure. Livraison Sénégal, Maroc et international. Qualité premium, créations uniques.',
  keywords: [
    // Marque & Localisation
    'Nubia Aura', 'mode africaine', 'fashion africaine', 'Dakar', 'Sénégal', 'Maroc',

    // Robes
    'robe de mariage africaine', 'robe de mariée sur-mesure', 'robes de mariage Dakar',
    'robe de cérémonie', 'tenue événement formel', 'robe de soirée africaine',
    'robe de gala', 'robe de ville', 'robe wax', 'robe en tissu wax africain',

    // Costumes & Chemises
    'costume africain', 'costume traditionnel africain', 'costume classique',
    'chemise africaine', 'chemise wax', 'chemise en tissu wax',

    // Collections & Services
    'prêt-à-porter africain', 'sur-mesure', 'couture sur-mesure Dakar',
    'tenue traditionnelle africaine', 'boubou', 'Super 100',
    'accessoires mode africaine', 'édition limitée mode',

    // Services spéciaux
    'création personnalisée', 'couture personnalisée', 'mesures sur-mesure',
    'styliste Dakar', 'haute couture africaine', 'mode éthique africaine',

    // Livraison
    'livraison Sénégal', 'livraison Maroc', 'livraison internationale mode africaine',
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
    canonical: './',
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
        <meta name="theme-color" content="#D4AF37" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NUBIA AURA" />
        <link rel="manifest" href="/manifest.json" />
        <GoogleAnalytics />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[PWA] Service Worker registered:', registration.scope);
                    },
                    function(err) {
                      console.log('[PWA] Service Worker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-inter bg-nubia-white text-nubia-black antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
