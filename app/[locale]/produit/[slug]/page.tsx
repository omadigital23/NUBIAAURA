import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSupabaseServerClient } from '@/lib/supabase';
import ProductDetailsClient from '@/components/ProductDetailsClient';
import ProductShipping from '@/components/ProductShipping';
import ProductActions from '@/components/ProductActions';
import type { Metadata } from 'next';
import RelatedProducts from '@/components/RelatedProducts';
import { withImageParams } from '@/lib/image-formats';

type Params = { params: Promise<{ locale: string; slug: string }> };

async function fetchProduct(slug: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, name_fr, name_en, image, image_url, price, rating, reviews, inStock, stock,
      description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en, sizes, colors, category,
      product_images(url, alt, position)
    `)
    .eq('slug', slug)
    .single();

  // 🔍 DEBUG: Log pour diagnostiquer le problème de description
  console.log('🔍 [ServerSide] Product fetched from Supabase:', {
    slug,
    hasData: !!data,
    error,
    descriptions: data ? {
      description: data.description,
      description_fr: data.description_fr,
      description_en: data.description_en
    } : null
  });

  return data as any | null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  const titleBase = product?.name_fr || product?.name_en || product?.name || 'Produit';
  const description = product?.description || 'Découvrez nos créations Nubia Aura.';
  const image = product?.image || product?.image_url || undefined;
  return {
    title: `${titleBase} | Nubia Aura`,
    description,
    openGraph: {
      title: `${titleBase} | Nubia Aura`,
      description,
      images: image ? [{ url: withImageParams('og', image) }] : undefined,
    },
  };
}

export default async function ProductDetailsPage({ params }: Params) {
  const { locale, slug } = await params;
  const product = await fetchProduct(slug);

  // Build structured data for SEO
  const productName = product?.name_fr || product?.name_en || product?.name || 'Produit';
  const productDescription = product?.description_fr || product?.description || 'Découvrez cette création Nubia Aura.';
  const productImage = product?.image || product?.image_url || '';
  const productUrl = `https://www.nubiaaura.com/${locale}/produit/${slug}`;

  // Product Schema for rich results
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDescription,
    image: productImage ? [withImageParams('og', productImage)] : undefined,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Nubia Aura',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'XOF',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Nubia Aura',
      },
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviews || 1,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  } : null;

  // Breadcrumb Schema for navigation
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: `https://www.nubiaaura.com/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalogue',
        item: `https://www.nubiaaura.com/${locale}/catalogue`,
      },
      ...(product?.category ? [{
        '@type': 'ListItem',
        position: 3,
        name: product.category.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        item: `https://www.nubiaaura.com/${locale}/catalogue/${product.category}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: product?.category ? 4 : 3,
        name: productName,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      {/* SEO Structured Data */}
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductDetailsClient product={product} locale={locale} />
          {product && (
            <>
              <ProductShipping />
              <ProductActions
                productName={productName}
                productUrl={productUrl}
              />
              <RelatedProducts category={(product as any).category} excludeId={(product as any).id} locale={locale} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

