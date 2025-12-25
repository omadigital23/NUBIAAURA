import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

// Use service role to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Get the user ID from the Authorization header or cookie
        const authHeader = request.headers.get('authorization');
        let userId: string | null = null;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            // Verify the JWT token and get user
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userId = user.id;
        } else {
            // Try to get user from session cookie
            const cookieHeader = request.headers.get('cookie') || '';
            const cookies = Object.fromEntries(
                cookieHeader.split('; ').map(c => c.split('=').map(decodeURIComponent))
            );

            // Look for Supabase auth cookie
            const authCookie = cookies['sb-access-token'] || cookies['supabase-auth-token'];
            if (authCookie) {
                const { data: { user }, error } = await supabase.auth.getUser(authCookie);
                if (!error && user) {
                    userId = user.id;
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user profile from users table using service role (bypasses RLS)
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, full_name, phone, avatar_url, role')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[API] Error fetching user profile:', profileError);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        console.log('[API] User profile fetched:', { userId, email: profile?.email });

        return NextResponse.json({
            success: true,
            profile: {
                id: profile.id,
                email: profile.email,
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                fullName: profile.full_name || '',
                phone: profile.phone || '',
                avatarUrl: profile.avatar_url,
                role: profile.role,
            },
        });
    } catch (error) {
        console.error('[API] Error in user profile endpoint:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
