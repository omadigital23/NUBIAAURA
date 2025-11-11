/**
 * Envoi de messages WhatsApp via CallMeBot (GRATUIT)
 * Pas besoin de Twilio!
 * 
 * Configuration:
 * 1. Ajouter le numéro CallMeBot à vos contacts: +34 644 28 04 85
 * 2. Envoyer "I allow callmebot to send me messages" sur WhatsApp
 * 3. Vous recevrez votre API key
 * 4. Ajouter dans .env.local: CALLMEBOT_API_KEY=votre_clé
 */

interface OrderWhatsAppData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    zipCode?: string;
    country: string;
  };
  paymentMethod: string;
}

/**
 * Formate le message de commande pour WhatsApp
 */
function formatOrderMessage(data: OrderWhatsAppData): string {
  const lines = [
    '🎉 *NOUVELLE COMMANDE NUBIA AURA*',
    '',
    `📋 *Commande:* ${data.orderNumber}`,
    `👤 *Client:* ${data.customerName}`,
    `📧 *Email:* ${data.customerEmail}`,
    `📱 *Téléphone:* ${data.customerPhone}`,
    '',
    '🛍️ *ARTICLES:*',
  ];

  // Ajouter les articles
  data.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`   Qté: ${item.quantity} × ${item.price.toLocaleString('fr-FR')} FCFA`);
  });

  lines.push('');
  lines.push('💰 *MONTANTS:*');
  lines.push(`Sous-total: ${data.subtotal.toLocaleString('fr-FR')} FCFA`);
  lines.push(`Livraison: ${data.shipping.toLocaleString('fr-FR')} FCFA`);
  lines.push(`Taxes: ${data.tax.toLocaleString('fr-FR')} FCFA`);
  lines.push(`*TOTAL: ${data.total.toLocaleString('fr-FR')} FCFA*`);
  lines.push('');
  lines.push('📍 *ADRESSE DE LIVRAISON:*');
  lines.push(data.shippingAddress.address);
  lines.push(`${data.shippingAddress.zipCode ? data.shippingAddress.zipCode + ' ' : ''}${data.shippingAddress.city}`);
  lines.push(data.shippingAddress.country);
  lines.push('');
  lines.push(`💳 *Paiement:* ${data.paymentMethod === 'cod' ? 'Paiement à la livraison' : 'Flutterwave'}`);
  lines.push('');
  lines.push('✅ Commande enregistrée dans Supabase');

  return lines.join('\n');
}

/**
 * Envoie un message WhatsApp via CallMeBot
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    
    console.log('[WhatsApp] Configuration check:');
    console.log('  - API Key présente:', !!apiKey);
    console.log('  - Téléphone:', phone);
    console.log('  - Longueur message:', message.length);
    
    if (!apiKey) {
      console.warn('[WhatsApp] ⚠️ CALLMEBOT_API_KEY non configuré dans .env.local');
      console.log('[WhatsApp] 📝 Message qui aurait été envoyé:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));
      console.log('[WhatsApp] 📋 Pour configurer:');
      console.log('  1. Ajouter +34 644 28 04 85 sur WhatsApp');
      console.log('  2. Envoyer: "I allow callmebot to send me messages"');
      console.log('  3. Copier l\'API key reçue');
      console.log('  4. Ajouter dans .env.local: CALLMEBOT_API_KEY=votre_clé');
      return false;
    }

    // Nettoyer le numéro (enlever +, espaces, etc.)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message);
    
    // API CallMeBot
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;
    
    console.log('[WhatsApp] Envoi du message à:', phone);
    
    const response = await fetch(url, {
      method: 'GET',
    });
    
    if (response.ok) {
      console.log('[WhatsApp] Message envoyé avec succès!');
      return true;
    } else {
      console.error('[WhatsApp] Erreur lors de l\'envoi:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('[WhatsApp] Exception lors de l\'envoi:', error);
    return false;
  }
}

/**
 * Envoie les détails d'une commande sur WhatsApp
 */
export async function sendOrderToWhatsApp(data: OrderWhatsAppData): Promise<boolean> {
  const managerPhone = process.env.MANAGER_WHATSAPP || '+212701193811';
  const message = formatOrderMessage(data);
  
  console.log('[WhatsApp] Envoi de la commande', data.orderNumber, 'à', managerPhone);
  
  return await sendWhatsAppMessage(managerPhone, message);
}

/**
 * Version simplifiée pour tests
 */
export async function sendTestMessage(): Promise<boolean> {
  const managerPhone = process.env.MANAGER_WHATSAPP || '+212701193811';
  const message = '🧪 Test Nubia Aura - Le système de notification WhatsApp fonctionne!';
  
  return await sendWhatsAppMessage(managerPhone, message);
}
