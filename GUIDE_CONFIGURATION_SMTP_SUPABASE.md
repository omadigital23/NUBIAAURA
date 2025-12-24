# 📧 Guide de Configuration SMTP avec Supabase (Namecheap)

Ce guide explique comment configurer le serveur SMTP personnalisé (Namecheap Private Email) dans Supabase pour envoyer des emails système (confirmation inscription, réinitialisation mot de passe) et comment configurer l'application pour les emails transactionnels (newsletter, contact).

---

## 🎯 Objectif

Configurer l'envoi d'emails via **Namecheap Private Email** pour remplacer SendGrid partout.

---

## 🔧 Configuration SMTP dans Supabase

Ces réglages permettent à Supabase d'envoyer les emails d'authentification (confirmation d'email, lien magique, reset password).

### **Étape 1 : Accéder aux paramètres**

1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet **NUBIA AURA**
3. Allez dans **Authentication** (🔐) > **Email Templates** > **Settings**
4. Activez **Enable Custom SMTP**

### **Étape 2 : Remplir les informations SMTP**

Utilisez les informations suivantes :

```
Sender email address: supports@nubiaaura.com
Sender name: nubia aura

Host: mail.privateemail.com
Port number: 587
Minimum interval per user: 60

Username: supports@nubiaaura.com
Password: [Votre mot de passe email]
```

ℹ️ **Note :** Le mot de passe ne sera plus visible une fois sauvegardé. Si vous le changez, vous devrez le mettre à jour ici.

---

## 💻 Configuration pour l'Application (Next.js)

L'application utilise aussi ce SMTP pour envoyer les emails de newsletter, contact et commandes.

### **Variables d'environnement**

Assurez-vous que votre fichier `.env.local` (en local) et vos variables d'environnement sur Vercel contiennent :

```env
# Configuration SMTP (Namecheap)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=supports@nubiaaura.com
SMTP_PASSWORD=votre_mot_de_passe_ici
SMTP_FROM_EMAIL=supports@nubiaaura.com
SMTP_FROM_NAME="Nubia Aura"

# Email pour les notifications admin
MANAGER_EMAIL=supports@nubiaaura.com
```

---

## 🎨 Templates d'Email Supabase

Vous pouvez personnaliser les templates dans **Authentication** > **Email Templates**.

### **Template "Confirm signup"**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0;">✨ Nubia Aura</h1>
      <p style="margin: 10px 0 0 0;">Bienvenue dans l'univers de l'élégance</p>
    </div>

    <div style="padding: 30px; background: #f9f9f9;">
      <h2 style="color: #D4AF37;">Confirmez votre inscription</h2>
      <p>Merci de rejoindre Nubia Aura ! Pour activer votre compte, cliquez ci-dessous :</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" style="background: #D4AF37; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold;">
          Confirmer mon email
        </a>
      </center>
      
      <p style="font-size: 12px; color: #666;">
        Si le bouton ne fonctionne pas : <a href="{{ .ConfirmationURL }}" style="color: #D4AF37;">{{ .ConfirmationURL }}</a>
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>© 2025 Nubia Aura. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
```

---

## 🚨 Dépannage

### **Erreur d'envoi**
- Vérifiez que le port **587** est ouvert.
- Vérifiez que le **mot de passe** est correct (essayez de vous connecter au webmail Namecheap pour vérifier).
- Vérifiez que l'email **supports@nubiaaura.com** est bien actif.

### **Logs**
- Dans Supabase : **Authentication** > **Logs**
- Dans l'app : Regardez les logs Vercel pour voir les erreurs `createTransport`.
