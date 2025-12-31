/**
 * Email Service - Centralized email sending via SMTP (Namecheap)
 * Re-exports from smtp-email.ts for backward compatibility
 * NO EDGE FUNCTIONS - Direct SMTP connection
 */

export {
    sendEmail,
    sendEmailSMTP,
    sendOrderConfirmationEmail,
    sendOrderShippedEmail,
    sendOrderDeliveredEmail,
    sendCustomOrderConfirmationEmail,
    notifyManagerEmail,
    verifySMTPConnection,
} from './smtp-email';

// Type exports for consumers
export type { EmailOptions } from './smtp-email';
