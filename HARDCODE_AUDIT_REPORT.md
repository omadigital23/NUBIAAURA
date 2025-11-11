# 🔍 Rapport d'Audit des Hardcodes - Nubia Aura

**Date:** 12 novembre 2025  
**Status:** ✅ Audit Complet

---

## 📊 Résumé Exécutif

### ✅ Corrections Effectuées
- ❌ Numéros de téléphone WhatsApp (+212701193811) - **CORRIGÉ**
- ❌ URL Supabase hardcodée dans layout.tsx - **CORRIGÉ**
- ❌ Username admin dans placeholder - **CORRIGÉ**

### ⚠️ Hardcodes Critiques à Corriger IMMÉDIATEMENT

#### 🔴 CRITIQUE - Clés API et Credentials Exposées

**Fichiers contenant des secrets Supabase:**
1. `check-super100.js` - Service Role Key exposée
2. `fix-product-categories.js` - Service Role Key exposée
3. `fix-super100-category.js` - Service Role Key exposée
4. `fix-super100-data.js` - Service Role Key exposée
5. `run-migration.js` - Service Role Key exposée
6. `smart-fix-categories.js` - Service Role Key exposée
7. `update-product-translations.js` - Service Role Key exposée
8. `update-super100-image.js` - Service Role Key exposée
9. `scripts/diagnose-checkout.js` - Service Role Key exposée
10. `scripts/test-checkout-flow.js` - Service Role Key exposée (avec fallback)

**Clé exposée:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s`

**URL exposée:** `https://exjtjbciznzyyqrfctsc.supabase.co`

#### 🔴 CRITIQUE - Credentials Admin
**Fichier:** `test-admin-auth.js`
- Username: `Nubia_dca740c1`
- Password: `Nubia_0b2b065744aa1557_2024!`

---

## 🟡 Hardcodes Acceptables (Configuration/Test)

### URLs de Test (localhost)
Ces hardcodes sont acceptables car ils sont pour le développement local:
- `test-flutterwave-automated.ts` - `http://localhost:3000`
- `test-filters.js` - `http://localhost:3001`
- `test-checkout.js` - `http://localhost:3000` (avec fallback env)
- `test-api.js` - `http://localhost:3001`
- `e2e/payments.spec.ts` - `http://localhost:3000` (avec fallback env)
- `app/api/returns/route.ts` - `http://localhost:3000` (avec fallback env)
- `app/api/returns/[id]/route.ts` - `http://localhost:3000` (avec fallback env)

### Numéros de Téléphone de Test
**Fichier:** `test-checkout.js`
- `+212612345678` (Jean Dupont - test)
- `+212698765432` (Marie Martin - test)

**Fichier:** `lib/utils/format.ts`
- Formats de téléphone pour Sénégal (+221) et Maroc (+212) - **ACCEPTABLE** (logique de formatage)

### URLs Externes (APIs/Services)
- `lib/flutterwave.ts` - `https://api.flutterwave.com/v3` - **ACCEPTABLE** (URL API officielle)
- `lib/product-images.ts` - URLs Unsplash - **ACCEPTABLE** (images de démo)
- `scripts/setup-supabase.js` - URLs d'images Supabase - **ACCEPTABLE** (setup initial)

---

## 🎯 Actions Requises IMMÉDIATEMENT

### 1. ⚠️ RÉVOQUER LA CLÉ SUPABASE SERVICE ROLE
```bash
# Allez sur Supabase Dashboard
# Project Settings > API > Service Role Key
# Cliquez sur "Reset" pour générer une nouvelle clé
```

### 2. ⚠️ CHANGER LES CREDENTIALS ADMIN
```bash
node scripts/generate-admin-hash.js "nouveau_mot_de_passe_securise"
# Mettez à jour .env.local avec les nouvelles valeurs
```

### 3. 🗑️ SUPPRIMER ou SÉCURISER les Scripts
**Option A: Supprimer** (Recommandé si non utilisés)
```bash
rm check-super100.js
rm fix-product-categories.js
rm fix-super100-category.js
rm fix-super100-data.js
rm run-migration.js
rm smart-fix-categories.js
rm update-product-translations.js
rm update-super100-image.js
rm test-admin-auth.js
```

**Option B: Sécuriser** (Si encore nécessaires)
Modifier chaque script pour utiliser `process.env`:
```javascript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}
```

### 4. 📝 AJOUTER AU .gitignore
```
# Scripts de test avec données sensibles
test-admin-auth.js
*-test-credentials.js
```

---

## 📋 Checklist de Sécurité

- [x] Numéros de téléphone WhatsApp retirés
- [x] URL Supabase hardcodée dans layout retirée
- [x] Username admin dans placeholder retiré
- [ ] **Service Role Key Supabase révoquée et régénérée**
- [ ] **Credentials admin changés**
- [ ] **Scripts avec secrets supprimés ou sécurisés**
- [ ] **.gitignore mis à jour**
- [ ] **Audit de sécurité GitHub (vérifier l'historique Git)**

---

## 🔐 Bonnes Pratiques à Suivre

### ✅ À FAIRE
1. **Toujours** utiliser `process.env` pour les secrets
2. **Toujours** ajouter `.env.local` au `.gitignore`
3. **Toujours** utiliser `.env.example` pour documenter les variables requises
4. **Toujours** révoquer les clés exposées dans Git
5. **Toujours** utiliser des fallbacks sûrs (pas de secrets)

### ❌ À NE JAMAIS FAIRE
1. ❌ Hardcoder des clés API dans le code
2. ❌ Hardcoder des mots de passe
3. ❌ Hardcoder des URLs de production avec credentials
4. ❌ Committer des fichiers `.env.local`
5. ❌ Utiliser des secrets en clair dans les scripts

---

## 📞 Variables d'Environnement Requises

Vérifiez que votre `.env.local` contient:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD_HASH=your-hashed-password
ADMIN_SALT=your-salt

# WhatsApp
NEXT_PUBLIC_WHATSAPP_PHONE=+212701193811
MANAGER_WHATSAPP=+212701193811
CALLMEBOT_API_KEY=your-callmebot-key

# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key

# Email
SENDGRID_API_KEY=your-sendgrid-key
MANAGER_EMAIL=your-manager-email

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🎓 Conclusion

**Priorité CRITIQUE:** Les clés API Supabase et credentials admin doivent être révoqués et régénérés IMMÉDIATEMENT car ils sont exposés dans le code source et l'historique Git.

**Prochaines étapes:**
1. Révoquer la Service Role Key Supabase
2. Changer les credentials admin
3. Supprimer ou sécuriser les scripts de migration
4. Faire un audit de l'historique Git
5. Considérer l'utilisation de `git-secrets` ou `trufflehog` pour prévenir les futures expositions

---

**Généré par:** Cascade AI  
**Dernière mise à jour:** 12 novembre 2025
