// Test rapide pour voir le message généré
const testData = {
    orderId: 'ORD-123456',
    customerName: 'Test User',
    total: 25000,
    itemCount: 3
};

const baseUrl = 'https://www.nubiaaura.com';
const validateUrl = `${baseUrl}/api/admin/orders/validate?id=${testData.orderId}&action=confirm`;
const cancelUrl = `${baseUrl}/api/admin/orders/validate?id=${testData.orderId}&action=cancel`;

const message = `🛍️ *Nouvelle commande*\n\n` +
    `🔖 *N°:* ${testData.orderId}\n` +
    `👤 *Client:* ${testData.customerName}\n` +
    `📦 *Articles:* ${testData.itemCount}\n` +
    `💰 *Total:* ${testData.total.toLocaleString('fr-FR')} FCFA\n\n` +
    `📋 *Actions:*\n` +
    `✅ Valider: ${validateUrl}\n` +
    `❌ Annuler: ${cancelUrl}\n\n` +
    `Préparez la commande rapidement !`;

console.log('=== MESSAGE BRUT ===');
console.log(message);
console.log('\n=== MESSAGE ENCODÉ ===');
console.log(encodeURIComponent(message));
