import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { sendEmailSMTP } from '@/lib/smtp-email';
import { getNewsletterWelcomeEmail } from '@/lib/email-templates';
import { checkRateLimit, formRatelimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'global';
    const rl = await checkRateLimit(`newsletter:${String(ip).split(',')[0].trim()}`, formRatelimit);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
        { status: 429 }
      );
    }

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

    // Envoyer email de bienvenue via SMTP
    let emailStatus = 'pending';
    let emailErrorMessage: string | null = null;

    try {
      const emailTemplate = getNewsletterWelcomeEmail({ email, name: name || undefined });
      const result = await sendEmailSMTP({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
      emailStatus = result === 'skipped' ? 'skipped' : 'sent';
      console.log('[Newsletter] Email status:', emailStatus);
    } catch (emailError: any) {
      console.error('[Newsletter] Email error:', emailError?.message);
      emailStatus = 'failed';
      emailErrorMessage = emailError?.message || 'Unknown error';
      // Ne pas bloquer l'inscription si l'email échoue
    }

    return NextResponse.json({
      ok: true,
      subscription: data,
      emailStatus,
      emailError: emailErrorMessage
    });
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
