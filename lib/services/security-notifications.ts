/**
 * Security Notifications Service
 * Sends email notifications for security-sensitive account actions
 */

import { sendEmail } from '@/lib/email-service';

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

/**
 * Send security notification email
 */
export async function sendSecurityNotification(
    data: SecurityNotificationData,
    locale: 'fr' | 'en' = 'fr'
): Promise<{ success: boolean; error?: string }> {
    try {
        const subject = EVENT_SUBJECTS[data.eventType][locale];
        const timestamp = data.timestamp || new Date();

        const result = await sendEmail({
            to: data.userEmail,
            subject,
            template: `security-${data.eventType.replace('_', '-')}` as import('@/lib/email-service').EmailTemplate,
            data: {
                userName: data.userName || 'Cher client',
                eventType: data.eventType,
                timestamp: timestamp.toISOString(),
                formattedDate: timestamp.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                ...data.metadata,
                locale,
            },
        });

        if (result.success) {
            console.log(`[Security] Notification sent: ${data.eventType} to ${data.userEmail}`);
        } else {
            console.error(`[Security] Failed to send notification: ${result.error}`);
        }

        return result;
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
