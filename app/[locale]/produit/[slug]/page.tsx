import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSupabaseServerClient } from '@/lib/supabase';
import ProductDetailsClient from '@/components/ProductDetailsClient';
import ProductShipping from '@/components/ProductShipping';
import ProductActions from '@/components/ProductActions';
import type { Metadata } from 'next';
import RelatedProducts from '@/components/RelatedProducts';
import { withImageParams } from '@/lib/image-formats';

type Params = { params: { locale: string; slug: string } };

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
  const product = await fetchProduct(params.slug);
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
  const product = await fetchProduct(params.slug);
  
  // 🔍 DEBUG: Log pour vérifier la locale reçue
  console.log('🔍 [ServerSide] Page params:', {
    locale: params.locale,
    slug: params.slug
  });

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductDetailsClient product={product} locale={params.locale} />
          {product && (
            <>
              <ProductShipping />
              <ProductActions 
                productName={(product as any).name_fr || (product as any).name || 'Produit'} 
                productUrl={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://nubiaaura.com'}/${params.locale}/produit/${params.slug}`}
              />
              <RelatedProducts category={(product as any).category} excludeId={(product as any).id} locale={params.locale} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
