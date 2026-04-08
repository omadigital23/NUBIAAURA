import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmailSMTP } from '@/lib/smtp-email';
import {
  getPasswordResetConfig,
  getPasswordResetPageUrl,
  PasswordResetLocale,
} from '@/lib/password-reset-config';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Supabase Admin] Missing configuration:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
    });
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function buildResetPasswordEmail(
  otpCode: string,
  locale: PasswordResetLocale,
  resetPageUrl: string
) {
  const config = getPasswordResetConfig(locale);
  const copy = locale === 'en'
    ? {
        subject: `Password reset code - ${config.brandName}`,
        title: 'Reset your password',
        greeting: 'Hello,',
        intro: `You requested a password reset for your ${config.brandName} account. Use the verification code below to continue.`,
        codeLabel: 'Your verification code',
        ttl: `This code is valid for ${config.codeTtlMinutes} minutes.`,
        cta: 'Open reset page',
        note: 'If you did not request this reset, you can safely ignore this email.',
        footer: 'This email was sent automatically. Please do not reply.',
        help: `Need help? Contact ${config.supportEmail}`,
      }
    : {
        subject: `Code de reinitialisation du mot de passe - ${config.brandName}`,
        title: 'Reinitialisez votre mot de passe',
        greeting: 'Bonjour,',
        intro: `Vous avez demande la reinitialisation du mot de passe de votre compte ${config.brandName}. Utilisez le code ci-dessous pour continuer.`,
        codeLabel: 'Votre code de verification',
        ttl: `Ce code est valable pendant ${config.codeTtlMinutes} minutes.`,
        cta: 'Ouvrir la page de reinitialisation',
        note: "Si vous n etes pas a l origine de cette demande, vous pouvez ignorer cet email en toute securite.",
        footer: 'Cet email a ete envoye automatiquement. Merci de ne pas y repondre.',
        help: `Besoin d aide ? Contactez ${config.supportEmail}`,
      };

  return {
    subject: copy.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #D4AF37; padding: 20px; text-align: center; }
          .header h1 { color: #1a1a1a; margin: 0; }
          .content { padding: 30px 20px; background: #fafafa; }
          .code-box {
            background: #1a1a1a;
            color: #D4AF37;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            letter-spacing: 8px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .cta {
            display: inline-block;
            margin-top: 8px;
            padding: 12px 22px;
            background: #D4AF37;
            color: #1a1a1a !important;
            text-decoration: none;
            font-weight: bold;
            border-radius: 8px;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { color: #d32f2f; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.brandName}</h1>
          </div>
          <div class="content">
            <h2>${copy.title}</h2>
            <p>${copy.greeting}</p>
            <p>${copy.intro}</p>
            <div class="code-box">${otpCode}</div>
            <p><strong>${copy.codeLabel}</strong></p>
            <p>${copy.ttl}</p>
            <p style="text-align: center;">
              <a href="${resetPageUrl}" class="cta">${copy.cta}</a>
            </p>
            <p class="warning">${copy.note}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${config.brandName}</p>
            <p>${copy.footer}</p>
            <p>${copy.help}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, locale: rawLocale } = await request.json();
    const locale: PasswordResetLocale = rawLocale === 'en' ? 'en' : 'fr';
    const passwordResetConfig = getPasswordResetConfig(locale);

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log('[Reset OTP] Processing request for:', normalizedEmail);

    const supabase = getSupabaseAdmin();
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find((user) => user.email?.toLowerCase() === normalizedEmail);

    if (!authUser) {
      console.log('[Reset OTP] User not found, returning success anyway');
      return NextResponse.json({
        success: true,
        message: 'Si cet email existe, vous recevrez un code de reinitialisation.',
      });
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + passwordResetConfig.codeTtlMinutes * 60 * 1000);

    await supabase
      .from('password_reset_codes')
      .delete()
      .eq('email', normalizedEmail);

    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        email: normalizedEmail,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      });

    if (insertError) {
      console.error('[Reset OTP] Failed to store code:', insertError);
      throw new Error('Failed to generate reset code');
    }

    const resetPageUrl = getPasswordResetPageUrl(locale);
    const emailPayload = buildResetPasswordEmail(otpCode, locale, resetPageUrl);

    try {
      await sendEmailSMTP({
        to: normalizedEmail,
        subject: emailPayload.subject,
        html: emailPayload.html,
      });
      console.log('[Reset OTP] Email sent successfully');
    } catch (emailError) {
      console.error('[Reset OTP] Failed to send email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Si cet email existe, vous recevrez un code de reinitialisation.',
    });
  } catch (error: any) {
    console.error('[Reset OTP] Error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
