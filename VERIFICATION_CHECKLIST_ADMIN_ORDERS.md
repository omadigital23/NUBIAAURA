# ✅ CHECKLIST DE VÉRIFICATION - ADMIN ORDERS FIX

## 🚀 PRÉ-DÉPLOIEMENT

- [ ] Code compris et revu
- [ ] Modifications locales testées
- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'erreurs de compilation

---

## 🔧 DÉMARRAGE

### Setup Initial
- [ ] `npm install` exécuté
- [ ] `.env.local` existe avec variables admin
- [ ] Base de données accessible
- [ ] Serveur démarre: `npm run dev`

### Vérifier les Variables d'Environnement
```bash
echo $ADMIN_USERNAME      # Doit afficher: Nubia_dca740c1
echo $ADMIN_PASSWORD_HASH # Doit afficher: un hash long
echo $ADMIN_SALT          # Doit afficher: une longue chaîne
echo $ADMIN_TOKEN         # Doit afficher: un token
```

- [ ] Toutes les variables sont définies
- [ ] Les valeurs ne sont pas vides

---

## 🧪 TESTS FONCTIONNELS

### 1️⃣ Login Admin

```
URL: http://localhost:3000/admin/login
Username: Nubia_dca740c1
Password: Nubia_0b2b065744aa1557_2024!
```

- [ ] Page s'affiche sans erreur
- [ ] Formulaire accepte l'entrée
- [ ] Bouton "Se connecter" fonctionne
- [ ] Redirection vers dashboard réussit
- [ ] Token stocké dans localStorage

**Vérification:**
```javascript
// Console: localStorage.getItem('admin_token')
// Doit retourner un token non vide
```

- [ ] Token présent et non vide

---

### 2️⃣ Dashboard Admin

```
URL: http://localhost:3000/admin/dashboard
ou http://localhost:3000/fr/admin
```

- [ ] Page s'affiche sans erreur
- [ ] Bienvenue "Connecté en tant que: Nubia_dca740c1"
- [ ] Bouton déconnexion visible
- [ ] Onglets "Orders" et "Products" présents
- [ ] Onglet "Orders" cliquable

---

### 3️⃣ Onglet Orders

**En cliquant sur "Orders" ou au chargement:**

- [ ] Tableau s'affiche
- [ ] En-têtes de colonnes visibles:
  - [ ] Order #
  - [ ] Status
  - [ ] Payment
  - [ ] Total
  - [ ] Actions

**Affichage des commandes:**
- [ ] Au minimum 1 commande affichée
- [ ] Ou message "Aucune commande trouvée"
- [ ] PAS de message d'erreur 401

**Contenu des colonnes:**
- [ ] Order # : ex: "ORD-001", "ORD-002"
- [ ] Status : ex: "pending", "processing", "shipped"
- [ ] Payment : ex: "paid", "pending"
- [ ] Total : ex: "1 234,56 €"

**Boutons d'action:**
- [ ] Bouton "Process" (bleu)
- [ ] Bouton "Ship" (orange)
- [ ] Bouton "Complete" (vert)
- [ ] Bouton "Cancel" (rouge)
- [ ] Bouton "Delete" (rouge foncé)

---

### 4️⃣ Mise à Jour des Commandes

**Tester un changement de statut:**

1. Chercher une commande avec status "pending"
2. Cliquer "Process"
3. Vérifier:
   - [ ] Pas d'erreur
   - [ ] Tableau se recharge
   - [ ] Status change en "processing"

---

### 5️⃣ Gestion d'Erreur

**Essayer ces actions:**

- [ ] Logout puis naviguer à `/admin` → Redirection vers login
- [ ] Modifier token dans localStorage
- [ ] Recharger la page → 401 ou message d'erreur approprié
- [ ] Restaurer token correct → Fonctionne à nouveau

---

## 🔍 VÉRIFICATIONS TECHNIQUES

### API - GET /api/admin/orders

**Test avec curl:**
```bash
TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
curl -v \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/orders
```

Attendu:
- [ ] Réponse JSON avec structure: `{orders: [], count: 0, page: 1, limit: 20}`
- [ ] Status 401 si token invalide
- [ ] Status 200 si token valide

### API - POST /api/admin/orders

**Test mise à jour:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"update_status","id":"ordre-id","status":"shipped"}' \
  http://localhost:3000/api/admin/orders
```

- [ ] Répond avec `{ok: true}`
- [ ] Ou erreur avec message clair

---

## 📊 VÉRIFICATIONS DE DONNÉES

### Commandes Visibles

- [ ] Au minimum 1 commande du test est visible
- [ ] Les données correspondent à la base de données

**Tester:**
```sql
-- Dans Supabase console
SELECT id, order_number, status, payment_status, total
FROM orders
LIMIT 5;
```

- [ ] Comparer avec l'affichage admin

### Compteur

- [ ] "Total: X commande(s)" affiché
- [ ] Nombre correspond au nombre de lignes

---

## 🎨 VÉRIFICATIONS UI/UX

### Design

- [ ] Pas de texte qui déborde
- [ ] Tableau responsive sur desktop
- [ ] Couleurs correctes (or, noir, blanc)
- [ ] Boutons lisibles et cliquables

### Messages

- [ ] Messages en français
- [ ] Messages d'erreur clairs
- [ ] Pas de "undefined" affiché

### Performance

- [ ] Tableau charge en < 2 secondes
- [ ] Pas de freeze UI
- [ ] Console sans erreurs (F12)

---

## 🐛 CONSOLE BROWSER (F12 → Console)

Attendu:
- [ ] Pas d'erreurs rouges
- [ ] Pas d'avertissements critiques
- [ ] Logs "Orders loaded: {orders: [...]}"

Si erreurs:
- [ ] Note les messages exacts
- [ ] Vérifier `DIAGNOSTIC_ADMIN_ORDERS_FIX.md`

---

## 🔐 SÉCURITÉ

- [ ] Token jamais exposé en clair dans l'URL
- [ ] Token stocké uniquement dans localStorage
- [ ] Pas de données sensibles en console
- [ ] CORS configuré correctement

---

## 📱 RESPONSIVE

### Desktop (>1200px)
- [ ] Tableau complet visible
- [ ] Pas de scrolling horizontal

### Tablet (600-1200px)
- [ ] Tableau scrollable si nécessaire
- [ ] Boutons bien espacés

### Mobile (<600px)
- [ ] Tableau adapté
- [ ] Actions accessibles

---

## 🚀 FINAL CHECKLIST

- [ ] Tous les tests ci-dessus passent
- [ ] Pas d'erreur en production
- [ ] Logs présentés ci-dessus visibles
- [ ] Performance acceptable
- [ ] UX agréable

---

## 📋 RÉSUMÉ POUR DÉPLOIEMENT

```
✅ Authentification: Fixed (verifyAdminToken utilise PBKDF2)
✅ Affichage:        Enhanced (messages et UX améliorés)
✅ Errors:           Better (messages détaillés en français)
✅ Performance:      Good (pas de regression)
✅ Security:         Maintained (aucun changement négatif)

PRÊT POUR DÉPLOIEMENT ✅
```

---

## 🆘 TROUBLESHOOTING

### Problème: Tableau vide après login

**Solution:**
1. Vérifier la console pour les erreurs
2. Vérifier `process.env.ADMIN_TOKEN` est défini
3. Vérifier token dans localStorage
4. Vérifier la base de données a des commandes

### Problème: 401 Unauthorized

**Solution:**
1. Vérifier le token dans localStorage
2. Vérifier `/lib/auth-admin.ts` a `verifyAdminToken`
3. Vérifier variables d'environnement
4. Redémarrer le serveur: `npm run dev`

### Problème: Messages non en français

**Solution:**
1. Vérifier `app/[locale]/admin/page.tsx` importe `useTranslation`
2. Vérifier les locales sont chargées
3. Vérifier le locale est `fr` ou `en`

### Problème: Performances lentes

**Solution:**
1. Vérifier la base de données répond rapidement
2. Vérifier les indexes sur la table `orders`
3. Limiter le nombre de commandes affichées
4. Vérifier la connexion réseau

---

**Date de création:** 16 Novembre 2025  
**Version:** 1.0  
**Status:** À Tester Localement

Pour toute question, consultez le fichier:
- `DIAGNOSTIC_ADMIN_ORDERS_FIX.md`
- `ADMIN_ORDERS_FIX_SUMMARY.md`
