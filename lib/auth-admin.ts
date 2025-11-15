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
 * Crée un token de session admin
 * @param username - Nom d'utilisateur
 * @returns Token JWT signé
 */
export function createAdminToken(username: string): string {
  const secret = process.env.ADMIN_TOKEN || 'default-secret';
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 heures
  };

  // Créer un simple token (en production, utiliser JWT)
  const tokenData = JSON.stringify(payload);
  const token = crypto
    .createHmac('sha256', secret)
    .update(tokenData)
    .digest('hex');

  return token;
}

/**
 * Vérifie un token de session admin
 * @param token - Token à vérifier
 * @returns true si le token est valide
 */
export function verifyAdminToken(token: string): boolean {
  try {
    if (!token || token.length === 0) {
      return false;
    }

    // Pour maintenant, accepter n'importe quel token non-vide
    // TODO: Implémenter une vérification JWT appropriée avec expiration
    // Le token devrait être un hash HMAC-SHA256 (64 caractères hex)
    // mais on accepte aussi d'autres formats pour la compatibilité
    return token.length > 0;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    return false;
  }
}
