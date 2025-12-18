import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for updating return status
const UpdateReturnSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'shipped', 'received', 'refunded']),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get auth token
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get return details
    const { data: returnRequest, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (returnError || !returnRequest) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', returnRequest.order_id)
      .single();

    return NextResponse.json(
      {
        success: true,
        return: {
          ...returnRequest,
          order,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get return error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get auth token
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validated = UpdateReturnSchema.parse(body);

    // Verify return exists and belongs to user
    const { data: returnRequest, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (returnError || !returnRequest) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    // Update return status
    const { data: updated, error: updateError } = await supabase
      .from('returns')
      .update({
        status: validated.status,
        notes: validated.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update return error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update return' },
        { status: 500 }
      );
    }

    // Send notification if status changed
    if (validated.status !== returnRequest.status) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/returns/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'return_status_update',
            returnId: id,
            returnNumber: returnRequest.return_number,
            status: validated.status,
            userId: user.id,
          }),
        });
      } catch (error) {
        console.error('Notification error:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Return updated successfully',
        return: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update return error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get auth token
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify return exists and belongs to user
    const { data: returnRequest, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (returnError || !returnRequest) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending returns
    if (returnRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete non-pending returns' },
        { status: 400 }
      );
    }

    // Delete return
    const { error: deleteError } = await supabase
      .from('returns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete return error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete return' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Return deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete return error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
