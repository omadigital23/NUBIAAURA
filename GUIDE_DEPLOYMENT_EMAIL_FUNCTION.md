# Guide de Déploiement: Edge Function custom-email-sender

## 📋 Résumé

Edge Function créée pour envoyer des emails personnalisés via SendGrid avec 4 templates prédéfinis.

## 🎯 URL de la fonction

Une fois déployée, votre fonction sera accessible à:
```
https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender
```

## 🚀 Déploiement

### Option 1: Via le Dashboard Supabase (Recommandé)

1. **Allez sur le Dashboard**
   - [https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions](https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions)

2. **Créez la fonction**
   - Cliquez sur "New Function"
   - Nom: `custom-email-sender`
   - Copiez le contenu de `supabase/functions/custom-email-sender/index.ts`
   - Cliquez sur "Deploy"

3. **Ajoutez le secret SendGrid**
   - Allez dans Project Settings → Edge Functions
   - Cliquez sur "Add secret"
   - Nom: `SENDGRID_API_KEY`
   - Valeur: Votre clé API SendGrid
   - Cliquez sur "Save"

### Option 2: Via la CLI Supabase

```powershell
# 1. Installer la CLI (si pas déjà fait)
npm install -g supabase

# 2. Se connecter
supabase login

# 3. Ajouter le secret SendGrid
supabase secrets set SENDGRID_API_KEY=votre_cle_api_sendgrid --project-ref exjtjbciznzyyqrfctsc

# 4. Déployer la fonction
supabase functions deploy custom-email-sender --project-ref exjtjbciznzyyqrfctsc
```

## 🔑 Obtenir une clé API SendGrid

1. Allez sur [SendGrid](https://app.sendgrid.com)
2. Connectez-vous ou créez un compte
3. Allez dans **Settings** → **API Keys**
4. Cliquez sur **Create API Key**
5. Nom: "Nubia Aura Email Sender"
6. Permissions: **Full Access** ou **Restricted Access** avec "Mail Send"
7. Copiez la clé (elle ne sera affichée qu'une seule fois!)

## 📧 Templates disponibles

1. **order-confirmation** - Confirmation de commande
2. **custom-order** - Demande sur-mesure
3. **newsletter** - Inscription newsletter
4. **contact-response** - Réponse formulaire de contact
5. **custom** - HTML personnalisé

## 💻 Exemples d'utilisation

### Depuis une API Route Next.js

```typescript
// app/api/send-email/route.ts
export async function POST(request: Request) {
  const { to, subject, template, data } = await request.json();

  const response = await fetch(
    'https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, template, data })
    }
  );

  return Response.json(await response.json());
}
```

### Avec le client Supabase

```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.functions.invoke('custom-email-sender', {
  body: {
    to: 'customer@example.com',
    subject: '✨ Confirmation de commande',
    template: 'order-confirmation',
    data: {
      orderId: 'order-123',
      orderNumber: 'ORD-123456',
      customerName: 'John Doe',
      total: 25000,
      items: [
        { name: 'Produit 1', quantity: 2, price: 10000 },
        { name: 'Produit 2', quantity: 1, price: 5000 }
      ]
    }
  }
});
```

### Test avec PowerShell

```powershell
$body = @{
    to = "votre-email@example.com"
    subject = "Test Email Nubia Aura"
    template = "newsletter"
    data = @{
        name = "Test User"
    }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODg0NDUsImV4cCI6MjA3Nzc2NDQ0NX0.anl7O7hs784A5stzWKrAwMtb4pTJNwUaUMWkZiMo_tk"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender" -Method POST -Headers $headers -Body $body
```

## ✅ Vérification

1. **Vérifier le déploiement**
   - Allez dans le Dashboard Supabase → Edge Functions
   - La fonction `custom-email-sender` doit apparaître

2. **Tester l'envoi**
   - Utilisez l'exemple PowerShell ci-dessus
   - Remplacez `votre-email@example.com` par votre email
   - Vérifiez votre boîte de réception

3. **Consulter les logs**
   - Dashboard → Edge Functions → custom-email-sender → Logs
   - Vérifiez les messages de succès/erreur

## 🔧 Dépannage

### Erreur: "SENDGRID_API_KEY not configured"
**Solution**: Ajoutez le secret dans Supabase (voir section Déploiement)

### Erreur: "SendGrid API error: 401"
**Solution**: Vérifiez que votre clé API SendGrid est valide et a les bonnes permissions

### Emails tombent dans les spams
**Solution**: 
- Vérifiez votre domaine dans SendGrid
- Configurez SPF/DKIM pour votre domaine
- Utilisez un email "from" vérifié

### Fonction non trouvée (404)
**Solution**: Vérifiez que la fonction est bien déployée dans le Dashboard

## 📊 Limites

- **SendGrid gratuit**: 100 emails/jour
- **Taille max email**: 30 MB
- **Timeout fonction**: 60 secondes

## 🔗 Liens utiles

- [Dashboard Edge Functions](https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation SendGrid](https://docs.sendgrid.com)
- [Fichier de la fonction](file:///C:/Users/fallp/Music/si/NUBIA/supabase/functions/custom-email-sender/index.ts)
