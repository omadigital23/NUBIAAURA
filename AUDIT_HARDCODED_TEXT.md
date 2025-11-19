# 🔍 AUDIT: TEXTE EN DUR (HARDCODED) - PROBLÈMES DÉTECTÉS

**Status:** ❌ **PLUSIEURS PROBLÈMES TROUVÉS**

---

## RÉSUMÉ DES PROBLÈMES

| Fichier | Ligne | Problème | Sévérité | Type |
|---------|-------|---------|----------|------|
| `app/catalogue/page.tsx` | 84 | Placeholder hardcodé FR | 🟠 Moyen | Placer holder |
| `app/catalogue/[category]/page.tsx` | 100 | Placeholder hardcodé FR | 🟠 Moyen | Placeholder |
| `app/[locale]/admin/page.tsx` | 55 | "Admin Dashboard" en dur | 🔴 Critique | Titre |
| `app/[locale]/admin/page.tsx` | 56 | "Connecté en tant que:" en dur | 🔴 Critique | Texte |
| `app/[locale]/admin/page.tsx` | 62 | "Déconnexion" en dur | 🟠 Moyen | Bouton |
| `app/[locale]/admin/orders/page.tsx` | 949 | "Sélectionner un transporteur" en dur | 🟠 Moyen | Option |
| `app/client/profile/page.tsx` | 238 | "Déconnexion" en dur | 🟠 Moyen | Bouton |
| `app/client/dashboard/page.tsx` | 151 | "Déconnexion" en dur | 🟠 Moyen | Bouton |
| `components/AuthModal.tsx` | 178+ | "Connexion..." / "Se connecter" en dur | 🟠 Moyen | Bouton/Loading |
| `app/[locale]/client/settings/page.tsx` | 176+ | "Enregistrement..." / "Enregistrer les modifications" en dur | 🟠 Moyen | Bouton |
| `app/[locale]/client/settings/page.tsx` | 185 | "Sécurité" en dur | 🟠 Moyen | Titre |

---

## DÉTAILS DES PROBLÈMES

### 1. `app/catalogue/page.tsx` (Ligne 84)
**Problème:** Placeholder hardcodé en FR
```tsx
// ❌ MAUVAIS
placeholder="Rechercher un produit..."

// ✅ BON
placeholder={t('catalog.search_placeholder', 'Rechercher un produit...')}
```
**Traduction manquante:** `catalog.search_placeholder`

---

### 2. `app/catalogue/[category]/page.tsx` (Ligne 100)
**Problème:** Même placeholder hardcodé
```tsx
// ❌ MAUVAIS
placeholder="Rechercher un produit..."

// ✅ BON
placeholder={t('catalog.search_placeholder', 'Rechercher un produit...')}
```

---

### 3. `app/[locale]/admin/page.tsx` (Lignes 55-62) - 🔴 CRITIQUE
**Problème:** Page admin ENTIÈREMENT en anglais/français dur
```tsx
// ❌ MAUVAIS (Ligne 55)
<h1 className="font-playfair text-3xl font-bold text-nubia-black">Admin Dashboard</h1>

// ❌ MAUVAIS (Ligne 56)
<p className="text-nubia-black/60 text-sm mt-1">Connecté en tant que: {username}</p>

// ❌ MAUVAIS (Ligne 62)
<button>
  Déconnexion
</button>

// ✅ BON
<h1>{t('admin.dashboard_title', 'Admin Dashboard')}</h1>
<p>{t('admin.logged_as', 'Connecté en tant que:')} {username}</p>
<button>{t('nav.logout', 'Déconnexion')}</button>
```

**Traductions manquantes:**
- `admin.dashboard_title`
- `admin.logged_as`

---

### 4. `app/[locale]/admin/orders/page.tsx` (Ligne 949)
**Problème:** Option du select hardcodée
```tsx
// ❌ MAUVAIS
<option value="">Sélectionner un transporteur</option>

// ✅ BON
<option value="">{t('orders.select_carrier', 'Sélectionner un transporteur')}</option>
```

**Traductions manquantes:**
- `orders.select_carrier`

---

### 5. `app/client/profile/page.tsx` (Ligne 238)
**Problème:** Texte de bouton hardcodé
```tsx
// ❌ MAUVAIS
Déconnexion

// ✅ BON
{t('nav.logout', 'Déconnexion')}
```

---

### 6. `app/client/dashboard/page.tsx` (Ligne 151)
**Problème:** Même problème
```tsx
// ❌ MAUVAIS
<LogOut size={14} /> Déconnexion

// ✅ BON
<LogOut size={14} /> {t('nav.logout', 'Déconnexion')}
```

---

### 7. `components/AuthModal.tsx` (Ligne 178+)
**Problème:** Textes de loading hardcodés
```tsx
// ❌ MAUVAIS (Ligne 185)
Connexion...

// ❌ MAUVAIS (Ligne 187)
Se connecter

// ✅ BON
{t('auth.logging_in', 'Connexion...')}
{t('auth.login_button', 'Se connecter')}
```

**Traductions manquantes:**
- `auth.logging_in`

---

### 8. `app/[locale]/client/settings/page.tsx` (Lignes 176+)
**Problème:** Boutons et titres hardcodés
```tsx
// ❌ MAUVAIS (Ligne 180)
Enregistrement...

// ❌ MAUVAIS (Ligne 184)
Enregistrer les modifications

// ❌ MAUVAIS (Ligne 190)
<h2>Sécurité</h2>

// ✅ BON
{t('common.saving', 'Enregistrement...')}
{t('common.save_changes', 'Enregistrer les modifications')}
{t('settings.security', 'Sécurité')}
```

**Traductions manquantes:**
- `common.saving`
- `common.save_changes`
- `settings.security`

---

## TRADUCTIONS À AJOUTER

Fichier: `locales/fr/common.json`
```json
{
  "admin.dashboard_title": "Admin Dashboard",
  "admin.logged_as": "Connecté en tant que:",
  "catalog.search_placeholder": "Rechercher un produit...",
  "orders.select_carrier": "Sélectionner un transporteur",
  "auth.logging_in": "Connexion...",
  "common.saving": "Enregistrement...",
  "common.save_changes": "Enregistrer les modifications",
  "settings.security": "Sécurité"
}
```

Fichier: `locales/en/common.json`
```json
{
  "admin.dashboard_title": "Admin Dashboard",
  "admin.logged_as": "Logged in as:",
  "catalog.search_placeholder": "Search for a product...",
  "orders.select_carrier": "Select a carrier",
  "auth.logging_in": "Logging in...",
  "common.saving": "Saving...",
  "common.save_changes": "Save Changes",
  "settings.security": "Security"
}
```

---

## RÉSUMÉ

✅ **Bien fait:** La plupart des pages respectent les translations
❌ **Problèmes trouvés:** 11 instances de texte en dur
🔴 **CRITIQUE:** Admin dashboard complètement en anglais/français dur

**Priorité:** 🔴 HAUTE - À corriger avant production

---

**Audit effectué:** November 19, 2025
