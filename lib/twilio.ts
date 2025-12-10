const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured');
}

/**
 * Send WhatsApp message via Twilio API
 */
export async function sendWhatsAppMessage(
  toPhoneNumber: string,
  message: string
): Promise<string> {
  try {
    if (!twilioWhatsAppNumber) {
      throw new Error('Twilio WhatsApp number not configured');
    }

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${twilioWhatsAppNumber}`,
        To: `whatsapp:${toPhoneNumber}`,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send WhatsApp message');
    }

    const data = await response.json() as any;
    return data.sid;
  } catch (error: any) {
    console.error('WhatsApp error:', error);
    throw new Error(`Erreur lors de l'envoi du message WhatsApp: ${error.message}`);
  }
}

/**
 * Send SMS via Twilio API
 */
export async function sendSMS(
  toPhoneNumber: string,
  message: string
): Promise<string> {
  try {
    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured');
    }

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: toPhoneNumber,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send SMS');
    }

    const data = await response.json() as any;
    return data.sid;
  } catch (error: any) {
    console.error('SMS error:', error);
    throw new Error(`Erreur lors de l'envoi du SMS: ${error.message}`);
  }
}

/**
 * Send order confirmation via WhatsApp
 */
export async function sendOrderConfirmation(
  phoneNumber: string,
  orderNumber: string,
  total: number
): Promise<string> {
  const message = `Merci pour votre commande! 🎉\n\nNuméro de commande: ${orderNumber}\nMontant: ${total.toLocaleString('fr-FR')} FCFA\n\nVous recevrez bientôt des mises à jour sur votre livraison.\n\nNubia Aura`;

  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send order shipped notification
 */
export async function sendOrderShipped(
  phoneNumber: string,
  orderNumber: string,
  trackingNumber?: string
): Promise<string> {
  let message = `Votre commande ${orderNumber} a été expédiée! 📦\n\n`;
  if (trackingNumber) {
    message += `Numéro de suivi: ${trackingNumber}\n`;
  }
  message += `Vous pouvez suivre votre colis sur notre site.\n\nNubia Aura`;

  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send order delivered notification
 */
export async function sendOrderDelivered(
  phoneNumber: string,
  orderNumber: string
): Promise<string> {
  const message = `Votre commande ${orderNumber} a été livrée! ✅\n\nMerci d'avoir choisi Nubia Aura.\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nNubia Aura`;

  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send custom order confirmation
 */
export async function sendCustomOrderConfirmation(
  phoneNumber: string,
  customerName: string,
  reference: string
): Promise<string> {
  const message = `Bonjour ${customerName}! 👋\n\nVotre demande de commande personnalisée a été reçue.\n\nRéférence: ${reference}\n\nNotre équipe vous contactera bientôt pour discuter des détails.\n\nNubia Aura`;

  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send manager notification
 */
export async function notifyManager(
  message: string
): Promise<string> {
  const managerPhone = process.env.MANAGER_PHONE;
  if (!managerPhone) {
    throw new Error('Manager phone not configured');
  }

  return sendWhatsAppMessage(managerPhone, message);
}
