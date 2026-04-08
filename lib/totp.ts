/**
 * TOTP (Time-based One-Time Password) utilities for admin 2FA
 */
import { authenticator } from 'otplib';

// Configure TOTP settings
authenticator.options = {
  step: 30, // 30-second window
  digits: 6,
  window: 1, // Allow 1 step before/after for clock drift
};

/**
 * Generate a new TOTP secret for admin enrollment
 */
export function generateTOTPSecret(adminEmail: string): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(adminEmail, 'NubiaAura Admin', secret);

  return { secret, otpauthUrl };
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTPCode(code: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

/**
 * Generate a TOTP code (for testing purposes)
 */
export function generateTOTPCode(secret: string): string {
  return authenticator.generate(secret);
}
