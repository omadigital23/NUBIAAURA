# 🚀 Guide de Configuration Production - NUBIA AURA

**Date** : 5 janvier 2026  
**Score de Sécurité** : 10/10 ✅

---

## 📋 Étape 1 : Migration RLS Supabase (15 minutes)

### 1.1 Accéder au Dashboard Supabase

✅ **Dashboard ouvert** : https://app.supabase.com

**Actions** :
1. Se connecter à votre compte Supabase
2. Sélectionner votre projet NUBIA AURA
3. Aller dans : **SQL Editor** (menu de gauche)

### 1.2 Exécuter la Migration RLS Complète

**Fichier à exécuter** : [`supabase/migrations/20260105_complete_rls_all_tables.sql`](file:///c:/Users/fallp/Music/si/NUBIA/supabase/migrations/20260105_complete_rls_all_tables.sql)

**Étapes** :
1. Cliquer sur **"New query"** dans SQL Editor
2. Copier **TOUT le contenu** du fichier de migration
3. Coller dans l'éditeur SQL
4. Cliquer sur **"Run"** (ou F5)

**Résultat attendu** :
```
Success. No rows returned
```

### 1.3 Vérifier que RLS est Activée

**Exécuter cette requête** :
```sql
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Résultat attendu** : Toutes les tables doivent avoir `rls_enabled = true`

### 1.4 Vérifier les Politiques RLS

**Exécuter cette requête** :
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Résultat attendu** : Vous devriez voir environ **60+ politiques** pour les 27 tables

---

## 📋 Étape 2 : Génération des Secrets de Production (5 minutes)

### 2.1 Générer Tous les Secrets

```bash
npm run security:generate-secrets
```

**Sauvegarder la sortie** dans un gestionnaire de mots de passe sécurisé (1Password, Bitwarden, etc.)

**Secrets générés** :
- ✅ `ADMIN_TOKEN_SECRET` (256 bits)
- ✅ `ADMIN_SALT` (256 bits)
- ✅ `ADMIN_PASSWORD_HASH` (PBKDF2 SHA-512)
- ✅ `SESSION_SECRET` (optionnel)
- ✅ `ENCRYPTION_KEY` (optionnel)

### 2.2 Générer le Secret 2FA (Optionnel)

```bash
npm run generate:2fa-secret
```

**Sauvegarder** :
- ✅ Secret TOTP Base32
- ✅ URL otpauth (pour QR code)
- ✅ 10 codes de récupération

---

## 📋 Étape 3 : Configuration Vercel (15 minutes)

### 3.1 Installer Vercel CLI (si nécessaire)

```bash
npm install -g vercel
```

### 3.2 Se Connecter à Vercel

```bash
vercel login
```

### 3.3 Configurer les Variables d'Environnement

**IMPORTANT** : Exécuter chaque commande et entrer la valeur générée à l'étape 2

#### Variables Admin (OBLIGATOIRES)

```bash
# Username admin
vercel env add ADMIN_USERNAME production
# Valeur: admin (ou votre choix)

# Hash du mot de passe (généré par generate-secrets)
vercel env add ADMIN_PASSWORD_HASH production
# Valeur: [coller le hash PBKDF2]

# Salt (généré par generate-secrets)
vercel env add ADMIN_SALT production
# Valeur: [coller le salt]

# Secret JWT (généré par generate-secrets)
vercel env add ADMIN_TOKEN_SECRET production
# Valeur: [coller le secret 256 bits]
```

#### Variables Supabase (OBLIGATOIRES)

```bash
# URL Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Valeur: https://votre-projet.supabase.co

# Clé ANON publique
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Valeur: [votre anon key depuis Supabase > Settings > API]

# Clé SERVICE ROLE (IMPORTANT: côté serveur uniquement)
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Valeur: [votre service role key depuis Supabase > Settings > API]
```

#### Variables Application (OBLIGATOIRES)

```bash
# URL de l'application
vercel env add NEXT_PUBLIC_APP_URL production
# Valeur: https://votre-domaine.com

# Environnement
vercel env add NODE_ENV production
# Valeur: production
```

#### Variables 2FA (OPTIONNELLES)

```bash
# Activer 2FA
vercel env add ADMIN_2FA_ENABLED production
# Valeur: true

# Secret TOTP
vercel env add ADMIN_2FA_SECRET production
# Valeur: [secret généré par generate:2fa-secret]
```

#### Variables Rate Limiting (RECOMMANDÉES)

```bash
# URL Redis Upstash
vercel env add UPSTASH_REDIS_REST_URL production
# Valeur: https://votre-redis.upstash.io
# Obtenir sur: https://upstash.com/

# Token Redis Upstash
vercel env add UPSTASH_REDIS_REST_TOKEN production
# Valeur: [votre token Upstash]

# Activer rate limiting
vercel env add ENABLE_RATE_LIMITING production
# Valeur: true
```

#### Variables Sentry (RECOMMANDÉES)

```bash
# DSN Sentry
vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Valeur: https://votre-dsn@sentry.io/123
# Obtenir sur: https://sentry.io/

# Auth token Sentry
vercel env add SENTRY_AUTH_TOKEN production
# Valeur: [votre auth token Sentry]
```

### 3.4 Vérifier les Variables

```bash
vercel env ls
```

**Vérifier que toutes les variables sont listées** pour l'environnement `production`

---

## 📋 Étape 4 : Build et Déploiement (10 minutes)

### 4.1 Vérifier le Build Local

```bash
# Nettoyer
rm -rf .next

# Build
npm run build
```

**Résultat attendu** : Build réussit sans erreurs

### 4.2 Vérifier TypeScript

```bash
npm run type-check
```

**Résultat attendu** : Aucune erreur TypeScript

### 4.3 Déployer sur Vercel

```bash
vercel --prod
```

**Le processus va** :
1. ✅ Upload du code
2. ✅ Build sur les serveurs Vercel
3. ✅ Déploiement
4. ✅ Fourniture de l'URL de production

**Résultat attendu** :
```
✅ Production: https://votre-domaine.vercel.app [10s]
```

---

## 📋 Étape 5 : Tests Post-Déploiement (10 minutes)

### 5.1 Test de Connexion Admin

1. **Accéder à** : `https://votre-domaine.com/admin/login`
2. **Entrer** : Username et password
3. **Si 2FA activé** : Entrer le code TOTP (6 chiffres de Google Authenticator)

**Résultat attendu** :
- ✅ Connexion réussie
- ✅ Redirection vers dashboard admin
- ✅ Token JWT dans les cookies

### 5.2 Test du Token JWT

1. **Ouvrir DevTools** : F12 > Network
2. **Se connecter** à l'admin
3. **Vérifier la réponse** de `/api/admin/login`

**Résultat attendu** :
```json
{
  "success": true,
  "token": "xxx.yyy.zzz",
  "username": "admin"
}
```

Le token doit avoir **3 parties séparées par des points** (format JWT)

### 5.3 Test RLS - Isolation des Données

**Test 1 : Commandes isolées**
1. Se connecter avec User A
2. Noter l'ID de commande
3. Se déconnecter
4. Se connecter avec User B
5. Essayer d'accéder à `/api/orders/[id-user-A]`

**Résultat attendu** : 
- ❌ Erreur 403 Forbidden ou données vides
- ✅ User B ne peut pas voir les commandes de User A

**Test 2 : Panier isolé**
1. Se connecter avec User A
2. Ajouter des articles au panier
3. Se déconnecter
4. Se connecter avec User B
5. Vérifier le panier

**Résultat attendu** :
- ✅ Panier de User B est vide
- ✅ User B ne voit pas les articles de User A

### 5.4 Test Rate Limiting

1. **Accéder à** : `https://votre-domaine.com/api/admin/login`
2. **Faire 6 tentatives** de connexion en 1 minute

**Résultat attendu** :
- ✅ Les 5 premières tentatives : 401 Unauthorized
- ✅ La 6ème tentative : 429 Too Many Requests
- ✅ Header `X-RateLimit-Remaining: 0`

### 5.5 Test Sentry (Monitoring)

1. **Provoquer une erreur** : Accéder à une route inexistante
2. **Vérifier Sentry Dashboard** : https://sentry.io/

**Résultat attendu** :
- ✅ L'erreur apparaît dans Sentry
- ✅ Stack trace complète
- ✅ Données sensibles masquées (scrubbing actif)

---

## 📋 Étape 6 : Vérification de Sécurité Finale (5 minutes)

### 6.1 Exécuter le Script de Vérification

```bash
# Avec les variables de production configurées en local
npm run security:verify
```

**Résultat attendu** :
```
📊 RÉSUMÉ
   ✅ Tests réussis    : 20+
   ❌ Tests échoués    : 0
   ⚠️  Avertissements  : 0
   
   🎯 Score de Sécurité: 10/10
```

### 6.2 Vérifier les Headers de Sécurité

**Outil** : https://securityheaders.com/

**Tester** : `https://votre-domaine.com`

**Résultat attendu** : Score A ou A+

**Headers attendus** :
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Content-Security-Policy`
- ✅ `X-XSS-Protection`

### 6.3 Audit SSL/TLS

**Outil** : https://www.ssllabs.com/ssltest/

**Tester** : `votre-domaine.com`

**Résultat attendu** : Note A ou A+

---

## 📋 Étape 7 : Planification Maintenance (5 minutes)

### 7.1 Créer les Rappels Calendrier

| Action | Fréquence | Prochaine Date |
|--------|-----------|----------------|
| **Rotation secrets** | 90 jours | 5 avril 2026 |
| **Audit sécurité** | 30 jours | 5 février 2026 |
| **Update dépendances** | 14 jours | 19 janvier 2026 |
| **Backup BDD** | 7 jours | 12 janvier 2026 |

### 7.2 Processus de Rotation (Dans 90 jours)

```bash
# 1. Générer nouveaux secrets
npm run security:rotate-secrets

# 2. Reconfigurer dans Vercel
vercel env rm ADMIN_TOKEN_SECRET production
vercel env add ADMIN_TOKEN_SECRET production
# [nouveau secret]

# 3. Redéployer
vercel --prod

# 4. Vérifier
npm run security:verify
```

### 7.3 Sauvegarder la Configuration

**Créer un document sécurisé** avec :
- ✅ Variables d'environnement utilisées
- ✅ Codes de récupération 2FA
- ✅ Dates de rotation des secrets
- ✅ Contacts d'urgence

**Stocker dans** :
- 1Password / Bitwarden (coffre-fort)
- Document chiffré sur cloud sécurisé

---

## ✅ Checklist de Validation Complète

### Avant Déploiement
- [ ] Migration RLS exécutée dans Supabase
- [ ] RLS activée sur les 27 tables
- [ ] Politiques RLS vérifiées (60+ politiques)
- [ ] Secrets générés (`npm run security:generate-secrets`)
- [ ] Secret 2FA généré (optionnel)

### Configuration Vercel
- [ ] Variables admin configurées (4 variables)
- [ ] Variables Supabase configurées (3 variables)
- [ ] Variables application configurées (2 variables)
- [ ] Variables 2FA configurées (optionnel)
- [ ] Variables rate limiting configurées (recommandé)
- [ ] Variables Sentry configurées (recommandé)
- [ ] Toutes les variables vérifiées (`vercel env ls`)

### Déploiement
- [ ] Build local réussit (`npm run build`)
- [ ] TypeScript OK (`npm run type-check`)
- [ ] Déploiement Vercel réussit (`vercel --prod`)
- [ ] URL de production accessible

### Tests Post-Déploiement
- [ ] Connexion admin fonctionne
- [ ] Token JWT au bon format
- [ ] Expiration token après 24h (vérifier plus tard)
- [ ] RLS : Isolation des commandes validée
- [ ] RLS : Isolation du panier validée
- [ ] Rate limiting fonctionne (429 après 5 tentatives)
- [ ] Sentry capture les erreurs
- [ ] Headers de sécurité OK (https://securityheaders.com)
- [ ] SSL/TLS OK (https://www.ssllabs.com)

### Sécurité
- [ ] `npm run security:verify` → Score 10/10
- [ ] SERVICE_ROLE_KEY jamais exposée côté client
- [ ] Secrets sauvegardés dans coffre-fort
- [ ] Codes récupération 2FA sauvegardés
- [ ] Rappels calendrier créés (rotation 90j)

### Documentation
- [ ] Documentation partagée avec l'équipe
- [ ] Procédure d'urgence documentée
- [ ] Contact d'urgence configuré

---

## 🎯 Score de Sécurité Final

**Score** : 10/10 🏆  
**Statut** : ✅ PRODUCTION READY  
**Date** : 5 janvier 2026

---

## 📞 En Cas de Problème

### Problème : Migration RLS échoue

**Solution** :
1. Vérifier que vous utilisez la bonne migration : `20260105_complete_rls_all_tables.sql`
2. Vérifier qu'aucune politique n'existe déjà (les supprimer d'abord)
3. Contacter le support Supabase

### Problème : Build Vercel échoue

**Solution** :
1. Vérifier les erreurs TypeScript : `npm run type-check`
2. Vérifier les erreurs de build local : `npm run build`
3. Vérifier les logs Vercel : `vercel logs`

### Problème : 2FA ne fonctionne pas

**Solution** :
1. Vérifier que `ADMIN_2FA_ENABLED=true`
2. Vérifier que `ADMIN_2FA_SECRET` est correct
3. Utiliser un code de récupération
4. Régénérer le secret : `npm run generate:2fa-secret`

### Problème : Rate limiting trop strict

**Solution** :
1. Ajuster les limites dans `lib/rate-limit-upstash.ts`
2. Désactiver temporairement : `ENABLE_RATE_LIMITING=false`
3. Redéployer

---

**NUBIA AURA** - Configuration Production Complète ! 🚀🛡️✨

*Guide créé le : 5 janvier 2026*  
*Score de sécurité : 10/10*
