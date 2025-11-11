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

  if (!file || !productId || !slug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Compute path
  const ext = file.name.split('.').pop() || 'jpg';
  let path = '';
  if (kind === 'gallery') {
    const ts = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    path = `products/${slug}/gallery-${ts}-${safeName}`;
  } else {
    path = `products/${slug}/cover.${ext}`;
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

  if (kind === 'gallery') {
    const { error } = await supabase.from('product_images').insert({ product_id: productId, url: publicUrl });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from('products').update({ image: publicUrl, image_url: publicUrl }).eq('id', productId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
}
