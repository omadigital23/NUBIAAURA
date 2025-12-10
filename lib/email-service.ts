/**
 * Email Service - Centralized email sending via SendGrid/Edge Function
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type EmailTemplate =
    | 'order-confirmation'
    | 'custom-order'
    | 'newsletter'
    | 'contact-response'
    | 'signup-confirmation'
    | 'magic-link'
    | 'password-reset'
    | 'email-change'
    | 'invite-user'
    | 'order-shipped'
    | 'order-delivered'
    | 'security-password-changed'
    | 'security-email-changed'
    | 'security-phone-changed'
    | 'security-identity-linked'
    | 'security-identity-unlinked'
    | 'security-mfa-added'
    | 'security-mfa-removed'
    | 'reauthentication'
    | 'custom';

interface SendEmailOptions {
    to: string;
    subject: string;
    template: EmailTemplate;
    data?: Record<string, any>;
    html?: string;
}

interface EmailResult {
    success: boolean;
    error?: string;
}

/**
 * Send an email using the Edge Function
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
        if (!SUPABASE_URL) {
            console.error('SUPABASE_URL not configured');
            return { success: false, error: 'Email service not configured' };
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/custom-email-sender`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(options),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Email sending failed:', error);
            return { success: false, error };
        }

        const result = await response.json();
        return { success: result.success };
    } catch (error: any) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
    email: string,
    orderData: {
        orderNumber: string;
        orderId: string;
        customerName: string;
        total: number;
        items: Array<{ name: string; quantity: number; price: number }>;
    }
): Promise<EmailResult> {
    return sendEmail({
        to: email,
        subject: `Confirmation de votre commande #${orderData.orderNumber}`,
        template: 'order-confirmation',
        data: orderData,
    });
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(
    email: string,
    orderData: {
        orderNumber: string;
        orderId: string;
        customerName: string;
        trackingNumber?: string;
    }
): Promise<EmailResult> {
    return sendEmail({
        to: email,
        subject: `Votre commande #${orderData.orderNumber} a été expédiée`,
        template: 'order-shipped',
        data: orderData,
    });
}

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(
    email: string,
    data: { name: string }
): Promise<EmailResult> {
    return sendEmail({
        to: email,
        subject: 'Bienvenue chez Nubia Aura !',
        template: 'signup-confirmation',
        data: { confirmationUrl: '', ...data },
    });
}

/**
 * Send newsletter subscription confirmation
 */
export async function sendNewsletterConfirmEmail(
    email: string,
    name?: string
): Promise<EmailResult> {
    return sendEmail({
        to: email,
        subject: 'Bienvenue dans la newsletter Nubia Aura',
        template: 'newsletter',
        data: { name: name || '' },
    });
}

/**
 * Send contact form response
 */
export async function sendContactResponseEmail(
    email: string,
    data: { name: string; subject: string }
): Promise<EmailResult> {
    return sendEmail({
        to: email,
        subject: 'Nous avons bien reçu votre message',
        template: 'contact-response',
        data,
    });
}

/**
 * Send custom order confirmation
 */
export async function sendCustomOrderEmail(
    email: string,
    data: { name: string; reference: string }
): Promise<EmailResult> {
    return sendEmail({
        to: email,
        subject: `Votre demande sur-mesure ${data.reference}`,
        template: 'custom-order',
        data,
    });
}
