/**
 * Module de notifications WhatsApp via CallMeBot
 * Gratuit et simple à configurer
 */

import { generateValidationToken, storeValidationToken } from './order-validation-tokens';

interface WhatsAppNotification {
  phone: string;
  message: string;
}

/**
 * Envoyer une notification WhatsApp via CallMeBot
 * 
 * Configuration requise:
 * 1. Ajouter +34 644 28 04 85 sur WhatsApp
 * 2. Envoyer: "I allow callmebot to send me messages"
 * 3. Copier l'API key reçue dans .env.local
 */
async function sendWhatsAppNotification(data: WhatsAppNotification): Promise<boolean> {
  try {
    // Read env vars at runtime (important for serverless environments)
    const apiKey = process.env.CALLMEBOT_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ CallMeBot API key not configured - WhatsApp notification skipped');
      return false;
    }

    // Nettoyer le numéro de téléphone (enlever +, espaces, etc.)
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');

    // Préparer le message pour CallMeBot:
    // 1. Remplacer les \n littéraux par de vrais sauts de ligne puis encoder
    // 2. Limiter la longueur (CallMeBot a une limite ~1500 chars)
    let message = data.message
      .replace(/\\n/g, '\n')  // Convert literal \n to actual newlines
      .substring(0, 1500);    // Limit length

    // Encoder le message pour l'URL
    // CallMeBot requires %0A for newlines, not %0D%0A
    const encodedMessage = encodeURIComponent(message)
      .replace(/%0D%0A/g, '%0A')  // Replace CRLF with LF
      .replace(/%0D/g, '%0A');    // Replace CR with LF

    // URL de l'API CallMeBot
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;

    console.log(`[CallMeBot] Sending notification to: ${cleanPhone}`);
    console.log(`[CallMeBot] API Key: ${apiKey.substring(0, 3)}***`);
    console.log(`[CallMeBot] Message length: ${message.length}`);

    const response = await fetch(url, {
      method: 'GET',
    });

    const responseText = await response.text();
    console.log(`[CallMeBot] Response status: ${response.status}`);
    console.log(`[CallMeBot] Response body: ${responseText.substring(0, 200)}`);

    // CallMeBot returns HTML, check for success indicators
    if (responseText.includes('Message queued') || responseText.includes('Message Sent') || response.ok) {
      console.log('✅ WhatsApp notification sent to:', data.phone);
      return true;
    } else {
      throw new Error(`CallMeBot API error: ${response.status} - ${responseText.substring(0, 100)}`);
    }
  } catch (error: any) {
    console.error('❌ WhatsApp notification error:', error.message);
    return false;
  }
}

/**
 * Envoyer un message WhatsApp simple (fonction publique pour compatibilité)
 * Utilisée pour les notifications client et autres messages simples
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  return sendWhatsAppNotification({ phone, message });
}

/**
 * Notifier le manager d'un nouveau message de contact
 */
export async function notifyManagerNewContact(data: {
  name: string;
  email: string;
  subject: string;
}) {
  const managerPhone = process.env.MANAGER_WHATSAPP;

  if (!managerPhone) {
    console.warn('⚠️ Manager WhatsApp not configured (MANAGER_WHATSAPP)');
    return false;
  }

  const message = `🔔 *Nouveau message de contact*\n\n` +
    `👤 *De:* ${data.name}\n` +
    `📧 *Email:* ${data.email}\n` +
    `📝 *Sujet:* ${data.subject}\n\n` +
    `Consultez le dashboard pour plus de détails.`;

  return sendWhatsAppNotification({
    phone: managerPhone,
    message,
  });
}

/**
 * Notifier le manager d'une nouvelle commande sur-mesure
 */
export async function notifyManagerNewCustomOrder(data: {
  name: string;
  email: string;
  phone: string;
  type: string;
  measurements: string;
  preferences: string;
  budget: number;
  reference: string;
  customOrderId?: string;
  validationToken?: string;
}) {
  const managerPhone = process.env.MANAGER_WHATSAPP;

  console.log(`[CustomOrder WhatsApp] Attempting to notify manager...`);
  console.log(`[CustomOrder WhatsApp] MANAGER_WHATSAPP: ${managerPhone ? managerPhone.substring(0, 5) + '***' : 'NOT SET'}`);
  console.log(`[CustomOrder WhatsApp] CALLMEBOT_API_KEY: ${process.env.CALLMEBOT_API_KEY ? 'SET' : 'NOT SET'}`);

  if (!managerPhone) {
    console.warn('⚠️ Manager WhatsApp not configured (MANAGER_WHATSAPP)');
    return false;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nubiaaura.com';

  let message = `🎨 *Nouvelle commande sur-mesure*\n\n` +
    `👤 *Client:* ${data.name}\n` +
    `📧 *Email:* ${data.email}\n` +
    `📱 *Téléphone:* ${data.phone}\n` +
    `👗 *Type:* ${data.type}\n` +
    `📏 *Mensurations:* ${data.measurements}\n` +
    `✨ *Préférences:* ${data.preferences}\n` +
    `💰 *Budget:* ${data.budget.toLocaleString('fr-FR')} FCFA\n` +
    `🔖 *Réf:* ${data.reference}\n\n`;

  // Ajouter les liens de validation si disponibles
  if (data.customOrderId && data.validationToken) {
    message += `*⚡ ACTIONS:*\n`;
    message += `✅ Approuver: ${baseUrl}/api/admin/custom-orders/validate?id=${data.customOrderId}&token=${data.validationToken}&action=confirm\n`;
    message += `❌ Annuler: ${baseUrl}/api/admin/custom-orders/validate?id=${data.customOrderId}&token=${data.validationToken}&action=cancel`;
  } else {
    message += `Contactez le client rapidement !`;
  }

  console.log(`[CustomOrder WhatsApp] Message prepared, sending to: ${managerPhone}`);

  const result = await sendWhatsAppNotification({
    phone: managerPhone,
    message,
  });

  console.log(`[CustomOrder WhatsApp] Send result: ${result ? 'SUCCESS' : 'FAILED'}`);
  return result;
}

/**
 * Notifier le manager d'une nouvelle inscription newsletter
 */
export async function notifyManagerNewNewsletter(data: {
  email: string;
  name?: string;
}) {
  const managerPhone = process.env.MANAGER_WHATSAPP;

  if (!managerPhone) {
    console.warn('⚠️ Manager WhatsApp not configured (MANAGER_WHATSAPP)');
    return false;
  }

  const message = `📧 *Nouvelle inscription newsletter*\n\n` +
    `${data.name ? `👤 *Nom:* ${data.name}\n` : ''}` +
    `📧 *Email:* ${data.email}`;

  return sendWhatsAppNotification({
    phone: managerPhone,
    message,
  });
}

/**
 * Notifier le manager d'une nouvelle commande avec détails complets
 */
export async function notifyManagerNewOrder(data: {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  total: number;
  itemCount: number;
  items?: Array<{ name: string; quantity: number; price: number }>;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  paymentMethod?: string;
}) {
  const managerPhone = process.env.MANAGER_WHATSAPP;

  console.log(`[Order WhatsApp] Attempting to notify manager...`);
  console.log(`[Order WhatsApp] MANAGER_WHATSAPP: ${managerPhone ? managerPhone.substring(0, 5) + '***' : 'NOT SET'}`);
  console.log(`[Order WhatsApp] CALLMEBOT_API_KEY: ${process.env.CALLMEBOT_API_KEY ? 'SET' : 'NOT SET'}`);

  if (!managerPhone) {
    console.warn('⚠️ Manager WhatsApp not configured (MANAGER_WHATSAPP)');
    return false;
  }

  // Créer les liens de validation/annulation
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nubiaaura.com';

  // Message avec format exact demandé
  let message = `🎉 *NOUVELLE COMMANDE NUBIA AURA*\n\n`;
  message += `📋 *Commande:* ${data.orderId}\n`;
  message += `👤 *Client:* ${data.customerName}\n`;

  if (data.customerEmail) {
    message += `📧 *Email:* ${data.customerEmail}\n`;
  }
  if (data.customerPhone) {
    message += `📱 *Téléphone:* ${data.customerPhone}\n`;
  }

  message += `\n🛍️ *ARTICLES:*\n`;

  // Ajouter tous les articles
  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   Qté: ${item.quantity} × ${item.price.toLocaleString('fr-FR')} FCFA\n`;
    });
  }

  message += `\n💰 *MONTANTS:*\n`;
  if (data.subtotal !== undefined) {
    message += `Sous-total: ${data.subtotal.toLocaleString('fr-FR')} FCFA\n`;
  }
  if (data.shipping !== undefined) {
    message += `Livraison: ${data.shipping.toLocaleString('fr-FR')} FCFA\n`;
  }
  if (data.tax !== undefined) {
    message += `Taxes: ${data.tax.toLocaleString('fr-FR')} FCFA\n`;
  }
  message += `*TOTAL: ${data.total.toLocaleString('fr-FR')} FCFA*\n`;

  // Adresse complète
  if (data.address || data.city) {
    message += `\n📍 *ADRESSE DE LIVRAISON:*\n`;
    if (data.address) {
      message += `${data.address}\n`;
    }
    if (data.zipCode && data.city) {
      message += `${data.zipCode} ${data.city}\n`;
    } else if (data.city) {
      message += `${data.city}\n`;
    }
    if (data.country) {
      message += `${data.country}\n`;
    }
  }

  // Méthode de paiement
  if (data.paymentMethod) {
    const paymentLabel = data.paymentMethod === 'cod' ? 'Paiement à la livraison' : 'Paiement en ligne';
    message += `\n💳 *Paiement:* ${paymentLabel}\n`;
  }

  // Générer et stocker le token de validation sécurisé
  const token = generateValidationToken(data.orderId);
  await storeValidationToken(data.orderId, token);
  console.log(`[WhatsApp] Generated validation token for order ${data.orderId}`);

  // Liens de validation avec token sécurisé
  message += `\n*⚡ ACTIONS:*\n`;
  message += `✅ Valider: ${baseUrl}/api/admin/orders/validate?id=${data.orderId}&token=${token}&action=confirm\n`;
  message += `❌ Annuler: ${baseUrl}/api/admin/orders/validate?id=${data.orderId}&token=${token}&action=cancel`;

  console.log('[WhatsApp] Sending complete order notification with secure validation links');
  console.log('[WhatsApp] Message length:', message.length);

  const result = await sendWhatsAppNotification({
    phone: managerPhone,
    message,
  });

  console.log(`[Order WhatsApp] Send result: ${result ? 'SUCCESS' : 'FAILED'}`);
  return result;
}
