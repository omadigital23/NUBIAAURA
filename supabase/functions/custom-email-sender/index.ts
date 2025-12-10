import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send'

interface EmailRequest {
  to: string
  subject: string
  template: string
  data?: Record<string, unknown>
  html?: string
}

interface SendGridPayload {
  personalizations: Array<{
    to: Array<{ email: string }>
    subject: string
  }>
  from: {
    email: string
    name: string
  }
  content: Array<{
    type: string
    value: string
  }>
}

function getTemplate(templateName: string, data: Record<string, unknown>): string {
  const d = data as Record<string, any>

  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { 
        background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); 
        color: white; 
        padding: 30px 20px; 
        text-align: center; 
        border-radius: 10px 10px 0 0;
      }
      .content { padding: 30px; background: #f9f9f9; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      .button { 
        background: #D4AF37; 
        color: #000; 
        padding: 15px 40px; 
        text-decoration: none; 
        border-radius: 5px; 
        display: inline-block; 
        margin: 20px 0;
        font-weight: bold;
      }
      .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
  `

  const footer = `
    <div class="footer">
      <p>© 2025 Nubia Aura. Tous droits réservés.</p>
      <p>Thiès, Sénégal | Casablanca, Maroc</p>
      <p><a href="https://nubiaaura.com" style="color: #D4AF37;">nubiaaura.com</a></p>
    </div>
  `

  switch (templateName) {
    case 'order-confirmation': {
      let itemsHtml = ''
      if (d.items && Array.isArray(d.items)) {
        itemsHtml = '<h4>Articles commandés:</h4><ul>'
        for (const item of d.items) {
          itemsHtml += '<li>' + item.name + ' - Qté: ' + item.quantity + ' × ' + item.price + ' FCFA</li>'
        }
        itemsHtml += '</ul>'
      }
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>✨ Nubia Aura</h1><p>Confirmation de commande</p></div><div class="content"><h2 style="color: #D4AF37;">Merci pour votre commande !</h2><p>Bonjour ' + (d.customerName || 'Client') + ',</p><p>Nous avons bien reçu votre commande <strong>#' + d.orderNumber + '</strong>.</p><div class="order-details"><h3>Détails de la commande</h3><p><strong>N° de commande:</strong> ' + d.orderNumber + '</p><p><strong>Total:</strong> ' + d.total + ' FCFA</p>' + itemsHtml + '</div><p>Nous préparons votre commande avec soin.</p><center><a href="https://www.nubiaaura.com/client/orders/' + d.orderId + '" class="button">Suivre ma commande</a></center><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'
    }

    case 'custom-order':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🎨 Nubia Aura</h1><p>Demande sur-mesure reçue</p></div><div class="content"><h2 style="color: #D4AF37;">Votre demande sur-mesure</h2><p>Bonjour ' + d.name + ',</p><p>Nous avons bien reçu votre demande de création sur-mesure (Réf: <strong>' + d.reference + '</strong>).</p><p>Notre équipe va étudier votre projet et vous contactera dans les plus brefs délais.</p><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'newsletter':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>📧 Nubia Aura</h1><p>Bienvenue dans notre newsletter</p></div><div class="content"><h2 style="color: #D4AF37;">Merci de votre inscription !</h2><p>Bonjour ' + (d.name || 'Cher(e) abonné(e)') + ',</p><p>Vous êtes maintenant inscrit(e) à la newsletter Nubia Aura ! 🎉</p><p>Vous recevrez en exclusivité :</p><ul><li>Nos nouvelles collections</li><li>Des offres spéciales</li><li>Des conseils mode</li><li>Des événements exclusifs</li></ul><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'contact-response':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>💬 Nubia Aura</h1><p>Message bien reçu</p></div><div class="content"><h2 style="color: #D4AF37;">Merci de nous avoir contactés !</h2><p>Bonjour ' + d.name + ',</p><p>Nous avons bien reçu votre message concernant : <strong>' + d.subject + '</strong></p><p>Notre équipe vous répondra dans les plus brefs délais.</p><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'signup-confirmation':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>✨ Nubia Aura</h1><p>Bienvenue !</p></div><div class="content"><h2 style="color: #D4AF37;">Confirmez votre adresse email</h2><p>Bonjour,</p><p>Merci de vous être inscrit sur Nubia Aura ! Pour activer votre compte, veuillez confirmer votre adresse email :</p><center><a href="' + d.confirmationUrl + '" class="button">Confirmer mon email</a></center><p style="color: #666; font-size: 14px; margin-top: 30px;">Si le bouton ne fonctionne pas, copiez ce lien : ' + d.confirmationUrl + '</p><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'magic-link':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🔐 Nubia Aura</h1><p>Lien de connexion</p></div><div class="content"><h2 style="color: #D4AF37;">Connectez-vous à votre compte</h2><p>Bonjour,</p><p>Cliquez sur le bouton ci-dessous pour vous connecter :</p><center><a href="' + d.magicLink + '" class="button">Se connecter</a></center><p style="color: #666; font-size: 14px; margin-top: 30px;">Ce lien est valable pendant 1 heure.</p><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'password-reset':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🔑 Nubia Aura</h1><p>Réinitialisation du mot de passe</p></div><div class="content"><h2 style="color: #D4AF37;">Réinitialisez votre mot de passe</h2><p>Bonjour,</p><p>Vous avez demandé à réinitialiser votre mot de passe :</p><center><a href="' + d.resetLink + '" class="button">Réinitialiser mon mot de passe</a></center><p style="color: #666; font-size: 14px; margin-top: 30px;">Ce lien est valable pendant 1 heure. Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email.</p><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'email-change':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>📧 Nubia Aura</h1><p>Changement d\'adresse email</p></div><div class="content"><h2 style="color: #D4AF37;">Confirmez votre nouvelle adresse email</h2><p>Bonjour,</p><p>Vous avez demandé à changer votre adresse email :</p><center><a href="' + d.confirmationUrl + '" class="button">Confirmer le changement</a></center><p style="color: #666; font-size: 14px; margin-top: 30px;">Si vous n\'avez pas demandé ce changement, ignorez cet email.</p><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'invite-user':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🎉 Nubia Aura</h1><p>Vous êtes invité !</p></div><div class="content"><h2 style="color: #D4AF37;">Rejoignez Nubia Aura</h2><p>Bonjour,</p><p>Vous avez été invité à rejoindre Nubia Aura !</p><center><a href="' + d.inviteLink + '" class="button">Créer mon compte</a></center><p style="margin-top: 30px;">À très bientôt !</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    // Security Notification Templates
    case 'security-password-changed':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🔒 Nubia Aura</h1><p>Alerte de sécurité</p></div><div class="content"><h2 style="color: #D4AF37;">Votre mot de passe a été modifié</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>Le mot de passe de votre compte Nubia Aura a été modifié le <strong>' + d.formattedDate + '</strong>.</p><div class="order-details"><p><strong>⚠️ Si vous n\'êtes pas à l\'origine de cette action :</strong></p><ul><li>Réinitialisez votre mot de passe immédiatement</li><li>Contactez notre support : contact@nubiaaura.com</li></ul></div><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'security-email-changed':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>📧 Nubia Aura</h1><p>Alerte de sécurité</p></div><div class="content"><h2 style="color: #D4AF37;">Votre adresse email a été modifiée</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>L\'adresse email de votre compte Nubia Aura a été modifiée le <strong>' + d.formattedDate + '</strong>.</p>' + (d.newEmail ? '<p>Nouvelle adresse : <strong>' + d.newEmail + '</strong></p>' : '') + '<div class="order-details"><p><strong>⚠️ Si vous n\'êtes pas à l\'origine de cette action :</strong></p><ul><li>Contactez immédiatement notre support : contact@nubiaaura.com</li></ul></div><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'security-phone-changed':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>📱 Nubia Aura</h1><p>Alerte de sécurité</p></div><div class="content"><h2 style="color: #D4AF37;">Votre numéro de téléphone a été modifié</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>Le numéro de téléphone de votre compte Nubia Aura a été modifié le <strong>' + d.formattedDate + '</strong>.</p>' + (d.newPhone ? '<p>Nouveau numéro : <strong>' + d.newPhone + '</strong></p>' : '') + '<div class="order-details"><p><strong>⚠️ Si vous n\'êtes pas à l\'origine de cette action :</strong></p><ul><li>Contactez immédiatement notre support : contact@nubiaaura.com</li></ul></div><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'security-identity-linked':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🔗 Nubia Aura</h1><p>Nouvelle connexion liée</p></div><div class="content"><h2 style="color: #D4AF37;">Nouvelle identité liée à votre compte</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>Une nouvelle méthode de connexion <strong>' + (d.provider || 'externe') + '</strong> a été liée à votre compte Nubia Aura le <strong>' + d.formattedDate + '</strong>.</p><div class="order-details"><p><strong>⚠️ Si vous n\'êtes pas à l\'origine de cette action :</strong></p><ul><li>Déconnectez cette identité dans vos paramètres</li><li>Changez votre mot de passe</li><li>Contactez notre support : contact@nubiaaura.com</li></ul></div><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'security-identity-unlinked':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🔓 Nubia Aura</h1><p>Connexion retirée</p></div><div class="content"><h2 style="color: #D4AF37;">Une identité a été retirée de votre compte</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>La méthode de connexion <strong>' + (d.provider || 'externe') + '</strong> a été retirée de votre compte Nubia Aura le <strong>' + d.formattedDate + '</strong>.</p><div class="order-details"><p><strong>⚠️ Si vous n\'êtes pas à l\'origine de cette action :</strong></p><ul><li>Vérifiez les connexions dans vos paramètres</li><li>Changez votre mot de passe</li><li>Contactez notre support : contact@nubiaaura.com</li></ul></div><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'security-mfa-added':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🛡️ Nubia Aura</h1><p>Sécurité renforcée</p></div><div class="content"><h2 style="color: #D4AF37;">Authentification à deux facteurs activée</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>L\'authentification à deux facteurs (<strong>' + (d.mfaMethod || 'TOTP') + '</strong>) a été activée sur votre compte Nubia Aura le <strong>' + d.formattedDate + '</strong>.</p><p style="color: green;">✅ Votre compte est maintenant plus sécurisé !</p><div class="order-details"><p><strong>⚠️ Si vous n\'êtes pas à l\'origine de cette action :</strong></p><ul><li>Désactivez le 2FA dans vos paramètres</li><li>Changez votre mot de passe</li><li>Contactez notre support : contact@nubiaaura.com</li></ul></div><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'security-mfa-removed':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>⚠️ Nubia Aura</h1><p>Alerte de sécurité</p></div><div class="content"><h2 style="color: #D4AF37;">Authentification à deux facteurs désactivée</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>L\'authentification à deux facteurs (<strong>' + (d.mfaMethod || 'TOTP') + '</strong>) a été désactivée sur votre compte Nubia Aura le <strong>' + d.formattedDate + '</strong>.</p><p style="color: orange;">⚠️ Votre compte est maintenant moins sécurisé.</p><div class="order-details"><p><strong>⚠️ Si vous n\'êtes pas à l\'origine de cette action :</strong></p><ul><li>Réactivez le 2FA immédiatement</li><li>Changez votre mot de passe</li><li>Contactez notre support : contact@nubiaaura.com</li></ul></div><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    case 'reauthentication':
      return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + baseStyle + '</head><body><div class="container"><div class="header"><h1>🔐 Nubia Aura</h1><p>Vérification requise</p></div><div class="content"><h2 style="color: #D4AF37;">Confirmez votre identité</h2><p>Bonjour ' + (d.userName || '') + ',</p><p>Une action sensible nécessite la confirmation de votre identité.</p><p>Utilisez ce code pour confirmer :</p><center><div style="background: #f0f0f0; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">' + (d.code || '------') + '</div></center><p style="color: #666; font-size: 14px;">Ce code expire dans 10 minutes.</p><p style="margin-top: 30px;">Cordialement,</p><p style="color: #D4AF37; font-weight: bold;">L\'équipe Nubia Aura</p></div>' + footer + '</div></body></html>'

    default:
      throw new Error('Unknown template: ' + templateName)
  }
}

async function sendEmail(emailData: EmailRequest): Promise<Response> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured')
  }

  let htmlContent: string
  if (emailData.template === 'custom' && emailData.html) {
    htmlContent = emailData.html
  } else {
    htmlContent = getTemplate(emailData.template, emailData.data || {})
  }

  const payload: SendGridPayload = {
    personalizations: [
      {
        to: [{ email: emailData.to }],
        subject: emailData.subject
      }
    ],
    from: {
      email: 'noreply@nubiaaura.com',
      name: 'Nubia Aura'
    },
    content: [
      {
        type: 'text/html',
        value: htmlContent
      }
    ]
  }

  const response = await fetch(SENDGRID_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + SENDGRID_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error('SendGrid API error: ' + response.status + ' - ' + error)
  }

  return response
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailRequest: EmailRequest = await req.json()

    if (!emailRequest.to || !emailRequest.subject || !emailRequest.template) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: to, subject, template'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    await sendEmail(emailRequest)

    console.log('Email sent to ' + emailRequest.to + ' with template ' + emailRequest.template)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email'
    console.error('Email sending error:', errorMessage)

    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
