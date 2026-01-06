import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration');
    }

    return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: NextRequest) {
    try {
        const { email, code, newPassword } = await request.json();

        // Validate inputs
        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { error: 'Tous les champs sont requis' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins 8 caractères' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCode = code.trim();

        console.log('[Verify Reset] Processing request for:', normalizedEmail);

        const supabase = getSupabaseAdmin();

        // Get the stored OTP
        const { data: otpData, error: otpError } = await supabase
            .from('password_reset_codes')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        if (otpError || !otpData) {
            console.log('[Verify Reset] No OTP found for email');
            return NextResponse.json(
                { error: 'Code invalide ou expiré. Veuillez demander un nouveau code.' },
                { status: 400 }
            );
        }

        // Check if code has expired
        if (new Date(otpData.expires_at) < new Date()) {
            console.log('[Verify Reset] OTP expired');
            // Delete expired code
            await supabase
                .from('password_reset_codes')
                .delete()
                .eq('email', normalizedEmail);

            return NextResponse.json(
                { error: 'Le code a expiré. Veuillez demander un nouveau code.' },
                { status: 400 }
            );
        }

        // Check attempts (max 5)
        if (otpData.attempts >= 5) {
            console.log('[Verify Reset] Too many attempts');
            // Delete code after too many attempts
            await supabase
                .from('password_reset_codes')
                .delete()
                .eq('email', normalizedEmail);

            return NextResponse.json(
                { error: 'Trop de tentatives. Veuillez demander un nouveau code.' },
                { status: 400 }
            );
        }

        // Verify code
        if (otpData.code !== normalizedCode) {
            console.log('[Verify Reset] Invalid code');
            // Increment attempts
            await supabase
                .from('password_reset_codes')
                .update({ attempts: otpData.attempts + 1 })
                .eq('email', normalizedEmail);

            const remainingAttempts = 5 - (otpData.attempts + 1);
            return NextResponse.json(
                { error: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).` },
                { status: 400 }
            );
        }

        console.log('[Verify Reset] Code verified, looking up user...');

        // Find the user by email
        const { data: authData, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('[Verify Reset] Failed to list users:', listError);
            return NextResponse.json(
                { error: 'Erreur serveur: impossible de trouver l\'utilisateur' },
                { status: 500 }
            );
        }

        const authUser = authData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

        if (!authUser) {
            console.error('[Verify Reset] User not found in auth for email:', normalizedEmail);
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        console.log('[Verify Reset] Found user:', authUser.id);
        console.log('[Verify Reset] User email:', authUser.email);
        console.log('[Verify Reset] Updating password...');

        // Update password using admin API
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            authUser.id,
            { password: newPassword }
        );

        console.log('[Verify Reset] Update response - data received:', !!updateData);
        console.log('[Verify Reset] Update response - user id:', updateData?.user?.id);

        if (updateError) {
            console.error('[Verify Reset] Failed to update password:', updateError);
            return NextResponse.json(
                { error: 'Erreur lors de la mise à jour du mot de passe: ' + updateError.message },
                { status: 500 }
            );
        }

        // Verify the update was actually applied
        console.log('[Verify Reset] Password updated successfully for user:', authUser.id);

        // Delete the used OTP
        await supabase
            .from('password_reset_codes')
            .delete()
            .eq('email', normalizedEmail);

        // Send notification email about password change (optional)
        try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/api/auth/notify-password-changed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: normalizedEmail,
                    userName: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
                }),
            });
        } catch (notifError) {
            console.warn('[Verify Reset] Failed to send notification:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès'
        });

    } catch (error: any) {
        console.error('[Verify Reset] Error:', error);
        return NextResponse.json(
            { error: 'Une erreur est survenue. Veuillez réessayer.' },
            { status: 500 }
        );
    }
}
