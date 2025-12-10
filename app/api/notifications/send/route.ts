import { NextRequest, NextResponse } from 'next/server';

/**
 * WhatsApp notifications via Twilio have been removed.
 * Email notifications are now handled directly in webhook and order routes.
 * This endpoint is kept for backward compatibility but returns a deprecation message.
 */
export async function POST(_request: NextRequest) {
  console.warn('[Notifications API] This endpoint is deprecated. WhatsApp notifications via Twilio have been removed.');
  console.warn('[Notifications API] Email notifications are now handled directly in webhook and order routes.');
  
  return NextResponse.json(
    {
      success: false,
      message: 'WhatsApp notifications via Twilio have been removed. Email notifications are handled automatically.',
      deprecated: true,
    },
    { status: 410 } // 410 Gone - resource no longer available
  );
}
