import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export async function GET(req: NextRequest) {
  // Vérifier l'authentification admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Vérifier le token admin
  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { error: 'Invalid admin token' },
      { status: 401 }
    );
  }
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, name_fr, name_en, description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en, price, "originalPrice", category, sizes, colors, "inStock", image, image_url, product_variants(stock, sku), product_images(url)')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const products = (data || []).map((p: any) => ({
    ...p,
    stock: Array.isArray(p.product_variants) ? p.product_variants.reduce((sum: number, v: any) => sum + (v?.stock || 0), 0) : 0,
  }));

  return NextResponse.json({ data: products });
}

export async function POST(req: NextRequest) {
  // Vérifier l'authentification admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Vérifier le token admin
  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { error: 'Invalid admin token' },
      { status: 401 }
    );
  }

  const supabase = getSupabaseServerClient();
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === 'update') {
    const { id, price, originalPrice, category, sizes, colors, inStock, name, name_fr, name_en, slug, description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en, image, image_url } = body as any;
    const updates: any = {};
    if (typeof price === 'number') updates.price = price;
    if (typeof originalPrice === 'number') updates.originalPrice = originalPrice;
    if (typeof category === 'string') updates.category = category;
    if (Array.isArray(sizes)) updates.sizes = sizes;
    if (typeof sizes === 'string') {
      const arr = sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
      updates.sizes = arr.length ? arr : null;
    }
    if (Array.isArray(colors)) updates.colors = colors;
    if (typeof colors === 'string') {
      const arr = colors.split(',').map((s: string) => s.trim()).filter(Boolean);
      updates.colors = arr.length ? arr : null;
    }
    if (typeof inStock === 'boolean') updates.inStock = inStock;
    if (typeof name === 'string') updates.name = name;
    if (typeof name_fr === 'string') updates.name_fr = name_fr;
    if (typeof name_en === 'string') updates.name_en = name_en;
    if (typeof slug === 'string') updates.slug = slug;
    if (typeof description === 'string') updates.description = description;
    if (typeof description_fr === 'string') updates.description_fr = description_fr;
    if (typeof description_en === 'string') updates.description_en = description_en;
    if (typeof material === 'string') updates.material = material;
    if (typeof material_fr === 'string') updates.material_fr = material_fr;
    if (typeof material_en === 'string') updates.material_en = material_en;
    if (typeof care === 'string') updates.care = care;
    if (typeof care_fr === 'string') updates.care_fr = care_fr;
    if (typeof care_en === 'string') updates.care_en = care_en;
    if (typeof image === 'string') updates.image = image;
    if (typeof image_url === 'string') updates.image_url = image_url;
    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'stock') {
    const { id, slug, stock } = body as { id: string; slug: string; stock: number };
    // Upsert or update a standard variant SKU for stock keeping
    const sku = `${slug}-STD`;
    // Try update first
    const { data: existing, error: selErr } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', id)
      .eq('sku', sku)
      .maybeSingle();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    if (existing) {
      const { error } = await supabase.from('product_variants').update({ stock }).eq('id', existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from('product_variants').insert({ product_id: id, sku, stock });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'create') {
    const { name, name_fr, name_en, slug, price, inStock } = body as { name?: string; name_fr?: string; name_en?: string; slug: string; price: number; inStock?: boolean };
    if (!slug || typeof price !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: slug, price' }, { status: 400 });
    }
    const payload: any = { slug, price, inStock: typeof inStock === 'boolean' ? inStock : true };
    if (name) payload.name = name;
    if (name_fr) payload.name_fr = name_fr;
    if (name_en) payload.name_en = name_en;
    const { data, error } = await supabase.from('products').insert(payload).select('id, slug, name, name_fr, name_en, price, "inStock", image').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
  }

  if (action === 'delete') {
    const { id } = body as { id: string };
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
