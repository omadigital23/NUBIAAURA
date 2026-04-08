import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/auth-admin';
import * as Sentry from '@sentry/nextjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

function verifyAdminAuth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') || '';

  // Bearer token (new method via auth-admin)
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7);
    if (verifyAdminToken(token)) return true;
    // Legacy: direct ADMIN_TOKEN comparison
    const expected = process.env.ADMIN_TOKEN || '';
    if (expected && token === expected) return true;
  }

  // Basic auth (legacy)
  if (header.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const [u, p] = decoded.split(':');
      const adminUser = process.env.ADMIN_USER || 'nubiaaura';
      const adminPass = process.env.ADMIN_PASS || '';
      if (u === adminUser && p === adminPass) return true;
    } catch { /* ignore */ }
  }

  return false;
}

/**
 * GET /api/admin/reviews — List all reviews with pagination and filtering
 */
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('product_reviews')
      .select(`
        *,
        products:product_id (
          id,
          name_fr,
          name_en,
          slug,
          image_url
        ),
        users:user_id (
          id,
          email,
          full_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Reviews fetch error:', error);
    Sentry.captureException(error, { tags: { route: 'admin/reviews/GET' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/reviews — Approve or reject a review
 */
export async function PATCH(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { reviewId, action } = body;

    if (!reviewId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabaseAdmin
      .from('product_reviews')
      .update({ status: newStatus })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: data });
  } catch (error: unknown) {
    console.error('Review update error:', error);
    Sentry.captureException(error, { tags: { route: 'admin/reviews/PATCH' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reviews — Delete a review and update product stats
 */
export async function DELETE(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get review info for product stats update
    const { data: review } = await supabaseAdmin
      .from('product_reviews')
      .select('product_id')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('product_reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Update product stats after deletion
    if (review?.product_id) {
      const { data: remaining } = await supabaseAdmin
        .from('product_reviews')
        .select('rating')
        .eq('product_id', review.product_id);

      if (remaining && remaining.length > 0) {
        const avg = Math.round(remaining.reduce((s, r) => s + r.rating, 0) / remaining.length);
        await supabaseAdmin
          .from('products')
          .update({ rating: avg, reviews: remaining.length })
          .eq('id', review.product_id);
      } else {
        await supabaseAdmin
          .from('products')
          .update({ rating: null, reviews: 0 })
          .eq('id', review.product_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Review deletion error:', error);
    Sentry.captureException(error, { tags: { route: 'admin/reviews/DELETE' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
