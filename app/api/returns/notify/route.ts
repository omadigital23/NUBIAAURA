import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendWhatsAppMessage } from '@/lib/whatsapp-notifications';
import { sendEmail } from '@/lib/smtp-email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema
const NotifyReturnSchema = z.object({
  type: z.enum(['return_request', 'return_status_update']),
  returnId: z.string(),
  returnNumber: z.string(),
  orderId: z.string().optional(),
  userId: z.string(),
  status: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = NotifyReturnSchema.parse(body);

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', validated.userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Optionally fetch return details if needed in the future

    if (validated.type === 'return_request') {
      // Send customer notification
      const customerMessage = `Bonjour ${user.name || 'Client'},\n\nVotre demande de retour a été reçue avec succès.\n\nNuméro de retour: ${validated.returnNumber}\nRaison: ${validated.reason}\n\nNous traiterons votre demande dans les 24 heures.\n\nCordialement,\nNubia Aura`;

      try {
        await sendWhatsAppMessage(
          user.phone,
          customerMessage
        );
      } catch (error) {
        console.error('WhatsApp notification error:', error);
      }

      try {
        await sendEmail({
          to: user.email,
          subject: `Demande de retour reçue - ${validated.returnNumber}`,
          html: `
            <h2>Demande de retour reçue</h2>
            <p>Bonjour ${user.name || 'Client'},</p>
            <p>Votre demande de retour a été reçue avec succès.</p>
            <p><strong>Numéro de retour:</strong> ${validated.returnNumber}</p>
            <p><strong>Raison:</strong> ${validated.reason}</p>
            <p>Nous traiterons votre demande dans les 24 heures.</p>
            <p>Cordialement,<br/>Nubia Aura</p>
          `,
        });
      } catch (error) {
        console.error('Email notification error:', error);
      }

      // Send manager notification
      const managerMessage = `Nouvelle demande de retour!\n\nNuméro: ${validated.returnNumber}\nClient: ${user.name || user.email}\nRaison: ${validated.reason}\n\nVeuillez vérifier et approuver.`;

      try {
        const managerPhone = process.env.MANAGER_WHATSAPP;
        if (!managerPhone) {
          console.error('MANAGER_WHATSAPP is not configured');
        } else {
          await sendWhatsAppMessage(
            managerPhone,
            managerMessage
          );
        }
      } catch (error) {
        console.error('Manager WhatsApp error:', error);
      }

      try {
        await sendEmail({
          to: process.env.MANAGER_EMAIL!,
          subject: `Nouvelle demande de retour - ${validated.returnNumber}`,
          html: `
            <h2>Nouvelle demande de retour</h2>
            <p><strong>Numéro:</strong> ${validated.returnNumber}</p>
            <p><strong>Client:</strong> ${user.name || user.email}</p>
            <p><strong>Raison:</strong> ${validated.reason}</p>
            <p>Veuillez vérifier et approuver.</p>
          `,
        });
      } catch (error) {
        console.error('Manager email error:', error);
      }
    } else if (validated.type === 'return_status_update') {
      // Send status update notification
      const statusMessages: Record<string, string> = {
        approved: 'Votre demande de retour a été approuvée. Veuillez préparer le colis.',
        rejected: 'Votre demande de retour a été rejetée. Veuillez nous contacter pour plus d\'informations.',
        shipped: 'Votre colis de retour a été expédié. Numéro de suivi: ',
        received: 'Nous avons reçu votre colis de retour. Nous traiterons votre remboursement dans 5-7 jours.',
        refunded: 'Votre remboursement a été traité avec succès.',
      };

      const message = statusMessages[validated.status || 'pending'] || 'Statut de votre retour mis à jour.';

      try {
        await sendWhatsAppMessage(
          user.phone,
          `Bonjour ${user.name || 'Client'},\n\n${message}\n\nNuméro de retour: ${validated.returnNumber}\n\nCordialement,\nNubia Aura`
        );
      } catch (error) {
        console.error('WhatsApp status update error:', error);
      }

      try {
        await sendEmail({
          to: user.email,
          subject: `Mise à jour du retour - ${validated.returnNumber}`,
          html: `
            <h2>Mise à jour du statut de retour</h2>
            <p>Bonjour ${user.name || 'Client'},</p>
            <p>${message}</p>
            <p><strong>Numéro de retour:</strong> ${validated.returnNumber}</p>
            <p>Cordialement,<br/>Nubia Aura</p>
          `,
        });
      } catch (error) {
        console.error('Email status update error:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Notifications sent successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Return notification error:', error);

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
