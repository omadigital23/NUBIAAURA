import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, authRatelimit } from '@/lib/rate-limit';
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

        const { password } = await req.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            );
        }

        // Get current user
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user || !user.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify password by attempting to sign in with admin client
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error: signInError } = await adminSupabase.auth.signInWithPassword({
            email: user.email,
            password,
        });

        if (signInError) {
            return NextResponse.json(
                { error: 'Incorrect password', valid: false },
                { status: 401 }
            );
        }

        // Generate a short-lived reauthentication token
        const reauthToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store the token (in a real app, use Redis or similar)
        // For now, we'll return it and let the client handle timing
        return NextResponse.json({
            success: true,
            valid: true,
            token: reauthToken,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error: any) {
        console.error('Reauthenticate API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
