# Guide de Déploiement Manuel - Edge Function custom-email-sender

## ⚠️ La CLI Supabase n'est pas disponible

L'installation de la CLI a échoué, mais ce n'est pas un problème ! 
Le déploiement via le Dashboard est plus simple et tout aussi efficace.

## 🎯 Déploiement via Dashboard (3 minutes)

### Étape 1: Ouvrir le Dashboard
Cliquez sur ce lien pour ouvrir directement la page des Edge Functions :
👉 https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions

### Étape 2: Créer la fonction
1. Cliquez sur le bouton **"Deploy a new function"** (ou "New Function")
2. Dans le formulaire :
   - **Function name**: `custom-email-sender`
   - Laissez les autres options par défaut

### Étape 3: Copier le code
1. Ouvrez ce fichier dans VS Code :
   📄 `supabase\functions\custom-email-sender\index.ts`

2. Sélectionnez TOUT le contenu (Ctrl+A)

3. Copiez (Ctrl+C)

### Étape 4: Coller et déployer
1. Dans le Dashboard Supabase, collez le code dans l'éditeur (Ctrl+V)

2. Cliquez sur le bouton **"Deploy"** en bas à droite

3. Attendez quelques secondes (vous verrez un indicateur de progression)

### Étape 5: Vérifier
✅ La fonction devrait apparaître dans la liste avec un statut "Active"
✅ L'URL sera : `https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender`

## 🧪 Tester la fonction

Une fois déployée, testez-la avec PowerShell :

```powershell
.\test-email-function.ps1 -ToEmail "votre-email@example.com"
```

Ou testez manuellement avec ce code PowerShell :

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

## 📋 Checklist

- [ ] Dashboard ouvert
- [ ] Fonction créée avec le nom `custom-email-sender`
- [ ] Code copié depuis `supabase\functions\custom-email-sender\index.ts`
- [ ] Code collé dans l'éditeur
- [ ] Fonction déployée (bouton "Deploy" cliqué)
- [ ] Statut "Active" visible
- [ ] Test d'envoi d'email effectué
- [ ] Email reçu dans la boîte de réception

## 🔍 En cas de problème

### La fonction ne se déploie pas
- Vérifiez qu'il n'y a pas d'erreurs de syntaxe dans l'éditeur
- Vérifiez que le nom est bien `custom-email-sender` (sans espaces)

### L'email n'est pas envoyé
- Vérifiez que le secret `SENDGRID_API_KEY` est bien configuré
- Allez dans Project Settings → Edge Functions → Secrets
- Vérifiez que la clé SendGrid est valide

### L'email tombe dans les spams
- Normal pour les premiers tests
- Vérifiez votre dossier spam/courrier indésirable

## 📞 Besoin d'aide ?

Si vous rencontrez des difficultés, dites-moi à quelle étape vous êtes bloqué !
