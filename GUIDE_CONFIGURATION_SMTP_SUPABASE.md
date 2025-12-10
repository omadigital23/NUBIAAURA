# 📧 Guide de Configuration SMTP avec Supabase

Ce guide explique comment configurer un serveur SMTP personnalisé dans Supabase pour envoyer des emails de confirmation aux utilisateurs de Nubia Aura.

---

## 🎯 Objectif

Configurer Supabase pour envoyer automatiquement des emails de confirmation lorsque :
- Un utilisateur s'inscrit à la newsletter
- Un utilisateur soumet le formulaire de contact
- Un utilisateur crée une commande sur-mesure
- Un utilisateur s'inscrit sur le site

---

## 📋 Prérequis

Vous aurez besoin d'un service SMTP. Voici les options recommandées :

### **Option 1 : SendGrid (Recommandé)**
- ✅ 100 emails/jour gratuits
- ✅ Facile à configurer
- ✅ Excellente délivrabilité
- 🔗 [Créer un compte SendGrid](https://sendgrid.com)

### **Option 2 : Gmail SMTP**
- ✅ Gratuit
- ⚠️ Limité à 500 emails/jour
- 🔗 [Configuration Gmail SMTP](https://support.google.com/mail/answer/7126229)

### **Option 3 : Mailgun**
- ✅ 5000 emails/mois gratuits (3 premiers mois)
- ✅ Bonne délivrabilité
- 🔗 [Créer un compte Mailgun](https://www.mailgun.com)

### **Option 4 : Brevo (ex-Sendinblue)**
- ✅ 300 emails/jour gratuits
- ✅ Interface en français
- 🔗 [Créer un compte Brevo](https://www.brevo.com)

---

## 🔧 Configuration SMTP dans Supabase

### **Étape 1 : Accéder aux paramètres d'authentification**

1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet **NUBIA AURA**
3. Dans le menu latéral, cliquez sur **Authentication** (🔐)
4. Cliquez sur **Email Templates** puis sur **Settings**
5. Faites défiler jusqu'à la section **SMTP Settings**

### **Étape 2 : Activer le SMTP personnalisé**

Cliquez sur **Enable Custom SMTP** pour afficher le formulaire de configuration.

---

## 📝 Configuration selon votre fournisseur

### **Configuration SendGrid**

```
Sender email address: noreply@nubiaaura.com (ou votre email vérifié)
Sender name: Nubia Aura

Host: smtp.sendgrid.net
Port number: 587
Minimum interval per user: 60 (secondes)

Username: apikey
Password: [Votre clé API SendGrid]
```

**Comment obtenir votre clé API SendGrid :**
1. Connectez-vous à [SendGrid](https://app.sendgrid.com)
2. Allez dans **Settings** → **API Keys**
3. Cliquez sur **Create API Key**
4. Nommez-la "Nubia Aura SMTP"
5. Sélectionnez **Full Access** ou **Restricted Access** avec permissions d'envoi
6. Copiez la clé (elle ne sera affichée qu'une seule fois !)

---

### **Configuration Gmail SMTP**

```
Sender email address: votre-email@gmail.com
Sender name: Nubia Aura

Host: smtp.gmail.com
Port number: 587
Minimum interval per user: 60

Username: votre-email@gmail.com
Password: [Mot de passe d'application]
```

**⚠️ Important pour Gmail :**
1. Activez la validation en 2 étapes sur votre compte Google
2. Générez un "Mot de passe d'application" :
   - Allez dans [Paramètres de sécurité Google](https://myaccount.google.com/security)
   - Cliquez sur **Mots de passe d'application**
   - Sélectionnez **Autre (nom personnalisé)**
   - Entrez "Nubia Aura SMTP"
   - Copiez le mot de passe généré (16 caractères)

---

### **Configuration Mailgun**

```
Sender email address: noreply@votre-domaine.com
Sender name: Nubia Aura

Host: smtp.mailgun.org
Port number: 587
Minimum interval per user: 60

Username: postmaster@votre-domaine.mailgun.org
Password: [Votre mot de passe SMTP Mailgun]
```

**Comment obtenir vos identifiants Mailgun :**
1. Connectez-vous à [Mailgun](https://app.mailgun.com)
2. Allez dans **Sending** → **Domain settings**
3. Cliquez sur votre domaine
4. Trouvez la section **SMTP credentials**
5. Copiez le username et le password

---

### **Configuration Brevo (Sendinblue)**

```
Sender email address: votre-email@domaine.com
Sender name: Nubia Aura

Host: smtp-relay.brevo.com
Port number: 587
Minimum interval per user: 60

Username: votre-email@domaine.com
Password: [Votre clé SMTP Brevo]
```

**Comment obtenir votre clé SMTP Brevo :**
1. Connectez-vous à [Brevo](https://app.brevo.com)
2. Allez dans **SMTP & API** → **SMTP**
3. Copiez votre clé SMTP

---

## 🎨 Personnalisation des Templates d'Email

### **Étape 1 : Accéder aux templates**

1. Dans Supabase, allez dans **Authentication** → **Email Templates**
2. Vous verrez plusieurs templates :
   - **Confirm signup** : Email de confirmation d'inscription
   - **Invite user** : Invitation d'utilisateur
   - **Magic Link** : Lien de connexion magique
   - **Change Email Address** : Changement d'email
   - **Reset Password** : Réinitialisation de mot de passe

### **Étape 2 : Personnaliser le template de confirmation**

Cliquez sur **Confirm signup** et remplacez le contenu par :

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      color: #333; 
      margin: 0; 
      padding: 0; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-family: 'Playfair Display', serif;
    }
    .content { 
      padding: 30px; 
      background: #f9f9f9; 
      border-radius: 0 0 10px 10px;
    }
    .button { 
      background: #D4AF37; 
      color: #000; 
      padding: 15px 40px; 
      text-decoration: none; 
      border-radius: 5px; 
      display: inline-block; 
      margin: 20px 0;
      font-weight: bold;
      font-size: 16px;
    }
    .footer { 
      text-align: center; 
      padding: 20px; 
      color: #666; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Nubia Aura</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Bienvenue dans l'univers de l'élégance africaine</p>
    </div>

    <div class="content">
      <h2 style="color: #D4AF37;">Confirmez votre adresse email</h2>
      
      <p>Bonjour,</p>

      <p>Merci de vous être inscrit sur <strong>Nubia Aura</strong> ! Nous sommes ravis de vous accueillir dans notre communauté.</p>

      <p>Pour activer votre compte et commencer à explorer notre collection exclusive de vêtements africains, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          Confirmer mon email
        </a>
      </center>

      <p style="color: #666; font-size: 14px;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
        <a href="{{ .ConfirmationURL }}" style="color: #D4AF37;">{{ .ConfirmationURL }}</a>
      </p>

      <p style="margin-top: 30px;">À très bientôt sur Nubia Aura !</p>

      <p style="color: #D4AF37; font-weight: bold;">L'équipe Nubia Aura</p>
    </div>

    <div class="footer">
      <p>© 2025 Nubia Aura. Tous droits réservés.</p>
      <p>Thiès, Sénégal | Casablanca, Maroc</p>
      <p style="margin-top: 10px;">
        <a href="https://nubiaaura.com" style="color: #D4AF37; text-decoration: none;">nubiaaura.com</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### **Étape 3 : Personnaliser le sujet de l'email**

Dans le champ **Subject**, remplacez par :
```
✨ Confirmez votre inscription à Nubia Aura
```

---

## ✅ Test de la Configuration

### **Méthode 1 : Test via Supabase Dashboard**

1. Allez dans **Authentication** → **Users**
2. Cliquez sur **Invite user**
3. Entrez votre email de test
4. Vérifiez que vous recevez bien l'email

### **Méthode 2 : Test via votre application**

1. Allez sur votre site : `http://localhost:3000`
2. Inscrivez-vous avec un email de test
3. Vérifiez votre boîte de réception (et les spams !)

---

## 🔍 Vérification de la Délivrabilité

### **Vérifier que les emails ne tombent pas dans les spams**

1. **Configurez SPF et DKIM** pour votre domaine (si vous utilisez un domaine personnalisé)
2. **Vérifiez votre domaine** auprès de votre fournisseur SMTP
3. **Testez avec [Mail Tester](https://www.mail-tester.com)** pour obtenir un score de délivrabilité

### **Configuration DNS pour SendGrid (exemple)**

Si vous utilisez votre propre domaine, ajoutez ces enregistrements DNS :

```
Type: CNAME
Host: em1234.votre-domaine.com
Value: u1234567.wl123.sendgrid.net

Type: CNAME
Host: s1._domainkey.votre-domaine.com
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.votre-domaine.com
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

*(Les valeurs exactes vous seront fournies par SendGrid)*

---

## 🚨 Dépannage

### **Problème : Les emails ne sont pas envoyés**

**Solutions :**
1. Vérifiez que tous les champs SMTP sont correctement remplis
2. Vérifiez que votre clé API / mot de passe est correct
3. Vérifiez que le port 587 n'est pas bloqué par votre pare-feu
4. Consultez les logs dans **Authentication** → **Logs**

### **Problème : Les emails tombent dans les spams**

**Solutions :**
1. Configurez SPF, DKIM et DMARC pour votre domaine
2. Vérifiez votre domaine auprès de votre fournisseur SMTP
3. Utilisez un domaine vérifié (pas @gmail.com pour l'envoi)
4. Ajoutez un lien de désinscription dans vos emails

### **Problème : Erreur "Authentication failed"**

**Solutions :**
1. Pour Gmail : Utilisez un mot de passe d'application, pas votre mot de passe normal
2. Pour SendGrid : Le username doit être exactement `apikey`
3. Vérifiez qu'il n'y a pas d'espaces avant/après vos identifiants

---

## 📊 Limites et Quotas

| Fournisseur | Gratuit | Payant |
|-------------|---------|--------|
| **SendGrid** | 100/jour | À partir de 19.95$/mois |
| **Gmail** | 500/jour | N/A |
| **Mailgun** | 5000/mois (3 mois) | À partir de 35$/mois |
| **Brevo** | 300/jour | À partir de 25€/mois |

---

## 🔐 Sécurité

### **Bonnes pratiques :**

1. ✅ Ne partagez jamais vos clés API
2. ✅ Utilisez des variables d'environnement pour stocker les clés
3. ✅ Activez la validation en 2 étapes sur vos comptes
4. ✅ Régénérez vos clés API régulièrement
5. ✅ Limitez les permissions de vos clés API au strict nécessaire

### **Variables d'environnement recommandées**

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# SMTP Configuration (optionnel - si vous voulez aussi utiliser SendGrid directement)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@nubiaaura.com
MANAGER_EMAIL=admin@nubiaaura.com

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

---

## 📚 Ressources Supplémentaires

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation SendGrid](https://docs.sendgrid.com)
- [Configuration Gmail SMTP](https://support.google.com/mail/answer/7126229)
- [Documentation Mailgun](https://documentation.mailgun.com)
- [Documentation Brevo](https://developers.brevo.com)

---

## ✅ Checklist de Configuration

- [ ] Compte SMTP créé (SendGrid/Gmail/Mailgun/Brevo)
- [ ] Clé API / Mot de passe obtenu
- [ ] Configuration SMTP dans Supabase complétée
- [ ] Templates d'email personnalisés
- [ ] Test d'envoi réussi
- [ ] Emails ne tombent pas dans les spams
- [ ] Variables d'environnement configurées
- [ ] Documentation sauvegardée

---

## 🎉 Félicitations !

Votre configuration SMTP est maintenant terminée ! Les utilisateurs de Nubia Aura recevront automatiquement des emails de confirmation élégants et professionnels.

**Besoin d'aide ?** Contactez l'équipe de développement ou consultez la documentation Supabase.

---

*Dernière mise à jour : Novembre 2024*
*Version : 1.0*
