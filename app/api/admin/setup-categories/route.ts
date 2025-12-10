import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();

    // Les 7 catégories
    const categoriesData = [
      { slug: 'chemises-wax', name: 'Chemises Wax', name_fr: 'Chemises Wax', name_en: 'Wax Shirts' },
      { slug: 'costumes-africains', name: 'Costumes Africains', name_fr: 'Costumes Africains', name_en: 'African Costumes' },
      { slug: 'robes-mariage', name: 'Robes de Mariage', name_fr: 'Robes de Mariage', name_en: 'Wedding Dresses' },
    { slug: 'robes-ceremonie', name: 'Robes de cérémonie', name_fr: 'Robes de cérémonie', name_en: 'Ceremony Dresses' },
      { slug: 'robes-ville', name: 'Robes de Ville', name_fr: 'Robes de Ville', name_en: 'City Dresses' },
      { slug: 'robes-wax', name: 'Robes Wax', name_fr: 'Robes Wax', name_en: 'Wax Dresses' },
      { slug: 'super100', name: 'Super 100', name_fr: 'Super 100', name_en: 'Super 100' },
    ];

    console.log('[Setup] Inserting categories...');

    // Insérer les catégories
    const { data, error } = await supabase
      .from('categories')
      .upsert(categoriesData, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error('[Setup] Error inserting categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Setup] Categories inserted:', data?.length);
    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} categories inserted`,
      categories: data,
    });
  } catch (err: any) {
    console.error('[Setup] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
