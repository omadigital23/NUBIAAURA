# 🚀 Guide de Configuration Complète - Nubia Aura

## ✅ Ce qui a été implémenté

### **1️⃣ Emails de Confirmation (Via Namecheap SMTP)**

Nous n'utilisons PLUS SendGrid. Tous les emails passent par le serveur SMTP de Namecheap.

| Formulaire | Email Client | Email Manager |
|------------|--------------|---------------|
| **Newsletter** | ✅ Email de bienvenue | ❌ Non |
| **Contact** | ✅ Confirmation de réception | ✅ Notification |
| **Sur-mesure** | ✅ Confirmation avec détails | ✅ Notification |
| **Commandes** | ✅ Confirmation / Expédition | ✅ Notification |

### **2️⃣ Notifications WhatsApp**

Le manager reçoit des notifications WhatsApp instantanées pour :
- 📧 Nouveaux messages de contact
- 🎨 Nouvelles commandes sur-mesure

---

## 📧 Configuration SMTP (Namecheap)

### **Étape 1 : Obtenir les identifiants**

Vous devez disposer des informations de votre compte email professionnel Namecheap (Private Email).

### **Étape 2 : Configurer les variables d'environnement**

Créez ou modifiez `.env.local` et les variables Vercel :

```env
# SMTP Configuration (Namecheap)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=supports@nubiaaura.com
SMTP_PASSWORD=votre_mot_de_passe_ici
SMTP_FROM_EMAIL=supports@nubiaaura.com
SMTP_FROM_NAME="Nubia Aura"

# Admin Email
MANAGER_EMAIL=supports@nubiaaura.com
```

### **Étape 3 : Configurer Supabase**

Pour les emails système (inscription, mot de passe oublié) :
1. Allez dans [Supabase Dashboard](https://app.supabase.com) > Authentication > Settings > SMTP Provider.
2. Activez **Enable Custom SMTP**.
3. Remplissez avec les mêmes informations (Host: `mail.privateemail.com`, Port: `587`, User: `supports@nubiaaura.com`, etc.).

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

---

## 🧪 Test des Emails et Notifications

### **Test Newsletter**

```bash
# Allez sur http://localhost:3000
# Inscrivez-vous à la newsletter en bas de page
# Vérifiez votre boîte email
```

**Résultat attendu :**
- ✅ Email de bienvenue reçu (via Namecheap SMTP)
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

---

## 🎨 Templates d'Emails

Les templates sont dans `lib/email-templates.ts` :

- `getNewsletterWelcomeEmail()` - Bienvenue newsletter
- `getContactConfirmationEmail()` - Confirmation contact
- `getCustomOrderConfirmationEmail()` - Confirmation sur-mesure
- `getShippingUpdateEmail()` - Notification expédition/livraison

Vous pouvez les personnaliser selon vos besoins !

---

## 🔐 Sécurité

### **Variables sensibles**

Ces variables ne doivent JAMAIS être exposées publiquement :
- `SMTP_PASSWORD`
- `CALLMEBOT_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FLUTTERWAVE_SECRET_KEY`

---

## ✅ Checklist de Configuration

- [ ] Identifiants SMTP Namecheap récupérés
- [ ] Variables SMTP dans `.env.local` et Vercel
- [ ] Configuration SMTP dans Supabase Dashboard effectuée
- [ ] CallMeBot activé sur WhatsApp
- [ ] Variables WhatsApp dans `.env.local`
- [ ] Test newsletter réussi
- [ ] Test contact réussi
- [ ] Test sur-mesure réussi
