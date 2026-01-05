# 🚀 Guide de Déploiement Production - NUBIA AURA

**Score de Sécurité** : 10/10 ✅  
**Date** : 5 janvier 2026

---

## 📋 Checklist Complète de Déploiement

### Phase 1 : Préparation Locale ✅

#### 1.1 Génération des Secrets de Production

```bash
# Générer tous les secrets nécessaires
npm run security:generate-secrets

# Sauvegarder la sortie dans un gestionnaire de mots de passe sécurisé (1Password, Bitwarden, etc.)
```

**Sortie attendue** :
- `ADMIN_TOKEN_SECRET` (256 bits)
- `ADMIN_SALT` (256 bits)
- `ADMIN_PASSWORD_HASH` (PBKDF2)
- `SESSION_SECRET` (optionnel)
- `ENCRYPTION_KEY` (optionnel)

#### 1.2 Vérification de la Configuration de Sécurité

```bash
# Vérifier que tout est correctement configuré
npm run security:verify
```

**Attendu** : ✅ Score 10/10, tous les tests passent

#### 1.3 Génération du Secret 2FA (Optionnel mais Recommandé)

```bash
# Générer le secret TOTP pour l'admin
npm run generate:2fa-secret
```

**Actions** :
1. Sauvegarder le secret Base32
2. Scanner le QR code avec Google Authenticator
3. Sauvegarder les 10 codes de récupération hors-ligne

---

### Phase 2 : Configuration Vercel 🔧

#### 2.1 Configuration des Variables d'Environnement

```bash
# ==========================================
# Admin Configuration (OBLIGATOIRE)
# ==========================================
vercel env add ADMIN_USERNAME production
# Valeur: votre_username_admin

vercel env add ADMIN_PASSWORD_HASH production
# Valeur: hash généré par generate-secrets.js

vercel env add ADMIN_SALT production
# Valeur: salt généré par generate-secrets.js

vercel env add ADMIN_TOKEN_SECRET production
# Valeur: secret 256 bits généré

# ==========================================
# 2FA Configuration (OPTIONNEL)
# ==========================================
vercel env add ADMIN_2FA_ENABLED production
# Valeur: true

vercel env add ADMIN_2FA_SECRET production
# Valeur: secret TOTP Base32 généré

# ==========================================
# Supabase (OBLIGATOIRE)
# ==========================================
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Valeur: https://votre-projet.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Valeur: votre_anon_key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Valeur: votre_service_role_key

# ==========================================
# Rate Limiting (RECOMMANDÉ)
# ==========================================
vercel env add UPSTASH_REDIS_REST_URL production
# Valeur: https://votre-redis.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN production
# Valeur: votre_upstash_token

vercel env add ENABLE_RATE_LIMITING production
# Valeur: true

# ==========================================
# Error Monitoring (RECOMMANDÉ)
# ==========================================
vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Valeur: https://votre-sentry-dsn@sentry.io/123

vercel env add SENTRY_AUTH_TOKEN production
# Valeur: votre_sentry_auth_token

# ==========================================
# Application Configuration
# ==========================================
vercel env add NEXT_PUBLIC_APP_URL production
# Valeur: https://votre-domaine.com

vercel env add NODE_ENV production
# Valeur: production
```

#### 2.2 Vérification des Variables

```bash
# Lister toutes les variables configurées
vercel env ls
```

**Vérifier que** :
- ✅ Toutes les variables obligatoires sont présentes
- ✅ Aucune variable de test/dev en production
- ✅ Les URLs utilisent HTTPS

---

### Phase 3 : Migration Supabase 🗄️

#### 3.1 Exécution de la Migration RLS

1. **Accéder à Supabase Dashboard**
   - Ouvrir : https://app.supabase.com
   - Sélectionner votre projet

2. **Exécuter la Migration SQL**
   - Aller dans : **SQL Editor**
   - Cliquer : **New query**
   - Copier le contenu de : `supabase/migrations/20260104_enable_rls_all_tables.sql`
   - Cliquer : **Run**

3. **Vérifier l'Activation RLS**

```sql
-- Vérifier que RLS est activée sur toutes les tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Attendu** : `rowsecurity = true` pour toutes les tables

#### 3.2 Vérification des Politiques RLS

```bash
# Dans Supabase Dashboard :
# Authentication > Policies
```

**Vérifier que les politiques existent pour** :
- ✅ users (2 politiques)
- ✅ products (1 politique)
- ✅ orders (2 politiques)
- ✅ cart_items (4 politiques)
- ✅ Et toutes les autres tables

---

### Phase 4 : Déploiement 🚀

#### 4.1 Build Local et Tests

```bash
# Vérifier que le build fonctionne
npm run build

# Exécuter les tests
npm run test

# Vérifier TypeScript
npm run type-check
```

**Tous les tests doivent passer** ✅

#### 4.2 Déploiement sur Vercel

```bash
# Déployer en production
vercel --prod
```

**Attendu** :
- ✅ Build réussit
- ✅ Déploiement effectué
- ✅ URL de production fournie

---

### Phase 5 : Vérification Post-Déploiement ✅

#### 5.1 Tests de Connexion Admin

1. **Accéder à la page admin**
   ```
   https://votre-domaine.com/admin/login
   ```

2. **Tester la connexion**
   - Entrer username et password
   - Si 2FA activé : entrer le code TOTP

3. **Vérifier le token JWT**
   - Ouvrir DevTools > Network
   - Vérifier que le token a le format : `xxx.yyy.zzz`

#### 5.2 Tests de Sécurité RLS

```bash
# Test 1: Vérifier isolation des commandes
# Se connecter avec un utilisateur normal
# Essayer d'accéder aux commandes d'un autre user
# → Devrait retourner 0 résultats ou 403

# Test 2: Vérifier protection des produits
# Essayer de modifier un produit sans admin token
# → Devrait retourner 401/403

# Test 3: Vérifier expiration du token
# Attendre 24h ou modifier manuellement la date d'expiration
# → Token devrait être rejeté
```

#### 5.3 Tests de Rate Limiting

```bash
# Tester le rate limiting admin
# Faire plus de 5 tentatives de connexion en 1 minute
# → Devrait retourner 429 (Too Many Requests)
```

#### 5.4 Tests de Monitoring

1. **Vérifier Sentry**
   - Ouvrir : https://sentry.io
   - Vérifier que les événements sont capturés

2. **Vérifier les Logs Vercel**
   ```bash
   vercel logs --follow
   ```

---

### Phase 6 : Planification de la Maintenance 📅

#### 6.1 Configurer les Rappels de Rotation

**Calendrier recommandé** :

| Action | Fréquence | Prochaine Date |
|--------|-----------|----------------|
| Rotation des secrets | 90 jours | 5 avril 2026 |
| Audit de sécurité | 30 jours | 5 février 2026 |
| Mise à jour dépendances | 14 jours | 19 janvier 2026 |
| Backup base de données | 7 jours | 12 janvier 2026 |

#### 6.2 Rotation des Secrets (Premier cycle à 90 jours)

```bash
# Dans 90 jours, exécuter :
npm run security:rotate-secrets

# Puis reconfigurer dans Vercel
# Et redéployer
```

---

### Phase 7 : Documentation et Formation 📚

#### 7.1 Documentation à Partager avec l'Équipe

- ✅ `SECURITY.md` - Vue d'ensemble de la sécurité
- ✅ `docs/ADMIN_2FA_GUIDE.md` - Guide 2FA
- ✅ `DEPLOYMENT_CHECKLIST.md` - Ce document

#### 7.2 Formation Admin

**Former les administrateurs sur** :
1. Comment se connecter avec 2FA
2. Où trouver les codes de récupération
3. Que faire en cas de perte de téléphone
4. Rotation des secrets tous les 90 jours

---

## 🚨 Procédure d'Urgence

### En Cas de Compromission de Secret

1. **Génération immédiate de nouveaux secrets**
   ```bash
   npm run security:generate-secrets
   ```

2. **Reconfiguration Vercel**
   ```bash
   vercel env rm ADMIN_TOKEN_SECRET production
   vercel env add ADMIN_TOKEN_SECRET production
   # (nouveau secret)
   ```

3. **Redéploiement d'urgence**
   ```bash
   vercel --prod
   ```

4. **Vérification**
   - Tester connexion admin
   - Vérifier logs d'erreurs

5. **Audit complet**
   ```bash
   npm run security:audit
   ```

---

## ✅ Checklist Finale

### Avant le Déploiement
- [ ] Secrets de production générés
- [ ] Configuration vérifiée (`npm run security:verify`)
- [ ] Variables Vercel configurées
- [ ] Migration RLS exécutée dans Supabase
- [ ] Build local réussit
- [ ] Tests passent

### Déploiement
- [ ] Déployé sur Vercel (`vercel --prod`)
- [ ] URL de production accessible
- [ ] HTTPS activé

### Après le Déploiement
- [ ] Connexion admin fonctionne
- [ ] JWT créé au bon format
- [ ] Token expire après 24h
- [ ] RLS activée sur toutes les tables
- [ ] Rate limiting fonctionne
- [ ] Sentry capture les erreurs
- [ ] Logs Vercel fonctionnent

### Maintenance
- [ ] Rappels de rotation configurés (90j)
- [ ] Documentation partagée avec l'équipe
- [ ] Admin formé sur 2FA
- [ ] Procédure d'urgence documentée

---

## 📊 Métriques de Succès

| Métrique | Cible | Vérification |
|----------|-------|--------------|
| Score de sécurité | 10/10 | `npm run security:verify` |
| Temps de réponse admin | < 500ms | Vercel Analytics |
| Taux d'erreur | < 0.1% | Sentry Dashboard |
| Uptime | > 99.9% | Vercel Status |
| Tests de sécurité | 100% passés | Checklist ci-dessus |

---

**🎯 OBJECTIF : SÉCURITÉ 10/10 MAINTENUE EN PRODUCTION**

*Dernière mise à jour : 5 janvier 2026*
*Score actuel : 10/10 ✅*
