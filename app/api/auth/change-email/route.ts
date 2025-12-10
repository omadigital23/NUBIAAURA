import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, authRatelimit } from '@/lib/rate-limit';
import { notifyEmailChanged } from '@/lib/services/security-notifications';
import { getSupabaseServerClient } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
    try {
        // Rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            'unknown';

        const rateLimitResult = await checkRateLimit(ip, authRatelimit);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const { newEmail, password } = await req.json();

        if (!newEmail || !password) {
            return NextResponse.json(
                { error: 'New email and current password are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Get current user from session
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'You must be logged in to change your email' },
                { status: 401 }
            );
        }

        const oldEmail = user.email!;

        // Verify current password by attempting to sign in
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error: signInError } = await adminSupabase.auth.signInWithPassword({
            email: oldEmail,
            password,
        });

        if (signInError) {
            return NextResponse.json(
                { error: 'Incorrect password' },
                { status: 401 }
            );
        }

        // Update email - Supabase will send confirmation to new email
        const { error: updateError } = await supabase.auth.updateUser({
            email: newEmail,
        });

        if (updateError) {
            console.error('Email change error:', updateError);
            return NextResponse.json(
                { error: updateError.message },
                { status: 400 }
            );
        }

        // Send security notification to old email
        await notifyEmailChanged(
            oldEmail,
            newEmail,
            user.user_metadata?.full_name || user.user_metadata?.name
        );

        return NextResponse.json({
            success: true,
            message: 'Confirmation email sent to your new address',
        });
    } catch (error: any) {
        console.error('Change email API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
