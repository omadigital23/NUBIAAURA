import axios from 'axios';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

interface PaymentPayload {
  tx_ref: string;
  amount: number;
  currency: string;
  email: string;
  phone_number: string;
  customer_name: string;
  redirect_url: string;
}

interface PaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
    [key: string]: any;
  };
}

interface VerificationResponse {
  status: string;
  message: string;
  data: {
    status: string;
    amount: number;
    currency: string;
    reference: string;
    tx_ref: string;
    [key: string]: any;
  };
}

/**
 * Initialize a payment with Flutterwave
 */
export async function initializePayment(payload: PaymentPayload): Promise<PaymentResponse> {
  try {
    if (!FLUTTERWAVE_KEY) {
      throw new Error('Clé API Flutterwave manquante (FLUTTERWAVE_SECRET_KEY)');
    }
    if (process.env.NODE_ENV !== 'production') {
      // Masked diagnostics to confirm server sees a key
      const masked = FLUTTERWAVE_KEY.length > 8 ? `${FLUTTERWAVE_KEY.slice(0, 6)}...${FLUTTERWAVE_KEY.slice(-2)}` : '***';
      // eslint-disable-next-line no-console
      console.log('[Flutterwave:init] key:', masked, 'len:', FLUTTERWAVE_KEY.length, 'env:', process.env.NODE_ENV);
    }
    
    console.log('[Flutterwave:init] Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post<PaymentResponse>(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      {
        tx_ref: payload.tx_ref,
        amount: payload.amount,
        currency: payload.currency,
        redirect_url: payload.redirect_url,
        customer: {
          email: payload.email,
          phone_number: payload.phone_number,
          name: payload.customer_name,
        },
        customizations: {
          title: 'Nubia Aura',
          description: 'Commande Nubia Aura',
          logo: 'https://nubiaaura.com/logo.png',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_KEY}`,
          'Content-Type': 'application/json',
        },
        // Prevent indefinite hanging
        timeout: 15000,
      }
    );

    // eslint-disable-next-line no-console
    console.log('[Flutterwave:init] Response:', response.data);
    return response.data;
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Flutterwave initialization error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      }
    });
    throw new Error(
      error.response?.data?.message || error.message || 'Erreur lors de l\'initialisation du paiement'
    );
  }
}

/**
 * Verify a payment with Flutterwave
 */
export async function verifyPayment(transactionId: string): Promise<VerificationResponse> {
  try {
    if (!FLUTTERWAVE_KEY) {
      throw new Error('Clé API Flutterwave manquante (FLUTTERWAVE_SECRET_KEY)');
    }
    if (process.env.NODE_ENV !== 'production') {
      const masked = FLUTTERWAVE_KEY.length > 8 ? `${FLUTTERWAVE_KEY.slice(0, 6)}...${FLUTTERWAVE_KEY.slice(-2)}` : '***';
      // eslint-disable-next-line no-console
      console.log('[Flutterwave:verify] key:', masked, 'len:', FLUTTERWAVE_KEY.length);
    }
    const response = await axios.get<VerificationResponse>(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_KEY}`,
        },
        // Prevent indefinite hanging
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Flutterwave verification error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Erreur lors de la vérification du paiement'
    );
  }
}

/**
 * Verify payment by transaction reference
 */
export async function verifyPaymentByReference(reference: string): Promise<VerificationResponse> {
  try {
    if (!FLUTTERWAVE_KEY) {
      throw new Error('Clé API Flutterwave manquante (FLUTTERWAVE_SECRET_KEY)');
    }
    if (process.env.NODE_ENV !== 'production') {
      const masked = FLUTTERWAVE_KEY.length > 8 ? `${FLUTTERWAVE_KEY.slice(0, 6)}...${FLUTTERWAVE_KEY.slice(-2)}` : '***';
      // eslint-disable-next-line no-console
      console.log('[Flutterwave:verify_by_ref] key:', masked, 'len:', FLUTTERWAVE_KEY.length);
    }
    const response = await axios.get<VerificationResponse>(
      `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?reference=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_KEY}`,
        },
        // Prevent indefinite hanging
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Flutterwave verification error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Erreur lors de la vérification du paiement'
    );
  }
}

/**
 * Check if payment was successful
 */
export function isPaymentSuccessful(data: VerificationResponse): boolean {
  return (
    data.status === 'success' &&
    data.data.status === 'successful'
  );
}

/**
 * Get payment status
 */
export function getPaymentStatus(data: VerificationResponse): string {
  return data.data.status;
}
