import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Generate a 6-digit OTP code
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create Supabase admin client
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration');
    }

    return createClient(supabaseUrl, serviceRoleKey);
}

// Email transporter
function getEmailTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Email invalide' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        console.log('[Reset OTP] Processing request for:', normalizedEmail);

        const supabase = getSupabaseAdmin();

        // Check if user exists in auth.users
        const { data: authData } = await supabase.auth.admin.listUsers();
        const authUser = authData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

        if (!authUser) {
            // Don't reveal if user exists - always return success
            console.log('[Reset OTP] User not found, returning success anyway');
            return NextResponse.json({
                success: true,
                message: 'Si cet email existe, vous recevrez un code de réinitialisation.'
            });
        }

        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        console.log('[Reset OTP] Generated code for user:', authUser.id);

        // Store OTP in database
        // First, delete any existing OTP for this email
        await supabase
            .from('password_reset_codes')
            .delete()
            .eq('email', normalizedEmail);

        // Insert new OTP
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

        // Send email with code
        try {
            const transporter = getEmailTransporter();

            await transporter.sendMail({
                from: `"NUBIA AURA" <${process.env.SMTP_USER || 'noreply@nubiaaura.com'}>`,
                to: normalizedEmail,
                subject: 'Code de réinitialisation de mot de passe - NUBIA AURA',
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
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .warning { color: #d32f2f; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>NUBIA AURA</h1>
              </div>
              <div class="content">
                <h2>Réinitialisation de votre mot de passe</h2>
                <p>Bonjour,</p>
                <p>Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :</p>
                
                <div class="code-box">${otpCode}</div>
                
                <p>Ce code est valide pendant <strong>15 minutes</strong>.</p>
                
                <p class="warning">
                  ⚠️ Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
                  Ne partagez jamais ce code avec quelqu'un d'autre.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} NUBIA AURA - Tous droits réservés</p>
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              </div>
            </div>
          </body>
          </html>
        `,
            });

            console.log('[Reset OTP] Email sent successfully');
        } catch (emailError) {
            console.error('[Reset OTP] Failed to send email:', emailError);
            // Don't fail the request, code is still stored
        }

        return NextResponse.json({
            success: true,
            message: 'Si cet email existe, vous recevrez un code de réinitialisation.'
        });

    } catch (error: any) {
        console.error('[Reset OTP] Error:', error);
        return NextResponse.json(
            { error: 'Une erreur est survenue. Veuillez réessayer.' },
            { status: 500 }
        );
    }
}
