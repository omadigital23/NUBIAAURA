import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/fr';

    if (code) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('OAuth callback error:', error);
                return NextResponse.redirect(new URL(`/fr/auth/login?error=${encodeURIComponent(error.message)}`, request.url), 302);
            }

            if (data.session) {
                // Create response with redirect
                const response = NextResponse.redirect(new URL(next, request.url), 302);

                // Set the auth token cookie
                response.cookies.set('sb-auth-token', data.session.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    path: '/',
                });

                return response;
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'OAuth error';
            console.error('OAuth callback exception:', error);
            return NextResponse.redirect(new URL(`/fr/auth/login?error=${encodeURIComponent(message)}`, request.url), 302);
        }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/fr/auth/login', request.url), 302);
}
