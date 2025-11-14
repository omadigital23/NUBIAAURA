# 🌟 NUBIA AURA - E-commerce Platform

## 📋 Description

NUBIA AURA est une plateforme e-commerce moderne élégante spécialisée dans la vente de vêtements et d'accessoires de luxe. Construite avec Next.js 14, TypeScript, Tailwind CSS et Supabase.

## ✨ Fonctionnalités

### 🛒 Panier & Checkout
- **Gestion complète du panier** : Ajout, suppression, modification, vidage
- **Calcul en temps réel** : Prix, quantités, taxes
- **Stock reservations** : Gestion automatique des réservations de stock
- **Checkout multi-étapes** : Adresse, paiement, confirmation

### 📦 Gestion des Commandes
- **Historique des commandes** : Liste détaillée avec statuts
- **Détails de commande** : Articles, prix, suivi
- **Page de confirmation** : Résumé complet après paiement
- **Notifications** : Email et SMS confirmations

### 🎨 Interface Utilisateur
- **Design responsive** : Mobile-first approach
- **Thème élégant** : Couleurs NUBIA (or, noir, crème)
- **Typographie Playfair** : Style luxueux
- **Animations fluides** : Transitions et micro-interactions

### 🔐 Sécurité
- **Authentification Supabase** : JWT tokens sécurisés
- **Validation des entrées** : Zod schemas
- **Protection CSRF** : Tokens et validation
- **Variables d'environnement** : Aucun secret exposé

### 🌍 Internationalisation
- **Multi-langues** : Français/Anglais
- **URLs localisées** : `/fr/produit` et `/en/product`
- **Contenu adapté** : Textes et devises locales

## 🛠️ Stack Technique

### Frontend
- **Next.js 14** : App Router, Server Components
- **TypeScript** : Typage strict et complet
- **Tailwind CSS** : Design system personnalisé
- **Lucide React** : Icônes modernes
- **React Hook Form** : Formulaires optimisés

### Backend
- **Supabase** : Base de données PostgreSQL
- **Supabase Auth** : Authentification JWT
- **Supabase Storage** : Hébergement des images
- **API Routes** : RESTful endpoints

### Infrastructure
- **Vercel** : Déploiement et hébergement
- **Flutterwave** : Paiements sécurisés
- **Resend** : Emails transactionnels
- **Upstash Redis** : Cache et sessions

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### 1. Cloner le dépôt
```bash
git clone https://github.com/omadigital23/NUBIAAURA.git
cd NUBIAAURA
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env.local
```

Éditer `.env.local` avec vos clés :
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anonyme
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service

# Flutterwave (Paiements)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=votre_clé_publique
FLUTTERWAVE_SECRET_KEY=votre_clé_secrète
FLUTTERWAVE_ENCRYPTION_KEY=votre_clé_chiffrement

# Email (Resend)
RESEND_API_KEY=votre_clé_resend
RESEND_FROM_EMAIL=noreply@votredomaine.com

# SMS (Twilio - optionnel)
TWILIO_ACCOUNT_SID=votre_sid
TWILIO_AUTH_TOKEN=votre_token
TWILIO_PHONE_NUMBER=votre_numéro

# Redis (Upstash - optionnel)
UPSTASH_REDIS_REST_URL=votre_url_redis
UPSTASH_REDIS_REST_TOKEN=votre_token_redis
```

### 4. Configurer la base de données
```bash
# Exécuter les migrations
npm run setup:db

# Peupler les catégories
npm run setup:categories

# Importer les produits (optionnel)
npm run setup:products
```

### 5. Démarrer l'application
```bash
npm run dev
```

Visiter `http://localhost:3000` pour voir l'application.

## 📚 Scripts disponibles

### Développement
```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build pour production
npm run start        # Démarrer le serveur de production
npm run lint         # Linter le code
```

### Base de données
```bash
npm run setup:db           # Exécuter toutes les migrations
npm run setup:categories   # Créer les catégories
npm run setup:products     # Importer les produits
npm run cleanup:stock      # Nettoyer les réservations expirées
```

### Utilitaires
```bash
npm run generate:admin     # Générer un hash de mot de passe admin
npm run security:check     # Vérifier la sécurité des scripts
npm run test:cart          # Tester l'API panier
```

## 🏗️ Architecture du Projet

```
NUBIAAURA/
├── app/                    # Pages Next.js (App Router)
│   ├── [locale]/          # Pages localisées
│   ├── api/               # API routes
│   └── globals.css        # Styles globaux
├── components/            # Composants React
├── contexts/              # Contextes React
├── hooks/                 # Hooks personnalisés
├── lib/                   # Utilitaires et types
├── scripts/               # Scripts de setup
├── public/                # Fichiers statiques
└── types/                 # Types TypeScript
```

## 🔒 Sécurité

### Mesures implémentées
- ✅ **Aucun secret exposé** dans le code
- ✅ **Variables d'environnement** obligatoires
- ✅ **Validation des entrées** avec Zod
- ✅ **Protection CSRF** sur les formulaires
- ✅ **JWT tokens** pour l'authentification
- ✅ **Nettoyage automatique** des réservations

### Bonnes pratiques
- Utiliser des clés fortes et uniques
- Ne jamais committer `.env.local`
- Review du code avant chaque déploiement
- Surveillance des logs d'erreurs

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connecter le dépôt GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement sur chaque push

### Manuel
```bash
npm run build
npm run start
```

## 📊 Monitoring

### Logs et erreurs
- **Dashboard Supabase** : Logs de la base de données
- **Vercel Analytics** : Performance et erreurs
- **Console navigateur** : Erreurs frontend

### Métriques clés
- Taux de conversion
- Performance du panier
- Temps de chargement
- Erreurs de paiement

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonction`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonction'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonction`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence privée. Toute reproduction ou utilisation commerciale nécessite une autorisation explicite.

## 📞 Support

Pour toute question technique :
- **Email** : support@nubia-aura.com
- **Documentation** : Wiki du projet
- **Issues** : GitHub Issues

---

**NUBIA AURA** - L'élégance africaine meets modern technology ✨
