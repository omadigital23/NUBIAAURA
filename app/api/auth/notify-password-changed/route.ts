import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { notifyPasswordChanged } from '@/lib/services/security-notifications';

/**
 * POST /api/auth/notify-password-changed
 * Called after a successful password change to send security notification
 */
export async function POST(req: Request) {
    try {
        // Get current user
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user || !user.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get optional metadata from request body
        let metadata: { ipAddress?: string; userAgent?: string } = {};
        try {
            const body = await req.json();
            metadata = {
                ipAddress: body.ipAddress || req.headers.get('x-forwarded-for')?.split(',')[0],
                userAgent: body.userAgent || req.headers.get('user-agent') || undefined,
            };
        } catch {
            // Body might be empty
            metadata = {
                ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
                userAgent: req.headers.get('user-agent') || undefined,
            };
        }

        // Send security notification
        const result = await notifyPasswordChanged(
            user.email,
            user.user_metadata?.full_name || user.user_metadata?.name,
            metadata
        );

        if (!result.success) {
            console.error('Failed to send password change notification:', result.error);
            // Don't fail the request, just log the error
        }

        return NextResponse.json({
            success: true,
            message: 'Notification sent',
        });
    } catch (error: any) {
        console.error('Notify password changed API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
