import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { CheckoutSchema } from '@/lib/checkout-validation';
import { createOrder, verifyStock } from '@/lib/order-service';
import { getTranslations, getTranslationKey } from '@/lib/i18n';
import { paymentRateLimit, getClientIdentifier, addRateLimitHeaders } from '@/lib/rate-limit-upstash';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '@/lib/sanitize';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (payment-level: strict)
    if (paymentRateLimit) {
      const identifier = getClientIdentifier(request);
      const { success, limit, remaining, reset } = await paymentRateLimit.limit(identifier);
      if (!success) {
        const response = NextResponse.json(
          { error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
          { status: 429 }
        );
        addRateLimitHeaders(response.headers, { limit, remaining, reset });
        return response;
      }
    }

    // Récupérer la locale
    const referer = request.headers.get('referer') || '';
    const path = (() => {
      try {
        return new URL(referer).pathname;
      } catch {
        return referer;
      }
    })();
    const locale: 'fr' | 'en' = (path.includes('/en') ? 'en' : 'fr') as 'fr' | 'en';
    const commonNs = await getTranslations(locale, 'common');

    // 1. Vérifier l'authentification
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: getTranslationKey(commonNs, 'common.error') || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: getTranslationKey(commonNs, 'common.error') || 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Valider et sanitiser les données
    const body = await request.json();

    // Sanitize shipping address fields
    if (body.shippingAddress) {
      body.shippingAddress.firstName = sanitizeText(body.shippingAddress.firstName || '');
      body.shippingAddress.lastName = sanitizeText(body.shippingAddress.lastName || '');
      body.shippingAddress.address = sanitizeText(body.shippingAddress.address || '');
      body.shippingAddress.city = sanitizeText(body.shippingAddress.city || '');
      body.shippingAddress.phone = sanitizePhone(body.shippingAddress.phone || '');
      if (body.shippingAddress.email) {
        body.shippingAddress.email = sanitizeEmail(body.shippingAddress.email);
      }
    }

    const validated = CheckoutSchema.safeParse(body);

    if (!validated.success) {
      const errorMessage = validated.error.errors[0]?.message || 'Invalid data';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // 3. Vérifier le stock
    try {
      await verifyStock(validated.data.items);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || getTranslationKey(commonNs, 'checkout.out_of_stock') || 'Out of stock' },
        { status: 400 }
      );
    }

    // 4. Créer la commande de manière atomique
    const order = await createOrder(user.id, validated.data);

    // 5. Retourner la commande créée
    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          created_at: order.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    Sentry.captureException(error, { tags: { route: 'checkout/create' } });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
