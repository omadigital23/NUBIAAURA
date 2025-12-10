# 🚀 Guide de Configuration Complète - Nubia Aura

## ✅ Ce qui a été implémenté

### **1️⃣ Emails de Confirmation**

Tous les formulaires envoient maintenant des emails automatiques :

| Formulaire | Email Client | Email Manager |
|------------|--------------|---------------|
| **Newsletter** | ✅ Email de bienvenue | ❌ Non |
| **Contact** | ✅ Confirmation de réception | ✅ Notification |
| **Sur-mesure** | ✅ Confirmation avec détails | ✅ Notification |

### **2️⃣ Notifications WhatsApp**

Le manager reçoit des notifications WhatsApp instantanées pour :
- 📧 Nouveaux messages de contact
- 🎨 Nouvelles commandes sur-mesure
- 🛍️ Nouvelles commandes (à implémenter dans checkout)

---

## 📧 Configuration SendGrid (Emails)

### **Étape 1 : Créer un compte SendGrid**

1. Allez sur [SendGrid.com](https://sendgrid.com)
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre email

### **Étape 2 : Créer une clé API**

1. Dashboard SendGrid → **Settings** → **API Keys**
2. Cliquez sur **Create API Key**
3. Nom : "Nubia Aura Production"
4. Permissions : **Full Access** ou **Mail Send**
5. Copiez la clé (elle ne sera affichée qu'une fois !)

### **Étape 3 : Configurer les variables d'environnement**

Créez ou modifiez `.env.local` :

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@nubiaaura.com
MANAGER_EMAIL=admin@nubiaaura.com
```

### **Étape 4 : Vérifier votre domaine (Optionnel mais recommandé)**

Pour éviter que les emails tombent dans les spams :

1. Dashboard SendGrid → **Settings** → **Sender Authentication**
2. Cliquez sur **Authenticate Your Domain**
3. Suivez les instructions pour ajouter les enregistrements DNS

---

## 📱 Configuration WhatsApp (CallMeBot)

### **Étape 1 : Activer CallMeBot**

1. Ajoutez **+34 644 28 04 85** dans vos contacts WhatsApp
2. Envoyez ce message : `I allow callmebot to send me messages`
3. Vous recevrez une clé API (ex: `123456`)

### **Étape 2 : Configurer les variables d'environnement**

Ajoutez dans `.env.local` :

```env
# WhatsApp Notifications (CallMeBot)
CALLMEBOT_API_KEY=123456
MANAGER_WHATSAPP=+212701193811
NEXT_PUBLIC_WHATSAPP_PHONE=+212701193811
```

⚠️ **Important** : Le numéro doit être au format international (+221...)

### **Étape 3 : Tester**

Soumettez un formulaire de contact ou sur-mesure. Vous devriez recevoir une notification WhatsApp !

---

## 🧪 Test des Emails et Notifications

### **Test Newsletter**

```bash
# Allez sur http://localhost:3000
# Inscrivez-vous à la newsletter en bas de page
# Vérifiez votre boîte email
```

**Résultat attendu :**
- ✅ Email de bienvenue reçu
- ✅ Enregistrement dans `newsletter_subscriptions`

### **Test Contact**

```bash
# Allez sur http://localhost:3000/fr/contact
# Remplissez et soumettez le formulaire
```

**Résultat attendu :**
- ✅ Email de confirmation au client
- ✅ Email de notification au manager
- ✅ Notification WhatsApp au manager
- ✅ Enregistrement dans `contact_submissions`

### **Test Sur-mesure**

```bash
# Allez sur http://localhost:3000/fr/sur-mesure
# Remplissez et soumettez le formulaire
```

**Résultat attendu :**
- ✅ Email de confirmation au client avec référence
- ✅ Email de notification au manager
- ✅ Notification WhatsApp au manager
- ✅ Enregistrement dans `custom_orders`

---

## 🔍 Vérification dans Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. **Table Editor**
3. Vérifiez les données dans :
   - `newsletter_subscriptions`
   - `contact_submissions`
   - `custom_orders`

---

## 🎨 Templates d'Emails

Les templates sont dans `lib/email-templates.ts` :

- `getNewsletterWelcomeEmail()` - Bienvenue newsletter
- `getContactConfirmationEmail()` - Confirmation contact
- `getContactManagerNotification()` - Notification manager contact
- `getCustomOrderConfirmationEmail()` - Confirmation sur-mesure
- `getCustomOrderManagerNotification()` - Notification manager sur-mesure

Vous pouvez les personnaliser selon vos besoins !

---

## 🚨 Dépannage

### **Les emails ne sont pas envoyés**

1. Vérifiez que `SENDGRID_API_KEY` est configuré dans `.env.local`
2. Vérifiez les logs du serveur : `npm run dev`
3. Vérifiez votre quota SendGrid (100/jour gratuit)
4. Vérifiez les spams de votre boîte email

### **Les notifications WhatsApp ne fonctionnent pas**

1. Vérifiez que `CALLMEBOT_API_KEY` est configuré
2. Vérifiez que le numéro est au format international
3. Vérifiez que vous avez bien activé CallMeBot (étape 1)
4. Consultez les logs : `npm run dev`

### **Les formulaires ne s'enregistrent pas**

1. Vérifiez que les tables existent dans Supabase
2. Exécutez `FIX_TABLES_RLS.sql` dans SQL Editor
3. Vérifiez les politiques RLS
4. Consultez les logs du serveur

---

## 📊 Dashboard Admin (Prochaine étape)

Le dashboard admin vous permettra de :
- 📧 Voir tous les messages de contact
- 🎨 Gérer les commandes sur-mesure
- 📬 Gérer les abonnés newsletter
- 📈 Statistiques et analytics

---

## 🔐 Sécurité

### **Bonnes pratiques**

1. ✅ Ne commitez JAMAIS `.env.local` sur Git
2. ✅ Utilisez des clés API différentes pour dev/prod
3. ✅ Limitez les permissions des clés API
4. ✅ Régénérez les clés régulièrement
5. ✅ Activez la validation en 2 étapes sur SendGrid

### **Variables sensibles**

Ces variables ne doivent JAMAIS être exposées publiquement :
- `SENDGRID_API_KEY`
- `CALLMEBOT_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FLUTTERWAVE_SECRET_KEY`

---

## 📚 Ressources

- [Documentation SendGrid](https://docs.sendgrid.com)
- [CallMeBot WhatsApp API](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## ✅ Checklist de Configuration

- [ ] Compte SendGrid créé
- [ ] Clé API SendGrid obtenue
- [ ] Variables SendGrid dans `.env.local`
- [ ] CallMeBot activé sur WhatsApp
- [ ] Variables WhatsApp dans `.env.local`
- [ ] Test newsletter réussi
- [ ] Test contact réussi
- [ ] Test sur-mesure réussi
- [ ] Emails reçus correctement
- [ ] Notifications WhatsApp reçues
- [ ] Données dans Supabase vérifiées

---

*Configuration effectuée le : Novembre 2024*
*Projet : Nubia Aura E-commerce*
