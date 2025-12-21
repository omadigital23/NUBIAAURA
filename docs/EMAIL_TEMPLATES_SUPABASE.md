# 📧 Templates d'Email NUBIA AURA pour Supabase

Ce document contient les templates d'email à configurer dans **Supabase Dashboard** → **Authentication** → **Email Templates**.

---

## 🎨 Couleurs NUBIA AURA

| Couleur | Code Hex |
|---------|----------|
| Noir | `#000000` |
| Or | `#D4AF37` |
| Blanc | `#FFFFFF` |
| Crème | `#F5F1E8` |
| Noir foncé | `#1A1A1A` |

---

## 1. Template "Reset Password" (Réinitialisation du mot de passe)

### Sujet de l'email
```
✨ Réinitialiser votre mot de passe - Nubia Aura
```

### Corps du template HTML

Copiez ce code dans **Supabase** → **Authentication** → **Email Templates** → **Reset Password** :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialiser votre mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F5F1E8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F1E8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%); padding: 40px 30px; text-align: center;">
              <img src="https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/logo.png" alt="Nubia Aura" width="120" style="display: block; margin: 0 auto 15px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #D4AF37; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">
                NUBIA AURA
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #FFFFFF; opacity: 0.8;">
                L'élégance africaine redéfinie
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #000000; font-family: Georgia, 'Times New Roman', serif;">
                Réinitialiser votre mot de passe
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Bonjour,
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; color: #333333; line-height: 1.6;">
                Vous avez demandé à réinitialiser le mot de passe de votre compte Nubia Aura. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>

              <!-- Bouton CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 40px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 18px 50px; background-color: #D4AF37; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px; letter-spacing: 1px; transition: all 0.3s ease;">
                      RÉINITIALISER MON MOT DE PASSE
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Lien alternatif -->
              <div style="background-color: #F5F1E8; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                  Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="{{ .ConfirmationURL }}" style="color: #D4AF37; font-size: 13px;">{{ .ConfirmationURL }}</a>
                </p>
              </div>

              <!-- Avertissement de sécurité -->
              <div style="border-left: 4px solid #D4AF37; padding-left: 20px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                  <strong style="color: #000000;">⚠️ Sécurité :</strong> Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </p>
              </div>

              <p style="margin: 0; font-size: 16px; color: #333333; line-height: 1.6;">
                À très bientôt sur Nubia Aura !
              </p>
              
              <p style="margin: 20px 0 0; font-size: 16px; color: #D4AF37; font-weight: 600;">
                L'équipe Nubia Aura ✨
              </p>
            </td>
          </tr>

          <!-- Séparateur doré -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; height: 2px; background: linear-gradient(90deg, transparent 0%, #D4AF37 50%, transparent 100%);">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #1A1A1A;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #FFFFFF;">
                © 2025 Nubia Aura. Tous droits réservés.
              </p>
              <p style="margin: 0 0 15px; font-size: 13px; color: #888888;">
                🇸🇳 Thiès, Sénégal | 🇲🇦 Casablanca, Maroc
              </p>
              <p style="margin: 0;">
                <a href="https://nubiaaura.com" style="color: #D4AF37; text-decoration: none; font-size: 14px; font-weight: 600;">nubiaaura.com</a>
              </p>
            </td>
          </tr>

        </table>

        <!-- Note de confidentialité -->
        <p style="margin: 30px 0 0; font-size: 12px; color: #888888; text-align: center;">
          Cet email a été envoyé à {{ .Email }}. Si vous n'avez pas créé de compte sur Nubia Aura, vous pouvez ignorer cet email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Template "Confirm Signup" (Confirmation d'inscription)

### Sujet de l'email
```
✨ Bienvenue chez Nubia Aura - Confirmez votre email
```

### Corps du template HTML

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre inscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F5F1E8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F1E8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%); padding: 40px 30px; text-align: center;">
              <img src="https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/logo.png" alt="Nubia Aura" width="120" style="display: block; margin: 0 auto 15px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #D4AF37; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">
                NUBIA AURA
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #FFFFFF; opacity: 0.8;">
                L'élégance africaine redéfinie
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #000000; font-family: Georgia, 'Times New Roman', serif;">
                Bienvenue chez Nubia Aura ! ✨
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Bonjour,
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; color: #333333; line-height: 1.6;">
                Merci de rejoindre la communauté Nubia Aura ! Pour activer votre compte et découvrir notre collection exclusive de vêtements africains, veuillez confirmer votre adresse email :
              </p>

              <!-- Bouton CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 40px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 18px 50px; background-color: #D4AF37; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px; letter-spacing: 1px;">
                      CONFIRMER MON EMAIL
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Avantages -->
              <div style="background-color: #F5F1E8; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0 0 15px; font-size: 15px; color: #000000; font-weight: 600;">
                  En tant que membre, vous bénéficiez de :
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                  <li>Accès exclusif aux nouvelles collections</li>
                  <li>Suivi de vos commandes en temps réel</li>
                  <li>Offres et promotions réservées aux membres</li>
                  <li>Service client personnalisé</li>
                </ul>
              </div>

              <!-- Lien alternatif -->
              <div style="margin-bottom: 30px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                  Si le bouton ne fonctionne pas, copiez et collez ce lien :
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="{{ .ConfirmationURL }}" style="color: #D4AF37; font-size: 13px;">{{ .ConfirmationURL }}</a>
                </p>
              </div>

              <p style="margin: 0; font-size: 16px; color: #333333; line-height: 1.6;">
                Nous avons hâte de vous accompagner dans votre style !
              </p>
              
              <p style="margin: 20px 0 0; font-size: 16px; color: #D4AF37; font-weight: 600;">
                L'équipe Nubia Aura ✨
              </p>
            </td>
          </tr>

          <!-- Séparateur doré -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; height: 2px; background: linear-gradient(90deg, transparent 0%, #D4AF37 50%, transparent 100%);">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #1A1A1A;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #FFFFFF;">
                © 2025 Nubia Aura. Tous droits réservés.
              </p>
              <p style="margin: 0 0 15px; font-size: 13px; color: #888888;">
                🇸🇳 Thiès, Sénégal | 🇲🇦 Casablanca, Maroc
              </p>
              <p style="margin: 0;">
                <a href="https://nubiaaura.com" style="color: #D4AF37; text-decoration: none; font-size: 14px; font-weight: 600;">nubiaaura.com</a>
              </p>
            </td>
          </tr>

        </table>

        <!-- Note de confidentialité -->
        <p style="margin: 30px 0 0; font-size: 12px; color: #888888; text-align: center;">
          Cet email a été envoyé à {{ .Email }}. Si vous n'avez pas créé de compte sur Nubia Aura, vous pouvez ignorer cet email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Template "Magic Link" (Lien magique)

### Sujet de l'email
```
🔐 Votre lien de connexion Nubia Aura
```

### Corps du template HTML

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre lien de connexion</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F5F1E8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F1E8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%); padding: 40px 30px; text-align: center;">
              <img src="https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/logo.png" alt="Nubia Aura" width="120" style="display: block; margin: 0 auto 15px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #D4AF37; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">
                NUBIA AURA
              </h1>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #000000; font-family: Georgia, 'Times New Roman', serif;">
                🔐 Votre lien de connexion
              </h2>
              
              <p style="margin: 0 0 30px; font-size: 16px; color: #333333; line-height: 1.6;">
                Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Nubia Aura :
              </p>

              <!-- Bouton CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 40px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 18px 50px; background-color: #D4AF37; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px; letter-spacing: 1px;">
                      SE CONNECTER
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Avertissement -->
              <div style="border-left: 4px solid #D4AF37; padding-left: 20px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                  <strong style="color: #000000;">⚠️ Important :</strong> Ce lien est valable <strong>1 heure</strong> et ne peut être utilisé qu'une seule fois.
                </p>
              </div>

              <p style="margin: 20px 0 0; font-size: 16px; color: #D4AF37; font-weight: 600;">
                L'équipe Nubia Aura ✨
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #1A1A1A;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #FFFFFF;">
                © 2025 Nubia Aura. Tous droits réservés.
              </p>
              <p style="margin: 0;">
                <a href="https://nubiaaura.com" style="color: #D4AF37; text-decoration: none; font-size: 14px; font-weight: 600;">nubiaaura.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📝 Instructions de configuration

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet **NUBIA AURA**
3. Allez dans **Authentication** → **Email Templates**
4. Pour chaque template :
   - Modifiez le **Subject** avec le sujet fourni
   - Collez le code HTML dans le champ **Body**
   - Cliquez sur **Save**

---

## ✅ Variables disponibles

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Lien de confirmation/réinitialisation |
| `{{ .Email }}` | Email de l'utilisateur |
| `{{ .Token }}` | Token brut (si besoin) |
| `{{ .TokenHash }}` | Hash du token |
| `{{ .SiteURL }}` | URL du site |

---

*Dernière mise à jour : Décembre 2024*
