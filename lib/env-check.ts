/**
 * Validation des variables d'environnement au démarrage serveur
 * Appelé depuis le layout server pour détecter les configs manquantes
 */

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
] as const;

const RECOMMENDED_ENV = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SENTRY_DSN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'MANAGER_WHATSAPP',
  'CALLMEBOT_API_KEY',
] as const;

let _checked = false;

export function validateEnv(): void {
  // Run only once per server lifecycle
  if (_checked) return;
  _checked = true;

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of RECOMMENDED_ENV) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n❌ [ENV] Variables d'environnement CRITIQUES manquantes:\n` +
      missing.map((k) => `   • ${k}`).join('\n') +
      `\n   → L'application risque de dysfonctionner.\n`
    );
  }

  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  [ENV] Variables d'environnement recommandées manquantes:\n` +
      warnings.map((k) => `   • ${k}`).join('\n') +
      `\n   → Certaines fonctionnalités pourraient être désactivées.\n`
    );
  }

  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ [ENV] Toutes les variables d\'environnement sont configurées.');
  }
}
