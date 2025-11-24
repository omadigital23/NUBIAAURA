import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CustomOrderSchema } from '@/lib/validation';
import { sendEmail } from '@/lib/sendgrid';
import { getCustomOrderConfirmationEmail, getCustomOrderManagerNotification } from '@/lib/email-templates';
import { notifyManagerNewCustomOrder } from '@/lib/whatsapp-notifications';
import { generateValidationToken, storeValidationToken } from '@/lib/order-validation-tokens';
import { calculateDeliveryDuration } from '@/lib/delivery-calculator';

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

    // Calculer delivery_duration_days basé sur le pays (commandes sur-mesure: 10-20 jours)
    // Le pays peut être fourni dans validated.country ou par défaut 'Senegal'
    const country = (validated as any).country || 'Senegal';
    const deliveryDurationDays = calculateDeliveryDuration(country, true); // true = custom order
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + deliveryDurationDays);

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
        country: country, // Stocker le pays pour les calculs de retour
        delivery_duration_days: deliveryDurationDays,
        estimated_delivery_date: estimatedDeliveryDate.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const reference = customOrder.id.substring(0, 8).toUpperCase();

    // Générer et stocker le token de validation sécurisé
    const validationToken = generateValidationToken(customOrder.id);
    await storeValidationToken(customOrder.id, validationToken);
    console.log(`[CustomOrder] Generated validation token for custom order ${customOrder.id}`);

    // Envoyer email de confirmation au client
    try {
      const confirmationEmail = getCustomOrderConfirmationEmail({
        ...validated,
        reference,
      });
      await sendEmail({
        to: validated.email,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
      });
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError);
    }

    // Envoyer notification au manager (Email)
    try {
      const managerEmail = process.env.MANAGER_EMAIL || 'contact@nubiaaura.com';
      const managerNotification = getCustomOrderManagerNotification({
        ...validated,
        reference,
      });
      await sendEmail({
        to: managerEmail,
        subject: managerNotification.subject,
        html: managerNotification.html,
      });
    } catch (emailError) {
      console.error('Erreur envoi email manager:', emailError);
    }

    // Envoyer notification au manager (WhatsApp)
    try {
      await notifyManagerNewCustomOrder({
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        type: validated.type,
        measurements: validated.measurements,
        preferences: validated.preferences,
        budget: validated.budget,
        reference,
        customOrderId: customOrder.id,
        validationToken: validationToken,
      });
    } catch (whatsappError) {
      console.error('Erreur notification WhatsApp:', whatsappError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Commande personnalisée créée avec succès',
        customOrder: {
          id: customOrder.id,
          reference,
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
