import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTPCode } from '@/lib/totp';
import { z } from 'zod';

const VerifySchema = z.object({
  code: z.string().length(6, 'Le code doit contenir 6 chiffres').regex(/^\d{6}$/, 'Le code doit être numérique'),
  secret: z.string().min(1, 'Secret requis'),
});

/**
 * POST /api/admin/2fa/verify
 * Verify a TOTP code during admin login or 2FA setup confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { code, secret } = parsed.data;
    const isValid = verifyTOTPCode(code, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré', valid: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Code vérifié avec succès',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('2FA verify error:', message);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
