# Script de déploiement simplifié de la fonction Edge custom-email-sender

Write-Host "Deploiement de la fonction custom-email-sender..." -ForegroundColor Cyan

# Vérifier si la CLI Supabase est installée
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "La CLI Supabase n'est pas installee." -ForegroundColor Red
    Write-Host "Installation de la CLI Supabase..." -ForegroundColor Yellow
    
    npm install -g supabase
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Echec de l'installation de la CLI Supabase" -ForegroundColor Red
        Write-Host "Veuillez installer manuellement avec: npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "CLI Supabase installee avec succes" -ForegroundColor Green
}

# Vérifier si l'utilisateur est connecté
Write-Host "Verification de la connexion Supabase..." -ForegroundColor Cyan
$loginCheck = supabase projects list 2>&1 | Out-String

if ($loginCheck -like '*not logged in*' -or $loginCheck -like '*error*') {
    Write-Host "Connexion a Supabase..." -ForegroundColor Yellow
    supabase login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Echec de la connexion a Supabase" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Connecte a Supabase" -ForegroundColor Green

# Déployer la fonction
Write-Host "Deploiement de la fonction custom-email-sender..." -ForegroundColor Cyan
Write-Host ""
supabase functions deploy custom-email-sender --project-ref exjtjbciznzyyqrfctsc

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Fonction deployee avec succes ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL de la fonction:" -ForegroundColor Cyan
    Write-Host "https://exjtjbciznzyyqrfctsc.supabase.co/functions/v1/custom-email-sender" -ForegroundColor White
    Write-Host ""
    Write-Host "Verifiez le deploiement sur:" -ForegroundColor Cyan
    Write-Host "https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions" -ForegroundColor White
    Write-Host ""
    Write-Host "Testez l'envoi d'email avec:" -ForegroundColor Cyan
    Write-Host ".\test-email-function.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Echec du deploiement de la fonction" -ForegroundColor Red
    Write-Host "Essayez de deployer manuellement via le Dashboard Supabase" -ForegroundColor Yellow
    Write-Host "https://supabase.com/dashboard/project/exjtjbciznzyyqrfctsc/functions" -ForegroundColor White
    exit 1
}
