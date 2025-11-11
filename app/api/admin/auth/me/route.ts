import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

function verifyAdminHeader(req: NextRequest) {
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

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient();

  // 1) Header-based admin check (service access)
  if (verifyAdminHeader(req)) {
    return NextResponse.json({ ok: true, method: 'header', role: 'admin' }, { status: 200 });
  }

  // 2) Session-based admin check (user session cookie)
  const token = req.cookies.get('sb-auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error: profErr } = await supabase
    .from('users')
    .select('id, email, role, name')
    .eq('id', user.id)
    .single();

  if (profErr || !profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ ok: true, method: 'session', user: { id: user.id, email: user.email, role: profile.role, name: profile.name } }, { status: 200 });
}
