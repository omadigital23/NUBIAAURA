import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
    try {
        const { email, role = 'user', redirectTo } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if requesting user is admin
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify admin role
        const isAdmin = user.user_metadata?.role === 'admin' ||
            user.app_metadata?.role === 'admin';

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Admin privileges required' },
                { status: 403 }
            );
        }

        // Use admin client to invite user
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
            redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/complete-signup`,
            data: {
                role,
                invited_by: user.email,
                invited_at: new Date().toISOString(),
            },
        });

        if (error) {
            console.error('Invite user error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        // Log the invitation (ignore errors if table doesn't exist)
        try {
            await supabase.from('activity_logs').insert({
                user_id: user.id,
                action: 'invite_user',
                details: {
                    invited_email: email,
                    role,
                },
            });
        } catch {
            // Ignore if table doesn't exist
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation sent successfully',
            user: {
                id: data.user.id,
                email: data.user.email,
            },
        });
    } catch (error: any) {
        console.error('Invite user API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
