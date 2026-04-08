import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-admin';
import { generateTOTPSecret } from '@/lib/totp';
import QRCode from 'qrcode';

/**
 * POST /api/admin/2fa/setup
 * Generate a TOTP secret and QR code for admin 2FA enrollment
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    // Get admin email from request body
    const body = await request.json();
    const adminEmail = body.email || 'admin@nubiaaura.com';

    // Generate TOTP secret
    const { secret, otpauthUrl } = generateTOTPSecret(adminEmail);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return NextResponse.json({
      success: true,
      secret, // Admin should store this securely for backup
      qrCode: qrCodeDataUrl,
      otpauthUrl,
      message: 'Scannez ce QR code avec Google Authenticator ou Authy',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('2FA setup error:', message);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
