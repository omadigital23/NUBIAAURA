import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const FALLBACK_FROM_EMAIL = 'noreply@nubiaaura.com';
const FALLBACK_FROM_NAME = 'Nubia Aura';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let resendClient: Resend | null = null;
let smtpTransporter: nodemailer.Transporter | null = null;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getFromEmail(): string {
  return (
    process.env.SMTP_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_USER ||
    FALLBACK_FROM_EMAIL
  );
}

function getFromName(): string {
  return process.env.SMTP_FROM_NAME || FALLBACK_FROM_NAME;
}

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

function getSmtpTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || '', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !Number.isFinite(port) || !user || !pass) {
    return null;
  }

  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  return smtpTransporter;
}

async function sendViaSmtp(options: EmailOptions): Promise<string | null> {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    return null;
  }

  const info = await transporter.sendMail({
    from: `${getFromName()} <${getFromEmail()}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html),
  });

  console.log('[Email] Sent via SMTP:', info.messageId);
  return info.messageId;
}

async function sendViaResend(options: EmailOptions): Promise<string | null> {
  const resend = getResendClient();
  if (!resend) {
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: `${getFromName()} <${getFromEmail()}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log('[Email] Sent via Resend:', data?.id);
  return data?.id || 'sent';
}

function renderEmailLayout({
  title,
  subtitle,
  intro,
  body,
  ctaLabel,
  ctaUrl,
}: {
  title: string;
  subtitle: string;
  intro?: string;
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
            ${intro ? `<p>${intro}</p>` : ''}
            <div class="box">
              <h2 style="margin-top: 0; color: #D4AF37;">${title}</h2>
              ${body}
            </div>
            ${ctaLabel && ctaUrl ? `<p style="text-align:center;"><a class="button" href="${ctaUrl}">${ctaLabel}</a></p>` : ''}
            <p>Merci,<br>L'equipe Nubia Aura</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Nubia Aura. Tous droits reserves.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmailSMTP(options: EmailOptions): Promise<string> {
  let lastError: Error | null = null;

  try {
    const smtpResult = await sendViaSmtp(options);
    if (smtpResult) {
      return smtpResult;
    }
  } catch (error: any) {
    lastError = error instanceof Error ? error : new Error(String(error));
    console.error('[Email] SMTP send failed, trying fallback if available:', lastError.message);
  }

  try {
    const resendResult = await sendViaResend(options);
    if (resendResult) {
      return resendResult;
    }
  } catch (error: any) {
    lastError = error instanceof Error ? error : new Error(String(error));
    console.error('[Email] Resend send failed:', lastError.message);
  }

  if (!getSmtpTransporter() && !getResendClient()) {
    console.warn('[Email] No SMTP or Resend configuration found. Email skipped:', options.subject);
    return 'skipped';
  }

  throw new Error(`Erreur lors de l'envoi de l'email: ${lastError?.message || 'unknown provider error'}`);
}

export const sendEmail = sendEmailSMTP;

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
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      `
    )
    .join('');

  const body = `
    <p>Bonjour ${orderData.customerName},</p>
    <p>Merci pour votre commande. Nous avons bien recu votre paiement.</p>
    <p><strong>Numero de commande:</strong> ${orderData.orderId}</p>
    <p><strong>Adresse de livraison:</strong><br>${orderData.shippingAddress}</p>
    <p><strong>Livraison estimee:</strong> ${orderData.estimatedDelivery}</p>
    <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="padding: 10px; text-align: left;">Article</th>
          <th style="padding: 10px; text-align: center;">Quantite</th>
          <th style="padding: 10px; text-align: right;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="font-weight: bold; background: #f9f9f9;">
          <td colspan="2" style="padding: 10px; text-align: right;">Total</td>
          <td style="padding: 10px; text-align: right; color: #D4AF37;">${orderData.total.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      </tbody>
    </table>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Confirmation de votre commande #${orderData.orderId}`,
    html: renderEmailLayout({
      title: 'Confirmation de commande',
      subtitle: 'Commande confirmee',
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
    <p>Votre commande a ete expediee.</p>
    <p><strong>Numero de commande:</strong> ${orderData.orderId}</p>
    ${orderData.trackingNumber ? `<p><strong>Numero de suivi:</strong> ${orderData.trackingNumber}</p>` : ''}
    ${orderData.carrier ? `<p><strong>Transporteur:</strong> ${orderData.carrier}</p>` : ''}
    <p><strong>Livraison estimee:</strong> ${orderData.estimatedDelivery}</p>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Votre commande #${orderData.orderId} a ete expediee`,
    html: renderEmailLayout({
      title: 'Commande expediee',
      subtitle: 'Votre colis est en route',
      body,
      ctaLabel: 'Suivre mon colis',
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/orders/${orderData.orderId}`,
    }),
  });
}

export async function sendOrderDeliveredEmail(
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
  }
): Promise<string> {
  const body = `
    <p>Bonjour ${orderData.customerName},</p>
    <p>Votre commande a ete livree avec succes.</p>
    <p><strong>Numero de commande:</strong> ${orderData.orderId}</p>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Votre commande #${orderData.orderId} a ete livree`,
    html: renderEmailLayout({
      title: 'Commande livree',
      subtitle: 'Livraison confirmee',
      body,
      ctaLabel: 'Voir les details',
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
    <p>Merci pour votre demande de commande personnalisee.</p>
    <p><strong>Reference:</strong> ${orderData.reference}</p>
    <p><strong>Description:</strong><br>${orderData.description}</p>
    <p><strong>Delai estime:</strong> ${orderData.estimatedDelivery}</p>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Confirmation de votre commande personnalisee #${orderData.reference}`,
    html: renderEmailLayout({
      title: 'Commande personnalisee recue',
      subtitle: 'Demande bien enregistree',
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
    console.warn('[Email] MANAGER_EMAIL not configured - notification skipped');
    return 'skipped';
  }

  const dataHtml = data
    ? Object.entries(data)
        .map(([key, value]) => `<p><strong>${key}:</strong> ${String(value)}</p>`)
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
  try {
    const transporter = getSmtpTransporter();
    if (transporter) {
      await transporter.verify();
      console.log('[Email] SMTP configured correctly');
      return true;
    }

    if (getResendClient()) {
      console.log('[Email] Resend configured correctly');
      return true;
    }

    console.error('[Email] No SMTP or Resend configuration found');
    return false;
  } catch (error) {
    console.error('[Email] Verification failed:', error);
    return false;
  }
}
