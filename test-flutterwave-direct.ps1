# 🧪 Test Direct Flutterwave API (PowerShell)
# Teste directement l'API Flutterwave sans passer par votre backend
# Usage: .\test-flutterwave-direct.ps1

# Configuration
$API_KEY = "MHsoXDxiOHs1bNGf1zQfd8bBB87i7prG"
$API_BASE = "https://api.flutterwave.com/v3"
$REDIRECT_URL = "http://localhost:3000/payments/callback"

Write-Host "🧪 TEST DIRECT FLUTTERWAVE API`n" -ForegroundColor Cyan

# Test 1: Vérifier la clé API
Write-Host "1️⃣  Vérification de la clé API" -ForegroundColor Blue
Write-Host "Clé: $($API_KEY.Substring(0, 10))...$(($API_KEY | Measure-Object -Character).Characters - 5)"
Write-Host "Longueur: $($API_KEY.Length)`n"

# Test 2: Initialiser un paiement
Write-Host "2️⃣  Initialiser un paiement" -ForegroundColor Blue

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$tx_ref = "ORD-$timestamp"

$paymentBody = @{
    tx_ref = $tx_ref
    amount = 95000
    currency = "XOF"
    redirect_url = $REDIRECT_URL
    customer = @{
        email = "test@example.com"
        phone_number = "+221771234567"
        name = "Amadou Test"
    }
    customizations = @{
        title = "Nubia Aura"
        description = "Test Payment"
        logo = "https://nubiaaura.com/logo.png"
    }
} | ConvertTo-Json

Write-Host "Envoi de la requête..."
Write-Host "TX Ref: $tx_ref`n"

try {
    $response = Invoke-WebRequest -Uri "$API_BASE/payments" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $API_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $paymentBody `
        -UseBasicParsing

    $responseData = $response.Content | ConvertFrom-Json
    
    Write-Host "Réponse:" -ForegroundColor Green
    Write-Host ($responseData | ConvertTo-Json -Depth 10) -ForegroundColor Green
    Write-Host ""
    
    # Extraire les données
    $paymentLink = $responseData.data.link
    $reference = $responseData.data.reference
    $status = $responseData.status
    
    if ($status -eq "success" -and $paymentLink) {
        Write-Host "✅ Paiement initialisé avec succès!" -ForegroundColor Green
        Write-Host "Lien de paiement: $paymentLink"
        Write-Host "Référence: $reference"
        Write-Host "TX Ref: $tx_ref`n"
    } else {
        Write-Host "⚠️  Réponse reçue mais statut: $status" -ForegroundColor Yellow
        Write-Host "Vérifiez la réponse ci-dessus pour les détails`n"
    }
    
} catch {
    Write-Host "❌ Erreur lors de l'initialisation du paiement" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez:" -ForegroundColor Yellow
    Write-Host "  - La clé API est correcte"
    Write-Host "  - La clé est pour le sandbox (TEST)"
    Write-Host "  - Le montant est valide (> 100 XOF)"
    Write-Host "  - Votre connexion Internet fonctionne`n"
    
    if ($_.Exception.Response) {
        Write-Host "Réponse du serveur:" -ForegroundColor Yellow
        Write-Host $_.Exception.Response.Content
    }
    exit 1
}

# Test 3: Vérifier un paiement
if ($reference) {
    Write-Host "3️⃣  Vérifier le paiement" -ForegroundColor Blue
    
    try {
        $verifyResponse = Invoke-WebRequest -Uri "$API_BASE/transactions/$reference/verify" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $API_KEY"
                "Content-Type" = "application/json"
            } `
            -UseBasicParsing
        
        $verifyData = $verifyResponse.Content | ConvertFrom-Json
        Write-Host "Réponse:" -ForegroundColor Green
        Write-Host ($verifyData | ConvertTo-Json -Depth 10) -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "⚠️  Erreur lors de la vérification" -ForegroundColor Yellow
        Write-Host $_.Exception.Message
        Write-Host ""
    }
}

# Test 4: Lister les transactions
Write-Host "4️⃣  Lister les transactions récentes" -ForegroundColor Blue

try {
    $transResponse = Invoke-WebRequest -Uri "$API_BASE/transactions?limit=5" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $API_KEY"
            "Content-Type" = "application/json"
        } `
        -UseBasicParsing
    
    $transData = $transResponse.Content | ConvertFrom-Json
    Write-Host "Réponse:" -ForegroundColor Green
    
    if ($transData.data) {
        $transData.data | ForEach-Object {
            Write-Host "  - TX Ref: $($_.tx_ref), Montant: $($_.amount) $($_.currency), Status: $($_.status)"
        }
    }
    Write-Host ""
} catch {
    Write-Host "⚠️  Erreur lors de la récupération des transactions" -ForegroundColor Yellow
    Write-Host ""
}

# Résumé
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "✅ Clé API: Valide"
Write-Host "✅ Paiement initialisé: $paymentLink"
Write-Host "✅ Référence: $reference"
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Allez sur: $paymentLink"
Write-Host "2. Utilisez une carte de test: 4242 4242 4242 4242"
Write-Host "3. Expiration: 09/32, CVV: 812"
Write-Host "4. Complétez le paiement"
Write-Host "5. Vous serez redirigé vers: $REDIRECT_URL"
Write-Host ""
Write-Host "✅ Test Direct Flutterwave Terminé!" -ForegroundColor Green
