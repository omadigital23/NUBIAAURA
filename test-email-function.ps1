# Script de test de la fonction Edge custom-email-sender

param(
    [string]$ToEmail = "votre-email@example.com"
)

Write-Host "📧 Test de la fonction custom-email-sender..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$functionUrl = "https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODg0NDUsImV4cCI6MjA3Nzc2NDQ0NX0.anl7O7hs784A5stzWKrAwMtb4pTJNwUaUMWkZiMo_tk"

# Demander l'email si non fourni
if ($ToEmail -eq "votre-email@example.com") {
    $ToEmail = Read-Host "Entrez votre adresse email pour le test"
}

Write-Host "📬 Envoi d'un email de test à: $ToEmail" -ForegroundColor Yellow
Write-Host ""

# Préparer le payload
$body = @{
    to = $ToEmail
    subject = "🎉 Test Email - Nubia Aura"
    template = "newsletter"
    data = @{
        name = "Utilisateur Test"
    }
} | ConvertTo-Json

# Headers
$headers = @{
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}

try {
    # Envoyer la requête
    Write-Host "⏳ Envoi en cours..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $functionUrl -Method POST -Headers $headers -Body $body -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "✅ ✅ ✅ Email envoyé avec succès ! ✅ ✅ ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Réponse du serveur:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor White
    Write-Host ""
    Write-Host "📬 Vérifiez votre boîte de réception: $ToEmail" -ForegroundColor Yellow
    Write-Host "   (N'oubliez pas de vérifier les spams !)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'envoi de l'email" -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 Détails de l'erreur:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "📄 Réponse du serveur:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Vérifications à faire:" -ForegroundColor Cyan
    Write-Host "   1. La fonction est-elle déployée ?" -ForegroundColor White
    Write-Host "   2. Le secret SENDGRID_API_KEY est-il configuré ?" -ForegroundColor White
    Write-Host "   3. La clé API SendGrid est-elle valide ?" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Dashboard Supabase:" -ForegroundColor Cyan
    Write-Host "   https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

# Test avec template de confirmation de commande
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Test du template de confirmation de commande..." -ForegroundColor Cyan

$orderBody = @{
    to = $ToEmail
    subject = "✨ Confirmation de commande #TEST-12345"
    template = "order-confirmation"
    data = @{
        orderId = "test-order-123"
        orderNumber = "TEST-12345"
        customerName = "Utilisateur Test"
        total = 25000
        items = @(
            @{
                name = "Robe Africaine Élégante"
                quantity = 1
                price = 15000
            },
            @{
                name = "Accessoire Doré"
                quantity = 2
                price = 5000
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    Write-Host "⏳ Envoi en cours..." -ForegroundColor Cyan
    $response2 = Invoke-WebRequest -Uri $functionUrl -Method POST -Headers $headers -Body $orderBody -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ Email de confirmation de commande envoyé !" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'envoi du second email" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Tests terminés !" -ForegroundColor Green
Write-Host ""
Write-Host "📧 Vérifiez votre boîte email: $ToEmail" -ForegroundColor Cyan
Write-Host ""
