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

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }

  try {
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!authErr && authData?.user?.id) {
      const { error: upErr } = await supabase
        .from('users')
        .upsert({ id: authData.user.id, email, name, role: 'admin' }, { onConflict: 'id' });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, created: true, id: authData.user.id });
    }

    if (authErr && !/already/i.test(authErr.message)) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    const { data: existingUser, error: selErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    if (!existingUser) {
      return NextResponse.json({ error: 'User exists in auth but profile not found' }, { status: 404 });
    }

    const { error: updErr } = await supabase
      .from('users')
      .update({ role: 'admin', name })
      .eq('id', existingUser.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, created: false, id: existingUser.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Admin creation failed' }, { status: 500 });
  }
}
