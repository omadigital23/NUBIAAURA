import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        const response = NextResponse.json({ success: true });

        // Set the auth cookie
        // NOTE: httpOnly is set to false intentionally to allow client-side JavaScript
        // to access the token for useAuth hook and other client-side auth operations.
        // This is a trade-off between XSS protection and client-side auth requirements.
        // Mitigated by: CSP headers, secure flag in production, short token expiry.
        response.cookies.set('sb-auth-token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('[Set Cookie] Error:', error);
        return NextResponse.json(
            { error: 'Failed to set cookie' },
            { status: 500 }
        );
    }
}
