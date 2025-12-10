# Guide: Obtenir l'URL de votre Edge Function Supabase

## 🎯 URL de votre fonction `custom-email-sender`

```
https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender
```

## 📋 Format général des URLs Edge Functions

Toutes vos Edge Functions Supabase suivent ce format:

```
https://<project-ref>.supabase.co/functions/v1/<function-name>
```

Pour votre projet:
- **Project Ref**: `exjtjbciznzyyqrfctsc`
- **Base URL**: `https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/`

## 🔍 Méthodes pour vérifier vos Edge Functions

### Méthode 1: Dashboard Supabase (Recommandé ✅)

1. Allez sur: [Dashboard Edge Functions](https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions)
2. Vous verrez la liste complète de vos fonctions déployées
3. Cliquez sur une fonction pour voir:
   - Son URL complète
   - Les logs d'exécution
   - Les métriques d'utilisation
   - La configuration

### Méthode 2: Test avec PowerShell

```powershell
# Test simple (GET request)
Invoke-WebRequest -Uri "https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender" -Method GET

# Test avec authentification
$headers = @{
    "Authorization" = "Bearer YOUR_ANON_KEY"
    "Content-Type" = "application/json"
}
Invoke-WebRequest -Uri "https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender" -Method POST -Headers $headers -Body '{"test": true}'
```

### Méthode 3: Installer la CLI Supabase

#### Installation via npm (Recommandé)

```powershell
# Installation globale
npm install -g supabase

# Vérifier l'installation
supabase --version

# Se connecter
supabase login

# Lister les fonctions déployées
supabase functions list --project-ref exjtjbciznzyyqrfctsc
```

#### Installation via Scoop (Alternative)

```powershell
# Installer Scoop si pas déjà fait
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Ajouter le bucket Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Installer Supabase CLI
scoop install supabase
```

## 📞 Appeler votre Edge Function depuis votre code

### Depuis Next.js (Client-side)

```typescript
import { supabase } from '@/lib/supabase';

async function callEdgeFunction() {
  const { data, error } = await supabase.functions.invoke('custom-email-sender', {
    body: {
      to: 'user@example.com',
      subject: 'Test Email',
      // ... autres paramètres
    }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Response:', data);
}
```

### Depuis une API Route (Server-side)

```typescript
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase.functions.invoke('custom-email-sender', {
    body: await request.json()
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
```

### Avec fetch (Alternative)

```typescript
const response = await fetch(
  'https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: 'user@example.com',
      subject: 'Test Email'
    })
  }
);

const data = await response.json();
```

## 🔐 Authentification

Les Edge Functions nécessitent une authentification. Vous pouvez utiliser:

1. **Anon Key** (pour les appels publics):
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Service Role Key** (pour les opérations admin):
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **User Token** (pour les opérations utilisateur):
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   const token = session?.access_token;
   ```

## 🛠️ Créer une nouvelle Edge Function

Si vous voulez créer la fonction `custom-email-sender`:

### 1. Structure du projet

```
supabase/
  functions/
    custom-email-sender/
      index.ts
```

### 2. Code de base

```typescript
// supabase/functions/custom-email-sender/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { to, subject, body } = await req.json()

    // Votre logique d'envoi d'email ici
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 3. Déployer

```powershell
# Avec la CLI installée
supabase functions deploy custom-email-sender --project-ref exjtjbciznzyyqrfctsc

# Ou via le Dashboard Supabase
# 1. Allez dans Edge Functions
# 2. Cliquez sur "New Function"
# 3. Collez votre code
# 4. Déployez
```

## 📊 Vérifier le statut d'une fonction

```powershell
# Via PowerShell
Invoke-WebRequest -Uri "https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender/health" -Method GET

# Réponse attendue si la fonction existe:
# Status: 200 OK

# Réponse si la fonction n'existe pas:
# Status: 404 Not Found
```

## 🔗 Liens utiles

- [Dashboard Edge Functions](https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions)
- [Documentation Edge Functions](https://supabase.com/docs/guides/functions)
- [Exemples Edge Functions](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
