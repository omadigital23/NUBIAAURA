import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

// Force pas de cache pour avoir les données en temps réel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function verify(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  
  // Utiliser la fonction de vérification PBKDF2 au lieu d'une simple comparaison
  if (!verifyAdminToken(token)) return false;
  return true;
}

export async function GET(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const payment_status = searchParams.get('payment_status') || undefined;
  const q = searchParams.get('q') || undefined;
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (payment_status) query = query.eq('payment_status', payment_status);
  if (q) query = query.ilike('order_number', `%${q}%`);

  const { data, error, count } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Ajouter les headers pour forcer pas de cache
  const response = NextResponse.json({ orders: data || [], count: count ?? 0, page, limit });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseServerClient();
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === 'update_status') {
    const { id, status } = body;
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'update_payment_status') {
    const { id, payment_status } = body;
    const { error } = await supabase.from('orders').update({ payment_status }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
