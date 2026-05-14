/**
 * Service d'envoi d'emails — Nubia Aura
 * Transport unique : Resend SDK (SMTP Nodemailer retiré — EAUTH 535)
 * Interface publique inchangée pour compatibilité avec tout le codebase.
 */

import { Resend } from 'resend';

const FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  'noreply@nubiaaura.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Nubia Aura';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('[Email] RESEND_API_KEY manquant — configurer sur Vercel');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function renderEmailLayout({
  title,
  subtitle,
  body,
  ctaLabel,
  ctaUrl,
}: {
  title: string;
  subtitle: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .box { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
          .button { background: #D4AF37; color: #000 !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nubia Aura</h1>
            <p>${subtitle}</p>
          </div>
          <div class="content">
            <div class="box">
              <h2 style="margin-top: 0; color: #D4AF37;">${title}</h2>
              ${body}
            </div>
            ${ctaLabel && ctaUrl ? `<p style="text-align:center;"><a class="button" href="${ctaUrl}">${ctaLabel}</a></p>` : ''}
            <p>Merci,<br>L'équipe Nubia Aura</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Nubia Aura. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ─── Transport principal ────────────────────────────────────────────────────

export async function sendEmailSMTP(options: EmailOptions): Promise<string> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log('[Email] ✅ Envoyé via Resend:', data?.id);
    return data?.id || 'sent';
  } catch (error: any) {
    console.error('[Email] ❌ Échec envoi:', error.message);
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
}

// Alias pour compatibilité
export const sendEmail = sendEmailSMTP;

// ─── Emails transactionnels ─────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    shippingAddress: string;
    estimatedDelivery: string;
  }
): Promise<string> {
  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
      </tr>`
    )
    .join('');

  const body = `
    <p>Bonjour ${orderData.customerName},</p>
    <p>Merci pour votre commande. Nous avons bien reçu votre paiement.</p>
    <p><strong>Numéro de commande :</strong> ${orderData.orderId}</p>
    <p><strong>Adresse de livraison :</strong><br>${orderData.shippingAddress}</p>
    <p><strong>Livraison estimée :</strong> ${orderData.estimatedDelivery}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="padding:10px;text-align:left;">Article</th>
          <th style="padding:10px;text-align:center;">Qté</th>
          <th style="padding:10px;text-align:right;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="font-weight:bold;background:#f9f9f9;">
          <td colspan="2" style="padding:10px;text-align:right;">Total</td>
          <td style="padding:10px;text-align:right;color:#D4AF37;">${orderData.total.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      </tbody>
    </table>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Confirmation de votre commande #${orderData.orderId}`,
    html: renderEmailLayout({
      title: 'Confirmation de commande',
      subtitle: 'Commande confirmée',
      body,
      ctaLabel: 'Suivre ma commande',
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/orders/${orderData.orderId}`,
    }),
  });
}

export async function sendOrderShippedEmail(
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery: string;
  }
): Promise<string> {
  const body = `
    <p>Bonjour ${orderData.customerName},</p>
    <p>Votre commande a été expédiée.</p>
    <p><strong>Numéro de commande :</strong> ${orderData.orderId}</p>
    ${orderData.trackingNumber ? `<p><strong>Numéro de suivi :</strong> ${orderData.trackingNumber}</p>` : ''}
    ${orderData.carrier ? `<p><strong>Transporteur :</strong> ${orderData.carrier}</p>` : ''}
    <p><strong>Livraison estimée :</strong> ${orderData.estimatedDelivery}</p>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Votre commande #${orderData.orderId} a été expédiée`,
    html: renderEmailLayout({
      title: 'Commande expédiée',
      subtitle: 'Votre colis est en route',
      body,
      ctaLabel: 'Suivre mon colis',
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/orders/${orderData.orderId}`,
    }),
  });
}

export async function sendOrderDeliveredEmail(
  email: string,
  orderData: { orderId: string; customerName: string }
): Promise<string> {
  const body = `
    <p>Bonjour ${orderData.customerName},</p>
    <p>Votre commande a été livrée avec succès.</p>
    <p><strong>Numéro de commande :</strong> ${orderData.orderId}</p>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Votre commande #${orderData.orderId} a été livrée`,
    html: renderEmailLayout({
      title: 'Commande livrée',
      subtitle: 'Livraison confirmée',
      body,
      ctaLabel: 'Voir les détails',
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/orders/${orderData.orderId}`,
    }),
  });
}

export async function sendCustomOrderConfirmationEmail(
  email: string,
  orderData: {
    customerName: string;
    reference: string;
    description: string;
    estimatedDelivery: string;
  }
): Promise<string> {
  const body = `
    <p>Bonjour ${orderData.customerName},</p>
    <p>Merci pour votre demande de commande personnalisée.</p>
    <p><strong>Référence :</strong> ${orderData.reference}</p>
    <p><strong>Description :</strong><br>${orderData.description}</p>
    <p><strong>Délai estimé :</strong> ${orderData.estimatedDelivery}</p>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Confirmation de votre commande personnalisée #${orderData.reference}`,
    html: renderEmailLayout({
      title: 'Commande personnalisée reçue',
      subtitle: 'Demande bien enregistrée',
      body,
      ctaLabel: 'Suivre ma demande',
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/custom-orders/${orderData.reference}`,
    }),
  });
}

export async function notifyManagerEmail(
  subject: string,
  message: string,
  data?: Record<string, unknown>
): Promise<string> {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) {
    console.warn('[Email] MANAGER_EMAIL non configuré — notification ignorée');
    return 'skipped';
  }

  const dataHtml = data
    ? Object.entries(data)
        .map(([key, value]) => `<p><strong>${key} :</strong> ${String(value)}</p>`)
        .join('')
    : '';

  return sendEmailSMTP({
    to: managerEmail,
    subject: `[Nubia Aura] ${subject}`,
    html: renderEmailLayout({
      title: subject,
      subtitle: 'Notification manager',
      body: `<p>${message}</p>${dataHtml}`,
    }),
  });
}

export async function verifySMTPConnection(): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] ❌ RESEND_API_KEY manquant');
    return false;
  }
  console.log('[Email] ✅ Resend configuré correctement');
  return true;
}
