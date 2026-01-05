import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { notifyPasswordChanged } from '@/lib/services/security-notifications';

/**
 * POST /api/auth/notify-password-changed
 * Called after a successful password change to send security notification
 */
export async function POST(req: Request) {
    try {
        // Try to get current user from session first
        const supabase = await getSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get request body to extract email/metadata
        let body: { email?: string; userName?: string; ipAddress?: string; userAgent?: string } = {};
        try {
            body = await req.json();
        } catch {
            // Body might be empty
        }

        // If no user from session, try to get email from request body
        const email = user?.email || body.email;
        const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || body.userName;

        if (!email) {
            return NextResponse.json(
                { error: 'Email required - either from session or request body' },
                { status: 401 }
            );
        }

        // Get optional metadata from request body
        const metadata: { ipAddress?: string; userAgent?: string } = {
            ipAddress: body.ipAddress || req.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
            userAgent: body.userAgent || req.headers.get('user-agent') || undefined,
        };

        // Send security notification
        const result = await notifyPasswordChanged(
            email, // Use extracted email (from session or body)
            userName, // Use extracted userName (from session or body)
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
