/**
 * Module de notifications WhatsApp via CallMeBot
 * Gratuit et simple à configurer
 */

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
 * Notifier le manager d'une nouvelle commande
 */
export async function notifyManagerNewOrder(data: {
  orderId: string;
  customerName: string;
  total: number;
  itemCount: number;
}) {
  if (!MANAGER_WHATSAPP) {
    console.warn('⚠️ Manager WhatsApp not configured');
    return false;
  }

  // Créer les liens de validation/annulation (format court)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nubiaaura.com';

  const message = `🛍️ *Nouvelle commande*\n\n` +
    `🔖 *N°:* ${data.orderId}\n` +
    `👤 *Client:* ${data.customerName}\n` +
    `📦 *Articles:* ${data.itemCount}\n` +
    `💰 *Total:* ${data.total.toLocaleString('fr-FR')} FCFA\n\n` +
    `*Actions:*\n` +
    `Valider: ${baseUrl}/api/admin/orders/validate?id=${data.orderId}&action=confirm\n` +
    `Annuler: ${baseUrl}/api/admin/orders/validate?id=${data.orderId}&action=cancel\n\n` +
    `Préparez la commande rapidement !`;

  console.log('[WhatsApp] Sending notification with validation links');
  console.log('[WhatsApp] Message length:', message.length);

  return sendWhatsAppNotification({
    phone: MANAGER_WHATSAPP,
    message,
  });
}
