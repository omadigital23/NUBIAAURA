/**
 * Module de notifications WhatsApp via CallMeBot
 * Gratuit et simple à configurer
 */

import { generateValidationToken, storeValidationToken } from './order-validation-tokens';

const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;
const MANAGER_WHATSAPP = process.env.MANAGER_WHATSAPP;

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
export async function sendWhatsAppNotification(data: WhatsAppNotification): Promise<boolean> {
  try {
    if (!CALLMEBOT_API_KEY) {
      console.warn('⚠️ CallMeBot API key not configured - WhatsApp notification skipped');
      return false;
    }

    // Nettoyer le numéro de téléphone (enlever +, espaces, etc.)
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');

    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(data.message);

    // URL de l'API CallMeBot
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_API_KEY}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`CallMeBot API error: ${response.status}`);
    }

    console.log('✅ WhatsApp notification sent to:', data.phone);
    return true;
  } catch (error: any) {
    console.error('❌ WhatsApp notification error:', error.message);
    return false;
  }
}

/**
 * Notifier le manager d'un nouveau message de contact
 */
export async function notifyManagerNewContact(data: {
  name: string;
  email: string;
  subject: string;
}) {
  if (!MANAGER_WHATSAPP) {
    console.warn('⚠️ Manager WhatsApp not configured');
    return false;
  }

  const message = `🔔 *Nouveau message de contact*\n\n` +
    `👤 *De:* ${data.name}\n` +
    `📧 *Email:* ${data.email}\n` +
    `📝 *Sujet:* ${data.subject}\n\n` +
    `Consultez le dashboard pour plus de détails.`;

  return sendWhatsAppNotification({
    phone: MANAGER_WHATSAPP,
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
}) {
  if (!MANAGER_WHATSAPP) {
    console.warn('⚠️ Manager WhatsApp not configured');
    return false;
  }

  const message = `🎨 *Nouvelle commande sur-mesure*\n\n` +
    `👤 *Client:* ${data.name}\n` +
    `📧 *Email:* ${data.email}\n` +
    `📱 *Téléphone:* ${data.phone}\n` +
    `👗 *Type:* ${data.type}\n` +
    `📏 *Mensurations:* ${data.measurements}\n` +
    `✨ *Préférences:* ${data.preferences}\n` +
    `💰 *Budget:* ${data.budget.toLocaleString('fr-FR')} FCFA\n` +
    `🔖 *Réf:* ${data.reference}\n\n` +
    `Contactez le client rapidement !`;

  return sendWhatsAppNotification({
    phone: MANAGER_WHATSAPP,
    message,
  });
}

/**
 * Notifier le manager d'une nouvelle inscription newsletter
 */
export async function notifyManagerNewNewsletter(data: {
  email: string;
  name?: string;
}) {
  if (!MANAGER_WHATSAPP) {
    console.warn('⚠️ Manager WhatsApp not configured');
    return false;
  }

  const message = `📧 *Nouvelle inscription newsletter*\n\n` +
    `${data.name ? `👤 *Nom:* ${data.name}\n` : ''}` +
    `📧 *Email:* ${data.email}`;

  return sendWhatsAppNotification({
    phone: MANAGER_WHATSAPP,
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
  if (!MANAGER_WHATSAPP) {
    console.warn('⚠️ Manager WhatsApp not configured');
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

  return sendWhatsAppNotification({
    phone: MANAGER_WHATSAPP,
    message,
  });
}
