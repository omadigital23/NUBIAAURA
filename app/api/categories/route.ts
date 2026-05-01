import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

const DEFAULT_CATEGORIES = [
  { slug: 'chemises-wax', name: 'Chemises Wax', name_fr: 'Chemises Wax', name_en: 'Wax Shirts' },
  { slug: 'costumes-africains', name: 'Costumes Africains', name_fr: 'Costumes Africains', name_en: 'African Costumes' },
  { slug: 'robes-mariage', name: 'Robes de Mariage', name_fr: 'Robes de Mariage', name_en: 'Wedding Dresses' },
  { slug: 'robes-ceremonie', name: 'Robes de cérémonie', name_fr: 'Robes de cérémonie', name_en: 'Ceremony Dresses' },
  { slug: 'robes-ville', name: 'Robes de Ville', name_fr: 'Robes de Ville', name_en: 'City Dresses' },
  { slug: 'robes-wax', name: 'Robes Wax', name_fr: 'Robes Wax', name_en: 'Wax Dresses' },
  { slug: 'super100', name: 'Super 100', name_fr: 'Super 100', name_en: 'Super 100' },
];

function categoriesResponse(data = DEFAULT_CATEGORIES) {
  return NextResponse.json({ categories: data.map((category) => category.slug), data });
}

export async function GET() {
  try {
    if (process.env.PLAYWRIGHT === '1') {
      return categoriesResponse([
        { slug: 'robes', name: 'Robes', name_fr: 'Robes', name_en: 'Dresses' },
        { slug: 'chemises', name: 'Chemises', name_fr: 'Chemises', name_en: 'Shirts' },
        { slug: 'costumes', name: 'Costumes', name_fr: 'Costumes', name_en: 'Suits' },
      ]);
    }

    const supabase = getSupabaseServerClient();
    
    // Récupérer les catégories depuis la table categories
    const { data, error } = await supabase
      .from('categories')
      .select('slug, name, name_fr, name_en')
      .order('name_fr', { ascending: true });
    
    if (error) {
      console.warn('[API Categories] Falling back to default categories:', error.message);
      return categoriesResponse();
    }
    
    if (!data) {
      return NextResponse.json({ categories: [], data: [] });
    }
    
    const categories = data.map((c) => c.slug);
    console.log('[API Categories] Loaded:', data.length, 'categories');
    return NextResponse.json({ categories, data });
  } catch (err: any) {
    console.warn('[API Categories] Falling back to default categories:', err?.message || err);
    return categoriesResponse();
  }
}
