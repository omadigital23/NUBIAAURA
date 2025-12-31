/**
 * Security Notifications Service
 * Sends email notifications for security-sensitive account actions
 * Uses SMTP directly (Namecheap) - No Edge Functions
 */

import { sendEmailSMTP } from '@/lib/smtp-email';

export type SecurityEventType =
    | 'password_changed'
    | 'email_changed'
    | 'phone_changed'
    | 'identity_linked'
    | 'identity_unlinked'
    | 'mfa_added'
    | 'mfa_removed';

interface SecurityNotificationData {
    userEmail: string;
    userName?: string;
    eventType: SecurityEventType;
    timestamp?: Date;
    metadata?: {
        provider?: string;       // For identity events (google, facebook, etc.)
        mfaMethod?: string;      // For MFA events (totp, sms, etc.)
        newEmail?: string;       // For email change
        newPhone?: string;       // For phone change
        ipAddress?: string;      // IP address of the action
        userAgent?: string;      // Browser/device info
        location?: string;       // Approximate location
    };
}

const EVENT_SUBJECTS: Record<SecurityEventType, { fr: string; en: string }> = {
    password_changed: {
        fr: '🔒 Votre mot de passe a été modifié',
        en: '🔒 Your password has been changed',
    },
    email_changed: {
        fr: '📧 Votre adresse email a été modifiée',
        en: '📧 Your email address has been changed',
    },
    phone_changed: {
        fr: '📱 Votre numéro de téléphone a été modifié',
        en: '📱 Your phone number has been changed',
    },
    identity_linked: {
        fr: '🔗 Une nouvelle identité a été liée à votre compte',
        en: '🔗 A new identity has been linked to your account',
    },
    identity_unlinked: {
        fr: '🔓 Une identité a été retirée de votre compte',
        en: '🔓 An identity has been unlinked from your account',
    },
    mfa_added: {
        fr: '🛡️ L\'authentification à deux facteurs a été activée',
        en: '🛡️ Two-factor authentication has been enabled',
    },
    mfa_removed: {
        fr: '⚠️ L\'authentification à deux facteurs a été désactivée',
        en: '⚠️ Two-factor authentication has been disabled',
    },
};

const EVENT_MESSAGES: Record<SecurityEventType, { fr: string; en: string }> = {
    password_changed: {
        fr: 'Votre mot de passe a été modifié avec succès. Si vous n\'êtes pas à l\'origine de cette action, veuillez contacter notre support immédiatement.',
        en: 'Your password has been successfully changed. If you did not make this change, please contact our support immediately.',
    },
    email_changed: {
        fr: 'Votre adresse email a été modifiée. Si vous n\'êtes pas à l\'origine de cette action, veuillez contacter notre support immédiatement.',
        en: 'Your email address has been changed. If you did not make this change, please contact our support immediately.',
    },
    phone_changed: {
        fr: 'Votre numéro de téléphone a été modifié. Si vous n\'êtes pas à l\'origine de cette action, veuillez contacter notre support.',
        en: 'Your phone number has been changed. If you did not make this change, please contact our support.',
    },
    identity_linked: {
        fr: 'Une nouvelle méthode de connexion a été liée à votre compte.',
        en: 'A new sign-in method has been linked to your account.',
    },
    identity_unlinked: {
        fr: 'Une méthode de connexion a été retirée de votre compte.',
        en: 'A sign-in method has been removed from your account.',
    },
    mfa_added: {
        fr: 'L\'authentification à deux facteurs a été activée sur votre compte. Votre compte est maintenant plus sécurisé.',
        en: 'Two-factor authentication has been enabled on your account. Your account is now more secure.',
    },
    mfa_removed: {
        fr: 'L\'authentification à deux facteurs a été désactivée sur votre compte. Nous vous recommandons de la réactiver pour plus de sécurité.',
        en: 'Two-factor authentication has been disabled on your account. We recommend re-enabling it for better security.',
    },
};

/**
 * Generate security notification email HTML
 */
function generateSecurityEmailHtml(
    data: SecurityNotificationData,
    locale: 'fr' | 'en' = 'fr'
): string {
    const timestamp = data.timestamp || new Date();
    const formattedDate = timestamp.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const message = EVENT_MESSAGES[data.eventType][locale];
    const greeting = locale === 'fr' ? 'Bonjour' : 'Hello';
    const userName = data.userName || (locale === 'fr' ? 'Cher client' : 'Dear customer');
    const securityNote = locale === 'fr'
        ? 'Si vous n\'êtes pas à l\'origine de cette action, veuillez contacter notre support immédiatement.'
        : 'If you did not initiate this action, please contact our support immediately.';

    let metadataHtml = '';
    if (data.metadata) {
        if (data.metadata.newEmail) {
            metadataHtml += `<p><strong>${locale === 'fr' ? 'Nouvelle adresse' : 'New address'}:</strong> ${data.metadata.newEmail}</p>`;
        }
        if (data.metadata.newPhone) {
            metadataHtml += `<p><strong>${locale === 'fr' ? 'Nouveau numéro' : 'New number'}:</strong> ${data.metadata.newPhone}</p>`;
        }
        if (data.metadata.provider) {
            metadataHtml += `<p><strong>${locale === 'fr' ? 'Fournisseur' : 'Provider'}:</strong> ${data.metadata.provider}</p>`;
        }
        if (data.metadata.mfaMethod) {
            metadataHtml += `<p><strong>${locale === 'fr' ? 'Méthode' : 'Method'}:</strong> ${data.metadata.mfaMethod}</p>`;
        }
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #000000 0%, #D4AF37 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .security-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .details-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #D4AF37; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Nubia Aura</h1>
                    <p>${locale === 'fr' ? 'Alerte de Sécurité' : 'Security Alert'}</p>
                </div>
                <div class="content">
                    <p>${greeting} ${userName},</p>
                    <p>${message}</p>
                    <div class="details-box">
                        <h3 style="color: #D4AF37; margin-top: 0;">${locale === 'fr' ? 'Détails' : 'Details'}</h3>
                        <p><strong>${locale === 'fr' ? 'Date et heure' : 'Date and time'}:</strong> ${formattedDate}</p>
                        ${metadataHtml}
                    </div>
                    <div class="security-box">
                        <p style="margin: 0;"><strong>⚠️ ${securityNote}</strong></p>
                    </div>
                    <p>${locale === 'fr' ? 'Cordialement,' : 'Best regards,'}<br>L'équipe Nubia Aura</p>
                </div>
                <div class="footer">
                    <p>© 2025 Nubia Aura. ${locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
                    <p>Dakar, Sénégal</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Send security notification email via SMTP
 */
export async function sendSecurityNotification(
    data: SecurityNotificationData,
    locale: 'fr' | 'en' = 'fr'
): Promise<{ success: boolean; error?: string }> {
    try {
        const subject = EVENT_SUBJECTS[data.eventType][locale];
        const html = generateSecurityEmailHtml(data, locale);

        const result = await sendEmailSMTP({
            to: data.userEmail,
            subject,
            html,
        });

        if (result === 'skipped') {
            console.warn(`[Security] SMTP not configured - notification skipped: ${data.eventType}`);
            return { success: false, error: 'SMTP not configured' };
        }

        console.log(`[Security] Notification sent: ${data.eventType} to ${data.userEmail}`);
        return { success: true };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Security] Error sending notification:', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * Notify user about password change
 */
export async function notifyPasswordChanged(
    email: string,
    userName?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ success: boolean; error?: string }> {
    return sendSecurityNotification({
        userEmail: email,
        userName,
        eventType: 'password_changed',
        metadata,
    });
}

/**
 * Notify user about email change
 */
export async function notifyEmailChanged(
    oldEmail: string,
    newEmail: string,
    userName?: string
): Promise<{ success: boolean; error?: string }> {
    // Notify both old and new email
    const oldResult = await sendSecurityNotification({
        userEmail: oldEmail,
        userName,
        eventType: 'email_changed',
        metadata: { newEmail },
    });

    const newResult = await sendSecurityNotification({
        userEmail: newEmail,
        userName,
        eventType: 'email_changed',
        metadata: { newEmail },
    });

    return {
        success: oldResult.success && newResult.success,
        error: oldResult.error || newResult.error,
    };
}

/**
 * Notify user about phone change
 */
export async function notifyPhoneChanged(
    email: string,
    newPhone: string,
    userName?: string
): Promise<{ success: boolean; error?: string }> {
    return sendSecurityNotification({
        userEmail: email,
        userName,
        eventType: 'phone_changed',
        metadata: { newPhone },
    });
}

/**
 * Notify user about identity linked (OAuth provider)
 */
export async function notifyIdentityLinked(
    email: string,
    provider: string,
    userName?: string
): Promise<{ success: boolean; error?: string }> {
    return sendSecurityNotification({
        userEmail: email,
        userName,
        eventType: 'identity_linked',
        metadata: { provider },
    });
}

/**
 * Notify user about identity unlinked
 */
export async function notifyIdentityUnlinked(
    email: string,
    provider: string,
    userName?: string
): Promise<{ success: boolean; error?: string }> {
    return sendSecurityNotification({
        userEmail: email,
        userName,
        eventType: 'identity_unlinked',
        metadata: { provider },
    });
}

/**
 * Notify user about MFA enabled
 */
export async function notifyMfaAdded(
    email: string,
    mfaMethod: string,
    userName?: string
): Promise<{ success: boolean; error?: string }> {
    return sendSecurityNotification({
        userEmail: email,
        userName,
        eventType: 'mfa_added',
        metadata: { mfaMethod },
    });
}

/**
 * Notify user about MFA disabled
 */
export async function notifyMfaRemoved(
    email: string,
    mfaMethod: string,
    userName?: string
): Promise<{ success: boolean; error?: string }> {
    return sendSecurityNotification({
        userEmail: email,
        userName,
        eventType: 'mfa_removed',
        metadata: { mfaMethod },
    });
}
