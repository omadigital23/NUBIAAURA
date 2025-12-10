import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Récupérer les catégories depuis la table categories
    const { data, error } = await supabase
      .from('categories')
      .select('slug, name, name_fr, name_en')
      .order('name_fr', { ascending: true });
    
    if (error) {
      console.error('[API Categories] Error loading categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ categories: [], data: [] });
    }
    
    const categories = data.map((c) => c.slug);
    console.log('[API Categories] Loaded:', data.length, 'categories');
    return NextResponse.json({ categories, data });
  } catch (err: any) {
    console.error('[API Categories] Failed to load categories:', err);
    return NextResponse.json({ error: err?.message || 'Failed to load categories' }, { status: 500 });
  }
}
