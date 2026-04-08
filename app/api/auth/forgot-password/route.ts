import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint is no longer used by the app.
 * The active password reset flow is the OTP flow implemented with:
 * 1. POST /api/auth/reset-password-otp
 * 2. POST /api/auth/verify-reset-code
 * 
 * The user flow now works as follows:
 * 1. User submits email on /auth/forgot-password
 * 2. Client calls /api/auth/reset-password-otp
 * 3. The API stores a short-lived code and sends it via SMTP
 * 4. User enters the code on /auth/reset-password
 * 5. /api/auth/verify-reset-code updates the password via Supabase Admin API
 * 
 * This endpoint can be deleted or kept as a backward compatibility layer if needed.
 */

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. The app uses the OTP password reset flow.',
      info: 'See /app/[locale]/auth/forgot-password/page.tsx and /app/api/auth/reset-password-otp/route.ts'
    },
    { status: 410 } // Gone
  );
}

