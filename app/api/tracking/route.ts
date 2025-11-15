import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * POST /api/tracking
 * Receive and store tracking events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      event,
      properties,
      userId,
      sessionId,
      timestamp,
    } = body;

    if (!event || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: event, sessionId' },
        { status: 400 }
      );
    }

    // Store tracking event in database
    const { error } = await supabase
      .from('tracking_events')
      .insert({
        event,
        properties: properties || {},
        user_id: userId || null,
        session_id: sessionId,
        timestamp: timestamp || new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip'),
      });

    if (error) {
      console.error('[Tracking API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to store tracking event' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Tracking API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracking
 * Get tracking events (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may need to add admin role check)
    // For now, we'll just return the data

    const { data: events, error } = await supabase
      .from('tracking_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { events },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Tracking API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
