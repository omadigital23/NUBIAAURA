import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { checkRateLimit, formRatelimit } from '@/lib/rate-limit';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Envoyer email de bienvenue via Resend
    let emailStatus = 'pending';
    let emailErrorMessage: string | null = null;

    try {
      const welcomeName = name || 'cher(e) abonné(e)';

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Nubia Aura <noreply@notifications.nubiaaura.com>',
        to: email,
        subject: '✨ Bienvenue chez Nubia Aura !',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { 
                  background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); 
                  color: white; 
                  padding: 30px 20px; 
                  text-align: center; 
                  border-radius: 10px 10px 0 0;
                }
                .content { padding: 30px; background: #f9f9f9; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .button { 
                  background: #D4AF37; 
                  color: #000; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  display: inline-block; 
                  margin: 20px 0;
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">✨ Nubia Aura</h1>
                  <p style="margin: 10px 0 0 0;">L'élégance africaine à portée de main</p>
                </div>

                <div class="content">
                  <h2 style="color: #D4AF37;">Bienvenue ${welcomeName} !</h2>
                  
                  <p>Merci de vous être inscrit(e) à notre newsletter ! 🎉</p>

                  <p>Vous recevrez désormais en exclusivité :</p>
                  <ul>
                    <li>🎁 Nos nouvelles collections</li>
                    <li>💎 Des offres spéciales réservées</li>
                    <li>✨ Des conseils mode et style</li>
                    <li>🌍 L'actualité de la mode africaine</li>
                  </ul>

                  <center>
                    <a href="https://nubiaaura.com/fr/catalogue" class="button">
                      Découvrir la Collection
                    </a>
                  </center>

                  <p>À très bientôt !</p>
                  <p style="color: #D4AF37; font-weight: bold;">L'équipe Nubia Aura</p>
                </div>

                <div class="footer">
                  <p>© 2025 Nubia Aura. Tous droits réservés.</p>
                  <p>Dakar, Sénégal</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error('[Newsletter/Resend] Error:', emailError);
        emailStatus = 'failed';
        emailErrorMessage = emailError.message;
      } else {
        console.log('[Newsletter/Resend] Email sent:', emailData?.id);
        emailStatus = 'sent';
      }
    } catch (emailErr: any) {
      console.error('[Newsletter/Resend] Exception:', emailErr?.message);
      emailStatus = 'failed';
      emailErrorMessage = emailErr?.message || 'Unknown error';
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
