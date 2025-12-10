import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const header = request.headers.get('authorization') || '';
    const expected = process.env.ADMIN_TOKEN || '';
    
    if (!header.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = header.slice(7);
    if (!expected || token !== expected) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Mapping des catégories avec traductions
    const categoriesData = [
      {
        slug: 'chemises-wax',
        name: 'Chemises Wax',
        name_fr: 'Chemises Wax',
        name_en: 'Wax Shirts',
      },
      {
        slug: 'costumes-africains',
        name: 'Costumes Africains',
        name_fr: 'Costumes Africains',
        name_en: 'African Costumes',
      },
      {
        slug: 'robes-mariage',
        name: 'Robes de Mariage',
        name_fr: 'Robes de Mariage',
        name_en: 'Wedding Dresses',
      },
      {
        slug: 'robes-ceremonie',
        name: 'Robes de cérémonie',
        name_fr: 'Robes de cérémonie',
        name_en: 'Ceremony Dresses',
      },
      {
        slug: 'robes-ville',
        name: 'Robes de Ville',
        name_fr: 'Robes de Ville',
        name_en: 'City Dresses',
      },
      {
        slug: 'robes-wax',
        name: 'Robes Wax',
        name_fr: 'Robes Wax',
        name_en: 'Wax Dresses',
      },
      {
        slug: 'super100',
        name: 'Super 100',
        name_fr: 'Super 100',
        name_en: 'Super 100',
      },
    ];

    console.log('[Admin] Populating categories...');

    // Supprimer les catégories existantes
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('[Admin] Error deleting categories:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insérer les nouvelles catégories
    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesData)
      .select();

    if (error) {
      console.error('[Admin] Error inserting categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Admin] Categories populated:', data?.length);
    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} categories populated`,
      categories: data,
    });
  } catch (err: any) {
    console.error('[Admin] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
