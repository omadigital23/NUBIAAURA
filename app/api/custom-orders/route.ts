import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CustomOrderSchema } from '@/lib/validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = CustomOrderSchema.parse(body);

    // Get optional user ID from token
    let userId = null;
    const token = request.cookies.get('sb-auth-token')?.value;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Save to database
    const { data: customOrder, error } = await supabase
      .from('custom_orders')
      .insert({
        user_id: userId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        type: validated.type,
        measurements: validated.measurements,
        preferences: validated.preferences,
        budget: validated.budget,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send WhatsApp notification to manager
    // await sendWhatsAppNotification(
    //   process.env.MANAGER_PHONE!,
    //   `Nouvelle commande sur-mesure: ${validated.name} - ${validated.type} - ${validated.budget} FCFA`
    // );

    // TODO: Send email confirmation
    // await sendEmailConfirmation(validated.email, customOrder);

    return NextResponse.json(
      {
        success: true,
        message: 'Commande personnalisée créée avec succès',
        customOrder: {
          id: customOrder.id,
          reference: customOrder.id.substring(0, 8).toUpperCase(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Custom order error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande personnalisée' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's custom orders
    const { data: customOrders, error } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ customOrders }, { status: 200 });
  } catch (error: any) {
    console.error('Get custom orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
