@echo off
REM Test Direct Flutterwave API (Windows Batch)
REM Usage: test-flutterwave-curl.bat

setlocal enabledelayedexpansion

set API_KEY=MHsoXDxiOHs1bNGf1zQfd8bBB87i7prG
set API_BASE=https://api.flutterwave.com/v3
set REDIRECT_URL=http://localhost:3000/payments/callback

echo.
echo ========================================
echo Test Direct Flutterwave API
echo ========================================
echo.

REM Test 1: Initialiser un paiement
echo 1. Initialiser un paiement...
echo.

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set timestamp=%mydate%%mytime%

set tx_ref=ORD-%timestamp%

echo TX Ref: %tx_ref%
echo.

curl -X POST "%API_BASE%/payments" ^
  -H "Authorization: Bearer %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"tx_ref\": \"%tx_ref%\", \"amount\": 95000, \"currency\": \"XOF\", \"redirect_url\": \"%REDIRECT_URL%\", \"customer\": {\"email\": \"test@example.com\", \"phone_number\": \"+221771234567\", \"name\": \"Amadou Test\"}, \"customizations\": {\"title\": \"Nubia Aura\", \"description\": \"Test Payment\", \"logo\": \"https://nubiaaura.com/logo.png\"}}"

echo.
echo.
echo ========================================
echo Test Complete
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Copiez le lien de paiement de la reponse ci-dessus
echo 2. Allez sur le lien dans votre navigateur
echo 3. Utilisez la carte: 4242 4242 4242 4242
echo 4. Expiration: 09/32, CVV: 812
echo 5. Completez le paiement
echo.
pause
