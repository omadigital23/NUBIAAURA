# Migration Twilio → CallMeBot (Gratuit)

**Date:** 11 novembre 2025  
**Status:** ✅ COMPLÉTÉ

## Changements Effectués

### Fichiers Modifiés (5)

1. **`/app/api/payments/webhook/route.ts`**
   - ✅ Remplacé `sendOrderConfirmation` par `sendWhatsAppMessage` (CallMeBot)
   - ✅ Remplacé `notifyManager` par `sendWhatsAppMessage` (CallMeBot)
   - ✅ Messages WhatsApp envoyés au client ET au manager

2. **`/app/api/custom-orders/notify/route.ts`**
   - ✅ Remplacé `sendCustomOrderConfirmation` par `sendWhatsAppMessage` (CallMeBot)
   - ✅ Remplacé `notifyManager` par `sendWhatsAppMessage` (CallMeBot)
   - ✅ Messages WhatsApp envoyés au client ET au manager

3. **`/app/api/orders/notify-status/route.ts`**
   - ✅ Remplacé `sendOrderShipped` par `sendWhatsAppMessage` (CallMeBot)
   - ✅ Remplacé `sendOrderDelivered` par `sendWhatsAppMessage` (CallMeBot)
   - ✅ Messages WhatsApp envoyés au client pour expédition ET livraison

4. **`/app/api/returns/notify/route.ts`**
   - ✅ Changé import de `@/lib/twilio` à `@/lib/whatsapp`
   - ✅ Utilise `MANAGER_WHATSAPP` au lieu de `MANAGER_PHONE`

5. **`/app/api/notifications/send/route.ts`**
   - ✅ Endpoint marqué comme déprécié (410 Gone)
   - ✅ Retourne message indiquant que Twilio a été supprimé

### Fichier à Supprimer

- **`/lib/twilio.ts`** - Peut être supprimé (plus utilisé)

## Configuration CallMeBot

### Variables d'Environnement

Ajouter dans `.env.local`:

```env
# CallMeBot WhatsApp (GRATUIT)
CALLMEBOT_API_KEY=votre_clé_api
MANAGER_WHATSAPP=+212701193811
```

### Comment Obtenir l'API Key

1. **Ajouter le contact CallMeBot sur WhatsApp:**
   - Numéro: `+34 644 28 04 85`

2. **Envoyer le message d'activation:**
   ```
   I allow callmebot to send me messages
   ```

3. **Recevoir l'API Key:**
   - CallMeBot vous enverra votre clé API par WhatsApp
   - Copier la clé et l'ajouter dans `.env.local`

4. **Tester:**
   ```bash
   curl -X POST http://localhost:3000/api/test-whatsapp
   ```

## Avantages CallMeBot vs Twilio

### CallMeBot ✅
- **Gratuit** (pas de coût mensuel)
- **Simple** (juste une API key)
- **Rapide** à configurer (5 minutes)
- **Pas de vérification** de compte
- **Idéal pour** notifications simples

### Twilio ❌
- **Payant** ($15-50/mois minimum)
- **Complexe** (Account SID, Auth Token, Phone Number)
- **Long** à configurer (vérification compte, etc.)
- **Vérification** requise
- **Overkill** pour notifications simples

## Notifications Implémentées

### 1. Confirmation de Commande (Webhook)
- ✅ WhatsApp au client (numéro commande, montant)
- ✅ WhatsApp au manager (détails commande)
- ✅ Email au client
- ✅ Email au manager

### 2. Commande Personnalisée
- ✅ WhatsApp au client (référence, confirmation)
- ✅ WhatsApp au manager (détails demande)
- ✅ Email au client
- ✅ Email au manager

### 3. Statut de Commande
- ✅ WhatsApp au client (expédition avec tracking)
- ✅ WhatsApp au client (livraison confirmée)
- ✅ Email au client (expédition)
- ✅ Email au client (livraison)

### 4. Demande de Retour
- ✅ WhatsApp au client (confirmation retour)
- ✅ WhatsApp au manager (nouvelle demande)
- ✅ Email au client
- ✅ Email au manager

## Format des Messages WhatsApp

### Exemple: Confirmation de Commande
```
Merci pour votre commande! 🎉

Numéro de commande: ORD-12345
Montant: 150,000 FCFA

Vous recevrez bientôt des mises à jour sur votre livraison.

Nubia Aura
```

### Exemple: Alerte Manager
```
Nouvelle commande reçue! 🎉

Commande: ORD-12345
Client: John Doe
Montant: 150,000 FCFA
Adresse: 123 Rue Example, Dakar
```

## Tests

### 1. Tester l'envoi WhatsApp
```bash
# Créer un fichier de test
curl -X POST http://localhost:3000/api/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+221771234567","message":"Test Nubia Aura"}'
```

### 2. Tester une commande complète
```bash
# Simuler un webhook Flutterwave
# (voir FLUTTERWAVE_TEST_GUIDE.md)
```

### 3. Vérifier les logs
```bash
# Chercher dans les logs du serveur
grep "WhatsApp" logs/*.log
```

## Dépannage

### Problème: API Key non configurée
**Symptôme:** Logs montrent "CALLMEBOT_API_KEY non configuré"

**Solution:**
1. Vérifier `.env.local` contient `CALLMEBOT_API_KEY`
2. Redémarrer le serveur: `npm run dev`

### Problème: Messages non reçus
**Symptôme:** Logs OK mais pas de message WhatsApp

**Solution:**
1. Vérifier le numéro de téléphone (format international: +221...)
2. Vérifier que CallMeBot est bien ajouté dans vos contacts
3. Vérifier que vous avez envoyé le message d'activation
4. Attendre 1-2 minutes (délai CallMeBot)

### Problème: Erreur 429 (Too Many Requests)
**Symptôme:** Trop de messages envoyés

**Solution:**
- CallMeBot a des limites de débit
- Attendre quelques minutes entre les tests
- En production, les notifications sont espacées naturellement

## Prochaines Étapes

1. ✅ Supprimer `/lib/twilio.ts`
2. ✅ Configurer `CALLMEBOT_API_KEY` en production
3. ✅ Tester toutes les notifications
4. ✅ Déployer sur Vercel
5. ✅ Monitorer les logs

## Notes Importantes

- **CallMeBot est gratuit** mais a des limites de débit raisonnables
- **Format du numéro:** Toujours utiliser le format international (+221...)
- **Émojis:** Supportés dans les messages WhatsApp ✅
- **Longueur max:** ~1000 caractères par message
- **Délai d'envoi:** 1-5 secondes généralement

## Support

- **CallMeBot Docs:** https://www.callmebot.com/blog/free-api-whatsapp-messages/
- **WhatsApp Business API:** Alternative payante pour volume élevé
- **Twilio (si besoin):** Garder le code dans Git history

---

**Migration complétée avec succès!** 🎉
