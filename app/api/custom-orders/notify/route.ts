import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendCustomOrderConfirmationEmail, notifyManagerEmail } from '@/lib/sendgrid';

// Validation schema
const CustomOrderNotificationSchema = z.object({
  customOrderId: z.string().min(1, 'Custom order ID required'),
  customerName: z.string().min(2, 'Customer name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Invalid phone number'),
  description: z.string().min(10, 'Description required'),
  reference: z.string().min(1, 'Reference required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CustomOrderNotificationSchema.parse(body);

    // Send WhatsApp confirmation to customer (CallMeBot)
    try {
      const customerMessage = `Bonjour ${validatedData.customerName}! 👋\n\nVotre demande de commande personnalisée a été reçue.\n\nRéférence: ${validatedData.reference}\n\nNotre équipe vous contactera bientôt pour discuter des détails.\n\nNubia Aura`;
      await sendWhatsAppMessage(validatedData.phone, customerMessage);
      console.log(`WhatsApp confirmation sent for custom order ${validatedData.reference}`);
    } catch (error: any) {
      console.error('WhatsApp notification failed:', error.message);
    }

    // Send email confirmation to customer
    try {
      await sendCustomOrderConfirmationEmail(validatedData.email, {
        customerName: validatedData.customerName,
        reference: validatedData.reference,
        description: validatedData.description,
        estimatedDelivery: '2-4 semaines',
      });
      console.log(`Email confirmation sent for custom order ${validatedData.reference}`);
    } catch (error: any) {
      console.error('Email notification failed:', error.message);
    }

    // Send WhatsApp alert to manager (CallMeBot)
    try {
      const managerMessage = `Nouvelle commande personnalisée! ✨\n\nRéférence: ${validatedData.reference}\nClient: ${validatedData.customerName}\nTéléphone: ${validatedData.phone}\nDescription: ${validatedData.description}`;
      const managerPhone = process.env.MANAGER_WHATSAPP || '+212701193811';
      await sendWhatsAppMessage(managerPhone, managerMessage);
      console.log(`Manager WhatsApp alert sent for custom order ${validatedData.reference}`);
    } catch (error: any) {
      console.error('Manager WhatsApp notification failed:', error.message);
    }

    // Send email alert to manager
    try {
      await notifyManagerEmail(
        'Nouvelle Commande Personnalisée',
        'Une nouvelle demande de commande personnalisée a été reçue.',
        {
          'Référence': validatedData.reference,
          'Client': validatedData.customerName,
          'Email': validatedData.email,
          'Téléphone': validatedData.phone,
          'Description': validatedData.description,
        }
      );
      console.log(`Manager email alert sent for custom order ${validatedData.reference}`);
    } catch (error: any) {
      console.error('Manager email notification failed:', error.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Notifications sent successfully',
        reference: validatedData.reference,
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
