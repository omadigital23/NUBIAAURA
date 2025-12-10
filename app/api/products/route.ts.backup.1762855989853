import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_images(*),
        product_categories!inner(category_id)
      `);

    if (id) {
      query = query.eq('id', id);
    }

    if (category) {
      query = query.eq('product_categories.category_id', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Products API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });

  } catch (error) {
    console.error('[Products API] Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}