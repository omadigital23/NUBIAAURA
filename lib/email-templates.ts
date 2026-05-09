/**
 * Templates d'emails pour les formulaires
 * Utilisables avec SMTP Namecheap
 */

export interface NewsletterEmailData {
  email: string;
  name?: string;
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface CustomOrderEmailData {
  name: string;
  email: string;
  phone: string;
  type: string;
  measurements: string;
  preferences: string;
  budget: number;
  reference: string;
}

/**
 * Email de bienvenue Newsletter
 */
export function getNewsletterWelcomeEmail(data: NewsletterEmailData) {
  return {
    subject: '✨ Bienvenue chez Nubia Aura !',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✨ Nubia Aura</h1>
              <p style="margin: 10px 0 0 0;">L'élégance africaine à portée de main</p>
            </div>

            <div class="content">
              <h2 style="color: #D4AF37;">Bienvenue ${data.name ? data.name : 'cher(e) abonné(e)'} !</h2>
              
              <p>Merci de vous être inscrit(e) à notre newsletter ! 🎉</p>

              <p>Vous recevrez désormais en exclusivité :</p>
              <ul>
                <li>🎁 Nos nouvelles collections</li>
                <li>💎 Des offres spéciales réservées</li>
                <li>✨ Des conseils mode et style</li>
                <li>🌍 L'actualité de la mode africaine</li>
              </ul>

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nubiaaura.com'}" class="button">
                  Découvrir la Collection
                </a>
              </center>

              <p>À très bientôt !</p>
              <p style="color: #D4AF37; font-weight: bold;">L'équipe Nubia Aura</p>
            </div>

            <div class="footer">
              <p>© 2025 Nubia Aura. Tous droits réservés.</p>
              <p>Dakar, Sénégal</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email de confirmation Contact
 */
export function getContactConfirmationEmail(data: ContactEmailData) {
  return {
    subject: `✅ Message reçu : ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
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
            .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #D4AF37; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Nubia Aura</h1>
              <p style="margin: 10px 0 0 0;">Message bien reçu ✅</p>
            </div>

            <div class="content">
              <h2 style="color: #D4AF37;">Bonjour ${data.name},</h2>
              
              <p>Merci de nous avoir contactés ! Nous avons bien reçu votre message.</p>

              <div class="info-box">
                <h3 style="color: #D4AF37; margin-top: 0;">Récapitulatif de votre message</h3>
                <p><strong>Sujet :</strong> ${data.subject}</p>
                <p><strong>Message :</strong><br>${data.message}</p>
              </div>

              <p>Notre équipe vous répondra dans les plus brefs délais, généralement sous 24-48 heures.</p>

              <p>Si votre demande est urgente, n'hésitez pas à nous contacter directement :</p>
              <ul>
                <li>📧 Email : supports@nubiaaura.com</li>
                <li>📱 WhatsApp : +221 77 143 01 37</li>
              </ul>

              <p>Cordialement,</p>
              <p style="color: #D4AF37; font-weight: bold;">L'équipe Nubia Aura</p>
            </div>

            <div class="footer">
              <p>© 2025 Nubia Aura. Tous droits réservés.</p>
              <p>Dakar, Sénégal</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email de notification au manager (Contact)
 */
export function getContactManagerNotification(data: ContactEmailData) {
  return {
    subject: `🔔 Nouveau message de contact : ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #D4AF37; color: #000; padding: 15px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .info-box { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Nouveau Message de Contact</h2>
            </div>

            <div class="content">
              <div class="info-box">
                <p><strong>De :</strong> ${data.name}</p>
                <p><strong>Email :</strong> ${data.email}</p>
                <p><strong>Téléphone :</strong> ${data.phone || 'Non fourni'}</p>
                <p><strong>Sujet :</strong> ${data.subject}</p>
              </div>

              <div class="info-box">
                <p><strong>Message :</strong></p>
                <p>${data.message}</p>
              </div>

              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Répondez rapidement pour offrir la meilleure expérience client.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email de confirmation Commande Sur-mesure
 */
export function getCustomOrderConfirmationEmail(data: CustomOrderEmailData) {
  return {
    subject: `✨ Commande sur-mesure reçue - Réf: ${data.reference}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
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
            .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #D4AF37; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .badge { background: #D4AF37; color: #000; padding: 5px 15px; border-radius: 20px; display: inline-block; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✨ Nubia Aura</h1>
              <p style="margin: 10px 0 0 0;">Commande Sur-Mesure</p>
            </div>

            <div class="content">
              <h2 style="color: #D4AF37;">Bonjour ${data.name},</h2>
              
              <p>Nous avons bien reçu votre demande de création sur-mesure ! 🎉</p>

              <p style="text-align: center;">
                <span class="badge">Référence : ${data.reference}</span>
              </p>

              <div class="info-box">
                <h3 style="color: #D4AF37; margin-top: 0;">Détails de votre commande</h3>
                <p><strong>Type de vêtement :</strong> ${data.type}</p>
                <p><strong>Budget estimé :</strong> ${data.budget.toLocaleString('fr-FR')} FCFA</p>
                <p><strong>Mesures :</strong><br>${data.measurements}</p>
                <p><strong>Préférences :</strong><br>${data.preferences}</p>
              </div>

              <div class="info-box" style="background: #fff3cd; border-left-color: #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">📞 Prochaines étapes</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Notre équipe va étudier votre demande</li>
                  <li>Nous vous contacterons sous 24-48h pour discuter des détails</li>
                  <li>Validation du design et des matériaux</li>
                  <li>Création de votre pièce unique</li>
                  <li>Livraison (délai estimé : 2-4 semaines)</li>
                </ol>
              </div>

              <p>Notre équipe de créateurs est impatiente de donner vie à votre vision ! 💫</p>

              <p>Pour toute question :</p>
              <ul>
                <li>📧 Email : supports@nubiaaura.com</li>
                <li>📱 WhatsApp : +221 77 143 01 37</li>
              </ul>

              <p>Cordialement,</p>
              <p style="color: #D4AF37; font-weight: bold;">L'équipe Nubia Aura</p>
            </div>

            <div class="footer">
              <p>© 2025 Nubia Aura. Tous droits réservés.</p>
              <p>Dakar, Sénégal</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Email de notification au manager (Commande Sur-mesure)
 */
export function getCustomOrderManagerNotification(data: CustomOrderEmailData) {
  return {
    subject: `🎨 Nouvelle commande sur-mesure - ${data.type} - ${data.budget.toLocaleString('fr-FR')} FCFA`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #D4AF37; color: #000; padding: 15px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .info-box { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .badge { background: #000; color: #D4AF37; padding: 5px 15px; border-radius: 20px; display: inline-block; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🎨 Nouvelle Commande Sur-Mesure</h2>
            </div>

            <div class="content">
              <p style="text-align: center;">
                <span class="badge">Réf: ${data.reference}</span>
              </p>

              <div class="info-box">
                <h3>Informations Client</h3>
                <p><strong>Nom :</strong> ${data.name}</p>
                <p><strong>Email :</strong> ${data.email}</p>
                <p><strong>Téléphone :</strong> ${data.phone}</p>
              </div>

              <div class="info-box">
                <h3>Détails de la Commande</h3>
                <p><strong>Type :</strong> ${data.type}</p>
                <p><strong>Budget :</strong> ${data.budget.toLocaleString('fr-FR')} FCFA</p>
                <p><strong>Mesures :</strong><br>${data.measurements}</p>
                <p><strong>Préférences :</strong><br>${data.preferences}</p>
              </div>

              <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                ⚡ <strong>Action requise :</strong> Contactez le client sous 24-48h pour discuter du projet.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Données pour l'email de mise à jour de livraison
 */
export interface ShippingUpdateEmailData {
  customerName: string;
  orderNumber: string;
  status: 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

/**
 * Email de mise à jour du statut de livraison
 */
export function getShippingUpdateEmail(data: ShippingUpdateEmailData) {
  const statusConfig = {
    processing: {
      emoji: '📦',
      title: 'Votre commande est en préparation',
      message: 'Notre équipe prépare votre commande avec soin. Vous recevrez une notification dès qu\'elle sera expédiée.',
      color: '#ffc107',
      bgColor: '#fff3cd',
    },
    shipped: {
      emoji: '🚚',
      title: 'Votre commande est en route !',
      message: 'Votre colis a été expédié et est en chemin vers vous.',
      color: '#17a2b8',
      bgColor: '#d1ecf1',
    },
    delivered: {
      emoji: '✅',
      title: 'Votre commande a été livrée !',
      message: 'Nous espérons que vous apprécierez vos achats. N\'hésitez pas à nous laisser un avis !',
      color: '#28a745',
      bgColor: '#d4edda',
    },
  };

  const config = statusConfig[data.status];

  return {
    subject: `${config.emoji} ${config.title} - Commande ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
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
            .status-box { 
              background: ${config.bgColor}; 
              border-left: 4px solid ${config.color}; 
              padding: 20px; 
              border-radius: 5px; 
              margin: 20px 0; 
              text-align: center;
            }
            .status-emoji { font-size: 48px; }
            .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
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
            .tracking-box {
              background: #f0f0f0;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              text-align: center;
              font-family: monospace;
              font-size: 18px;
              letter-spacing: 2px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✨ Nubia Aura</h1>
              <p style="margin: 10px 0 0 0;">Mise à jour de votre commande</p>
            </div>

            <div class="content">
              <h2 style="color: #D4AF37;">Bonjour ${data.customerName},</h2>
              
              <div class="status-box">
                <div class="status-emoji">${config.emoji}</div>
                <h3 style="color: ${config.color}; margin: 10px 0;">${config.title}</h3>
                <p style="margin: 0;">${config.message}</p>
              </div>

              <div class="info-box">
                <p><strong>Numéro de commande :</strong> ${data.orderNumber}</p>
                ${data.trackingNumber ? `
                  <p><strong>Transporteur :</strong> ${data.carrier || 'Nubia Express'}</p>
                  <div class="tracking-box">
                    ${data.trackingNumber}
                  </div>
                ` : ''}
                ${data.estimatedDelivery ? `
                  <p><strong>Livraison estimée :</strong> ${data.estimatedDelivery}</p>
                ` : ''}
                ${data.deliveredAt ? `
                  <p><strong>Livré le :</strong> ${data.deliveredAt}</p>
                ` : ''}
              </div>

              ${data.status === 'delivered' ? `
                <center>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nubiaaura.com'}/fr/commandes" class="button">
                    Voir mes commandes
                  </a>
                </center>
                <p style="text-align: center; color: #666;">
                  Vous avez 14 jours pour initier un retour si nécessaire.
                </p>
              ` : `
                <center>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nubiaaura.com'}/fr/commandes" class="button">
                    Suivre ma commande
                  </a>
                </center>
              `}

              <p>Pour toute question :</p>
              <ul>
                <li>📧 Email : supports@nubiaaura.com</li>
                <li>📱 WhatsApp : +221 77 143 01 37</li>
              </ul>

              <p>Cordialement,</p>
              <p style="color: #D4AF37; font-weight: bold;">L'équipe Nubia Aura</p>
            </div>

            <div class="footer">
              <p>© 2025 Nubia Aura. Tous droits réservés.</p>
              <p>Dakar, Sénégal</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

