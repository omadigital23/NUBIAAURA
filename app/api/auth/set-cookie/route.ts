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
