/**
 * Service d'envoi d'emails via SMTP (Namecheap Private Email)
 * Configuration dans les variables d'environnement
 */

import nodemailer from 'nodemailer';

// Configuration SMTP depuis les variables d'environnement
const smtpConfig = {
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour autres ports
    auth: {
        user: process.env.SMTP_USER || 'supports@nubiaaura.com',
        pass: process.env.SMTP_PASSWORD || '',
    },
};

const fromEmail = process.env.SMTP_FROM_EMAIL || 'supports@nubiaaura.com';
const fromName = process.env.SMTP_FROM_NAME || 'Nubia Aura';

// Créer le transporteur
const transporter = nodemailer.createTransport(smtpConfig);

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Envoie un email via SMTP
 */
export async function sendEmailSMTP(options: EmailOptions): Promise<boolean> {
    try {
        // Vérifier si le mot de passe SMTP est configuré
        if (!smtpConfig.auth.pass) {
            console.warn('⚠️ SMTP password not configured - Email not sent:', options.subject);
            return false;
        }

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback texte brut
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email envoyé via SMTP:', info.messageId);
        return true;
    } catch (error: any) {
        console.error('❌ Erreur envoi email SMTP:', error);
        throw error;
    }
}

/**
 * Vérifie la connexion SMTP
 */
export async function verifySMTPConnection(): Promise<boolean> {
    try {
        await transporter.verify();
        console.log('✅ Connexion SMTP vérifiée');
        return true;
    } catch (error) {
        console.error('❌ Erreur connexion SMTP:', error);
        return false;
    }
}
