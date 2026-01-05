# 🚀 Configuration Production Vercel - Guide Rapide

## Étape 1 : Prérequis

```bash
# 1. Générer les secrets
npm run security:generate-secrets

# 2. Sauvegarder la sortie (vous en aurez besoin)
```

## Étape 2 : Méthode Automatique (Recommandée)

```bash
# Lancer le script interactif
node scripts/configure-vercel-production.js
```

Le script va vous demander toutes les valeurs et générer les commandes à exécuter.

---

## Étape 3 : Méthode Manuelle

### Variables Admin (OBLIGATOIRES)

```bash
vercel env add ADMIN_USERNAME production
# Entrer: admin

vercel env add ADMIN_PASSWORD_HASH production
# Entrer: [hash généré par generate-secrets]

vercel env add ADMIN_SALT production  
# Entrer: [salt généré par generate-secrets]

vercel env add ADMIN_TOKEN_SECRET production
# Entrer: [secret 256 bits généré]
```

### Variables Supabase (OBLIGATOIRES)

Obtenir vos clés : https://app.supabase.com → Settings → API

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Entrer: https://xxx.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Entrer: [votre anon key]

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Entrer: [votre service role key]
```

### Variables Application (OBLIGATOIRES)

```bash
vercel env add NEXT_PUBLIC_APP_URL production
# Entrer: https://votre-domaine.com

vercel env add NODE_ENV production
# Entrer: production
```

### Variables 2FA (OPTIONNELLES)

```bash
# Si vous avez activé 2FA
vercel env add ADMIN_2FA_ENABLED production
# Entrer: true

vercel env add ADMIN_2FA_SECRET production
# Entrer: [secret généré par generate:2fa-secret]
```

### Variables Rate Limiting (RECOMMANDÉES)

Créer un compte : https://upstash.com/

```bash
vercel env add UPSTASH_REDIS_REST_URL production
# Entrer: https://xxx.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN production
# Entrer: [votre token]

vercel env add ENABLE_RATE_LIMITING production
# Entrer: true
```

### Variables Sentry (RECOMMANDÉES)

Créer un compte : https://sentry.io/

```bash
vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Entrer: https://xxx@sentry.io/123

vercel env add SENTRY_AUTH_TOKEN production
# Entrer: [votre auth token]
```

---

## Étape 4 : Vérification

```bash
# Lister toutes les variables
vercel env ls

# Vérifier qu'elles sont bien en "production"
```

---

## Étape 5 : Déploiement

```bash
# Build local (test)
npm run build

# Déployer en production
vercel --prod
```

---

## ✅ Checklist

- [ ] Secrets générés (`npm run security:generate-secrets`)
- [ ] 4 variables admin configurées
- [ ] 3 variables Supabase configurées  
- [ ] 2 variables app configurées
- [ ] Variables optionnelles configurées (si souhaité)
- [ ] `vercel env ls` affiche toutes les variables
- [ ] Build local réussit
- [ ] Déployé avec `vercel --prod`

---

## 🆘 En Cas de Problème

### Erreur : "You don't have access to this project"

```bash
# Se connecter à nouveau
vercel login

# Lier le projet
vercel link
```

### Erreur : Build échoue

```bash
# Vérifier localement
npm run build
npm run type-check

# Vérifier les logs
vercel logs
```

### Supprimer une variable

```bash
vercel env rm NOM_VARIABLE production
```

---

**Conseil** : Utilisez le script automatique pour gagner du temps ! 🚀
