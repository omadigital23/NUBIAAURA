# Test de la fonction rapid-worker (email sender)

param(
    [string]$ToEmail = "votre-email@example.com"
)

Write-Host "Test de la fonction rapid-worker (email sender)..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$functionUrl = "https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/rapid-worker"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODg0NDUsImV4cCI6MjA3Nzc2NDQ0NX0.anl7O7hs784A5stzWKrAwMtb4pTJNwUaUMWkZiMo_tk"

# Demander l'email si non fourni
if ($ToEmail -eq "votre-email@example.com") {
    $ToEmail = Read-Host "Entrez votre adresse email pour le test"
}

Write-Host "Envoi d'un email de test a: $ToEmail" -ForegroundColor Yellow
Write-Host ""

# Préparer le payload
$body = @{
    to = $ToEmail
    subject = "Test Email - Nubia Aura"
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
    Write-Host "Envoi en cours..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $functionUrl -Method POST -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host ""
    Write-Host "=== Email envoye avec succes ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Reponse du serveur:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor White
    Write-Host ""
    Write-Host "Verifiez votre boite de reception: $ToEmail" -ForegroundColor Yellow
    Write-Host "(N'oubliez pas de verifier les spams !)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "Erreur lors de l'envoi de l'email" -ForegroundColor Red
    Write-Host ""
    Write-Host "Details de l'erreur:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Reponse du serveur:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Verifications a faire:" -ForegroundColor Cyan
    Write-Host "1. La fonction est-elle deployee ?" -ForegroundColor White
    Write-Host "2. Le secret SENDGRID_API_KEY est-il configure ?" -ForegroundColor White
    Write-Host "3. La cle API SendGrid est-elle valide ?" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host "Test termine !" -ForegroundColor Green
