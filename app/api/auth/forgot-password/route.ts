import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint is no longer needed.
 * The app now uses Supabase's native resetPasswordForEmail() in the client.
 * 
 * The password reset flow now works as follows:
 * 1. User submits email on /auth/forgot-password
 * 2. Client calls supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })
 * 3. Supabase sends password reset email with magic link
 * 4. User clicks link, arrives at /auth/reset-password with token in URL hash
 * 5. Component extracts token from hash and updates password via Supabase REST API
 * 
 * This endpoint can be deleted or kept as a backward compatibility layer if needed.
 */

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. The app now uses Supabase native password reset.',
      info: 'See /app/[locale]/auth/forgot-password/page.tsx for client implementation'
    },
    { status: 410 } // Gone
  );
}

