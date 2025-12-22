import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendWhatsAppMessage } from '@/lib/whatsapp-notifications';
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from '@/lib/smtp-email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema
const OrderStatusNotificationSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  status: z.enum(['shipped', 'delivered'], {
    errorMap: () => ({ message: 'Status must be "shipped" or "delivered"' }),
  }),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = OrderStatusNotificationSchema.parse(body);

    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', validatedData.orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    if (validatedData.status === 'shipped') {
      // Send WhatsApp notification to customer (CallMeBot)
      try {
        let whatsappMessage = `Votre commande ${order.id} a été expédiée! 📦\n\n`;
        if (validatedData.trackingNumber) {
          whatsappMessage += `Numéro de suivi: ${validatedData.trackingNumber}\n`;
        }
        whatsappMessage += `Vous pouvez suivre votre colis sur notre site.\n\nNubia Aura`;
        await sendWhatsAppMessage(order.phone, whatsappMessage);
        console.log(`WhatsApp shipment notification sent for order ${order.id}`);
      } catch (error: any) {
        console.error('WhatsApp notification failed:', error.message);
      }

      // Send email notification to customer
      try {
        await sendOrderShippedEmail(order.email, {
          orderId: order.id,
          customerName: order.customer_name,
          trackingNumber: validatedData.trackingNumber,
          carrier: validatedData.carrier,
          estimatedDelivery: '3-5 jours ouvrables',
        });
        console.log(`Email shipment notification sent for order ${order.id}`);
      } catch (error: any) {
        console.error('Email notification failed:', error.message);
      }
    } else if (validatedData.status === 'delivered') {
      // Send WhatsApp notification to customer (CallMeBot)
      try {
        const whatsappMessage = `Votre commande ${order.id} a été livrée! ✅\n\nMerci d'avoir choisi Nubia Aura.\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nNubia Aura`;
        await sendWhatsAppMessage(order.phone, whatsappMessage);
        console.log(`WhatsApp delivery notification sent for order ${order.id}`);
      } catch (error: any) {
        console.error('WhatsApp notification failed:', error.message);
      }

      // Send email notification to customer
      try {
        await sendOrderDeliveredEmail(order.email, {
          orderId: order.id,
          customerName: order.customer_name,
        });
        console.log(`Email delivery notification sent for order ${order.id}`);
      } catch (error: any) {
        console.error('Email notification failed:', error.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `${validatedData.status === 'shipped' ? 'Shipment' : 'Delivery'} notifications sent successfully`,
        orderId: validatedData.orderId,
        status: validatedData.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Notification error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi des notifications' },
      { status: 500 }
    );
  }
}
