import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || '').toString().trim().toLowerCase();
    const name = (body?.name || '').toString().trim() || null;
    const locale = (body?.locale || 'fr').toString().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Upsert by email: subscribe (true) and update optional fields
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .upsert(
        {
          email,
          name,
          locale: locale === 'en' ? 'en' : 'fr',
          subscribed: true,
        },
        { onConflict: 'email' }
      )
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, subscription: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
