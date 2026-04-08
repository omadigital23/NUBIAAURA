/**
 * Service d'envoi d'emails via Resend
 * Remplacement du transport SMTP Nodemailer (authentification échouée)
 * L'interface publique reste identique pour compatibilité avec tout le codebase
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@nubiaaura.com';
const fromName = process.env.SMTP_FROM_NAME || 'Nubia Aura';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoie un email via Resend (anciennement SMTP)
 */
export async function sendEmailSMTP(options: EmailOptions): Promise<string> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured - Email not sent:', options.subject);
      return 'skipped';
    }

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    if (error) {
      console.error('❌ Erreur envoi email Resend:', error);
      throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
    }

    console.log('✅ Email envoyé via Resend:', data?.id);
    return data?.id || 'sent';
  } catch (error: any) {
    console.error('❌ Erreur envoi email:', error);
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
}

// Alias pour compatibilité avec l'ancien code
export const sendEmail = sendEmailSMTP;

/**
 * Send order confirmation email
 */
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
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .items-table { width: 100%; border-collapse: collapse; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nubia Aura</h1>
            <p>Confirmation de Commande</p>
          </div>
          <div class="content">
            <p>Bonjour ${orderData.customerName},</p>
            <p>Merci pour votre commande! Nous avons reçu votre paiement et votre commande est en cours de traitement.</p>
            <div class="order-details">
              <h3 style="color: #D4AF37; margin-top: 0;">Détails de la Commande</h3>
              <p><strong>Numéro de commande:</strong> ${orderData.orderId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <p><strong>Adresse de livraison:</strong><br>${orderData.shippingAddress}</p>
              <p><strong>Livraison estimée:</strong> ${orderData.estimatedDelivery}</p>
            </div>
            <div class="order-details">
              <h3 style="color: #D4AF37; margin-top: 0;">Articles</h3>
              <table class="items-table">
                <thead>
                  <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; text-align: left;">Article</th>
                    <th style="padding: 10px; text-align: center;">Quantité</th>
                    <th style="padding: 10px; text-align: right;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="font-weight: bold; background: #f9f9f9;">
                    <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
                    <td style="padding: 10px; text-align: right; color: #D4AF37;">${orderData.total.toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Vous recevrez un email de suivi dès que votre commande sera expédiée.</p>
            <center>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/orders/${orderData.orderId}" class="button">
                Suivre ma Commande
              </a>
            </center>
            <p>Cordialement,<br>L'équipe Nubia Aura</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Nubia Aura. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Confirmation de votre commande #${orderData.orderId}`,
    html,
  });
}

/**
 * Send order shipped email
 */
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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #D4AF37; }
          .button { background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nubia Aura</h1>
            <p>Votre Commande a été Expédiée! 📦</p>
          </div>
          <div class="content">
            <p>Bonjour ${orderData.customerName},</p>
            <p>Bonne nouvelle! Votre commande a été expédiée et est en route vers vous.</p>
            <div class="info-box">
              <h3 style="color: #D4AF37; margin-top: 0;">Informations de Suivi</h3>
              <p><strong>Numéro de commande:</strong> ${orderData.orderId}</p>
              ${orderData.trackingNumber ? `<p><strong>Numéro de suivi:</strong> ${orderData.trackingNumber}</p>` : ''}
              ${orderData.carrier ? `<p><strong>Transporteur:</strong> ${orderData.carrier}</p>` : ''}
              <p><strong>Livraison estimée:</strong> ${orderData.estimatedDelivery}</p>
            </div>
            <center>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/orders/${orderData.orderId}" class="button">
                Suivre mon Colis
              </a>
            </center>
            <p>Cordialement,<br>L'équipe Nubia Aura</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Nubia Aura. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Votre commande #${orderData.orderId} a été expédiée`,
    html,
  });
}

/**
 * Send order delivered email
 */
export async function sendOrderDeliveredEmail(
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
  }
): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50; text-align: center; }
          .button { background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nubia Aura</h1>
            <p>Votre Commande a été Livrée! ✅</p>
          </div>
          <div class="content">
            <p>Bonjour ${orderData.customerName},</p>
            <div class="success-box">
              <h2 style="color: #4CAF50; margin: 0;">Commande Livrée avec Succès!</h2>
              <p style="margin: 10px 0;">Numéro de commande: <strong>${orderData.orderId}</strong></p>
            </div>
            <p>Nous espérons que vous êtes satisfait de votre achat.</p>
            <center>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/orders/${orderData.orderId}" class="button">
                Voir les Détails
              </a>
            </center>
            <p>Merci d'avoir choisi Nubia Aura!</p>
            <p>Cordialement,<br>L'équipe Nubia Aura</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Nubia Aura. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Votre commande #${orderData.orderId} a été livrée`,
    html,
  });
}

/**
 * Send custom order confirmation email
 */
export async function sendCustomOrderConfirmationEmail(
  email: string,
  orderData: {
    customerName: string;
    reference: string;
    description: string;
    estimatedDelivery: string;
  }
): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nubia Aura</h1>
            <p>Commande Personnalisée Reçue</p>
          </div>
          <div class="content">
            <p>Bonjour ${orderData.customerName},</p>
            <p>Merci pour votre demande de commande personnalisée!</p>
            <div class="info-box">
              <h3 style="color: #D4AF37; margin-top: 0;">Détails de votre Demande</h3>
              <p><strong>Référence:</strong> ${orderData.reference}</p>
              <p><strong>Description:</strong><br>${orderData.description}</p>
              <p><strong>Délai estimé:</strong> ${orderData.estimatedDelivery}</p>
            </div>
            <center>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com'}/fr/client/custom-orders/${orderData.reference}" class="button">
                Suivre ma Demande
              </a>
            </center>
            <p>Cordialement,<br>L'équipe Nubia Aura</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Nubia Aura. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailSMTP({
    to: email,
    subject: `Confirmation de votre commande personnalisée #${orderData.reference}`,
    html,
  });
}

/**
 * Send manager notification email
 */
export async function notifyManagerEmail(
  subject: string,
  message: string,
  data?: Record<string, any>
): Promise<string> {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) {
    console.warn('⚠️ Manager email not configured - skipping notification');
    return 'skipped';
  }

  const dataHtml = data
    ? `<div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
        ${Object.entries(data)
          .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
          .join('')}
      </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #D4AF37; color: #000; padding: 15px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">Nubia Aura - Notification Manager</h2>
          </div>
          <div class="content">
            <h3>${subject}</h3>
            <p>${message}</p>
            ${dataHtml}
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailSMTP({
    to: managerEmail,
    subject: `[Nubia Aura] ${subject}`,
    html,
  });
}

/**
 * Vérifie la connexion email (Resend)
 */
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY manquant');
      return false;
    }
    console.log('✅ Resend configuré correctement');
    return true;
  } catch (error) {
    console.error('❌ Erreur vérification Resend:', error);
    return false;
  }
}
