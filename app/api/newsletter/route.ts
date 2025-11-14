import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/sendgrid';
import { getNewsletterWelcomeEmail } from '@/lib/email-templates';

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

    // Envoyer email de bienvenue
    try {
      const emailTemplate = getNewsletterWelcomeEmail({ email, name });
      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (emailError) {
      console.error('Erreur envoi email newsletter:', emailError);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    return NextResponse.json({ ok: true, subscription: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Get all newsletter subscriptions
    const { data: subscriptions, error } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriptions });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
