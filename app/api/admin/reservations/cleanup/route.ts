import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

function verify(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const expected = process.env.ADMIN_TOKEN || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7);
    if (expected && token === expected) return true;
  }
  if (header.startsWith('Basic ')) {
    const b64 = header.slice(6);
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      const [u, p] = decoded.split(':');
      const adminUser = process.env.ADMIN_USER || 'nubiaaura';
      const adminPass = process.env.ADMIN_PASS || 'Paty2025!';
      if (u === adminUser && p === adminPass) return true;
    } catch {}
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseServerClient();

  try {
    // Release any active, expired reservations (not finalized)
    const { data: toRelease, error: selErr } = await supabase
      .from('stock_reservations')
      .select('id')
      .lt('expires_at', new Date().toISOString())
      .is('finalized_at', null)
      .is('released_at', null);
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    let released = 0;
    if (Array.isArray(toRelease) && toRelease.length) {
      const ids = toRelease.map((r: any) => r.id);
      const { error: updErr } = await supabase
        .from('stock_reservations')
        .update({ released_at: new Date().toISOString() })
        .in('id', ids);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      released = ids.length;
    }

    return NextResponse.json({ ok: true, released });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Cleanup failed' }, { status: 500 });
  }
}
