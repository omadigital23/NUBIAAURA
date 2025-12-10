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
                return NextResponse.redirect(new URL(`/fr/auth/login?error=${encodeURIComponent(error.message)}`, request.url));
            }

            if (data.session) {
                // Create response with redirect
                const response = NextResponse.redirect(new URL(next, request.url));

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
        } catch (err: any) {
            console.error('OAuth callback exception:', err);
            return NextResponse.redirect(new URL(`/fr/auth/login?error=${encodeURIComponent(err.message)}`, request.url));
        }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/fr/auth/login', request.url));
}
