/**
 * Authentification Admin - Vérification sécurisée des identifiants
 * Utilise PBKDF2 pour le hashing et la vérification
 */

import crypto from 'crypto';

/**
 * Vérifie les identifiants admin
 * @param username - Nom d'utilisateur fourni
 * @param password - Mot de passe fourni
 * @returns true si les identifiants sont corrects
 */
export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const adminSalt = process.env.ADMIN_SALT;

  // Vérifier que les variables d'environnement sont définies
  if (!adminUsername || !adminPasswordHash || !adminSalt) {
    console.error('❌ Variables d\'environnement admin manquantes');
    return false;
  }

  // Vérifier le nom d'utilisateur
  if (username !== adminUsername) {
    console.warn(`⚠️  Tentative de connexion avec un mauvais username: ${username}`);
    return false;
  }

  // Vérifier le mot de passe
  try {
    const hash = crypto
      .pbkdf2Sync(password, adminSalt, 100000, 64, 'sha512')
      .toString('hex');

    if (hash !== adminPasswordHash) {
      console.warn(`⚠️  Tentative de connexion avec un mauvais mot de passe`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
}

/**
 * Génère un hash sécurisé pour un mot de passe
 * @param password - Mot de passe à hasher
 * @param salt - Salt (optionnel, généré si non fourni)
 * @returns Objet avec hash et salt
 */
export function generatePasswordHash(password: string, salt?: string) {
  const finalSalt = salt || crypto.randomBytes(32).toString('hex');

  const hash = crypto
    .pbkdf2Sync(password, finalSalt, 100000, 64, 'sha512')
    .toString('hex');

  return {
    hash,
    salt: finalSalt,
  };
}

/**
 * Interface pour le payload JWT
 */
interface JWTPayload {
  username: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID unique pour prévenir les replay attacks
}

/**
 * Crée un token JWT sécurisé pour l'admin
 * @param username - Nom d'utilisateur admin
 * @returns Token JWT signé avec HMAC-SHA256
 */
export function createAdminToken(username: string): string {
  const secret = process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_TOKEN;

  if (!secret || secret === 'default-secret') {
    throw new Error('ADMIN_TOKEN_SECRET must be configured with a strong secret');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    username,
    iat: now, // Issued at
    exp: now + 24 * 60 * 60, // Expire dans 24 heures
    jti: crypto.randomBytes(16).toString('hex'), // JWT ID unique
  };

  // Créer le header JWT
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Encoder en Base64URL
  const base64UrlEncode = (obj: object): string => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Créer la signature HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Retourner le JWT complet
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Vérifie et décode un token JWT admin
 * @param token - Token JWT à vérifier
 * @returns Payload du token si valide, null sinon
 */
function verifyAndDecodeJWT(token: string): JWTPayload | null {
  try {
    const secret = process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_TOKEN;

    if (!secret) {
      console.error('❌ ADMIN_TOKEN_SECRET not configured');
      return null;
    }

    // Séparer le token en ses parties
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('⚠️  Invalid JWT format (expected 3 parts)');
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Vérifier la signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) {
      console.warn('⚠️  Invalid JWT signature');
      return null;
    }

    // Décoder le payload
    const base64UrlDecode = (str: string): string => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf-8');
    };

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Vérifier l'expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('⚠️  JWT token expired');
      return null;
    }

    // Vérifier les champs requis
    if (!payload.username || !payload.iat || !payload.exp || !payload.jti) {
      console.warn('⚠️  JWT missing required fields');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('❌ JWT verification error:', error);
    return null;
  }
}

/**
 * Vérifie un token de session admin avec validation JWT complète
 * @param token - Token JWT à vérifier
 * @returns true si le token est valide et non expiré
 */
export function verifyAdminToken(token: string): boolean {
  try {
    if (!token || token.length === 0) {
      return false;
    }

    // Vérifier et décoder le JWT
    const payload = verifyAndDecodeJWT(token);

    if (!payload) {
      return false;
    }

    // Vérifier que le username correspond à l'admin configuré
    const adminUsername = process.env.ADMIN_USERNAME;
    if (adminUsername && payload.username !== adminUsername) {
      console.warn('⚠️  JWT username mismatch');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return false;
  }
}

/**
 * Extrait le username du token sans vérifier la validité
 * Utile pour les logs avant vérification complète
 * @param token - Token JWT
 * @returns Username ou null
 */
export function extractUsernameFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    return payload.username || null;
  } catch {
    return null;
  }
}
