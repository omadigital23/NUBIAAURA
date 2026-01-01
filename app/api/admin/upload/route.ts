import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

function verify(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected || token !== expected) return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const productId = String(form.get('productId') || '');
  const slug = String(form.get('slug') || '');
  const kind = String(form.get('kind') || 'cover');
  const position = parseInt(String(form.get('position') || '0'), 10);

  if (!file || !productId || !slug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Compute path - use existing naming convention: 01-main, 02-back, 03-detail
  const ext = file.name.split('.').pop() || 'png';
  const positionNames = ['01-main', '02-back', '03-detail'];
  const positionName = positionNames[position] || `0${position + 1}-img`;

  let path = '';
  if (kind === 'gallery' || position > 0) {
    path = `images/${slug}/${positionName}.${ext}`;
  } else {
    path = `images/${slug}/${positionName}.${ext}`;
  }

  // Upload to bucket `products`
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const { error: upErr } = await supabase.storage.from('products').upload(path, bytes, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
  const publicUrl = pub?.publicUrl || '';

  if (!publicUrl) return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });

  // Check if image exists at this position
  const { data: existing } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('position', position)
    .maybeSingle();

  if (existing) {
    // Update existing image
    const { error } = await supabase
      .from('product_images')
      .update({ url: publicUrl })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Insert new image
    const { error } = await supabase
      .from('product_images')
      .insert({ product_id: productId, url: publicUrl, position });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update main product image/image_url if position 0 (cover)
  if (position === 0) {
    await supabase
      .from('products')
      .update({ image: publicUrl, image_url: publicUrl })
      .eq('id', productId);
  }

  return NextResponse.json({ ok: true, url: publicUrl, id: existing?.id });
}

