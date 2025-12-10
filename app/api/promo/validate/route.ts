import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const ValidateSchema = z.object({
    code: z.string().min(1).max(50),
    orderAmount: z.number().positive(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = ValidateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { valid: false, error: 'Code promo invalide' },
                { status: 400 }
            );
        }

        const { code, orderAmount } = parsed.data;
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find the promo code
        const { data: promoCode, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .eq('is_active', true)
            .single();

        if (error || !promoCode) {
            return NextResponse.json(
                { valid: false, error: 'Code promo non trouvé ou inactif' },
                { status: 404 }
            );
        }

        // Check validity dates
        const now = new Date();
        if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
            return NextResponse.json(
                { valid: false, error: 'Ce code promo n\'est pas encore actif' },
                { status: 400 }
            );
        }

        if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
            return NextResponse.json(
                { valid: false, error: 'Ce code promo a expiré' },
                { status: 400 }
            );
        }

        // Check max uses
        if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
            return NextResponse.json(
                { valid: false, error: 'Ce code promo a atteint sa limite d\'utilisation' },
                { status: 400 }
            );
        }

        // Check minimum order amount
        if (promoCode.min_order_amount && orderAmount < promoCode.min_order_amount) {
            return NextResponse.json(
                {
                    valid: false,
                    error: `Montant minimum de ${promoCode.min_order_amount.toLocaleString('fr-FR')} FCFA requis`
                },
                { status: 400 }
            );
        }

        // Calculate discount
        let discountAmount: number;
        if (promoCode.discount_type === 'percentage') {
            discountAmount = Math.round(orderAmount * (promoCode.discount_value / 100));
            // Apply max discount cap if set
            if (promoCode.max_discount && discountAmount > promoCode.max_discount) {
                discountAmount = promoCode.max_discount;
            }
        } else {
            // Fixed discount
            discountAmount = promoCode.discount_value;
            // Can't discount more than order amount
            if (discountAmount > orderAmount) {
                discountAmount = orderAmount;
            }
        }

        return NextResponse.json({
            valid: true,
            code: promoCode.code,
            discountType: promoCode.discount_type,
            discountValue: promoCode.discount_value,
            discountAmount: discountAmount,
            description: promoCode.description,
            newTotal: Math.max(0, orderAmount - discountAmount),
        });

    } catch (error: any) {
        console.error('Promo validation error:', error);
        return NextResponse.json(
            { valid: false, error: 'Erreur lors de la validation' },
            { status: 500 }
        );
    }
}

